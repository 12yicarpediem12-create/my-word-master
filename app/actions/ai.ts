"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  normalizeNounGender,
  normalizeAiVocabResponse,
  type AiVocabError,
  type AiVocabNeedsHint,
  type AiVocabSuccess,
} from "@/app/lib/ai-vocab";
import { getSupabaseServerPublicClient } from "@/app/lib/supabase-server";

export type GenerateVocabInfoInput = {
  word: string;
  langCode: string;
  hint?: string;
  intendedPos?: string;
  intendedMeaning?: string;
  source?: "add" | "edit" | "import";
};

function getGeminiApiKey(): string {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || !apiKey.trim()) {
    throw new Error("AI is not configured. Set GEMINI_API_KEY in .env.local.");
  }
  return apiKey;
}

function toSafeAiErrorMessage(error: unknown): string {
  const raw = error instanceof Error ? error.message : "Unknown AI error";

  if (/GEMINI_API_KEY|API Key is missing|AI is not configured/i.test(raw)) {
    return "AI is not configured. Set GEMINI_API_KEY in .env.local.";
  }
  if (/API_KEY_INVALID|invalid api key|401|403/i.test(raw)) {
    return "AI request failed. Check GEMINI_API_KEY.";
  }
  if (/quota|rate limit|429/i.test(raw)) {
    return "AI is temporarily unavailable (rate limit/quota). Please try again.";
  }
  if (/empty response|unexpected response format/i.test(raw)) {
    return "AI returned an unexpected response. Please try again.";
  }
  return "AI request failed. Please try again.";
}

function toAiDebugDetail(error: unknown): string {
  if (error instanceof Error) {
    const trimmed = error.message.trim();
    if (trimmed) return trimmed;
  }
  return "Unknown AI error";
}

function parseAiJsonContent<T>(content: string): T | null {
  const trimmed = content.trim();
  const candidates = [
    trimmed,
    trimmed.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim(),
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;
    try {
      return JSON.parse(candidate) as T;
    } catch {
      const objectMatch = candidate.match(/\{[\s\S]*\}/);
      if (objectMatch) {
        try {
          return JSON.parse(objectMatch[0]) as T;
        } catch {
          // keep trying
        }
      }
    }
  }

  return null;
}

