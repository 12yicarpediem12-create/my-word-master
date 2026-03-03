"use client";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
// 🌟 さっき作ったAIの関数をインポート！
import { generateWordDetails } from "../actions/ai";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function CreateCardForm() {
  const [languages, setLanguages] = useState<any[]>([]);
  const [selectedLang, setSelectedLang] = useState("");
  const [newWord, setNewWord] = useState("");
  const [newTranslation, setNewTranslation] = useState("");
  const [newPos, setNewPos] = useState("");
  const [newExample, setNewExample] = useState("");
  const [newExampleTranslation, setNewExampleTranslation] = useState("");
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false); // 🌟 AI考え中フラグ

  useEffect(() => {
    async function fetchLangs() {
      const { data } = await supabase.from("languages").select("*");
      if (data) {
        setLanguages(data);
        if (data.length > 0) setSelectedLang(data[0].code);
      }
    }
    fetchLangs();
  }, []);

  // 🌟 魔法のAI自動入力ボタンを押した時の処理
  const handleAIGenerate = async () => {
    if (!newWord.trim()) {
      alert("First, type a word to generate details for!");
      return;
    }
    
    setIsGenerating(true);
    try {
      // サーバーアクションを呼び出してAIに考えてもらう
      const aiData = await generateWordDetails(newWord, selectedLang);
      
      // フォームに結果を流し込む！
      setNewTranslation(aiData.translation || "");
      setNewPos(aiData.part_of_speech || "");
      setNewExample(aiData.example_sentence || "");
      setNewExampleTranslation(aiData.example_translation || "");
      
    } catch (error) {
      alert("Oops! AI couldn't generate details. Try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddWord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWord || !newTranslation || !selectedLang) return;

    setIsSubmitting(true);
    const { error } = await supabase.from("vocab").insert([
      {
        language_code: selectedLang,
        word: newWord,
        translation: newTranslation,
        part_of_speech: newPos || null,
        example_sentence: newExample || null,
        example_translation: newExampleTranslation || null,
        is_remembered: false,
      },
    ]);

    if (!error) {
      // 成功したらフォームを空にする
      setNewWord("");
      setNewTranslation("");
      setNewPos("");
      setNewExample("");
      setNewExampleTranslation("");
      // リロードしてダッシュボードに反映（簡易的）
      window.location.reload();
    } else {
      alert("Error adding word.");
    }
    setIsSubmitting(false);
  };

  if (languages.length === 0) return null;

  return (
    <div className="bg-white rounded-[2.5rem] p-8 md:p-12 border-2 border-gray-200 shadow-sm relative overflow-hidden">
      <div className="absolute top-0 right-0 bg-blue-50 text-blue-600 font-black uppercase tracking-widest px-8 py-4 rounded-bl-[2.5rem] border-b-2 border-l-2 border-blue-100">
        Add New Word
      </div>

      <h2 className="text-3xl font-black mb-2 text-gray-900">Grow your Library</h2>
      <p className="text-gray-500 font-medium mb-8">Add new words manually or let AI do the heavy lifting.</p>

      <form onSubmit={handleAddWord} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Language</label>
            <select value={selectedLang} onChange={(e) => setSelectedLang(e.target.value)} className="w-full p-5 bg-gray-50 border-2 border-gray-100 rounded-3xl font-bold text-gray-700 outline-none focus:border-blue-500 transition-all appearance-none cursor-pointer">
              {languages.map((l) => (
                <option key={l.code} value={l.code}>{l.emoji} {l.name}</option>
              ))}
            </select>
          </div>

          <div className="relative">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Word</label>
            <div className="flex gap-2">
              <input type="text" value={newWord} onChange={(e) => setNewWord(e.target.value)} required placeholder="e.g. mangiare" className="flex-1 p-5 bg-gray-50 border-2 border-gray-100 rounded-3xl font-black text-xl outline-none focus:border-blue-500 transition-all" />
              
              {/* 🌟 これが魔法のボタンです！ */}
              <button 
                type="button" 
                onClick={handleAIGenerate} 
                disabled={isGenerating || !newWord.trim()}
                className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-black px-6 rounded-3xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-purple-200 disabled:opacity-50 disabled:scale-100 flex items-center justify-center min-w-[120px]"
              >
                {isGenerating ? "✨ Thinking..." : "✨ Auto-Fill"}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Meaning (English)</label>
            <input type="text" value={newTranslation} onChange={(e) => setNewTranslation(e.target.value)} required placeholder="e.g. to eat" className="w-full p-5 bg-gray-50 border-2 border-gray-100 rounded-3xl font-bold text-gray-700 outline-none focus:border-blue-500 transition-all" />
          </div>
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Part of Speech</label>
            <select value={newPos} onChange={(e) => setNewPos(e.target.value)} className="w-full p-5 bg-gray-50 border-2 border-gray-100 rounded-3xl font-bold text-gray-600 outline-none focus:border-blue-500 transition-all appearance-none">
              <option value="">Select...</option>
              <option value="Noun">Noun</option>
              <option value="Verb">Verb</option>
              <option value="Adjective">Adjective</option>
              <option value="Adverb">Adverb</option>
              <option value="Phrase">Phrase</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
             <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest ml-2">Example Sentence (Target)</label>
             <textarea value={newExample} onChange={(e) => setNewExample(e.target.value)} rows={2} placeholder="Mi piace mangiare la pizza." className="w-full p-5 bg-blue-50/50 border-2 border-blue-100 rounded-3xl font-medium text-gray-800 outline-none focus:border-blue-500 transition-all" />
          </div>
          <div>
             <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest ml-2">Example Translation (English)</label>
             <textarea value={newExampleTranslation} onChange={(e) => setNewExampleTranslation(e.target.value)} rows={2} placeholder="I like to eat pizza." className="w-full p-5 bg-blue-50/50 border-2 border-blue-100 rounded-3xl font-medium text-gray-600 outline-none focus:border-blue-500 transition-all" />
          </div>
        </div>

        <div className="pt-4">
          <button type="submit" disabled={isSubmitting} className="w-full bg-gray-900 text-white font-black text-xl py-5 rounded-[2rem] hover:bg-gray-800 shadow-xl transition-all disabled:opacity-50">
            {isSubmitting ? "Adding to Library..." : "➕ Add to Library"}
          </button>
        </div>
      </form>
    </div>
  );
}