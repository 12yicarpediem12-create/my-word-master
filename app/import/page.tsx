"use client";

import AppHeader from "../components/AppHeader";
import { AppMain, AppShell, PageIntro } from "../components/layout/AppShell";
import { ImportPhaseBadge, ImportWizardStepper } from "./primitives";
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
    handleRerunRow,
    handleFillMissingGender,
    handleFillMissingConjugation,
    handleFillMissingRoots,
    handleFillMissingExamples,
    handleImproveWeakRoots,
    handleEnrichReadyRows,
    handleRemoveFromReview,
    handleSaveToDatabase,
    percentComplete,
    skippedCount,
    failedCount,
    remainingCount,
    readyToSaveCount,
    needsHintCount,
    genderEnrichableCount,
    conjugationEnrichableCount,
    rootEnrichableCount,
    exampleEnrichableCount,
    weakRootCorrectionCount,
    enrichableCount,
    analyzedCount,
    rerunningRowId,
    isEnrichingMissingGender,
    missingGenderSummary,
    missingGenderProgress,
    isEnrichingMissingConjugation,
    missingConjugationSummary,
    missingConjugationProgress,
    isEnrichingMissingRoots,
    missingRootsSummary,
    missingRootsProgress,
    isEnrichingMissingExamples,
    missingExamplesSummary,
    missingExamplesProgress,
    isImprovingWeakRoots,
    weakRootsSummary,
    weakRootsProgress,
    isEnrichingSupportFields,
    supportEnrichmentProgress,
  } = useImportWorkflow();

  return (
    <AppShell className="pb-32">
      <AppHeader primarySection="import" backHref="/" backLabel="Dashboard" />

      <AppMain width="xl" className="section-stack">
        {errorMsg && <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 text-red-600 font-bold rounded-2xl">{errorMsg}</div>}

        <PageIntro
          eyebrow="Import Wizard"
          title="Bring vocabulary into your library"
          description="Upload a list, let AI structure it, review the rows that matter, and save only what belongs in your study system."
          actions={<ImportPhaseBadge phase={phase} />}
        />

        <ImportWizardStepper phase={phase} />

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
            needsHintCount={needsHintCount}
            skippedCount={skippedCount}
            failedCount={failedCount}
            remainingCount={remainingCount}
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
            needsHintCount={needsHintCount}
            genderEnrichableCount={genderEnrichableCount}
            conjugationEnrichableCount={conjugationEnrichableCount}
            rootEnrichableCount={rootEnrichableCount}
            exampleEnrichableCount={exampleEnrichableCount}
            weakRootCorrectionCount={weakRootCorrectionCount}
            enrichableCount={enrichableCount}
            skippedCount={skippedCount}
            failedCount={failedCount}
            logs={logs}
            analyzedData={analyzedData}
            onSave={handleSaveToDatabase}
            onRemove={handleRemoveFromReview}
            onEditChange={handleEditChange}
            onRerunRow={handleRerunRow}
            rerunningRowId={rerunningRowId}
            onFillMissingGender={handleFillMissingGender}
            isEnrichingMissingGender={isEnrichingMissingGender}
            missingGenderSummary={missingGenderSummary}
            missingGenderProgress={missingGenderProgress}
            onFillMissingConjugation={handleFillMissingConjugation}
            isEnrichingMissingConjugation={isEnrichingMissingConjugation}
            missingConjugationSummary={missingConjugationSummary}
            missingConjugationProgress={missingConjugationProgress}
            onFillMissingRoots={handleFillMissingRoots}
            isEnrichingMissingRoots={isEnrichingMissingRoots}
            missingRootsSummary={missingRootsSummary}
            missingRootsProgress={missingRootsProgress}
            onFillMissingExamples={handleFillMissingExamples}
            isEnrichingMissingExamples={isEnrichingMissingExamples}
            missingExamplesSummary={missingExamplesSummary}
            missingExamplesProgress={missingExamplesProgress}
            onImproveWeakRoots={handleImproveWeakRoots}
            isImprovingWeakRoots={isImprovingWeakRoots}
            weakRootsSummary={weakRootsSummary}
            weakRootsProgress={weakRootsProgress}
            onEnrichSupportFields={handleEnrichReadyRows}
            isEnrichingSupportFields={isEnrichingSupportFields}
            supportEnrichmentProgress={supportEnrichmentProgress}
          />
        )}

        {phase === "done" && (
          <ImportDonePanel
            parsedCount={parsedData.length}
            readyToSaveCount={readyToSaveCount}
            needsHintCount={needsHintCount}
            skippedCount={skippedCount}
            failedCount={failedCount}
            selectedLang={selectedLang}
            onReset={() => setPhase("idle")}
          />
        )}
      </AppMain>
    </AppShell>
  );
}
