"use server";

import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * 1. 単語の基本情報を生成するメイン関数
 */
export async function generateVocabInfo(word: string, langCode: string) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("API Key is missing in environment variables.");

    const genAI = new GoogleGenerativeAI(apiKey);

    const { data: categories, error: dbError } = await supabase
      .from("categories")
      .select("id, full_path");

    if (dbError) throw new Error("Database error: " + dbError.message);

    const categoryListString = categories
      ?.map((c) => `[${c.id}] ${c.full_path}`)
      .join("\n") || "No categories found";

    const prompt = `
      You are a linguistic expert. Analyze the word "${word}" in "${langCode}".

      ### INSTRUCTIONS:
      1. Meaning over Language: Categorize based on the word's core CONCEPT.
      2. Choose ONE "Category ID" from the AVAILABLE CATEGORY LIST below.
      3. For nouns, include the definite article (e.g. "la mela").
      4. LANGUAGE: ALWAYS provide "translation" and "example_translation" in ENGLISH.
      5. CONJUGATION: For verbs, provide Present Tense with line breaks (\\n). Include "Past Participle".
      6. NOTES FIELD: For verbs, YOU MUST specify the conjugation group (e.g., "-are verb", "-ere verb", "-ire verb" for Italian, or group 1/2/3 for French). Include essential grammar tips.

      ### AVAILABLE CATEGORY LIST:
      ${categoryListString}

      ### OUTPUT FORMAT (JSON ONLY):
      {
        "word": "word with article",
        "translation": "English translation",
        "part_of_speech": "Noun/Verb/Adjective/Adverb/Phrase",
        "gender": "Masculine/Feminine/Neuter or null",
        "verb_type": "Transitive/Intransitive or null",
        "conjugation": "Formatted guide with \\n",
        "example_sentence": "Sentence in target language",
        "example_translation": "English translation",
        "category_id": "Selected UUID or null",
        "notes": "Grammar notes (Include conjugation group for verbs)"
      }
    `;

    // 🌟 モデルを最新の gemini-3-flash に更新
    const model = genAI.getGenerativeModel({ 
      model: "gemini-3-flash", 
      generationConfig: { responseMimeType: "application/json" }
    });

    const result = await model.generateContent(prompt);
    const content = result.response.text();
    
    if (!content) throw new Error("Gemini returned an empty response");

    return JSON.parse(content);

  } catch (error: any) {
    console.error("Gemini AI Generation Error:", error);
    return { error: error.message || "Unknown Gemini API error occurred." };
  }
}

/**
 * 2. 単語のニュアンスや文化的背景を詳しく解説する関数 (AI Coach)
 */
export async function getWordNuance(word: string, langCode: string, translation: string) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("API Key missing");

    const genAI = new GoogleGenerativeAI(apiKey);
    // 🌟 モデルを最新の gemini-3-flash に更新
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash" });

    const prompt = `
      You are a native language tutor. Explain the nuanced meaning and natural usage for "${word}" in ${langCode}.
      Core meaning: "${translation}". 
      
      IMPORTANT: DO NOT use Markdown symbols like ** or #.
      Use plain text and clear line breaks (\\n).
    `;

    const result = await model.generateContent(prompt);
    return result.response.text();

  } catch (error: any) {
    console.error("Nuance AI Error:", error);
    return "Could not fetch nuance details.";
  }
}