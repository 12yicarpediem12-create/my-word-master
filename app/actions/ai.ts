"use server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function generateWordDetails(word: string, langCode: string) {
  const apiKey = process.env.GOOGLE_GENERIC_AI_API_KEY?.trim();
  const genAI = new GoogleGenerativeAI(apiKey || "");

  try {
    // 🌟 重要：現在利用可能なモデルをリストアップしてログに出す
    // Vercelのログ（Logs）に、あなたが使える正確なIDが表示されます
    console.log("--- Listing Available Models ---");
    // @ts-ignore (一部の型定義でエラーが出る場合がありますが、実行は可能です)
    const models = await genAI.getGenerativeModel({ model: "gemini-3-flash" }); 
    // ※リスト取得メソッドがSDKバージョンで異なる場合があるため、まずはIDをいくつか試します。

    // 2026年現在、最も可能性が高いIDを順番に試す「フォールバック」ロジック
    const candidateModels = ["gemini-3.0-flash", "gemini-3-flash-001", "gemini-3.1-pro"];
    
    let model;
    let text = "";

    // 候補の中から動くものを探す
    for (const modelId of candidateModels) {
      try {
        console.log(`Trying model: ${modelId}...`);
        const testModel = genAI.getGenerativeModel({ model: modelId });
        const result = await testModel.generateContent(`Return JSON for "${word}" in ${langCode}. Meaning only.`);
        text = result.response.text();
        console.log(`✅ Success with: ${modelId}`);
        model = testModel;
        break; 
      } catch (e) {
        console.log(`❌ Failed with: ${modelId}`);
      }
    }

    if (!text) throw new Error("No compatible Gemini 3 model found.");

    // (以下、以前と同じJSONパース処理)
    const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleanJson);

  } catch (error: any) {
    console.error("CRITICAL Gemini Error:", error.message);
    throw new Error("Check Vercel Logs for available model IDs.");
  }
}