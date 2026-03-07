"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/app/lib/supabase-browser";
import { summarizeActivity } from "@/app/lib/activity-summary";
import {
  buildDashboardVocabStats,
  buildLanguageVocabMap,
  sortLanguagesByRecentActivity,
  type DashboardActivityMeta,
  type DashboardVocabStat,
} from "@/app/lib/dashboard";
import type { HeatmapValue, Language, VocabItem } from "@/app/lib/types";

const supabase = getSupabaseBrowserClient();

function buildHeatmapValues(vocab: VocabItem[]) {
  const counts = vocab.reduce<Record<string, number>>((acc, word) => {
    const dateStr = word.last_reviewed || word.created_at;
    if (!dateStr) return acc;

    const date = dateStr.split("T")[0];
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {});

  return Object.keys(counts).map((date) => ({
    date,
    count: counts[date],
  }));
}

export function useDashboardData() {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [totalWords, setTotalWords] = useState(0);
  const [dueTodayCount, setDueTodayCount] = useState(0);
  const [overdueCount, setOverdueCount] = useState(0);
  const [vocabStats, setVocabStats] = useState<DashboardVocabStat[]>([]);
  const [heatmapValues, setHeatmapValues] = useState<HeatmapValue[]>([]);
  const [streak, setStreak] = useState(0);
  const [lastActivityLabel, setLastActivityLabel] = useState<string | null>(null);
  const [activityMeta, setActivityMeta] = useState<DashboardActivityMeta>({ activeToday: false, activeYesterday: false, activeDays: 0 });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboard() {
      setErrorMsg(null);
      const [{ data: langs, error: langsError }, { data: allVocab, error: vocabError }] = await Promise.all([
        supabase.from("languages").select("*"),
        supabase.from("vocab").select("id, language_code, is_remembered, created_at, last_reviewed, next_review_date, mistake_count"),
      ]);

      if (langsError || vocabError) {
        setErrorMsg(langsError?.message || vocabError?.message || "Failed to load dashboard data.");
        setLanguages([]);
        setVocabStats([]);
        setHeatmapValues([]);
        setTotalWords(0);
        setDueTodayCount(0);
        setOverdueCount(0);
        setLastActivityLabel(null);
        setStreak(0);
        setActivityMeta({ activeToday: false, activeYesterday: false, activeDays: 0 });
        return;
      }

      const loadedLangs = (langs || []) as Language[];
      const loadedVocab = (allVocab || []) as VocabItem[];
      const vocabByLanguage = buildLanguageVocabMap(loadedVocab);
      setTotalWords(loadedVocab.length);

      const activitySummary = summarizeActivity(loadedVocab);
      setDueTodayCount(activitySummary.dueTodayCount);
      setOverdueCount(activitySummary.overdueCount);
      setLastActivityLabel(activitySummary.lastActivityLabel);
      setStreak(activitySummary.streak);
      setActivityMeta({
        activeToday: activitySummary.activeToday,
        activeYesterday: activitySummary.activeYesterday,
        activeDays: activitySummary.activeDays,
      });

      setHeatmapValues(buildHeatmapValues(loadedVocab));

      const sortedLangs = sortLanguagesByRecentActivity(loadedLangs, vocabByLanguage);

      setLanguages(sortedLangs);
      setVocabStats(buildDashboardVocabStats(sortedLangs, vocabByLanguage));
    }

    loadDashboard();
  }, []);

  return {
    languages,
    totalWords,
    dueTodayCount,
    overdueCount,
    vocabStats,
    heatmapValues,
    streak,
    lastActivityLabel,
    activityMeta,
    errorMsg,
  };
}
