export type StudyMode = "learning" | "review" | "mastered" | "weakpoint" | null;

export type ActiveStudyMode = Exclude<StudyMode, null>;

export type StudyDirection = "recognition" | "production" | "chaos";

export type SessionAnswer = {
  id: string;
  word: string;
  translation: string;
  quality: number;
};

export type SessionWordRecord = {
  id: string;
  word: string;
  translation: string;
  example_sentence: string | null;
  is_remembered: boolean;
  mistake_count: number | null;
  repetition: number | null;
  efactor: number | null;
  interval: number | null;
  next_review_date: string | null;
};

export type SessionWord = SessionWordRecord & {
  isReversed: boolean;
  mistake_count: number;
  repetition: number;
  efactor: number;
  interval: number;
};

export type ReviewStats = {
  repetition: number;
  efactor: number;
  interval: number;
  mistake_count: number;
};
