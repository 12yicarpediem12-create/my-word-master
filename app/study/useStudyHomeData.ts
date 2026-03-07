"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/app/lib/supabase-browser";
import {
  buildDashboardVocabStats,
  buildLanguageVocabMap,
  sortLanguagesByRecentActivity,
  type DashboardVocabStat,
} from "@/app/lib/dashboard";
import type { Language, VocabItem } from "@/app/lib/types";

const supabase = getSupabaseBrowserClient();

export function useStudyHomeData() {
  const [vocabStats, setVocabStats] = useState<DashboardVocabStat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadStudyHome() {
      setIsLoading(true);
      setErrorMsg(null);

      const [{ data: langs, error: langsError }, { data: vocab, error: vocabError }] = await Promise.all([
        supabase.from("languages").select("*"),
        supabase
          .from("vocab")
          .select("id, language_code, is_remembered, created_at, last_reviewed, next_review_date, mistake_count"),
      ]);

      if (langsError || vocabError) {
        setErrorMsg(langsError?.message || vocabError?.message || "Failed to load study home.");
        setVocabStats([]);
        setIsLoading(false);
        return;
      }

      const loadedLanguages = (langs || []) as Language[];
      const loadedVocab = (vocab || []) as VocabItem[];
      const vocabByLanguage = buildLanguageVocabMap(loadedVocab);
      const sortedLanguages = sortLanguagesByRecentActivity(loadedLanguages, vocabByLanguage);
      setVocabStats(buildDashboardVocabStats(sortedLanguages, vocabByLanguage));
      setIsLoading(false);
    }

    loadStudyHome();
  }, []);

  const activeLanguageStats = useMemo(
    () => vocabStats.filter((stat) => stat.total > 0),
    [vocabStats]
  );

  const displayedStats = activeLanguageStats.length > 0 ? activeLanguageStats : vocabStats;
  const recentLanguage = displayedStats[0];
  const totalDue = displayedStats.reduce((sum, stat) => sum + stat.dueToday, 0);
  const totalWeak = displayedStats.reduce((sum, stat) => sum + stat.weakWords, 0);

  return {
    vocabStats: displayedStats,
    recentLanguage,
    totalDue,
    totalWeak,
    isLoading,
    errorMsg,
  };
}
