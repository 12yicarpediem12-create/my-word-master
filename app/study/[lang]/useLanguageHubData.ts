"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { getHabitNudge, summarizeActivity } from "../../lib/activity-summary";
import type { Language, VocabItem } from "@/app/lib/types";
import type { PosStat } from "./components";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

function getPartOfSpeechTags(partOfSpeech: string | null) {
  if (!partOfSpeech) return [];
  return partOfSpeech
    .split(/[\/,]/)
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function matchesPartOfSpeech(partOfSpeech: string | null, filter: string) {
  if (filter === "All") return true;
  return getPartOfSpeechTags(partOfSpeech).includes(filter);
}

function buildPosStats(dynamicPosList: string[], vocabList: VocabItem[]): PosStat[] {
  return dynamicPosList.map((pos) => {
    const posVocab = vocabList.filter((vocab) => matchesPartOfSpeech(vocab.part_of_speech, pos));
    const mastered = posVocab.filter((vocab) => vocab.is_remembered).length;
    const total = posVocab.length;

    return {
      name: pos,
      mastered,
      total,
      percentage: total === 0 ? 0 : Math.round((mastered / total) * 100),
    };
  });
}

export function useLanguageHubData(langCode: string, activeFilter: string) {
  const [language, setLanguage] = useState<Language | null>(null);
  const [vocabList, setVocabList] = useState<VocabItem[]>([]);
  const [randomWord, setRandomWord] = useState<VocabItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      setErrorMsg(null);

      const { data: langData, error: langError } = await supabase.from("languages").select("*").eq("code", langCode).single();
      if (langError || !langData) {
        setLanguage(null);
        setVocabList([]);
        setRandomWord(null);
        setErrorMsg(langError?.message || "Language not found.");
        setIsLoading(false);
        return;
      }
      setLanguage(langData as Language);

      const { data: vocabData, error: vocabError } = await supabase
        .from("vocab")
        .select("id, language_code, word, translation, part_of_speech, gender, verb_type, is_remembered, created_at, last_reviewed, next_review_date, mistake_count")
        .eq("language_code", langCode)
        .order("created_at", { ascending: false });

      if (vocabError) {
        setVocabList([]);
        setRandomWord(null);
        setErrorMsg(vocabError.message);
        setIsLoading(false);
        return;
      }

      const loaded = (vocabData || []) as VocabItem[];
      setVocabList(loaded);
      setRandomWord(loaded.length > 0 ? loaded[Math.floor(Math.random() * loaded.length)] : null);
      setIsLoading(false);
    }

    if (langCode) fetchData();
  }, [langCode]);

  const dynamicPosList = useMemo(() => {
    const posSet = new Set<string>();
    vocabList.forEach((v) => {
      getPartOfSpeechTags(v.part_of_speech).forEach((tag) => posSet.add(tag));
    });
    return Array.from(posSet).sort();
  }, [vocabList]);

  const posStats = useMemo<PosStat[]>(() => buildPosStats(dynamicPosList, vocabList), [dynamicPosList, vocabList]);

  const filteredList = useMemo(() => {
    return vocabList.filter((vocab) => matchesPartOfSpeech(vocab.part_of_speech, activeFilter));
  }, [activeFilter, vocabList]);

  const totalWords = vocabList.length;
  const masteredWords = vocabList.filter((v) => v.is_remembered).length;
  const globalPercentage = totalWords === 0 ? 0 : Math.round((masteredWords / totalWords) * 100);
  const weakWordsCount = vocabList.filter((v) => (v.mistake_count || 0) > 0).length;
  const activitySummary = summarizeActivity(vocabList);
  const habitNudge = getHabitNudge(activitySummary, totalWords);
  const quickRecoverySize =
    activitySummary.overdueCount > 0 ? Math.min(activitySummary.overdueCount, 10) : Math.min(Math.max(activitySummary.dueTodayCount, 1), 10);
  const doneForToday = activitySummary.doneToday;

  const removeVocabByIds = (ids: string[]) => {
    setVocabList((prev) => {
      const next = prev.filter((item) => !ids.includes(item.id));
      setRandomWord((current) => {
        if (!current || ids.includes(current.id)) {
          return next.length > 0 ? next[Math.floor(Math.random() * next.length)] : null;
        }
        return current;
      });
      return next;
    });
  };

  return {
    language,
    vocabList,
    randomWord,
    isLoading,
    errorMsg,
    setErrorMsg,
    dynamicPosList,
    posStats,
    filteredList,
    totalWords,
    masteredWords,
    globalPercentage,
    weakWordsCount,
    activitySummary,
    habitNudge,
    quickRecoverySize,
    doneForToday,
    removeVocabByIds,
  };
}
