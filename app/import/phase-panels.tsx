import type { ChangeEvent, ReactNode } from "react";
import Link from "next/link";
import { useState } from "react";
import type { Language } from "@/app/lib/types";
import { downloadWordMasterImportTemplate } from "@/app/lib/export-csv";
import { ImportCountCard, LogSummaryPanel } from "./primitives";
import { ImportReviewTable } from "./review-table";
import type { AnalyzedWord, ImportBatchRunSummary, ImportLog, ImportPreviewSummary, Phase } from "./types";

function WizardSection({
  eyebrow,
  title,
  description,
  actions,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="animate-in fade-in duration-500">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <p className="section-eyebrow">{eyebrow}</p>
          <h1 className="section-title">{title}</h1>
          <p className="section-copy sm:text-base">{description}</p>
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-3">{actions}</div>}
      </div>
      {children}
    </section>
  );
}

function SummaryGrid({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`grid grid-cols-2 gap-3 lg:grid-cols-6 ${className || ""}`}>{children}</div>;
}

function BatchRunSummary({
  summary,
  tone = "slate",
}: {
  summary: ImportBatchRunSummary | null;
  tone?: "emerald" | "violet" | "amber" | "sky" | "orange" | "slate";
}) {
  if (!summary) return null;

  const toneMap = {
    emerald: "border-emerald-100 bg-emerald-50/70 text-emerald-900",
    violet: "border-violet-100 bg-violet-50/70 text-violet-900",
    amber: "border-amber-100 bg-amber-50/70 text-amber-900",
    sky: "border-sky-100 bg-sky-50/70 text-sky-900",
    orange: "border-orange-100 bg-orange-50/70 text-orange-900",
    slate: "border-slate-200 bg-slate-50/80 text-slate-900",
  } as const;

  return (
    <div className={`mt-3 rounded-2xl border px-4 py-3 ${toneMap[tone]}`}>
      <p className="support-label">Last run</p>
      <div className="mt-2 grid grid-cols-2 gap-2 text-xs font-medium">
        <span>Attempted: {summary.attempted}</span>
        <span>Updated: {summary.updated}</span>
        <span>No usable value: {summary.noResult}</span>
        <span>Failed: {summary.failed}</span>
      </div>
      {summary.sampleDetail && (
        <p className="mt-3 text-xs leading-relaxed text-slate-700">
          <span className="font-semibold text-slate-900">Sample detail:</span> {summary.sampleDetail}
        </p>
      )}
    </div>
  );
}

