import type { Language } from "./types";

export type DashboardVocabStat = Language & {
  total: number;
  remembered: number;
  percentage: number;
};

export type DashboardActivityMeta = {
  activeToday: boolean;
  activeYesterday: boolean;
  activeDays: number;
};
