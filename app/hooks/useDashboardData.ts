"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/app/lib/supabase-browser";
import { summarizeActivity } from "@/app/lib/activity-summary";
import type { DashboardActivityMeta, DashboardVocabStat } from "@/app/lib/dashboard";
import type { HeatmapValue, Language, VocabItem } from "@/app/lib/types";

const supabase = getSupabaseBrowserClient();

function buildLanguageVocabMap(vocab: VocabItem[]) {
  return vocab.reduce<Record<string, VocabItem[]>>((acc, item) => {
    if (!acc[item.language_code]) acc[item.language_code] = [];
    acc[item.language_code].push(item);
    return acc;
  }, {});
}

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

function getLatestActivityTime(language: Language, vocab: VocabItem[]) {
  return vocab.reduce((max, item) => {
    const dateStr = item.last_reviewed || item.created_at;
    const time = dateStr ? new Date(dateStr).getTime() : 0;
    return time > max ? time : max;
  }, (language.created_at ? new Date(language.created_at).getTime() : 0));
}

function sortLanguagesByRecentActivity(languages: Language[], vocabByLanguage: Record<string, VocabItem[]>) {
  return [...languages].sort((a, b) => {
    const aLatest = getLatestActivityTime(a, vocabByLanguage[a.code] || []);
    const bLatest = getLatestActivityTime(b, vocabByLanguage[b.code] || []);
    return bLatest - aLatest;
  });
}

function buildVocabStats(languages: Language[], vocabByLanguage: Record<string, VocabItem[]>): DashboardVocabStat[] {
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
      percentage: total === 0 ? 0 : Math.round((remembered / total) * 100),
    };
  });
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
        supabase.from("vocab").select("id, language_code, is_remembered, created_at, last_reviewed, next_review_date"),
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
      setVocabStats(buildVocabStats(sortedLangs, vocabByLanguage));
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
