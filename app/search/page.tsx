"use client";
import { useState, useEffect, Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import SearchBar from "../components/SearchBar";
import AppHeader from "../components/AppHeader";
import DensityToggle, { type DensityMode } from "../components/DensityToggle";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const SEARCH_RESULT_COLUMNS = "id, language_code, word, translation, part_of_speech, is_remembered, mistake_count";

const SearchWordItemRich = ({ vocab }: { vocab: any }) => {
  const isWeak = (vocab.mistake_count || 0) > 0;
  return (
    <Link href={`/word/${vocab.id}`} className="py-4 hover:bg-gray-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between group block rounded-2xl px-2 sm:px-4 -mx-2 sm:-mx-4">
      <div className="flex items-start sm:items-center gap-4 sm:gap-6 mb-2 sm:mb-0">
        <span className={`w-3 h-3 rounded-full mt-2 sm:mt-0 shrink-0 ${vocab.is_remembered ? "bg-green-400" : "bg-orange-400"}`}></span>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-xl sm:text-2xl font-black text-gray-900 group-hover:text-blue-600 transition-colors">{vocab.word}</p>
            {isWeak && !vocab.is_remembered && <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold uppercase">Weak</span>}
          </div>
          <p className="text-sm font-medium text-gray-500 mt-1">{vocab.translation}</p>
        </div>
      </div>
      
      <div className="flex items-center gap-4 pl-7 sm:pl-0 self-start sm:self-auto">
        <span className="hidden sm:inline-block text-[10px] font-bold bg-gray-100 text-gray-400 px-3 py-1 rounded-full uppercase tracking-widest">{vocab.part_of_speech || "N/A"}</span>
        <span className="text-xl sm:text-2xl">{vocab.is_remembered ? "✅" : "🔥"}</span>
      </div>
    </Link>
  );
};

const SearchWordItemCompact = ({ vocab }: { vocab: any }) => {
  const isWeak = (vocab.mistake_count || 0) > 0;

  return (
    <Link
      href={`/word/${vocab.id}`}
      className="group block rounded-2xl border border-gray-100 bg-white px-4 py-3 hover:border-blue-200 hover:bg-blue-50/30 transition-all"
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`w-2.5 h-2.5 rounded-full ${vocab.is_remembered ? "bg-green-400" : "bg-orange-400"}`}></span>
            <p className="text-lg font-black text-gray-900 group-hover:text-blue-600 transition-colors break-words">{vocab.word}</p>
            {isWeak && !vocab.is_remembered && <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold uppercase">Weak</span>}
          </div>
          <p className="text-sm font-bold text-gray-500 mt-1 break-words">{vocab.translation}</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:justify-end">
          <span className="text-[10px] font-black bg-gray-100 text-gray-500 px-3 py-1 rounded-full uppercase tracking-widest">
            {vocab.part_of_speech || "N/A"}
          </span>
          <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border ${vocab.is_remembered ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-orange-50 text-orange-600 border-orange-100"}`}>
            {vocab.is_remembered ? "Mastered" : "Learning"}
          </span>
        </div>
      </div>
    </Link>
  );
};

const LanguageGroupCard = ({
  langCode,
  words,
  langInfo,
  densityMode,
}: {
  langCode: string;
  words: any[];
  langInfo: any;
  densityMode: DensityMode;
}) => (
  <div className={`bg-white border-2 border-gray-200 shadow-sm ${densityMode === "rich" ? "rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-10" : "rounded-[1.75rem] p-4 sm:p-5"}`}>
    <div className={`flex items-center gap-4 border-b-2 border-gray-50 ${densityMode === "rich" ? "mb-6 pb-4" : "mb-4 pb-3"}`}>
      <span className="text-4xl">{langInfo?.emoji || "🌍"}</span>
      <h2 className="text-2xl font-black text-gray-900">{langInfo?.name || langCode.toUpperCase()}</h2>
      <span className="ml-auto bg-gray-100 text-gray-500 text-xs font-black px-3 py-1 rounded-full">{words.length}</span>
    </div>
    <div className={densityMode === "rich" ? "divide-y-2 divide-gray-100" : "space-y-2"}>
      {words.map((vocab: any) => (
        densityMode === "rich" ? <SearchWordItemRich key={vocab.id} vocab={vocab} /> : <SearchWordItemCompact key={vocab.id} vocab={vocab} />
      ))}
    </div>
  </div>
);

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const filterLang = searchParams.get("lang") || "all";

  const [isLoading, setIsLoading] = useState(true);
  const [results, setResults] = useState<any[]>([]);
  const [languages, setLanguages] = useState<any[]>([]);
  const [densityMode, setDensityMode] = useState<DensityMode>("rich");

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);

      const { data: langData } = await supabase.from("languages").select("*");
      if (langData) setLanguages(langData);

      if (query.trim()) {
        let wordQuery = supabase.from("vocab").select(SEARCH_RESULT_COLUMNS).ilike("word", `%${query}%`);
        let translationQuery = supabase.from("vocab").select(SEARCH_RESULT_COLUMNS).ilike("translation", `%${query}%`);

        if (filterLang !== "all") {
          wordQuery = wordQuery.eq("language_code", filterLang);
          translationQuery = translationQuery.eq("language_code", filterLang);
        }

        const [{ data: wordData }, { data: translationData }] = await Promise.all([wordQuery, translationQuery]);
        const merged = [...(wordData || []), ...(translationData || [])];
        const unique = Array.from(new Map(merged.map((item) => [item.id, item])).values());
        unique.sort((a, b) => String(a.language_code).localeCompare(String(b.language_code)));
        setResults(unique);
      } else {
        setResults([]);
      }
      
      setIsLoading(false);
    }

    fetchData();
  }, [query, filterLang]);

  const groupedResults = useMemo(() => {
    return results.reduce((acc: Record<string, any[]>, vocab: any) => {
      if (!acc[vocab.language_code]) {
        acc[vocab.language_code] = [];
      }
      acc[vocab.language_code].push(vocab);
      return acc;
    }, {} as Record<string, any[]>);
  }, [results]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans pb-20">
      <AppHeader primarySection="library" searchSlot={<SearchBar />} backHref="/library" backLabel="Library" />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        
        <div className="mb-10 sm:mb-12 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
          <div>
            <p className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Search Results</p>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-gray-900 break-all">
              "{query}"
            </h1>
            <p className="text-xs sm:text-sm font-bold text-gray-500 mt-4">
              Found {results.length} word{results.length !== 1 ? 's' : ''} across your library.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">View Density</p>
              <p className="text-sm font-bold text-gray-500 mt-1">
                {densityMode === "rich" ? "More spacing and larger scan targets." : "Denser grouped rows for faster scanning."}
              </p>
            </div>
            <DensityToggle value={densityMode} onChange={setDensityMode} />
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-20 font-bold text-gray-400 animate-pulse tracking-widest uppercase">
            Searching...
          </div>
        ) : results.length > 0 ? (
          <div className={densityMode === "rich" ? "space-y-8 sm:space-y-12" : "space-y-6"}>
            {Object.keys(groupedResults).map((langCode: string) => (
              <LanguageGroupCard 
                key={langCode} 
                langCode={langCode} 
                words={groupedResults[langCode]} 
                langInfo={languages.find((l: any) => l.code === langCode)} 
                densityMode={densityMode}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-[2.5rem] p-10 sm:p-12 border-2 border-gray-200 shadow-sm text-center">
            <div className="text-5xl sm:text-6xl mb-6 opacity-50">🏜️</div>
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 mb-2">No words found</h2>
            <p className="text-sm sm:text-base text-gray-500 font-medium">We couldn't find any words matching "{query}".</p>
          </div>
        )}

      </main>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center font-bold text-gray-500 tracking-widest uppercase">Loading...</div>}>
      <SearchContent />
    </Suspense>
  );
}
