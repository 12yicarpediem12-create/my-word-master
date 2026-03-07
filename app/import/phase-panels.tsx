import type { ChangeEvent, ReactNode } from "react";
import Link from "next/link";
import type { Language } from "@/app/lib/types";
import { ImportCountCard, LogSummaryPanel } from "./primitives";
import { ImportReviewTable } from "./review-table";
import type { AnalyzedWord, ImportLog, Phase } from "./types";

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
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{eyebrow}</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">{title}</h1>
          <p className="mt-2 text-sm font-medium leading-relaxed text-slate-600 sm:text-base">{description}</p>
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
  return <div className={`grid grid-cols-2 gap-3 lg:grid-cols-4 ${className || ""}`}>{children}</div>;
}

export function ImportUploadPanel({
  languages,
  selectedLang,
  fileName,
  parsedCount,
  onLanguageChange,
  onFileUpload,
  onAnalyze,
}: {
  languages: Language[];
  selectedLang: string;
  fileName: string | null;
  parsedCount: number;
  onLanguageChange: (value: string) => void;
  onFileUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  onAnalyze: () => void;
}) {
  return (
    <WizardSection
      eyebrow="Step 1"
      title="Upload your source list"
      description="Choose the target language, drop in a CSV, and prepare the list for AI analysis."
      actions={
        parsedCount > 0 ? (
          <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-blue-600">
            {parsedCount} parsed
          </span>
        ) : undefined
      }
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_20rem]">
        <div className="surface-hero relative overflow-hidden rounded-[2.5rem] p-8 sm:p-12">
          <div className="pointer-events-none absolute right-0 top-0 h-40 w-40 rounded-full bg-purple-200/30 blur-3xl" />
          <div className="grid gap-8">
            <div className="flex flex-col gap-2">
              <label className="ml-2 text-[10px] font-black uppercase tracking-tight text-slate-400">Select Target Language</label>
              <select value={selectedLang} onChange={(e) => onLanguageChange(e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 font-bold text-slate-950 outline-none">
                {languages.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.emoji} {l.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="ml-2 text-[10px] font-black uppercase tracking-tight text-slate-400">Upload CSV File</label>
              <div className="relative rounded-[2rem] border-2 border-dashed border-purple-200 bg-purple-50/40 p-10 text-center transition-colors hover:bg-purple-50">
                <input type="file" accept=".csv" onChange={onFileUpload} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
                <div className="pointer-events-none">
                  <span className="mb-4 block text-4xl">📄</span>
                  <p className="mb-1 text-lg font-black text-purple-700">{fileName ? fileName : "Click or drag CSV here"}</p>
                  <p className="text-sm font-bold text-purple-400">
                    Required column: <span className="rounded-md border border-purple-100 bg-white px-2 py-0.5">word</span>
                  </p>
                </div>
              </div>
            </div>

            {parsedCount > 0 && (
              <button onClick={onAnalyze} className="mt-2 flex w-full items-center justify-center gap-3 rounded-[2rem] bg-gradient-to-r from-indigo-600 to-purple-600 py-5 text-xl font-black text-white shadow-xl shadow-purple-500/20 transition-all hover:opacity-90">
                <span className="text-2xl">🧠</span> Analyze with AI ({parsedCount} words)
              </button>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="surface-card rounded-[2rem] p-6">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">How It Works</p>
            <div className="mt-4 space-y-4">
              <div>
                <p className="font-black text-slate-950">1. Upload a raw list</p>
                <p className="mt-1 text-sm font-medium text-slate-600">Use a simple CSV with a required `word` column.</p>
              </div>
              <div>
                <p className="font-black text-slate-950">2. Let AI structure it</p>
                <p className="mt-1 text-sm font-medium text-slate-600">Meanings, POS, examples, and root hints are filled where possible.</p>
              </div>
              <div>
                <p className="font-black text-slate-950">3. Review before save</p>
                <p className="mt-1 text-sm font-medium text-slate-600">Only rows that remain in the review list will be written to your library.</p>
              </div>
            </div>
          </div>

          <div className="surface-muted rounded-[2rem] p-6">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Good To Know</p>
            <p className="mt-3 text-sm font-medium leading-relaxed text-slate-600">
              Duplicate words are skipped during analysis, so the review step stays focused on new rows worth importing.
            </p>
          </div>
        </div>
      </div>
    </WizardSection>
  );
}

export function ImportProgressPanel({
  phase,
  parsedCount,
  analyzedCount,
  readyToSaveCount,
  skippedCount,
  failedCount,
  percentComplete,
  progress,
  logs,
}: {
  phase: Phase;
  parsedCount: number;
  analyzedCount: number;
  readyToSaveCount: number;
  skippedCount: number;
  failedCount: number;
  percentComplete: number;
  progress: { current: number; total: number };
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
        <div className="surface-card rounded-[2.5rem] p-8 text-center sm:p-12">
          <div className="mb-6 text-6xl animate-pulse">{isAnalyzing ? "🧠" : "💾"}</div>
          <h2 className="mb-2 text-3xl font-black text-slate-950">{isAnalyzing ? "Analyzing words..." : "Saving valid rows..."}</h2>
          <p className="mb-8 font-bold text-slate-500">{isAnalyzing ? "The next step will open an editable review workspace." : "The wizard is writing your approved rows to the library."}</p>

          <SummaryGrid className="mb-8 text-left">
            <ImportCountCard label="Analyzed" value={analyzedCount} tone="blue" helper={`${parsedCount} uploaded`} />
            <ImportCountCard label="Ready To Save" value={readyToSaveCount} tone="emerald" />
            <ImportCountCard label="Skipped" value={skippedCount} tone="amber" />
            <ImportCountCard label="Failed" value={failedCount} tone="rose" />
          </SummaryGrid>

          <div className="mb-3 flex items-end justify-between">
            <span className="text-sm font-black uppercase tracking-widest text-slate-400">Progress</span>
            <span className="text-2xl font-black text-purple-600">{percentComplete}%</span>
          </div>
          <div className="relative h-4 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
            <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500 ease-out" style={{ width: `${percentComplete}%` }} />
          </div>
          <p className="mt-3 text-center text-xs font-bold uppercase tracking-widest text-slate-400">{progress.current} / {progress.total} Processed</p>
        </div>

        <div className="space-y-4">
          <div className="surface-muted rounded-[2rem] p-6">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Current Step</p>
            <h3 className="mt-3 text-xl font-black text-slate-950">{isAnalyzing ? "Preparing review rows" : "Writing approved rows"}</h3>
            <p className="mt-2 text-sm font-medium leading-relaxed text-slate-600">
              {isAnalyzing
                ? "The wizard is checking duplicates, calling AI, and preparing an editable review table."
                : "The wizard is saving only the rows that survived review, skips, and manual removals."}
            </p>
          </div>
          <LogSummaryPanel logs={logs} />
        </div>
      </div>
    </WizardSection>
  );
}

export function ImportReviewPanel({
  fileName,
  parsedCount,
  readyToSaveCount,
  skippedCount,
  failedCount,
  logs,
  analyzedData,
  onSave,
  onRemove,
  onEditChange,
}: {
  fileName: string | null;
  parsedCount: number;
  readyToSaveCount: number;
  skippedCount: number;
  failedCount: number;
  logs: ImportLog[];
  analyzedData: AnalyzedWord[];
  onSave: () => void;
  onRemove: (id: number) => void;
  onEditChange: (id: number, field: keyof AnalyzedWord, value: string) => void;
}) {
  return (
    <WizardSection
      eyebrow="Step 3"
      title="Review the AI-prepared rows"
      description="This is the main work area of the wizard. Edit the rows that look good, remove anything you do not want, and save only the final list."
      actions={
        <button onClick={onSave} disabled={analyzedData.length === 0} className="rounded-2xl bg-slate-950 px-8 py-4 font-black text-white shadow-xl transition-all hover:bg-black disabled:opacity-50">
          Save Valid Rows Only
        </button>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem] xl:items-start">
        <div className="space-y-6">
          <SummaryGrid>
            <ImportCountCard label="Analyzed" value={parsedCount} tone="blue" helper={fileName || undefined} />
            <ImportCountCard label="Ready To Save" value={readyToSaveCount} tone="emerald" helper="Rows in the table" />
            <ImportCountCard label="Skipped" value={skippedCount} tone="amber" helper="Usually duplicates" />
            <ImportCountCard label="Failed" value={failedCount} tone="rose" helper="Needs retry or fix" />
          </SummaryGrid>

          <ImportReviewTable analyzedData={analyzedData} onRemove={onRemove} onEditChange={onEditChange} />
        </div>

        <div className="space-y-4 xl:sticky xl:top-32">
          <div className="surface-card rounded-[2rem] p-6">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Save Summary</p>
            <h3 className="mt-3 text-2xl font-black tracking-tight text-slate-950">Ready to commit</h3>
            <p className="mt-2 text-sm font-medium leading-relaxed text-slate-600">
              {readyToSaveCount > 0
                ? `${readyToSaveCount} reviewed row${readyToSaveCount !== 1 ? "s" : ""} will be saved to the library.`
                : "There are no valid rows left to save."}
            </p>

            <div className="mt-6 space-y-3">
              <button onClick={onSave} disabled={analyzedData.length === 0} className="w-full rounded-2xl bg-blue-600 px-5 py-4 font-black text-white transition-colors hover:bg-blue-700 disabled:opacity-50">
                Save Valid Rows
              </button>
              <Link href="/library" className="block w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 text-center font-black text-slate-950 transition-colors hover:border-blue-200 hover:text-blue-600">
                Open Library
              </Link>
            </div>
          </div>

          <div className="surface-muted rounded-[2rem] p-6">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Review Rules</p>
            <div className="mt-4 space-y-3 text-sm font-medium leading-relaxed text-slate-600">
              <p>Remove rows you do not trust. Only visible rows are saved.</p>
              <p>Edit wording, POS, gender, or root fields directly in the table.</p>
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
  skippedCount,
  failedCount,
  selectedLang,
  onReset,
}: {
  parsedCount: number;
  readyToSaveCount: number;
  skippedCount: number;
  failedCount: number;
  selectedLang: string;
  onReset: () => void;
}) {
  return (
    <WizardSection
      eyebrow="Step 5"
      title="Import complete"
      description="Your library has been updated. The next best move is to review the new material or return to your broader library workflow."
    >
      <div className="surface-card rounded-[2.5rem] p-10 text-center animate-in zoom-in-95 duration-500 sm:p-12">
        <div className="mb-6 text-7xl">🎉</div>
        <h2 className="mb-4 text-4xl font-black text-slate-950">Import Successful!</h2>
        <p className="mb-8 text-lg font-bold text-slate-500">Your vocabulary library has grown.</p>
        <SummaryGrid className="mb-8 text-left">
          <ImportCountCard label="Analyzed" value={parsedCount} tone="blue" />
          <ImportCountCard label="Saved" value={readyToSaveCount} tone="emerald" />
          <ImportCountCard label="Skipped" value={skippedCount} tone="amber" />
          <ImportCountCard label="Failed" value={failedCount} tone="rose" />
        </SummaryGrid>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <button onClick={onReset} className="rounded-2xl bg-slate-100 px-8 py-4 font-black text-slate-600 transition-colors hover:bg-slate-200">Import More</button>
          <Link href={`/study/${selectedLang}`} className="rounded-2xl bg-blue-600 px-8 py-4 font-black text-white shadow-xl transition-colors hover:bg-blue-700">Go to Study Hub</Link>
          <Link href="/library" className="rounded-2xl border border-slate-200 bg-white px-8 py-4 font-black text-slate-950 transition-colors hover:border-blue-200 hover:text-blue-600">Open Library</Link>
        </div>
      </div>
    </WizardSection>
  );
}
