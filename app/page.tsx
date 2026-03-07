"use client";

import { useState, useEffect } from "react";
import CreateCardForm from "./components/CreateCardForm";
import SearchBar from "./components/SearchBar";
import AppHeader from "./components/AppHeader";
import DailyStudyHero from "./components/dashboard/DailyStudyHero";
import SettingsPanel from "./components/dashboard/SettingsPanel";
import { DashboardActivitySection, DashboardLanguageGrid, DashboardProgressSection } from "./components/dashboard/DashboardSections";
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
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans overflow-x-hidden">
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

      <main className="max-w-6xl mx-auto px-6 py-12">
        {errorMsg && <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 text-red-600 font-bold rounded-2xl">{errorMsg}</div>}
        <header className="mb-12">
          <h1 className="text-5xl font-black text-gray-900 tracking-tight mb-4 text-center md:text-left">Dashboard</h1>
          <p className="text-xl text-gray-600 font-medium italic text-center md:text-left">"Every word learned is a new window to the world."</p>
        </header>

        <DailyStudyHero
          primaryLanguage={primaryLanguage}
          dueTodayCount={dueTodayCount}
          overdueCount={overdueCount}
          streak={streak}
          lastActivityLabel={lastActivityLabel}
          quickSessionSize={quickSessionSize}
          doneForToday={doneForToday}
          habitNudge={habitNudge}
        />

        <DashboardActivitySection dueTodayCount={dueTodayCount} streak={streak} totalWords={totalWords} heatmapValues={heatmapValues} />
        <DashboardProgressSection vocabStats={vocabStats} />
        <DashboardLanguageGrid languages={languages} />

        <div className="mb-12">
          <CreateCardForm />
        </div>
      </main>
    </div>
  );
}
