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
  const [newHint, setNewHint] = useState("");
  const [newTranslation, setNewTranslation] = useState("");
  const [newPos, setNewPos] = useState("");
  const [newGender, setNewGender] = useState("");
  const [newVerbType, setNewVerbType] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newExample, setNewExample] = useState("");
  const [newExampleTranslation, setNewExampleTranslation] = useState("");
  const [newConjugation, setNewConjugation] = useState("");

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
    if (!newWord.trim()) return;
    setIsGenerating(true);
    try {
      const aiData = await generateWordDetails(newWord, selectedLang, newHint);
      if (aiData && !aiData.error) {
        if (aiData.word_with_article) setNewWord(aiData.word_with_article);
        setNewTranslation(String(aiData.translation || ""));
        setNewPos(String(aiData.part_of_speech || ""));
        setNewGender(String(aiData.gender || ""));
        setNewVerbType(String(aiData.verb_type || ""));
        setNewCategory(String(aiData.category || "Other"));
        setNewExample(String(aiData.example_sentence || ""));
        setNewExampleTranslation(String(aiData.example_translation || ""));
        
        if (aiData.conjugation && typeof aiData.conjugation === "object") {
          const formatted = Object.entries(aiData.conjugation).map(([tense, forms]) => {
            const cleanTense = tense.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
            const conj = Object.entries(forms as any).map(([p, w]) => `${p} ${w}`).join(", ");
            return `■ ${cleanTense}:\n${conj}`;
          }).join("\n\n");
          setNewConjugation(formatted);
        } else {
          setNewConjugation("");
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddWord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWord || !newTranslation || !selectedLang) return;
    setIsSubmitting(true);
    const { error } = await supabase.from("vocab").insert([{
      language_code: selectedLang,
      word: newWord.trim(),
      translation: newTranslation.trim(),
      part_of_speech: newPos || null,
      gender: newGender || null,
      verb_type: newVerbType || null,
      category: newCategory || "Other",
      example_sentence: newExample || null,
      example_translation: newExampleTranslation || null,
      conjugation: newConjugation || null,
      is_remembered: false,
    }]);
    if (!error) window.location.reload();
    setIsSubmitting(false);
  };

  if (languages.length === 0) return null;

  return (
    <div className="bg-white rounded-[2rem] p-6 md:p-10 border-2 border-gray-200 shadow-sm relative overflow-hidden">
      <div className="absolute top-0 right-0 bg-blue-50 text-blue-600 font-black text-[10px] md:text-xs uppercase tracking-widest px-6 py-3 rounded-bl-2xl border-b-2 border-l-2 border-blue-100">
        ADD NEW WORD
      </div>

      <form onSubmit={handleAddWord} className="flex flex-col gap-y-8 mt-10">
        
        {/* ROW 1: Language & Word (ここを完全に統一) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Language</label>
            <select value={selectedLang} onChange={(e) => setSelectedLang(e.target.value)} className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold text-base outline-none focus:border-blue-500 transition-all cursor-pointer">
              {languages.map((l) => (
                <option key={l.code} value={l.code}>{l.emoji} {l.name}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Word</label>
            <div className="flex gap-2">
              {/* 🌟 変更: font-bold / text-base にしてMeaningと合わせました */}
              <input type="text" value={newWord} onChange={(e) => setNewWord(e.target.value)} required placeholder="e.g. mela" className="flex-1 p-4 border-2 rounded-2xl font-bold text-base bg-gray-50 border-gray-100 focus:border-blue-500 outline-none transition-all" />
              {/* 🌟 変更: py-4 を追加して入力欄と高さをピクセル単位で合わせました */}
              <button type="button" onClick={handleAIGenerate} disabled={isGenerating || !newWord.trim()} className="px-6 py-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-black rounded-2xl text-sm hover:opacity-90 active:scale-95 transition-all shadow-md disabled:opacity-50 whitespace-nowrap">
                {isGenerating ? "..." : "Auto-Fill"}
              </button>
            </div>
            <input type="text" value={newHint} onChange={(e) => setNewHint(e.target.value)} placeholder="Hint: noun, verb, specific meaning..." className="w-full p-2 bg-blue-50/30 border border-blue-100 rounded-xl text-[10px] font-bold text-blue-500 outline-none placeholder:text-blue-300" />
          </div>
        </div>

        {/* ROW 2: Meaning & POS (ここが基準のサイズ) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Meaning (English)</label>
            <input type="text" value={newTranslation} onChange={(e) => setNewTranslation(e.target.value)} required placeholder="e.g. Apple" className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold text-base focus:border-blue-500 outline-none" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Part of Speech</label>
            <input type="text" value={newPos} onChange={(e) => setNewPos(e.target.value)} placeholder="e.g. Noun" className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold text-base focus:border-blue-500 outline-none" />
          </div>
        </div>

        {/* ROW 3: Tags */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-emerald-500 uppercase tracking-widest ml-2">Gender</label>
            <input type="text" value={newGender} onChange={(e) => setNewGender(e.target.value)} placeholder="Feminine" className="w-full p-4 bg-emerald-50/30 border-2 border-emerald-100 rounded-2xl font-bold text-sm text-emerald-800 outline-none" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-emerald-500 uppercase tracking-widest ml-2">Verb Type</label>
            <input type="text" value={newVerbType} onChange={(e) => setNewVerbType(e.target.value)} placeholder="Transitive" className="w-full p-4 bg-emerald-50/30 border-2 border-emerald-100 rounded-2xl font-bold text-sm text-emerald-800 outline-none" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-purple-500 uppercase tracking-widest ml-2">Category</label>
            <input type="text" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="Food" className="w-full p-4 bg-purple-50/30 border-2 border-purple-100 rounded-2xl font-bold text-sm text-purple-800 outline-none" />
          </div>
        </div>

        {/* Conjugation */}
        {newConjugation && (
          <div className="flex flex-col gap-2">
             <label className="text-[10px] font-black text-amber-500 uppercase tracking-widest ml-2">Conjugation</label>
             <div className="bg-amber-50/50 p-6 rounded-2xl border-2 border-amber-100 text-sm font-bold text-amber-900 whitespace-pre-wrap leading-relaxed shadow-inner">
               {newConjugation}
             </div>
          </div>
        )}

        {/* Examples */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest ml-2">Example Sentence</label>
            <textarea value={newExample} onChange={(e) => setNewExample(e.target.value)} rows={2} placeholder="Sentence..." className="w-full p-4 bg-blue-50/30 border-2 border-blue-100 rounded-2xl font-medium text-sm focus:border-blue-400 outline-none resize-none" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest ml-2">Example Translation</label>
            <textarea value={newExampleTranslation} onChange={(e) => setNewExampleTranslation(e.target.value)} rows={2} placeholder="Translation..." className="w-full p-4 bg-blue-50/30 border-2 border-blue-100 rounded-2xl font-medium text-sm focus:border-blue-400 outline-none resize-none" />
          </div>
        </div>

        <button type="submit" disabled={isSubmitting} className="w-full bg-gray-900 text-white font-black text-lg py-5 rounded-[2rem] hover:bg-black hover:-translate-y-1 transition-all shadow-lg disabled:bg-gray-400 mt-2">
          {isSubmitting ? "ADDING..." : "+ ADD TO LIBRARY"}
        </button>
      </form>
    </div>
  );
}