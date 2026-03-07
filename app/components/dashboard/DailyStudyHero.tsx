"use client";

import Link from "next/link";
import type { HabitNudge } from "@/app/lib/activity-summary";
import type { Language } from "@/app/lib/types";

type DailyStudyHeroProps = {
  primaryLanguage?: Language;
  dueTodayCount: number;
  overdueCount: number;
  streak: number;
  lastActivityLabel: string | null;
  quickSessionSize: number;
  doneForToday: boolean;
  habitNudge: HabitNudge;
};

export default function DailyStudyHero({
  primaryLanguage,
  dueTodayCount,
  overdueCount,
  streak,
  lastActivityLabel,
  quickSessionSize,
  doneForToday,
  habitNudge,
}: DailyStudyHeroProps) {
  const habitToneClass = {
    gray: "bg-white/10 border-white/15 text-white",
    blue: "bg-blue-500/20 border-blue-200/20 text-white",
    amber: "bg-amber-500/20 border-amber-200/20 text-white",
    emerald: "bg-emerald-500/20 border-emerald-200/20 text-white",
  }[habitNudge.tone];

  return (
    <section className="mb-10 sm:mb-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2.5rem] p-7 sm:p-10 text-white shadow-xl shadow-blue-200/50">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
        <div>
          <p className="text-[10px] sm:text-xs font-black uppercase tracking-[0.25em] text-blue-100 mb-3">Today&apos;s Study</p>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            {doneForToday ? "Done for today." : dueTodayCount > 0 ? `${dueTodayCount} cards are ready.` : "You are caught up for now."}
          </h2>
          <p className="mt-4 text-sm sm:text-base font-medium text-blue-100">
            {doneForToday
              ? "Your due review queue is complete. Use custom modes only if you want extra practice."
              : dueTodayCount > 0
                ? `Quick start: review about ${quickSessionSize} cards first.`
                : `Run a short ${quickSessionSize}-card refresh session to keep momentum.`}
          </p>
        </div>

        <div className="flex flex-col gap-3 min-w-[240px]">
          <Link
            href={primaryLanguage ? (doneForToday ? `/study/${primaryLanguage.code}` : `/study/${primaryLanguage.code}/session?mode=review&direction=recognition`) : "/manage"}
            className="w-full bg-white text-blue-700 hover:bg-blue-50 rounded-2xl px-6 py-4 font-black text-center transition-all shadow-lg"
          >
            {doneForToday ? "Review Complete" : "Start Today&apos;s Review"}
          </Link>
          <div className="text-[11px] font-bold text-blue-100 text-center">
            {primaryLanguage
              ? doneForToday
                ? `All due cards are cleared in ${primaryLanguage.emoji || "🌍"} ${primaryLanguage.name}`
                : `Using ${primaryLanguage.emoji || "🌍"} ${primaryLanguage.name} first`
              : "Add a language to start studying"}
          </div>
          {primaryLanguage && (
            <Link
              href={`/study/${primaryLanguage.code}/session`}
              className="text-[10px] font-black uppercase tracking-widest text-blue-100/80 text-center hover:text-white transition-colors"
            >
              Open custom study modes
            </Link>
          )}
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white/10 border border-white/20 rounded-2xl px-4 py-3">
          <p className="text-[10px] uppercase tracking-widest font-black text-blue-100">{doneForToday ? "Done Today" : "Due Now"}</p>
          <p className="text-2xl font-black mt-1">{dueTodayCount}</p>
        </div>
        <div className="bg-white/10 border border-white/20 rounded-2xl px-4 py-3">
          <p className="text-[10px] uppercase tracking-widest font-black text-blue-100">Overdue</p>
          <p className="text-2xl font-black mt-1">{overdueCount}</p>
        </div>
        <div className="bg-white/10 border border-white/20 rounded-2xl px-4 py-3">
          <p className="text-[10px] uppercase tracking-widest font-black text-blue-100">Streak / Last Active</p>
          <p className="text-2xl font-black mt-1">{streak} {lastActivityLabel ? `· ${lastActivityLabel}` : ""}</p>
        </div>
      </div>

      <div className={`mt-5 rounded-[1.75rem] border px-5 py-4 ${habitToneClass}`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-blue-100/90">{habitNudge.eyebrow}</p>
            <p className="text-lg sm:text-xl font-black mt-1">{habitNudge.title}</p>
            <p className="text-sm font-medium text-blue-50/90 mt-1">{habitNudge.description}</p>
          </div>
          <div className="flex items-center gap-2 text-[11px] font-bold text-blue-50/90">
            <span>{streak > 0 ? `${streak}-day rhythm` : "Fresh start"}</span>
            <span className="opacity-40">•</span>
            <span>{overdueCount > 0 ? `${overdueCount} to recover` : `${quickSessionSize}-card suggestion`}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
