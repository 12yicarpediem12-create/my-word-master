"use server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function generateWordDetails(word: string, langCode: string) {
  const apiKey = process.env.GOOGLE_GENERIC_AI_API_KEY?.trim();
  
  if (!apiKey) {
    throw new Error("API Key is missing in Vercel settings.");
  }

  // 🌟 Gemini 3世代に対応した初期化
  const genAI = new GoogleGenerativeAI(apiKey);

  try {
    // 🌟 モデル名をスクリーンショット通りの最新版に変更
    // 'gemini-3-flash' は現在最も高速で推奨されているモデルです
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash" });

    const prompt = `
      Analyze the word "${word}" for a learner of ${langCode}.
      Return ONLY a JSON object:
      {
        "translation": "English meaning",
        "part_of_speech": "POS",
        "category": "Travel, Food, Work, Daily, Emotion, Health, Culture, or Other",
        "example_sentence": "sentence in ${langCode}",
        "example_translation": "English translation",
        "conjugation": "If verb, provide 'io, tu, lui/lei' forms. If not, null"
      }
      Strictly return ONLY JSON.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // JSONのクリーンアップ（マークダウン除去）
    const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
    
    return JSON.parse(cleanJson);

  } catch (error: any) {
    console.error("DEBUG Gemini Error:", error.message);
    // 万が一 'gemini-3-flash' でダメな場合は 'gemini-3.1-pro' を試すようメッセージを出す
    if (error.message.includes("404")) {
      throw new Error("Model not found. Please verify if 'gemini-3-flash' is available in your AI Studio region.");
    }
    throw new Error("AI failed: " + error.message);
  }
}