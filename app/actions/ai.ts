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
      
      // 🌟 プロンプトを厳格化：「動詞なら必ずこの3つの時制を出すこと。動詞以外はnullにすること」と命令
      const prompt = `Return ONLY a valid raw JSON object for the word "${word}" in language "${langCode}".
      Required keys: "translation", "part_of_speech", "category", "example_sentence", "example_translation", "conjugation".
      
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