export async function generateVocabInfo(
  input: GenerateVocabInfoInput
): Promise<AiVocabSuccess | AiVocabNeedsHint | AiVocabError> {
  try {
    const word = input.word.trim();
    const langCode = input.langCode.trim();
    const hint = input.hint?.trim() || "";
    const intendedPos = input.intendedPos?.trim() || "";
    const intendedMeaning = input.intendedMeaning?.trim() || "";
    const source = input.source || "add";

    const apiKey = getGeminiApiKey();
    const genAI = new GoogleGenerativeAI(apiKey);
    const supabase = getSupabaseServerPublicClient();

    const { data: categories, error: dbError } = await supabase
      .from("categories")
      .select("id, full_path");

    if (dbError) throw new Error("Database error: " + dbError.message);

    const categoryListString = categories
      ?.map((c) => `[${c.id}] ${c.full_path}`)
      .join("\n") || "No categories found";
    const allowedCategoryIds = new Set((categories || []).map((category) => String(category.id)));

    const prompt = `
      You are a linguistic expert creating ONE precise vocabulary record for a study app.
      Analyze the following structured request.

      ### REQUEST
      - Surface word: "${word}"
      - Language code: "${langCode}"
      - Source: "${source}"
      - User hint: ${hint ? `"${hint}"` : "null"}
      - Intended part of speech: ${intendedPos ? `"${intendedPos}"` : "null"}
      - Intended meaning/use: ${intendedMeaning ? `"${intendedMeaning}"` : "null"}

      ### CRITICAL INSTRUCTIONS:
      0. THIS APP STORES EXACTLY ONE LEXICAL RECORD PER RESPONSE.
         - One response MUST correspond to exactly one part of speech and one central meaning/use.
         - NEVER combine noun/verb/adjective senses into one result.
         - NEVER return slash POS such as "Noun/Verb" or "Adjective/Noun".
         - NEVER write dictionary-style outputs that describe multiple POS or multiple unrelated uses.
      1. OBEY THE HINT ABSOLUTELY (IF PROVIDED):
         - If "User hint", "Intended part of speech", or "Intended meaning/use" is provided, you MUST restrict the entire output EXACTLY to that intended record.
         - Every field must align to the same intended POS/use: translation, example sentence, example translation, notes, category, and nuance.
         - DO NOT broaden beyond those signals, even if the spelling has other common uses.
      2. AMBIGUITY RULE:
         - If the spelling is genuinely ambiguous across multiple parts of speech or clearly different core uses, and the hint does NOT narrow it enough, DO NOT guess broadly.
         - Instead, return a structured ambiguity result with:
           {
             "status": "needs_hint",
             "reason": "ambiguous_part_of_speech",
             "candidates": ["Noun", "Verb"]
           }
         - In that case, do not include the normal lexical fields.
         - IMPORTANT: Do NOT return "needs_hint" for clear fixed expressions, common phrases, or everyday lexicalized entries that already have one obvious central use.
         - Do NOT return "needs_hint" for clear profession, role, or person nouns just because they have grammatical variation, common gender, or masculine/feminine reference.
         - Reserve "needs_hint" for real part-of-speech ambiguity or real central-meaning ambiguity, not for normal lexical variation inside one valid entry.
      2B. IMPORT-SPECIFIC ENRICHMENT PRIORITY:
         - If Source is "import" and the request already provides both "Intended part of speech" and "Intended meaning/use", treat the surface word plus those provided fields as the authoritative core lexical identity.
         - In that import path, DO NOT re-decide lexical identity unless there is a direct contradiction.
         - In that import path, your main job is to enrich the exact provided entry with support fields.
         - For import rows with authoritative core identity, prioritize filling these high-value support fields whenever a plausible and defensible answer exists:
           1. "gender" for nouns
           2. "root_word" for single-word entries
           3. "conjugation" for verbs
           4. "example_sentence"
           5. "example_translation"
         - For those high-value support fields, TRY HARD to fill them when the entry itself is already clear.
         - Do NOT leave those high-value support fields blank just because there is minor uncertainty.
         - If the entry is a clear noun, strongly prefer returning "gender" when it is a normal lexical property of the noun.
         - If the entry is a clear single-word item, strongly prefer returning a useful "root_word" when a plausible lexical root can be identified.
         - If the entry is a clear verb, strongly prefer returning "conjugation" rather than leaving it null.
         - If the entry is clear, strongly prefer returning both "example_sentence" and "example_translation" rather than leaving them blank.
         - For import rows, it is better to provide a plausible, defensible support-field answer for these high-value fields than to leave them empty by default.
         - In that import path, stay more conservative on lower-priority support fields:
           - "category_id"
           - "root_word" for phrases
           - weak extra notes beyond genuinely useful grammar support
      3. PART OF SPEECH (POS):
         - Return exactly one POS label only.
         - Use a single label such as "Noun", "Verb", "Adjective", "Adverb", "Expression", "Proper Noun", or another single POS phrase if needed.
         - IMPORTANT: If the noun sense is clear, return "Noun" even when the noun can refer to masculine or feminine people.
         - Common-gender nouns are still valid single noun records. Do NOT return "needs_hint" just because the noun may apply to male/female people.
         - Gender uncertainty is NOT the same as part-of-speech ambiguity. Reserve "needs_hint" for real POS ambiguity or real central-meaning/use ambiguity.
         - If an entry is a clear fixed phrase or expression with one obvious use, return a single phrase-level POS such as "Expression" instead of escalating to "needs_hint".
      4. CATEGORY SELECTION - CONSERVATIVE RULE:
         - Category is OPTIONAL.
         - Only return "category_id" when the lexical entry has one clear, high-confidence topic fit.
         - If the word could reasonably belong to multiple categories, return null.
         - If the category would be based mainly on loose association, geography, culture, or broad context rather than the entry's central meaning/use, return null.
         - Do not assign a category based only on country, nationality, language, or cultural association unless the entry's central meaning is explicitly and strongly about that topic.
         - In ambiguous cases, return null.
         - Prefer under-classification over wrong classification.
         - If returning a category, output ONLY the numerical ID (e.g., "45"). Otherwise return null.
      5. ETYMOLOGY (Shared Roots) - CONSERVATIVE RULE:
         - "root_word" is OPTIONAL.
         - Use "root_word" mainly for single-word entries.
         - If the entry is a single word, TRY to return a useful lexical root whenever a plausible and defensible root can be identified.
         - For single-word entries, prefer returning a meaningful "root_word" rather than leaving it blank.
         - For single-word entries, return null only when no useful or defensible root can be identified.
         - If the entry is a phrase, do NOT force a single shared "root_word" unless one lexical root clearly and naturally represents the whole entry.
         - In most phrase cases, return "root_word" as null.
         - If there is useful origin, literal sense, or key-word etymology for a phrase, put it in "notes" instead of forcing "root_word".
         - Prefer no "root_word" over a weak or artificial one.
         - For Romance languages (French, Italian, Spanish, Portuguese), trace the root back to "Latin" whenever possible.
         - DO NOT use micro-classifications like "Late Latin", "Vulgar Latin", "Medieval Latin", or "Post-Classical Latin". Group them all strictly as "(Latin)".
         - DO NOT trace back to "Proto-Indo-European" unless absolutely necessary. Stop at Latin, Proto-Germanic, Ancient Greek, or Arabic.
         - Format strictly as: "root_word (Language)" -> Example: "noctem (Latin)".
         - If unknown or not applicable, return null.
      6. NO ARTICLES IN WORD FIELD:
         - ALWAYS return the lemma only in the "word" field.
         - For nouns, DO NOT include any definite or indefinite article in "word".
         - Keep gender separate in the "gender" field.
         - Do not add articles for adjectives, verbs, or any other part of speech.
      7. ENGLISH TRANSLATION - STRICT RULES:
         - ALWAYS translate to ENGLISH.
         - DO NOT include English articles like "the", "a", or "an".
         - Return one central meaning/use only.
         - If the spelling has multiple unrelated meanings or POS and the intended one is unclear, use the ambiguity result instead of combining them.
      8. CONJUGATION: For verbs, start with "Present:". List pronouns and forms (e.g., "io parlo"). DO NOT include English translations here.
         🌟 IMPORTANT: Add ONE EMPTY LINE (\\n\\n) before "Past Participle:". If the word is NOT a verb, return null or empty string.
      9. NOTES FIELD - 🛑 SILENT CORRECTION RULE:
         - This is the general grammar/support field for the record.
         - For adjectives, put agreement or inflection guidance here instead of using "gender".
         - For verbs, provide exactly two lines -> Line 1: Group: [Pattern], Line 2: Tip: [Grammar tip].
         - 🛑 STRICT RULE: NEVER mention "typo", "spelling mistake", "misspelled", or correct the user explicitly anywhere in the output. If the user input contains a typo, SILENTLY fix it in the "word" field and provide normal grammar notes. DO NOT act like a teacher correcting a mistake.
      10. GENDER FIELD:
         - Return "gender" ONLY for noun records.
         - For adjectives, adverbs, verbs, expressions, and all non-noun records, return null for "gender".
         - If an adjective has masculine/feminine agreement or other inflection guidance, put that in "notes", not in "gender".
         - For clear noun entries, "gender" may be "Masculine", "Feminine", "Masculine/Feminine", or null.
         - A noun that can refer to masculine or feminine people is still a valid noun record and should not become "needs_hint" for that reason alone.

      ### AVAILABLE CATEGORY LIST:
      ${categoryListString}

      ### OUTPUT FORMAT (JSON ONLY):
      Return EXACTLY ONE of the following JSON shapes.

      Success shape:
      {
        "status": "ok",
        "word": "lemma only, never include articles",
        "translation": "English translation without articles",
        "part_of_speech": "e.g., Adjective",
        "gender": "Masculine/Feminine/Neuter for nouns only, otherwise null",
        "verb_type": "Transitive/Intransitive or null",
        "conjugation": "For verbs only: Present:\\nio parlo...\\n\\nPast Participle: parlato",
        "example_sentence": "Sentence in target language matching the specific POS/Meaning",
        "example_translation": "English translation",
        "category_id": "Selected ID number only when confidence is high, otherwise null",
        "root_word": "e.g., noctem (Latin) or null",
        "notes": "General grammar/support note. Use this for adjective agreement and verb pattern tips. NO typo warnings."
      }

      Ambiguity shape:
      {
        "status": "needs_hint",
        "reason": "ambiguous_part_of_speech",
        "candidates": ["Noun", "Verb"]
      }
    `;

    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash", 
      generationConfig: { responseMimeType: "application/json" }
    });

    const result = await model.generateContent(prompt);
    const content = result.response.text();

    if (!content) throw new Error("Gemini returned an empty response");

    try {
      const parsed = JSON.parse(content) as unknown;
      return normalizeAiVocabResponse(parsed, {
        requestedWord: word,
        allowedCategoryIds,
      });
    } catch {
      throw new Error("Gemini returned an unexpected response format");
    }

  } catch (error) {
    console.error("Gemini AI Generation Error:", error);
    return {
      status: "error",
      error: toSafeAiErrorMessage(error),
      word: "",
      translation: "",
      part_of_speech: "",
      gender: null,
      verb_type: null,
      conjugation: null,
      example_sentence: null,
      example_translation: null,
      category_id: null,
      root_word: null,
      notes: null,
    };
  }
}

