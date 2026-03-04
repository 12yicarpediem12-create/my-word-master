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
  const [isDeleting, setIsDeleting] = useState(false);
  
  // 🌟 AIニュアンス（一時的な表示用ステート。DBには保存しない）
  const [isAskingAI, setIsAskingAI] = useState(false);
  const [tempNuance, setTempNuance] = useState<string | null>(null);

  const [editWord, setEditWord] = useState("");
  const [editTranslation, setEditTranslation] = useState("");
  const [editPos, setEditPos] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editExample, setEditExample] = useState("");
  const [editExampleTranslation, setEditExampleTranslation] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editConjugation, setEditConjugation] = useState("");
  const [editGender, setEditGender] = useState("");
  const [editVerbType, setEditVerbType] = useState("");

  useEffect(() => {
    async function fetchWord() {
      if (!wordId) return;
      const { data } = await supabase
        .from("vocab")
        .select(`*, categories:category_id ( id, name, full_path )`)
        .eq("id", wordId)
        .single();

      if (data) {
        setVocab(data);
        setEditWord(data.word);
        setEditTranslation(data.translation);
        setEditPos(data.part_of_speech || "");
        setEditNotes(data.notes || "");
        setEditExample(data.example_sentence || "");
        setEditExampleTranslation(data.example_translation || "");
        setEditCategory(data.category_id || "");
        setEditConjugation(data.conjugation || "");
        setEditGender(data.gender || "");
        setEditVerbType(data.verb_type || "");
      }
      setIsLoading(false);
    }
    fetchWord();
  }, [wordId]);

  const speak = useCallback((text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const langMap: Record<string, string> = { it: "it-IT", fr: "fr-FR", es: "es-ES", de: "de-DE" };
    utterance.lang = langMap[vocab?.language_code] || "en-US";
    window.speechSynthesis.speak(utterance);
  }, [vocab]);

  const handleAskNuance = async () => {
    if (!vocab) return;
    setIsAskingAI(true);
    setTempNuance(null);
    try {
      const nuance = await getWordNuance(vocab.word, vocab.language_code, vocab.translation);
      // 🌟 アスタリスクを確実に除去
      setTempNuance(String(nuance).replace(/\*\*/g, ''));
    } catch (err) {
      console.error(err);
    } finally {
      setIsAskingAI(false);
    }
  };

  const handleUpdate = async () => {
    const { error } = await supabase
      .from("vocab")
      .update({
        word: editWord, translation: editTranslation, part_of_speech: editPos || null,
        notes: editNotes || null, example_sentence: editExample || null,
        example_translation: editExampleTranslation || null, category_id: editCategory || null,
        conjugation: editConjugation || null, gender: editGender || null, verb_type: editVerbType || null,
      })
      .eq("id", wordId);
    if (!error) window.location.reload();
  };

  const handleToggleRemembered = async () => {
    const newStatus = !vocab.is_remembered;
    const { error } = await supabase.from("vocab").update({ is_remembered: newStatus }).eq("id", wordId);
    if (!error) setVocab({ ...vocab, is_remembered: newStatus });
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete?")) return;
    setIsDeleting(true);
    const { error } = await supabase.from("vocab").delete().eq("id", wordId);
    if (!error) router.push(`/study/${vocab.language_code}`);
  };

  if (isLoading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center font-bold">Loading...</div>;
  if (!vocab) return <div className="min-h-screen bg-gray-50 flex items-center justify-center font-bold">Not Found</div>;

  const getMainTopicName = () => {
    if (!vocab.categories?.full_path) return "General";
    return vocab.categories.full_path.split(" > ")[0];
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans pb-20">
      <nav className="bg-white border-b-2 border-gray-200 px-4 sm:px-8 py-5 flex justify-between items-center sticky top-0 z-50 shadow-sm">
        <Link href="/" className="text-2xl sm:text-3xl font-black text-blue-600 tracking-tighter">WordMaster.</Link>
        <button onClick={() => router.back()} className="text-xs sm:text-sm font-bold text-gray-400 hover:text-blue-600 uppercase tracking-widest">← Back</button>
      </nav>

      <main className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
        <div className="bg-white rounded-[2.5rem] sm:rounded-[3rem] p-6 sm:p-10 border-2 border-gray-200 shadow-lg relative overflow-hidden">
          
          <div className="absolute top-0 right-0 bg-blue-50 text-blue-600 font-black uppercase tracking-widest px-6 py-3 border-b-2 border-l-2 border-blue-100 text-[10px] sm:text-xs">
            {vocab.language_code}
          </div>

          {!isEditing ? (
            <div className="space-y-10 mt-6">
              {/* Word Header */}
              <div className="text-center">
                <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em] mb-3">Word</p>
                <div className="flex items-center justify-center gap-4 flex-wrap">
                  <h1 className="text-4xl sm:text-6xl font-black break-all leading-tight">{vocab.word}</h1>
                  <button onClick={() => speak(vocab.word)} className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-50 rounded-full flex items-center justify-center text-lg sm:text-xl hover:bg-blue-50 transition-all shadow-sm"> 🔊 </button>
                </div>
              </div>

              {/* Conjugation Guide */}
              {vocab.conjugation && (
                <div className="bg-amber-50 rounded-[2rem] p-6 sm:p-8 border-2 border-amber-100">
                  <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-4 flex items-center gap-2"><span>⚡</span> Conjugation Guide</p>
                  <p className="text-base sm:text-lg font-bold text-amber-900 whitespace-pre-wrap leading-relaxed italic">{vocab.conjugation}</p>
                </div>
              )}

              {/* Meaning */}
              <div className="text-center border-t-2 border-gray-50 pt-10">
                <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em] mb-3">Meaning</p>
                <h2 className="text-2xl sm:text-4xl font-bold text-blue-600 leading-tight">{vocab.translation}</h2>
              </div>

              {/* 🌟 1. Notes / Grammar Pattern (永続表示) */}
              <div className="border-t-2 border-gray-50 pt-10">
                <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em] mb-4">Notes / Grammar Pattern</p>
                <div className="bg-gray-50 rounded-[2rem] p-6 border-2 border-gray-100">
                  {vocab.notes ? (
                    <p className="text-sm font-medium text-gray-700 whitespace-pre-wrap leading-relaxed italic">
                      {vocab.notes}
                    </p>
                  ) : (
                    <p className="text-xs font-bold text-gray-300 text-center py-2 uppercase">No additional notes.</p>
                  )}
                </div>
              </div>

              {/* 🌟 2. Usage & Nuance (AI呼び出し・一時表示) */}
              <div className="border-t-2 border-gray-50 pt-10">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em]">Usage & Nuance</p>
                  <button 
                    onClick={handleAskNuance} 
                    disabled={isAskingAI} 
                    className="text-[10px] font-black bg-blue-50 text-blue-600 px-4 py-2 rounded-full hover:bg-blue-100 transition-all disabled:opacity-50"
                  >
                    {isAskingAI ? "✨ ANALYZING..." : "🪄 ASK AI FOR NUANCE"}
                  </button>
                </div>
                {tempNuance && (
                  <div className="bg-indigo-50/50 rounded-[2rem] p-6 border-2 border-dashed border-indigo-100 animate-in fade-in slide-in-from-top-2 duration-500">
                    <p className="text-sm font-medium text-gray-700 whitespace-pre-wrap leading-relaxed">{tempNuance}</p>
                    <p className="text-[9px] font-bold text-indigo-300 mt-4 uppercase tracking-tighter">※ This insight is temporary and will not be saved.</p>
                  </div>
                )}
              </div>

              {/* 🌟 修正: グリッドカードの文字溢れ・条件表示対応 */}
              <div className="flex flex-wrap gap-4 border-t-2 border-gray-50 pt-10">
                {/* Topic */}
                {vocab.categories && (
                  <Link 
                    href={`/study/${vocab.language_code}/topics/${vocab.category_id}`} 
                    className="flex-1 min-w-[140px] bg-indigo-50 p-5 rounded-3xl border border-indigo-100 group overflow-hidden"
                  >
                    <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-2 whitespace-nowrap">Topic</p>
                    <p className="font-bold text-indigo-900 text-sm sm:text-base break-words leading-tight group-hover:text-indigo-600 transition-colors">
                      {getMainTopicName()}
                    </p>
                  </Link>
                )}

                {/* Part of Speech */}
                <div className="flex-1 min-w-[140px] bg-gray-50 p-5 rounded-3xl border border-gray-100 overflow-hidden">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 whitespace-nowrap">Part of Speech</p>
                  <p className="font-bold text-gray-800 text-sm sm:text-base break-words leading-tight">
                    {vocab.part_of_speech || "---"}
                  </p>
                </div>

                {/* 🌟 性(Gender) or 動詞型(Verb Type) の出し分け */}
                {vocab.part_of_speech === 'Verb' ? (
                  <div className="flex-1 min-w-[140px] bg-emerald-50 p-5 rounded-3xl border border-emerald-100 overflow-hidden">
                    <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-2 whitespace-nowrap">Verb Type</p>
                    <p className="font-bold text-emerald-800 text-[11px] sm:text-sm break-all leading-tight">
                      {vocab.verb_type || "---"}
                    </p>
                  </div>
                ) : vocab.part_of_speech === 'Noun' ? (
                  <div className="flex-1 min-w-[140px] bg-emerald-50 p-5 rounded-3xl border border-emerald-100 overflow-hidden">
                    <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-2 whitespace-nowrap">Gender</p>
                    <p className="font-bold text-emerald-800 text-sm sm:text-base break-words leading-tight">
                      {vocab.gender || "---"}
                    </p>
                  </div>
                ) : null}

                {/* Mastery */}
                <div className="flex-1 min-w-[120px] bg-gray-50 p-5 rounded-3xl border border-gray-100 flex flex-col items-center justify-center">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Mastery</p>
                  <button 
                    onClick={handleToggleRemembered} 
                    className={`w-full py-2 px-3 rounded-2xl font-black text-[10px] transition-all uppercase tracking-widest shadow-sm ${vocab.is_remembered ? "bg-green-500 text-white" : "bg-orange-100 text-orange-600"}`}
                  >
                    {vocab.is_remembered ? "Mastered" : "Learning"}
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-6">
                <button onClick={() => setIsEditing(true)} className="flex-1 bg-gray-900 text-white font-black py-4 rounded-2xl sm:rounded-[2rem] hover:bg-gray-800 transition-all shadow-xl active:scale-[0.98]">✏️ Edit Details</button>
                <button onClick={handleDelete} disabled={isDeleting} className="w-full sm:w-auto px-8 bg-red-50 text-red-500 font-black py-4 rounded-2xl sm:rounded-[2rem] hover:bg-red-100 transition-colors">🗑️ Delete</button>
              </div>
            </div>
          ) : (
            /* 編集モード (簡略化して掲載) */
            <div className="space-y-6 mt-10">
              <h2 className="text-2xl font-black tracking-tight mb-6">Edit Word Details</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input type="text" value={editWord} onChange={(e) => setEditWord(e.target.value)} className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold" placeholder="Word" />
                  <input type="text" value={editTranslation} onChange={(e) => setEditTranslation(e.target.value)} className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold" placeholder="Meaning" />
                </div>
                <textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} rows={5} className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-medium" placeholder="Notes / Grammar Pattern" />
                <div className="flex gap-4 pt-6">
                  <button onClick={() => setIsEditing(false)} className="flex-1 bg-gray-100 text-gray-500 font-black py-4 rounded-2xl">Cancel</button>
                  <button onClick={handleUpdate} className="flex-[2] bg-blue-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-100 hover:bg-blue-700">Save Changes</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}