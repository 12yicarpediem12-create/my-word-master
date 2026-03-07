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
import { AppMain, AppShell, PageIntro, Surface } from "./components/layout/AppShell";
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
          eyebrow="Learning Workspace"
          title="Home Base"
          description="Start with today’s review, check the health of your languages, and decide the next best step without leaving one workspace."
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

        <section className="border-t border-slate-200/70 pt-8 sm:pt-10">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="page-eyebrow">Build Library</p>
              <h2 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">Capture new words quietly, when they are worth keeping.</h2>
              <p className="mt-2 max-w-3xl text-sm font-medium leading-relaxed text-slate-600 sm:text-base">
                The study loop stays above. This area is for slower library growth, cleanup, and import work when you need it.
              </p>
            </div>
            <Surface tone="muted" className="p-4 sm:p-5">
              <div className="grid gap-3 sm:grid-cols-2">
              <Link
                href="/import"
                className="rounded-[1.5rem] border border-slate-200 bg-white px-4 py-4 font-black text-slate-900 transition-all hover:border-blue-200 hover:text-blue-600"
              >
                Bulk import
                <p className="mt-1 text-xs font-bold uppercase tracking-widest text-slate-400">Bring in a bigger list</p>
              </Link>
              <Link
                href="/manage"
                className="rounded-[1.5rem] border border-slate-200 bg-white px-4 py-4 font-black text-slate-900 transition-all hover:border-blue-200 hover:text-blue-600"
              >
                Manage setup
                <p className="mt-1 text-xs font-bold uppercase tracking-widest text-slate-400">Adjust languages and categories</p>
              </Link>
              </div>
            </Surface>
          </div>

          <div className="max-w-5xl">
            <CreateCardForm />
          </div>
        </section>
      </AppMain>
    </AppShell>
  );
}
