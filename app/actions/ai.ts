"use server";

import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function generateVocabInfo(word: string, langCode: string) {
  try {
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
      5. LANGUAGE: ALWAYS provide "translation" and "example_translation" in ENGLISH (Not Japanese).
      6. CONJUGATION FORMAT: For verbs, provide the Present Tense cleanly formatted with line breaks (\\n) for each person (e.g., "Present:\\nio parlo\\ntu parli..."). THEN, add a line for the "Past Participle" (e.g., "\\nPast Participle: parlato"). If the verb has highly irregular Past or Future forms, briefly note them at the end. Keep it concise to avoid cognitive overload.

      ### AVAILABLE CATEGORY LIST:
      ${categoryListString}

      ### OUTPUT FORMAT (JSON ONLY):
      {
        "word": "word with article if applicable",
        "translation": "English translation (e.g., 'to speak, to talk')",
        "part_of_speech": "Noun/Verb/Adjective/Adverb/Phrase",
        "gender": "Masculine/Feminine/Neuter or null",
        "verb_type": "Transitive/Intransitive or null",
        "conjugation": "Formatted conjugation guide with \\n line breaks, or null",
        "example_sentence": "Example sentence in target language",
        "example_translation": "English translation of the example",
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

export const generateWordDetails = generateVocabInfo;