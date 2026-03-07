"use client";

import { useCallback } from "react";
import { useParams } from "next/navigation";
import AppHeader from "@/app/components/AppHeader";
import { AppMain, AppShell } from "@/app/components/layout/AppShell";
import { WordDetailEditForm, WordDetailView } from "./components";
import { useWordDetailData } from "./useWordDetailData";

export default function WordDetail() {
  const params = useParams();
  const wordId = params.id as string;

  const {
    currentRecord,
    siblingEntries,
    secondaryContext,
    isLoading,
    isEditing,
    isDeleting,
    errorMsg,
    isAskingAI,
    tempNuance,
    isAutoFilling,
    editForm,
    selL1,
    selL2,
    selL3,
    l1Options,
    l2Options,
    l3Options,
    handleChange,
    handleL1Change,
    handleL2Change,
    handleL3Change,
    startEditing,
    cancelEditing,
    handleAskNuance,
    handleAutoFill,
    handleUpdate,
    handleToggleRemembered,
    handleDelete,
  } = useWordDetailData(wordId);

  const speak = useCallback(
    (text: string) => {
      if (typeof window === "undefined" || !window.speechSynthesis) return;
      window.speechSynthesis.cancel();

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
      const languageCode = currentRecord?.language_code || "en";
      utterance.lang = langMap[languageCode] || "en-US";
      window.speechSynthesis.speak(utterance);
    },
    [currentRecord?.language_code]
  );

  if (isLoading) {
    return <div className="app-shell flex min-h-screen items-center justify-center font-bold text-gray-400">Loading...</div>;
  }

  if (!currentRecord) {
    return <div className="app-shell flex min-h-screen items-center justify-center font-bold">Word Not Found.</div>;
  }

  return (
    <AppShell className="pb-20">
      <AppHeader primarySection="library" backHref={`/study/${currentRecord.language_code}`} backLabel="Study Hub" />

      <AppMain width="xl" className="section-stack transition-all">
        {errorMsg && <div className="mb-6 rounded-2xl border-2 border-red-200 bg-red-50 p-4 font-bold text-red-600">{errorMsg}</div>}

        {isEditing ? (
          <WordDetailEditForm
            editForm={editForm}
            selL1={selL1}
            selL2={selL2}
            selL3={selL3}
            l1Options={l1Options}
            l2Options={l2Options}
            l3Options={l3Options}
            isAutoFilling={isAutoFilling}
            onChange={handleChange}
            onL1Change={handleL1Change}
            onL2Change={handleL2Change}
            onL3Change={handleL3Change}
            onAutoFill={handleAutoFill}
            onCancel={cancelEditing}
            onSave={handleUpdate}
          />
        ) : (
          <WordDetailView
            currentRecord={currentRecord}
            siblingEntries={siblingEntries}
            secondaryContext={secondaryContext}
            isDeleting={isDeleting}
            isAskingAI={isAskingAI}
            tempNuance={tempNuance}
            onSpeak={speak}
            onToggleRemembered={handleToggleRemembered}
            onStartEditing={startEditing}
            onDelete={handleDelete}
            onAskNuance={handleAskNuance}
          />
        )}
      </AppMain>
    </AppShell>
  );
}
