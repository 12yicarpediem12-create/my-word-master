import Link from "next/link";
import type { AnalyzedWord, ImportLog, Phase } from "./types";
import type { Language } from "@/app/lib/types";

export function ImportCountCard({
  label,
  value,
  tone = "gray",
  helper,
}: {
  label: string;
  value: number;
  tone?: "gray" | "blue" | "emerald" | "amber" | "rose";
  helper?: string;
}) {
  const toneMap = {
    gray: "bg-gray-50 border-gray-100 text-gray-900",
    blue: "bg-blue-50 border-blue-100 text-blue-900",
    emerald: "bg-emerald-50 border-emerald-100 text-emerald-900",
    amber: "bg-amber-50 border-amber-100 text-amber-900",
    rose: "bg-rose-50 border-rose-100 text-rose-900",
  };

  return (
    <div className={`rounded-[1.5rem] border p-4 ${toneMap[tone]}`}>
      <p className="text-[10px] font-black uppercase tracking-widest opacity-60">{label}</p>
      <p className="text-3xl font-black mt-2">{value}</p>
      {helper && <p className="text-xs font-bold mt-2 opacity-60">{helper}</p>}
    </div>
  );
}

export function LogStatusBadge({ status }: { status: ImportLog["status"] }) {
  const statusMap = {
    success: "bg-emerald-50 text-emerald-700 border-emerald-100",
    skipped: "bg-amber-50 text-amber-700 border-amber-100",
    error: "bg-rose-50 text-rose-700 border-rose-100",
  };

  return <span className={`px-2.5 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest ${statusMap[status]}`}>{status}</span>;
}

