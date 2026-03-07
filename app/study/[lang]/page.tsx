"use client";

import { useCallback, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import SearchBar from "../../components/SearchBar";
import AppHeader from "../../components/AppHeader";
import { AppMain, AppShell } from "../../components/layout/AppShell";
import { NavCard } from "./primitives";
import {
  LanguageHabitPanel,
  LanguageHubHero,
  LanguageProgressPanel,
  RandomFlashbackCard,
  SelectionActionBar,
  VocabFilterToolbar,
  VocabListSection,
} from "./sections";
import { bulkDeleteVocab } from "../../actions/vocab";
import { useLanguageHubData } from "./useLanguageHubData";

export default function LanguageHub() {
  const params = useParams();
  const router = useRouter();
  const langCode = params.lang as string;

  const [activeFilter, setActiveFilter] = useState("All");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    language,
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
  } = useLanguageHubData(langCode, activeFilter);

  const speak = useCallback(
    (text: string) => {
      if (typeof window === "undefined" || !window.speechSynthesis) return;
      window.speechSynthesis.cancel();
      window.speechSynthesis.resume();

      const utterance = new SpeechSynthesisUtterance(text);
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
        en: "en-US",
      };
      utterance.lang = langMap[langCode] || `${langCode}-${langCode.toUpperCase()}`;
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    },
    [langCode]
  );

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  }, []);

  const handleStartReview = useCallback(() => {
    router.push(doneForToday ? `/study/${langCode}/session` : `/study/${langCode}/session?mode=review&direction=recognition`);
  }, [doneForToday, langCode, router]);

  const handleStartWeakPointReview = useCallback(() => {
    router.push(`/study/${langCode}/session?mode=weakpoint&direction=recognition`);
  }, [langCode, router]);

  const handleSelectAll = useCallback(() => {
    if (selectedIds.length === filteredList.length) {
      setSelectedIds([]);
      return;
    }

    setSelectedIds(filteredList.map((vocab) => vocab.id));
  }, [filteredList, selectedIds.length]);

  const handleBulkDelete = useCallback(async () => {
    if (!window.confirm(`Are you sure you want to delete ${selectedIds.length} words? This action cannot be undone.`)) return;

    setIsDeleting(true);
    setErrorMsg(null);
    const { error } = await bulkDeleteVocab(selectedIds);

    if (!error) {
      removeVocabByIds(selectedIds);
      setSelectedIds([]);
    } else {
      setErrorMsg(`Delete failed: ${error}`);
    }

    setIsDeleting(false);
  }, [removeVocabByIds, selectedIds, setErrorMsg]);

  if (isLoading) {
    return <div className="app-shell flex min-h-screen items-center justify-center font-bold text-gray-400 tracking-widest uppercase">Loading Hub...</div>;
  }

  return (
    <AppShell className="pb-32 overflow-x-hidden relative">
      <AppHeader primarySection="study" searchSlot={<SearchBar forcedLang={langCode} />} backHref="/study" backLabel="Study Home" />

      <AppMain width="xl" className="section-stack">
        {errorMsg && (
          <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 text-red-600 font-bold rounded-2xl">
            {errorMsg}
          </div>
        )}

        <LanguageHubHero
          language={language}
          activitySummary={activitySummary}
          globalPercentage={globalPercentage}
          weakWordsCount={weakWordsCount}
          totalWords={totalWords}
          doneForToday={doneForToday}
          onStartReview={handleStartReview}
          onStartWeakPointReview={handleStartWeakPointReview}
          onOpenCustomModes={() => router.push(`/study/${langCode}/session`)}
        />

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_22rem]">
          <div className="space-y-6">
            <LanguageHabitPanel
              activitySummary={activitySummary}
              habitNudge={habitNudge}
              quickRecoverySize={quickRecoverySize}
              totalWords={totalWords}
              onStartReview={handleStartReview}
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <NavCard href={`/study/${langCode}/topics`} icon="🗂️" subtitle="Taxonomy" title="Browse by Topic" iconBg="bg-blue-50" />
              <NavCard href="/history" icon="⏳" subtitle="Activity" title="Review History" iconBg="bg-slate-100" />
            </div>
          </div>

          <div className="space-y-6">
            <LanguageProgressPanel
              totalWords={totalWords}
              masteredWords={masteredWords}
              globalPercentage={globalPercentage}
              weakWordsCount={weakWordsCount}
              dueTodayCount={activitySummary.dueTodayCount}
              posStats={posStats}
            />
            <RandomFlashbackCard randomWord={randomWord} onSpeak={speak} />
          </div>
        </section>

        <section className="section-stack">
          <VocabFilterToolbar
            activeFilter={activeFilter}
            dynamicPosList={dynamicPosList}
            filteredCount={filteredList.length}
            selectedCount={selectedIds.length}
            allSelected={filteredList.length > 0 && selectedIds.length === filteredList.length}
            onFilterChange={setActiveFilter}
            onToggleSelectAll={handleSelectAll}
            onClearSelection={() => setSelectedIds([])}
          />

          <VocabListSection
            vocabList={filteredList}
            activeFilter={activeFilter}
            selectedIds={selectedIds}
            onToggleSelection={toggleSelection}
            onSpeak={speak}
          />
        </section>
      </AppMain>

      <SelectionActionBar selectedCount={selectedIds.length} isDeleting={isDeleting} onDelete={handleBulkDelete} />
    </AppShell>
  );
}