export type GenerateImportNounGenderInput = {
  word: string;
  langCode: string;
  intendedMeaning: string;
  partOfSpeech: string;
};

type ImportNounGenderResult = {
  status: "ok" | "no_result" | "error";
  gender: "Masculine" | "Feminine" | "Masculine/Feminine" | "Neuter" | null;
  detail?: string;
};

export type GenerateImportVerbConjugationInput = {
  word: string;
  langCode: string;
  intendedMeaning: string;
  partOfSpeech: string;
};

export type GenerateImportRootWordInput = {
  word: string;
  langCode: string;
  intendedMeaning: string;
  partOfSpeech: string;
};

export type GenerateImportExamplesInput = {
  word: string;
  langCode: string;
  intendedMeaning: string;
  partOfSpeech: string;
};

export type GenerateImportBetterRootWordInput = {
  word: string;
  langCode: string;
  intendedMeaning: string;
  partOfSpeech: string;
  currentRootWord: string;
};

export async function generateImportNounGender(
  input: GenerateImportNounGenderInput
): Promise<ImportNounGenderResult> {
  const word = input.word.trim();
  const langCode = input.langCode.trim();
  const intendedMeaning = input.intendedMeaning.trim();
  const partOfSpeech = input.partOfSpeech.trim();

  try {
    const apiKey = getGeminiApiKey();
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json" },
    });

    const prompt = `
      You are filling ONE field only for an import review row in a vocabulary app.

      The lexical identity is already fixed and authoritative:
      - Word: "${word}"
      - Language code: "${langCode}"
      - Meaning/use: "${intendedMeaning}"
      - Part of speech: "${partOfSpeech}"

      Task:
      - Return only the noun gender for this exact entry.
      - Do NOT re-decide the lexical identity.
      - Do NOT rewrite the meaning or part of speech.
      - If this noun can validly refer to masculine or feminine people, return "Masculine/Feminine".
      - Return null only when no useful or defensible noun gender can be identified.

      Allowed outputs only:
      - "Masculine"
      - "Feminine"
      - "Masculine/Feminine"
      - "Neuter"
      - null

      Output JSON only:
      {
        "gender": "Masculine | Feminine | Masculine/Feminine | Neuter | null"
      }
    `;

    const result = await model.generateContent(prompt);
    const content = result.response.text();

    if (!content) throw new Error("Gemini returned an empty response");

    const parsed = parseAiJsonContent<{ gender?: unknown } | string>(content);
    if (typeof parsed === "string") {
      return {
        status: normalizeNounGender(parsed) ? "ok" : "no_result",
        gender: normalizeNounGender(parsed) as "Masculine" | "Feminine" | "Masculine/Feminine" | "Neuter" | null,
        detail: normalizeNounGender(parsed) ? undefined : `Targeted gender call returned an unrecognized scalar: ${parsed}`,
      };
    }

    if (parsed && typeof parsed === "object") {
      const normalizedGender = normalizeNounGender(parsed.gender);
      return {
        status: normalizedGender ? "ok" : "no_result",
        gender: normalizedGender as "Masculine" | "Feminine" | "Masculine/Feminine" | "Neuter" | null,
        detail: normalizedGender ? undefined : `Targeted gender call returned no usable gender for ${word}.`,
      };
    }

    const fallbackGender = normalizeNounGender(content);
    if (fallbackGender) {
      return {
        status: "ok",
        gender: fallbackGender as "Masculine" | "Feminine" | "Masculine/Feminine" | "Neuter" | null,
      };
    }

    throw new Error(`Unexpected gender response format: ${content.slice(0, 120)}`);
  } catch (error) {
    console.error("Gemini noun gender enrichment error:", error);

    try {
      const fallback = await generateVocabInfo({
        word,
        langCode,
        intendedPos: partOfSpeech,
        intendedMeaning,
        source: "import",
      });

      if (fallback.status === "ok") {
        const fallbackGender = normalizeNounGender(fallback.gender);
        return {
          status: fallbackGender ? "ok" : "no_result",
          gender: fallbackGender as "Masculine" | "Feminine" | "Masculine/Feminine" | "Neuter" | null,
          detail: fallbackGender ? undefined : `Targeted gender call failed, and the broad fallback returned no noun gender for ${word}.`,
        };
      }

      if (fallback.status === "needs_hint") {
        return {
          status: "no_result",
          gender: null,
          detail: `Targeted gender call failed, and the broad fallback stayed conservative for ${word}.`,
        };
      }

      return {
        status: "error",
        gender: null,
        detail: `Targeted gender call failed; broad fallback also failed: ${fallback.error}`,
      };
    } catch (fallbackError) {
      const targetedMessage =
        error instanceof Error && /Unexpected gender response format/i.test(error.message)
          ? error.message
          : `${toSafeAiErrorMessage(error)} Raw: ${toAiDebugDetail(error)}`;

      return {
        status: "error",
        gender: null,
        detail: `Targeted gender call failed: ${targetedMessage}. Broad fallback failed: ${toSafeAiErrorMessage(fallbackError)} Raw: ${toAiDebugDetail(fallbackError)}`,
      };
    }
  }
}

