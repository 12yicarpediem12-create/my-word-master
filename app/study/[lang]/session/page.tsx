"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { applyStudyResult } from "../../../actions/vocab";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const SESSION_WORD_COLUMNS =
  "id, word, translation, example_sentence, is_remembered, mistake_count, repetition, efactor, interval, next_review_date";

type Mode = "learning" | "review" | "mastered" | "weakpoint" | null;
type Direction = "recognition" | "production" | "chaos";
type SessionAnswer = {
  id: string;
  word: string;
  translation: string;
  quality: number;
};

function isMode(value: string | null): value is Exclude<Mode, null> {
  return value === "learning" || value === "review" || value === "mastered" || value === "weakpoint";
}

function isDirection(value: string | null): value is Direction {
  return value === "recognition" || value === "production" || value === "chaos";
}

export default function StudySession() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const langCode = params.lang as string;
  const autoStartedRef = useRef(false);

  const [mode, setMode] = useState<Mode>(null);
  const [direction, setDirection] = useState<Direction>("recognition");
  const [words, setWords] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [sessionAnswers, setSessionAnswers] = useState<SessionAnswer[]>([]);
  const [reviewQueueTotal, setReviewQueueTotal] = useState(0);
  const [remainingDueCount, setRemainingDueCount] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const speak = useCallback((text: string, isEnglish: boolean = false) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    
    window.speechSynthesis.cancel();
    window.speechSynthesis.resume(); 

    const utterance = new SpeechSynthesisUtterance(text);
    
    if (isEnglish) {
      utterance.lang = "en-US";
    } else {
      const langMap: Record<string, string> = { 
        it: "it-IT", fr: "fr-FR", es: "es-ES", de: "de-DE", pt: "pt-PT", 
        ja: "ja-JP", ko: "ko-KR", ru: "ru-RU", zh: "zh-CN"
      };
      utterance.lang = langMap[langCode] || `${langCode}-${langCode.toUpperCase()}`;
    }
    
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  }, [langCode]);

  const startSession = useCallback(async (selectedMode: Mode, selectedDirection?: Direction) => {
    const effectiveDirection = selectedDirection || direction;
    setMode(selectedMode);
    if (selectedDirection) setDirection(selectedDirection);
    setIsLoading(true);
    setErrorMsg(null);
    setIsFinished(false);
    setCurrentIndex(0);
    setIsFlipped(false);
    setSessionAnswers([]);
    setReviewQueueTotal(0);
    setRemainingDueCount(0);

    let query = supabase.from("vocab").select(SESSION_WORD_COLUMNS).eq("language_code", langCode);

    if (selectedMode === "learning") {
      query = query.eq("is_remembered", false);
    } else if (selectedMode === "mastered") {
      query = query.eq("is_remembered", true);
    } else if (selectedMode === "review") {
      const now = new Date().toISOString();
      const { count, error: countError } = await supabase
        .from("vocab")
        .select("id", { count: "exact", head: true })
        .eq("language_code", langCode)
        .or(`next_review_date.lte.${now},next_review_date.is.null`);

      if (countError) {
        setErrorMsg(countError.message);
        setWords([]);
        setIsLoading(false);
        return;
      }

      const totalDue = count ?? 0;
      setReviewQueueTotal(totalDue);
      setRemainingDueCount(totalDue);
      query = query.or(`next_review_date.lte.${now},next_review_date.is.null`);
    } else if (selectedMode === "weakpoint") {
      query = query.gt("mistake_count", 0).order("mistake_count", { ascending: false });
    }

    const { data, error } = await query.limit(15);
    if (error) {
      setErrorMsg(error.message);
      setWords([]);
      setIsLoading(false);
      return;
    }

    if (data && data.length > 0) {
      const preparedWords = data.sort(() => Math.random() - 0.5).map(w => ({
        ...w,
        isReversed: effectiveDirection === "production" ? true : (effectiveDirection === "chaos" ? Math.random() > 0.5 : false),
        repetition: w.repetition || 0,
        efactor: w.efactor || 2.5,
        interval: w.interval || 0,
        mistake_count: w.mistake_count || 0
      }));
      setWords(preparedWords);
      const firstWord = preparedWords[0];
      setTimeout(() => speak(firstWord.isReversed ? firstWord.translation : firstWord.word, firstWord.isReversed), 500);
    } else {
      setWords([]);
    }
    setIsLoading(false);
  }, [direction, langCode, speak]);

  const calculateNextReview = (quality: number, currentWord: any) => {
    let { repetition, efactor, interval, mistake_count } = currentWord;
    
    if (quality < 3) {
      repetition = 0;
      interval = 0;
      mistake_count = (mistake_count || 0) + 1; 
    } else {
      if (repetition === 0) interval = 1;
      else if (repetition === 1) interval = 6;
      else interval = Math.round(interval * efactor);
      
      if (quality === 3) interval = Math.max(1, Math.round(interval * 1.2));
      if (quality === 5) interval = Math.round(interval * 1.3);
      
      if (quality >= 4) mistake_count = 0;
      repetition += 1;
    }
    
    efactor = efactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    if (efactor < 1.3) efactor = 1.3;
    
    return { repetition, efactor, interval, mistake_count };
  };

  const handleResult = async (quality: number) => {
    const currentWord = words[currentIndex];
    const newStats = calculateNextReview(quality, currentWord);
    const nextReviewDate = new Date();
    
    if (newStats.interval === 0) {
      nextReviewDate.setMinutes(nextReviewDate.getMinutes() + 10);
    } else {
      nextReviewDate.setDate(nextReviewDate.getDate() + newStats.interval);
    }
    
    const isRemembered = quality >= 4;
    
    const { error } = await applyStudyResult({
      wordId: currentWord.id,
      is_remembered: isRemembered,
      last_reviewed: new Date().toISOString(),
      next_review_date: nextReviewDate.toISOString(),
      repetition: newStats.repetition,
      efactor: newStats.efactor,
      interval: newStats.interval,
      mistake_count: newStats.mistake_count,
    });
    if (error) {
      setErrorMsg(error);
      return;
    }

    if (mode === "review") {
      setRemainingDueCount((prev) => Math.max(prev - 1, 0));
    }

    setSessionAnswers((prev) => [
      ...prev,
      {
        id: String(currentWord.id),
        word: String(currentWord.word),
        translation: String(currentWord.translation),
        quality,
      },
    ]);

    if (currentIndex < words.length - 1) {
      setIsFlipped(false);
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      const nextWord = words[nextIdx];
      setTimeout(() => speak(nextWord.isReversed ? nextWord.translation : nextWord.word, nextWord.isReversed), 300);
    } else {
      setIsFinished(true);
    }
  };

  useEffect(() => {
    if (isFlipped && words[currentIndex]) {
      const currentWord = words[currentIndex];
      speak(!currentWord.isReversed ? currentWord.translation : currentWord.word, !currentWord.isReversed);
    }
  }, [isFlipped, words, currentIndex, speak]);

  useEffect(() => {
    if (!mode || isLoading || isFinished || words.length === 0) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code === "Space") {
        event.preventDefault();
        setIsFlipped((prev) => !prev);
        return;
      }

      if (!isFlipped) return;

      if (event.key === "1") handleResult(0);
      if (event.key === "2") handleResult(3);
      if (event.key === "3") handleResult(4);
      if (event.key === "4") handleResult(5);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mode, isLoading, isFinished, words.length, isFlipped, handleResult]);

  useEffect(() => {
    if (autoStartedRef.current) return;

    const requestedMode = searchParams.get("mode");
    const requestedDirection = searchParams.get("direction");

    if (!isMode(requestedMode)) return;

    autoStartedRef.current = true;
    startSession(requestedMode, isDirection(requestedDirection) ? requestedDirection : "recognition");
  }, [searchParams, startSession]);

  if (!mode) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-start pt-24 pb-12 px-4 relative">
        <button onClick={() => router.back()} className="absolute top-6 left-6 md:top-8 md:left-8 text-gray-400 hover:text-gray-900 font-bold flex items-center gap-1 uppercase tracking-widest text-xs md:text-sm">
          <span className="text-lg leading-none">✕</span> Cancel
        </button>
        
        <h1 className="text-3xl md:text-4xl font-black mb-8 text-gray-900 tracking-tight text-center">Study Setup</h1>
        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-10 text-center">
          Custom modes live here when you want something other than today&apos;s direct review.
        </p>
        
        <div className="mb-10 w-full max-w-md bg-white p-2 rounded-3xl border-2 border-gray-200 flex shadow-sm">
          {["recognition", "production", "chaos"].map((d) => (
            <button key={d} onClick={() => setDirection(d as Direction)} className={`flex-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex flex-col items-center gap-1 transition-all ${direction === d ? "bg-blue-600 text-white shadow-lg" : "text-gray-400 hover:bg-gray-50"}`}>
              <span className="text-xl mb-1">{d === 'recognition' ? '📖' : d === 'production' ? '✍️' : '🎲'}</span>
              <span className="hidden sm:inline">{d === 'recognition' ? 'Target → Eng' : d === 'production' ? 'Eng → Target' : 'Chaos'}</span>
              <span className="sm:hidden">{d === 'recognition' ? 'Target' : d === 'production' ? 'English' : 'Chaos'}</span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full max-w-6xl">
          <button onClick={() => startSession("learning")} className="bg-white border-2 border-gray-100 p-8 rounded-[3rem] hover:border-orange-500 hover:shadow-xl transition-all group text-center">
            <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">🔥</div>
            <h3 className="text-xl font-black mb-2">Learning</h3>
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">New words</p>
          </button>
          <button onClick={() => startSession("review")} className="bg-white border-4 border-blue-600 p-8 rounded-[3rem] shadow-xl hover:-translate-y-2 transition-all group text-center relative">
            <div className="absolute top-0 right-10 bg-blue-600 text-white text-[9px] font-black px-4 py-2 rounded-b-xl uppercase tracking-widest">Best</div>
            <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">🧠</div>
            <h3 className="text-xl font-black mb-2 text-blue-600">Daily Review</h3>
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Smart SRS</p>
          </button>
          <button onClick={() => startSession("weakpoint")} className="bg-red-50 border-2 border-red-100 p-8 rounded-[3rem] hover:border-red-400 hover:shadow-xl transition-all group text-center">
            <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">🚨</div>
            <h3 className="text-xl font-black mb-2 text-red-600">Weak Point</h3>
            <p className="text-[10px] text-red-400 font-black uppercase tracking-widest">Fix mistakes</p>
          </button>
          <button onClick={() => startSession("mastered")} className="bg-white border-2 border-gray-100 p-8 rounded-[3rem] hover:border-green-500 hover:shadow-xl transition-all group text-center">
            <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">✅</div>
            <h3 className="text-xl font-black mb-2">Mastered</h3>
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Keep fresh</p>
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center font-bold text-gray-400 tracking-widest uppercase animate-pulse">Loading Session...</div>;
  
  if (words.length === 0) return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
      <h1 className="text-3xl font-black mb-3">{mode === "review" ? "No cards due right now. ✨" : "All caught up! 🏜️"}</h1>
      <p className="text-gray-500 font-medium mb-8 max-w-md">
        {mode === "review"
          ? "Today&apos;s review queue is empty. You can open custom study modes or head back to your study hub."
          : "This mode has no cards available right now. Try another session type."}
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <button onClick={() => setMode(null)} className="bg-blue-600 text-white px-10 py-4 rounded-2xl font-black shadow-lg">
          Open Study Modes
        </button>
        <Link href={`/study/${langCode}`} className="bg-white border-2 border-gray-200 text-gray-900 px-8 py-4 rounded-2xl font-black">
          Back to Study Hub
        </Link>
      </div>
    </div>
  );

  if (isFinished) return (
    <div className="min-h-screen bg-blue-600 text-white p-6 flex items-center justify-center">
      <div className="w-full max-w-3xl bg-white/10 border border-white/20 rounded-[2.5rem] p-8 sm:p-10 backdrop-blur-sm">
        <div className="text-center mb-8">
          <div className="text-7xl mb-4">🎖️</div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-2">
            {mode === "review" && remainingDueCount === 0 ? "Done for Today" : "Session Complete"}
          </h1>
          <p className="text-blue-100 font-medium">
            {(() => {
              if (mode === "review" && remainingDueCount === 0) {
                return "Today’s due review is finished. You are clear for now.";
              }
              if (mode === "review" && remainingDueCount > 0) {
                return `${remainingDueCount} due ${remainingDueCount === 1 ? "card remains" : "cards remain"} if you want to finish today’s queue.`;
              }
              const reviewed = sessionAnswers.length;
              if (!reviewed) return "Nice work finishing your session.";
              const strong = sessionAnswers.filter((a) => a.quality >= 4).length;
              const score = Math.round((strong / reviewed) * 100);
              if (score >= 80) return "Great recall today. Keep the streak going.";
              if (score >= 60) return "Solid progress. A quick weak-point pass will help.";
              return "Good effort. Focus weak cards next for faster gains.";
            })()}
          </p>
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
            <p className="text-3xl font-black mt-1">
              {mode === "review"
                ? remainingDueCount
                : sessionAnswers.length === 0
                  ? "0%"
                  : `${Math.round((sessionAnswers.filter((a) => a.quality >= 4).length / sessionAnswers.length) * 100)}%`}
            </p>
          </div>
          <div className="bg-white/10 border border-white/20 rounded-2xl px-4 py-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-blue-100">
              {mode === "review" ? "Queue Progress" : "Needs Review"}
            </p>
            <p className="text-3xl font-black mt-1">
              {mode === "review"
                ? `${Math.min(sessionAnswers.length, reviewQueueTotal)} / ${reviewQueueTotal}`
                : sessionAnswers.filter((a) => a.quality <= 3).length}
            </p>
          </div>
        </div>

        {sessionAnswers.some((a) => a.quality <= 3) && (
          <div className="mb-8 bg-black/10 border border-white/15 rounded-2xl p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-blue-100 mb-3">Difficult Words</p>
            <div className="space-y-2">
              {sessionAnswers
                .filter((a) => a.quality <= 3)
                .slice(0, 5)
                .map((item) => (
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
              onClick={() => startSession("review", direction)}
              className="bg-white text-blue-700 rounded-2xl px-5 py-4 font-black transition-colors hover:bg-blue-50"
            >
              Continue Today&apos;s Review
            </button>
          ) : (
            <button
              onClick={() => startSession("weakpoint")}
              className="bg-red-500 hover:bg-red-600 text-white rounded-2xl px-5 py-4 font-black transition-colors"
            >
              Review Weak Points
            </button>
          )}
          <button
            onClick={() => router.push(`/study/${langCode}`)}
            className="bg-white text-blue-700 rounded-2xl px-5 py-4 font-black transition-colors hover:bg-blue-50"
          >
            Back to Study Hub
          </button>
          <button
            onClick={() => setMode(null)}
            className="bg-white/15 border border-white/25 text-white rounded-2xl px-5 py-4 font-black transition-colors hover:bg-white/20"
          >
            Custom Study Modes
          </button>
        </div>
      </div>
    </div>
  );

  const currentWord = words[currentIndex];
  const progress = ((currentIndex + 1) / words.length) * 100;
  const frontText = currentWord.isReversed ? currentWord.translation : currentWord.word;
  const backText = currentWord.isReversed ? currentWord.word : currentWord.translation;
  const canAnswer = isFlipped && !isLoading;
  const modeLabel =
    mode === "review"
      ? "Daily Review"
      : mode === "learning"
        ? "Learning"
        : mode === "weakpoint"
          ? "Weak Point"
          : "Mastered";

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
          <button onClick={() => setMode(null)} className="text-gray-400 hover:text-gray-900 font-black flex items-center gap-2 uppercase text-[10px] tracking-widest">
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
            <p className="text-xl font-black text-gray-900">{currentIndex + 1} / {words.length}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              {mode === "review" ? "Remaining Today" : "Shortcuts"}
            </p>
            <p className="text-xs font-bold text-gray-500">
              {mode === "review" ? `${remainingDueCount} due ${remainingDueCount === 1 ? "card" : "cards"} left` : "Space flip • 1/2/3/4 grade"}
            </p>
          </div>
        </div>

        <div className="relative w-full max-w-md h-[420px] [perspective:1000px] mb-6 cursor-pointer" onClick={() => setIsFlipped(!isFlipped)}>
          <div className={`relative w-full h-full transition-transform duration-700 [transform-style:preserve-3d] ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}>
            
            {/* Front of Card */}
            <div className="absolute inset-0 bg-white border-4 border-blue-100 rounded-[2.5rem] shadow-2xl flex flex-col items-center justify-center p-8 [backface-visibility:hidden]">
              <button onClick={(e) => { e.stopPropagation(); speak(frontText, currentWord.isReversed); }} className="absolute top-6 right-6 w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center hover:bg-blue-50 transition-colors text-xl">🔊</button>
              <span className="absolute top-10 text-[10px] font-black text-gray-300 uppercase tracking-widest">
                {currentWord.isReversed ? "Translate" : "Question"}
              </span>
              <h2 className="text-4xl sm:text-5xl font-black text-gray-900 text-center leading-tight tracking-tight px-4 break-words w-full">{frontText}</h2>
              <p className="absolute bottom-10 text-blue-500 font-black text-[10px] uppercase tracking-widest">Tap or press Space to flip</p>
            </div>

            {/* Back of Card */}
            <div className="absolute inset-0 bg-blue-600 border-4 border-blue-300 rounded-[2.5rem] shadow-2xl flex flex-col items-center justify-center p-8 [backface-visibility:hidden] [transform:rotateY(180deg)] text-white text-center">
              <button onClick={(e) => { e.stopPropagation(); speak(backText, !currentWord.isReversed); }} className="absolute top-6 right-6 w-12 h-12 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors text-xl">🔊</button>
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

        <div className={`w-full max-w-md transition-all duration-500 ${canAnswer ? 'opacity-100 translate-y-0' : 'opacity-40 translate-y-2 pointer-events-none'}`}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button onClick={(e) => { e.stopPropagation(); handleResult(0); }} className="h-20 flex flex-col items-center justify-center bg-white border-2 border-red-100 text-red-500 rounded-2xl hover:bg-red-50 shadow-sm transition-colors">
              <span className="text-[10px] font-black uppercase tracking-widest">Again</span>
              <span className="text-[9px] font-bold opacity-60 mt-0.5">&lt; 10m • 1</span>
            </button>
            <button onClick={(e) => { e.stopPropagation(); handleResult(3); }} className="h-20 flex flex-col items-center justify-center bg-white border-2 border-orange-100 text-orange-500 rounded-2xl hover:bg-orange-50 shadow-sm transition-colors">
              <span className="text-[10px] font-black uppercase tracking-widest">Hard</span>
              <span className="text-[9px] font-bold opacity-60 mt-0.5">{calculateNextReview(3, currentWord).interval}d • 2</span>
            </button>
            <button onClick={(e) => { e.stopPropagation(); handleResult(4); }} className="h-20 flex flex-col items-center justify-center bg-green-500 text-white rounded-2xl hover:bg-green-600 shadow-md transition-colors">
              <span className="text-[10px] font-black uppercase tracking-widest">Good</span>
              <span className="text-[9px] font-bold opacity-80 mt-0.5">{calculateNextReview(4, currentWord).interval}d • 3</span>
            </button>
            <button onClick={(e) => { e.stopPropagation(); handleResult(5); }} className="h-20 flex flex-col items-center justify-center bg-blue-500 text-white rounded-2xl hover:bg-blue-600 shadow-md transition-colors">
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
