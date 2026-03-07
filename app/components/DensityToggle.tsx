"use client";

export type DensityMode = "rich" | "compact";

type DensityToggleProps = {
  value: DensityMode;
  onChange: (mode: DensityMode) => void;
};

export default function DensityToggle({ value, onChange }: DensityToggleProps) {
  return (
    <div className="inline-flex items-center gap-1 rounded-2xl border border-slate-200 bg-white/85 p-1 shadow-sm backdrop-blur-sm">
      <button
        onClick={() => onChange("rich")}
        className={`rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${
          value === "rich" ? "bg-slate-950 text-white" : "text-slate-500 hover:bg-slate-100 hover:text-slate-950"
        }`}
      >
        Rich
      </button>
      <button
        onClick={() => onChange("compact")}
        className={`rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${
          value === "compact" ? "bg-blue-600 text-white" : "text-slate-500 hover:bg-blue-50 hover:text-blue-600"
        }`}
      >
        Compact
      </button>
    </div>
  );
}
