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
      1. Meaning over Language: Categorize based on the word's core CONCEPT. (e.g. "Apple" and "Mela" must have the SAME Category ID).
      2. Choose ONE "Category ID" from the AVAILABLE CATEGORY LIST below.
      3. If no category fits, return null for "category_id".
      4. For nouns, include the definite article in the "word" field (e.g. "la mela").
      5. LANGUAGE: ALWAYS provide "translation" and "example_translation" in ENGLISH.
      6. CONJUGATION FORMAT: For verbs, provide the Present Tense with line breaks (\\n). THEN, add a line for "Past Participle". Note major irregularities briefly.

      ### AVAILABLE CATEGORY LIST:
      ${categoryListString}

      ### OUTPUT FORMAT (JSON ONLY):
      {
        "word": "word with article if applicable",
        "translation": "English translation",
        "part_of_speech": "Noun/Verb/Adjective/Adverb/Phrase",
        "gender": "Masculine/Feminine/Neuter or null",
        "verb_type": "Transitive/Intransitive or null",
        "conjugation": "Formatted guide with \\n",
        "example_sentence": "Sentence in target language",
        "example_translation": "English translation",
        "category_id": "Selected UUID or null",
        "notes": "Grammar notes or null"
      }
    `;

    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
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
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
      You are a native language tutor. Explain the nuanced meaning, social context (casual/formal), and natural usage for the word "${word}" in ${langCode}.
      The core meaning is "${translation}". 
      
      Please cover:
      - Is it formal, casual, or neutral?
      - Social situations where it is used.
      - 1-2 natural "collocations" (common word pairings).
      
      Keep it concise and entirely in ENGLISH. 
      IMPORTANT: DO NOT use Markdown symbols like ** or #. 
      Use clear plain text with simple line breaks (\\n) for sections.
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    if (!responseText) throw new Error("AI Coach returned no data.");
    
    return responseText;

  } catch (error: any) {
    console.error("Nuance AI Error:", error);
    return "Sorry, I couldn't analyze the nuance right now.";
  }
}

export const generateWordDetails = generateVocabInfo;