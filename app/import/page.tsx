"use client";

import AppHeader from "../components/AppHeader";
import {
  ImportDonePanel,
  ImportProgressPanel,
  ImportReviewPanel,
  ImportUploadPanel,
} from "./phase-panels";
import { useImportWorkflow } from "./useImportWorkflow";

export default function ImportPage() {
  const {
    languages,
    selectedLang,
    setSelectedLang,
    phase,
    setPhase,
    parsedData,
    analyzedData,
    fileName,
    progress,
    logs,
    errorMsg,
    handleFileUpload,
    handleAnalyzeData,
    handleEditChange,
    handleRemoveFromReview,
    handleSaveToDatabase,
    percentComplete,
    skippedCount,
    failedCount,
    readyToSaveCount,
    analyzedCount,
  } = useImportWorkflow();

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans pb-32">
      <AppHeader primarySection="import" backHref="/" backLabel="Dashboard" />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        {errorMsg && <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 text-red-600 font-bold rounded-2xl">{errorMsg}</div>}

        {phase === "idle" && (
          <ImportUploadPanel
            languages={languages}
            selectedLang={selectedLang}
            fileName={fileName}
            parsedCount={parsedData.length}
            onLanguageChange={setSelectedLang}
            onFileUpload={handleFileUpload}
            onAnalyze={handleAnalyzeData}
          />
        )}

        {(phase === "analyzing" || phase === "saving") && (
          <ImportProgressPanel
            phase={phase}
            parsedCount={parsedData.length}
            analyzedCount={analyzedCount}
            readyToSaveCount={readyToSaveCount}
            skippedCount={skippedCount}
            failedCount={failedCount}
            percentComplete={percentComplete}
            progress={progress}
            logs={logs}
          />
        )}

        {phase === "review" && (
          <ImportReviewPanel
            fileName={fileName}
            parsedCount={parsedData.length}
            readyToSaveCount={readyToSaveCount}
            skippedCount={skippedCount}
            failedCount={failedCount}
            logs={logs}
            analyzedData={analyzedData}
            onSave={handleSaveToDatabase}
            onRemove={handleRemoveFromReview}
            onEditChange={handleEditChange}
          />
        )}

        {phase === "done" && (
          <ImportDonePanel
            parsedCount={parsedData.length}
            readyToSaveCount={readyToSaveCount}
            skippedCount={skippedCount}
            failedCount={failedCount}
            selectedLang={selectedLang}
            onReset={() => setPhase("idle")}
          />
        )}
      </main>
    </div>
  );
}
