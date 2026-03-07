"use client";

export type DensityMode = "rich" | "compact";

type DensityToggleProps = {
  value: DensityMode;
  onChange: (mode: DensityMode) => void;
};

export default function DensityToggle({ value, onChange }: DensityToggleProps) {
  return (
    <div className="inline-flex items-center gap-1 rounded-2xl border-2 border-gray-200 bg-white p-1 shadow-sm">
      <button
        onClick={() => onChange("rich")}
        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
          value === "rich" ? "bg-gray-900 text-white" : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
        }`}
      >
        Rich
      </button>
      <button
        onClick={() => onChange("compact")}
        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
          value === "compact" ? "bg-blue-600 text-white" : "text-gray-500 hover:text-blue-600 hover:bg-blue-50"
        }`}
      >
        Compact
      </button>
    </div>
  );
}
