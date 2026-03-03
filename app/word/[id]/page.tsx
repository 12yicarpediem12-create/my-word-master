"use client";
import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

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

  const [editWord, setEditWord] = useState("");
  const [editTranslation, setEditTranslation] = useState("");
  const [editPos, setEditPos] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editExample, setEditExample] = useState(""); 
  const [editExampleTranslation, setEditExampleTranslation] = useState(""); 

  useEffect(() => {
    async function fetchWord() {
      const { data, error } = await supabase
        .from("vocab")
        .select("*")
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
      }
      setIsLoading(false);
    }
    fetchWord();
  }, [wordId]);

  // 🌟 音声再生関数の強化版
  const speak = useCallback((text: string, isEnglish: boolean = false) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    
    // 1. 以前の再生を強制キャンセルし、フリーズ対策でresume()を呼ぶ
    window.speechSynthesis.cancel();
    window.speechSynthesis.resume(); 

    const utterance = new SpeechSynthesisUtterance(text);
    
    if (isEnglish) {
      utterance.lang = "en-US";
    } else {
      // 🌟 言語マップを拡充（ポルトガル語やロシア語なども追加可能）
      const langMap: Record<string, string> = {
        it: "it-IT",
        fr: "fr-FR",
        es: "es-ES",
        de: "de-DE",
        pt: "pt-PT", // ポルトガル語を追加
        ja: "ja-JP",
        ko: "ko-KR",
        ru: "ru-RU",
        zh: "zh-CN",
        en: "en-US",
      };
      
      const code = vocab?.language_code;
      utterance.lang = langMap[code] || (code ? `${code}-${code.toUpperCase()}` : "en-US");
    }
    
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  }, [vocab]);

  const handleToggleRemembered = async () => {
    const newStatus = !vocab.is_remembered;
    const { error } = await supabase
      .from("vocab")
      .update({ is_remembered: newStatus })
      .eq("id", wordId);

    if (!error) {
      setVocab({ ...vocab, is_remembered: newStatus });
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
      })
      .eq("id", wordId);

    if (!error) {
      setVocab({
        ...vocab,
        word: editWord,
        translation: editTranslation,
        part_of_speech: editPos,
        notes: editNotes,
        example_sentence: editExample,
        example_translation: editExampleTranslation,
      });
      setIsEditing(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this word?")) return;
    setIsDeleting(true);
    const { error } = await supabase.from("vocab").delete().eq("id", wordId);
    if (!error) router.push("/");
    else setIsDeleting(false);
  };

  if (isLoading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center font-bold text-gray-400">Loading...</div>;
  if (!vocab) return <div className="min-h-screen bg-gray-50 flex items-center justify-center font-bold text-gray-900 underline"><Link href="/">Word Not Found. Go Back</Link></div>;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans pb-20">
      <nav className="bg-white border-b-2 border-gray-200 px-8 py-5 flex justify-between items-center sticky top-0 z-50 shadow-sm">
        <Link href="/" className="text-3xl font-black tracking-tighter text-blue-600">WordMaster.</Link>
        <button onClick={() => router.back()} className="text-sm font-bold text-gray-500 hover:text-blue-600 flex items-center gap-2"><span>←</span> Back</button>
      </nav>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        <div className="bg-white rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-10 border-2 border-gray-200 shadow-lg relative overflow-hidden">
          
          <div className="absolute top-0 right-0 bg-blue-50 text-blue-600 font-black uppercase tracking-widest px-6 sm:px-8 py-3 sm:py-4 rounded-bl-[1.5rem] sm:rounded-bl-[2rem] border-b-2 border-l-2 border-blue-100 text-xs sm:text-base">
            {vocab.language_code}
          </div>

          {!isEditing ? (
            <div className="space-y-8 sm:space-y-10 mt-6">
              <div className="text-center relative group">
                <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em] mb-3">Word</p>
                <div className="flex items-center justify-center gap-3 sm:gap-4 flex-wrap">
                  <h1 className="text-5xl sm:text-6xl font-black text-gray-900 tracking-tight break-all">{vocab.word}</h1>
                  <button 
                    onClick={() => speak(vocab.word)}
                    className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-50 rounded-full flex items-center justify-center text-lg sm:text-xl hover:bg-blue-50 hover:scale-110 transition-all shadow-sm shrink-0"
                  >🔊</button>
                </div>
              </div>

              <div className="text-center border-t-2 border-gray-50 pt-8 sm:pt-10">
                <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em] mb-3">Meaning</p>
                <h2 className="text-3xl sm:text-4xl font-bold text-blue-600">{vocab.translation}</h2>
              </div>

              {(vocab.example_sentence || vocab.example_translation) && (
                <div className="bg-blue-50 p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border-2 border-blue-100 relative group">
                  <p className="text-[10px] font-black text-blue-300 uppercase tracking-[0.3em] mb-4 text-center">Context & Example</p>
                  {vocab.example_sentence && (
                    <div className="flex flex-col items-center gap-4">
                      <p className="text-lg sm:text-xl font-bold text-gray-900 text-center leading-relaxed italic">
                        "{vocab.example_sentence}"
                      </p>
                      <button 
                        onClick={() => speak(vocab.example_sentence)}
                        className="bg-white/80 p-3 rounded-2xl shadow-sm hover:bg-white transition-all text-xs sm:text-sm"
                      >🔊 Listen to sentence</button>
                    </div>
                  )}
                  {vocab.example_translation && (
                    <p className="text-sm font-medium text-gray-500 mt-6 text-center border-t border-blue-100 pt-4">
                      {vocab.example_translation}
                    </p>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t-2 border-gray-50 pt-8 sm:pt-10">
                <div className="bg-gray-50 p-5 sm:p-6 rounded-3xl border border-gray-100 flex flex-col items-center sm:items-start text-center sm:text-left">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Part of Speech</p>
                  <p className="font-bold text-gray-800 text-lg">{vocab.part_of_speech || "---"}</p>
                </div>
                <div className="bg-gray-50 p-5 sm:p-6 rounded-3xl border border-gray-100 flex flex-col items-center">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Mastery</p>
                  <button 
                    onClick={handleToggleRemembered}
                    className={`w-full max-w-[200px] py-3 rounded-2xl font-black text-xs transition-all uppercase tracking-widest ${
                      vocab.is_remembered 
                        ? "bg-green-500 text-white shadow-lg shadow-green-100" 
                        : "bg-orange-100 text-orange-600"
                    }`}
                  >
                    {vocab.is_remembered ? "✅ Mastered" : "🔥 Learning"}
                  </button>
                </div>
              </div>

              {vocab.notes && (
                <div className="bg-gray-50 p-6 sm:p-8 rounded-3xl border-2 border-gray-100">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Personal Notes</p>
                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed text-sm sm:text-base">{vocab.notes}</p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-6 sm:pt-10">
                <button onClick={() => setIsEditing(true)} className="flex-1 bg-gray-900 text-white font-black py-4 sm:py-5 rounded-2xl sm:rounded-[2rem] hover:bg-gray-800 transition-all shadow-xl">✏️ Edit Details</button>
                <button onClick={handleDelete} disabled={isDeleting} className="w-full sm:w-auto px-8 bg-red-50 text-red-500 font-black py-4 sm:py-5 rounded-2xl sm:rounded-[2rem] hover:bg-red-100 transition-all">🗑️ Delete</button>
              </div>
            </div>
          ) : (
            <div className="space-y-6 mt-6">
              <h2 className="text-2xl sm:text-3xl font-black mb-6 sm:mb-8 tracking-tight">Edit Word</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Word</label>
                  <input type="text" value={editWord} onChange={(e) => setEditWord(e.target.value)} className="w-full p-4 sm:p-5 bg-gray-50 border-2 border-gray-100 rounded-2xl sm:rounded-3xl font-bold text-lg sm:text-xl outline-none focus:border-blue-500 transition-all" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Meaning</label>
                  <input type="text" value={editTranslation} onChange={(e) => setEditTranslation(e.target.value)} className="w-full p-4 sm:p-5 bg-gray-50 border-2 border-gray-100 rounded-2xl sm:rounded-3xl font-bold text-lg sm:text-xl outline-none focus:border-blue-500 transition-all" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Example Sentence</label>
                    <textarea value={editExample} onChange={(e) => setEditExample(e.target.value)} rows={3} className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl sm:rounded-3xl font-medium outline-none focus:border-blue-500 transition-all" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Example Translation</label>
                    <textarea value={editExampleTranslation} onChange={(e) => setEditExampleTranslation(e.target.value)} rows={3} className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl sm:rounded-3xl font-medium outline-none focus:border-blue-500 transition-all" />
                  </div>
                </div>
                <div className="flex gap-3 sm:gap-4 pt-6">
                  <button onClick={() => setIsEditing(false)} className="w-1/3 bg-gray-100 text-gray-500 font-black py-4 sm:py-5 rounded-2xl sm:rounded-[2rem]">Cancel</button>
                  <button onClick={handleUpdate} className="flex-1 bg-blue-600 text-white font-black py-4 sm:py-5 rounded-2xl sm:rounded-[2rem] px-4 sm:px-10 shadow-xl shadow-blue-100">Save Changes</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}