export function ImportUploadPanel({
  languages,
  selectedLang,
  fileName,
  parsedCount,
  uploadPreview,
  uploadPreviewLogs,
  onLanguageChange,
  onFileUpload,
  onAnalyze,
}: {
  languages: Language[];
  selectedLang: string;
  fileName: string | null;
  parsedCount: number;
  uploadPreview: ImportPreviewSummary | null;
  uploadPreviewLogs: ImportLog[];
  onLanguageChange: (value: string) => void;
  onFileUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  onAnalyze: () => void;
}) {
  const delimiterLabel =
    uploadPreview?.detectedDelimiter === "\t"
      ? "Tab-separated"
      : uploadPreview?.detectedDelimiter === ","
        ? "Comma-separated"
        : "Unknown";

  return (
    <WizardSection
      eyebrow="Step 1"
      title="Upload your source list"
      description="Choose the target language, drop in a CSV, and prepare the list for AI analysis."
      actions={
        parsedCount > 0 ? (
          <>
            {uploadPreview && (
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-medium text-slate-600">
                {delimiterLabel}
              </span>
            )}
            <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[11px] font-medium text-blue-600">
              {parsedCount} ready
            </span>
          </>
        ) : undefined
      }
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_20rem]">
        <div className="surface-hero relative overflow-hidden rounded-[2.5rem] p-8 sm:p-12">
          <div className="pointer-events-none absolute right-0 top-0 h-40 w-40 rounded-full bg-purple-200/30 blur-3xl" />
          <div className="grid gap-8">
            <div className="flex flex-col gap-2">
              <label className="ml-2 support-label">Target language</label>
              <select value={selectedLang} onChange={(e) => onLanguageChange(e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 p-4 font-medium text-slate-950 outline-none">
                {languages.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.emoji} {l.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="ml-2 support-label">Upload CSV or TSV</label>
              <div className="relative rounded-[2rem] border-2 border-dashed border-purple-200 bg-purple-50/30 p-10 text-center transition-colors hover:bg-purple-50/50">
                <input type="file" accept=".csv,.tsv,text/csv,text/tab-separated-values" onChange={onFileUpload} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
                <div className="pointer-events-none">
                  <span className="mb-4 block text-4xl">📄</span>
                  <p className="mb-1 text-lg font-semibold text-purple-700">{fileName ? fileName : "Click or drag a CSV here"}</p>
                  <p className="text-sm font-medium text-purple-400">
                    Required headers: <span className="rounded-md border border-purple-100 bg-white px-2 py-0.5">word</span>, <span className="rounded-md border border-purple-100 bg-white px-2 py-0.5">meaning</span>, <span className="rounded-md border border-purple-100 bg-white px-2 py-0.5">pos</span>
                  </p>
                </div>
              </div>
            </div>

            {uploadPreview && (
              <div className="rounded-[1.8rem] border border-slate-200 bg-white/80 p-5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="support-label">Import preview</p>
                    <p className="mt-1 text-sm font-medium text-slate-600">The file was parsed by header name. Review invalid rows and duplicate candidates before analysis.</p>
                  </div>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-medium text-slate-600">
                    Detected: {delimiterLabel}
                  </span>
                </div>
                <SummaryGrid className="mt-4">
                  <ImportCountCard label="Total Rows" value={uploadPreview.totalRows} tone="blue" />
                  <ImportCountCard label="Valid" value={uploadPreview.validRows} tone="emerald" />
                  <ImportCountCard label="Skipped" value={uploadPreview.skippedRows} tone="amber" helper="Empty rows" />
                  <ImportCountCard label="Errors" value={uploadPreview.errorRows} tone="rose" />
                  <ImportCountCard label="Duplicates" value={uploadPreview.duplicateCandidates.length} tone="amber" helper="Review before save" />
                  <ImportCountCard
                    label="Ready"
                    value={parsedCount}
                    tone="blue"
                    helper={uploadPreview.isCanonicalSchema ? "Rows preserved for review" : "Rows sent to AI"}
                  />
                </SummaryGrid>
                {uploadPreview.isCanonicalSchema && (
                  <p className="mt-4 text-sm font-medium leading-relaxed text-emerald-700">
                    Canonical WordMaster schema detected. Initial analysis will preserve imported blanks and values exactly unless you explicitly run enrichment later.
                  </p>
                )}
              </div>
            )}

            {parsedCount > 0 && (
              <button onClick={onAnalyze} className="mt-2 flex w-full items-center justify-center gap-3 rounded-[2rem] bg-gradient-to-r from-indigo-600 to-purple-600 py-5 text-lg font-semibold text-white shadow-xl shadow-purple-500/20 transition-all hover:opacity-90">
                <span className="text-2xl">🧠</span> Analyze with AI ({parsedCount} words)
              </button>
            )}
          </div>
        </div>

        <div className="surface-muted rounded-[1.85rem] p-6">
          <p className="support-label">Workflow notes</p>
          <div className="mt-4 space-y-4">
            <div>
              <p className="font-semibold text-slate-950">1. Upload a raw list</p>
              <p className="mt-1 text-sm text-slate-600">CSV and TSV are both supported. Delimiter detection is based on file content, not extension.</p>
              <button
                onClick={() => downloadWordMasterImportTemplate()}
                className="mt-3 rounded-full border border-slate-200 bg-white px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-slate-600 transition-colors hover:border-blue-200 hover:text-blue-700"
              >
                Download WordMaster template
              </button>
            </div>
            <div>
              <p className="font-semibold text-slate-950">2. Let AI structure it</p>
              <p className="mt-1 text-sm text-slate-600">Meanings, POS, examples, and root hints are filled where possible, one lexical record at a time.</p>
            </div>
            <div>
              <p className="font-semibold text-slate-950">3. Review before save</p>
              <p className="mt-1 text-sm text-slate-600">Rows marked Needs Hint stay editable in review until they have one clear POS and meaning.</p>
            </div>
          </div>

          <div className="mt-5 border-t border-slate-200 pt-5">
            <p className="support-label">Good to know</p>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              Duplicate checks are conservative: same spelling, same part of speech, and same meaning are treated as duplicate candidates.
            </p>
          </div>
        </div>
      </div>

      {uploadPreviewLogs.length > 0 && (
        <div className="mt-6">
          <LogSummaryPanel
            logs={uploadPreviewLogs}
            title="Upload issues and duplicate candidates"
            description="Invalid rows list the row number, field, and reason. Duplicate candidates are shown before AI analysis so they are never silently merged."
          />
        </div>
      )}
    </WizardSection>
  );
}

export function ImportProgressPanel({
  phase,
  parsedCount,
  analyzedCount,
  readyToSaveCount,
  needsHintCount,
  skippedCount,
  failedCount,
  remainingCount,
  percentComplete,
  progress,
  logs,
}: {
  phase: Phase;
  parsedCount: number;
  analyzedCount: number;
  readyToSaveCount: number;
  needsHintCount: number;
  skippedCount: number;
  failedCount: number;
  remainingCount: number;
  percentComplete: number;
  progress: { current: number; total: number; currentWord: string | null; currentStage: string | null };
  logs: ImportLog[];
}) {
  const isAnalyzing = phase === "analyzing";

  return (
    <WizardSection
      eyebrow={isAnalyzing ? "Step 2" : "Step 4"}
      title={isAnalyzing ? "AI is preparing your review set" : "Saving reviewed rows to your library"}
      description={isAnalyzing ? "The import is being structured into editable rows. Keep this window open while the wizard prepares the review step." : "Only the rows currently approved in the review step will be written to your library."}
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="rounded-[2.2rem] border border-slate-200/75 bg-white/78 p-8 text-center shadow-[0_20px_44px_-38px_rgba(15,23,42,0.16)] sm:p-12">
          <div className="mb-6 text-6xl animate-pulse">{isAnalyzing ? "🧠" : "💾"}</div>
          <h2 className="mb-2 text-3xl font-semibold text-slate-950">{isAnalyzing ? "Analyzing words..." : "Saving valid rows..."}</h2>
          <p className="mb-8 text-sm font-medium text-slate-500">{isAnalyzing ? "The next step will open an editable review workspace." : "The wizard is writing your approved rows to the library."}</p>

          <div className="mb-6 rounded-[1.65rem] border border-slate-200 bg-slate-50/75 p-5 text-left">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="support-label">{isAnalyzing ? "Current row" : "Current batch"}</p>
                <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                  {progress.currentWord || (isAnalyzing ? "Preparing next row" : `Saving ${progress.total} approved rows`)}
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  {progress.currentStage || (isAnalyzing ? "Preparing analysis queue" : "Submitting reviewed rows")}
                </p>
              </div>
              <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600">
                {progress.current} / {progress.total}
              </div>
            </div>
          </div>

          <SummaryGrid className="mb-8 text-left">
            <ImportCountCard label="Processed" value={progress.current} tone="blue" helper={`${progress.total} total`} />
            <ImportCountCard label="Ready" value={readyToSaveCount} tone="emerald" />
            <ImportCountCard label="Needs Hint" value={needsHintCount} tone="amber" helper="Ambiguous rows" />
            <ImportCountCard label="Duplicate" value={skippedCount} tone="amber" />
            <ImportCountCard label="Failed" value={failedCount} tone="rose" />
            <ImportCountCard label="Remaining" value={remainingCount} tone="gray" helper={isAnalyzing ? `${parsedCount} uploaded` : "Still to save"} />
          </SummaryGrid>

          <div className="mb-3 flex items-end justify-between">
            <span className="support-label">Progress</span>
            <span className="text-2xl font-semibold text-purple-600">{percentComplete}%</span>
          </div>
          <div className="relative h-4 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
            <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500 ease-out" style={{ width: `${percentComplete}%` }} />
          </div>
          <p className="mt-3 text-center text-xs font-medium text-slate-400">
            {isAnalyzing
              ? `${progress.current} of ${progress.total} rows analyzed so far`
              : `${progress.current} of ${progress.total} approved rows saved`}
          </p>
        </div>

        <div className="space-y-4">
          <div className="surface-muted rounded-[1.85rem] p-6">
            <p className="support-label">Current step</p>
            <h3 className="mt-3 text-xl font-semibold text-slate-950">{isAnalyzing ? "Preparing review rows" : "Writing approved rows"}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              {isAnalyzing
                ? "The wizard is checking duplicates, calling AI, and preparing an editable review table."
                : "The wizard is saving only the rows that survived review, skips, and manual removals."}
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-[1.25rem] border border-slate-200 bg-white/72 px-4 py-3">
                <p className="support-label">Analyzed</p>
                <p className="mt-2 text-xl font-semibold text-slate-950">{analyzedCount}</p>
              </div>
              <div className="rounded-[1.25rem] border border-slate-200 bg-white/72 px-4 py-3">
                <p className="support-label">Remaining</p>
                <p className="mt-2 text-xl font-semibold text-slate-950">{remainingCount}</p>
              </div>
            </div>
          </div>
          <LogSummaryPanel
            logs={logs}
            title="Recent row activity"
            description={isAnalyzing ? "Each row is checked for duplicates, then prepared for review." : "Save progress and recent row outcomes."}
          />
        </div>
      </div>
    </WizardSection>
  );
}

export function ImportReviewPanel({
  fileName,
  parsedCount,
  readyToSaveCount,
  needsHintCount,
  genderEnrichableCount,
  conjugationEnrichableCount,
  rootEnrichableCount,
  exampleEnrichableCount,
  weakRootCorrectionCount,
  enrichableCount,
  skippedCount,
  failedCount,
  logs,
  analyzedData,
  onSave,
  onRemove,
  onEditChange,
  onRerunRow,
  rerunningRowId,
  onFillMissingGender,
  isEnrichingMissingGender,
  missingGenderSummary,
  missingGenderProgress,
  onFillMissingConjugation,
  isEnrichingMissingConjugation,
  missingConjugationSummary,
  missingConjugationProgress,
  onFillMissingRoots,
  isEnrichingMissingRoots,
  missingRootsSummary,
  missingRootsProgress,
  onFillMissingExamples,
  isEnrichingMissingExamples,
  missingExamplesSummary,
  missingExamplesProgress,
  onImproveWeakRoots,
  isImprovingWeakRoots,
  weakRootsSummary,
  weakRootsProgress,
  onEnrichSupportFields,
  isEnrichingSupportFields,
  supportEnrichmentProgress,
}: {
  fileName: string | null;
  parsedCount: number;
  readyToSaveCount: number;
  needsHintCount: number;
  genderEnrichableCount: number;
  conjugationEnrichableCount: number;
  rootEnrichableCount: number;
  exampleEnrichableCount: number;
  weakRootCorrectionCount: number;
  enrichableCount: number;
  skippedCount: number;
  failedCount: number;
  logs: ImportLog[];
  analyzedData: AnalyzedWord[];
  onSave: () => void;
  onRemove: (id: number) => void;
  onEditChange: (id: number, field: keyof AnalyzedWord, value: string) => void;
  onRerunRow: (id: number) => void;
  rerunningRowId: number | null;
  onFillMissingGender: () => void;
  isEnrichingMissingGender: boolean;
  missingGenderSummary: ImportBatchRunSummary | null;
  missingGenderProgress: { current: number; total: number; currentWord: string | null; currentStage: string | null };
  onFillMissingConjugation: () => void;
  isEnrichingMissingConjugation: boolean;
  missingConjugationSummary: ImportBatchRunSummary | null;
  missingConjugationProgress: { current: number; total: number; currentWord: string | null; currentStage: string | null };
  onFillMissingRoots: () => void;
  isEnrichingMissingRoots: boolean;
  missingRootsSummary: ImportBatchRunSummary | null;
  missingRootsProgress: { current: number; total: number; currentWord: string | null; currentStage: string | null };
  onFillMissingExamples: () => void;
  isEnrichingMissingExamples: boolean;
  missingExamplesSummary: ImportBatchRunSummary | null;
  missingExamplesProgress: { current: number; total: number; currentWord: string | null; currentStage: string | null };
  onImproveWeakRoots: () => void;
  isImprovingWeakRoots: boolean;
  weakRootsSummary: ImportBatchRunSummary | null;
  weakRootsProgress: { current: number; total: number; currentWord: string | null; currentStage: string | null };
  onEnrichSupportFields: () => void;
  isEnrichingSupportFields: boolean;
  supportEnrichmentProgress: { current: number; total: number; currentWord: string | null; currentStage: string | null };
}) {
  const [focusNeedsHintSignal, setFocusNeedsHintSignal] = useState(0);

  return (
    <WizardSection
      eyebrow="Step 3"
      title="Review the AI-prepared rows"
      description="This is the main work area of the wizard. Edit the rows that look good, remove anything you do not want, and save only the final list."
      actions={
        <button onClick={onSave} disabled={analyzedData.length === 0} className="rounded-2xl bg-slate-950 px-8 py-4 font-semibold text-white shadow-xl transition-all hover:bg-black disabled:opacity-50">
          Save Valid Rows Only
        </button>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem] xl:items-start">
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <ImportCountCard label="Analyzed" value={parsedCount} tone="blue" helper={fileName || undefined} />
            <ImportCountCard label="Ready" value={readyToSaveCount} tone="emerald" helper="Will save now" />
            <ImportCountCard label="Needs Hint" value={needsHintCount} tone="amber" helper="Set one POS/use" />
            <ImportCountCard label="Skipped" value={skippedCount} tone="amber" helper="Usually duplicates" />
            <ImportCountCard label="Failed" value={failedCount} tone="rose" helper="Analysis error" />
          </div>

          <ImportReviewTable
            analyzedData={analyzedData}
            onRemove={onRemove}
            onEditChange={onEditChange}
            onRerunRow={onRerunRow}
            rerunningRowId={rerunningRowId}
            focusNeedsHintSignal={focusNeedsHintSignal}
          />
        </div>

        <div className="space-y-4 xl:self-start">
          <div className="surface-muted rounded-[1.85rem] p-6">
            <p className="support-label">Save summary</p>
            <h3 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">Ready to save</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              {readyToSaveCount > 0
                ? `${readyToSaveCount} reviewed row${readyToSaveCount !== 1 ? "s" : ""} currently meet the one-record-per-POS rule and will be saved.`
                : "There are no valid rows left to save."}
            </p>
            <div className="mt-4 rounded-[1.35rem] border border-slate-200 bg-white/70 p-4">
              <p className="support-label">Targeted enrichment</p>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {genderEnrichableCount > 0
                  ? `${genderEnrichableCount} ready noun row${genderEnrichableCount !== 1 ? "s" : ""} still need gender.`
                  : "All ready noun rows already have gender filled."}
              </p>
              {isEnrichingMissingGender && (
                <div className="mt-3 rounded-2xl border border-emerald-100 bg-emerald-50/70 px-4 py-3">
                  <p className="text-sm font-semibold text-emerald-900">
                    {missingGenderProgress.currentStage || "Filling noun gender"}
                  </p>
                  <p className="mt-1 text-xs text-emerald-700">
                    {missingGenderProgress.current} / {missingGenderProgress.total}
                    {missingGenderProgress.currentWord ? ` · ${missingGenderProgress.currentWord}` : ""}
                  </p>
                </div>
              )}
              <button
                onClick={onFillMissingGender}
                disabled={genderEnrichableCount === 0 || isEnrichingMissingGender}
                className="mt-4 w-full rounded-2xl border border-emerald-200 bg-white px-5 py-4 font-semibold text-emerald-700 transition-colors hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isEnrichingMissingGender ? "Filling gender..." : "Fill missing gender"}
              </button>
              <BatchRunSummary summary={missingGenderSummary} tone="emerald" />
            </div>

            <div className="mt-4 rounded-[1.35rem] border border-slate-200 bg-white/70 p-4">
              <p className="support-label">Targeted enrichment</p>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {conjugationEnrichableCount > 0
                  ? `${conjugationEnrichableCount} ready verb row${conjugationEnrichableCount !== 1 ? "s" : ""} still need conjugation.`
                  : "All ready verb rows already have conjugation filled."}
              </p>
              {isEnrichingMissingConjugation && (
                <div className="mt-3 rounded-2xl border border-violet-100 bg-violet-50/70 px-4 py-3">
                  <p className="text-sm font-semibold text-violet-900">
                    {missingConjugationProgress.currentStage || "Filling verb conjugation"}
                  </p>
                  <p className="mt-1 text-xs text-violet-700">
                    {missingConjugationProgress.current} / {missingConjugationProgress.total}
                    {missingConjugationProgress.currentWord ? ` · ${missingConjugationProgress.currentWord}` : ""}
                  </p>
                </div>
              )}
              <button
                onClick={onFillMissingConjugation}
                disabled={conjugationEnrichableCount === 0 || isEnrichingMissingConjugation}
                className="mt-4 w-full rounded-2xl border border-violet-200 bg-white px-5 py-4 font-semibold text-violet-700 transition-colors hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isEnrichingMissingConjugation ? "Filling conjugation..." : "Fill missing conjugation"}
              </button>
              <BatchRunSummary summary={missingConjugationSummary} tone="violet" />
            </div>

            <div className="mt-4 rounded-[1.35rem] border border-slate-200 bg-white/70 p-4">
              <p className="support-label">Targeted enrichment</p>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {rootEnrichableCount > 0
                  ? `${rootEnrichableCount} ready single-word row${rootEnrichableCount !== 1 ? "s" : ""} still need roots.`
                  : "All ready single-word rows already have roots filled."}
              </p>
              {isEnrichingMissingRoots && (
                <div className="mt-3 rounded-2xl border border-amber-100 bg-amber-50/70 px-4 py-3">
                  <p className="text-sm font-semibold text-amber-900">
                    {missingRootsProgress.currentStage || "Filling root words"}
                  </p>
                  <p className="mt-1 text-xs text-amber-700">
                    {missingRootsProgress.current} / {missingRootsProgress.total}
                    {missingRootsProgress.currentWord ? ` · ${missingRootsProgress.currentWord}` : ""}
                  </p>
                </div>
              )}
              <button
                onClick={onFillMissingRoots}
                disabled={rootEnrichableCount === 0 || isEnrichingMissingRoots}
                className="mt-4 w-full rounded-2xl border border-amber-200 bg-white px-5 py-4 font-semibold text-amber-700 transition-colors hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isEnrichingMissingRoots ? "Filling roots..." : "Fill missing roots"}
              </button>
              <BatchRunSummary summary={missingRootsSummary} tone="amber" />
            </div>

            <div className="mt-4 rounded-[1.35rem] border border-slate-200 bg-white/70 p-4">
              <p className="support-label">Targeted enrichment</p>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {exampleEnrichableCount > 0
                  ? `${exampleEnrichableCount} ready row${exampleEnrichableCount !== 1 ? "s" : ""} still need examples.`
                  : "All ready rows already have example fields filled."}
              </p>
              {isEnrichingMissingExamples && (
                <div className="mt-3 rounded-2xl border border-sky-100 bg-sky-50/70 px-4 py-3">
                  <p className="text-sm font-semibold text-sky-900">
                    {missingExamplesProgress.currentStage || "Filling examples"}
                  </p>
                  <p className="mt-1 text-xs text-sky-700">
                    {missingExamplesProgress.current} / {missingExamplesProgress.total}
                    {missingExamplesProgress.currentWord ? ` · ${missingExamplesProgress.currentWord}` : ""}
                  </p>
                </div>
              )}
              <button
                onClick={onFillMissingExamples}
                disabled={exampleEnrichableCount === 0 || isEnrichingMissingExamples}
                className="mt-4 w-full rounded-2xl border border-sky-200 bg-white px-5 py-4 font-semibold text-sky-700 transition-colors hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isEnrichingMissingExamples ? "Filling examples..." : "Fill missing examples"}
              </button>
              <BatchRunSummary summary={missingExamplesSummary} tone="sky" />
            </div>

            <div className="mt-4 rounded-[1.35rem] border border-slate-200 bg-white/70 p-4">
              <p className="support-label">Targeted enrichment</p>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {weakRootCorrectionCount > 0
                  ? `${weakRootCorrectionCount} ready single-word row${weakRootCorrectionCount !== 1 ? "s" : ""} have suspicious roots that can be improved.`
                  : "No ready single-word rows currently look like they need root correction."}
              </p>
              {isImprovingWeakRoots && (
                <div className="mt-3 rounded-2xl border border-orange-100 bg-orange-50/70 px-4 py-3">
                  <p className="text-sm font-semibold text-orange-900">
                    {weakRootsProgress.currentStage || "Improving weak roots"}
                  </p>
                  <p className="mt-1 text-xs text-orange-700">
                    {weakRootsProgress.current} / {weakRootsProgress.total}
                    {weakRootsProgress.currentWord ? ` · ${weakRootsProgress.currentWord}` : ""}
                  </p>
                </div>
              )}
              <button
                onClick={onImproveWeakRoots}
                disabled={weakRootCorrectionCount === 0 || isImprovingWeakRoots}
                className="mt-4 w-full rounded-2xl border border-orange-200 bg-white px-5 py-4 font-semibold text-orange-700 transition-colors hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isImprovingWeakRoots ? "Improving roots..." : "Improve weak roots"}
              </button>
              <BatchRunSummary summary={weakRootsSummary} tone="orange" />
            </div>

            <div className="mt-4 rounded-[1.35rem] border border-slate-200 bg-white/70 p-4">
              <p className="support-label">Support-field enrichment</p>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {enrichableCount > 0
                  ? `${enrichableCount} ready row${enrichableCount !== 1 ? "s" : ""} still have missing high-value support fields like gender, root, conjugation, or examples.`
                  : "All ready rows already have the current high-value support fields filled."}
              </p>
              {isEnrichingSupportFields && (
                <div className="mt-3 rounded-2xl border border-blue-100 bg-blue-50/70 px-4 py-3">
                  <p className="text-sm font-semibold text-blue-900">
                    {supportEnrichmentProgress.currentStage || "Filling missing support fields"}
                  </p>
                  <p className="mt-1 text-xs text-blue-700">
                    {supportEnrichmentProgress.current} / {supportEnrichmentProgress.total}
                    {supportEnrichmentProgress.currentWord ? ` · ${supportEnrichmentProgress.currentWord}` : ""}
                  </p>
                </div>
              )}
              <button
                onClick={onEnrichSupportFields}
                disabled={enrichableCount === 0 || isEnrichingSupportFields}
                className="mt-4 w-full rounded-2xl border border-blue-200 bg-white px-5 py-4 font-semibold text-blue-700 transition-colors hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isEnrichingSupportFields ? "Filling support fields..." : "Fill missing support fields"}
              </button>
            </div>
            {needsHintCount > 0 && (
              <div className="mt-3 rounded-[1.35rem] border border-amber-200 bg-amber-50/75 p-4">
                <p className="text-sm leading-relaxed text-amber-800">
                  {needsHintCount} row{needsHintCount !== 1 ? "s still need" : " still needs"} one clear part of speech and meaning before they can be saved.
                </p>
                <button
                  onClick={() => setFocusNeedsHintSignal((value) => value + 1)}
                  className="mt-3 rounded-full border border-amber-200 bg-white px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-amber-700 transition-colors hover:bg-amber-100"
                >
                  Review unresolved rows
                </button>
              </div>
            )}

            <div className="mt-6 space-y-3">
              <button onClick={onSave} disabled={analyzedData.length === 0} className="w-full rounded-2xl bg-blue-600 px-5 py-4 font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50">
                Save Valid Rows
              </button>
              <Link href="/library" className="block w-full rounded-2xl border border-slate-200 bg-white/80 px-5 py-4 text-center font-medium text-slate-950 transition-colors hover:border-blue-200 hover:text-blue-600">
                Open Library
              </Link>
            </div>
          </div>

          <div className="surface-muted rounded-[1.85rem] p-6">
            <p className="support-label">Review notes</p>
            <div className="mt-4 space-y-3 text-sm leading-relaxed text-slate-600">
              <p>Remove rows you do not trust. Only visible rows are saved.</p>
              <p>Edit wording, POS, gender, or root fields directly in the table.</p>
              <p>Rows marked Needs Hint should be narrowed to one POS and one meaning before save.</p>
              <p>Skipped and failed rows stay listed in the issues panel for context.</p>
            </div>
          </div>

          {(skippedCount > 0 || failedCount > 0) && <LogSummaryPanel logs={logs} />}
        </div>
      </div>
    </WizardSection>
  );
}

export function ImportDonePanel({
  parsedCount,
  readyToSaveCount,
  needsHintCount,
  skippedCount,
  failedCount,
  selectedLang,
  onReset,
}: {
  parsedCount: number;
  readyToSaveCount: number;
  needsHintCount: number;
  skippedCount: number;
  failedCount: number;
  selectedLang: string;
  onReset: () => void;
}) {
  return (
    <WizardSection
      eyebrow="Step 5"
      title="Import complete"
      description="Your library has been updated. The next best move is to review the new material calmly, then return to broader library cleanup only if needed."
    >
      <div className="rounded-[2.5rem] border border-slate-200/80 bg-white/85 p-10 text-center shadow-[0_26px_50px_-40px_rgba(15,23,42,0.22)] animate-in zoom-in-95 duration-500 sm:p-12">
        <div className="mb-6 text-7xl">🎉</div>
        <h2 className="mb-4 text-4xl font-black text-slate-950">Import Successful!</h2>
        <p className="mb-8 text-lg font-bold text-slate-500">Your vocabulary library has grown.</p>
        <SummaryGrid className="mb-8 text-left">
          <ImportCountCard label="Analyzed" value={parsedCount} tone="blue" />
          <ImportCountCard label="Saved" value={readyToSaveCount} tone="emerald" />
          <ImportCountCard label="Needs Hint" value={needsHintCount} tone="amber" />
          <ImportCountCard label="Skipped" value={skippedCount} tone="amber" />
          <ImportCountCard label="Failed" value={failedCount} tone="rose" />
        </SummaryGrid>
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Next Step</p>
          <p className="mt-2 text-sm font-medium leading-relaxed text-slate-600">
            Go straight into the language hub if you want to review what you just added, or return to the library if you want to keep organizing.
          </p>
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Link href={`/study/${selectedLang}`} className="rounded-2xl bg-blue-600 px-8 py-4 font-black text-white shadow-xl transition-colors hover:bg-blue-700">Go to Study Hub</Link>
            <Link href="/library" className="rounded-2xl border border-slate-200 bg-white px-8 py-4 font-black text-slate-950 transition-colors hover:border-blue-200 hover:text-blue-600">Open Library</Link>
            <button onClick={onReset} className="rounded-2xl bg-slate-100 px-8 py-4 font-black text-slate-600 transition-colors hover:bg-slate-200">Import More</button>
          </div>
        </div>
      </div>
    </WizardSection>
  );
}
