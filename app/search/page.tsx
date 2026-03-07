"use client";
import { useState, useEffect, Suspense, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import SearchBar from "../components/SearchBar";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const SEARCH_RESULT_COLUMNS = "id, language_code, word, translation, part_of_speech, is_remembered, mistake_count";

const SearchWordItem = ({ vocab }: { vocab: any }) => {
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

const LanguageGroupCard = ({ langCode, words, langInfo }: { langCode: string; words: any[]; langInfo: any }) => (
  <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-10 border-2 border-gray-200 shadow-sm">
    <div className="flex items-center gap-4 mb-6 border-b-2 border-gray-50 pb-4">
      <span className="text-4xl">{langInfo?.emoji || "🌍"}</span>
      <h2 className="text-2xl font-black text-gray-900">{langInfo?.name || langCode.toUpperCase()}</h2>
      <span className="ml-auto bg-gray-100 text-gray-500 text-xs font-black px-3 py-1 rounded-full">{words.length}</span>
    </div>
    <div className="divide-y-2 divide-gray-100">
      {words.map((vocab: any) => (
        <SearchWordItem key={vocab.id} vocab={vocab} />
      ))}
    </div>
  </div>
);

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get("q") || "";
  const filterLang = searchParams.get("lang") || "all";

  const [isLoading, setIsLoading] = useState(true);
  const [results, setResults] = useState<any[]>([]);
  const [languages, setLanguages] = useState<any[]>([]);

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
      
      <nav className="bg-white border-b-2 border-gray-200 px-4 sm:px-6 py-4 flex flex-col md:flex-row justify-between items-center sticky top-0 z-50 shadow-sm gap-4">
        <div className="w-full md:w-auto flex justify-between items-center">
          <Link href="/" className="text-2xl sm:text-3xl font-black tracking-tighter text-blue-600 hover:opacity-80 transition-opacity">
            WordMaster.
          </Link>
        </div>
        <div className="w-full md:flex-1 md:max-w-2xl md:mx-8">
          <SearchBar />
        </div>
        <button onClick={() => router.back()} className="text-[10px] sm:text-sm font-bold text-gray-500 hover:text-blue-600 uppercase tracking-widest flex items-center gap-2 shrink-0 transition-colors">
          <span>←</span> Back
        </button>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        
        <div className="mb-10 sm:mb-12">
          <p className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Search Results</p>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-gray-900 break-all">
            "{query}"
          </h1>
          <p className="text-xs sm:text-sm font-bold text-gray-500 mt-4">
            Found {results.length} word{results.length !== 1 ? 's' : ''} across your library.
          </p>
        </div>

        {isLoading ? (
          <div className="text-center py-20 font-bold text-gray-400 animate-pulse tracking-widest uppercase">
            Searching...
          </div>
        ) : results.length > 0 ? (
          <div className="space-y-8 sm:space-y-12">
            {Object.keys(groupedResults).map((langCode: string) => (
              <LanguageGroupCard 
                key={langCode} 
                langCode={langCode} 
                words={groupedResults[langCode]} 
                langInfo={languages.find((l: any) => l.code === langCode)} 
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
