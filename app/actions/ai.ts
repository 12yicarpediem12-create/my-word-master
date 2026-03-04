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
      
      // 🌟 grammar_detail の代わりに、"gender" と "verb_type" を要求！
      const prompt = `Return ONLY a valid raw JSON object for the word "${word}" in language "${langCode}".
      Required keys: "word_with_article", "translation", "part_of_speech", "gender", "verb_type", "category", "example_sentence", "example_translation", "conjugation".
      
      CRITICAL INSTRUCTION FOR "word_with_article":
      - If the word is a noun AND the language uses definite articles, include the article naturally (e.g., "la mela" for Italian, "der Apfel" for German, "äpplet" for Swedish).
      - If the language does NOT use definite articles (e.g., Japanese, Russian), or if the word is NOT a noun, return the original word exactly as is.

      CRITICAL INSTRUCTION FOR "part_of_speech":
      - State ONLY the basic part of speech (e.g., "Noun", "Verb", "Adjective"). Do NOT include gender or transitivity here.

      CRITICAL INSTRUCTION FOR "gender":
      - For nouns ONLY, state the gender (e.g., "Feminine", "Masculine"). Otherwise, set to null.

      CRITICAL INSTRUCTION FOR "verb_type":
      - For verbs ONLY, state the verb type or transitivity (e.g., "Transitive", "Intransitive", "Reflexive"). Otherwise, set to null.
      
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