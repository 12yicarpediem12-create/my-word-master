"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { applyStudyResult } from "../../../actions/vocab";
import { getSupabaseBrowserClient } from "@/app/lib/supabase-browser";
import {
  calculateNextReview,
  getBackText,
  getCompletionMessage,
  getCompletionStateTitle,
  getDifficultAnswers,
  getEmptyStateDescription,
  getEmptyStateTitle,
  getFrontText,
  getModeLabel,
  getProgressPercent,
  getRecallScore,
  getReviewStatusText,
  getSessionQueryPlan,
  isEnglishAnswer,
  isEnglishPrompt,
  isStudyDirection,
  isStudyMode,
  prepareSessionWords,
  SESSION_WORD_COLUMNS,
} from "./helpers";
import type { ActiveStudyMode, SessionAnswer, SessionWord, SessionWordRecord, StudyDirection, StudyMode } from "./types";

const supabase = getSupabaseBrowserClient();

function speakText(text: string, langCode: string, isEnglish = false) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;

  window.speechSynthesis.cancel();
  window.speechSynthesis.resume();

  const utterance = new SpeechSynthesisUtterance(text);
  if (isEnglish) {
    utterance.lang = "en-US";
  } else {
    const langMap: Record<string, string> = {
      it: "it-IT",
      fr: "fr-FR",
      es: "es-ES",
      de: "de-DE",
      pt: "pt-PT",
      ja: "ja-JP",
      ko: "ko-KR",
      ru: "ru-RU",
      zh: "zh-CN",
    };
    utterance.lang = langMap[langCode] || `${langCode}-${langCode.toUpperCase()}`;
  }

  utterance.rate = 0.9;
  window.speechSynthesis.speak(utterance);
}

