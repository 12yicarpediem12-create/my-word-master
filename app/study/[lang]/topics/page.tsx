"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import AppHeader from "@/app/components/AppHeader";
import { AppMain, AppShell, PageIntro, Surface } from "@/app/components/layout/AppShell";
import { getSupabaseBrowserClient } from "@/app/lib/supabase-browser";

const supabase = getSupabaseBrowserClient();

const TopicLink = ({ langCode, topic }: { langCode: string; topic: any }) => (
  <Link
    href={`/study/${langCode}/topics/${topic.id}`}
    id={`topic-${topic.id}`}
    className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 transition-all hover:border-blue-200 hover:text-blue-600"
  >
    {topic.name}
  </Link>
);

const SubTopicSection = ({ langCode, subTopic, childrenTopics }: { langCode: string; subTopic: any; childrenTopics: any[] }) => (
  <div id={`topic-${subTopic.id}`} className="animate-in fade-in slide-in-from-top-2 duration-300 p-2">
    <h3 className="mb-4 border-l-4 border-blue-200 pl-3 text-xs font-black uppercase tracking-widest text-blue-400">
      {subTopic.name}
    </h3>
    <div className="flex flex-wrap gap-2">
      {childrenTopics.map((ssub) => (
        <TopicLink key={ssub.id} langCode={langCode} topic={ssub} />
      ))}
    </div>
  </div>
);

const MainTopicCard = ({
  topic,
  isExpanded,
  onToggle,
  subTopics,
  getChildren,
  langCode,
}: {
  topic: any;
  isExpanded: boolean;
  onToggle: () => void;
  subTopics: any[];
  getChildren: (id: number) => any[];
  langCode: string;
}) => (
  <div id={`topic-${topic.id}`} className="overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white/85 shadow-[0_18px_36px_-30px_rgba(15,23,42,0.18)]">
    <button
      onClick={onToggle}
      className="flex w-full items-center justify-between p-5 text-left transition-colors hover:bg-slate-50 sm:p-6"
    >
      <div className="flex items-center gap-4">
        <span className="text-3xl">📁</span>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Main Topic</p>
          <h2 className="mt-1 text-xl font-black tracking-tight text-slate-950 sm:text-2xl">{topic.name}</h2>
        </div>
      </div>
      <span className={`text-xl font-black text-slate-300 transition-transform duration-300 ${isExpanded ? "rotate-180 text-blue-500" : ""}`}>
        ↓
      </span>
    </button>

    {isExpanded && (
      <div className="border-t border-slate-200 bg-slate-50/60 px-5 pb-8 pt-6 sm:px-6">
        <div className="space-y-8">
          {subTopics.map((sub) => (
            <SubTopicSection key={sub.id} langCode={langCode} subTopic={sub} childrenTopics={getChildren(sub.id)} />
          ))}
        </div>
      </div>
    )}
  </div>
);

function TopicsContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const langCode = params?.lang as string;

  const openTopicId = searchParams.get("open");

  const [categories, setCategories] = useState<any[]>([]);
  const [expandedTopic, setExpandedTopic] = useState<string | number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchCategories() {
      const { data } = await supabase
        .from("categories")
        .select("*")
        .order("id", { ascending: true });
      if (data) setCategories(data);
      setIsLoading(false);
    }
    fetchCategories();
  }, []);

  useEffect(() => {
    if (openTopicId && !isLoading) {
      setExpandedTopic(openTopicId);

      setTimeout(() => {
        const hash = window.location.hash;
        if (hash) {
          const element = document.querySelector(hash);
          if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "center" });
            element.classList.add("bg-blue-50", "rounded-2xl", "transition-colors", "duration-1000");
            setTimeout(() => element.classList.remove("bg-blue-50"), 2000);
          }
        }
      }, 300);
    }
  }, [openTopicId, isLoading]);

  const mainTopics = useMemo(() => categories.filter((c) => c.level === 1), [categories]);
  const getChildren = useCallback((parentId: number) => categories.filter((c) => c.parent_id === parentId), [categories]);

  const hubPath = langCode ? `/study/${langCode}` : "#";

  return (
    <AppShell className="pb-24">
      <AppHeader primarySection="study" backHref={hubPath} backLabel="Study Hub" />

      <AppMain width="lg" className="section-stack">
        <PageIntro
          eyebrow="Topics"
          title="Browse vocabulary by topic"
          description="Use topics to explore one language by theme. This is a supporting browse page that feeds back into the language hub and word records."
        />

        {isLoading ? (
          <div className="rounded-[2rem] border border-slate-200 bg-slate-50/70 px-6 py-20 text-center font-black uppercase tracking-widest text-slate-400 animate-pulse">
            Loading taxonomy...
          </div>
        ) : (
          <div className="grid gap-4">
            {mainTopics.map((topic) => (
              <MainTopicCard
                key={topic.id}
                topic={topic}
                isExpanded={String(expandedTopic) === String(topic.id)}
                onToggle={() => setExpandedTopic(String(expandedTopic) === String(topic.id) ? null : topic.id)}
                subTopics={getChildren(topic.id)}
                getChildren={getChildren}
                langCode={langCode}
              />
            ))}
          </div>
        )}
      </AppMain>
    </AppShell>
  );
}

export default function LanguageTopicsPage() {
  return (
    <Suspense
      fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center font-bold text-slate-400 tracking-widest uppercase">Loading...</div>}
    >
      <TopicsContent />
    </Suspense>
  );
}
