import type { Language, VocabItem } from "./types";

export type DashboardVocabStat = Language & {
  total: number;
  remembered: number;
  learning: number;
  dueToday: number;
  weakWords: number;
  percentage: number;
};

export type DashboardActivityMeta = {
  activeToday: boolean;
  activeYesterday: boolean;
  activeDays: number;
};

export function buildLanguageVocabMap(vocab: VocabItem[]) {
  return vocab.reduce<Record<string, VocabItem[]>>((acc, item) => {
    if (!acc[item.language_code]) acc[item.language_code] = [];
    acc[item.language_code].push(item);
    return acc;
  }, {});
}

export function getLatestActivityTime(language: Language, vocab: VocabItem[]) {
  return vocab.reduce((max, item) => {
    const dateStr = item.last_reviewed || item.created_at;
    const time = dateStr ? new Date(dateStr).getTime() : 0;
    return time > max ? time : max;
  }, (language.created_at ? new Date(language.created_at).getTime() : 0));
}

export function sortLanguagesByRecentActivity(
  languages: Language[],
  vocabByLanguage: Record<string, VocabItem[]>
) {
  return [...languages].sort((a, b) => {
    const aLatest = getLatestActivityTime(a, vocabByLanguage[a.code] || []);
    const bLatest = getLatestActivityTime(b, vocabByLanguage[b.code] || []);
    return bLatest - aLatest;
  });
}

export function buildDashboardVocabStats(
  languages: Language[],
  vocabByLanguage: Record<string, VocabItem[]>
): DashboardVocabStat[] {
  const today = new Date().toISOString().split("T")[0];

  return languages.map((lang) => {
    const langVocab = vocabByLanguage[lang.code] || [];
    const total = langVocab.length;
    const remembered = langVocab.filter((item) => item.is_remembered).length;
    const dueToday = langVocab.filter((item) => {
      if (!item.next_review_date) return false;
      return item.next_review_date.split("T")[0] <= today;
    }).length;

    return {
      ...lang,
      total,
      remembered,
      learning: Math.max(total - remembered, 0),
      dueToday,
      weakWords: langVocab.filter((item) => (item.mistake_count || 0) > 0 && !item.is_remembered).length,
      percentage: total === 0 ? 0 : Math.round((remembered / total) * 100),
    };
  });
}
