import type { ImportLog } from "./types";

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
