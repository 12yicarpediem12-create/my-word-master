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

const NavCard = ({ href, icon, subtitle, title, iconBg }: { href: string; icon: string; subtitle: string; title: string; iconBg: string }) => (
  <Link href={href} className="flex items-center justify-between bg-white border-2 border-gray-200 p-6 rounded-[2rem] hover:border-blue-500 hover:shadow-lg transition-all group">
    <div className="flex items-center gap-5">
      <div className={`w-14 h-14 ${iconBg} rounded-2xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform`}>{icon}</div>
      <div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{subtitle}</p>
        <h2 className="text-xl font-black text-gray-900">{title}</h2>
      </div>
    </div>
    <span className="text-gray-300 font-black group-hover:text-blue-500 transition-colors mr-2">→</span>
  </Link>
);

const StatCircle = ({ percentage, mastered, total }: { percentage: number; mastered: number; total: number }) => (
  <div className="lg:col-span-1 bg-white rounded-3xl p-8 border-2 border-gray-200 flex flex-col items-center justify-center shadow-sm h-full">
    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6 text-center">Overall Mastery</h3>
    <div className="relative w-40 h-40 flex items-center justify-center">
      <svg className="transform -rotate-90 w-40 h-40">
        <circle cx="80" cy="80" r="65" stroke="#f3f4f6" strokeWidth="14" fill="none" />
        <circle cx="80" cy="80" r="65" stroke="#2563eb" strokeWidth="14" fill="none" strokeDasharray={408} strokeDashoffset={408 - (percentage / 100) * 408} className="transition-all duration-1000 ease-out" strokeLinecap="round" />
      </svg>
      <div className="absolute flex flex-col items-center justify-center mt-1">
        <span className="text-3xl font-black leading-none">{percentage}%</span>
        <span className="text-[10px] font-bold text-gray-400 uppercase mt-1">{mastered} / {total}</span>
      </div>
    </div>
  </div>
);

const ProgressBar = ({ stat }: { stat: any }) => (
  <div className="space-y-2">
    <div className="flex justify-between items-end">
      <span className="text-sm font-bold text-gray-700">{stat.name}</span>
      <span className="text-xs font-black text-gray-400">{stat.mastered} / {stat.total}</span>
    </div>
    <div className="h-4 bg-gray-100 rounded-full overflow-hidden border border-gray-100 relative">
      <div className={`h-full transition-all duration-1000 ease-in-out ${stat.percentage === 100 ? 'bg-green-500' : 'bg-blue-500'}`} style={{ width: `${stat.percentage}%` }} />
    </div>
  </div>
);

const FilterButton = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
  <button 
    onClick={onClick} 
    className={`px-6 py-3 rounded-2xl font-bold whitespace-nowrap transition-all border-2 ${active ? "bg-blue-600 border-blue-600 text-white shadow-lg" : "bg-white border-gray-200 text-gray-500 hover:border-blue-600 hover:text-blue-600"}`}
  >
    {children}
  </button>
);

