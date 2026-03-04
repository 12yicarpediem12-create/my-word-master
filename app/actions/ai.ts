"use server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function generateWordDetails(word: string, langCode: string) {
  const apiKey = process.env.GOOGLE_GENERIC_AI_API_KEY?.trim();
  if (!apiKey) throw new Error("API Key is missing.");

  const genAI = new GoogleGenerativeAI(apiKey);

  /**
   * 🌟 2026年3月現在の有効なモデルリスト
   * 2.0は廃止されたため、3系を優先します。
   */
  const candidates = [
    "gemini-3-flash",     // 本格運用のメインモデル
    "gemini-3.1-pro",     // 高精度モデル
    "gemini-1.5-flash",   // 安定版のバックアップ
  ];

  let lastError = "";

  for (const modelId of candidates) {
    try {
      // 🌟 重要: デバッグメッセージで今の設定を確認
      console.log(`DEBUG: Trying ${modelId} FORCE v1...`);
      
      // 🌟 APIバージョンを "v1" に強制固定します
      const model = genAI.getGenerativeModel(
        { model: modelId },
        { apiVersion: "v1" }
      );

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

  throw new Error(`AI Blackout: v1エンドポイントでもモデルが見つかりません。APIキーの有効性を再確認してください。`);
}