export async function generateImportVerbConjugation(
  input: GenerateImportVerbConjugationInput
): Promise<{ conjugation: string | null; verb_type: string | null; error?: string }> {
  try {
    const word = input.word.trim();
    const langCode = input.langCode.trim();
    const intendedMeaning = input.intendedMeaning.trim();
    const partOfSpeech = input.partOfSpeech.trim();

    const apiKey = getGeminiApiKey();
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json" },
    });

    const prompt = `
      You are filling verb support fields for ONE import review row in a vocabulary app.

      The lexical identity is already fixed and authoritative:
      - Word: "${word}"
      - Language code: "${langCode}"
      - Meaning/use: "${intendedMeaning}"
      - Part of speech: "${partOfSpeech}"

      Task:
      - Return verb conjugation for this exact entry.
      - Optionally return verb_type if it can be identified clearly and it is currently missing in the row.
      - Do NOT re-decide lexical identity.
      - Do NOT rewrite the meaning or part of speech.
      - If the entry is a clear verb, strongly prefer returning conjugation rather than leaving it null.

      Conjugation format:
      - Start with "Present:"
      - Include pronouns and forms in the target language
      - Add one empty line before "Past Participle:"
      - Example:
        Present:
        io parlo
        tu parli
        lui/lei parla
        noi parliamo
        voi parlate
        loro parlano

        Past Participle: parlato

      Allowed verb_type values:
      - "Transitive"
      - "Intransitive"
      - null

      Output JSON only:
      {
        "conjugation": "formatted conjugation string or null",
        "verb_type": "Transitive | Intransitive | null"
      }
    `;

    const result = await model.generateContent(prompt);
    const content = result.response.text();

    if (!content) throw new Error("Gemini returned an empty response");

    const parsed = JSON.parse(content) as { conjugation?: unknown; verb_type?: unknown };
    const conjugation =
      typeof parsed.conjugation === "string" && parsed.conjugation.trim() ? parsed.conjugation.trim() : null;
    const rawVerbType = typeof parsed.verb_type === "string" ? parsed.verb_type.trim() : "";
    const normalizedVerbType =
      rawVerbType.toLowerCase() === "transitive"
        ? "Transitive"
        : rawVerbType.toLowerCase() === "intransitive"
          ? "Intransitive"
          : null;

    return {
      conjugation,
      verb_type: normalizedVerbType,
    };
  } catch (error) {
    console.error("Gemini verb conjugation enrichment error:", error);
    return {
      conjugation: null,
      verb_type: null,
      error: toSafeAiErrorMessage(error),
    };
  }
}