const VocabItem = ({ vocab, isWeak, onSpeak, isSelected, onToggle }: { vocab: any; isWeak: boolean; onSpeak: (text: string) => void; isSelected: boolean; onToggle: (id: string) => void; }) => (
  <div className={`p-6 transition-colors flex flex-col sm:flex-row sm:items-center justify-between group gap-4 relative ${isSelected ? "bg-red-50/40" : "hover:bg-gray-50"}`}>
    <div className="flex items-start sm:items-center gap-4 sm:gap-5">
      
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onToggle(vocab.id);
        }}
        className={`mt-1 sm:mt-0 shrink-0 z-20 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all shadow-sm ${
          isSelected 
            ? "bg-red-500 border-red-500 text-white shadow-red-200" 
            : "bg-white border-gray-300 text-transparent hover:border-red-300 hover:shadow-md"
        }`}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
      </button>

      <span className={`hidden sm:block w-3 h-3 rounded-full shrink-0 ${vocab.is_remembered ? "bg-green-400" : "bg-orange-400"}`}></span>
      
      <div>
        <Link href={`/word/${vocab.id}`} className="block">
          <div className="flex items-center gap-2 flex-wrap">
            <p className={`text-xl font-black transition-colors ${isSelected ? "text-red-700" : "text-gray-900 group-hover:text-blue-600"}`}>
              {vocab.word}
            </p>
            {isWeak && !vocab.is_remembered && <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">Weak</span>}
          </div>
          <p className="text-sm font-medium text-gray-500 mt-1">{vocab.translation}</p>
        </Link>
        <div className="flex flex-wrap gap-2 mt-3 sm:mt-2">
          {vocab.gender && <span className="text-[9px] font-black bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-md uppercase tracking-wider border border-emerald-100">{vocab.gender}</span>}
          {vocab.verb_type && <span className="text-[9px] font-black bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-md uppercase tracking-wider border border-emerald-100">{vocab.verb_type}</span>}
        </div>
      </div>
    </div>
    
    <div className="flex items-center gap-4 self-end sm:self-auto pl-10 sm:pl-0">
      <button onClick={() => onSpeak(vocab.word)} className="p-3 bg-gray-50 hover:bg-blue-50 text-gray-400 hover:text-blue-600 rounded-xl transition-all active:scale-90">🔊</button>
      <span className="hidden sm:inline-block text-[10px] font-bold bg-gray-100 text-gray-400 px-3 py-1 rounded-full uppercase tracking-widest">{vocab.part_of_speech || "N/A"}</span>
      <span className="text-2xl">{vocab.is_remembered ? "✅" : "🔥"}</span>
    </div>
  </div>
);

