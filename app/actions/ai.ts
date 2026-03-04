"use server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function generateWordDetails(word: string, langCode: string) {
  const apiKey = process.env.GOOGLE_GENERIC_AI_API_KEY?.trim();
  if (!apiKey) throw new Error("API Key is missing.");

  const genAI = new GoogleGenerativeAI(apiKey);

  /**
   * 🌟 2026年3月現在の有効なモデルリストに更新
   * gemini-2.0 は廃止されたため削除し、最新の 3.x 系と 1.5 の安定版を指定します
   */
  const candidates = [
    "gemini-3.5-flash",        // 2026年現在の最新標準モデル
    "gemini-3.0-flash-latest", // 3.0系の最新版
    "gemini-1.5-flash-latest", // 長期サポートの安定版
    "gemini-1.5-flash",        // 予備
  ];

  let lastError = "";

  for (const modelId of candidates) {
    try {
      console.log(`DEBUG: Trying current model: ${modelId}...`);
      
      // apiVersion は指定せず、SDKに最新の安定した口 (v1) を選ばせます
      const model = genAI.getGenerativeModel({ model: modelId });

      const prompt = `Return ONLY JSON for word "${word}" in ${langCode}: {"translation":"...","part_of_speech":"...","category":"...","example_sentence":"...","example_translation":"...","conjugation":"..."}`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      
      console.log(`✅ SUCCESS: ${modelId}`);
      const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
      return JSON.parse(cleanJson);
      
    } catch (e: any) {
      console.warn(`❌ FAILED ${modelId}: ${e.message}`);
      lastError = e.message;
      continue; 
    }
  }

  throw new Error(`AI Blackout: 利用可能なモデルが見つかりません。最新のSDKへの更新が必要です。 最終エラー: ${lastError}`);
}