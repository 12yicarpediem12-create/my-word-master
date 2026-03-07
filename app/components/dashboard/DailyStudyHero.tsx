"use client";

import Link from "next/link";
import type { HabitNudge } from "@/app/lib/activity-summary";
import type { Language } from "@/app/lib/types";

function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

type DailyStudyHeroProps = {
  primaryLanguage?: Language;
  dueTodayCount: number;
  overdueCount: number;
  streak: number;
  lastActivityLabel: string | null;
  quickSessionSize: number;
  doneForToday: boolean;
  habitNudge: HabitNudge;
  className?: string;
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
  className,
}: DailyStudyHeroProps) {
  const habitToneClass = {
    gray: "bg-slate-950/5 border-slate-200/80 text-slate-800",
    blue: "bg-blue-100/70 border-blue-200 text-slate-800",
    amber: "bg-amber-100/75 border-amber-200 text-slate-800",
    emerald: "bg-emerald-100/75 border-emerald-200 text-slate-800",
  }[habitNudge.tone];

  return (
    <section
      className={cn(
        "surface-hero relative overflow-hidden p-7 sm:p-10",
        "bg-[linear-gradient(145deg,rgba(255,255,255,0.99),rgba(235,245,255,0.96))]",
        className
      )}
    >
      <div className="pointer-events-none absolute right-0 top-0 h-48 w-48 rounded-full bg-blue-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -left-10 bottom-0 h-40 w-40 rounded-full bg-sky-100/70 blur-3xl" />

      <div className="relative flex flex-col gap-8 xl:grid xl:grid-cols-[minmax(0,1.35fr)_minmax(19rem,0.8fr)] xl:items-start">
        <div>
          <p className="mb-3 text-[10px] font-black uppercase tracking-[0.25em] text-blue-600 sm:text-xs">Today&apos;s Study</p>
          <h2 className="text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl">
            {doneForToday ? "Done for today." : dueTodayCount > 0 ? `${dueTodayCount} cards are ready.` : "You are caught up for now."}
          </h2>
          <p className="mt-4 max-w-2xl text-sm font-medium text-slate-600 sm:text-base">
            {doneForToday
              ? "Your due review queue is complete. Use custom modes only if you want extra practice."
              : dueTodayCount > 0
                ? `Quick start: review about ${quickSessionSize} cards first.`
                : `Run a short ${quickSessionSize}-card refresh session to keep momentum.`}
          </p>

          <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="surface-muted px-4 py-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{doneForToday ? "Done Today" : "Due Now"}</p>
              <p className="mt-2 text-3xl font-black text-slate-950">{dueTodayCount}</p>
            </div>
            <div className="surface-muted px-4 py-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Overdue</p>
              <p className="mt-2 text-3xl font-black text-slate-950">{overdueCount}</p>
            </div>
            <div className="surface-muted px-4 py-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Streak / Last Active</p>
              <p className="mt-2 text-2xl font-black text-slate-950">
                {streak} {lastActivityLabel ? `· ${lastActivityLabel}` : ""}
              </p>
            </div>
          </div>

          <div className={`mt-5 rounded-[1.75rem] border px-5 py-4 ${habitToneClass}`}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{habitNudge.eyebrow}</p>
                <p className="mt-1 text-lg font-black text-slate-950 sm:text-xl">{habitNudge.title}</p>
                <p className="mt-1 text-sm font-medium text-slate-600">{habitNudge.description}</p>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500">
                <span>{streak > 0 ? `${streak}-day rhythm` : "Fresh start"}</span>
                <span className="opacity-40">•</span>
                <span>{overdueCount > 0 ? `${overdueCount} to recover` : `${quickSessionSize}-card suggestion`}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="relative flex min-h-full flex-col gap-4 rounded-[2rem] border border-blue-100/80 bg-white/85 p-5 shadow-[0_24px_54px_-36px_rgba(37,99,235,0.45)] backdrop-blur-sm">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">Primary Action</p>
            <h3 className="mt-3 text-2xl font-black tracking-tight text-slate-950">
              {doneForToday ? "Keep the habit warm." : "Start your daily review."}
            </h3>
            <p className="mt-2 text-sm font-medium leading-relaxed text-slate-600">
              {primaryLanguage
                ? doneForToday
                  ? `All due cards are cleared in ${primaryLanguage.emoji || "🌍"} ${primaryLanguage.name}.`
                  : `Using ${primaryLanguage.emoji || "🌍"} ${primaryLanguage.name} first keeps your daily flow simple.`
                : "Add a language to begin your daily review flow."}
            </p>
          </div>

          <div className="surface-muted px-4 py-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Recommended Session</p>
            <p className="mt-2 text-3xl font-black text-slate-950">{quickSessionSize}</p>
            <p className="mt-1 text-sm font-medium text-slate-600">cards to get moving fast</p>
          </div>

          <div className="mt-auto flex flex-col gap-3">
            <Link
              href={primaryLanguage ? (doneForToday ? `/study/${primaryLanguage.code}` : `/study/${primaryLanguage.code}/session?mode=review&direction=recognition`) : "/manage"}
              className="w-full rounded-2xl bg-blue-600 px-6 py-4 text-center font-black text-white shadow-[0_18px_40px_-22px_rgba(37,99,235,0.75)] transition-all hover:bg-blue-700"
            >
              {doneForToday ? "Review Complete" : "Start Today&apos;s Review"}
            </Link>
            {primaryLanguage && (
              <Link
                href={`/study/${primaryLanguage.code}/session`}
                className="w-full rounded-2xl border border-slate-200 bg-white px-6 py-3 text-center text-[11px] font-black uppercase tracking-[0.18em] text-slate-600 transition-colors hover:border-blue-200 hover:text-blue-600"
              >
                Open custom study modes
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
