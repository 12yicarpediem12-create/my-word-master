"use server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERIC_AI_API_KEY!);

export async function generateWordDetails(word: string, langCode: string) {
  // 1.5 Flashモデルを使用（高速で、構造化データの出力が得意です）
  const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    generationConfig: { responseMimeType: "application/json" } // JSONで返却を強制
  });

  const prompt = `
    Analyze the following word for a language learner.
    Target Language Code: ${langCode}
    Word: ${word}

    Please provide the following in JSON format:
    - translation: Short English meaning.
    - part_of_speech: Choose from Noun, Verb, Adjective, Adverb, Phrase.
    - category: Choose the best one from [Travel, Food, Work, Daily, Emotion, Health, Culture, Other].
    - example_sentence: A simple, natural example in ${langCode}.
    - example_translation: English translation of the example.
    - conjugation: 
        If it's a Verb, provide basic present tense for (io, tu, lui/lei) in ${langCode}. 
        Format like: "io: [form], tu: [form], lui/lei: [form]".
        If not a Verb, return null.

    Strict rules:
    - If it's a Verb, identify the type (e.g., -are, -ere, -ire in Italian) and include it in part_of_speech like "Verb (-are)".
    - Ensure accuracy based on modern usage.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return JSON.parse(response.text());
  } catch (error) {
    console.error("Gemini Error:", error);
    throw new Error("Failed to generate details.");
  }
}