"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/app/lib/supabase-browser";
import type { Language, VocabItem } from "@/app/lib/types";

const supabase = getSupabaseBrowserClient();

const SEARCH_BAR_COLUMNS = "id, language_code, word, translation, part_of_speech";

export default function SearchBar({ forcedLang }: { forcedLang?: string }) {
  const router = useRouter();
  const [languages, setLanguages] = useState<Language[]>([]);
  const [selectedLang, setSelectedLang] = useState(forcedLang || "all");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<VocabItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchLangs() {
      const { data } = await supabase.from("languages").select("*");
      if (data) setLanguages(data as Language[]);
    }
    fetchLangs();
  }, []);

  useEffect(() => {
    if (forcedLang) setSelectedLang(forcedLang);
  }, [forcedLang]);

  const currentLangData = languages.find(l => l.code === selectedLang);

  const executeSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    let wordQuery = supabase.from("vocab").select(SEARCH_BAR_COLUMNS).ilike("word", `%${searchQuery}%`).limit(20);
    let translationQuery = supabase.from("vocab").select(SEARCH_BAR_COLUMNS).ilike("translation", `%${searchQuery}%`).limit(20);

    if (selectedLang !== "all") {
      wordQuery = wordQuery.eq("language_code", selectedLang);
      translationQuery = translationQuery.eq("language_code", selectedLang);
    }

    const [{ data: words, error: wordError }, { data: translations, error: translationError }] = await Promise.all([
      wordQuery,
      translationQuery,
    ]);
    if (wordError || translationError) return;

    const merged = [...(words || []), ...(translations || [])];
    const unique = Array.from(new Map(merged.map((item) => [item.id, item])).values()).slice(0, 20) as VocabItem[];
    setResults(unique);
    setIsOpen(true);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim()) executeSearch(query);
      else setIsOpen(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, selectedLang]);

  const handleManualSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;
    
    setIsOpen(false);
    router.push(`/search?q=${encodeURIComponent(query)}&lang=${selectedLang}`);
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={searchRef} className="relative w-full max-w-2xl mx-auto z-[100]">
      <form 
        onSubmit={handleManualSearch}
        className="flex items-center bg-gray-50 border-2 border-gray-200 rounded-2xl focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100 transition-all shadow-sm pr-2"
      >
        {!forcedLang ? (
          <select
            value={selectedLang}
            onChange={(e) => setSelectedLang(e.target.value)}
            className="bg-transparent text-gray-600 font-bold py-3 pl-4 pr-2 outline-none cursor-pointer border-r-2 border-gray-200 appearance-none rounded-l-2xl hover:bg-gray-100 transition-colors h-full"
          >
            <option value="all">🌍 All</option>
            {languages.map((l) => (
              <option key={l.code} value={l.code}>{l.emoji} {l.code.toUpperCase()}</option>
            ))}
          </select>
        ) : (
          <div className="bg-gray-100/50 text-gray-500 font-black py-3 px-4 border-r-2 border-gray-200 rounded-l-2xl flex items-center gap-2">
             <span>{currentLangData?.emoji}</span>
             <span className="text-xs">{forcedLang.toUpperCase()}</span>
          </div>
        )}

        <div className="flex-1 flex items-center px-4">
          <input
            type="text"
            placeholder={
              forcedLang 
              ? `Search ${currentLangData?.name || ""} or English...` 
              : "Search words or meanings..."
            }
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent outline-none font-bold text-gray-900 placeholder-gray-400 py-3"
          />
        </div>

        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-xl transition-all">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
        </button>
      </form>

      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-gray-200 rounded-2xl shadow-xl max-h-96 overflow-y-auto animate-fade-in divide-y divide-gray-100">
          {results.map((vocab) => (
            <Link href={`/word/${vocab.id}`} key={vocab.id} onClick={() => setIsOpen(false)} className="p-4 hover:bg-gray-50 flex justify-between items-center group block">
              <div className="flex items-center gap-4">
                <div className="text-2xl opacity-40 group-hover:opacity-100 transition-opacity">🔍</div>
                <div>
                  <p className="text-lg font-black text-gray-900 group-hover:text-blue-600">
                    {vocab.word} 
                  </p>
                  <p className="text-sm font-medium text-gray-500">
                    {vocab.translation}
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold bg-gray-100 text-gray-500 px-3 py-1 rounded-full uppercase">{vocab.part_of_speech}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