export async function generateImportRootWord(
  input: GenerateImportRootWordInput
): Promise<{ root_word: string | null; error?: string }> {
  try {
    const word = input.word.trim();
    const langCode = input.langCode.trim();
    const intendedMeaning = input.intendedMeaning.trim();
    const partOfSpeech = input.partOfSpeech.trim();

    const apiKey = getGeminiApiKey();
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json" },
    });

    const prompt = `
      You are filling one support field for ONE import review row in a vocabulary app.

      The lexical identity is already fixed and authoritative:
      - Word: "${word}"
      - Language code: "${langCode}"
      - Meaning/use: "${intendedMeaning}"
      - Part of speech: "${partOfSpeech}"

      Task:
      - Return only a useful root_word for this exact single-word entry.
      - Do NOT re-decide lexical identity.
      - Do NOT rewrite the meaning or part of speech.
      - Prefer a plausible, defensible lexical root over leaving the field blank.
      - Return null only when no useful or defensible root can be identified.

      Root-word rules:
      - Format strictly as: "root_word (Language)"
      - Example: "noctem (Latin)"
      - For Romance languages, trace to "(Latin)" whenever plausible.
      - Do not use over-specific labels like "Late Latin" or "Vulgar Latin".
      - Do not force a weak or artificial root.

      Output JSON only:
      {
        "root_word": "root_word (Language) or null"
      }
    `;

    const result = await model.generateContent(prompt);
    const content = result.response.text();

    if (!content) throw new Error("Gemini returned an empty response");

    const parsed = JSON.parse(content) as { root_word?: unknown };
    const rootWord = typeof parsed.root_word === "string" && parsed.root_word.trim() ? parsed.root_word.trim() : null;

    return {
      root_word: rootWord,
    };
  } catch (error) {
    console.error("Gemini root-word enrichment error:", error);
    return {
      root_word: null,
      error: toSafeAiErrorMessage(error),
    };
  }
}

