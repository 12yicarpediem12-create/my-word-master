"use client";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const FilterButton = ({ active, onClick, children, activeClass = "bg-blue-600 text-white shadow-md", inactiveClass = "bg-gray-100 text-gray-500 hover:bg-gray-200" }: { active: boolean, onClick: () => void, children: React.ReactNode, activeClass?: string, inactiveClass?: string }) => (
  <button 
    onClick={onClick}
    className={`px-5 py-3 rounded-2xl font-bold text-sm transition-all flex items-center gap-2 ${active ? activeClass : inactiveClass}`}
  >
    {children}
  </button>
);

const VocabCard = ({ v }: { v: any }) => (
  <Link href={`/word/${v.id}`} className="group block h-full">
    <div className="bg-white rounded-[2rem] p-6 border-2 border-gray-100 shadow-sm hover:border-blue-500 hover:shadow-xl transition-all h-full flex flex-col relative overflow-hidden">
      <div className="absolute top-6 right-6 text-2xl group-hover:scale-110 transition-transform">
        {v.is_remembered ? "✅" : "🔥"}
      </div>
      <div className="flex items-center gap-2 mb-4">
        <span className="bg-gray-100 text-gray-500 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
          {v.language_code}
        </span>
        <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">
          {v.part_of_speech || "Word"}
        </span>
      </div>
      <h2 className="text-3xl font-black text-gray-900 tracking-tight mb-1 group-hover:text-blue-600 transition-colors break-words">
        {v.word}
      </h2>
      <p className="text-gray-500 font-bold text-lg mb-6">{v.translation}</p>
      <div className="mt-auto flex flex-wrap gap-2">
        {v.gender && (
          <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] font-black px-3 py-1 rounded-xl uppercase tracking-widest">
            {v.gender}
          </span>
        )}
        {v.verb_type && (
          <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] font-black px-3 py-1 rounded-xl uppercase tracking-widest">
            {v.verb_type}
          </span>
        )}
        {v.category && v.category !== "Other" && (
          <span className="bg-indigo-50 text-indigo-600 border border-indigo-100 text-[10px] font-black px-3 py-1 rounded-xl uppercase tracking-widest">
            {v.category}
          </span>
        )}
      </div>
    </div>
  </Link>
);

export default function LibraryPage() {
  const router = useRouter();
  const [vocab, setVocab] = useState<any[]>([]);
  const [languages, setLanguages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLang, setSelectedLang] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      const [{ data: langs }, { data: words }] = await Promise.all([
        supabase.from("languages").select("*"),
        supabase.from("vocab").select("*").order("created_at", { ascending: false })
      ]);
      
      if (langs) setLanguages(langs);
      if (words) setVocab(words);
      setIsLoading(false);
    }
    fetchData();
  }, []);

  const filteredVocab = useMemo(() => {
    return vocab.filter(v => {
      const matchLang = selectedLang === "all" || v.language_code === selectedLang;
      const matchStatus = filterStatus === "all" 
        ? true 
        : filterStatus === "mastered" ? v.is_remembered : !v.is_remembered;
      return matchLang && matchStatus;
    });
  }, [vocab, selectedLang, filterStatus]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans pb-20">
      <nav className="bg-white border-b-2 border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-50 shadow-sm">
        <Link href="/" className="text-3xl font-black tracking-tighter text-blue-600 hover:opacity-80">
          WordMaster.
        </Link>
        <button onClick={() => router.back()} className="text-sm font-bold text-gray-500 hover:text-blue-600 flex items-center gap-2 uppercase tracking-widest">
          <span>←</span> Back
        </button>
      </nav>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        <header className="mb-10 sm:mb-12 text-center sm:text-left">
          <h1 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight mb-4">Your Library</h1>
          <p className="text-lg text-gray-500 font-medium italic">
            You have collected <span className="font-black text-blue-600">{vocab.length}</span> words so far. Keep growing!
          </p>
        </header>

        <div className="mb-10 flex flex-col gap-6 bg-white p-6 rounded-[2rem] border-2 border-gray-200 shadow-sm">
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-2">Filter by Language</p>
            <div className="flex flex-wrap gap-2">
              <FilterButton active={selectedLang === "all"} onClick={() => setSelectedLang("all")}>
                🌍 All
              </FilterButton>
              {languages.map(lang => (
                <FilterButton key={lang.code} active={selectedLang === lang.code} onClick={() => setSelectedLang(lang.code)}>
                  <span>{lang.emoji}</span> {lang.name}
                </FilterButton>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-2">Filter by Status</p>
            <div className="flex flex-wrap gap-2">
              <FilterButton 
                active={filterStatus === "all"} 
                onClick={() => setFilterStatus("all")}
                activeClass="bg-gray-900 text-white shadow-md"
              >
                All Words
              </FilterButton>
              <FilterButton 
                active={filterStatus === "learning"} 
                onClick={() => setFilterStatus("learning")}
                activeClass="bg-orange-500 text-white shadow-md"
                inactiveClass="bg-orange-50 text-orange-600 hover:bg-orange-100"
              >
                🔥 Learning
              </FilterButton>
              <FilterButton 
                active={filterStatus === "mastered"} 
                onClick={() => setFilterStatus("mastered")}
                activeClass="bg-green-500 text-white shadow-md"
                inactiveClass="bg-green-50 text-green-600 hover:bg-green-100"
              >
                ✅ Mastered
              </FilterButton>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-20 font-bold text-gray-400 animate-pulse tracking-widest uppercase">
            Loading your library...
          </div>
        ) : filteredVocab.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVocab.map((v) => (
              <VocabCard key={v.id} v={v} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-[3rem] p-16 border-2 border-gray-200 shadow-sm text-center">
            <div className="text-6xl mb-6 opacity-50">📭</div>
            <h2 className="text-3xl font-black text-gray-900 mb-4">No words found</h2>
            <p className="text-gray-500 font-medium text-lg">
              Try changing your filters or add new words from the dashboard!
            </p>
          </div>
        )}
      </main>
    </div>
  );
}