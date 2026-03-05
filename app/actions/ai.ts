"use server";

import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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

      ### CRITICAL INSTRUCTIONS:
      1. PART OF SPEECH (POS):
         - Determine the most appropriate Part of Speech freely (e.g., Noun, Verb, Adjective, Adverb, Phrase, Conjunction, Pronoun, Preposition, Interjection).
         - If a word functions as multiple POS, join them with a slash (e.g., "Adverb/Conjunction" or "Noun/Adjective").
      2. CATEGORY SELECTION - STRICT RULE: 
         - Choose a "Category ID" from the AVAILABLE CATEGORY LIST below ONLY IF the word fits PERFECTLY and UNDENIABLY into that specific sub-topic.
         - If there is ANY doubt, or if the word is an abstract concept, general verb, basic grammar word, or doesn't strongly belong to the list, you MUST return null. DO NOT force a categorization.
         - If returning a category, output ONLY the numerical ID (e.g., "45").
      3. For nouns, include the definite article (e.g. "la mela").
      4. LANGUAGE: ALWAYS provide "translation" and "example_translation" in ENGLISH.
      5. CONJUGATION: For verbs, start with "Present:". List pronouns and forms (e.g., "io parlo"). DO NOT include English translations here.
         🌟 IMPORTANT: Add ONE EMPTY LINE (\\n\\n) before "Past Participle:".
      6. NOTES FIELD: For verbs, provide exactly two lines:
         Line 1: Group: [Pattern] (e.g., "Group: Regular -are verb").
         Line 2: Tip: [Grammar tip]

      ### AVAILABLE CATEGORY LIST:
      ${categoryListString}

      ### OUTPUT FORMAT (JSON ONLY):
      {
        "word": "word with article",
        "translation": "English translation",
        "part_of_speech": "e.g., Adverb/Conjunction",
        "gender": "Masculine/Feminine/Neuter or null",
        "verb_type": "Transitive/Intransitive or null",
        "conjugation": "Present:\\nio parlo...\\n\\nPast Participle: parlato",
        "example_sentence": "Sentence in target language",
        "example_translation": "English translation",
        "category_id": "Selected ID number or null",
        "notes": "Group: [Pattern]\\nTip: [Grammar tip]"
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

export async function getWordNuance(word: string, langCode: string, translation: string) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("API Key missing");

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

  } catch (error: any) {
    console.error("Nuance AI Error:", error);
    return "Could not fetch nuance details.";
  }
}

export const generateWordDetails = generateVocabInfo;