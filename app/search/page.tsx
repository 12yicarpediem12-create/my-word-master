"use client";
import { useState, useEffect, Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import SearchBar from "../components/SearchBar";
import AppHeader from "../components/AppHeader";
import DensityToggle, { type DensityMode } from "../components/DensityToggle";
import { AppMain, AppShell, PageIntro } from "../components/layout/AppShell";
import {
  WorkspaceFilterGroup,
  WorkspaceEmptyState,
  WorkspaceHeader,
  WorkspacePanel,
  WorkspaceUtilityPanel,
} from "../components/workspace/VocabWorkspace";
import { getSupabaseBrowserClient } from "../lib/supabase-browser";

const supabase = getSupabaseBrowserClient();

const SEARCH_RESULT_COLUMNS = "id, language_code, word, translation, part_of_speech, is_remembered, mistake_count";

const SearchWordItemRich = ({ vocab }: { vocab: any }) => {
  const isWeak = (vocab.mistake_count || 0) > 0;
  return (
    <Link href={`/word/${vocab.id}`} className="group -mx-2 block rounded-2xl px-2 py-4 transition-colors hover:bg-gray-50 sm:-mx-4 sm:px-4">
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
      className="group block rounded-2xl border border-gray-100 bg-white px-4 py-3 transition-all hover:border-blue-200 hover:bg-blue-50/30"
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
  <section className={`rounded-[2rem] border border-slate-200/80 bg-white/80 ${densityMode === "rich" ? "p-6 sm:p-8" : "p-4 sm:p-5"}`}>
    <div className={`flex items-center gap-4 border-b border-slate-100 ${densityMode === "rich" ? "mb-6 pb-4" : "mb-4 pb-3"}`}>
      <span className="text-4xl">{langInfo?.emoji || "🌍"}</span>
      <div>
        <h2 className="text-2xl font-black tracking-tight text-gray-900">{langInfo?.name || langCode.toUpperCase()}</h2>
        <p className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{langCode.toUpperCase()}</p>
      </div>
      <span className="ml-auto rounded-full bg-gray-100 px-3 py-1 text-xs font-black text-gray-500">{words.length}</span>
    </div>
    <div className={densityMode === "rich" ? "divide-y-2 divide-gray-100" : "space-y-2"}>
      {words.map((vocab: any) => (
        densityMode === "rich" ? <SearchWordItemRich key={vocab.id} vocab={vocab} /> : <SearchWordItemCompact key={vocab.id} vocab={vocab} />
      ))}
    </div>
  </section>
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
    <AppShell className="pb-20">
      <AppHeader primarySection="library" searchSlot={<SearchBar />} backHref="/library" backLabel="Library" />

      <AppMain width="xl" className="section-stack">
        <PageIntro
          eyebrow="Learning Workspace"
          title="Search library"
          description={
            query.trim()
              ? `Showing ${results.length} result${results.length !== 1 ? "s" : ""} for “${query}”.`
              : "Search across your library or focus on one language from the search bar."
          }
        />

        <WorkspacePanel className="p-6 sm:p-7">
          <WorkspaceHeader
            eyebrow="Vocabulary Workspace"
            title="Workspace controls"
            description={filterLang === "all" ? "Scanning results across your full library." : `Scanning only ${filterLang.toUpperCase()} results.`}
            actions={
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-500">
                {results.length} results
              </span>
            }
          />

          <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
            <div className="space-y-5">
              <WorkspaceFilterGroup label="Query">
                <span className="inline-flex items-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700">
                  {query.trim() ? `“${query}”` : "No active query"}
                </span>
              </WorkspaceFilterGroup>

              <WorkspaceFilterGroup label="Scope">
                <span className="inline-flex items-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700">
                  {filterLang === "all" ? "🌍 All languages" : `Focused on ${filterLang.toUpperCase()}`}
                </span>
              </WorkspaceFilterGroup>
            </div>

            <WorkspaceUtilityPanel
              eyebrow="Display"
              title="View density"
              description={densityMode === "rich" ? "More spacing and larger scan targets." : "Denser grouped rows for faster scanning."}
            >
              <DensityToggle value={densityMode} onChange={setDensityMode} />
            </WorkspaceUtilityPanel>
          </div>
        </WorkspacePanel>

        <WorkspacePanel className="p-5 sm:p-6">
          <WorkspaceHeader
            eyebrow="Results"
            title="Search results"
            description={filterLang === "all" ? "Grouped by language so search still feels like one library workspace." : `Focused on ${filterLang.toUpperCase()} results only.`}
            actions={
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-500">
                {densityMode} view
              </span>
            }
          />

          <div className="mt-5">
            {isLoading ? (
              <div className="rounded-[2rem] border border-slate-200 bg-slate-50/70 px-6 py-20 text-center font-bold uppercase tracking-widest text-gray-400 animate-pulse">
                Searching...
              </div>
            ) : results.length > 0 ? (
              <div className={densityMode === "rich" ? "space-y-6 sm:space-y-8" : "space-y-5"}>
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
              <WorkspaceEmptyState
                icon="🏜️"
                title="No words found"
                description={query.trim() ? `We couldn't find any words matching "${query}".` : "Type a query above to search across your library."}
                className="rounded-[2rem] border border-dashed border-slate-200 bg-slate-50/50 p-12 shadow-none"
              />
            )}
          </div>
        </WorkspacePanel>

      </AppMain>
    </AppShell>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center font-bold text-gray-500 tracking-widest uppercase">Loading...</div>}>
      <SearchContent />
    </Suspense>
  );
}
