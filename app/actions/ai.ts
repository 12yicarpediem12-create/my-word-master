"use server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// 1. APIキーの読み込みを確認
const apiKey = process.env.GOOGLE_GENERIC_AI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || "");

export async function generateWordDetails(word: string, langCode: string) {
  // キーがない場合は即座にエラーを投げる（デバッグを楽にするため）
  if (!apiKey) {
    throw new Error("API Key is missing in environment variables!");
  }

  try {
    // 2. モデルの初期化 (1.5 Flashを指定)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      Analyze the following word for a language learner.
      Target Language Code: ${langCode}
      Word: ${word}

      Please provide the following in JSON format:
      {
        "translation": "Short English meaning",
        "part_of_speech": "Noun, Verb, Adjective, Adverb, or Phrase",
        "category": "Choose one: Travel, Food, Work, Daily, Emotion, Health, Culture, or Other",
        "example_sentence": "A simple natural example sentence in ${langCode}",
        "example_translation": "English translation of the example",
        "conjugation": "If it is a Verb, provide basic present tense for (io, tu, lui/lei) in ${langCode}. Format like 'io: ..., tu: ..., lui/lei: ...'. If not a verb, return null."
      }

      Important: Return ONLY the JSON object. Do not include any markdown formatting like \`\`\`json.
    `;

    // 3. AIにリクエストを送信
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // 4. Geminiがたまに付けるマークダウンの枠（ ```json ... ``` ）を掃除
    const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
    
    console.log("Gemini Response cleaned:", cleanJson);

    return JSON.parse(cleanJson);
  } catch (error: any) {
    console.error("Gemini Server Error:", error.message);
    throw new Error("AI failed to generate details: " + error.message);
  }
}