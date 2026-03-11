import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import type { AnalyzedWord } from "./types";

function getReviewStatus(item: AnalyzedWord) {
  if (item.ai_status === "needs_hint") {
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

function getSupportSummary(item: AnalyzedWord) {
  const hasExamples = Boolean(item.example_sentence.trim() && item.example_translation.trim());
  const hasRoot = Boolean(item.root_word.trim());
  const hasGender = Boolean(item.gender.trim());
  const hasConjugation = Boolean(item.conjugation.trim());

  const relevantChecks = [
    { label: "Examples", complete: hasExamples },
    { label: "Root", complete: hasRoot },
    ...(item.part_of_speech.trim() ? [{ label: "Gender", complete: hasGender }] : []),
    ...(item.part_of_speech.trim() ? [{ label: "Conjugation", complete: hasConjugation }] : []),
  ];

  const filteredChecks = relevantChecks.filter(({ label }) => {
    if (label === "Gender") return /noun/i.test(item.part_of_speech);
    if (label === "Conjugation") return /verb/i.test(item.part_of_speech);
    return true;
  });

  const completedCount = filteredChecks.filter((check) => check.complete).length;

  return {
    checks: filteredChecks,
    completedCount,
    totalCount: filteredChecks.length,
  };
}

export function ImportReviewTable({
  analyzedData,
  onRemove,
  onEditChange,
  onRerunRow,
  rerunningRowId = null,
  focusNeedsHintSignal = 0,
}: {
  analyzedData: AnalyzedWord[];
  onRemove: (id: number) => void;
  onEditChange: (id: number, field: keyof AnalyzedWord, value: string) => void;
  onRerunRow: (id: number) => void;
  rerunningRowId?: number | null;
  focusNeedsHintSignal?: number;
}) {
  const tableRef = useRef<HTMLDivElement | null>(null);
  const [showNeedsHintOnly, setShowNeedsHintOnly] = useState(false);
  const [expandedRows, setExpandedRows] = useState<number[]>([]);

  const rowsWithStatus = useMemo(
    () =>
      analyzedData.map((item) => ({
        item,
        status: getReviewStatus(item),
      })),
    [analyzedData]
  );

  const unresolvedRows = rowsWithStatus.filter(({ item }) => item.ai_status === "needs_hint");
  const displayedRows = showNeedsHintOnly ? unresolvedRows : rowsWithStatus;

  useEffect(() => {
    if (!focusNeedsHintSignal || unresolvedRows.length === 0) return;

    setShowNeedsHintOnly(true);

    requestAnimationFrame(() => {
      const firstUnresolvedRow = tableRef.current?.querySelector<HTMLTableRowElement>("[data-needs-hint='true']");
      firstUnresolvedRow?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }, [focusNeedsHintSignal, unresolvedRows.length]);

  useEffect(() => {
    if (showNeedsHintOnly && unresolvedRows.length === 0) {
      setShowNeedsHintOnly(false);
    }
  }, [showNeedsHintOnly, unresolvedRows.length]);

  const toggleExpandedRow = (id: number) => {
    setExpandedRows((current) => (current.includes(id) ? current.filter((rowId) => rowId !== id) : [...current, id]));
  };

  return (
    <div ref={tableRef} className="overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white/85 shadow-[0_22px_44px_-38px_rgba(15,23,42,0.2)]">
      <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50/80 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Save Preview</p>
          <p className="mt-1 text-sm font-bold text-slate-500">Everything shown below is editable. Only rows marked Ready will be inserted on save.</p>
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
              <div className="flex items-center gap-2">
                <span className="rounded-full border border-amber-200 bg-white/80 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-amber-700">
                  Focused view
                </span>
                <button
                  onClick={() => setShowNeedsHintOnly(false)}
                  className="rounded-full border border-amber-200 bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-amber-700 transition-colors hover:bg-amber-100"
                >
                  Show all rows
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead className="sticky top-0 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
            <tr className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              <th className="w-14 p-4 text-center"></th>
              <th className="min-w-[100px] p-4">Status</th>
              <th className="min-w-[150px] p-4">Word</th>
              <th className="min-w-[150px] p-4">Meaning</th>
              <th className="min-w-[120px] p-4">POS</th>
              <th className="min-w-[120px] p-4">Gender</th>
              <th className="min-w-[150px] p-4">Root (Origin)</th>
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
                const isNeedsHint = item.ai_status === "needs_hint";
                const isRerunning = rerunningRowId === item.id;
                const isExpanded = isNeedsHint || expandedRows.includes(item.id);
                const supportSummary = getSupportSummary(item);

                return (
                  <Fragment key={item.id}>
                    <tr
                      data-needs-hint={isNeedsHint ? "true" : "false"}
                      className={`group scroll-mt-32 transition-colors hover:bg-slate-50/80 ${isNeedsHint ? "bg-amber-50/45 ring-1 ring-inset ring-amber-100" : ""}`}
                    >
                      <td className="p-4 align-top">
                        <div className="flex flex-col items-center gap-2">
                          <button
                            onClick={() => toggleExpandedRow(item.id)}
                            className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-500 transition-colors hover:border-blue-200 hover:text-blue-700"
                            title={isExpanded ? "Collapse support details" : "Expand support details"}
                          >
                            {isExpanded ? "Hide" : "Details"}
                          </button>
                          <button onClick={() => onRemove(item.id)} className="text-slate-300 transition-colors hover:text-red-500" title="Remove from import list">
                            ✖
                          </button>
                        </div>
                      </td>
                      <td className="p-4 align-top">
                        <div className="space-y-2">
                          <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ${status.tone}`}>
                            {status.label}
                          </span>
                          {status.message && (
                            <p className="max-w-[14rem] text-[11px] font-medium leading-relaxed text-slate-500">{status.message}</p>
                          )}
                          <div className="pt-1">
                            <p className="support-label">Support fields</p>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {supportSummary.checks.map(({ label, complete }) => (
                                <span
                                  key={label}
                                  className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase tracking-widest ${
                                    complete
                                      ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                                      : "border-slate-200 bg-white text-slate-400"
                                  }`}
                                >
                                  {label}
                                </span>
                              ))}
                            </div>
                            {supportSummary.totalCount > 0 && (
                              <p className="mt-2 text-[11px] font-medium text-slate-400">
                                {supportSummary.completedCount} of {supportSummary.totalCount} key support fields filled
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-2 align-top">
                        <div>
                          <p className="px-2 text-[10px] font-black uppercase tracking-widest text-slate-300">Row {item.rowNumber}</p>
                          <input
                            type="text"
                            value={item.word}
                            onChange={(e) => onEditChange(item.id, "word", e.target.value)}
                            className="w-full border-b-2 border-transparent bg-transparent p-2 font-bold text-slate-950 outline-none transition-colors focus:border-blue-400"
                          />
                        </div>
                      </td>
                      <td className="p-2 align-top">
                        <input
                          type="text"
                          value={item.translation}
                          onChange={(e) => onEditChange(item.id, "translation", e.target.value)}
                          className="w-full border-b-2 border-transparent bg-transparent p-2 font-bold text-blue-600 outline-none transition-colors focus:border-blue-400"
                        />
                      </td>
                      <td className="p-2 align-top">
                        <input
                          type="text"
                          value={item.part_of_speech}
                          onChange={(e) => onEditChange(item.id, "part_of_speech", e.target.value)}
                          className="w-full border-b-2 border-transparent bg-transparent p-2 text-sm font-medium text-slate-600 outline-none transition-colors focus:border-blue-400"
                        />
                      </td>
                      <td className="p-2 align-top">
                        <input
                          type="text"
                          value={item.gender}
                          onChange={(e) => onEditChange(item.id, "gender", e.target.value)}
                          className="w-full border-b-2 border-transparent bg-transparent p-2 text-sm font-medium text-emerald-600 outline-none transition-colors focus:border-emerald-400"
                        />
                      </td>
                      <td className="p-2 align-top">
                        <input
                          type="text"
                          value={item.root_word}
                          onChange={(e) => onEditChange(item.id, "root_word", e.target.value)}
                          className="w-full border-b-2 border-transparent bg-transparent p-2 text-sm font-medium text-rose-600 outline-none transition-colors focus:border-rose-400"
                        />
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="border-b border-slate-100 bg-slate-50/35">
                        <td className="p-4"></td>
                        <td className="p-4 align-top" colSpan={6}>
                          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                            <div className="space-y-2">
                              <label className="support-label">Example sentence</label>
                              <textarea
                                value={item.example_sentence}
                                onChange={(e) => onEditChange(item.id, "example_sentence", e.target.value)}
                                rows={3}
                                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-950 outline-none transition-colors focus:border-blue-400"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="support-label">Example translation</label>
                              <textarea
                                value={item.example_translation}
                                onChange={(e) => onEditChange(item.id, "example_translation", e.target.value)}
                                rows={3}
                                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-950 outline-none transition-colors focus:border-blue-400"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="support-label">Verb type</label>
                              <input
                                type="text"
                                value={item.verb_type}
                                onChange={(e) => onEditChange(item.id, "verb_type", e.target.value)}
                                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-950 outline-none transition-colors focus:border-emerald-400"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="support-label">Conjugation</label>
                              <textarea
                                value={item.conjugation}
                                onChange={(e) => onEditChange(item.id, "conjugation", e.target.value)}
                                rows={4}
                                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-950 outline-none transition-colors focus:border-amber-400"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="support-label">Notes</label>
                              <textarea
                                value={item.notes}
                                onChange={(e) => onEditChange(item.id, "notes", e.target.value)}
                                rows={4}
                                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-950 outline-none transition-colors focus:border-slate-400"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="support-label">Category main</label>
                              <input
                                type="text"
                                value={item.category_main}
                                onChange={(e) => onEditChange(item.id, "category_main", e.target.value)}
                                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-950 outline-none transition-colors focus:border-purple-400"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="support-label">Category sub</label>
                              <input
                                type="text"
                                value={item.category_sub}
                                onChange={(e) => onEditChange(item.id, "category_sub", e.target.value)}
                                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-950 outline-none transition-colors focus:border-purple-400"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="support-label">Category sub sub</label>
                              <input
                                type="text"
                                value={item.category_sub_sub}
                                onChange={(e) => onEditChange(item.id, "category_sub_sub", e.target.value)}
                                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-950 outline-none transition-colors focus:border-purple-400"
                              />
                              <p className="text-[11px] font-medium text-slate-400">
                                Saved category id: {item.category_id || "Not matched"}
                              </p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                    {isNeedsHint && (
                      <tr className="border-b border-amber-100 bg-amber-50/25">
                        <td className="p-4"></td>
                        <td className="p-4 align-top" colSpan={6}>
                          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_13rem_auto] lg:items-end">
                            <div>
                              <label className="support-label text-amber-700">AI disambiguation hint</label>
                              <input
                                type="text"
                                value={item.ai_hint || ""}
                                onChange={(e) => onEditChange(item.id, "ai_hint", e.target.value)}
                                placeholder="Example: adjective — Italian nationality word"
                                className="mt-2 w-full rounded-2xl border border-amber-200 bg-white px-4 py-3 text-sm font-medium text-slate-950 outline-none transition-colors focus:border-amber-400"
                              />
                            </div>
                            <div>
                              <label className="support-label text-amber-700">Intended POS</label>
                              <input
                                type="text"
                                value={item.part_of_speech}
                                onChange={(e) => onEditChange(item.id, "part_of_speech", e.target.value)}
                                placeholder="Noun, Verb, Adjective..."
                                className="mt-2 w-full rounded-2xl border border-amber-200 bg-white px-4 py-3 text-sm font-medium text-slate-950 outline-none transition-colors focus:border-amber-400"
                              />
                            </div>
                            <button
                              onClick={() => onRerunRow(item.id)}
                              disabled={isRerunning}
                              className="rounded-2xl border border-amber-200 bg-white px-5 py-3 text-sm font-semibold text-amber-700 transition-colors hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {isRerunning ? "Re-running..." : "Re-run AI fill"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
