"use server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function generateWordDetails(word: string, langCode: string) {
  const apiKey = process.env.GOOGLE_GENERIC_AI_API_KEY?.trim();
  if (!apiKey) throw new Error("API Key is missing.");

  // ライブラリの初期化
  const genAI = new GoogleGenerativeAI(apiKey);

  /**
   * 🌟 2026年3月現在、最も確実に動くモデル名のリスト
   */
  const candidates = [
    "gemini-1.5-flash",        // 安定版の筆頭
    "gemini-1.5-flash-latest", // 最新エイリアス
    "gemini-2.0-flash-lite",   // もし2.0系を使うなら現在はこのIDの可能性があります
  ];

  let lastError = "";

  for (const modelId of candidates) {
    try {
      // 🌟 ここが最重要：apiVersion: "v1" を明示的に指定して v1beta を回避します
      console.log(`DEBUG: [FORCE v1] Trying ${modelId}...`);
      const model = genAI.getGenerativeModel(
        { model: modelId },
        { apiVersion: "v1" } // ← これを絶対に入れてください
      );

      const prompt = `Return ONLY JSON for word "${word}" in ${langCode}: {"translation":"...","part_of_speech":"...","category":"...","example_sentence":"...","example_translation":"...","conjugation":"..."}`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      
      console.log(`✅ SUCCESS with ${modelId}`);
      const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
      return JSON.parse(cleanJson);
      
    } catch (e: any) {
      console.warn(`❌ FAILED ${modelId}: ${e.message}`);
      lastError = e.message;
      continue; 
    }
  }

  throw new Error(`AI Blackout: v1エンドポイントでも失敗しました。エラー: ${lastError}`);
}