"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AppHeader from "../components/AppHeader";
import { AppMain, AppShell, PageIntro, Surface } from "../components/layout/AppShell";
import { getSupabaseBrowserClient } from "../lib/supabase-browser";

const supabase = getSupabaseBrowserClient();

export default function RootIndexPage() {
  const [vocab, setVocab] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function fetchRoots() {
      const { data } = await supabase
        .from("vocab")
        .select("id, word, language_code, root_word, translation")
        .not("root_word", "is", null);

      if (data) setVocab(data);
      setIsLoading(false);
    }
    fetchRoots();
  }, []);

  const rootGroups = useMemo(() => {
    const groups: Record<string, { count: number; langs: Set<string>; words: string[] }> = {};
    vocab.forEach((v) => {
      if (!v.root_word || v.root_word.trim() === "") return;

      if (!groups[v.root_word]) {
        groups[v.root_word] = { count: 0, langs: new Set(), words: [] };
      }
      groups[v.root_word].count += 1;
      groups[v.root_word].langs.add(v.language_code);

      groups[v.root_word].words.push(v.word.toLowerCase());
      if (v.translation) groups[v.root_word].words.push(v.translation.toLowerCase());
    });

    return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]));
  }, [vocab]);

  const filteredRoots = useMemo(() => {
    if (!searchQuery.trim()) return rootGroups;

    const query = searchQuery.toLowerCase().trim();

    return rootGroups.filter(([root, info]) => {
      const matchRoot = root.toLowerCase().includes(query);
      const matchWords = info.words.some((w) => w.includes(query));
      return matchRoot || matchWords;
    });
  }, [rootGroups, searchQuery]);

  return (
    <AppShell className="pb-24">
      <AppHeader primarySection={null} backHref="/" backLabel="Dashboard" />

      <AppMain width="lg" className="section-stack">
        <PageIntro
          eyebrow="Roots"
          title="Explore origins and etymology"
          description="Use this index to browse root families and linguistic connections. It is an exploratory reference page, not part of the main daily review loop."
        />

        <Surface tone="muted" className="p-5 sm:p-6">
          <label className="mb-3 block text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Search roots or related words</label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-5">
              <svg className="h-5 w-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by root, vocab, or meaning..."
              className="w-full rounded-[1.75rem] border border-slate-200 bg-white py-4 pl-14 pr-5 text-base font-bold text-slate-950 outline-none transition-all placeholder:text-slate-300 focus:border-rose-300"
            />
          </div>
        </Surface>

        {isLoading ? (
          <div className="rounded-[2rem] border border-slate-200 bg-slate-50/70 px-6 py-20 text-center font-bold uppercase tracking-widest text-slate-400 animate-pulse">
            Loading origins...
          </div>
        ) : filteredRoots.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredRoots.map(([root, info]) => (
              <Link
                href={`/root/${encodeURIComponent(root).replace(/\*/g, "%2A").replace(/\(/g, "%28").replace(/\)/g, "%29")}`}
                key={root}
                className="rounded-[2rem] border border-rose-100 bg-white/85 p-6 shadow-[0_18px_34px_-30px_rgba(15,23,42,0.18)] transition-all hover:border-rose-300 hover:bg-white"
              >
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-rose-400">Root Family</p>
                  <h2 className="mt-3 line-clamp-2 text-xl font-black leading-tight text-slate-950 transition-colors hover:text-rose-600">
                    {root}
                  </h2>
                </div>

                <div className="mt-6 flex items-end justify-between gap-4">
                  <div className="flex flex-wrap gap-1">
                    {Array.from(info.langs).map((lang) => (
                      <span key={lang} className="rounded-md bg-slate-100 px-2 py-0.5 text-[8px] font-black uppercase text-slate-500">
                        {lang}
                      </span>
                    ))}
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black leading-none text-rose-500">{info.count}</span>
                    <span className="mt-1 block text-[8px] font-bold uppercase tracking-widest text-rose-300">Words</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <Surface tone="muted" className="rounded-[2.5rem] p-12 text-center sm:p-16">
            <div className="text-6xl opacity-40">🧭</div>
            <h2 className="mt-6 text-2xl font-black tracking-tight text-slate-950">No matches found</h2>
            <p className="mt-2 text-sm font-medium text-slate-500 sm:text-base">
              We couldn&apos;t find any roots or words matching &quot;{searchQuery}&quot;
            </p>
          </Surface>
        )}
      </AppMain>
    </AppShell>
  );
}
