"use server";

import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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

export async function generateVocabInfo(word: string, langCode: string) {
  try {
    const apiKey = getGeminiApiKey();
    const genAI = new GoogleGenerativeAI(apiKey);

    const { data: categories, error: dbError } = await supabase
      .from("categories")
      .select("id, full_path");

    if (dbError) throw new Error("Database error: " + dbError.message);

    const categoryListString = categories
      ?.map((c) => `[${c.id}] ${c.full_path}`)
      .join("\n") || "No categories found";

    const prompt = `
      You are a linguistic expert. Analyze the input "${word}" in "${langCode}".

      ### CRITICAL INSTRUCTIONS:
      0. OBEY THE HINT (IF PROVIDED):
         - If the input contains a "(Hint: ...)" specifying a specific Part of Speech or meaning, you MUST restrict your entire analysis EXACTLY to that context.
         - DO NOT provide multiple meanings or other POS if the hint narrows it down. Focus 100% on the user's intended usage.
      1. PART OF SPEECH (POS):
         - Determine the most appropriate Part of Speech.
         - If (and ONLY if) there is no hint restricting it, and the word commonly functions as multiple POS, join them with a slash (e.g., "Noun/Adjective").
      2. CATEGORY SELECTION - STRICT RULE: 
         - Choose a "Category ID" from the AVAILABLE CATEGORY LIST below ONLY IF the word fits PERFECTLY and UNDENIABLY into that specific sub-topic.
         - If returning a category, output ONLY the numerical ID (e.g., "45").
      3. ETYMOLOGY (Shared Roots) - STRICT RULES:
         - For Romance languages (French, Italian, Spanish, Portuguese), trace the root back to "Latin" whenever possible.
         - DO NOT use micro-classifications like "Late Latin", "Vulgar Latin", "Medieval Latin", or "Post-Classical Latin". Group them all strictly as "(Latin)".
         - DO NOT trace back to "Proto-Indo-European" unless absolutely necessary. Stop at Latin, Proto-Germanic, Ancient Greek, or Arabic.
         - Format strictly as: "root_word (Language)" -> Example: "noctem (Latin)".
         - If unknown or not applicable, return null.
      4. TARGET LANGUAGE ARTICLE: For nouns, include the definite article in the "word" field (e.g. "la mela"). Do not add articles for adjectives or verbs.
      5. ENGLISH TRANSLATION - STRICT RULES:
         - ALWAYS translate to ENGLISH.
         - DO NOT include English articles like "the", "a", or "an".
         - If multiple meanings exist (and are not restricted by a hint), separate them STRICTLY with a comma and a space (e.g., "to say, to speak").
      6. CONJUGATION: For verbs, start with "Present:". List pronouns and forms (e.g., "io parlo"). DO NOT include English translations here.
         🌟 IMPORTANT: Add ONE EMPTY LINE (\\n\\n) before "Past Participle:". If the word is NOT a verb, return null or empty string.
      7. NOTES FIELD - 🛑 SILENT CORRECTION RULE:
         - For verbs, provide exactly two lines -> Line 1: Group: [Pattern], Line 2: Tip: [Grammar tip].
         - 🛑 STRICT RULE: NEVER mention "typo", "spelling mistake", "misspelled", or correct the user explicitly anywhere in the output. If the user input contains a typo, SILENTLY fix it in the "word" field and provide normal grammar notes. DO NOT act like a teacher correcting a mistake.

      ### AVAILABLE CATEGORY LIST:
      ${categoryListString}

      ### OUTPUT FORMAT (JSON ONLY):
      {
        "word": "word with article (only if noun)",
        "translation": "English translation without articles",
        "part_of_speech": "e.g., Adjective",
        "gender": "Masculine/Feminine/Neuter or null",
        "verb_type": "Transitive/Intransitive or null",
        "conjugation": "Present:\\nio parlo...\\n\\nPast Participle: parlato",
        "example_sentence": "Sentence in target language matching the specific POS/Meaning",
        "example_translation": "English translation",
        "category_id": "Selected ID number or null",
        "root_word": "e.g., noctem (Latin) or null",
        "notes": "Grammar pattern or tip. NO typo warnings."
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
      return JSON.parse(content);
    } catch {
      throw new Error("Gemini returned an unexpected response format");
    }

  } catch (error) {
    console.error("Gemini AI Generation Error:", error);
    return { error: toSafeAiErrorMessage(error) };
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
