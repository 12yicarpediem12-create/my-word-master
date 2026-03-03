"use server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function generateWordDetails(word: string, langCode: string) {
  const apiKey = process.env.GOOGLE_GENERIC_AI_API_KEY?.trim();
  
  if (!apiKey) {
    console.error("DEBUG: API Key is missing!");
    throw new Error("API Key is missing.");
  }

  // 🌟 2026年現在の最新SDK仕様で初期化
  const genAI = new GoogleGenerativeAI(apiKey);

  // 🌟 候補となるモデルID（2026年の最新順）
  const candidates = [
    "gemini-3-flash",
    "gemini-3.1-pro",
    "gemini-3.0-flash",
    "gemini-1.5-flash"
  ];

  let lastError = "";

  for (const modelId of candidates) {
    try {
      console.log(`DEBUG: Trying model ${modelId}...`);
      const model = genAI.getGenerativeModel({ model: modelId });

      const prompt = `Return ONLY JSON for word "${word}" in ${langCode}: {"translation":"...","part_of_speech":"...","category":"...","example_sentence":"...","example_translation":"...","conjugation":"..."}`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      
      console.log(`✅ SUCCESS with model: ${modelId}`);
      
      const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
      return JSON.parse(cleanJson);
      
    } catch (e: any) {
      console.warn(`❌ FAILED with ${modelId}: ${e.message}`);
      lastError = e.message;
      continue; // 次のモデルを試す
    }
  }

  // 全滅した場合、ログに具体的な理由を出して停止
  console.error("--- ALL MODELS FAILED ---");
  console.error("Last Error:", lastError);
  
  // 💡 ここが 404 なら、Google Cloud ConsoleでAPIを有効化する必要があります
  throw new Error(`AI Blackout: All models returned 404. Please check if 'Generative Language API' is ENABLED in Google Cloud Console.`);
}