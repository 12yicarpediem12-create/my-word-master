"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import AppHeader from "@/app/components/AppHeader";
import { AppMain, AppShell, PageIntro, Surface } from "@/app/components/layout/AppShell";
import { getSupabaseBrowserClient } from "@/app/lib/supabase-browser";

const supabase = getSupabaseBrowserClient();

export default function RootMindMapPage() {
  const params = useParams();
  const router = useRouter();
  const [vocabList, setVocabList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const rawRoot = (params?.root as string) || "";
  const decodedRoot = decodeURIComponent(rawRoot);

  useEffect(() => {
    async function fetchRelatedWords() {
      if (!decodedRoot) return;
      const { data } = await supabase
        .from("vocab")
        .select("*")
        .eq("root_word", decodedRoot);

      if (data) setVocabList(data);
      setIsLoading(false);
    }
    fetchRelatedWords();
  }, [decodedRoot]);

  if (isLoading) {
    return (
      <AppShell className="pb-24">
        <AppHeader primarySection={null} backHref="/root" backLabel="Roots" />
        <AppMain width="xl">
          <div className="rounded-[2rem] border border-slate-200 bg-slate-50/70 px-6 py-20 text-center font-bold uppercase tracking-widest text-slate-400 animate-pulse">
            Loading root family...
          </div>
        </AppMain>
      </AppShell>
    );
  }

  if (vocabList.length === 0) {
    return (
      <AppShell className="pb-24">
        <AppHeader primarySection={null} backHref="/root" backLabel="Roots" />
        <AppMain width="md" className="section-stack">
          <PageIntro
            eyebrow="Root"
            title="Root not found"
            description={`We couldn’t find any words derived from “${decodedRoot}”.`}
          />
          <Surface tone="muted" className="rounded-[2.5rem] p-12 text-center">
            <div className="text-6xl opacity-40">🍃</div>
            <p className="mt-6 text-sm font-medium text-slate-500">Try returning to the roots index and searching again.</p>
            <button onClick={() => router.back()} className="mt-6 rounded-2xl bg-blue-600 px-6 py-4 font-black text-white transition-colors hover:bg-blue-700">
              Back to Roots
            </button>
          </Surface>
        </AppMain>
      </AppShell>
    );
  }

  return (
    <AppShell className="pb-24">
      <AppHeader primarySection={null} backHref="/root" backLabel="Roots" />

      <AppMain width="xl" className="section-stack">
        <PageIntro
          eyebrow="Root Family"
          title={decodedRoot}
          description={`This reference page groups ${vocabList.length} related word${vocabList.length === 1 ? "" : "s"} around one origin so you can explore the family and jump into word records.`}
        />

        <Surface tone="muted" className="overflow-hidden p-6 sm:p-8">
          <div
            className="rounded-[2rem] border border-slate-200/80 bg-white/65 p-5 sm:p-8"
            style={{
              backgroundImage: "radial-gradient(rgba(148,163,184,0.3) 1.2px, transparent 1.2px)",
              backgroundSize: "22px 22px",
            }}
          >
            <div className="flex min-w-max flex-col gap-6 lg:flex-row lg:items-stretch">
              <div className="flex items-center lg:min-w-[18rem]">
                <div className="w-full rounded-[1.75rem] border border-blue-300 bg-blue-600 p-6 text-white shadow-[0_20px_40px_-30px_rgba(37,99,235,0.6)]">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-100">Root Origin</p>
                  <h1 className="mt-3 break-words text-3xl font-black tracking-tight">{decodedRoot}</h1>
                  <p className="mt-4 inline-flex rounded-full bg-blue-700/40 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-blue-100">
                    {vocabList.length} derived words
                  </p>
                </div>
              </div>

              <div className="hidden w-10 items-center lg:flex">
                <div className="h-[2px] w-full bg-slate-300" />
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {vocabList.map((vocab) => (
                  <Link
                    href={`/word/${vocab.id}`}
                    key={vocab.id}
                    className="rounded-[1.75rem] border border-indigo-100 bg-indigo-50/85 p-5 transition-all hover:border-indigo-300 hover:bg-white"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="rounded-md bg-white/80 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-indigo-500">
                        {vocab.language_code}
                      </span>
                      {vocab.part_of_speech && (
                        <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">{vocab.part_of_speech}</span>
                      )}
                    </div>
                    <h2 className="mt-4 break-words text-2xl font-black leading-tight text-slate-950">{vocab.word}</h2>
                    <p className="mt-2 text-sm font-medium text-slate-600">{vocab.translation}</p>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </Surface>
      </AppMain>
    </AppShell>
  );
}
