import type { ImportLog, Phase } from "./types";

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
    gray: "bg-white/80 border-slate-200 text-slate-900",
    blue: "bg-blue-50/80 border-blue-100 text-blue-900",
    emerald: "bg-emerald-50/80 border-emerald-100 text-emerald-900",
    amber: "bg-amber-50/80 border-amber-100 text-amber-900",
    rose: "bg-rose-50/80 border-rose-100 text-rose-900",
  };

  return (
    <div className={`rounded-[1.35rem] border p-4 shadow-[0_12px_28px_-26px_rgba(15,23,42,0.14)] ${toneMap[tone]}`}>
      <p className="support-label opacity-60">{label}</p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
      {helper && <p className="mt-2 text-xs font-medium opacity-60">{helper}</p>}
    </div>
  );
}

const WIZARD_STEPS = [
  { title: "Upload", helper: "CSV" },
  { title: "Analyze", helper: "AI" },
  { title: "Review", helper: "Edit" },
  { title: "Save", helper: "Write" },
  { title: "Done", helper: "Finish" },
];

function getPhaseStepIndex(phase: Phase) {
  if (phase === "idle") return 0;
  if (phase === "analyzing") return 1;
  if (phase === "review") return 2;
  if (phase === "saving") return 3;
  return 4;
}

export function ImportPhaseBadge({ phase }: { phase: Phase }) {
  const labelMap: Record<Phase, string> = {
    idle: "Upload",
    analyzing: "Analyzing",
    review: "Review",
    saving: "Saving",
    done: "Done",
  };

  return (
    <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[11px] font-medium text-blue-600">
      {labelMap[phase]}
    </span>
  );
}

export function ImportWizardStepper({ phase }: { phase: Phase }) {
  const activeIndex = getPhaseStepIndex(phase);

  return (
    <div className="rounded-[1.75rem] border border-slate-200/75 bg-white/64 p-4 shadow-[0_14px_30px_-28px_rgba(15,23,42,0.14)] sm:p-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {WIZARD_STEPS.map((step, index) => {
          const isActive = index === activeIndex;
          const isComplete = index < activeIndex;

          return (
            <div
              key={step.title}
              className={`rounded-[1.35rem] border px-4 py-4 transition-all ${
                isActive
                  ? "border-blue-200 bg-blue-50/70 shadow-sm"
                  : isComplete
                    ? "border-emerald-200 bg-emerald-50/60"
                    : "border-slate-200 bg-white/60"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-black ${
                    isActive
                      ? "bg-blue-600 text-white"
                      : isComplete
                        ? "bg-emerald-500 text-white"
                        : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {isComplete ? "✓" : index + 1}
                </span>
                <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-slate-400">{step.helper}</span>
              </div>
              <p className="mt-3 text-base font-semibold text-slate-950">{step.title}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function LogStatusBadge({ status }: { status: ImportLog["status"] }) {
  const statusMap = {
    success: "bg-emerald-50 text-emerald-700 border-emerald-100",
    skipped: "bg-amber-50 text-amber-700 border-amber-100",
    error: "bg-rose-50 text-rose-700 border-rose-100",
    needs_hint: "bg-blue-50 text-blue-700 border-blue-100",
  };

  return <span className={`px-2.5 py-1 rounded-full border text-[10px] font-medium uppercase tracking-[0.12em] ${statusMap[status]}`}>{status}</span>;
}

export function LogSummaryPanel({
  logs,
  title = "Rows needing attention",
  description = "Recent activity in the import workflow.",
}: {
  logs: ImportLog[];
  title?: string;
  description?: string;
}) {
  if (logs.length === 0) return null;

  return (
    <div className="surface-muted rounded-[1.85rem] p-6 sm:p-7">
      <div className="flex items-center justify-between gap-4 mb-5">
        <div>
          <p className="mb-2 support-label">Activity log</p>
          <h3 className="text-xl font-semibold text-slate-950">{title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">{description}</p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">{logs.length}</span>
      </div>

      <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
        {logs.map((log, index) => (
          <div key={`${log.word}-${log.status}-${index}`} className="rounded-[1.35rem] border border-slate-200/80 bg-white/72 px-4 py-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="min-w-0">
                <p className="break-words font-semibold text-slate-950">{log.word}</p>
                <p className="mt-1 break-words text-sm text-slate-500">{log.message || "No additional detail."}</p>
              </div>
              <LogStatusBadge status={log.status} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
