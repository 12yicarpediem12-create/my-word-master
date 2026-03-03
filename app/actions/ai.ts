"use server";
import OpenAI from "openai";

// OpenAIの準備（自動的に .env.local の OPENAI_API_KEY を読み込みます）
const openai = new OpenAI();

export async function generateWordDetails(word: string, langCode: string) {
  if (!word) throw new Error("単語が入力されていません");

  const prompt = `
  あなたはプロの語学教師です。
  生徒が言語コード「${langCode}」の単語「${word}」を学習しようとしています。
  以下の情報を、必ず厳密なJSON形式のみで出力してください。

  {
    "translation": "その単語の自然な英語訳",
    "part_of_speech": "Noun, Verb, Adjective, Adverb, Phrase のいずれか",
    "example_sentence": "その単語を使った、実践的で自然な例文（ターゲット言語 ${langCode} で）",
    "example_translation": "その例文の英語訳"
  }
  `;

  try {
    // 🌟 ChatGPT（gpt-4o-mini）にお願いする
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // 安くて爆速な最新モデル
      messages: [
        { role: "system", content: "You are a helpful language teacher. Always output valid JSON." },
        { role: "user", content: prompt }
      ],
      // 絶対にJSONで返せ！という強力な強制オプション
      response_format: { type: "json_object" },
    });

    const text = response.choices[0].message.content;
    
    if (!text) {
      throw new Error("ChatGPTからの返答が空でした");
    }

    return JSON.parse(text);
  } catch (error) {
    console.error("🚨 OpenAI Generation Error 🚨:", error);
    throw new Error("AIによる生成に失敗しました");
  }
}