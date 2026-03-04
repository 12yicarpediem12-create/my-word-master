"use client";
import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { getWordNuance } from "../../actions/ai";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function WordDetail() {
  const params = useParams();
  const router = useRouter();
  const wordId = params.id as string;
  const [vocab, setVocab] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  
  // 🌟 AIニュアンス（一時表示用ステート）
  const [isAskingAI, setIsAskingAI] = useState(false);
  const [tempNuance, setTempNuance] = useState<string | null>(null);

  useEffect(() => {
    async function fetchWord() {
      if (!wordId) return;
      const { data } = await supabase.from("vocab").select(`*, categories:category_id ( id, name, full_path )`).eq("id", wordId).single();
      if (data) setVocab(data);
      setIsLoading(false);
    }
    fetchWord();
  }, [wordId]);

  const handleAskNuance = async () => {
    if (!vocab) return;
    setIsAskingAI(true);
    setTempNuance(null);
    try {
      const nuance = await getWordNuance(vocab.word, vocab.language_code, vocab.translation);
      // 🌟 アスタリスクを確実に除去
      setTempNuance(String(nuance).replace(/\*\*/g, ''));
    } catch (err) { console.error(err); }
    finally { setIsAskingAI(false); }
  };

  if (isLoading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center font-bold">Loading...</div>;
  if (!vocab) return <div className="min-h-screen bg-gray-50 flex items-center justify-center font-bold">Word Not Found.</div>;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans pb-20">
      <nav className="bg-white border-b-2 border-gray-200 px-6 py-5 flex justify-between items-center sticky top-0 z-50">
        <Link href="/" className="text-2xl font-black text-blue-600 tracking-tighter">WordMaster.</Link>
        <button onClick={() => router.back()} className="text-[10px] font-black text-gray-400 uppercase tracking-widest">← Back</button>
      </nav>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-[2.5rem] p-6 sm:p-10 border-2 border-gray-200 shadow-lg relative overflow-hidden">
          
          <div className="absolute top-0 right-0 bg-blue-50 text-blue-600 font-black uppercase tracking-widest px-6 py-3 border-b-2 border-l-2 border-blue-100 text-[10px]">
            {vocab.language_code}
          </div>

          <div className="space-y-10 mt-6">
            {/* Word Header */}
            <div className="text-center">
              <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-3">Word</p>
              <h1 className="text-4xl sm:text-6xl font-black break-all leading-tight">{vocab.word}</h1>
            </div>

            {/* 🌟 Conjugation (Verbの時、またはデータがある時) */}
            {vocab.conjugation && (
              <div className="bg-amber-50 rounded-[2rem] p-6 sm:p-8 border-2 border-amber-100">
                <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-4 flex items-center gap-2"><span>⚡</span> Conjugation Guide</p>
                <p className="text-base sm:text-lg font-bold text-amber-900 whitespace-pre-wrap leading-relaxed italic">{vocab.conjugation}</p>
              </div>
            )}

            {/* Meaning */}
            <div className="text-center border-t-2 border-gray-50 pt-10">
              <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-3">Meaning</p>
              <h2 className="text-2xl sm:text-4xl font-bold text-blue-600 leading-tight">{vocab.translation}</h2>
            </div>

            {/* 🌟 Notes / Grammar Pattern (永続表示) */}
            <div className="border-t-2 border-gray-50 pt-10">
              <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-4">Notes / Grammar Pattern</p>
              <div className="bg-gray-50 rounded-[2rem] p-6 border-2 border-gray-100">
                <p className="text-sm font-medium text-gray-700 whitespace-pre-wrap leading-relaxed italic">
                  {vocab.notes || "No grammar notes added."}
                </p>
              </div>
            </div>

            {/* Usage & Nuance (AI一時表示) */}
            <div className="border-t-2 border-gray-50 pt-10">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Usage & Nuance</p>
                <button onClick={handleAskNuance} disabled={isAskingAI} className="text-[9px] font-black bg-blue-50 text-blue-600 px-4 py-2 rounded-full hover:bg-blue-100 disabled:opacity-50">
                  {isAskingAI ? "✨ ANALYZING..." : "🪄 ASK AI"}
                </button>
              </div>
              {tempNuance && (
                <div className="bg-indigo-50/50 rounded-[2rem] p-6 border-2 border-dashed border-indigo-100">
                  <p className="text-sm font-medium text-gray-700 whitespace-pre-wrap leading-relaxed">{tempNuance}</p>
                </div>
              )}
            </div>

            {/* 🌟 修正: グリッドカード (文字溢れ & 条件表示) */}
            <div className="flex flex-wrap gap-4 border-t-2 border-gray-50 pt-10">
              {vocab.categories && (
                <div className="flex-1 min-w-[140px] bg-indigo-50 p-5 rounded-3xl border border-indigo-100">
                  <p className="text-[9px] font-black text-indigo-400 uppercase tracking-tight mb-2 whitespace-nowrap">Topic</p>
                  <p className="font-bold text-indigo-900 text-sm break-words leading-tight">
                    {vocab.categories.full_path.split(" > ")[0]}
                  </p>
                </div>
              )}

              <div className="flex-1 min-w-[140px] bg-gray-50 p-5 rounded-3xl border border-gray-100">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-tight mb-2 whitespace-nowrap">Part of Speech</p>
                <p className="font-bold text-gray-800 text-sm break-words leading-tight">{vocab.part_of_speech || "---"}</p>
              </div>

              {/* 🌟 条件表示: 動詞なら型、名詞なら性を出す */}
              {vocab.part_of_speech === 'Verb' ? (
                <div className="flex-1 min-w-[140px] bg-emerald-50 p-5 rounded-3xl border border-emerald-100">
                  <p className="text-[9px] font-black text-emerald-500 uppercase tracking-tight mb-2 whitespace-nowrap">Verb Type</p>
                  <p className="font-bold text-emerald-800 text-[11px] break-all leading-tight">{vocab.verb_type || "---"}</p>
                </div>
              ) : vocab.part_of_speech === 'Noun' ? (
                <div className="flex-1 min-w-[140px] bg-emerald-50 p-5 rounded-3xl border border-emerald-100">
                  <p className="text-[9px] font-black text-emerald-500 uppercase tracking-tight mb-2 whitespace-nowrap">Gender</p>
                  <p className="font-bold text-emerald-800 text-sm break-words leading-tight">{vocab.gender || "---"}</p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}