export default function LanguageHub() {
  const params = useParams();
  const router = useRouter();
  const langCode = params.lang as string;

  const [language, setLanguage] = useState<any>(null);
  const [vocabList, setVocabList] = useState<any[]>([]);
  const [randomWord, setRandomWord] = useState<any>(null);
  const [activeFilter, setActiveFilter] = useState<string>("All");
  const [isLoading, setIsLoading] = useState(true);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  const speak = useCallback((text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    window.speechSynthesis.resume(); 

    const utterance = new SpeechSynthesisUtterance(text);
    const langMap: Record<string, string> = {
      it: "it-IT", fr: "fr-FR", es: "es-ES", de: "de-DE", pt: "pt-PT", ja: "ja-JP", ko: "ko-KR", ru: "ru-RU", zh: "zh-CN", en: "en-US",
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

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  }, []);

  const handleBulkDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${selectedIds.length} words? This action cannot be undone.`)) return;
    
    setIsDeleting(true);
    const { error } = await supabase
      .from("vocab")
      .delete()
      .in("id", selectedIds);

    if (!error) {
      setVocabList(prev => prev.filter(v => !selectedIds.includes(v.id)));
      setSelectedIds([]);
    } else {
      alert("Error deleting words: " + error.message);
    }
    setIsDeleting(false);
  };

  const dynamicPosList = useMemo(() => {
    const posSet = new Set<string>();
    vocabList.forEach(v => {
      if (v.part_of_speech) {
        const tags = v.part_of_speech.split(/[\/,]/).map((s: string) => s.trim()).filter(Boolean);
        tags.forEach((t: string) => posSet.add(t));
      }
    });
    return Array.from(posSet).sort();
  }, [vocabList]);

  const posStats = useMemo(() => {
    return dynamicPosList.map(pos => {
      const posVocab = vocabList.filter(v => {
        if (!v.part_of_speech) return false;
        const tags = v.part_of_speech.split(/[\/,]/).map((s: string) => s.trim());
        return tags.includes(pos);
      });
      const mastered = posVocab.filter(v => v.is_remembered).length;
      const total = posVocab.length;
      const percentage = total === 0 ? 0 : Math.round((mastered / total) * 100);
      return { name: pos, mastered, total, percentage };
    });
  }, [vocabList, dynamicPosList]);

  const filteredList = useMemo(() => {
    if (activeFilter === "All") return vocabList;
    return vocabList.filter(v => {
      if (!v.part_of_speech) return false;
      const tags = v.part_of_speech.split(/[\/,]/).map((s: string) => s.trim());
      return tags.includes(activeFilter);
    });
  }, [vocabList, activeFilter]);

  const handleSelectAll = () => {
    if (selectedIds.length === filteredList.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredList.map(v => v.id));
    }
  };

  if (isLoading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center font-bold text-gray-400 tracking-widest uppercase">Loading Hub...</div>;

  const totalWords = vocabList.length;
  const masteredWords = vocabList.filter(v => v.is_remembered).length;
  const globalPercentage = totalWords === 0 ? 0 : Math.round((masteredWords / totalWords) * 100);
  const weakWordsCount = vocabList.filter(v => (v.mistake_count || 0) > 0).length;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans pb-32 overflow-x-hidden relative">
      <nav className="bg-white border-b-2 border-gray-200 px-6 py-4 flex flex-col md:flex-row justify-between items-center sticky top-0 z-40 shadow-sm gap-4">
        <div className="w-full md:w-auto flex justify-between items-center">
          <Link href="/" className="text-3xl font-black tracking-tighter text-blue-600 hover:opacity-80">WordMaster.</Link>
        </div>
        <div className="w-full md:flex-1 md:max-w-2xl md:mx-8"><SearchBar forcedLang={langCode} /></div>
        <button onClick={() => router.push("/")} className="text-sm font-bold text-gray-500 hover:text-blue-600 uppercase tracking-widest flex items-center gap-2 shrink-0"><span>←</span> Dashboard</button>
      </nav>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
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
              <button onClick={() => router.push(`/study/${langCode}/session`)} className="w-full sm:w-auto h-[80px] px-6 bg-red-50 text-red-600 font-black rounded-2xl border-2 border-red-200 hover:bg-red-100 hover:-translate-y-1 transition-all flex items-center justify-center gap-3 shadow-sm shrink-0">
                <span className="text-3xl animate-pulse">🚨</span> 
                <div className="text-left leading-tight whitespace-nowrap">
                  <p className="text-[10px] uppercase tracking-widest opacity-80 mb-0.5">Needs Focus</p>
                  <p className="text-lg">{weakWordsCount} Weak Point{weakWordsCount > 1 ? 's' : ''}</p>
                </div>
              </button>
            )}
            <button onClick={() => router.push(`/study/${langCode}/session`)} disabled={totalWords === 0} className="w-full sm:w-auto h-[80px] px-8 bg-blue-600 text-white font-black text-xl rounded-2xl shadow-xl hover:bg-blue-700 hover:-translate-y-1 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shrink-0 whitespace-nowrap">
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
                <button onClick={() => speak(randomWord.word)} className="w-16 h-16 bg-white/20 hover:bg-white/30 rounded-2xl flex items-center justify-center text-3xl transition-all active:scale-90 shrink-0">🔊</button>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black uppercase tracking-widest opacity-70 mb-2">Random Flashback</p>
                  <h3 className="text-3xl sm:text-4xl font-black mb-1 truncate">{randomWord.word}</h3>
                  <p className="text-lg sm:text-xl opacity-90 font-medium truncate">{randomWord.translation}</p>
                </div>
              </div>
              <Link href={`/word/${randomWord.id}`} className="w-full md:w-auto bg-white text-indigo-600 px-8 py-4 rounded-2xl font-bold hover:bg-gray-100 transition-all shadow-lg active:scale-95 whitespace-nowrap text-center">Review Now</Link>
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
              <button 
                onClick={() => setSelectedIds([])}
                className="text-[10px] font-bold text-gray-400 hover:text-gray-700 bg-gray-200/50 px-4 py-3 rounded-xl uppercase tracking-widest transition-colors shrink-0"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        <div className="bg-white rounded-3xl border-2 border-gray-200 shadow-sm overflow-hidden mb-12">
          {filteredList.length > 0 ? (
            <div className="divide-y-2 divide-gray-100">
              {filteredList.map((vocab) => (
                <VocabItem 
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
            <span className="text-xl sm:text-2xl font-black tracking-tight">{selectedIds.length} <span className="text-base text-gray-400 font-bold">words</span></span>
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