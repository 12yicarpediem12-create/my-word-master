"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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

function formatDueLabel(dueToday: number) {
  if (dueToday <= 0) return "Nothing due";
  if (dueToday === 1) return "1 due";
  return `${dueToday} due`;
}

export function DashboardLanguageOverview({
  vocabStats,
  totalWords,
}: {
  vocabStats: DashboardVocabStat[];
  totalWords: number;
}) {
  const activeLanguages = vocabStats.filter((stat) => stat.total > 0);
  const spotlightStats = (activeLanguages.length > 0 ? activeLanguages : vocabStats).slice(0, 4);
  const dueNowCount = activeLanguages.reduce((sum, stat) => sum + stat.dueToday, 0);
  const learningCount = activeLanguages.reduce((sum, stat) => sum + stat.learning, 0);

  return (
    <section className="flex h-full flex-col justify-between border-t border-slate-200/80 pt-5 sm:pt-6 xl:border-l xl:border-t-0 xl:pl-6 xl:pt-0">
      <div className="min-w-0">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Languages</p>
            <h2 className="mt-3 text-[1.9rem] font-semibold tracking-tight text-slate-950">Current languages</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Keep language status close at hand, then open Study when you want the full chooser.
            </p>
          </div>
          <span className="rounded-full border border-slate-200 bg-white/85 px-3 py-1 text-[11px] font-medium text-slate-500">
            {activeLanguages.length || vocabStats.length} languages
          </span>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-4 border-y border-slate-200/75 py-4 sm:grid-cols-4">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Words</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950 sm:text-3xl">{totalWords}</p>
          </div>
          <div className="min-w-0 sm:border-l sm:border-slate-200/65 sm:pl-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Active languages</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950 sm:text-3xl">{activeLanguages.length}</p>
          </div>
          <div className="min-w-0 sm:border-l sm:border-slate-200/65 sm:pl-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Due now</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950 sm:text-3xl">{dueNowCount}</p>
          </div>
          <div className="min-w-0 sm:border-l sm:border-slate-200/65 sm:pl-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Learning</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950 sm:text-3xl">{learningCount}</p>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {spotlightStats.length > 0 ? (
            <>
              <div className="flex items-center justify-between gap-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Quick access</p>
                <Link
                  href="/study"
                  className="text-xs font-medium text-slate-500 transition-colors hover:text-blue-600"
                >
                  Open Study
                </Link>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {spotlightStats.map((stat) => (
                  <article
                    key={stat.code}
                    className="rounded-[1.5rem] border border-slate-200/80 bg-white/72 p-4 transition-all hover:border-blue-200 hover:bg-white/88"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
                          {stat.emoji || "🌍"}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-base font-semibold text-slate-950">{stat.name}</p>
                          <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.12em] text-slate-400">
                            {stat.code}
                          </p>
                        </div>
                      </div>
                      <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-widest ${stat.dueToday > 0 ? "border border-amber-200 bg-amber-50 text-amber-700" : "border border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
                        {stat.dueToday}
                      </span>
                    </div>

                    <p className="mt-3 text-sm font-medium text-slate-600">
                      {stat.remembered} mastered · {stat.learning} learning
                    </p>

                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-sky-400" style={{ width: `${stat.percentage}%` }} />
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-200/70 pt-3">
                      <p className="text-sm font-semibold text-slate-950">{stat.percentage}% mastered</p>
                      <Link
                        href={`/study/${stat.code}`}
                        className="text-xs font-medium text-slate-600 transition-colors hover:text-blue-600"
                      >
                        Open
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </>
          ) : (
            <div className="border-t border-slate-200/75 pt-4">
              <p className="text-sm font-medium text-slate-600">Add your first language to start building a study routine.</p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 border-t border-slate-200/75 pt-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Shortcuts</p>
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-3">
          <Link
            href="/study"
            className="font-semibold text-slate-900 transition-colors hover:text-blue-600"
          >
            Study
            <p className="mt-1 text-xs text-slate-400">Choose a language intentionally.</p>
          </Link>
          <Link
            href="/library"
            className="font-semibold text-slate-900 transition-colors hover:text-blue-600"
          >
            Library
            <p className="mt-1 text-xs text-slate-400">Browse and tidy your words.</p>
          </Link>
          <Link
            href="/import"
            className="font-semibold text-slate-900 transition-colors hover:text-blue-600"
          >
            Import
            <p className="mt-1 text-xs text-slate-400">Bring in a larger word list.</p>
          </Link>
          <Link
            href="/manage"
            className="font-semibold text-slate-900 transition-colors hover:text-blue-600"
          >
            Settings
            <p className="mt-1 text-xs text-slate-400">Languages, categories, and setup.</p>
          </Link>
        </div>
      </div>
    </section>
  );
}

export function DashboardLanguageListSection({ vocabStats }: { vocabStats: DashboardVocabStat[] }) {
  const visibleStats = vocabStats.filter((stat) => stat.total > 0);
  const displayedStats = visibleStats.length > 0 ? visibleStats : vocabStats;
  const totalDue = displayedStats.reduce((sum, stat) => sum + stat.dueToday, 0);
  const totalLearning = displayedStats.reduce((sum, stat) => sum + stat.learning, 0);

  return (
    <section className="section-open">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Language Overview</p>
          <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950">Your languages, at a glance</h2>
          <p className="mt-2 text-sm font-medium leading-relaxed text-slate-600">
            Keep every active language visible with its current workload, mastery progress, and direct next actions.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-3 border-y border-slate-200/75 py-4 sm:grid-cols-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Languages</p>
            <p className="mt-2 text-2xl font-black text-slate-950">{displayedStats.length}</p>
          </div>
          <div className="sm:border-l sm:border-slate-200/65 sm:pl-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Due Now</p>
            <p className="mt-2 text-2xl font-black text-slate-950">{totalDue}</p>
          </div>
          <div className="col-span-2 sm:col-span-1 sm:border-l sm:border-slate-200/65 sm:pl-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Still Learning</p>
            <p className="mt-2 text-2xl font-black text-slate-950">{totalLearning}</p>
          </div>
        </div>
      </div>

      <div className="mt-6">
        {displayedStats.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {displayedStats.map((stat) => (
              <article
                key={stat.code}
                className="rounded-[1.75rem] border border-slate-200 bg-white/78 p-5 transition-all hover:border-blue-200 hover:bg-white/92"
              >
                <div className="flex h-full flex-col gap-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="flex h-13 w-13 items-center justify-center rounded-[1.35rem] bg-slate-100 text-2xl">
                        {stat.emoji || "🌍"}
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-lg font-black text-slate-950">{stat.name}</p>
                          <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-slate-500">
                            {stat.code}
                          </span>
                        </div>
                        <p className="mt-2 text-sm font-medium text-slate-600">
                          {stat.remembered} mastered out of {stat.total} saved words.
                        </p>
                      </div>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ${stat.dueToday > 0 ? "border border-amber-200 bg-amber-50 text-amber-700" : "border border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
                      {formatDueLabel(stat.dueToday)}
                    </span>
                  </div>

                  <div className="border-t border-slate-200/70 pt-4">
                    <div className="flex items-end justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Mastery</p>
                        <div className="mt-2 flex items-end gap-2">
                          <p className="text-3xl font-black tracking-tight text-slate-950">{stat.percentage}%</p>
                          <p className="pb-1 text-sm font-medium text-slate-600">{stat.learning} learning</p>
                        </div>
                      </div>
                      <p className="text-sm font-black text-slate-950">{stat.dueToday} due</p>
                    </div>
                    <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-sky-400" style={{ width: `${stat.percentage}%` }} />
                    </div>
                    <p className="mt-3 text-sm font-medium text-slate-600">
                      {stat.remembered} remembered · {stat.learning} in review
                    </p>
                  </div>

                  <div className="mt-auto flex flex-wrap gap-2">
                    <Link
                      href={`/study/${stat.code}`}
                      className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-slate-700 transition-colors hover:border-blue-200 hover:text-blue-600"
                    >
                      Study Hub
                    </Link>
                    <Link
                      href={`/study/${stat.code}/topics`}
                      className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-slate-700 transition-colors hover:border-blue-200 hover:text-blue-600"
                    >
                      Topics
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="surface-muted px-5 py-6">
            <p className="text-sm font-medium text-slate-600">Add your first language to restore the dashboard overview and start building a study routine.</p>
          </div>
        )}
      </div>
    </section>
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
  const router = useRouter();
  const today = new Date();
  const startDate = new Date();
  startDate.setDate(today.getDate() - 90);

  return (
    <section className="px-1">
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
        <div className="surface-muted px-2.5 py-3 sm:px-5 sm:py-4">
          <div className="dashboard-heatmap-shell">
            <div className="dashboard-heatmap-scroll">
              <div className="dashboard-heatmap-canvas">
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
                  onClick={(value: HeatmapCell) => {
                    if (!value?.date) return;
                    router.push(`/history?date=${encodeURIComponent(value.date)}`);
                  }}
                  showWeekdayLabels={true}
                />
              </div>
            </div>
          </div>
          <Tooltip id="heatmap-tooltip" />
          <div className="heatmap-legend mt-3 flex flex-wrap items-center justify-center gap-1 text-xs font-bold text-gray-400 sm:justify-start">
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

          <div className="rounded-[1.5rem] border border-amber-200 bg-gradient-to-br from-amber-50 via-orange-50 to-white px-5 py-5 shadow-[0_22px_50px_-38px_rgba(249,115,22,0.55)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-amber-700">Day Streak</p>
                <p className="mt-2 text-3xl font-black text-slate-950">{streak}</p>
                <p className="mt-1 text-sm font-medium text-slate-600">days with active review</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/80 text-2xl shadow-[0_14px_30px_-24px_rgba(249,115,22,0.9)]">
                🔥
              </div>
            </div>
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
    <section className="px-1">
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
