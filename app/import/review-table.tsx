import { useEffect, useMemo, useRef, useState } from "react";
import type { AnalyzedWord } from "./types";

function getReviewStatus(item: AnalyzedWord) {
  const hasRequiredFields = item.translation.trim() && item.part_of_speech.trim();

  if (!hasRequiredFields) {
    return {
      label: "Needs Hint",
      tone: "bg-amber-50 text-amber-700 border-amber-100",
      message: item.ai_message || "Add one clear part of speech and meaning so this becomes a single lexical entry.",
    };
  }

  return {
    label: "Ready",
    tone: "bg-emerald-50 text-emerald-700 border-emerald-100",
    message: "",
  };
}

export function ImportReviewTable({
  analyzedData,
  onRemove,
  onEditChange,
  focusNeedsHintSignal = 0,
}: {
  analyzedData: AnalyzedWord[];
  onRemove: (id: number) => void;
  onEditChange: (id: number, field: keyof AnalyzedWord, value: string) => void;
  focusNeedsHintSignal?: number;
}) {
  const tableRef = useRef<HTMLDivElement | null>(null);
  const [showNeedsHintOnly, setShowNeedsHintOnly] = useState(false);

  const rowsWithStatus = useMemo(
    () =>
      analyzedData.map((item) => ({
        item,
        status: getReviewStatus(item),
      })),
    [analyzedData]
  );

  const unresolvedRows = rowsWithStatus.filter(({ status }) => status.label === "Needs Hint");
  const displayedRows = showNeedsHintOnly ? unresolvedRows : rowsWithStatus;

  useEffect(() => {
    if (!focusNeedsHintSignal || unresolvedRows.length === 0) return;

    setShowNeedsHintOnly(true);

    requestAnimationFrame(() => {
      const firstUnresolvedRow = tableRef.current?.querySelector<HTMLTableRowElement>("[data-needs-hint='true']");
      firstUnresolvedRow?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }, [focusNeedsHintSignal, unresolvedRows.length]);

  return (
    <div ref={tableRef} className="overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white/85 shadow-[0_22px_44px_-38px_rgba(15,23,42,0.2)]">
      <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50/80 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Save Preview</p>
          <p className="mt-1 text-sm font-bold text-slate-500">Everything shown below is editable. Only rows with one clear POS and meaning will be inserted on save.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {unresolvedRows.length > 0 && (
            <button
              onClick={() => setShowNeedsHintOnly((current) => !current)}
              className={`inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest transition-colors ${
                showNeedsHintOnly
                  ? "border-amber-200 bg-amber-50 text-amber-700"
                  : "border-slate-200 bg-white text-slate-600 hover:border-amber-200 hover:text-amber-700"
              }`}
            >
              {showNeedsHintOnly ? "Show all rows" : `Needs Hint only (${unresolvedRows.length})`}
            </button>
          )}
          <span className="inline-flex items-center self-start rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-blue-700 sm:self-auto">
            Review Rows: {displayedRows.length}
          </span>
        </div>
      </div>
      {unresolvedRows.length > 0 && (
        <div className="border-b border-amber-100 bg-amber-50/65 px-6 py-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="support-label text-amber-600">Unresolved rows</p>
              <p className="mt-1 text-sm font-medium leading-relaxed text-amber-800">
                {unresolvedRows.length} row{unresolvedRows.length === 1 ? "" : "s"} still need one clear part of speech and meaning before save.
              </p>
            </div>
            {showNeedsHintOnly && (
              <span className="rounded-full border border-amber-200 bg-white/80 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-amber-700">
                Focused view
              </span>
            )}
          </div>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
            <tr className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              <th className="p-4 w-10 text-center"></th>
              <th className="p-4 min-w-[100px]">Status</th>
              <th className="p-4 min-w-[150px]">Word</th>
              <th className="p-4 min-w-[150px]">Meaning</th>
              <th className="p-4 min-w-[120px]">POS</th>
              <th className="p-4 min-w-[120px]">Gender</th>
              <th className="p-4 min-w-[150px]">Root (Origin)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {displayedRows.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-10 text-center font-bold text-slate-400">
                  {analyzedData.length === 0
                    ? "No words to import. (All duplicates or errors)"
                    : "No unresolved rows left in this filtered view."}
                </td>
              </tr>
            ) : (
              displayedRows.map(({ item, status }) => {
                const isNeedsHint = status.label === "Needs Hint";

                return (
                <tr
                  key={item.id}
                  data-needs-hint={isNeedsHint ? "true" : "false"}
                  className={`group scroll-mt-32 transition-colors hover:bg-slate-50/80 ${isNeedsHint ? "bg-amber-50/45 ring-1 ring-inset ring-amber-100" : ""}`}
                >
                  <td className="p-4 text-center">
                    <button onClick={() => onRemove(item.id)} className="text-slate-300 transition-colors hover:text-red-500" title="Remove from import list">
                      ✖
                    </button>
                  </td>
                  <td className="p-4">
                    <div className="space-y-2">
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ${status.tone}`}>
                        {status.label}
                      </span>
                      {status.message && (
                        <p className="max-w-[14rem] text-[11px] font-medium leading-relaxed text-slate-500">
                          {status.message}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="p-2">
                    <input type="text" value={item.word} onChange={(e) => onEditChange(item.id, "word", e.target.value)} className="w-full border-b-2 border-transparent bg-transparent p-2 font-bold text-slate-950 outline-none transition-colors focus:border-blue-400" />
                  </td>
                  <td className="p-2">
                    <input type="text" value={item.translation} onChange={(e) => onEditChange(item.id, "translation", e.target.value)} className="w-full border-b-2 border-transparent bg-transparent p-2 font-bold text-blue-600 outline-none transition-colors focus:border-blue-400" />
                  </td>
                  <td className="p-2">
                    <input type="text" value={item.part_of_speech} onChange={(e) => onEditChange(item.id, "part_of_speech", e.target.value)} className="w-full border-b-2 border-transparent bg-transparent p-2 text-sm font-medium text-slate-600 outline-none transition-colors focus:border-blue-400" />
                  </td>
                  <td className="p-2">
                    <input type="text" value={item.gender} onChange={(e) => onEditChange(item.id, "gender", e.target.value)} className="w-full border-b-2 border-transparent bg-transparent p-2 text-sm font-medium text-emerald-600 outline-none transition-colors focus:border-emerald-400" />
                  </td>
                  <td className="p-2">
                    <input type="text" value={item.root_word} onChange={(e) => onEditChange(item.id, "root_word", e.target.value)} className="w-full border-b-2 border-transparent bg-transparent p-2 text-sm font-medium text-rose-600 outline-none transition-colors focus:border-rose-400" />
                  </td>
                </tr>
              )})
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
