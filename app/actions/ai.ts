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
  // 1. データベースから既存の全カテゴリー（IDとパス）を取得
  // これをAIに渡すことで、言語が変わっても同じIDを選ばせます
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, full_path")
    .order("full_path", { ascending: true });

  const categoryListString = categories
    ?.map((c) => `ID: ${c.id} | Path: ${c.full_path}`)
    .join("\n");

  const prompt = `
    You are a linguistic expert. Analyze the following word and provide detailed information.
    
    Target Word: "${word}"
    Language Code: "${langCode}"

    ### GUIDELINES FOR CATEGORIZATION:
    - Below is a list of OALD (Oxford Advanced Learner's Dictionary) categories.
    - Select the MOST appropriate "Category ID" based on the word's primary MEANING.
    - CONSISTENCY: Ensure that the same concept (e.g., "Apple" in English and "Mela" in Italian) always maps to the SAME Category ID.
    - DO NOT FORCE: If the word does not clearly fit into any of the provided categories, return null for "category_id".
    - Focus on the Sub-subtopic level (the most specific one) if possible.

    ### AVAILABLE CATEGORIES:
    ${categoryListString}

    ### OUTPUT FORMAT (JSON ONLY):
    {
      "word": "original word",
      "translation": "Japanese translation",
      "part_of_speech": "Noun/Verb/Adjective/Adverb/Phrase",
      "gender": "Masculine/Feminine/Neuter or null",
      "verb_type": "Transitive/Intransitive or null",
      "conjugation": "Brief conjugation guide if it's a verb",
      "example_sentence": "A natural example sentence in the target language",
      "example_translation": "Japanese translation of the example",
      "category_id": "The UUID from the list above, or null if no fit",
      "notes": "Any grammatical nuances"
    }
  `;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // または gpt-3.5-turbo
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content;
    if (!content) return null;

    return JSON.parse(content);
  } catch (error) {
    console.error("AI Generation Error:", error);
    return null;
  }
}