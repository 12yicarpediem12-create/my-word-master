"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import AppHeader from "@/app/components/AppHeader";
import { AppMain, AppShell, PageIntro, Surface } from "@/app/components/layout/AppShell";
import { getSupabaseBrowserClient } from "@/app/lib/supabase-browser";

const supabase = getSupabaseBrowserClient();

const BreadcrumbNav = ({ breadcrumbs, langCode, rootId }: { breadcrumbs: any[]; langCode: string; rootId: string }) => (
  <div className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-blue-500">
    {breadcrumbs.map((crumb) => (
      <span key={crumb.id} className="flex items-center gap-2">
        <Link
          href={`/study/${langCode}/topics?open=${rootId}#topic-${crumb.id}`}
          className="opacity-70 transition-all hover:text-blue-700 hover:underline hover:opacity-100"
        >
          {crumb.name}
        </Link>
        <span className="text-blue-300 opacity-40">&gt;</span>
      </span>
    ))}
  </div>
);

const WordCard = ({ w }: { w: any }) => (
  <Link
    href={`/word/${w.id}`}
    className="group flex items-center justify-between gap-4 px-5 py-5 transition-all hover:bg-slate-50 sm:px-6"
  >
    <div className="min-w-0 flex-1">
      <p className="truncate text-xl font-black text-slate-950 transition-colors group-hover:text-blue-600 sm:text-2xl">
        {w.word}
      </p>
      <p className="mt-1 truncate text-sm font-medium text-slate-500">
        {w.translation}
      </p>
    </div>
    <div className="flex shrink-0 items-center gap-3">
      <span className="hidden rounded-lg border border-slate-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-400 sm:inline-block">
        {w.part_of_speech || "N/A"}
      </span>
      <span className="text-2xl">{w.is_remembered ? "✅" : "🔥"}</span>
    </div>
  </Link>
);

export default function TopicDetailPage() {
  const params = useParams();
  const langCode = params?.lang as string;
  const categoryId = params?.categoryId as string;

  const [category, setCategory] = useState<any>(null);
  const [words, setWords] = useState<any[]>([]);
  const [breadcrumbs, setBreadcrumbs] = useState<{ id: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!langCode || !categoryId) return;

      const [{ data: catData }, { data: allCats }, { data: wordData }] = await Promise.all([
        supabase.from("categories").select("*").eq("id", categoryId).single(),
        supabase.from("categories").select("id, name, parent_id"),
        supabase.from("vocab").select("*").eq("language_code", langCode).eq("category_id", categoryId),
      ]);

      if (catData) {
        setCategory(catData);

        if (allCats) {
          const crumbs = [];
          let currentParentId = catData.parent_id;

          while (currentParentId) {
            const parent = allCats.find((c: any) => c.id === currentParentId);
            if (parent) {
              crumbs.unshift({ id: parent.id, name: parent.name });
              currentParentId = parent.parent_id;
            } else {
              break;
            }
          }
          setBreadcrumbs(crumbs);
        }
      }

      if (wordData) setWords(wordData);
      setIsLoading(false);
    }

    fetchData();
  }, [langCode, categoryId]);

  const topicsPath = langCode ? `/study/${langCode}/topics` : "#";
  const rootId = breadcrumbs.length > 0 ? breadcrumbs[0].id : category?.id;

  return (
    <AppShell className="pb-24">
      <AppHeader primarySection="study" backHref={topicsPath} backLabel="Topics" />

      <AppMain width="lg" className="section-stack">
        {isLoading ? (
          <div className="rounded-[2rem] border border-slate-200 bg-slate-50/70 px-6 py-20 text-center font-black uppercase tracking-widest text-slate-400 animate-pulse">
            Loading words...
          </div>
        ) : (
          <>
            <PageIntro
              eyebrow="Topic Detail"
              title={category?.name || "Topic"}
              description={`${words.length} ${words.length === 1 ? "word" : "words"} collected in this topic.`}
              actions={breadcrumbs.length > 0 ? <BreadcrumbNav breadcrumbs={breadcrumbs} langCode={langCode} rootId={rootId} /> : undefined}
            />

            <Surface tone="card" className="overflow-hidden rounded-[2rem] p-0">
              {words.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {words.map((w) => <WordCard key={w.id} w={w} />)}
                </div>
              ) : (
                <div className="p-16 text-center sm:p-24">
                  <span className="text-6xl opacity-20">🔍</span>
                  <p className="mt-6 text-xs font-black uppercase tracking-[0.18em] text-slate-300">
                    No words in this topic yet
                  </p>
                </div>
              )}
            </Surface>
          </>
        )}
      </AppMain>
    </AppShell>
  );
}
