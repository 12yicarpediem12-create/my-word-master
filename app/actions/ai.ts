"use server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// 🌟 hint 引数を追加
export async function generateWordDetails(word: string, langCode: string, hint?: string) {
  const apiKey = process.env.GOOGLE_GENERIC_AI_API_KEY?.trim();
  if (!apiKey) return { error: "API Key missing." };

  const genAI = new GoogleGenerativeAI(apiKey);
  const candidates = ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-2.0-flash"];

  for (const modelId of candidates) {
    try {
      const model = genAI.getGenerativeModel({ model: modelId }, { apiVersion: "v1" });
      
      const prompt = `Return ONLY a valid raw JSON object for the word/phrase "${word}" in language "${langCode}".
      ${hint ? `USER HINT: The user wants to focus on this specific meaning or context: "${hint}". Use this to disambiguate.` : ""}

      Required keys: "word_with_article", "translation", "part_of_speech", "gender", "verb_type", "category", "example_sentence", "example_translation", "conjugation".
      
      CRITICAL INSTRUCTION FOR "part_of_speech":
      - Use standard terms: "Noun", "Verb", "Adjective", "Adverb", "Phrase", "Preposition", "Conjunction".
      - If it is a multi-word expression like "a domani", use "Phrase".
      
      CRITICAL INSTRUCTION FOR "word_with_article":
      - If it's a noun, include the article. If it's a phrase or other, return as is.

      CRITICAL INSTRUCTION FOR "conjugation":
      - If it IS a verb, return 3 tenses. Otherwise, set to null.`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("JSON not found");
      return JSON.parse(jsonMatch[0]);
    } catch (e: any) {
      continue; 
    }
  }
  return { error: "AI error. Please fill manually." };
}