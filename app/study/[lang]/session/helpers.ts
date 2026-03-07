import type { ActiveStudyMode, SessionAnswer, SessionWord, SessionWordRecord, StudyDirection } from "./types";

export const SESSION_WORD_COLUMNS =
  "id, word, translation, example_sentence, is_remembered, mistake_count, repetition, efactor, interval, next_review_date";

export function isStudyMode(value: string | null): value is ActiveStudyMode {
  return value === "learning" || value === "review" || value === "mastered" || value === "weakpoint";
}

export function isStudyDirection(value: string | null): value is StudyDirection {
  return value === "recognition" || value === "production" || value === "chaos";
}

export function getSessionQueryPlan(mode: ActiveStudyMode, nowIso: string) {
  if (mode === "review") {
    return {
      reviewFilter: `next_review_date.lte.${nowIso},next_review_date.is.null`,
      rememberedFilter: null,
      orderByMistakeCount: false,
    };
  }

  if (mode === "learning") {
    return {
      reviewFilter: null,
      rememberedFilter: false,
      orderByMistakeCount: false,
    };
  }

  if (mode === "mastered") {
    return {
      reviewFilter: null,
      rememberedFilter: true,
      orderByMistakeCount: false,
    };
  }

  return {
    reviewFilter: null,
    rememberedFilter: null,
    orderByMistakeCount: true,
  };
}

export function prepareSessionWords(words: SessionWordRecord[], direction: StudyDirection): SessionWord[] {
  return [...words]
    .sort(() => Math.random() - 0.5)
    .map((word) => ({
      ...word,
      isReversed: direction === "production" ? true : direction === "chaos" ? Math.random() > 0.5 : false,
      repetition: word.repetition || 0,
      efactor: word.efactor || 2.5,
      interval: word.interval || 0,
      mistake_count: word.mistake_count || 0,
    }));
}

export function calculateNextReview(quality: number, currentWord: Pick<SessionWord, "repetition" | "efactor" | "interval" | "mistake_count">) {
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
}

export function getModeLabel(mode: ActiveStudyMode) {
  if (mode === "review") return "Daily Review";
  if (mode === "learning") return "Learning";
  if (mode === "weakpoint") return "Weak Point";
  return "Mastered";
}

export function getEmptyStateTitle(mode: ActiveStudyMode) {
  return mode === "review" ? "No cards due right now. ✨" : "All caught up! 🏜️";
}

export function getEmptyStateDescription(mode: ActiveStudyMode) {
  return mode === "review"
    ? "Today's review queue is empty. You can open custom study modes or head back to your study hub."
    : "This mode has no cards available right now. Try another session type.";
}

export function getCompletionMessage(mode: ActiveStudyMode, remainingDueCount: number, sessionAnswers: SessionAnswer[]) {
  if (mode === "review" && remainingDueCount === 0) {
    return "Today’s due review is finished. You are clear for now.";
  }

  if (mode === "review" && remainingDueCount > 0) {
    return `${remainingDueCount} due ${remainingDueCount === 1 ? "card remains" : "cards remain"} if you want to finish today’s queue.`;
  }

  const reviewed = sessionAnswers.length;
  if (!reviewed) return "Nice work finishing your session.";

  const strong = sessionAnswers.filter((answer) => answer.quality >= 4).length;
  const score = Math.round((strong / reviewed) * 100);

  if (score >= 80) return "Great recall today. Keep the streak going.";
  if (score >= 60) return "Solid progress. A quick weak-point pass will help.";
  return "Good effort. Focus weak cards next for faster gains.";
}

export function getRecallScore(sessionAnswers: SessionAnswer[]) {
  if (sessionAnswers.length === 0) return 0;
  return Math.round((sessionAnswers.filter((answer) => answer.quality >= 4).length / sessionAnswers.length) * 100);
}

export function getDifficultAnswers(sessionAnswers: SessionAnswer[]) {
  return sessionAnswers.filter((answer) => answer.quality <= 3);
}

export function getProgressPercent(currentIndex: number, totalWords: number) {
  if (totalWords === 0) return 0;
  return ((currentIndex + 1) / totalWords) * 100;
}

export function getReviewStatusText(mode: ActiveStudyMode, remainingDueCount: number) {
  if (mode === "review") {
    return `${remainingDueCount} due ${remainingDueCount === 1 ? "card" : "cards"} left`;
  }

  return "Space flip • 1/2/3/4 grade";
}

export function getFrontText(word: SessionWord) {
  return word.isReversed ? word.translation : word.word;
}

export function getBackText(word: SessionWord) {
  return word.isReversed ? word.word : word.translation;
}

export function isEnglishPrompt(isReversed: boolean) {
  return isReversed;
}

export function isEnglishAnswer(isReversed: boolean) {
  return !isReversed;
}

export function getCompletionStateTitle(mode: ActiveStudyMode, remainingDueCount: number) {
  return mode === "review" && remainingDueCount === 0 ? "Done for Today" : "Session Complete";
}
