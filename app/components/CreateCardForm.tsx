"use client";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { generateVocabInfo } from "../actions/ai";

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
  const [newCategoryId, setNewCategoryId] = useState<string | null>(null); 
  const [newExample, setNewExample] = useState("");
  const [newExampleTranslation, setNewExampleTranslation] = useState("");
  const [newConjugation, setNewConjugation] = useState("");
  const [newNotes, setNewNotes] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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

  // 🌟 重複チェックロジック（言語・品詞・スペルの3つを検証）
  const checkDuplicate = async (wordToCheck: string, lang: string, posToCheck: string) => {
    if (!posToCheck) return false; // 品詞が未入力の場合はチェックをスキップ

    const articlesRegex = /^(il |la |lo |l'|i |gli |le |un |uno |una |un'|der |die |das |el |la |los |las |le |la |les |l')/i;
    const cleanInputWord = wordToCheck.toLowerCase().replace(articlesRegex, "").trim();

    // 指定された言語の単語をすべて取得
    const { data } = await supabase
      .from("vocab")
      .select("word, part_of_speech")
      .eq("language_code", lang);
    
    if (data) {
      return data.some(item => {
        const itemClean = item.word.toLowerCase().replace(articlesRegex, "").trim();
        const posMatch = (item.part_of_speech || "").toLowerCase() === posToCheck.toLowerCase();
        // スペル（冠詞抜き）と品詞が両方一致するか
        return itemClean === cleanInputWord && posMatch;
      });
    }
    return false;
  };

  const handleAIGenerate = async () => {
    if (!newWord.trim()) return;
    setErrorMsg(null);
    setIsGenerating(true);

    try {
      const aiData = await generateVocabInfo(newWord + (newHint ? ` (Hint: ${newHint})` : ""), selectedLang);
      
      if (aiData?.error) {
        setErrorMsg("AI Error: " + aiData.error);
        return;
      }

      if (aiData) {
        // AIが返してきた品詞を使って重複チェック
        const isDup = await checkDuplicate(aiData.word || newWord, selectedLang, aiData.part_of_speech);
        if (isDup) {
          setErrorMsg(`"${aiData.word || newWord}" as ${aiData.part_of_speech} is already in your library.`);
          setIsGenerating(false);
          return;
        }

        setNewWord(aiData.word || newWord);
        setNewTranslation(String(aiData.translation || ""));
        setNewPos(String(aiData.part_of_speech || ""));
        setNewGender(String(aiData.gender || ""));
        setNewVerbType(String(aiData.verb_type || ""));
        setNewCategoryId(aiData.category_id || null);
        setNewExample(String(aiData.example_sentence || ""));
        setNewExampleTranslation(String(aiData.example_translation || ""));
        setNewConjugation(String(aiData.conjugation || ""));
        setNewNotes(String(aiData.notes || ""));
      }
    } catch (error: any) {
      setErrorMsg("System Error: " + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddWord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWord || !newTranslation || !selectedLang) return;
    setIsSubmitting(true);
    setErrorMsg(null);

    // 保存前に「品詞・言語・スペル」の3つで最終チェック
    const isDup = await checkDuplicate(newWord, selectedLang, newPos);
    if (isDup) {
      setErrorMsg("This word with the same Part of Speech already exists.");
      setIsSubmitting(false);
      return;
    }
    
    const { error } = await supabase.from("vocab").insert([{
      language_code: selectedLang,
      word: newWord.trim(),
      translation: newTranslation.trim(),
      part_of_speech: newPos || null,
      gender: newGender || null,
      verb_type: newVerbType || null,
      category_id: newCategoryId, 
      example_sentence: newExample || null,
      example_translation: newExampleTranslation || null,
      conjugation: newConjugation || null,
      notes: newNotes || null,
      is_remembered: false,
    }]);

    if (!error) window.location.reload();
    else {
      setErrorMsg("Database Error: " + error.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-[2rem] p-6 md:p-10 border-2 border-gray-200 shadow-sm relative overflow-hidden">
      <div className="absolute top-0 right-0 bg-blue-50 text-blue-600 font-black text-[10px] uppercase tracking-widest px-6 py-3 rounded-bl-2xl border-b-2 border-l-2 border-blue-100">
        ADD NEW WORD
      </div>

      {errorMsg && (
        <div className="mt-10 p-4 bg-red-50 border-2 border-red-200 text-red-600 font-bold rounded-2xl flex items-center justify-between">
          <span>⚠️ {errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="text-xl">×</button>
        </div>
      )}

      <form onSubmit={handleAddWord} className="flex flex-col gap-y-8 mt-10">
        
        {/* Row 1: Language & Word */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <div className="flex flex-col gap-2">
            <label className="text-[9px] font-black text-gray-400 uppercase tracking-tight ml-2">Language</label>
            <select value={selectedLang} onChange={(e) => setSelectedLang(e.target.value)} className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold focus:border-blue-500 outline-none">
              {languages.map((l) => (
                <option key={l.code} value={l.code}>{l.emoji} {l.name}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[9px] font-black text-gray-400 uppercase tracking-tight ml-2">Word</label>
            <div className="flex gap-2 w-full">
              <input type="text" value={newWord} onChange={(e) => setNewWord(e.target.value)} required placeholder="e.g. mela" className="flex-1 p-4 border-2 rounded-2xl font-bold bg-gray-50 border-gray-100 focus:border-blue-500 outline-none min-w-0" />
              <button type="button" onClick={handleAIGenerate} disabled={isGenerating || !newWord.trim()} className="px-5 py-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-black rounded-2xl text-xs hover:opacity-90 transition-all shadow-md disabled:opacity-50 shrink-0">
                {isGenerating ? "..." : "Auto-Fill"}
              </button>
            </div>
          </div>
        </div>

        {/* Row 2: Meaning & POS (Label fix applied) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-[9px] font-black text-gray-400 uppercase tracking-tight ml-2">Meaning</label>
            <input type="text" value={newTranslation} onChange={(e) => setNewTranslation(e.target.value)} required placeholder="English translation" className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold outline-none" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[9px] font-black text-gray-400 uppercase tracking-tight ml-2 whitespace-nowrap">Part of Speech</label>
            <input type="text" value={newPos} onChange={(e) => setNewPos(e.target.value)} placeholder="e.g. Noun" className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold outline-none" />
          </div>
        </div>

        {/* Row 3: Gender, Verb Type, Category */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-[9px] font-black text-emerald-500 uppercase tracking-tight ml-2">Gender</label>
            <input type="text" value={newGender} onChange={(e) => setNewGender(e.target.value)} placeholder="Feminine" className="w-full p-4 bg-emerald-50/30 border-2 border-emerald-100 rounded-2xl font-bold text-sm text-emerald-800" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[9px] font-black text-emerald-500 uppercase tracking-tight ml-2">Verb Type</label>
            <input type="text" value={newVerbType} onChange={(e) => setNewVerbType(e.target.value)} placeholder="Transitive" className="w-full p-4 bg-emerald-50/30 border-2 border-emerald-100 rounded-2xl font-bold text-sm text-emerald-800" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[9px] font-black text-purple-500 uppercase tracking-tight ml-2">Category ID</label>
            <input type="text" value={newCategoryId || ""} onChange={(e) => setNewCategoryId(e.target.value || null)} placeholder="Auto" className="w-full p-4 bg-purple-50/30 border-2 border-purple-100 rounded-2xl font-bold text-[10px] text-purple-800 truncate" />
          </div>
        </div>

        <button type="submit" disabled={isSubmitting} className="w-full bg-gray-900 text-white font-black text-lg py-5 rounded-[2rem] hover:bg-black transition-all shadow-lg disabled:bg-gray-400">
          {isSubmitting ? "ADDING..." : "+ ADD TO LIBRARY"}
        </button>
      </form>
    </div>
  );
}