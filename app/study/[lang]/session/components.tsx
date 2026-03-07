"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { calculateNextReview } from "./helpers";
import type { ActiveStudyMode, SessionAnswer, SessionWord, StudyDirection } from "./types";

const DIRECTION_OPTIONS: StudyDirection[] = ["recognition", "production", "chaos"];

function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function SessionShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#eef4fb_55%,#f4f7fb_100%)] text-slate-950",
        className
      )}
    >
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-[26rem] w-[26rem] -translate-x-1/2 rounded-full bg-blue-200/30 blur-3xl" />
        <div className="absolute right-0 top-1/3 h-72 w-72 rounded-full bg-sky-100/40 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-slate-200/25 blur-3xl" />
      </div>
      <div className="relative">{children}</div>
    </div>
  );
}

function SessionFrame({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8", className)}>{children}</div>;
}

function SessionSurface({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("surface-card", className)}>{children}</div>;
}

function SessionTopLink({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 shadow-sm backdrop-blur-sm transition-colors hover:text-slate-950"
    >
      <span className="text-sm">←</span>
      {label}
    </button>
  );
}

function SessionStat({
  label,
  value,
  helper,
  tone = "default",
}: {
  label: string;
  value: string | number;
  helper?: string;
  tone?: "default" | "accent";
}) {
  return (
    <div
      className={cn(
        "rounded-[1.5rem] border px-4 py-4",
        tone === "accent"
          ? "bg-blue-50/90 border-blue-100 text-slate-950"
          : "bg-white/80 border-slate-200 text-slate-950"
      )}
    >
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-black tracking-tight">{value}</p>
      {helper && <p className="mt-1 text-sm font-medium text-slate-600">{helper}</p>}
    </div>
  );
}

function SessionModeCard({
  title,
  subtitle,
  icon,
  tone = "default",
  featured = false,
  onClick,
}: {
  title: string;
  subtitle: string;
  icon: string;
  tone?: "default" | "review" | "danger" | "success";
  featured?: boolean;
  onClick: () => void;
}) {
  const toneClass = {
    default: "border-slate-200 bg-white hover:border-blue-200",
    review: "border-blue-200 bg-blue-50/70 hover:border-blue-300",
    danger: "border-red-200 bg-red-50/70 hover:border-red-300",
    success: "border-emerald-200 bg-emerald-50/60 hover:border-emerald-300",
  }[tone];

  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative rounded-[2rem] border p-7 text-left shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg",
        toneClass,
        featured && "ring-2 ring-blue-200/70"
      )}
    >
      {featured && (
        <span className="absolute right-6 top-0 rounded-b-xl bg-blue-600 px-3 py-2 text-[9px] font-black uppercase tracking-widest text-white">
          Best
        </span>
      )}
      <div className="text-5xl transition-transform group-hover:scale-110">{icon}</div>
      <h3 className={cn("mt-6 text-xl font-black", tone === "review" ? "text-blue-700" : tone === "danger" ? "text-red-600" : "text-slate-950")}>
        {title}
      </h3>
      <p className="mt-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{subtitle}</p>
    </button>
  );
}

function GradeButton({
  label,
  shortcut,
  nextLabel,
  tone,
  onClick,
}: {
  label: string;
  shortcut: string;
  nextLabel: string;
  tone: "again" | "hard" | "good" | "easy";
  onClick: () => void;
}) {
  const toneClass = {
    again: "border-red-100 bg-white text-red-500 hover:bg-red-50",
    hard: "border-orange-100 bg-white text-orange-500 hover:bg-orange-50",
    good: "border-green-500 bg-green-500 text-white hover:bg-green-600",
    easy: "border-blue-500 bg-blue-500 text-white hover:bg-blue-600",
  }[tone];

  return (
    <button
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      className={cn(
        "flex h-20 flex-col items-center justify-center rounded-2xl border transition-colors shadow-sm",
        toneClass
      )}
    >
      <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
      <span className="mt-1 text-[9px] font-bold opacity-75">{nextLabel}</span>
      <span className="mt-1 text-[9px] font-black uppercase tracking-[0.16em] opacity-60">{shortcut}</span>
    </button>
  );
}