export function useStudySessionData({
  langCode,
  requestedMode,
  requestedDirection,
}: {
  langCode: string;
  requestedMode: string | null;
  requestedDirection: string | null;
}) {
  const autoStartedRef = useRef(false);

  const [mode, setMode] = useState<StudyMode>(null);
  const [direction, setDirection] = useState<StudyDirection>("recognition");
  const [words, setWords] = useState<SessionWord[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [sessionAnswers, setSessionAnswers] = useState<SessionAnswer[]>([]);
  const [reviewQueueTotal, setReviewQueueTotal] = useState(0);
  const [remainingDueCount, setRemainingDueCount] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const speak = useCallback(
    (text: string, isEnglish = false) => {
      speakText(text, langCode, isEnglish);
    },
    [langCode]
  );

  const speakWordSide = useCallback(
    (word: SessionWord, useFrontSide: boolean) => {
      const text = useFrontSide ? getFrontText(word) : getBackText(word);
      const shouldUseEnglish = useFrontSide ? isEnglishPrompt(word.isReversed) : isEnglishAnswer(word.isReversed);
      speak(text, shouldUseEnglish);
    },
    [speak]
  );

  const resetSessionState = useCallback(() => {
    setIsLoading(true);
    setErrorMsg(null);
    setIsFinished(false);
    setCurrentIndex(0);
    setIsFlipped(false);
    setSessionAnswers([]);
    setReviewQueueTotal(0);
    setRemainingDueCount(0);
  }, []);

  const startSession = useCallback(
    async (selectedMode: ActiveStudyMode, selectedDirection?: StudyDirection) => {
      const effectiveDirection = selectedDirection || direction;
      const nowIso = new Date().toISOString();
      const plan = getSessionQueryPlan(selectedMode, nowIso);

      setMode(selectedMode);
      if (selectedDirection) setDirection(selectedDirection);
      resetSessionState();

      let query = supabase.from("vocab").select(SESSION_WORD_COLUMNS).eq("language_code", langCode);

      if (plan.rememberedFilter !== null) {
        query = query.eq("is_remembered", plan.rememberedFilter);
      }
      if (plan.reviewFilter) {
        query = query.or(plan.reviewFilter);
      }
      if (selectedMode === "weakpoint" || plan.orderByMistakeCount) {
        query = query.gt("mistake_count", 0).order("mistake_count", { ascending: false });
      }

      if (selectedMode === "review" && plan.reviewFilter) {
        const { count, error: countError } = await supabase
          .from("vocab")
          .select("id", { count: "exact", head: true })
          .eq("language_code", langCode)
          .or(plan.reviewFilter);

        if (countError) {
          setErrorMsg(countError.message);
          setWords([]);
          setIsLoading(false);
          return;
        }

        const totalDue = count ?? 0;
        setReviewQueueTotal(totalDue);
        setRemainingDueCount(totalDue);
      }

      const { data, error } = await query.limit(15);
      if (error) {
        setErrorMsg(error.message);
        setWords([]);
        setIsLoading(false);
        return;
      }

      if (data && data.length > 0) {
        const preparedWords = prepareSessionWords((data || []) as SessionWordRecord[], effectiveDirection);
        setWords(preparedWords);
        setTimeout(() => speakWordSide(preparedWords[0], true), 500);
      } else {
        setWords([]);
      }

      setIsLoading(false);
    },
    [direction, langCode, resetSessionState, speakWordSide]
  );

  const currentWord = words[currentIndex] || null;

  const handleResult = useCallback(
    async (quality: number) => {
      if (!currentWord || !mode) return;

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
        const nextIndex = currentIndex + 1;
        const nextWord = words[nextIndex];
        setIsFlipped(false);
        setCurrentIndex(nextIndex);
        setTimeout(() => speakWordSide(nextWord, true), 300);
      } else {
        setIsFinished(true);
      }
    },
    [currentIndex, currentWord, mode, speakWordSide, words]
  );

  useEffect(() => {
    if (!isFlipped || !currentWord) return;
    speakWordSide(currentWord, false);
  }, [currentWord, isFlipped, speakWordSide]);

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
  }, [handleResult, isFinished, isFlipped, isLoading, mode, words.length]);

  useEffect(() => {
    if (autoStartedRef.current) return;
    if (!isStudyMode(requestedMode)) return;

    autoStartedRef.current = true;
    startSession(requestedMode, isStudyDirection(requestedDirection) ? requestedDirection : "recognition");
  }, [requestedDirection, requestedMode, startSession]);

  const openStudyModes = useCallback(() => {
    setMode(null);
  }, []);

  const progress = useMemo(() => getProgressPercent(currentIndex, words.length), [currentIndex, words.length]);
  const frontText = useMemo(() => (currentWord ? getFrontText(currentWord) : ""), [currentWord]);
  const backText = useMemo(() => (currentWord ? getBackText(currentWord) : ""), [currentWord]);
  const canAnswer = isFlipped && !isLoading;
  const modeLabel = useMemo(() => (mode ? getModeLabel(mode) : ""), [mode]);
  const completionMessage = useMemo(() => (mode ? getCompletionMessage(mode, remainingDueCount, sessionAnswers) : ""), [mode, remainingDueCount, sessionAnswers]);
  const completionTitle = useMemo(() => (mode ? getCompletionStateTitle(mode, remainingDueCount) : ""), [mode, remainingDueCount]);
  const recallScore = useMemo(() => getRecallScore(sessionAnswers), [sessionAnswers]);
  const difficultAnswers = useMemo(() => getDifficultAnswers(sessionAnswers), [sessionAnswers]);
  const emptyStateTitle = useMemo(() => (mode ? getEmptyStateTitle(mode) : ""), [mode]);
  const emptyStateDescription = useMemo(() => (mode ? getEmptyStateDescription(mode) : ""), [mode]);
  const reviewStatusText = useMemo(() => (mode ? getReviewStatusText(mode, remainingDueCount) : ""), [mode, remainingDueCount]);

  return {
    mode,
    direction,
    isLoading,
    isFinished,
    errorMsg,
    words,
    currentWord,
    currentIndex,
    isFlipped,
    reviewQueueTotal,
    remainingDueCount,
    sessionAnswers,
    progress,
    frontText,
    backText,
    canAnswer,
    modeLabel,
    completionMessage,
    completionTitle,
    recallScore,
    difficultAnswers,
    emptyStateTitle,
    emptyStateDescription,
    reviewStatusText,
    setDirection,
    startSession,
    openStudyModes,
    flipCard: () => setIsFlipped((prev) => !prev),
    handleResult,
    speakCurrentFront: () => currentWord && speakWordSide(currentWord, true),
    speakCurrentBack: () => currentWord && speakWordSide(currentWord, false),
    continueReview: (selectedDirection: StudyDirection) => startSession("review", selectedDirection),
    reviewWeakPoints: () => startSession("weakpoint"),
  };
}
