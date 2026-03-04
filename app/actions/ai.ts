"use server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function generateWordDetails(word: string, langCode: string) {
  const apiKey = process.env.GOOGLE_GENERIC_AI_API_KEY?.trim();
  if (!apiKey) throw new Error("API Key is missing.");

  const genAI = new GoogleGenerativeAI(apiKey);

  /**
   * 🌟 2026年3月現在の「正規ラインナップ」
   * 1.5や2.0は廃止されたため、現在の標準モデルのみを指定します。
   */
  const candidates = [
    "gemini-3-flash",     // 2026年現在の標準・高速モデル
    "gemini-3.1-pro",     // 2026年現在の高精度モデル
  ];

  let lastError = "";

  for (const modelId of candidates) {
    try {
      console.log(`DEBUG: [2026 Standard] Trying ${modelId} via v1...`);
      
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

  throw new Error(`AI Blackout: モデルIDが変更された可能性があります。最新の公式ドキュメントを確認してください。 最終エラー: ${lastError}`);
}