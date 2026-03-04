"use server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function generateWordDetails(word: string, langCode: string) {
  const apiKey = process.env.GOOGLE_GENERIC_AI_API_KEY?.trim();
  if (!apiKey) return { error: "API Key missing." };

  const genAI = new GoogleGenerativeAI(apiKey);

  // 2026年3月の診断ログで動作確認済みのモデルID
  const candidates = [
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-2.0-flash"
  ];

  for (const modelId of candidates) {
    try {
      // apiVersion: "v1" を明示的に指定して接続を安定化
      const model = genAI.getGenerativeModel({ model: modelId }, { apiVersion: "v1" });
      const prompt = `Return ONLY a valid raw JSON object for the word "${word}" in language "${langCode}".
      Required keys: "translation", "part_of_speech", "category", "example_sentence", "example_translation", "conjugation".`;

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