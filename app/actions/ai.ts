"use server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function generateWordDetails(word: string, langCode: string) {
  // 環境変数からAPIキーを取得
  const apiKey = process.env.GOOGLE_GENERIC_AI_API_KEY?.trim();
  
  if (!apiKey) {
    console.error("DEBUG: API Key is missing!");
    throw new Error("API Key is missing.");
  }

  // SDKの初期化
  const genAI = new GoogleGenerativeAI(apiKey);

  /**
   * 🌟 修正ポイント1: モデルの優先順位を変更
   * 2026年現在、最も安定しているモデルを先頭に配置しています。
   */
  const candidates = [
    "gemini-2.0-flash", // 非常に高速で安定している推奨モデル
    "gemini-1.5-flash", // 互換性が高く、まず間違いなく動くモデル
    "gemini-3-flash",   // 新しいモデル（v1で使用可能）
  ];

  let lastError = "";

  for (const modelId of candidates) {
    try {
      console.log(`DEBUG: Trying model ${modelId} via v1 API...`);

      /**
       * 🌟 修正ポイント2: apiVersion を "v1" に固定
       * これにより、エラーの原因だった "v1beta" への自動接続を強制的に回避します。
       */
      const model = genAI.getGenerativeModel(
        { model: modelId },
        { apiVersion: "v1" } 
      );

      const prompt = `Return ONLY JSON for word "${word}" in ${langCode}: {"translation":"...","part_of_speech":"...","category":"...","example_sentence":"...","example_translation":"...","conjugation":"..."}`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      
      console.log(`✅ SUCCESS with model: ${modelId}`);
      
      // JSONの整形（マークダウンの除去）
      const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
      return JSON.parse(cleanJson);
      
    } catch (e: any) {
      console.warn(`❌ FAILED with ${modelId}: ${e.message}`);
      lastError = e.message;
      // 404やエラーが出た場合は、次の候補モデルへ移動
      continue; 
    }
  }

  // すべてのモデルが失敗した場合
  console.error("--- ALL MODELS FAILED ---");
  console.error("Last Error Details:", lastError);
  
  throw new Error(`AI Blackout: 全てのモデルでエラーが発生しました。最新のライブラリへの更新も検討してください。 最終エラー: ${lastError}`);
}