export async function generateImportExamples(
  input: GenerateImportExamplesInput
): Promise<{ example_sentence: string | null; example_translation: string | null; error?: string }> {
  try {
    const word = input.word.trim();
    const langCode = input.langCode.trim();
    const intendedMeaning = input.intendedMeaning.trim();
    const partOfSpeech = input.partOfSpeech.trim();

    const apiKey = getGeminiApiKey();
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json" },
    });

    const prompt = `
      You are filling example fields for ONE import review row in a vocabulary app.

      The lexical identity is already fixed and authoritative:
      - Word: "${word}"
      - Language code: "${langCode}"
      - Meaning/use: "${intendedMeaning}"
      - Part of speech: "${partOfSpeech}"

      Task:
      - Return only an example sentence and its English translation for this exact entry.
      - Do NOT re-decide lexical identity.
      - Do NOT rewrite the meaning or part of speech.
      - The example must match the exact intended POS and central meaning/use.
      - Prefer a short, natural, beginner-friendly example when possible.
      - The sentence should sound like something a real person would naturally say or write in everyday use.
      - Keep the sentence simple enough to say aloud and easy to study.
      - Prefer one clear use of the target entry over clever, literary, poetic, or highly formal phrasing.
      - Do NOT write dictionary-style explanatory sentences.
      - Do NOT add extra nuance, contrast, or multiple senses into the same example.
      - Avoid examples that feel overly abstract, academic, ceremonial, or rare unless the lexical identity itself requires that register.
      - Use the target word in a way that makes the intended POS obvious in context.
      - The English translation should be natural, clear, and closely matched to the example sentence.
      - The English translation should translate the sentence, not explain the word.
      - If the entry is clear, strongly prefer returning both fields rather than leaving them blank.

      Output JSON only:
      {
        "example_sentence": "Sentence in the target language or null",
        "example_translation": "English translation of that sentence or null"
      }
    `;

    const result = await model.generateContent(prompt);
    const content = result.response.text();

    if (!content) throw new Error("Gemini returned an empty response");

    const parsed = JSON.parse(content) as {
      example_sentence?: unknown;
      example_translation?: unknown;
    };

    const exampleSentence =
      typeof parsed.example_sentence === "string" && parsed.example_sentence.trim()
        ? parsed.example_sentence.trim()
        : null;
    const exampleTranslation =
      typeof parsed.example_translation === "string" && parsed.example_translation.trim()
        ? parsed.example_translation.trim()
        : null;

    return {
      example_sentence: exampleSentence,
      example_translation: exampleTranslation,
    };
  } catch (error) {
    console.error("Gemini example enrichment error:", error);
    return {
      example_sentence: null,
      example_translation: null,
      error: toSafeAiErrorMessage(error),
    };
  }
}

