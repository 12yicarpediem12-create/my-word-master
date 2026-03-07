"use client";

import { useCallback } from "react";
import { useParams } from "next/navigation";
import AppHeader from "@/app/components/AppHeader";
import { WordDetailEditForm, WordDetailView } from "./components";
import { useWordDetailData } from "./useWordDetailData";

export default function WordDetail() {
  const params = useParams();
  const wordId = params.id as string;

  const {
    vocab,
    relatedWords,
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
    mainTopicName,
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
      const languageCode = vocab?.language_code || "en";
      utterance.lang = langMap[languageCode] || "en-US";
      window.speechSynthesis.speak(utterance);
    },
    [vocab?.language_code]
  );

  if (isLoading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center font-bold text-gray-400">Loading...</div>;
  }

  if (!vocab) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center font-bold">Word Not Found.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans pb-20">
      <AppHeader primarySection="library" backHref={`/study/${vocab.language_code}`} backLabel="Study Hub" />

      <main className="max-w-2xl lg:max-w-4xl mx-auto px-4 sm:px-6 py-8 lg:py-12 transition-all">
        <div className="bg-white rounded-[2.5rem] p-6 sm:p-10 lg:p-14 border-2 border-gray-200 shadow-lg relative overflow-hidden transition-all">
          {errorMsg && <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 text-red-600 font-bold rounded-2xl">{errorMsg}</div>}

          <div className="absolute top-0 right-0 bg-blue-50 text-blue-600 font-black uppercase tracking-widest px-6 py-3 border-b-2 border-l-2 border-blue-100 text-[10px]">
            {vocab.language_code}
          </div>

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
              vocab={vocab}
              relatedWords={relatedWords}
              isDeleting={isDeleting}
              isAskingAI={isAskingAI}
              tempNuance={tempNuance}
              mainTopicName={mainTopicName}
              onSpeak={speak}
              onToggleRemembered={handleToggleRemembered}
              onStartEditing={startEditing}
              onDelete={handleDelete}
              onAskNuance={handleAskNuance}
            />
          )}
        </div>
      </main>
    </div>
  );
}