export function LogSummaryPanel({ logs }: { logs: ImportLog[] }) {
  if (logs.length === 0) return null;

  return (
    <div className="bg-white rounded-[2rem] border-2 border-gray-200 shadow-sm p-6 sm:p-8">
      <div className="flex items-center justify-between gap-4 mb-5">
        <div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Issues & Skips</p>
          <h3 className="text-xl font-black text-gray-900">Rows needing attention</h3>
        </div>
        <span className="bg-gray-100 text-gray-500 text-xs font-black px-3 py-1 rounded-full">{logs.length}</span>
      </div>

      <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
        {logs.map((log, index) => (
          <div key={`${log.word}-${log.status}-${index}`} className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="min-w-0">
                <p className="font-black text-gray-900 break-words">{log.word}</p>
                <p className="text-sm font-medium text-gray-500 mt-1 break-words">{log.message || "No additional detail."}</p>
              </div>
              <LogStatusBadge status={log.status} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
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
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onAnalyze: () => void;
}) {
  return (
    <div className="animate-in fade-in zoom-in-95 duration-500">
      <header className="mb-10 text-center">
        <p className="text-[10px] font-black text-purple-500 uppercase tracking-widest mb-3 flex items-center justify-center gap-2"><span>✨</span> AI-Powered Magic</p>
        <h1 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight mb-4">Bulk Import</h1>
        <p className="text-lg text-gray-500 font-medium">Upload your vocabulary list. AI will do the heavy lifting.</p>
      </header>

      <div className="bg-white rounded-[2.5rem] p-8 sm:p-12 border-2 border-gray-200 shadow-sm relative overflow-hidden">
        <div className="grid grid-cols-1 gap-8">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase tracking-tight ml-2 text-gray-400">Select Target Language</label>
            <select value={selectedLang} onChange={(e) => onLanguageChange(e.target.value)} className="w-full p-4 border-2 rounded-2xl font-bold bg-gray-50 border-gray-100 text-gray-900 outline-none">
              {languages.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.emoji} {l.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase tracking-tight ml-2 text-gray-400">Upload CSV File</label>
            <div className="relative border-2 border-dashed border-purple-200 bg-purple-50/30 rounded-[2rem] p-10 text-center hover:bg-purple-50 transition-colors">
              <input type="file" accept=".csv" onChange={onFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
              <div className="pointer-events-none">
                <span className="text-4xl block mb-4">📄</span>
                <p className="text-lg font-black text-purple-700 mb-1">{fileName ? fileName : "Click or drag CSV here"}</p>
                <p className="text-sm font-bold text-purple-400">
                  Required column: <span className="bg-white px-2 py-0.5 rounded-md border border-purple-100">word</span>
                </p>
              </div>
            </div>
          </div>

          {parsedCount > 0 && (
            <button onClick={onAnalyze} className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black text-xl py-5 rounded-[2rem] hover:opacity-90 transition-all shadow-xl shadow-purple-500/20 mt-4 flex items-center justify-center gap-3">
              <span className="text-2xl">🧠</span> Analyze with AI ({parsedCount} words)
            </button>
          )}
        </div>
      </div>
    </div>
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
  return (
    <div className="space-y-6 animate-in fade-in duration-500 mt-10">
      <div className="bg-white rounded-[2.5rem] p-12 border-2 border-gray-200 shadow-sm text-center">
        <div className="text-6xl mb-6 animate-pulse">{phase === "analyzing" ? "🧠" : "💾"}</div>
        <h2 className="text-3xl font-black text-gray-900 mb-2">{phase === "analyzing" ? "AI is analyzing your words..." : "Saving valid rows to your library..."}</h2>
        <p className="text-gray-500 font-bold mb-8">{phase === "analyzing" ? "Please don't close this window." : "Only reviewed rows currently in the save list will be written."}</p>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8 text-left">
          <ImportCountCard label="Analyzed" value={analyzedCount} tone="blue" helper={`${parsedCount} uploaded`} />
          <ImportCountCard label="Ready To Save" value={readyToSaveCount} tone="emerald" />
          <ImportCountCard label="Skipped" value={skippedCount} tone="amber" />
          <ImportCountCard label="Failed" value={failedCount} tone="rose" />
        </div>

        <div className="flex justify-between items-end mb-3">
          <span className="text-sm font-black text-gray-400 uppercase tracking-widest">Progress</span>
          <span className="text-2xl font-black text-purple-600">{percentComplete}%</span>
        </div>
        <div className="h-4 bg-gray-100 rounded-full overflow-hidden border-2 border-gray-100 relative">
          <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500 ease-out" style={{ width: `${percentComplete}%` }} />
        </div>
        <p className="text-center text-xs font-bold text-gray-400 mt-3 uppercase tracking-widest">{progress.current} / {progress.total} Processed</p>
      </div>

      <LogSummaryPanel logs={logs} />
    </div>
  );
}

export function ImportReviewTable({
  analyzedData,
  onRemove,
  onEditChange,
}: {
  analyzedData: AnalyzedWord[];
  onRemove: (id: number) => void;
  onEditChange: (id: number, field: keyof AnalyzedWord, value: string) => void;
}) {
  return (
    <div className="bg-white rounded-[2rem] border-2 border-gray-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b-2 border-gray-100 bg-gray-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Save Preview</p>
          <p className="text-sm font-bold text-gray-500 mt-1">Everything shown below is editable and will be inserted on save.</p>
        </div>
        <span className="inline-flex items-center self-start sm:self-auto px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-black uppercase tracking-widest">
          Ready Rows: {analyzedData.length}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 border-b-2 border-gray-200">
            <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              <th className="p-4 w-10 text-center"></th>
              <th className="p-4 min-w-[100px]">Status</th>
              <th className="p-4 min-w-[150px]">Word</th>
              <th className="p-4 min-w-[150px]">Meaning</th>
              <th className="p-4 min-w-[120px]">POS</th>
              <th className="p-4 min-w-[120px]">Gender</th>
              <th className="p-4 min-w-[150px]">Root (Origin)</th>
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-gray-100">
            {analyzedData.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-10 text-center text-gray-400 font-bold">No words to import. (All duplicates or errors)</td>
              </tr>
            ) : (
              analyzedData.map((item) => (
                <tr key={item.id} className="hover:bg-blue-50/30 transition-colors group">
                  <td className="p-4 text-center">
                    <button onClick={() => onRemove(item.id)} className="text-gray-300 hover:text-red-500 transition-colors" title="Remove from import list">
                      ✖
                    </button>
                  </td>
                  <td className="p-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-black uppercase tracking-widest">
                      Ready
                    </span>
                  </td>
                  <td className="p-2">
                    <input type="text" value={item.word} onChange={(e) => onEditChange(item.id, "word", e.target.value)} className="w-full p-2 bg-transparent border-b-2 border-transparent focus:border-blue-400 outline-none font-bold text-gray-900 transition-colors" />
                  </td>
                  <td className="p-2">
                    <input type="text" value={item.translation} onChange={(e) => onEditChange(item.id, "translation", e.target.value)} className="w-full p-2 bg-transparent border-b-2 border-transparent focus:border-blue-400 outline-none font-bold text-blue-600 transition-colors" />
                  </td>
                  <td className="p-2">
                    <input type="text" value={item.part_of_speech} onChange={(e) => onEditChange(item.id, "part_of_speech", e.target.value)} className="w-full p-2 bg-transparent border-b-2 border-transparent focus:border-blue-400 outline-none text-sm font-medium text-gray-600 transition-colors" />
                  </td>
                  <td className="p-2">
                    <input type="text" value={item.gender} onChange={(e) => onEditChange(item.id, "gender", e.target.value)} className="w-full p-2 bg-transparent border-b-2 border-transparent focus:border-emerald-400 outline-none text-sm font-medium text-emerald-600 transition-colors" />
                  </td>
                  <td className="p-2">
                    <input type="text" value={item.root_word} onChange={(e) => onEditChange(item.id, "root_word", e.target.value)} className="w-full p-2 bg-transparent border-b-2 border-transparent focus:border-rose-400 outline-none text-sm font-medium text-rose-600 transition-colors" />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
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
    <div className="animate-in slide-in-from-bottom-8 duration-500">
      <header className="mb-8 flex flex-col lg:flex-row justify-between items-start gap-6">
        <div className="flex-1">
          <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-2 flex items-center gap-2"><span>👀</span> Review Required</p>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">AI Analysis Complete</h1>
          <p className="text-gray-500 font-medium mt-1">Review the valid rows below. Only the rows still listed here will be saved.</p>
        </div>

        <div className="w-full lg:w-auto flex flex-col items-stretch lg:items-end gap-3">
          <button onClick={onSave} disabled={analyzedData.length === 0} className="w-full sm:w-auto bg-gray-900 text-white font-black px-8 py-4 rounded-2xl hover:bg-black transition-all shadow-xl disabled:opacity-50">
            Save Valid Rows Only
          </button>
          <p className="text-xs font-bold text-gray-400">
            {readyToSaveCount > 0
              ? `${readyToSaveCount} reviewed row${readyToSaveCount !== 1 ? "s" : ""} will be saved.`
              : "There are no valid rows left to save."}
          </p>
        </div>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <ImportCountCard label="Analyzed" value={parsedCount} tone="blue" helper={fileName || undefined} />
        <ImportCountCard label="Ready To Save" value={readyToSaveCount} tone="emerald" helper="Rows in the review table" />
        <ImportCountCard label="Skipped" value={skippedCount} tone="amber" helper="Usually duplicates" />
        <ImportCountCard label="Failed" value={failedCount} tone="rose" helper="Needs retry or manual fix" />
      </div>

      {(skippedCount > 0 || failedCount > 0) && <div className="mb-8"><LogSummaryPanel logs={logs} /></div>}

      <ImportReviewTable analyzedData={analyzedData} onRemove={onRemove} onEditChange={onEditChange} />
    </div>
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
    <div className="bg-white rounded-[2.5rem] p-12 border-2 border-gray-200 shadow-sm text-center animate-in zoom-in-95 duration-500 mt-10">
      <div className="text-7xl mb-6">🎉</div>
      <h2 className="text-4xl font-black text-gray-900 mb-4">Import Successful!</h2>
      <p className="text-gray-500 font-bold mb-8 text-lg">Your vocabulary library has grown.</p>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8 text-left">
        <ImportCountCard label="Analyzed" value={parsedCount} tone="blue" />
        <ImportCountCard label="Saved" value={readyToSaveCount} tone="emerald" />
        <ImportCountCard label="Skipped" value={skippedCount} tone="amber" />
        <ImportCountCard label="Failed" value={failedCount} tone="rose" />
      </div>
      <div className="flex flex-col sm:flex-row justify-center gap-4">
        <button onClick={onReset} className="px-8 py-4 bg-gray-100 text-gray-600 font-black rounded-2xl hover:bg-gray-200 transition-colors">Import More</button>
        <Link href={`/study/${selectedLang}`} className="px-8 py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl hover:bg-blue-700 transition-colors">Go to Library</Link>
      </div>
    </div>
  );
}
