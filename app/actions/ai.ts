"use server";

import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function generateVocabInfo(word: string, langCode: string) {
  try {
    // 1. カテゴリー一覧をフェッチ（エラーハンドリング追加）
    const { data: categories, error: dbError } = await supabase
      .from("categories")
      .select("id, full_path");

    if (dbError) throw new Error("Database error: " + dbError.message);

    const categoryListString = categories
      ?.map((c) => `[${c.id}] ${c.full_path}`)
      .join("\n") || "No categories found";

    const prompt = `
      You are a linguistic expert. Analyze the word "${word}" in "${langCode}".

      ### INSTRUCTIONS:
      1. Meaning over Language: Categorize based on the word's core CONCEPT. (e.g. "Apple" and "Mela" must have the SAME Category ID).
      2. Choose ONE "Category ID" from the AVAILABLE CATEGORY LIST below.
      3. If no category fits, return null for "category_id".
      4. For nouns, include the definite article in the "word" field (e.g. "la mela").

      ### AVAILABLE CATEGORY LIST:
      ${categoryListString}

      ### OUTPUT FORMAT (JSON ONLY):
      {
        "word": "word with article if applicable",
        "translation": "Japanese translation",
        "part_of_speech": "Noun/Verb/Adjective/Adverb/Phrase",
        "gender": "Masculine/Feminine/Neuter or null",
        "verb_type": "Transitive/Intransitive or null",
        "conjugation": "Brief conjugation guide or null",
        "example_sentence": "Example sentence in target language",
        "example_translation": "Japanese translation of the example",
        "category_id": "Selected UUID or null",
        "notes": "Grammar notes or null"
      }
    `;

    // 🌟 修正: 高速な gpt-4o-mini に変更（Vercelの10秒タイムアウト対策）
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content;
    if (!content) throw new Error("OpenAI returned empty response");

    return JSON.parse(content);

  } catch (error: any) {
    console.error("AI Generation Error:", error);
    // エラー内容を画面に返す
    return { error: error.message || "Unknown AI error occurred." };
  }
}

// エイリアス（念のため残す）
export const generateWordDetails = generateVocabInfo;