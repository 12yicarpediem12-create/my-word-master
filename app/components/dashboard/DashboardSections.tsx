"use client";

import Link from "next/link";
import type { SVGAttributes } from "react";
import CalendarHeatmap from "react-calendar-heatmap";
import { Tooltip } from "react-tooltip";
import "react-calendar-heatmap/dist/styles.css";
import "react-tooltip/dist/react-tooltip.css";
import type { DashboardVocabStat } from "@/app/lib/dashboard";
import type { HeatmapValue, Language } from "@/app/lib/types";

type HeatmapCell = { date?: string; count?: number } | undefined;

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
      </div>

      <div className="w-full md:w-1/3 flex flex-col gap-4 justify-center">
        <Link href="/history" className="block group">
          <div className="bg-blue-600 rounded-3xl p-8 text-white shadow-xl shadow-blue-100 transition-all group-hover:scale-[1.02] group-hover:bg-blue-700 active:scale-95">
            <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-2 leading-none">Review Today</p>
            <p className="text-5xl font-black leading-none">{dueTodayCount}</p>
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
  );
}

export function DashboardProgressSection({ vocabStats }: { vocabStats: DashboardVocabStat[] }) {
  return (
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
  );
}

export function DashboardLanguageGrid({ languages }: { languages: Language[] }) {
  return (
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
  );
}
