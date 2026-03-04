"use server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function generateWordDetails(word: string, langCode: string) {
  const apiKey = process.env.GOOGLE_GENERIC_AI_API_KEY?.trim();
  if (!apiKey) throw new Error("API Key is missing.");

  const genAI = new GoogleGenerativeAI(apiKey);

  /**
   * 🌟 ログで確認できた「今すぐ使える」モデルリスト
   * models/ プレフィックスを外したIDを指定します
   */
  const candidates = [
    "gemini-2.5-flash",      // 2.5系のメイン
    "gemini-2.5-flash-lite", // 2.5系の軽量版（より高速）
    "gemini-2.0-flash",      // 2.0系の安定版
  ];

  let lastError = "";

  for (const modelId of candidates) {
    try {
      console.log(`DEBUG: [2026 Verified] Trying ${modelId} via v1...`);
      
      const model = genAI.getGenerativeModel(
        { model: modelId },
        { apiVersion: "v1" }
      );

      const prompt = `Return ONLY JSON for word "${word}" in ${langCode}: {"translation":"...","part_of_speech":"...","category":"...","example_sentence":"...","example_translation":"...","conjugation":"..."}`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      
      console.log(`✅ SUCCESS: ${modelId}`);
      // JSONの整形
      const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
      return JSON.parse(cleanJson);
      
    } catch (e: any) {
      console.warn(`❌ FAILED ${modelId}: ${e.message}`);
      lastError = e.message;
      continue; 
    }
  }

  throw new Error(`AI Blackout: 利用可能なモデルでもエラーが発生しました: ${lastError}`);
}