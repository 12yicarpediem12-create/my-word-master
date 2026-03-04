"use server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function generateWordDetails(word: string, langCode: string) {
  const apiKey = process.env.GOOGLE_GENERIC_AI_API_KEY?.trim();
  const genAI = new GoogleGenerativeAI(apiKey!);

  try {
    // 🌟 診断フェーズ：利用可能なモデルをすべて取得してログに出す
    console.log("--- DIAGNOSTIC: LISTING MODELS ---");
    const result = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`);
    const data = await result.json();
    console.log("Available Models:", JSON.stringify(data.models?.map((m: any) => m.name)));
    
    // 🌟 推測フェーズ：2026年の命名規則に基づいた候補
    const candidates = [
      "models/gemini-3-flash-latest", 
      "models/gemini-3.1-pro-latest",
      "models/gemini-3-flash-001",
      "models/gemini-3.1-flash"
    ];

    for (const modelId of candidates) {
      try {
        console.log(`DEBUG: Trying ${modelId}...`);
        const model = genAI.getGenerativeModel({ model: modelId }, { apiVersion: "v1" });
        const prompt = `Return ONLY JSON for word "${word}" in ${langCode}: {"translation":"..."}`;
        const res = await model.generateContent(prompt);
        console.log(`✅ SUCCESS: ${modelId}`);
        return JSON.parse(res.response.text().replace(/```json|```/g, ""));
      } catch (e) {
        console.warn(`❌ ${modelId} failed.`);
      }
    }
  } catch (err) {
    console.error("Diagnostic failed", err);
  }
  throw new Error("Check logs for 'Available Models' list.");
}