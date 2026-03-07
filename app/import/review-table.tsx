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
