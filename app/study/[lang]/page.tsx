"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import SearchBar from "../../components/SearchBar";
import { FilterButton, NavCard, PosStat, ProgressBar, StatCircle, VocabItemCard } from "./components";
import { bulkDeleteVocab } from "../../actions/vocab";
import type { Language, VocabItem } from "@/app/lib/types";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function LanguageHub() {
  const params = useParams();
  const router = useRouter();
  const langCode = params.lang as string;

  const [language, setLanguage] = useState<Language | null>(null);
  const [vocabList, setVocabList] = useState<VocabItem[]>([]);
  const [randomWord, setRandomWord] = useState<VocabItem | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>("All");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  const speak = useCallback(
    (text: string) => {
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
    },
    [langCode]
  );

  useEffect(() => {
    async function fetchData() {
      setErrorMsg(null);
      const { data: langData, error: langError } = await supabase
        .from("languages")
        .select("*")
        .eq("code", langCode)
        .single();

      if (langError || !langData) {
        setErrorMsg(langError?.message || "Language not found.");
        setIsLoading(false);
        return;
      }
      setLanguage(langData as Language);

      const { data: vocabData, error: vocabError } = await supabase
        .from("vocab")
        .select("id, language_code, word, translation, part_of_speech, gender, verb_type, is_remembered, created_at, mistake_count")
        .eq("language_code", langCode)
        .order("created_at", { ascending: false });

      if (vocabError) {
        setErrorMsg(vocabError.message);
        setIsLoading(false);
        return;
      }

      const loaded = (vocabData || []) as VocabItem[];
      setVocabList(loaded);
      if (loaded.length > 0) {
        const randomIndex = Math.floor(Math.random() * loaded.length);
        setRandomWord(loaded[randomIndex]);
      } else {
        setRandomWord(null);
      }
      setIsLoading(false);
    }
    if (langCode) fetchData();
  }, [langCode]);

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  }, []);

  const handleBulkDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${selectedIds.length} words? This action cannot be undone.`)) return;

    setIsDeleting(true);
    setErrorMsg(null);
    const { error } = await bulkDeleteVocab(selectedIds);

    if (!error) {
      setVocabList((prev) => prev.filter((v) => !selectedIds.includes(v.id)));
      setSelectedIds([]);
    } else {
      setErrorMsg(`Delete failed: ${error}`);
    }
    setIsDeleting(false);
  };

  const dynamicPosList = useMemo(() => {
    const posSet = new Set<string>();
    vocabList.forEach((v) => {
      if (v.part_of_speech) {
        const tags = v.part_of_speech
          .split(/[\/,]/)
          .map((s: string) => s.trim())
          .filter(Boolean);
        tags.forEach((t: string) => posSet.add(t));
      }
    });
    return Array.from(posSet).sort();
  }, [vocabList]);

  const posStats = useMemo<PosStat[]>(() => {
    return dynamicPosList.map((pos) => {
      const posVocab = vocabList.filter((v) => {
        if (!v.part_of_speech) return false;
        const tags = v.part_of_speech.split(/[\/,]/).map((s: string) => s.trim());
        return tags.includes(pos);
      });
      const mastered = posVocab.filter((v) => v.is_remembered).length;
      const total = posVocab.length;
      const percentage = total === 0 ? 0 : Math.round((mastered / total) * 100);
      return { name: pos, mastered, total, percentage };
    });
  }, [vocabList, dynamicPosList]);

  const filteredList = useMemo(() => {
    if (activeFilter === "All") return vocabList;
    return vocabList.filter((v) => {
      if (!v.part_of_speech) return false;
      const tags = v.part_of_speech.split(/[\/,]/).map((s: string) => s.trim());
      return tags.includes(activeFilter);
    });
  }, [vocabList, activeFilter]);

  const handleSelectAll = () => {
    if (selectedIds.length === filteredList.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredList.map((v) => v.id));
    }
  };

  if (isLoading)
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center font-bold text-gray-400 tracking-widest uppercase">Loading Hub...</div>;

  const totalWords = vocabList.length;
  const masteredWords = vocabList.filter((v) => v.is_remembered).length;
  const globalPercentage = totalWords === 0 ? 0 : Math.round((masteredWords / totalWords) * 100);
  const weakWordsCount = vocabList.filter((v) => (v.mistake_count || 0) > 0).length;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans pb-32 overflow-x-hidden relative">
      <nav className="bg-white border-b-2 border-gray-200 px-6 py-4 flex flex-col md:flex-row justify-between items-center sticky top-0 z-40 shadow-sm gap-4">
        <div className="w-full md:w-auto flex justify-between items-center">
          <Link href="/" className="text-3xl font-black tracking-tighter text-blue-600 hover:opacity-80">
            WordMaster.
          </Link>
        </div>
        <div className="w-full md:flex-1 md:max-w-2xl md:mx-8">
          <SearchBar forcedLang={langCode} />
        </div>
        <button onClick={() => router.push("/")} className="text-sm font-bold text-gray-500 hover:text-blue-600 uppercase tracking-widest flex items-center gap-2 shrink-0">
          <span>←</span> Dashboard
        </button>
      </nav>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        {errorMsg && (
          <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 text-red-600 font-bold rounded-2xl">
            {errorMsg}
          </div>
        )}

        <div className="bg-white rounded-[2.5rem] p-6 sm:p-8 md:p-10 border-2 border-gray-200 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-8 mb-8 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-center text-center sm:text-left gap-4 sm:gap-6 z-10">
            <div className="text-7xl md:text-8xl">{language?.emoji}</div>
            <div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight text-gray-900 mb-2">{language?.name}</h1>
              <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Mastery Hub</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 z-10 w-full lg:w-auto shrink-0">
            {weakWordsCount > 0 && (
              <button
                onClick={() => router.push(`/study/${langCode}/session`)}
                className="w-full sm:w-auto h-[80px] px-6 bg-red-50 text-red-600 font-black rounded-2xl border-2 border-red-200 hover:bg-red-100 hover:-translate-y-1 transition-all flex items-center justify-center gap-3 shadow-sm shrink-0"
              >
                <span className="text-3xl animate-pulse">🚨</span>
                <div className="text-left leading-tight whitespace-nowrap">
                  <p className="text-[10px] uppercase tracking-widest opacity-80 mb-0.5">Needs Focus</p>
                  <p className="text-lg">
                    {weakWordsCount} Weak Point{weakWordsCount > 1 ? "s" : ""}
                  </p>
                </div>
              </button>
            )}
            <button
              onClick={() => router.push(`/study/${langCode}/session`)}
              disabled={totalWords === 0}
              className="w-full sm:w-auto h-[80px] px-8 bg-blue-600 text-white font-black text-xl rounded-2xl shadow-xl hover:bg-blue-700 hover:-translate-y-1 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shrink-0 whitespace-nowrap"
            >
              <span className="text-3xl">🚀</span> <span>Start Session</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <NavCard href={`/study/${langCode}/topics`} icon="🗂️" subtitle="Taxonomy" title="Browse by Topic" iconBg="bg-blue-50" />
          <NavCard href="/history" icon="⏳" subtitle="Activity" title="Review History" iconBg="bg-gray-50" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <StatCircle percentage={globalPercentage} mastered={masteredWords} total={totalWords} />
          <div className="lg:col-span-2 bg-white rounded-3xl p-8 border-2 border-gray-200 shadow-sm h-full flex flex-col justify-center">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6 text-center sm:text-left">Mastery by Category</h3>
            <div className="space-y-5">
              {posStats.map((stat) => (
                <ProgressBar key={stat.name} stat={stat} />
              ))}
            </div>
          </div>
        </div>

        {randomWord && (
          <div className="mb-12 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden group">
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6 text-center md:text-left">
              <div className="flex flex-col sm:flex-row items-center gap-6 w-full">
                <button onClick={() => speak(randomWord.word)} className="w-16 h-16 bg-white/20 hover:bg-white/30 rounded-2xl flex items-center justify-center text-3xl transition-all active:scale-90 shrink-0">
                  🔊
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black uppercase tracking-widest opacity-70 mb-2">Random Flashback</p>
                  <h3 className="text-3xl sm:text-4xl font-black mb-1 truncate">{randomWord.word}</h3>
                  <p className="text-lg sm:text-xl opacity-90 font-medium truncate">{randomWord.translation}</p>
                </div>
              </div>
              <Link href={`/word/${randomWord.id}`} className="w-full md:w-auto bg-white text-indigo-600 px-8 py-4 rounded-2xl font-bold hover:bg-gray-100 transition-all shadow-lg active:scale-95 whitespace-nowrap text-center">
                Review Now
              </Link>
            </div>
            <div className="absolute -bottom-10 -right-10 text-[200px] font-black opacity-10 select-none group-hover:scale-110 transition-transform pointer-events-none">?</div>
          </div>
        )}

        <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="overflow-x-auto pb-2 scrollbar-hide w-full sm:w-auto">
            <div className="flex gap-3">
              <button
                onClick={() => setActiveFilter("All")}
                className={`px-6 py-3 rounded-2xl font-bold whitespace-nowrap transition-all border-2 ${activeFilter === "All" ? "bg-gray-900 border-gray-900 text-white shadow-lg" : "bg-white border-gray-200 text-gray-500 hover:border-gray-900"}`}
              >
                All
              </button>
              {dynamicPosList.map((pos) => (
                <FilterButton key={pos} active={activeFilter === pos} onClick={() => setActiveFilter(pos)}>
                  {pos}
                </FilterButton>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {filteredList.length > 0 && (
              <button
                onClick={handleSelectAll}
                className="text-[10px] font-black text-gray-500 hover:text-gray-900 bg-white border-2 border-gray-200 px-4 py-3 rounded-xl uppercase tracking-widest transition-all shadow-sm active:scale-95"
              >
                {selectedIds.length === filteredList.length ? "Deselect All" : "Select All"}
              </button>
            )}
            {selectedIds.length > 0 && (
              <button onClick={() => setSelectedIds([])} className="text-[10px] font-bold text-gray-400 hover:text-gray-700 bg-gray-200/50 px-4 py-3 rounded-xl uppercase tracking-widest transition-colors shrink-0">
                Clear
              </button>
            )}
          </div>
        </div>

        <div className="bg-white rounded-3xl border-2 border-gray-200 shadow-sm overflow-hidden mb-12">
          {filteredList.length > 0 ? (
            <div className="divide-y-2 divide-gray-100">
              {filteredList.map((vocab) => (
                <VocabItemCard
                  key={vocab.id}
                  vocab={vocab}
                  isWeak={(vocab.mistake_count || 0) > 0}
                  onSpeak={speak}
                  isSelected={selectedIds.includes(vocab.id)}
                  onToggle={toggleSelection}
                />
              ))}
            </div>
          ) : (
            <div className="p-20 text-center text-gray-400 font-bold uppercase tracking-widest">No {activeFilter}s found.</div>
          )}
        </div>
      </main>

      {selectedIds.length > 0 && (
        <div className="fixed bottom-10 left-1/2 transform -translate-x-1/2 bg-gray-900/95 backdrop-blur-md text-white px-6 sm:px-10 py-5 rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] flex items-center gap-6 sm:gap-10 z-50 border border-gray-700 animate-in slide-in-from-bottom-20 duration-500">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Selected</span>
            <span className="text-xl sm:text-2xl font-black tracking-tight">
              {selectedIds.length} <span className="text-base text-gray-400 font-bold">words</span>
            </span>
          </div>

          <div className="w-px h-10 bg-gray-700"></div>

          <button
            onClick={handleBulkDelete}
            disabled={isDeleting}
            className="bg-red-500 hover:bg-red-600 text-white font-black px-6 sm:px-8 py-3 rounded-2xl transition-all shadow-lg shadow-red-500/30 disabled:opacity-50 flex items-center gap-2"
          >
            {isDeleting ? "Deleting..." : "🗑️ Delete All"}
          </button>
        </div>
      )}
    </div>
  );
}
