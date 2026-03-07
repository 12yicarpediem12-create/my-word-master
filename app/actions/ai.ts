"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";
import {
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
      3. PART OF SPEECH (POS):
         - Return exactly one POS label only.
         - Use a single label such as "Noun", "Verb", "Adjective", "Adverb", "Expression", "Proper Noun", or another single POS phrase if needed.
      4. CATEGORY SELECTION - CONSERVATIVE RULE:
         - Category is OPTIONAL.
         - Choose a "Category ID" from the AVAILABLE CATEGORY LIST below ONLY when there is one clearly best, high-confidence fit for this exact lexical record.
         - If two or more categories are similarly plausible, return null.
         - If the fit is broad, cross-topic, or uncertain, return null.
         - Prefer under-classification over wrong classification.
         - If returning a category, output ONLY the numerical ID (e.g., "45"). Otherwise return null.
      5. ETYMOLOGY (Shared Roots) - STRICT RULES:
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
         - For verbs, provide exactly two lines -> Line 1: Group: [Pattern], Line 2: Tip: [Grammar tip].
         - 🛑 STRICT RULE: NEVER mention "typo", "spelling mistake", "misspelled", or correct the user explicitly anywhere in the output. If the user input contains a typo, SILENTLY fix it in the "word" field and provide normal grammar notes. DO NOT act like a teacher correcting a mistake.

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
        "gender": "Masculine/Feminine/Neuter or null",
        "verb_type": "Transitive/Intransitive or null",
        "conjugation": "Present:\\nio parlo...\\n\\nPast Participle: parlato",
        "example_sentence": "Sentence in target language matching the specific POS/Meaning",
        "example_translation": "English translation",
        "category_id": "Selected ID number only when confidence is high, otherwise null",
        "root_word": "e.g., noctem (Latin) or null",
        "notes": "Grammar pattern or tip. NO typo warnings."
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