export function StudySessionSetup({
  direction,
  onDirectionChange,
  onStartSession,
  onCancel,
}: {
  direction: StudyDirection;
  onDirectionChange: (direction: StudyDirection) => void;
  onStartSession: (mode: ActiveStudyMode) => void;
  onCancel: () => void;
}) {
  return (
    <SessionShell>
      <SessionFrame className="pt-6 sm:pt-8">
        <SessionTopLink label="Exit Focus Mode" onClick={onCancel} />
      </SessionFrame>

      <SessionFrame className="pb-14 pt-8 sm:pt-10 lg:pt-14">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8 text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-blue-600">Focus Mode</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">Choose how you want to study.</h1>
            <p className="mx-auto mt-4 max-w-2xl text-sm font-medium leading-relaxed text-slate-600 sm:text-base">
              Today’s direct review can still auto-start from the hub. This setup screen is the calm place to choose a custom session when you want a different mode.
            </p>
          </div>

          <SessionSurface className="rounded-[2.5rem] p-6 sm:p-8 lg:p-10">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-start">
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Direction</p>
                  <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950">Pick the card direction</h2>
                  <p className="mt-2 text-sm font-medium text-slate-600">
                    Recognition keeps you moving, production pushes recall, and chaos mixes both.
                  </p>
                </div>

                <div className="grid gap-2 rounded-[2rem] border border-slate-200 bg-slate-50/80 p-2">
                  {DIRECTION_OPTIONS.map((option) => {
                    const isActive = direction === option;
                    const title =
                      option === "recognition"
                        ? "Target to English"
                        : option === "production"
                          ? "English to Target"
                          : "Chaos mix";
                    const icon = option === "recognition" ? "📖" : option === "production" ? "✍️" : "🎲";

                    return (
                      <button
                        key={option}
                        onClick={() => onDirectionChange(option)}
                        className={cn(
                          "flex items-center gap-4 rounded-[1.5rem] px-4 py-4 text-left transition-all",
                          isActive ? "bg-blue-600 text-white shadow-lg" : "bg-white text-slate-600 hover:bg-slate-100"
                        )}
                      >
                        <span className="text-2xl">{icon}</span>
                        <div>
                          <p className="text-xs font-black uppercase tracking-[0.18em]">{option}</p>
                          <p className={cn("mt-1 text-sm font-bold", isActive ? "text-blue-50" : "text-slate-500")}>{title}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Modes</p>
                <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950">Start a session</h2>
                <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <SessionModeCard title="Learning" subtitle="New words" icon="🔥" onClick={() => onStartSession("learning")} />
                  <SessionModeCard title="Daily Review" subtitle="Smart SRS" icon="🧠" tone="review" featured onClick={() => onStartSession("review")} />
                  <SessionModeCard title="Weak Point" subtitle="Fix mistakes" icon="🚨" tone="danger" onClick={() => onStartSession("weakpoint")} />
                  <SessionModeCard title="Mastered" subtitle="Keep fresh" icon="✅" tone="success" onClick={() => onStartSession("mastered")} />
                </div>
              </div>
            </div>
          </SessionSurface>
        </div>
      </SessionFrame>
    </SessionShell>
  );
}

export function StudySessionEmpty({
  title,
  description,
  langCode,
  onOpenStudyModes,
}: {
  title: string;
  description: string;
  langCode: string;
  onOpenStudyModes: () => void;
}) {
  return (
    <SessionShell>
      <SessionFrame className="py-14 sm:py-20">
        <div className="mx-auto max-w-3xl">
          <SessionSurface className="rounded-[2.5rem] p-8 text-center sm:p-12">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-blue-600">Focus Mode</p>
            <div className="mt-6 text-6xl opacity-70">✨</div>
            <h1 className="mt-6 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">{title}</h1>
            <p className="mx-auto mt-4 max-w-xl text-sm font-medium leading-relaxed text-slate-600 sm:text-base">{description}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button onClick={onOpenStudyModes} className="rounded-2xl bg-blue-600 px-10 py-4 font-black text-white shadow-lg transition-colors hover:bg-blue-700">
                Open Study Modes
              </button>
              <Link href={`/study/${langCode}`} className="rounded-2xl border border-slate-200 bg-white px-8 py-4 font-black text-slate-950 transition-colors hover:border-blue-200 hover:text-blue-600">
                Back to Study Hub
              </Link>
            </div>
          </SessionSurface>
        </div>
      </SessionFrame>
    </SessionShell>
  );
}

export function StudySessionResults({
  mode,
  direction,
  langCode,
  remainingDueCount,
  reviewQueueTotal,
  sessionAnswers,
  completionMessage,
  completionTitle,
  recallScore,
  difficultAnswers,
  onContinueReview,
  onReviewWeakPoints,
  onOpenStudyModes,
}: {
  mode: ActiveStudyMode;
  direction: StudyDirection;
  langCode: string;
  remainingDueCount: number;
  reviewQueueTotal: number;
  sessionAnswers: SessionAnswer[];
  completionMessage: string;
  completionTitle: string;
  recallScore: number;
  difficultAnswers: SessionAnswer[];
  onContinueReview: (direction: StudyDirection) => void;
  onReviewWeakPoints: () => void;
  onOpenStudyModes: () => void;
}) {
  const primaryActionLabel =
    mode === "review" && remainingDueCount > 0 ? "Continue Today’s Review" : "Review Weak Points";

  return (
    <SessionShell>
      <SessionFrame className="py-10 sm:py-14">
        <div className="mx-auto max-w-4xl">
          <SessionSurface className="rounded-[2.75rem] p-8 sm:p-10 lg:p-12">
            <div className="text-center">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-blue-600">Session Complete</p>
              <div className="mt-5 text-7xl">🎖️</div>
              <h1 className="mt-5 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">{completionTitle}</h1>
              <p className="mx-auto mt-4 max-w-2xl text-sm font-medium leading-relaxed text-slate-600 sm:text-base">{completionMessage}</p>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <SessionStat label="Reviewed" value={sessionAnswers.length} helper="cards in this session" />
              <SessionStat
                label={mode === "review" ? "Remaining Due" : "Recall Score"}
                value={mode === "review" ? remainingDueCount : `${recallScore}%`}
                helper={mode === "review" ? "still left in today’s queue" : "strong recall answers"}
                tone="accent"
              />
              <SessionStat
                label={mode === "review" ? "Queue Progress" : "Needs Review"}
                value={mode === "review" ? `${Math.min(sessionAnswers.length, reviewQueueTotal)} / ${reviewQueueTotal}` : difficultAnswers.length}
                helper={mode === "review" ? "cards completed from this queue" : "answers marked hard or again"}
              />
            </div>

            {difficultAnswers.length > 0 && (
              <div className="mt-8 rounded-[2rem] border border-slate-200 bg-slate-50/90 p-5 sm:p-6">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Weak Points</p>
                    <h2 className="mt-2 text-xl font-black tracking-tight text-slate-950">Cards worth another pass</h2>
                  </div>
                  <p className="text-sm font-medium text-slate-500">{difficultAnswers.length} card{difficultAnswers.length !== 1 ? "s" : ""} flagged</p>
                </div>

                <div className="mt-4 space-y-2">
                  {difficultAnswers.slice(0, 5).map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-4 rounded-[1.25rem] border border-slate-200 bg-white px-4 py-3">
                      <span className="font-black text-slate-950">{item.word}</span>
                      <span className="text-sm font-bold text-slate-500">{item.translation}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-8 rounded-[2rem] border border-blue-100 bg-blue-50/70 p-5 sm:p-6">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">Next Step</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
                {mode === "review" && remainingDueCount > 0 ? "You can finish today’s queue now." : "Loop back into the hub or sharpen weak cards."}
              </h2>
              <p className="mt-2 text-sm font-medium text-slate-600">
                {mode === "review" && remainingDueCount > 0
                  ? `${remainingDueCount} due ${remainingDueCount === 1 ? "card remains" : "cards remain"} in today’s review.`
                  : "This session is complete. The next best move depends on whether you want to consolidate or continue exploring."}
              </p>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {mode === "review" && remainingDueCount > 0 ? (
                <button
                  onClick={() => onContinueReview(direction)}
                  className="rounded-2xl bg-blue-600 px-5 py-4 font-black text-white transition-colors hover:bg-blue-700"
                >
                  {primaryActionLabel}
                </button>
              ) : (
                <button
                  onClick={onReviewWeakPoints}
                  className="rounded-2xl bg-red-500 px-5 py-4 font-black text-white transition-colors hover:bg-red-600"
                >
                  {primaryActionLabel}
                </button>
              )}
              <Link
                href={`/study/${langCode}`}
                className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-center font-black text-slate-950 transition-colors hover:border-blue-200 hover:text-blue-600"
              >
                Back to Study Hub
              </Link>
              <button
                onClick={onOpenStudyModes}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 font-black text-slate-700 transition-colors hover:border-blue-200 hover:text-blue-600"
              >
                Custom Study Modes
              </button>
            </div>
          </SessionSurface>
        </div>
      </SessionFrame>
    </SessionShell>
  );
}

export function StudySessionActive({
  errorMsg,
  progress,
  modeLabel,
  direction,
  currentIndex,
  totalWords,
  reviewStatusText,
  mode,
  currentWord,
  frontText,
  backText,
  isFlipped,
  canAnswer,
  onOpenStudyModes,
  onFlip,
  onSpeakFront,
  onSpeakBack,
  onGrade,
}: {
  errorMsg: string | null;
  progress: number;
  modeLabel: string;
  direction: StudyDirection;
  currentIndex: number;
  totalWords: number;
  reviewStatusText: string;
  mode: ActiveStudyMode;
  currentWord: SessionWord;
  frontText: string;
  backText: string;
  isFlipped: boolean;
  canAnswer: boolean;
  onOpenStudyModes: () => void;
  onFlip: () => void;
  onSpeakFront: () => void;
  onSpeakBack: () => void;
  onGrade: (quality: number) => void;
}) {
  const frontLabel = currentWord.isReversed ? "Translate" : "Question";
  const backLabel = currentWord.isReversed ? "Target Word" : "Answer";

  return (
    <SessionShell className="select-none">
      <SessionFrame className="pt-4 sm:pt-6">
        <SessionSurface className="rounded-[2rem] border border-slate-200/80 bg-white/70 p-4 backdrop-blur-md">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap items-center gap-3">
                <SessionTopLink label="Study Modes" onClick={onOpenStudyModes} />
                <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-blue-600">
                  {modeLabel}
                </span>
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                  {direction}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Progress</p>
                  <p className="mt-1 text-xl font-black text-slate-950">
                    {currentIndex + 1} / {totalWords}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    {mode === "review" ? "Queue" : "Status"}
                  </p>
                  <p className="mt-1 text-sm font-bold text-slate-600">{reviewStatusText}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 col-span-2 sm:col-span-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Shortcuts</p>
                  <p className="mt-1 text-sm font-bold text-slate-600">Space flip • 1/2/3/4 grade</p>
                </div>
              </div>
            </div>

            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
              <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-sky-400 transition-all duration-700" style={{ width: `${progress}%` }} />
            </div>

            {errorMsg && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-600">{errorMsg}</div>
            )}
          </div>
        </SessionSurface>
      </SessionFrame>

      <SessionFrame className="pb-10 pt-6 sm:pt-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center">
          <div className="w-full max-w-[44rem]">
            <div className="mb-5 text-center">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Card Stage</p>
            </div>

            <div className="relative mx-auto h-[430px] w-full cursor-pointer sm:h-[500px] [perspective:1400px]" onClick={onFlip}>
              <div className={cn("relative h-full w-full transition-transform duration-700 [transform-style:preserve-3d]", isFlipped && "[transform:rotateY(180deg)]")}>
                <div className="absolute inset-0 [backface-visibility:hidden]">
                  <div className="surface-hero flex h-full flex-col items-center justify-center rounded-[2.75rem] border border-blue-100/80 p-8 shadow-[0_30px_90px_-45px_rgba(37,99,235,0.45)] sm:p-12">
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        onSpeakFront();
                      }}
                      className="absolute right-6 top-6 flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white text-xl transition-colors hover:bg-blue-50"
                    >
                      🔊
                    </button>
                    <span className="absolute top-10 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{frontLabel}</span>
                    <h2 className="w-full break-words px-4 text-center text-4xl font-black leading-tight tracking-tight text-slate-950 sm:text-6xl">
                      {frontText}
                    </h2>
                    <p className="absolute bottom-10 text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">
                      Tap or press Space to flip
                    </p>
                  </div>
                </div>

                <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)]">
                  <div className="flex h-full flex-col rounded-[2.75rem] border border-blue-300/80 bg-[linear-gradient(145deg,#2563eb,#1d4ed8)] p-8 text-white shadow-[0_34px_100px_-46px_rgba(37,99,235,0.85)] sm:p-12">
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        onSpeakBack();
                      }}
                      className="absolute right-6 top-6 flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-white/10 text-xl transition-colors hover:bg-white/20"
                    >
                      🔊
                    </button>
                    <span className="absolute top-10 text-[10px] font-black uppercase tracking-[0.2em] text-blue-100/80">{backLabel}</span>
                    <div className="flex h-full flex-col items-center justify-center pt-10 text-center">
                      <h2 className="w-full break-words text-4xl font-black leading-tight tracking-tight sm:text-6xl">{backText}</h2>
                      {currentWord.example_sentence && (
                        <div className="mt-8 max-h-[140px] w-full overflow-y-auto rounded-[1.75rem] border border-white/15 bg-black/10 p-4 sm:p-5 scrollbar-hide">
                          <p className="text-[12px] font-medium leading-relaxed italic text-blue-50 sm:text-[13px]">&quot;{currentWord.example_sentence}&quot;</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className={cn("mt-6 transition-all duration-500", canAnswer ? "opacity-100 translate-y-0" : "pointer-events-none translate-y-2 opacity-40")}>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <GradeButton label="Again" shortcut="1" nextLabel="< 10m" tone="again" onClick={() => onGrade(0)} />
                <GradeButton label="Hard" shortcut="2" nextLabel={`${calculateNextReview(3, currentWord).interval}d`} tone="hard" onClick={() => onGrade(3)} />
                <GradeButton label="Good" shortcut="3" nextLabel={`${calculateNextReview(4, currentWord).interval}d`} tone="good" onClick={() => onGrade(4)} />
                <GradeButton label="Easy" shortcut="4" nextLabel={`${calculateNextReview(5, currentWord).interval}d`} tone="easy" onClick={() => onGrade(5)} />
              </div>
              <p className="mt-4 text-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                {canAnswer ? "Choose your recall quality" : "Flip the card to reveal the answer"}
              </p>
            </div>
          </div>
        </div>
      </SessionFrame>
    </SessionShell>
  );
}