export async function generateImportBetterRootWord(
  input: GenerateImportBetterRootWordInput
): Promise<{ root_word: string | null; error?: string }> {
  try {
    const word = input.word.trim();
    const langCode = input.langCode.trim();
    const intendedMeaning = input.intendedMeaning.trim();
    const partOfSpeech = input.partOfSpeech.trim();
    const currentRootWord = input.currentRootWord.trim();

    const apiKey = getGeminiApiKey();
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json" },
    });

    const prompt = `
      You are improving ONE support field for ONE import review row in a vocabulary app.

      The lexical identity is already fixed and authoritative:
      - Word: "${word}"
      - Language code: "${langCode}"
      - Meaning/use: "${intendedMeaning}"
      - Part of speech: "${partOfSpeech}"
      - Current root_word: "${currentRootWord}"

      Task:
      - Review the current root_word and decide whether a clearly better, more defensible root_word exists for this exact single-word entry.
      - Do NOT re-decide lexical identity.
      - Do NOT rewrite the meaning or part of speech.
      - Replace the current root only when you can provide a clearly better root.
      - If the current root is already acceptable, or no better defensible root can be identified, return null.

      Root-word rules:
      - Format strictly as: "root_word (Language)"
      - Example: "noctem (Latin)"
      - For Romance languages, prefer "(Latin)" whenever plausible.
      - Do not use overly specific labels like "Late Latin", "Vulgar Latin", or "Medieval Latin".
      - Prefer keeping the current value over replacing it with something weak or artificial.

      Output JSON only:
      {
        "root_word": "better root_word (Language) or null"
      }
    `;

    const result = await model.generateContent(prompt);
    const content = result.response.text();

    if (!content) throw new Error("Gemini returned an empty response");

    const parsed = JSON.parse(content) as { root_word?: unknown };
    const rootWord =
      typeof parsed.root_word === "string" && parsed.root_word.trim() ? parsed.root_word.trim() : null;

    return {
      root_word: rootWord,
    };
  } catch (error) {
    console.error("Gemini root-quality correction error:", error);
    return {
      root_word: null,
      error: toSafeAiErrorMessage(error),
    };
  }
}

export async function getWordNuance(word: string, langCode: string, translation: string) {
  try {
    const apiKey = getGeminiApiKey();
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
      You are a native language tutor. Explain the nuanced meaning and natural usage for "${word}" in ${langCode}.
      Core meaning: "${translation}". 
      
      ### CRITICAL RULES:
      1. 🌟 LANGUAGE: ALWAYS provide the explanation in ENGLISH.
      2. FORMAT: Use plain text only. DO NOT use Markdown symbols like ** or #.
      3. SPACING: Use clear line breaks (\\n).
    `;

    const result = await model.generateContent(prompt);
    return result.response.text();

  } catch (error) {
    console.error("Nuance AI Error:", error);
    return toSafeAiErrorMessage(error);
  }
}

export const generateWordDetails = generateVocabInfo;
