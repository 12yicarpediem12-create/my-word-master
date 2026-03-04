"use server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function generateWordDetails(word: string, langCode: string) {
  const apiKey = process.env.GOOGLE_GENERIC_AI_API_KEY?.trim();
  if (!apiKey) throw new Error("API Key is missing.");

  const genAI = new GoogleGenerativeAI(apiKey);

  // 🌟 2026年時点で最もエラー（404/429）が出にくい「公式推奨」の指定方法
  const candidates = [
    "gemini-1.5-flash-latest", // 最優先：最も安定
    "gemini-1.5-pro-latest",   // 2番手：高精度
    "gemini-1.5-flash",        // 予備1
    "gemini-2.0-flash",        // 予備2（現在Quotaエラーが出ているもの）
  ];

  let lastError = "";

  for (const modelId of candidates) {
    try {
      console.log(`DEBUG: Trying ${modelId}...`);
      
      // SDKのデフォルト設定に任せてモデルを取得
      const model = genAI.getGenerativeModel({ model: modelId });

      const prompt = `Return ONLY JSON for word "${word}" in ${langCode}: {"translation":"...","part_of_speech":"...","category":"...","example_sentence":"...","example_translation":"...","conjugation":"..."}`;

      // タイムアウト対策として少し待機を入れる
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      
      console.log(`✅ SUCCESS: ${modelId}`);
      const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
      return JSON.parse(cleanJson);
      
    } catch (e: any) {
      console.warn(`❌ FAILED ${modelId}: ${e.message}`);
      lastError = e.message;
      // 次の候補へ
      continue; 
    }
  }

  throw new Error(`AI Blackout: 全モデルで制限が発生中。AI Studioで新しいAPIキーを作成してください。内容: ${lastError}`);
}