"use client";

import Link from "next/link";
import type { SVGAttributes } from "react";
import CalendarHeatmap from "react-calendar-heatmap";
import { Tooltip } from "react-tooltip";
import "react-calendar-heatmap/dist/styles.css";
import "react-tooltip/dist/react-tooltip.css";
import type { DashboardVocabStat } from "@/app/lib/dashboard";
import type { HeatmapValue } from "@/app/lib/types";

type HeatmapCell = { date?: string; count?: number } | undefined;

function formatMasteryLabel(remembered: number, total: number) {
  if (total === 0) return "No words yet";
  if (remembered === total) return "Fully mastered";
  return `${remembered} mastered / ${total} total`;
}

export function DashboardLanguageOverview({
  vocabStats,
  totalWords,
  primaryLanguageCode,
}: {
  vocabStats: DashboardVocabStat[];
  totalWords: number;
  primaryLanguageCode?: string;
}) {
  const activeLanguages = vocabStats.filter((stat) => stat.total > 0);
  const overviewStats = (activeLanguages.length > 0 ? activeLanguages : vocabStats).slice(0, 5);

  return (
    <div className="flex h-full flex-col gap-5">
      <section className="surface-card p-6 sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Language Overview</p>
            <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950">Your active stack</h2>
            <p className="mt-2 text-sm font-medium leading-relaxed text-slate-600">
              Keep your languages visible, compact, and one tap away from study.
            </p>
          </div>
          <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-500">
            {activeLanguages.length || vocabStats.length} languages
          </span>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="surface-muted px-4 py-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Total Words</p>
            <p className="mt-2 text-3xl font-black text-slate-950">{totalWords}</p>
          </div>
          <div className="surface-muted px-4 py-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Active Languages</p>
            <p className="mt-2 text-3xl font-black text-slate-950">{activeLanguages.length}</p>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {overviewStats.length > 0 ? (
            overviewStats.map((stat) => (
              <Link
                key={stat.code}
                href={`/study/${stat.code}`}
                className="group flex items-center gap-4 rounded-[1.5rem] border border-slate-200 bg-white/80 px-4 py-4 transition-all hover:border-blue-200 hover:bg-blue-50/50"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
                  {stat.emoji || "🌍"}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-base font-black text-slate-950">{stat.name}</p>
                      <p className="mt-1 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                        {formatMasteryLabel(stat.remembered, stat.total)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black text-slate-950">{stat.percentage}%</p>
                      <p className="text-[10px] font-black uppercase tracking-widest text-blue-500 transition-transform group-hover:translate-x-1">
                        Open
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-sky-400" style={{ width: `${stat.percentage}%` }} />
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="surface-muted px-5 py-6">
              <p className="text-sm font-medium text-slate-600">Add your first language to start building a study routine.</p>
            </div>
          )}
        </div>
      </section>

      <section className="surface-muted p-5 sm:p-6">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Next Actions</p>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Link
            href={primaryLanguageCode ? `/study/${primaryLanguageCode}` : "/manage"}
            className="rounded-[1.5rem] border border-slate-200 bg-white px-4 py-4 font-black text-slate-900 transition-all hover:border-blue-200 hover:text-blue-600"
          >
            Study hub
            <p className="mt-1 text-xs font-bold uppercase tracking-widest text-slate-400">Open your main language</p>
          </Link>
          <Link
            href="/library"
            className="rounded-[1.5rem] border border-slate-200 bg-white px-4 py-4 font-black text-slate-900 transition-all hover:border-blue-200 hover:text-blue-600"
          >
            Library
            <p className="mt-1 text-xs font-bold uppercase tracking-widest text-slate-400">Browse and clean up words</p>
          </Link>
          <Link
            href="/import"
            className="rounded-[1.5rem] border border-slate-200 bg-white px-4 py-4 font-black text-slate-900 transition-all hover:border-blue-200 hover:text-blue-600"
          >
            Import
            <p className="mt-1 text-xs font-bold uppercase tracking-widest text-slate-400">Bring in a larger vocab list</p>
          </Link>
          <Link
            href="/manage"
            className="rounded-[1.5rem] border border-slate-200 bg-white px-4 py-4 font-black text-slate-900 transition-all hover:border-blue-200 hover:text-blue-600"
          >
            Manage
            <p className="mt-1 text-xs font-bold uppercase tracking-widest text-slate-400">Languages, categories, and setup</p>
          </Link>
        </div>
      </section>
    </div>
  );
}

export function DashboardActivitySection({
  dueTodayCount,
  streak,
  totalWords,
  heatmapValues,
}: {
  dueTodayCount: number;
  streak: number;
  totalWords: number;
  heatmapValues: HeatmapValue[];
}) {
  const today = new Date();
  const startDate = new Date();
  startDate.setDate(today.getDate() - 90);

  return (
    <section className="surface-card p-6 sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Activity</p>
          <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950">Recent learning rhythm</h2>
          <p className="mt-2 text-sm font-medium text-slate-600">Your last 90 days, plus the core numbers that explain today’s pace.</p>
        </div>
        <Link
          href="/history"
          className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 transition-colors hover:text-blue-600"
        >
          Open full history
        </Link>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="surface-muted overflow-visible px-4 py-5 sm:px-6">
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
                return {
                  "data-tooltip-id": "heatmap-tooltip",
                  "data-tooltip-content": "No activity",
                } as unknown as SVGAttributes<SVGSVGElement>;
              }

              return {
                "data-tooltip-id": "heatmap-tooltip",
                "data-tooltip-content": `${value.date}: ${count} words`,
              } as unknown as SVGAttributes<SVGSVGElement>;
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

        <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
          <div className="surface-muted px-5 py-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Due Today</p>
            <p className="mt-2 text-3xl font-black text-slate-950">{dueTodayCount}</p>
            <p className="mt-1 text-sm font-medium text-slate-600">cards still need a pass</p>
          </div>

          <div className="surface-muted px-5 py-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Streak</p>
            <p className="mt-2 text-3xl font-black text-slate-950">{streak}</p>
            <p className="mt-1 text-sm font-medium text-slate-600">days with active review</p>
          </div>

          <div className="surface-muted px-5 py-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Total Learned</p>
            <p className="mt-2 text-3xl font-black text-slate-950">{totalWords}</p>
            <p className="mt-1 text-sm font-medium text-slate-600">words in your library</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function DashboardProgressSection({ vocabStats }: { vocabStats: DashboardVocabStat[] }) {
  const activeStats = vocabStats.filter((stat) => stat.total > 0);
  const displayedStats = (activeStats.length > 0 ? activeStats : vocabStats).slice(0, 6);
  const totalWords = activeStats.reduce((sum, stat) => sum + stat.total, 0);
  const rememberedWords = activeStats.reduce((sum, stat) => sum + stat.remembered, 0);
  const overallPercentage = totalWords === 0 ? 0 : Math.round((rememberedWords / totalWords) * 100);

  return (
    <section className="surface-card p-6 sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Progress</p>
          <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950">Mastery snapshot</h2>
          <p className="mt-2 text-sm font-medium text-slate-600">A compact view of how much of your library has moved from learning into memory.</p>
        </div>
        <Link href="/library" className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 transition-colors hover:text-blue-600">
          Open library
        </Link>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="surface-muted px-5 py-5">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Overall Mastery</p>
          <div className="mt-3 flex items-end gap-3">
            <p className="text-4xl font-black tracking-tight text-slate-950">{overallPercentage}%</p>
            <p className="pb-1 text-sm font-medium text-slate-600">{rememberedWords} remembered</p>
          </div>
          <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/80">
            <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-sky-400" style={{ width: `${overallPercentage}%` }} />
          </div>
        </div>

        <div className="surface-muted px-5 py-5">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Library Mix</p>
          <div className="mt-3 flex items-end gap-3">
            <p className="text-4xl font-black tracking-tight text-slate-950">{totalWords}</p>
            <p className="pb-1 text-sm font-medium text-slate-600">total words tracked</p>
          </div>
          <p className="mt-4 text-sm font-medium text-slate-600">
            {Math.max(totalWords - rememberedWords, 0)} still in active learning.
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {displayedStats.length > 0 ? (
          displayedStats.map((stat) => (
            <Link
              key={stat.code}
              href={`/study/${stat.code}`}
              className="group block rounded-[1.5rem] border border-slate-200 bg-white/80 px-4 py-4 transition-all hover:border-blue-200 hover:bg-blue-50/40"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
                  {stat.emoji || "🌍"}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-end justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-black text-slate-950">{stat.name}</p>
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                        {stat.remembered} / {stat.total} mastered
                      </p>
                    </div>
                    <p className="text-lg font-black text-slate-950">{stat.percentage}%</p>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-sky-400" style={{ width: `${stat.percentage}%` }} />
                  </div>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="surface-muted px-5 py-6">
            <p className="text-sm font-medium text-slate-600">Progress appears here once you begin adding words and reviewing them.</p>
          </div>
        )}
      </div>
    </section>
  );
}
