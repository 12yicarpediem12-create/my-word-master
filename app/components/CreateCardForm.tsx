"use client";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
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
  const [isGenerating, setIsGenerating] = useState(false);

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

  const handleAIGenerate = async () => {
    if (!newWord.trim()) {
      alert("First, type a word to generate details for!");
      return;
    }
    
    setIsGenerating(true);
    try {
      const aiData = await generateWordDetails(newWord, selectedLang);
      
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
      setNewWord("");
      setNewTranslation("");
      setNewPos("");
      setNewExample("");
      setNewExampleTranslation("");
      window.location.reload();
    } else {
      alert("Error adding word.");
    }
    setIsSubmitting(false);
  };

  if (languages.length === 0) return null;

  return (
    <div className="bg-white rounded-[2.5rem] p-6 md:p-12 border-2 border-gray-200 shadow-sm relative overflow-hidden">
      
      {/* 🌟 右上のバッジ: スマホでは少し小さく調整 */}
      <div className="absolute top-0 right-0 bg-blue-50 text-blue-600 font-black text-[10px] md:text-sm uppercase tracking-widest px-4 md:px-8 py-3 md:py-4 rounded-bl-[1.5rem] md:rounded-bl-[2.5rem] border-b-2 border-l-2 border-blue-100">
        Add New Word
      </div>

      <h2 className="text-2xl md:text-3xl font-black mb-2 text-gray-900 mt-6 md:mt-0">Grow your Library</h2>
      <p className="text-sm md:text-base text-gray-500 font-medium mb-8">Add new words manually or let AI do the heavy lifting.</p>

      <form onSubmit={handleAddWord} className="space-y-6">
        
        {/* 1段目: Language & Word */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Language セレクト */}
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 block mb-1">Language</label>
            <select 
              value={selectedLang} 
              onChange={(e) => setSelectedLang(e.target.value)} 
              className="w-full p-4 md:p-5 bg-gray-50 border-2 border-gray-100 rounded-2xl md:rounded-3xl font-bold text-gray-700 outline-none focus:border-blue-500 transition-all appearance-none cursor-pointer"
            >
              {languages.map((l) => (
                <option key={l.code} value={l.code}>{l.emoji} {l.name}</option>
              ))}
            </select>
          </div>

          {/* Word 入力 & Auto-Fill ボタン */}
          <div className="relative">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 block mb-1">Word</label>
            {/* 🛠 修正: スマホでは flex-col (縦並び)、PCでは flex-row (横並び) にして被りを防止！ */}
            <div className="flex flex-col md:flex-row gap-3">
              <input 
                type="text" 
                value={newWord} 
                onChange={(e) => setNewWord(e.target.value)} 
                required 
                placeholder="e.g. mangiare" 
                className="flex-1 p-4 md:p-5 bg-gray-50 border-2 border-gray-100 rounded-2xl md:rounded-3xl font-black text-lg md:text-xl outline-none focus:border-blue-500 transition-all w-full" 
              />
              
              <button 
                type="button" 
                onClick={handleAIGenerate} 
                disabled={isGenerating || !newWord.trim()}
                // 🛠 修正: スマホ用に py-4、PC用に py-5 にしてボタンの高さを揃え、幅を w-full から md:w-auto に切り替え
                className="w-full md:w-auto bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-black px-6 py-4 md:py-0 rounded-2xl md:rounded-3xl hover:-translate-y-1 transition-all shadow-lg shadow-purple-200 disabled:opacity-50 disabled:hover:translate-y-0 flex items-center justify-center whitespace-nowrap"
              >
                {isGenerating ? "✨ Thinking..." : "✨ Auto-Fill"}
              </button>
            </div>
          </div>
        </div>

        {/* 2段目: Meaning & Part of Speech */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 block mb-1">Meaning (English)</label>
            <input 
              type="text" 
              value={newTranslation} 
              onChange={(e) => setNewTranslation(e.target.value)} 
              required 
              placeholder="e.g. to eat" 
              className="w-full p-4 md:p-5 bg-gray-50 border-2 border-gray-100 rounded-2xl md:rounded-3xl font-bold text-gray-700 outline-none focus:border-blue-500 transition-all" 
            />
          </div>
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 block mb-1">Part of Speech</label>
            <select 
              value={newPos} 
              onChange={(e) => setNewPos(e.target.value)} 
              className="w-full p-4 md:p-5 bg-gray-50 border-2 border-gray-100 rounded-2xl md:rounded-3xl font-bold text-gray-600 outline-none focus:border-blue-500 transition-all appearance-none"
            >
              <option value="">Select...</option>
              <option value="Noun">Noun</option>
              <option value="Verb">Verb</option>
              <option value="Adjective">Adjective</option>
              <option value="Adverb">Adverb</option>
              <option value="Phrase">Phrase</option>
            </select>
          </div>
        </div>

        {/* 3段目: Examples */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
             <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest ml-2 block mb-1">Example Sentence (Target)</label>
             <textarea 
                value={newExample} 
                onChange={(e) => setNewExample(e.target.value)} 
                rows={2} 
                placeholder="Mi piace mangiare la pizza." 
                className="w-full p-4 md:p-5 bg-blue-50/50 border-2 border-blue-100 rounded-2xl md:rounded-3xl font-medium text-gray-800 outline-none focus:border-blue-500 transition-all resize-none" 
             />
          </div>
          <div>
             <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest ml-2 block mb-1">Example Translation (English)</label>
             <textarea 
                value={newExampleTranslation} 
                onChange={(e) => setNewExampleTranslation(e.target.value)} 
                rows={2} 
                placeholder="I like to eat pizza." 
                className="w-full p-4 md:p-5 bg-blue-50/50 border-2 border-blue-100 rounded-2xl md:rounded-3xl font-medium text-gray-600 outline-none focus:border-blue-500 transition-all resize-none" 
             />
          </div>
        </div>

        {/* 登録ボタン */}
        <div className="pt-4">
          <button 
            type="submit" 
            disabled={isSubmitting} 
            // 🛠 修正: スマホでは文字サイズを少し落とし(text-lg)、パディングを調整
            className="w-full bg-gray-900 text-white font-black text-lg md:text-xl py-4 md:py-5 rounded-2xl md:rounded-[2rem] hover:bg-gray-800 hover:-translate-y-1 shadow-xl transition-all disabled:opacity-50 disabled:hover:translate-y-0"
          >
            {isSubmitting ? "Adding to Library..." : "➕ Add to Library"}
          </button>
        </div>
      </form>
    </div>
  );
}