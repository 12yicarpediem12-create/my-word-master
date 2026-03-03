"use server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function generateWordDetails(word: string, langCode: string) {
  const apiKey = process.env.GOOGLE_GENERIC_AI_API_KEY?.trim();
  const genAI = new GoogleGenerativeAI(apiKey || "");

  // 🌟 2026年でも「安定性No.1」の 1.5-flash を第一候補にします
  // これが動けば、設定自体は完璧である証拠です
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  try {
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
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    // JSONのクリーンアップ（マークダウン除去）
    const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
    
    return JSON.parse(cleanJson);

  } catch (error: any) {
    console.error("STABLE MODE ERROR:", error.message);
    
    // 💡 1.5でもダメなら、いよいよ「APIキーそのもの」が制限されています
    if (error.message.includes("404")) {
      throw new Error("Model not found. Please try creating a NEW API key in Google AI Studio.");
    }
    throw new Error("AI is still having issues: " + error.message);
  }
}