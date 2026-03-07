"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import type { SVGAttributes } from "react";
import CalendarHeatmap from "react-calendar-heatmap";
import { Tooltip } from "react-tooltip";
import "react-calendar-heatmap/dist/styles.css";
import "react-tooltip/dist/react-tooltip.css";
import CreateCardForm from "./components/CreateCardForm";
import SearchBar from "./components/SearchBar";
import type { HeatmapValue, Language, VocabItem } from "@/app/lib/types";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

type VocabStat = Language & {
  total: number;
  remembered: number;
  percentage: number;
};

type HeatmapCell = { date?: string; count?: number } | undefined;

export default function Dashboard() {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [totalWords, setTotalWords] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [vocabStats, setVocabStats] = useState<VocabStat[]>([]);
  const [heatmapValues, setHeatmapValues] = useState<HeatmapValue[]>([]);
  const [streak, setStreak] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setIsMounted(true);
    async function loadDashboard() {
      setErrorMsg(null);
      const [{ data: langs, error: langsError }, { data: reviews, error: reviewsError }, { data: allVocab, error: vocabError }] = await Promise.all([
        supabase.from("languages").select("*"),
        supabase.from("vocab").select("id").lte("next_review_date", new Date().toISOString()),
        supabase.from("vocab").select("id, language_code, is_remembered, created_at, last_reviewed"),
      ]);

      if (langsError || reviewsError || vocabError) {
        setErrorMsg(langsError?.message || reviewsError?.message || vocabError?.message || "Failed to load dashboard data.");
        setLanguages([]);
        setVocabStats([]);
        setHeatmapValues([]);
        setTotalWords(0);
        setTotalReviews(0);
        setStreak(0);
        return;
      }

      const loadedLangs = (langs || []) as Language[];
      const loadedVocab = (allVocab || []) as VocabItem[];
      setTotalReviews(reviews?.length || 0);
      setTotalWords(loadedVocab.length);

      const counts: Record<string, number> = {};
      loadedVocab.forEach((word) => {
        const dateStr = word.last_reviewed || word.created_at;
        if (dateStr) {
          const date = dateStr.split("T")[0];
          counts[date] = (counts[date] || 0) + 1;
        }
      });

      const calculatedHeatmap: HeatmapValue[] = Object.keys(counts).map((date) => ({
        date,
        count: counts[date],
      }));
      setHeatmapValues(calculatedHeatmap);

      let currentStreak = 0;
      const now = new Date();
      const todayStr = now.toISOString().split("T")[0];

      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];

      let checkDate = new Date(now);

      if (counts[todayStr]) {
        while (true) {
          const dStr = checkDate.toISOString().split("T")[0];
          if (counts[dStr] && counts[dStr] > 0) {
            currentStreak++;
            checkDate.setDate(checkDate.getDate() - 1);
          } else break;
        }
      } else if (counts[yesterdayStr]) {
        checkDate = yesterday;
        while (true) {
          const dStr = checkDate.toISOString().split("T")[0];
          if (counts[dStr] && counts[dStr] > 0) {
            currentStreak++;
            checkDate.setDate(checkDate.getDate() - 1);
          } else break;
        }
      } else {
        currentStreak = 0;
      }
      setStreak(currentStreak);

      const sortedLangs = [...loadedLangs].sort((a, b) => {
        const aVocab = loadedVocab.filter((v) => v.language_code === a.code);
        const bVocab = loadedVocab.filter((v) => v.language_code === b.code);

        const aLatest = aVocab.reduce((max, v) => {
          const dateStr = v.last_reviewed || v.created_at;
          const time = dateStr ? new Date(dateStr).getTime() : 0;
          return time > max ? time : max;
        }, a.created_at ? new Date(a.created_at).getTime() : 0);

        const bLatest = bVocab.reduce((max, v) => {
          const dateStr = v.last_reviewed || v.created_at;
          const time = dateStr ? new Date(dateStr).getTime() : 0;
          return time > max ? time : max;
        }, b.created_at ? new Date(b.created_at).getTime() : 0);

        return bLatest - aLatest;
      });

      setLanguages(sortedLangs);

      const stats: VocabStat[] = sortedLangs.map((lang) => {
        const langVocab = loadedVocab.filter((v) => v.language_code === lang.code);
        const total = langVocab.length;
        const remembered = langVocab.filter((v) => v.is_remembered === true).length;
        const percentage = total === 0 ? 0 : Math.round((remembered / total) * 100);
        return { ...lang, total, remembered, percentage };
      });
      setVocabStats(stats);
    }
    loadDashboard();
  }, []);

  const today = new Date();
  const startDate = new Date();
  startDate.setDate(today.getDate() - 90);

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
      {isSettingsOpen && <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[60] transition-opacity" onClick={() => setIsSettingsOpen(false)} />}
      <div
        className={`fixed z-[70] bg-white shadow-2xl transition-transform duration-300 ease-in-out top-0 right-0 h-full w-72 md:left-0 md:w-full md:h-auto md:border-b-2 md:border-gray-200 ${
          isSettingsOpen ? "translate-x-0 md:translate-y-0" : "translate-x-full md:translate-x-0 md:-translate-y-full"
        }`}
      >
        <div className="p-8 md:p-6 h-full flex flex-col md:flex-row gap-8 md:gap-12 md:items-center">
          <div className="flex justify-between items-center md:w-auto">
            <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2">
              <span>⚙️</span> Settings
            </h2>
            <button onClick={() => setIsSettingsOpen(false)} className="text-gray-400 hover:text-red-500 md:hidden">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          <div className="flex-1 flex flex-col md:flex-row gap-4">
            <Link href="/library" className="px-5 py-4 bg-gray-50 hover:bg-blue-50 border-2 border-gray-100 rounded-2xl font-bold transition-all text-center">
              📚 View Library
            </Link>
            <Link href="/manage" className="px-5 py-4 bg-gray-50 hover:bg-green-50 border-2 border-gray-100 rounded-2xl font-bold transition-all text-center">
              🌍 Add Language
            </Link>
            <Link href="/root" className="px-5 py-4 bg-gray-50 hover:bg-rose-50 border-2 border-gray-100 rounded-2xl font-bold transition-all text-center">
              🌱 Origins Library
            </Link>
            <button
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="px-5 py-4 bg-gray-50 hover:bg-red-50 border-2 border-gray-100 rounded-2xl font-bold transition-all text-center disabled:opacity-50"
            >
              {isSigningOut ? "Signing out..." : "↩ Sign Out"}
            </button>
          </div>
        </div>
      </div>

      <nav className="bg-white border-b-2 border-gray-200 px-6 py-4 flex flex-col md:flex-row justify-between items-center sticky top-0 z-50 shadow-sm gap-4">
        <div className="text-3xl font-black tracking-tighter text-blue-600 w-full md:w-auto flex justify-between items-center">
          WordMaster.
          <button onClick={() => setIsSettingsOpen(true)} className="md:hidden text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
          </button>
        </div>
        <div className="w-full md:flex-1 md:max-w-2xl md:mx-8">
          <SearchBar />
        </div>
        <button onClick={() => setIsSettingsOpen(true)} className="hidden md:block text-gray-400 hover:text-blue-600 transition-all">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
          </svg>
        </button>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-12">
        {errorMsg && <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 text-red-600 font-bold rounded-2xl">{errorMsg}</div>}
        <header className="mb-12">
          <h1 className="text-5xl font-black text-gray-900 tracking-tight mb-4 text-center md:text-left">Dashboard</h1>
          <p className="text-xl text-gray-600 font-medium italic text-center md:text-left">"Every word learned is a new window to the world."</p>
        </header>

        <div className="mb-12 bg-white rounded-3xl p-8 border-2 border-gray-200 shadow-sm flex flex-col md:flex-row gap-10">
          <div className="w-full md:w-2/3">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <span className="text-green-500">📈</span> Learning Activity
            </h2>
            <div className="overflow-visible">
              <CalendarHeatmap
                startDate={startDate}
                endDate={today}
                values={heatmapValues}
                gutterSize={2}
                classForValue={(value: HeatmapCell) => {
                  const count = value?.count ?? 0;
                  if (count === 0) return "color-empty";
                  const level = Math.min(count, 4);
                  return `color-scale-${level}`;
                }}
                tooltipDataAttrs={(value: HeatmapCell) => {
                  const count = value?.count ?? 0;
                  if (!value?.date) {
                    return { "data-tooltip-id": "heatmap-tooltip", "data-tooltip-content": "No activity" } as unknown as SVGAttributes<SVGSVGElement>;
                  }
                  return { "data-tooltip-id": "heatmap-tooltip", "data-tooltip-content": `${value.date}: ${count} words` } as unknown as SVGAttributes<SVGSVGElement>;
                }}
                showWeekdayLabels={true}
              />
              <Tooltip id="heatmap-tooltip" />
              <div className="heatmap-legend mt-4 flex items-center text-xs font-bold text-gray-400">
                <span className="mr-2">Less</span>
                <div className="legend-box bg-gray-100 w-3 h-3 mx-1 rounded-sm"></div>
                <div className="legend-box bg-green-100 w-3 h-3 mx-1 rounded-sm"></div>
                <div className="legend-box bg-green-300 w-3 h-3 mx-1 rounded-sm"></div>
                <div className="legend-box bg-green-500 w-3 h-3 mx-1 rounded-sm"></div>
                <div className="legend-box bg-green-700 w-3 h-3 mx-1 rounded-sm"></div>
                <span className="ml-2">More</span>
              </div>
            </div>
          </div>

          <div className="w-full md:w-1/3 flex flex-col gap-4 justify-center">
            <Link href="/history" className="block group">
              <div className="bg-blue-600 rounded-3xl p-8 text-white shadow-xl shadow-blue-100 transition-all group-hover:scale-[1.02] group-hover:bg-blue-700 active:scale-95">
                <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-2 leading-none">Review Today</p>
                <p className="text-5xl font-black leading-none">{totalReviews}</p>
                <p className="text-sm mt-4 font-medium italic opacity-90">Ready for your daily challenge?</p>
                <p className="text-[10px] mt-3 font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">Click to see history →</p>
              </div>
            </Link>

            <div className="bg-orange-50 rounded-3xl p-6 border-2 border-orange-100 flex justify-between items-center group transition-colors hover:bg-orange-100">
              <span className="text-orange-600 font-bold uppercase text-xs tracking-widest flex items-center gap-2">
                <span className="text-xl">🔥</span> Day Streak
              </span>
              <span className="text-3xl font-black text-orange-600 group-hover:scale-110 transition-transform">{streak}</span>
            </div>

            <div className="bg-white rounded-3xl p-6 border-2 border-gray-100 flex justify-between items-center group transition-colors hover:bg-gray-50">
              <span className="text-gray-400 font-bold uppercase text-xs tracking-widest group-hover:text-blue-500">Total Learned</span>
              <span className="text-3xl font-black group-hover:scale-110 transition-transform">{totalWords}</span>
            </div>
          </div>
        </div>

        <div className="mb-12">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <span className="text-blue-500">🧠</span> Progress
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {vocabStats.map((stat) => {
              const radius = 36;
              const circumference = 2 * Math.PI * radius;
              const strokeDashoffset = circumference - (stat.percentage / 100) * circumference;
              return (
                <div key={stat.code} className="bg-white rounded-3xl p-6 border-2 border-gray-200 shadow-sm flex flex-col items-center justify-center transition-all hover:shadow-md hover:border-blue-300">
                  <div className="text-3xl mb-2">{stat.emoji}</div>
                  <h3 className="font-bold text-gray-700 mb-4">{stat.name}</h3>
                  <div className="relative w-24 h-24 flex items-center justify-center">
                    <svg className="transform -rotate-90 w-24 h-24">
                      <circle cx="48" cy="48" r={radius} stroke="#f3f4f6" strokeWidth="8" fill="none" />
                      <circle
                        cx="48"
                        cy="48"
                        r={radius}
                        stroke="#2563eb"
                        strokeWidth="8"
                        fill="none"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        className="transition-all duration-1000 ease-out"
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="absolute text-xl font-black">{stat.percentage}%</span>
                  </div>
                  <p className="text-xs font-bold text-gray-400 mt-4 uppercase tracking-widest">
                    {stat.remembered} / {stat.total} Words
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {languages.map((lang) => (
            <Link key={lang.code} href={`/study/${lang.code}`} className="group">
              <div className="bg-white rounded-3xl p-8 border-2 border-gray-200 shadow-sm hover:border-blue-500 hover:shadow-xl transition-all h-64 flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 text-9xl transform translate-x-10 translate-y-[-20px]">{lang.emoji || "🏳️"}</div>
                <div className="text-6xl z-10">{lang.emoji || "🏳️"}</div>
                <div className="z-10">
                  <h3 className="text-3xl font-black tracking-tight">{lang.name}</h3>
                  <p className="text-blue-600 font-bold flex items-center gap-2 mt-2 group-hover:gap-4 transition-all uppercase text-xs tracking-widest">Start Session →</p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="mb-12">
          <CreateCardForm />
        </div>
      </main>
    </div>
  );
}
