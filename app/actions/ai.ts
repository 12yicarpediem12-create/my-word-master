"use server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function generateWordDetails(word: string, langCode: string) {
  const apiKey = process.env.GOOGLE_GENERIC_AI_API_KEY?.trim();
  if (!apiKey) return { error: "API Key missing." };

  const genAI = new GoogleGenerativeAI(apiKey);

  const candidates = [
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-2.0-flash"
  ];

  for (const modelId of candidates) {
    try {
      const model = genAI.getGenerativeModel({ model: modelId }, { apiVersion: "v1" });
      
      // 🌟 "word_with_article" という新しいキーを要求します
      const prompt = `Return ONLY a valid raw JSON object for the word "${word}" in language "${langCode}".
      Required keys: "word_with_article", "translation", "part_of_speech", "category", "example_sentence", "example_translation", "conjugation".
      
      CRITICAL INSTRUCTION FOR "word_with_article":
      - If the word is a noun, return the word with its appropriate definite article prepended (e.g., "la mela", "il problema").
      - If the word is NOT a noun, return the original word as is (e.g., "mangiare").

      CRITICAL INSTRUCTION FOR "part_of_speech":
      - For nouns, explicitly state the gender (e.g., "Masculine Noun" or "Feminine Noun").
      - For verbs, explicitly state the transitivity (e.g., "Transitive Verb" or "Intransitive Verb").
      
      CRITICAL INSTRUCTION FOR "conjugation":
      - If the word is NOT a verb, set "conjugation" to null.
      - If the word IS a verb, return an object with EXACTLY these 3 keys: "present_indicative", "past_tense", and "future_tense". 
      Provide the full conjugation for all pronouns inside each tense. Do not add any other tenses.`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("JSON not found");
      
      return JSON.parse(jsonMatch[0]);
    } catch (e: any) {
      console.warn(`❌ FAILED ${modelId}: ${e.message}`);
      continue; 
    }
  }
  return { error: "AI could not generate data. Please fill manually." };
}