"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import SearchBar from "../../components/SearchBar";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const POS_LIST = ["Noun", "Verb", "Adjective", "Adverb", "Phrase"];

export default function LanguageHub() {
  const params = useParams();
  const router = useRouter();
  const langCode = params.lang as string;

  const [language, setLanguage] = useState<any>(null);
  const [vocabList, setVocabList] = useState<any[]>([]);
  const [randomWord, setRandomWord] = useState<any>(null);
  const [activeFilter, setActiveFilter] = useState<string>("All");
  const [isLoading, setIsLoading] = useState(true);

  // 🌟 強化版音声再生エンジン（詳細ページと同じ最強仕様）
  const speak = useCallback((text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    
    window.speechSynthesis.cancel();
    window.speechSynthesis.resume(); 

    const utterance = new SpeechSynthesisUtterance(text);
    
    const langMap: Record<string, string> = {
      it: "it-IT",
      fr: "fr-FR",
      es: "es-ES",
      de: "de-DE",
      pt: "pt-PT",
      ja: "ja-JP",
      ko: "ko-KR",
      ru: "ru-RU",
      zh: "zh-CN",
      en: "en-US",
    };
    
    utterance.lang = langMap[langCode] || `${langCode}-${langCode.toUpperCase()}`;
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  }, [langCode]);

  useEffect(() => {
    async function fetchData() {
      const { data: langData, error: langError } = await supabase
        .from("languages")
        .select("*")
        .eq("code", langCode)
        .single();

      if (langError || !langData) {
        setIsLoading(false);
        return;
      }
      setLanguage(langData);

      const { data: vocabData } = await supabase
        .from("vocab")
        .select("*")
        .eq("language_code", langCode)
        .order("created_at", { ascending: false });

      if (vocabData) {
        setVocabList(vocabData);
        if (vocabData.length > 0) {
          const randomIndex = Math.floor(Math.random() * vocabData.length);
          setRandomWord(vocabData[randomIndex]);
        }
      }
      setIsLoading(false);
    }
    if (langCode) fetchData();
  }, [langCode]);

  const posStats = useMemo(() => {
    return POS_LIST.map(pos => {
      const posVocab = vocabList.filter(v => v.part_of_speech === pos);
      const mastered = posVocab.filter(v => v.is_remembered).length;
      const total = posVocab.length;
      const percentage = total === 0 ? 0 : Math.round((mastered / total) * 100);
      return { name: pos, mastered, total, percentage };
    });
  }, [vocabList]);

  const filteredList = useMemo(() => {
    if (activeFilter === "All") return vocabList;
    return vocabList.filter(v => v.part_of_speech === activeFilter);
  }, [vocabList, activeFilter]);

  if (isLoading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center font-bold text-gray-400 tracking-widest uppercase">Loading Hub...</div>;

  const totalWords = vocabList.length;
  const masteredWords = vocabList.filter(v => v.is_remembered).length;
  const globalPercentage = totalWords === 0 ? 0 : Math.round((masteredWords / totalWords) * 100);

  const weakWordsCount = vocabList.filter(v => (v.mistake_count || 0) > 0).length;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans pb-20 overflow-x-hidden">
      <nav className="bg-white border-b-2 border-gray-200 px-6 py-4 flex flex-col md:flex-row justify-between items-center sticky top-0 z-50 shadow-sm gap-4">
        <div className="w-full md:w-auto flex justify-between items-center">
          <Link href="/" className="text-3xl font-black tracking-tighter text-blue-600 hover:opacity-80">WordMaster.</Link>
        </div>
        <div className="w-full md:flex-1 md:max-w-2xl md:mx-8"><SearchBar forcedLang={langCode} /></div>
        <button onClick={() => router.push("/")} className="text-sm font-bold text-gray-500 hover:text-blue-600 uppercase tracking-widest flex items-center gap-2"><span>←</span> Dashboard</button>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-12">
        
        <div className="bg-white rounded-[2.5rem] p-8 md:p-10 border-2 border-gray-200 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-6 lg:gap-8 mb-8 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-center text-center sm:text-left gap-4 sm:gap-6 z-10">
            <div className="text-7xl md:text-8xl">{language?.emoji}</div>
            <div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight text-gray-900 mb-2">{language?.name}</h1>
              <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Mastery Hub</p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 z-10 w-full lg:w-auto shrink-0 mt-4 lg:mt-0">
            {weakWordsCount > 0 && (
              <button 
                onClick={() => router.push(`/study/${langCode}/session`)} 
                className="w-full sm:w-auto h-[80px] px-6 bg-red-50 text-red-600 font-black rounded-2xl border-2 border-red-200 hover:bg-red-100 hover:-translate-y-1 transition-all flex items-center justify-center gap-3 shadow-sm shrink-0"
              >
                <span className="text-3xl animate-pulse">🚨</span> 
                <div className="text-left leading-tight whitespace-nowrap">
                  <p className="text-[10px] uppercase tracking-widest opacity-80 mb-0.5">Needs Focus</p>
                  <p className="text-lg">{weakWordsCount} Weak Point{weakWordsCount > 1 ? 's' : ''}</p>
                </div>
              </button>
            )}

            <button 
              onClick={() => router.push(`/study/${langCode}/session`)} 
              disabled={totalWords === 0}
              className="w-full sm:w-auto h-[80px] px-8 bg-blue-600 text-white font-black text-xl rounded-2xl shadow-xl hover:bg-blue-700 hover:-translate-y-1 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 shrink-0 whitespace-nowrap"
            >
              <span className="text-3xl">🚀</span> 
              <span>Start Session</span>
            </button>
          </div>
        </div>

        {/* 統計セクションはそのまま */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <div className="lg:col-span-1 bg-white rounded-3xl p-8 border-2 border-gray-200 flex flex-col items-center justify-center shadow-sm">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6">Overall Mastery</h3>
            <div className="relative w-40 h-40 flex items-center justify-center">
              <svg className="transform -rotate-90 w-40 h-40">
                <circle cx="80" cy="80" r="65" stroke="#f3f4f6" strokeWidth="14" fill="none" />
                <circle cx="80" cy="80" r="65" stroke="#2563eb" strokeWidth="14" fill="none" 
                        strokeDasharray={408} strokeDashoffset={408 - (globalPercentage / 100) * 408} 
                        className="transition-all duration-1000 ease-out" strokeLinecap="round" />
              </svg>
              <div className="absolute text-center">
                <span className="text-3xl font-black block">{globalPercentage}%</span>
                <span className="text-[10px] font-bold text-gray-400 uppercase">{masteredWords} / {totalWords}</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 bg-white rounded-3xl p-8 border-2 border-gray-200 shadow-sm">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6">Mastery by Category</h3>
            <div className="space-y-5">
              {posStats.map((stat) => (
                <div key={stat.name} className="space-y-2">
                  <div className="flex justify-between items-end">
                    <span className="text-sm font-bold text-gray-700">{stat.name}</span>
                    <span className="text-xs font-black text-gray-400">{stat.mastered} / {stat.total}</span>
                  </div>
                  <div className="h-4 bg-gray-100 rounded-full overflow-hidden border border-gray-100 relative">
                    <div className={`h-full transition-all duration-1000 ease-in-out ${stat.percentage === 100 ? 'bg-green-500' : 'bg-blue-500'}`} style={{ width: `${stat.percentage}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 🌟 Random Flashback カードに音声ボタンを追加 */}
        {randomWord && (
          <div className="mb-12 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden group">
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-6">
                <button 
                  onClick={() => speak(randomWord.word)}
                  className="w-16 h-16 bg-white/20 hover:bg-white/30 rounded-2xl flex items-center justify-center text-3xl transition-all active:scale-90"
                >🔊</button>
                <div>
                  <p className="text-xs font-black uppercase tracking-widest opacity-70 mb-2">Random Flashback</p>
                  <h3 className="text-4xl font-black mb-1">{randomWord.word}</h3>
                  <p className="text-xl opacity-90 font-medium">{randomWord.translation}</p>
                </div>
              </div>
              <Link href={`/word/${randomWord.id}`} className="bg-white text-indigo-600 px-8 py-3 rounded-2xl font-bold hover:bg-gray-100 transition-all shadow-lg active:scale-95">Review Now</Link>
            </div>
            <div className="absolute -bottom-10 -right-10 text-[200px] font-black opacity-10 select-none group-hover:scale-110 transition-transform pointer-events-none">?</div>
          </div>
        )}

        {/* フィルタボタンはそのまま */}
        <div className="mb-8 overflow-x-auto pb-2">
          <div className="flex gap-3">
            <button onClick={() => setActiveFilter("All")} className={`px-6 py-3 rounded-2xl font-bold whitespace-nowrap transition-all border-2 ${activeFilter === "All" ? "bg-gray-900 border-gray-900 text-white shadow-lg" : "bg-white border-gray-200 text-gray-500 hover:border-gray-900"}`}>All</button>
            {POS_LIST.map((pos) => (
              <button key={pos} onClick={() => setActiveFilter(pos)} className={`px-6 py-3 rounded-2xl font-bold whitespace-nowrap transition-all border-2 ${activeFilter === pos ? "bg-blue-600 border-blue-600 text-white shadow-lg" : "bg-white border-gray-200 text-gray-500 hover:border-blue-600 hover:text-blue-600"}`}>{pos}</button>
            ))}
          </div>
        </div>

        {/* 🌟 単語リストに音声ボタンを追加 */}
        <div className="bg-white rounded-3xl border-2 border-gray-200 shadow-sm overflow-hidden mb-12">
          {filteredList.length > 0 ? (
            <div className="divide-y-2 divide-gray-100">
              {filteredList.map((vocab) => {
                const isWeak = (vocab.mistake_count || 0) > 0;
                return (
                  <div key={vocab.id} className="p-6 hover:bg-gray-50 transition-colors flex items-center justify-between group">
                    <div className="flex items-center gap-6">
                      <span className={`w-3 h-3 rounded-full ${vocab.is_remembered ? "bg-green-400" : "bg-orange-400"}`}></span>
                      <Link href={`/word/${vocab.id}`} className="block">
                        <div className="flex items-center gap-2">
                          <p className="text-xl font-black text-gray-900 group-hover:text-blue-600 transition-colors">{vocab.word}</p>
                          {isWeak && !vocab.is_remembered && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold uppercase">Weak</span>}
                        </div>
                        <p className="text-sm font-medium text-gray-500 mt-1">{vocab.translation}</p>
                      </Link>
                    </div>
                    <div className="flex items-center gap-4">
                      {/* 🌟 リスト用のミニ音声ボタン */}
                      <button 
                        onClick={() => speak(vocab.word)}
                        className="p-3 bg-gray-50 hover:bg-blue-50 text-gray-400 hover:text-blue-600 rounded-xl transition-all active:scale-90"
                      >🔊</button>
                      <span className="hidden sm:inline-block text-[10px] font-bold bg-gray-100 text-gray-400 px-3 py-1 rounded-full uppercase tracking-widest">{vocab.part_of_speech || "N/A"}</span>
                      <span className="text-2xl">{vocab.is_remembered ? "✅" : "🔥"}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-20 text-center text-gray-400 font-bold">No {activeFilter}s found.</div>
          )}
        </div>

      </main>
    </div>
  );
}