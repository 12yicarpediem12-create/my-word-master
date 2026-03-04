"use server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function generateWordDetails(word: string, langCode: string) {
  const apiKey = process.env.GOOGLE_GENERIC_AI_API_KEY?.trim();
  
  if (!apiKey) {
    console.error("DEBUG: API Key is missing!");
    return { error: "API Key is missing. Check your environment variables." };
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  /**
   * 🌟 2026年3月4日の診断ログで動作が確認されたモデルID
   * 2.5系があなたの環境での最新かつ安定したモデルです。
   */
  const candidates = [
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-2.5-pro",
  ];

  for (const modelId of candidates) {
    try {
      console.log(`DEBUG: [2026 Verified] Trying ${modelId} via v1...`);
      
      const model = genAI.getGenerativeModel(
        { model: modelId },
        { apiVersion: "v1" } // 正式版エンドポイントを使用
      );

      const prompt = `Return ONLY a valid raw JSON object for the word "${word}" in language "${langCode}".
      Required keys: "translation", "part_of_speech", "category", "example_sentence", "example_translation", "conjugation".
      No explanations, no markdown code blocks.`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      
      if (!text) throw new Error("AI returned empty text");

      /**
       * 🌟 JSON抽出ガード
       * AIが余計な文章を混ぜても { } の部分だけを抽出します。
       */
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("Valid JSON object not found");
      
      const parsedData = JSON.parse(jsonMatch[0]);

      // 最低限必要なフィールドの有無をチェック
      if (!parsedData.translation) throw new Error("Invalid data format");

      console.log(`✅ SUCCESS: ${modelId}`);
      return parsedData;

    } catch (e: any) {
      console.warn(`❌ FAILED ${modelId}: ${e.message}`);
      // 次の候補モデルへ
      continue; 
    }
  }

  /**
   * 🌟 フロントエンドをクラッシュさせないための工夫
   * throwせず、エラー内容をオブジェクトとして返します。
   */
  return { 
    error: "AI Generation failed. Please try again later.",
    details: "All available models (2.5 series) returned errors." 
  };
}