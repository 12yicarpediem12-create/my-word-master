"use client";

import { useCallback, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import SearchBar from "../../components/SearchBar";
import AppHeader from "../../components/AppHeader";
import {
  LanguageHabitPanel,
  LanguageHubHero,
  NavCard,
  ProgressBar,
  RandomFlashbackCard,
  SelectionActionBar,
  StatCircle,
  VocabFilterToolbar,
  VocabListSection,
} from "./components";
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
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center font-bold text-gray-400 tracking-widest uppercase">Loading Hub...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans pb-32 overflow-x-hidden relative">
      <AppHeader primarySection="study" searchSlot={<SearchBar forcedLang={langCode} />} backHref="/" backLabel="Dashboard" />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        {errorMsg && (
          <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 text-red-600 font-bold rounded-2xl">
            {errorMsg}
          </div>
        )}

        <LanguageHubHero
          language={language}
          weakWordsCount={weakWordsCount}
          totalWords={totalWords}
          doneForToday={doneForToday}
          onStartReview={handleStartReview}
          onStartWeakPointReview={handleStartWeakPointReview}
        />

        <LanguageHabitPanel
          activitySummary={activitySummary}
          habitNudge={habitNudge}
          quickRecoverySize={quickRecoverySize}
          totalWords={totalWords}
          onStartReview={handleStartReview}
        />

        <div className="mb-8 flex justify-end">
          <Link
            href={`/study/${langCode}/session`}
            className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-blue-600 transition-colors"
          >
            Open custom study modes
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <NavCard href={`/study/${langCode}/topics`} icon="🗂️" subtitle="Taxonomy" title="Browse by Topic" iconBg="bg-blue-50" />
          <NavCard href="/history" icon="⏳" subtitle="Activity" title="Review History" iconBg="bg-gray-50" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <StatCircle percentage={globalPercentage} mastered={masteredWords} total={totalWords} />
          <div className="lg:col-span-2 bg-white rounded-3xl p-8 border-2 border-gray-200 shadow-sm h-full flex flex-col justify-center">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6 text-center sm:text-left">Mastery by Category</h3>
            <div className="space-y-5">
              {posStats.map((stat) => (
                <ProgressBar key={stat.name} stat={stat} />
              ))}
            </div>
          </div>
        </div>

        <RandomFlashbackCard randomWord={randomWord} onSpeak={speak} />

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
      </main>

      <SelectionActionBar selectedCount={selectedIds.length} isDeleting={isDeleting} onDelete={handleBulkDelete} />
    </div>
  );
}
