"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import CreateCardForm from "./components/CreateCardForm";
import SearchBar from "./components/SearchBar";
import AppHeader from "./components/AppHeader";
import DailyStudyHero from "./components/dashboard/DailyStudyHero";
import SettingsPanel from "./components/dashboard/SettingsPanel";
import {
  DashboardActivitySection,
  DashboardLanguageOverview,
  DashboardProgressSection,
} from "./components/dashboard/DashboardSections";
import { AppMain, AppShell, PageIntro } from "./components/layout/AppShell";
import { useDashboardData } from "./hooks/useDashboardData";
import { getHabitNudge } from "./lib/activity-summary";
import { getSupabaseBrowserClient } from "./lib/supabase-browser";

const supabase = getSupabaseBrowserClient();

export default function Dashboard() {
  const { languages, totalWords, dueTodayCount, overdueCount, vocabStats, heatmapValues, streak, lastActivityLabel, activityMeta, errorMsg } = useDashboardData();
  const [isMounted, setIsMounted] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const primaryLanguage = languages[0];
  const quickSessionSize = dueTodayCount > 0 ? Math.min(dueTodayCount, 15) : 10;
  const doneForToday = activityMeta.activeToday && dueTodayCount === 0;
  const habitNudge = getHabitNudge(
    {
      streak,
      dueTodayCount,
      overdueCount,
      lastActivityLabel,
      activeToday: activityMeta.activeToday,
      activeYesterday: activityMeta.activeYesterday,
      activeDays: activityMeta.activeDays,
      doneToday: doneForToday,
    },
    totalWords
  );

  useEffect(() => {
    if (isSettingsOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";
  }, [isSettingsOpen]);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await supabase.auth.signOut();
    setIsSigningOut(false);
    window.location.href = "/login";
  };

  if (!isMounted) return null;

  return (
    <AppShell className="overflow-x-hidden">
      <SettingsPanel isOpen={isSettingsOpen} isSigningOut={isSigningOut} onClose={() => setIsSettingsOpen(false)} onSignOut={handleSignOut} />

      <AppHeader
        primarySection="dashboard"
        searchSlot={<SearchBar />}
        utility={
          <button onClick={() => setIsSettingsOpen(true)} className="text-gray-400 hover:text-blue-600 transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
          </button>
        }
      />

      <AppMain width="xl" className="section-stack">
        {errorMsg && <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 text-red-600 font-bold rounded-2xl">{errorMsg}</div>}
        <PageIntro
          eyebrow="Dashboard"
          title="Today"
          description="Start your review, check the health of your languages, and choose the next useful step."
          framed={false}
        />

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(20rem,0.85fr)] xl:items-stretch">
          <DailyStudyHero
            primaryLanguage={primaryLanguage}
            dueTodayCount={dueTodayCount}
            overdueCount={overdueCount}
            streak={streak}
            lastActivityLabel={lastActivityLabel}
            quickSessionSize={quickSessionSize}
            doneForToday={doneForToday}
            habitNudge={habitNudge}
            className="h-full"
          />

          <DashboardLanguageOverview
            vocabStats={vocabStats}
            totalWords={totalWords}
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(19rem,0.85fr)] xl:items-start">
          <DashboardActivitySection dueTodayCount={dueTodayCount} streak={streak} totalWords={totalWords} heatmapValues={heatmapValues} />
          <DashboardProgressSection vocabStats={vocabStats} />
        </section>

        <section className="section-open">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="page-eyebrow">Build Library</p>
              <h2 className="font-display text-[2rem] font-semibold tracking-tight text-slate-950 sm:text-[2.35rem]">Grow the library, quietly.</h2>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600 sm:text-base">
                The study loop stays above. This area is for slower library growth, cleanup, and import work when you need it.
              </p>
            </div>
            <div className="grid gap-3 border-t border-slate-200/75 pt-4 sm:grid-cols-2 sm:border-none sm:pt-0">
              <Link
                href="/import"
                className="rounded-[1.5rem] border border-slate-200/80 bg-white/72 px-4 py-4 font-black text-slate-900 transition-all hover:border-blue-200 hover:bg-white hover:text-blue-600"
              >
                Bulk import
                <p className="mt-1 text-xs text-slate-400">Bring in a larger list.</p>
              </Link>
              <Link
                href="/manage"
                className="rounded-[1.5rem] border border-slate-200/80 bg-white/72 px-4 py-4 font-black text-slate-900 transition-all hover:border-blue-200 hover:bg-white hover:text-blue-600"
              >
                Library settings
                <p className="mt-1 text-xs text-slate-400">Languages, categories, and setup.</p>
              </Link>
            </div>
          </div>

          <div className="max-w-5xl">
            <CreateCardForm />
          </div>
        </section>
      </AppMain>
    </AppShell>
  );
}
