import type { AnalyzedWord } from "./types";

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
    <div className="surface-card overflow-hidden rounded-[2rem]">
      <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50/90 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Save Preview</p>
          <p className="mt-1 text-sm font-bold text-slate-500">Everything shown below is editable and will be inserted on save.</p>
        </div>
        <span className="inline-flex items-center self-start rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-700 sm:self-auto">
          Ready Rows: {analyzedData.length}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 bg-slate-50/95 border-b border-slate-200 backdrop-blur-sm">
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
            {analyzedData.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-10 text-center font-bold text-slate-400">No words to import. (All duplicates or errors)</td>
              </tr>
            ) : (
              analyzedData.map((item) => (
                <tr key={item.id} className="group transition-colors hover:bg-blue-50/30">
                  <td className="p-4 text-center">
                    <button onClick={() => onRemove(item.id)} className="text-slate-300 transition-colors hover:text-red-500" title="Remove from import list">
                      ✖
                    </button>
                  </td>
                  <td className="p-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-black uppercase tracking-widest">
                      Ready
                    </span>
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
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
