"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import SearchBar from "../components/SearchBar";
import AppHeader from "../components/AppHeader";
import { AppMain, AppShell, PageIntro, Surface } from "../components/layout/AppShell";
import { summarizeActivity } from "../lib/activity-summary";
import { getSupabaseBrowserClient } from "../lib/supabase-browser";
import type { Language, VocabItem } from "@/app/lib/types";

type ViewRange = "7days" | "30days" | "month";

type HistoryCardProps = {
  vocab: VocabItem;
  langInfo?: Language;
};

const supabase = getSupabaseBrowserClient();

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-2xl px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] transition-all ${
        active ? "bg-slate-950 text-white shadow-sm" : "text-slate-500 hover:bg-slate-100 hover:text-slate-950"
      }`}
    >
      {children}
    </button>
  );
}

function DateDivider({ date }: { date: string }) {
  return (
    <div className="flex items-center gap-4">
      <h3 className="whitespace-nowrap text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{date}</h3>
      <div className="h-px w-full bg-slate-200" />
    </div>
  );
}

function StatCard({ label, value, helper }: { label: string; value: string | number; helper?: string }) {
  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white/85 px-5 py-4 shadow-[0_16px_30px_-28px_rgba(15,23,42,0.18)]">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-black tracking-tight text-slate-950">{value}</p>
      {helper && <p className="mt-2 text-xs font-bold uppercase tracking-widest text-slate-400">{helper}</p>}
    </div>
  );
}

function HistoryCard({ vocab, langInfo }: HistoryCardProps) {
  return (
    <Link
      href={`/word/${vocab.id}`}
      className="group flex items-center justify-between rounded-[1.75rem] border border-slate-200/80 bg-white/85 px-5 py-5 transition-all hover:border-blue-200 hover:bg-white hover:shadow-[0_20px_40px_-32px_rgba(15,23,42,0.22)]"
    >
      <div className="flex items-center gap-4">
        <span className="text-2xl">{langInfo?.emoji || "🌍"}</span>
        <div className="min-w-0">
          <p className="font-black text-slate-950 transition-colors group-hover:text-blue-600">{vocab.word}</p>
          <p className="mt-1 text-sm font-medium text-slate-500">{vocab.translation}</p>
        </div>
      </div>
      <span className="text-2xl">{vocab.is_remembered ? "✅" : "🔥"}</span>
    </Link>
  );
}

export default function HistoryPage() {
  const [results, setResults] = useState<VocabItem[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [range, setRange] = useState<ViewRange>("7days");
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLanguages() {
      const { data, error } = await supabase.from("languages").select("*");
      if (error) {
        setErrorMsg(error.message);
        return;
      }
      setLanguages((data || []) as Language[]);
    }
    fetchLanguages();
  }, []);

  useEffect(() => {
    async function fetchHistory() {
      setIsLoading(true);
      setErrorMsg(null);
      let query = supabase
        .from("vocab")
        .select("id, language_code, word, translation, is_remembered, last_reviewed")
        .not("last_reviewed", "is", null);

      if (range === "month") {
        const startOfMonth = `${selectedMonth}-01T00:00:00Z`;
        const date = new Date(selectedMonth);
        const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59).toISOString();
        query = query.gte("last_reviewed", startOfMonth).lte("last_reviewed", endOfMonth);
      } else {
        const days = range === "7days" ? 7 : 30;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        query = query.gte("last_reviewed", startDate.toISOString());
      }

      const { data: vocabData, error } = await query.order("last_reviewed", { ascending: false });
      if (error) {
        setErrorMsg(error.message);
        setResults([]);
      } else {
        setResults((vocabData || []) as VocabItem[]);
      }
      setIsLoading(false);
    }
    fetchHistory();
  }, [range, selectedMonth]);

  const groupedByDate = useMemo(() => {
    return results.reduce((acc: Record<string, VocabItem[]>, vocab) => {
      const date = new Date(vocab.last_reviewed || "").toLocaleDateString("ja-JP", {
        month: "short",
        day: "numeric",
        weekday: "short",
      });
      if (!acc[date]) acc[date] = [];
      acc[date].push(vocab);
      return acc;
    }, {});
  }, [results]);

  const stats = useMemo(() => {
    const total = results.length;
    const mastered = results.filter((v) => v.is_remembered).length;
    return { total, mastered, rate: total === 0 ? 0 : Math.round((mastered / total) * 100) };
  }, [results]);
  const activitySummary = useMemo(() => summarizeActivity(results), [results]);

  return (
    <AppShell className="pb-24">
      <AppHeader primarySection="study" searchSlot={<SearchBar />} backHref="/study" backLabel="Study Home" />

      <AppMain width="lg" className="section-stack">
        {errorMsg && <div className="rounded-2xl border-2 border-red-200 bg-red-50 p-4 font-bold text-red-600">{errorMsg}</div>}

        <PageIntro
          eyebrow="History"
          title="Review your learning rhythm"
          description="Use history to reflect on activity patterns and reopen words you studied recently. This is a supporting page, not the main study workspace."
        />

        <Surface tone="muted" className="p-4 sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex rounded-[1.25rem] border border-slate-200 bg-white p-1">
                <TabButton active={range === "7days"} onClick={() => setRange("7days")}>7 Days</TabButton>
                <TabButton active={range === "30days"} onClick={() => setRange("30days")}>30 Days</TabButton>
                <TabButton active={range === "month"} onClick={() => setRange("month")}>Archive</TabButton>
              </div>

              {range === "month" && (
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="rounded-[1.25rem] border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-blue-600 outline-none transition-colors focus:border-blue-300"
                />
              )}
            </div>

            <span className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700">
              {stats.rate}% mastery
            </span>
          </div>
        </Surface>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Reviewed" value={stats.total} helper="selected range" />
          <StatCard label="Mastered" value={stats.mastered} helper="remembered" />
          <StatCard label="Active Days" value={activitySummary.activeDays} helper="with activity" />
          <StatCard label="Current Rhythm" value={`${activitySummary.streak} day${activitySummary.streak === 1 ? "" : "s"}`} helper={activitySummary.lastActivityLabel || "no recent review"} />
        </div>

        {isLoading ? (
          <div className="rounded-[2rem] border border-slate-200 bg-slate-50/70 px-6 py-20 text-center font-bold uppercase tracking-widest text-slate-400 animate-pulse">
            Fetching records...
          </div>
        ) : Object.keys(groupedByDate).length > 0 ? (
          <div className="space-y-10">
            {Object.keys(groupedByDate).map((date) => (
              <section key={date} className="space-y-5">
                <DateDivider date={date} />
                <div className="grid gap-4 sm:grid-cols-2">
                  {groupedByDate[date].map((vocab) => (
                    <HistoryCard key={vocab.id} vocab={vocab} langInfo={languages.find((l) => l.code === vocab.language_code)} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <Surface tone="muted" className="rounded-[2.5rem] p-12 text-center sm:p-16">
            <div className="text-6xl opacity-40">🏜️</div>
            <h2 className="mt-6 text-2xl font-black tracking-tight text-slate-950">No activity found</h2>
            <p className="mt-2 text-sm font-medium text-slate-500 sm:text-base">Try selecting a different period.</p>
          </Surface>
        )}
      </AppMain>
    </AppShell>
  );
}
