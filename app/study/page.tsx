"use client";

import Link from "next/link";
import AppHeader from "../components/AppHeader";
import SearchBar from "../components/SearchBar";
import { AppMain, AppShell, PageIntro, Surface } from "../components/layout/AppShell";
import { useStudyHomeData } from "./useStudyHomeData";

function formatDueLabel(dueToday: number) {
  if (dueToday <= 0) return "Nothing due";
  if (dueToday === 1) return "1 due now";
  return `${dueToday} due now`;
}

function StudyLanguageCard({
  code,
  name,
  emoji,
  dueToday,
  total,
  remembered,
  learning,
  weakWords,
  percentage,
}: {
  code: string;
  name: string;
  emoji: string | null;
  dueToday: number;
  total: number;
  remembered: number;
  learning: number;
  weakWords: number;
  percentage: number;
}) {
  const hasWords = total > 0;
  const primaryHref = hasWords
    ? `/study/${code}/session?mode=review&direction=recognition`
    : `/study/${code}`;
  const primaryLabel = hasWords ? "Start review" : "Open hub";

  return (
    <article className="rounded-[2rem] border border-slate-200/80 bg-white/80 p-5 shadow-[0_22px_45px_-38px_rgba(15,23,42,0.28)] transition-all hover:border-blue-200 hover:bg-white sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-[1.5rem] bg-slate-100 text-3xl">
            {emoji || "🌍"}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-xl font-black tracking-tight text-slate-950">{name}</h2>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-slate-500">
                {code}
              </span>
            </div>
            <p className="mt-2 text-sm font-medium text-slate-600">
              {remembered} mastered, {learning} still in active review.
            </p>
          </div>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ${
            dueToday > 0
              ? "border border-amber-200 bg-amber-50 text-amber-700"
              : "border border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
          {formatDueLabel(dueToday)}
        </span>
      </div>

      <div className="mt-5 rounded-[1.5rem] border border-slate-200 bg-slate-50/80 px-4 py-4">
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Mastery</p>
            <div className="mt-2 flex items-end gap-2">
              <p className="text-3xl font-black tracking-tight text-slate-950">{percentage}%</p>
              <p className="pb-1 text-sm font-medium text-slate-600">{total} words</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-1">
            <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-right">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Weak</p>
              <p className="mt-1 text-xl font-black text-slate-950">{weakWords}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-right">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Learning</p>
              <p className="mt-1 text-xl font-black text-slate-950">{learning}</p>
            </div>
          </div>
        </div>
        <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-white">
          <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-sky-400" style={{ width: `${percentage}%` }} />
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <Link
          href={`/study/${code}`}
          className="rounded-full bg-blue-600 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-white shadow-[0_14px_28px_-20px_rgba(37,99,235,0.75)] transition-colors hover:bg-blue-700"
        >
          Open hub
        </Link>
        <Link
          href={primaryHref}
          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-slate-700 transition-colors hover:border-blue-200 hover:text-blue-600"
        >
          {primaryLabel}
        </Link>
        <Link
          href={`/study/${code}/session`}
          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-slate-700 transition-colors hover:border-blue-200 hover:text-blue-600"
        >
          Custom modes
        </Link>
        <Link
          href={`/study/${code}/topics`}
          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-slate-700 transition-colors hover:border-blue-200 hover:text-blue-600"
        >
          Topics
        </Link>
      </div>
    </article>
  );
}

export default function StudyHomePage() {
  const { vocabStats, recentLanguage, totalDue, totalWeak, isLoading, errorMsg } = useStudyHomeData();

  return (
    <AppShell className="pb-24">
      <AppHeader primarySection="study" searchSlot={<SearchBar />} backHref="/" backLabel="Dashboard" />

      <AppMain width="xl" className="section-stack">
        {errorMsg && <div className="mb-6 rounded-2xl border-2 border-red-200 bg-red-50 p-4 font-bold text-red-600">{errorMsg}</div>}

        <PageIntro
          eyebrow="Study Home"
          title="Choose a language and enter the right study workspace"
          description="Use this page as the explicit study chooser. Resume your recent language when it helps, or pick any language below when you want to choose intentionally."
        />

        {isLoading ? (
          <div className="flex min-h-[16rem] items-center justify-center rounded-[2rem] border border-slate-200 bg-white/80 font-black uppercase tracking-[0.18em] text-slate-400">
            Loading study home...
          </div>
        ) : (
          <>
            <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_22rem]">
              <Surface tone="hero" className="p-7 sm:p-9">
                {recentLanguage ? (
                  <div className="flex h-full flex-col gap-6">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-blue-600">
                        Recent Language
                      </span>
                      <span className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-500">
                        {formatDueLabel(recentLanguage.dueToday)}
                      </span>
                    </div>

                    <div>
                      <p className="text-4xl sm:text-5xl">{recentLanguage.emoji || "🌍"}</p>
                      <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                        Continue in {recentLanguage.name}
                      </h2>
                      <p className="mt-3 max-w-2xl text-sm font-medium leading-relaxed text-slate-600 sm:text-base">
                        This featured path is for continuing your recent language quickly. The chooser below is the canonical place to select any language intentionally.
                      </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="rounded-[1.5rem] border border-slate-200 bg-white/80 px-4 py-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Due Now</p>
                        <p className="mt-2 text-3xl font-black text-slate-950">{recentLanguage.dueToday}</p>
                      </div>
                      <div className="rounded-[1.5rem] border border-slate-200 bg-white/80 px-4 py-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Weak Points</p>
                        <p className="mt-2 text-3xl font-black text-slate-950">{recentLanguage.weakWords}</p>
                      </div>
                      <div className="rounded-[1.5rem] border border-slate-200 bg-white/80 px-4 py-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Mastery</p>
                        <p className="mt-2 text-3xl font-black text-slate-950">{recentLanguage.percentage}%</p>
                      </div>
                    </div>

                    <div className="mt-auto flex flex-wrap gap-3">
                      <Link
                        href={
                          recentLanguage.dueToday > 0
                            ? `/study/${recentLanguage.code}/session?mode=review&direction=recognition`
                            : `/study/${recentLanguage.code}`
                        }
                        className="rounded-2xl bg-blue-600 px-6 py-4 font-black text-white shadow-[0_18px_40px_-22px_rgba(37,99,235,0.75)] transition-colors hover:bg-blue-700"
                      >
                        {recentLanguage.dueToday > 0 ? "Continue review" : "Open recent hub"}
                      </Link>
                      <Link
                        href={`/study/${recentLanguage.code}/session`}
                        className="rounded-2xl border border-slate-200 bg-white px-6 py-4 text-[11px] font-black uppercase tracking-[0.18em] text-slate-700 transition-colors hover:border-blue-200 hover:text-blue-600"
                      >
                        Custom modes
                      </Link>
                      <Link
                        href={`/study/${recentLanguage.code}/topics`}
                        className="rounded-2xl border border-slate-200 bg-white px-6 py-4 text-[11px] font-black uppercase tracking-[0.18em] text-slate-700 transition-colors hover:border-blue-200 hover:text-blue-600"
                      >
                        Topics
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="flex h-full flex-col justify-between gap-6">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">Study Entry</p>
                      <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950">Add a language to start studying</h2>
                      <p className="mt-3 text-sm font-medium leading-relaxed text-slate-600">
                        Once you add a language and a few words, this page becomes the explicit chooser for every study flow.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <Link href="/manage" className="rounded-2xl bg-blue-600 px-6 py-4 font-black text-white transition-colors hover:bg-blue-700">
                        Manage setup
                      </Link>
                      <Link href="/import" className="rounded-2xl border border-slate-200 bg-white px-6 py-4 font-black text-slate-950 transition-colors hover:border-blue-200 hover:text-blue-600">
                        Import words
                      </Link>
                    </div>
                  </div>
                )}
              </Surface>

              <Surface tone="muted" className="p-6 sm:p-7">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Across Study</p>
                <div className="mt-5 grid gap-3">
                  <div className="rounded-[1.5rem] border border-slate-200 bg-white px-4 py-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Languages</p>
                    <p className="mt-2 text-3xl font-black text-slate-950">{vocabStats.length}</p>
                  </div>
                  <div className="rounded-[1.5rem] border border-slate-200 bg-white px-4 py-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Due Across Study</p>
                    <p className="mt-2 text-3xl font-black text-slate-950">{totalDue}</p>
                  </div>
                  <div className="rounded-[1.5rem] border border-slate-200 bg-white px-4 py-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Weak Points</p>
                    <p className="mt-2 text-3xl font-black text-slate-950">{totalWeak}</p>
                  </div>
                  <Link
                    href="/history"
                    className="rounded-[1.5rem] border border-slate-200 bg-white px-4 py-4 font-black text-slate-950 transition-colors hover:border-blue-200 hover:text-blue-600"
                  >
                    Review history
                    <p className="mt-1 text-xs font-bold uppercase tracking-widest text-slate-400">See past learning activity</p>
                  </Link>
                </div>
              </Surface>
            </section>

            <section className="pt-2">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Language Chooser</p>
                  <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950">Pick a language intentionally</h2>
                  <p className="mt-2 text-sm font-medium leading-relaxed text-slate-600">
                    Every card below is an explicit study entry point. Use this page when you want to choose rather than continue whatever was active most recently.
                  </p>
                </div>
                <span className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-500">
                  {vocabStats.length} languages
                </span>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                {vocabStats.map((stat) => (
                  <StudyLanguageCard key={stat.code} {...stat} />
                ))}
              </div>
            </section>
          </>
        )}
      </AppMain>
    </AppShell>
  );
}
