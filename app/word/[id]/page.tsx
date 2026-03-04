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
  const [isAskingAI, setIsAskingAI] = useState(false);

  // 編集用の State
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

      const { data, error } = await supabase
        .from("vocab")
        .select(`
          *,
          categories:category_id (
            id,
            name,
            full_path
          )
        `)
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

  const speak = useCallback((text: string, isEnglish: boolean = false) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    window.speechSynthesis.resume();
    const utterance = new SpeechSynthesisUtterance(text);
    if (isEnglish) {
      utterance.lang = "en-US";
    } else {
      const langMap: Record<string, string> = {
        it: "it-IT", fr: "fr-FR", es: "es-ES", de: "de-DE", pt: "pt-PT", ja: "ja-JP", ko: "ko-KR", ru: "ru-RU", zh: "zh-CN"
      };
      utterance.lang = langMap[vocab?.language_code] || `${vocab?.language_code}-${vocab?.language_code?.toUpperCase()}`;
    }
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  }, [vocab]);

  // 🌟 AIにニュアンスを尋ねる関数 (Gemini 2.5 Flash使用)
  const handleAskNuance = async () => {
    if (!vocab) return;
    setIsAskingAI(true);
    try {
      const nuance = await getWordNuance(vocab.word, vocab.language_code, vocab.translation);
      
      // エラー文字列が返ってきた場合はDB更新をスキップ
      if (nuance.startsWith("Sorry") || nuance.startsWith("Could not")) {
        alert(nuance);
        return;
      }

      const { error } = await supabase
        .from("vocab")
        .update({ notes: nuance })
        .eq("id", wordId);

      if (!error) {
        setVocab({ ...vocab, notes: nuance });
        setEditNotes(nuance);
      }
    } catch (err) {
      console.error("Failed to fetch nuance:", err);
    } finally {
      setIsAskingAI(false);
    }
  };

  // 🌟 ノートを消去して「元の状態」に戻す関数
  const handleClearNotes = async () => {
    if (!window.confirm("Are you sure you want to clear these notes?")) return;
    
    const { error } = await supabase
      .from("vocab")
      .update({ notes: null })
      .eq("id", wordId);

    if (!error) {
      setVocab({ ...vocab, notes: null });
      setEditNotes("");
    }
  };

  const handleUpdate = async () => {
    const { error } = await supabase
      .from("vocab")
      .update({
        word: editWord,
        translation: editTranslation,
        part_of_speech: editPos || null,
        notes: editNotes || null,
        example_sentence: editExample || null,
        example_translation: editExampleTranslation || null,
        category_id: editCategory || null,
        conjugation: editConjugation || null,
        gender: editGender || null,
        verb_type: editVerbType || null,
      })
      .eq("id", wordId);

    if (!error) {
      router.refresh();
      setIsEditing(false);
      window.location.reload(); 
    }
  };

  const handleToggleRemembered = async () => {
    const newStatus = !vocab.is_remembered;
    const { error } = await supabase.from("vocab").update({ is_remembered: newStatus }).eq("id", wordId);
    if (!error) setVocab({ ...vocab, is_remembered: newStatus });
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this word?")) return;
    setIsDeleting(true);
    const { error } = await supabase.from("vocab").delete().eq("id", wordId);
    if (!error) router.push(`/study/${vocab.language_code}`);
    else setIsDeleting(false);
  };

  if (isLoading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center font-bold text-gray-400">Loading...</div>;
  if (!vocab) return <div className="min-h-screen bg-gray-50 flex items-center justify-center font-bold text-gray-900 underline"><Link href="/">Word Not Found.</Link></div>;

  const getMainTopicName = () => {
    if (!vocab.categories?.full_path) return "General";
    return vocab.categories.full_path.split(" > ")[0];
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans pb-20">
      <nav className="bg-white border-b-2 border-gray-200 px-8 py-5 flex justify-between items-center sticky top-0 z-50 shadow-sm">
        <Link href="/" className="text-3xl font-black tracking-tighter text-blue-600">WordMaster.</Link>
        <button onClick={() => router.back()} className="text-sm font-bold text-gray-500 hover:text-blue-600 flex items-center gap-2 uppercase tracking-widest"><span>←</span> Back</button>
      </nav>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        <div className="bg-white rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-10 border-2 border-gray-200 shadow-lg relative overflow-hidden">
          
          <div className="absolute top-0 right-0 flex items-center z-20">
            <div className="bg-blue-50 text-blue-600 font-black uppercase tracking-widest px-6 py-3 border-b-2 border-l-2 border-blue-100 text-xs sm:text-sm">
              {vocab.language_code}
            </div>
            {vocab.categories && (
              <Link
                href={`/study/${vocab.language_code}/topics/${vocab.category_id}`}
                className="bg-indigo-600 text-white font-black uppercase tracking-widest px-4 py-3 rounded-bl-[1.5rem] text-[10px] sm:text-xs hover:bg-indigo-700 transition-colors shadow-sm"
              >
                {getMainTopicName()}
              </Link>
            )}
          </div>

          {!isEditing ? (
            <div className="space-y-8 sm:space-y-10 mt-10">
              {/* 単語メイン表示 */}
              <div className="text-center">
                <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em] mb-3">Word</p>
                <div className="flex items-center justify-center gap-3 sm:gap-4 flex-wrap">
                  <h1 className="text-5xl sm:text-6xl font-black text-gray-900 tracking-tight break-all">{vocab.word}</h1>
                  <button onClick={() => speak(vocab.word)} className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-50 rounded-full flex items-center justify-center text-lg sm:text-xl hover:bg-blue-50 transition-all shadow-sm shrink-0"> 🔊 </button>
                </div>
              </div>

              {/* 活用ガイド */}
              {vocab.conjugation && (
                <div className="bg-amber-50 rounded-[2rem] p-6 sm:p-8 border-2 border-amber-100">
                  <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <span>⚡</span> Conjugation Guide
                  </p>
                  <div className="bg-white/60 rounded-2xl p-4 sm:p-5 border border-amber-200">
                    <p className="text-lg sm:text-xl font-bold text-amber-900 text-left italic tracking-wide whitespace-pre-wrap leading-relaxed">
                      {vocab.conjugation}
                    </p>
                  </div>
                </div>
              )}

              {/* 意味 */}
              <div className="text-center border-t-2 border-gray-50 pt-8 sm:pt-10">
                <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em] mb-3">Meaning</p>
                <h2 className="text-3xl sm:text-4xl font-bold text-blue-600">{vocab.translation}</h2>
              </div>

              {/* 例文 */}
              {(vocab.example_sentence || vocab.example_translation) && (
                <div className="bg-blue-50 p-6 sm:p-8 rounded-[2rem] border-2 border-blue-100">
                  <p className="text-[10px] font-black text-blue-300 uppercase tracking-[0.3em] mb-4 text-center">Context & Example</p>
                  {vocab.example_sentence && (
                    <div className="flex flex-col items-center gap-4">
                      <p className="text-lg sm:text-xl font-bold text-gray-900 text-center leading-relaxed italic">"{vocab.example_sentence}"</p>
                      <button onClick={() => speak(vocab.example_sentence)} className="bg-white/80 px-4 py-2 rounded-2xl shadow-sm hover:bg-white transition-all text-xs font-bold text-blue-600"> 🔊 Play Example</button>
                    </div>
                  )}
                  {vocab.example_translation && <p className="text-sm font-medium text-gray-500 mt-6 text-center border-t border-blue-100 pt-4">{vocab.example_translation}</p>}
                </div>
              )}

              {/* 🌟 ニュアンス/ノートセクション (改善版) */}
              <div className="border-t-2 border-gray-50 pt-8">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em]">Usage & Nuance</p>
                  <div className="flex gap-2">
                    {/* ノートがある時だけ表示される消去ボタン */}
                    {vocab.notes && (
                      <button 
                        onClick={handleClearNotes}
                        className="text-[10px] font-black bg-red-50 text-red-500 px-4 py-2 rounded-full hover:bg-red-100 transition-all"
                      >
                        🗑️ CLEAR
                      </button>
                    )}
                    <button 
                      onClick={handleAskNuance}
                      disabled={isAskingAI}
                      className="text-[10px] font-black bg-blue-50 text-blue-600 px-4 py-2 rounded-full hover:bg-blue-100 transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                      {isAskingAI ? "✨ ANALYZING..." : (vocab.notes ? "🪄 REFRESH NUANCE" : "🪄 ASK AI FOR NUANCE")}
                    </button>
                  </div>
                </div>
                
                <div className="bg-gray-50/50 rounded-3xl p-6 border-2 border-dashed border-gray-100 min-h-[100px] flex flex-col justify-center">
                  {vocab.notes ? (
                    <p className="text-sm font-medium text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {vocab.notes.replace(/\*\*/g, '')}
                    </p>
                  ) : (
                    <p className="text-xs font-bold text-gray-300 text-center py-4 uppercase tracking-widest">
                      No notes yet. Click the wand to ask AI!
                    </p>
                  )}
                </div>
              </div>

              {/* 詳細グリッド */}
              <div className="flex flex-wrap gap-4 border-t-2 border-gray-50 pt-8">
                {vocab.categories && (
                  <Link
                    href={`/study/${vocab.language_code}/topics/${vocab.category_id}`}
                    className="flex-1 min-w-[140px] bg-indigo-50 p-5 rounded-3xl border border-indigo-100 flex flex-col items-center sm:items-start group hover:border-indigo-400 transition-all"
                  >
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">Topic</p>
                    <p className="font-bold text-indigo-900 text-lg group-hover:text-indigo-600 transition-colors">
                      {getMainTopicName()}
                    </p>
                    <p className="text-[9px] font-bold text-indigo-300 uppercase mt-1">View {vocab.categories.name} List →</p>
                  </Link>
                )}

                <div className="flex-1 min-w-[120px] bg-gray-50 p-5 rounded-3xl border border-gray-100 flex flex-col items-center sm:items-start">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Part of Speech</p>
                  <p className="font-bold text-gray-800 text-lg">{vocab.part_of_speech || "---"}</p>
                </div>

                {vocab.gender && (
                  <div className="flex-1 min-w-[120px] bg-emerald-50 p-5 rounded-3xl border border-emerald-100 flex flex-col items-center sm:items-start">
                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2">Gender</p>
                    <p className="font-bold text-emerald-800 text-lg">{vocab.gender}</p>
                  </div>
                )}

                {vocab.verb_type && (
                  <div className="flex-1 min-w-[120px] bg-emerald-50 p-5 rounded-3xl border border-emerald-100 flex flex-col items-center sm:items-start">
                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2">Verb Type</p>
                    <p className="font-bold text-emerald-800 text-lg">{vocab.verb_type}</p>
                  </div>
                )}

                <div className="flex-1 min-w-[120px] bg-gray-50 p-5 rounded-3xl border border-gray-100 flex flex-col items-center justify-center">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Mastery</p>
                  <button onClick={handleToggleRemembered} className={`w-full py-2 px-3 rounded-2xl font-black text-xs transition-all uppercase tracking-widest ${vocab.is_remembered ? "bg-green-500 text-white shadow-lg shadow-green-100" : "bg-orange-100 text-orange-600"}`}>
                    {vocab.is_remembered ? " ✅ Mastered" : " 🔥 Learning"}
                  </button>
                </div>
              </div>

              {/* アクションボタン */}
              <div className="flex flex-col sm:flex-row gap-3 pt-6">
                <button onClick={() => setIsEditing(true)} className="flex-1 bg-gray-900 text-white font-black py-4 rounded-2xl sm:rounded-[2rem] hover:bg-gray-800 transition-all shadow-xl">✏️ Edit Details</button>
                <button onClick={handleDelete} disabled={isDeleting} className="w-full sm:w-auto px-8 bg-red-50 text-red-500 font-black py-4 rounded-2xl sm:rounded-[2rem] hover:bg-red-100 transition-colors"> 🗑️ Delete</button>
              </div>
            </div>
          ) : (
            /* 編集モードはそのまま */
            <div className="space-y-6 mt-10">
              <h2 className="text-2xl font-black mb-6 tracking-tight">Edit Word Details</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Word</label>
                    <input type="text" value={editWord} onChange={(e) => setEditWord(e.target.value)} className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Category ID (UUID)</label>
                    <input type="text" value={editCategory} onChange={(e) => setEditCategory(e.target.value)} className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold text-indigo-600" />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Meaning</label>
                  <input type="text" value={editTranslation} onChange={(e) => setEditTranslation(e.target.value)} className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Part of Speech</label>
                    <input type="text" value={editPos} onChange={(e) => setEditPos(e.target.value)} className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-emerald-500 uppercase tracking-widest ml-2">Gender</label>
                    <input type="text" value={editGender} onChange={(e) => setEditGender(e.target.value)} className="w-full p-4 bg-emerald-50 border-2 border-emerald-100 rounded-2xl font-bold text-emerald-800" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-emerald-500 uppercase tracking-widest ml-2">Verb Type</label>
                    <input type="text" value={editVerbType} onChange={(e) => setEditVerbType(e.target.value)} className="w-full p-4 bg-emerald-50 border-2 border-emerald-100 rounded-2xl font-bold text-emerald-800" />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Notes / AI Nuance</label>
                  <textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} rows={5} className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-medium" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Example Sentence</label>
                    <textarea value={editExample} onChange={(e) => setEditExample(e.target.value)} rows={3} className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-medium" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Example Translation</label>
                    <textarea value={editExampleTranslation} onChange={(e) => setEditExampleTranslation(e.target.value)} rows={3} className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-medium" />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-6">
                  <button onClick={() => setIsEditing(false)} className="w-full sm:w-1/3 bg-gray-100 text-gray-500 font-black py-4 rounded-2xl sm:rounded-[2rem] hover:bg-gray-200 transition-colors">Cancel</button>
                  <button onClick={handleUpdate} className="flex-1 bg-blue-600 text-white font-black py-4 rounded-2xl sm:rounded-[2rem] shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all hover:-translate-y-1">Save Changes</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}