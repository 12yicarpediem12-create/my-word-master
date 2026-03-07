"use client";

import Link from "next/link";
import { calculateNextReview } from "./helpers";
import type { ActiveStudyMode, SessionAnswer, SessionWord, StudyDirection } from "./types";

const DIRECTION_OPTIONS: StudyDirection[] = ["recognition", "production", "chaos"];

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
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-start pt-24 pb-12 px-4 relative">
      <button onClick={onCancel} className="absolute top-6 left-6 md:top-8 md:left-8 text-gray-400 hover:text-gray-900 font-bold flex items-center gap-1 uppercase tracking-widest text-xs md:text-sm">
        <span className="text-lg leading-none">✕</span> Cancel
      </button>

      <h1 className="text-3xl md:text-4xl font-black mb-8 text-gray-900 tracking-tight text-center">Study Setup</h1>
      <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-10 text-center">
        Custom modes live here when you want something other than today&apos;s direct review.
      </p>

      <div className="mb-10 w-full max-w-md bg-white p-2 rounded-3xl border-2 border-gray-200 flex shadow-sm">
        {DIRECTION_OPTIONS.map((option) => (
          <button key={option} onClick={() => onDirectionChange(option)} className={`flex-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex flex-col items-center gap-1 transition-all ${direction === option ? "bg-blue-600 text-white shadow-lg" : "text-gray-400 hover:bg-gray-50"}`}>
            <span className="text-xl mb-1">{option === "recognition" ? "📖" : option === "production" ? "✍️" : "🎲"}</span>
            <span className="hidden sm:inline">{option === "recognition" ? "Target → Eng" : option === "production" ? "Eng → Target" : "Chaos"}</span>
            <span className="sm:hidden">{option === "recognition" ? "Target" : option === "production" ? "English" : "Chaos"}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full max-w-6xl">
        <button onClick={() => onStartSession("learning")} className="bg-white border-2 border-gray-100 p-8 rounded-[3rem] hover:border-orange-500 hover:shadow-xl transition-all group text-center">
          <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">🔥</div>
          <h3 className="text-xl font-black mb-2">Learning</h3>
          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">New words</p>
        </button>
        <button onClick={() => onStartSession("review")} className="bg-white border-4 border-blue-600 p-8 rounded-[3rem] shadow-xl hover:-translate-y-2 transition-all group text-center relative">
          <div className="absolute top-0 right-10 bg-blue-600 text-white text-[9px] font-black px-4 py-2 rounded-b-xl uppercase tracking-widest">Best</div>
          <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">🧠</div>
          <h3 className="text-xl font-black mb-2 text-blue-600">Daily Review</h3>
          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Smart SRS</p>
        </button>
        <button onClick={() => onStartSession("weakpoint")} className="bg-red-50 border-2 border-red-100 p-8 rounded-[3rem] hover:border-red-400 hover:shadow-xl transition-all group text-center">
          <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">🚨</div>
          <h3 className="text-xl font-black mb-2 text-red-600">Weak Point</h3>
          <p className="text-[10px] text-red-400 font-black uppercase tracking-widest">Fix mistakes</p>
        </button>
        <button onClick={() => onStartSession("mastered")} className="bg-white border-2 border-gray-100 p-8 rounded-[3rem] hover:border-green-500 hover:shadow-xl transition-all group text-center">
          <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">✅</div>
          <h3 className="text-xl font-black mb-2">Mastered</h3>
          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Keep fresh</p>
        </button>
      </div>
    </div>
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
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
      <h1 className="text-3xl font-black mb-3">{title}</h1>
      <p className="text-gray-500 font-medium mb-8 max-w-md">{description}</p>
      <div className="flex flex-col sm:flex-row gap-3">
        <button onClick={onOpenStudyModes} className="bg-blue-600 text-white px-10 py-4 rounded-2xl font-black shadow-lg">
          Open Study Modes
        </button>
        <Link href={`/study/${langCode}`} className="bg-white border-2 border-gray-200 text-gray-900 px-8 py-4 rounded-2xl font-black">
          Back to Study Hub
        </Link>
      </div>
    </div>
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
  return (
    <div className="min-h-screen bg-blue-600 text-white p-6 flex items-center justify-center">
      <div className="w-full max-w-3xl bg-white/10 border border-white/20 rounded-[2.5rem] p-8 sm:p-10 backdrop-blur-sm">
        <div className="text-center mb-8">
          <div className="text-7xl mb-4">🎖️</div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-2">{completionTitle}</h1>
          <p className="text-blue-100 font-medium">{completionMessage}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
          <div className="bg-white/10 border border-white/20 rounded-2xl px-4 py-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-blue-100">Reviewed</p>
            <p className="text-3xl font-black mt-1">{sessionAnswers.length}</p>
          </div>
          <div className="bg-white/10 border border-white/20 rounded-2xl px-4 py-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-blue-100">
              {mode === "review" ? "Remaining Due" : "Recall Score"}
            </p>
            <p className="text-3xl font-black mt-1">{mode === "review" ? remainingDueCount : `${recallScore}%`}</p>
          </div>
          <div className="bg-white/10 border border-white/20 rounded-2xl px-4 py-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-blue-100">
              {mode === "review" ? "Queue Progress" : "Needs Review"}
            </p>
            <p className="text-3xl font-black mt-1">
              {mode === "review" ? `${Math.min(sessionAnswers.length, reviewQueueTotal)} / ${reviewQueueTotal}` : difficultAnswers.length}
            </p>
          </div>
        </div>

        {difficultAnswers.length > 0 && (
          <div className="mb-8 bg-black/10 border border-white/15 rounded-2xl p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-blue-100 mb-3">Difficult Words</p>
            <div className="space-y-2">
              {difficultAnswers.slice(0, 5).map((item) => (
                <div key={item.id} className="flex items-center justify-between bg-white/10 rounded-xl px-3 py-2">
                  <span className="font-bold">{item.word}</span>
                  <span className="text-xs text-blue-100 font-bold">{item.translation}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {mode === "review" && remainingDueCount > 0 ? (
            <button
              onClick={() => onContinueReview(direction)}
              className="bg-white text-blue-700 rounded-2xl px-5 py-4 font-black transition-colors hover:bg-blue-50"
            >
              Continue Today&apos;s Review
            </button>
          ) : (
            <button
              onClick={onReviewWeakPoints}
              className="bg-red-500 hover:bg-red-600 text-white rounded-2xl px-5 py-4 font-black transition-colors"
            >
              Review Weak Points
            </button>
          )}
          <Link
            href={`/study/${langCode}`}
            className="bg-white text-blue-700 rounded-2xl px-5 py-4 font-black transition-colors hover:bg-blue-50 text-center"
          >
            Back to Study Hub
          </Link>
          <button
            onClick={onOpenStudyModes}
            className="bg-white/15 border border-white/25 text-white rounded-2xl px-5 py-4 font-black transition-colors hover:bg-white/20"
          >
            Custom Study Modes
          </button>
        </div>
      </div>
    </div>
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
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col select-none">
      {errorMsg && (
        <div className="mx-auto mt-3 w-full max-w-3xl px-4">
          <div className="p-3 bg-red-50 border-2 border-red-200 text-red-600 font-bold rounded-xl text-sm">{errorMsg}</div>
        </div>
      )}
      <div className="h-2 bg-gray-200 w-full shrink-0">
        <div className="h-full bg-blue-600 transition-all duration-700" style={{ width: `${progress}%` }} />
      </div>

      <main className="flex-1 flex flex-col items-center justify-start pt-6 pb-8 px-4 max-w-3xl mx-auto w-full">
        <div className="w-full flex items-center justify-between mb-5">
          <button onClick={onOpenStudyModes} className="text-gray-400 hover:text-gray-900 font-black flex items-center gap-2 uppercase text-[10px] tracking-widest">
            <span>←</span> Back
          </button>
          <div className="text-right">
            <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.25em]">{modeLabel}</p>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{direction}</p>
          </div>
        </div>

        <div className="w-full bg-white border-2 border-gray-200 rounded-2xl px-4 py-3 mb-5 shadow-sm flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Progress</p>
            <p className="text-xl font-black text-gray-900">{currentIndex + 1} / {totalWords}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              {mode === "review" ? "Remaining Today" : "Shortcuts"}
            </p>
            <p className="text-xs font-bold text-gray-500">{reviewStatusText}</p>
          </div>
        </div>

        <div className="relative w-full max-w-md h-[420px] [perspective:1000px] mb-6 cursor-pointer" onClick={onFlip}>
          <div className={`relative w-full h-full transition-transform duration-700 [transform-style:preserve-3d] ${isFlipped ? "[transform:rotateY(180deg)]" : ""}`}>
            <div className="absolute inset-0 bg-white border-4 border-blue-100 rounded-[2.5rem] shadow-2xl flex flex-col items-center justify-center p-8 [backface-visibility:hidden]">
              <button onClick={(event) => { event.stopPropagation(); onSpeakFront(); }} className="absolute top-6 right-6 w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center hover:bg-blue-50 transition-colors text-xl">🔊</button>
              <span className="absolute top-10 text-[10px] font-black text-gray-300 uppercase tracking-widest">
                {currentWord.isReversed ? "Translate" : "Question"}
              </span>
              <h2 className="text-4xl sm:text-5xl font-black text-gray-900 text-center leading-tight tracking-tight px-4 break-words w-full">{frontText}</h2>
              <p className="absolute bottom-10 text-blue-500 font-black text-[10px] uppercase tracking-widest">Tap or press Space to flip</p>
            </div>

            <div className="absolute inset-0 bg-blue-600 border-4 border-blue-300 rounded-[2.5rem] shadow-2xl flex flex-col items-center justify-center p-8 [backface-visibility:hidden] [transform:rotateY(180deg)] text-white text-center">
              <button onClick={(event) => { event.stopPropagation(); onSpeakBack(); }} className="absolute top-6 right-6 w-12 h-12 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors text-xl">🔊</button>
              <span className="absolute top-10 text-[10px] font-black opacity-50 uppercase tracking-widest">Answer</span>
              <div className="flex flex-col items-center justify-center w-full h-full pt-10 pb-4">
                <h2 className="text-4xl sm:text-5xl font-black leading-tight tracking-tight mb-6 break-words w-full">{backText}</h2>
                {currentWord.example_sentence && (
                  <div className="bg-black/10 p-4 sm:p-5 rounded-2xl border border-white/10 w-full overflow-y-auto max-h-[120px] scrollbar-hide">
                    <p className="text-[11px] sm:text-[12px] italic font-medium leading-relaxed opacity-95">"{currentWord.example_sentence}"</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className={`w-full max-w-md transition-all duration-500 ${canAnswer ? "opacity-100 translate-y-0" : "opacity-40 translate-y-2 pointer-events-none"}`}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button onClick={(event) => { event.stopPropagation(); onGrade(0); }} className="h-20 flex flex-col items-center justify-center bg-white border-2 border-red-100 text-red-500 rounded-2xl hover:bg-red-50 shadow-sm transition-colors">
              <span className="text-[10px] font-black uppercase tracking-widest">Again</span>
              <span className="text-[9px] font-bold opacity-60 mt-0.5">&lt; 10m • 1</span>
            </button>
            <button onClick={(event) => { event.stopPropagation(); onGrade(3); }} className="h-20 flex flex-col items-center justify-center bg-white border-2 border-orange-100 text-orange-500 rounded-2xl hover:bg-orange-50 shadow-sm transition-colors">
              <span className="text-[10px] font-black uppercase tracking-widest">Hard</span>
              <span className="text-[9px] font-bold opacity-60 mt-0.5">{calculateNextReview(3, currentWord).interval}d • 2</span>
            </button>
            <button onClick={(event) => { event.stopPropagation(); onGrade(4); }} className="h-20 flex flex-col items-center justify-center bg-green-500 text-white rounded-2xl hover:bg-green-600 shadow-md transition-colors">
              <span className="text-[10px] font-black uppercase tracking-widest">Good</span>
              <span className="text-[9px] font-bold opacity-80 mt-0.5">{calculateNextReview(4, currentWord).interval}d • 3</span>
            </button>
            <button onClick={(event) => { event.stopPropagation(); onGrade(5); }} className="h-20 flex flex-col items-center justify-center bg-blue-500 text-white rounded-2xl hover:bg-blue-600 shadow-md transition-colors">
              <span className="text-[10px] font-black uppercase tracking-widest">Easy</span>
              <span className="text-[9px] font-bold opacity-80 mt-0.5">{calculateNextReview(5, currentWord).interval}d • 4</span>
            </button>
          </div>
          <p className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-3">
            {canAnswer ? "Choose your recall quality" : "Flip the card to reveal answer"}
          </p>
        </div>
      </main>
    </div>
  );
}
