"use server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function generateWordDetails(word: string, langCode: string) {
  const apiKey = process.env.GOOGLE_GENERIC_AI_API_KEY?.trim();
  if (!apiKey) {
    console.error("DEBUG: API Key is missing!");
    throw new Error("API Key is missing.");
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  /**
   * 🌟 診断ログで動作確認が取れた「Gemini 2.5」シリーズを優先
   */
  const candidates = [
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-2.0-flash",
  ];

  let lastError = "";

  for (const modelId of candidates) {
    try {
      console.log(`DEBUG: [2026 Verified] Trying ${modelId} via v1...`);
      
      const model = genAI.getGenerativeModel(
        { model: modelId },
        { apiVersion: "v1" }
      );

      const prompt = `Return ONLY a valid JSON object for the word "${word}" in language "${langCode}". 
      Required keys: "translation", "part_of_speech", "category", "example_sentence", "example_translation", "conjugation".
      No prose, no markdown code blocks.`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      
      if (!text) throw new Error("AI returned empty text");

      /**
       * 🌟 JSONを安全に抽出する処理
       * AIが「Here is the JSON: ...」のように余計な文をつけても、{ } の中身だけを抜き出します。
       */
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON object found in response");
      
      const cleanJson = jsonMatch[0];
      const parsedData = JSON.parse(cleanJson);

      // フロントエンドで壊れないよう、最低限必要な項目をチェック
      if (!parsedData.translation) {
        throw new Error("Parsed data is missing required fields");
      }

      console.log(`✅ SUCCESS with model: ${modelId}`);
      return parsedData;

    } catch (e: any) {
      console.warn(`❌ FAILED with ${modelId}: ${e.message}`);
      lastError = e.message;
      // 次のモデルでリトライ
      continue; 
    }
  }

  console.error("--- ALL MODELS FAILED TO PROVIDE VALID JSON ---");
  throw new Error(`AI Blackout: 全モデルで失敗またはデータ破損。最終エラー: ${lastError}`);
}