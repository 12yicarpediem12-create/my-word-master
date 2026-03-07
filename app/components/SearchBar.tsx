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
    <div ref={searchRef} className="relative w-full z-[100]">
      <form 
        onSubmit={handleManualSearch}
        className="flex items-center rounded-[1.35rem] border border-slate-200 bg-white pr-2 shadow-[0_18px_38px_-30px_rgba(15,23,42,0.22)] transition-all focus-within:border-blue-300 focus-within:shadow-[0_24px_50px_-34px_rgba(37,99,235,0.24)]"
      >
        {!forcedLang ? (
          <select
            value={selectedLang}
            onChange={(e) => setSelectedLang(e.target.value)}
            className="h-full cursor-pointer appearance-none rounded-l-[1.35rem] border-r border-slate-200 bg-slate-50/85 py-3 pl-4 pr-2 font-bold text-slate-600 outline-none transition-colors hover:bg-slate-100"
          >
            <option value="all">🌍 All</option>
            {languages.map((l) => (
              <option key={l.code} value={l.code}>{l.emoji} {l.code.toUpperCase()}</option>
            ))}
          </select>
        ) : (
          <div className="flex items-center gap-2 rounded-l-[1.35rem] border-r border-slate-200 bg-slate-50/90 px-4 py-3 font-black text-slate-500">
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
            className="w-full bg-transparent py-3 font-bold text-slate-900 outline-none placeholder:text-slate-400"
          />
        </div>

        <button type="submit" className="rounded-xl bg-blue-600 p-2.5 text-white transition-all hover:bg-blue-700 shadow-[0_12px_24px_-18px_rgba(37,99,235,0.8)]">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
        </button>
      </form>

      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 max-h-96 overflow-y-auto divide-y divide-slate-100 rounded-[1.5rem] border border-slate-200 bg-white shadow-[0_26px_60px_-38px_rgba(15,23,42,0.3)] animate-fade-in">
          {results.map((vocab) => (
            <Link href={`/word/${vocab.id}`} key={vocab.id} onClick={() => setIsOpen(false)} className="group block p-4 hover:bg-slate-50/90 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="text-2xl opacity-40 group-hover:opacity-100 transition-opacity">🔍</div>
                <div>
                  <p className="text-lg font-black text-slate-900 group-hover:text-blue-600">
                    {vocab.word} 
                  </p>
                  <p className="text-sm font-medium text-slate-500">
                    {vocab.translation}
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase text-slate-500">{vocab.part_of_speech}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
