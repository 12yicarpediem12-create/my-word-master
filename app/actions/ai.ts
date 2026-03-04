"use server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function generateWordDetails(word: string, langCode: string) {
  const apiKey = process.env.GOOGLE_GENERIC_AI_API_KEY?.trim();
  if (!apiKey) throw new Error("API Key is missing.");

  // 最新のSDKでは初期化時にAPIバージョンを内部で最適化します
  const genAI = new GoogleGenerativeAI(apiKey);

  /**
   * 🌟 2026年3月現在、最も「確実」に動くモデルID
   */
  const candidates = [
    "gemini-1.5-flash",        // 安定版の王道（まず間違いなく動く）
    "gemini-1.5-flash-latest", // 1.5系の最新
    "gemini-3.0-flash",        // 3系の標準
  ];

  let lastError = "";

  for (const modelId of candidates) {
    try {
      console.log(`DEBUG: Trying ${modelId} with updated SDK...`);
      
      // 最新のSDKであれば、ここでの指定だけで正しいエンドポイント(v1)へ飛びます
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

  throw new Error(`AI Blackout: ライブラリを更新しましたが、APIキー側に制限があるようです。AI Studioでキーのステータスを確認してください。`);
}