import Link from "next/link";
import type { VocabItem } from "@/app/lib/types";

type NavCardProps = {
  href: string;
  icon: string;
  subtitle: string;
  title: string;
  iconBg: string;
};

export function NavCard({ href, icon, subtitle, title, iconBg }: NavCardProps) {
  return (
    <Link href={href} className="flex items-center justify-between bg-white border-2 border-gray-200 p-6 rounded-[2rem] hover:border-blue-500 hover:shadow-lg transition-all group">
      <div className="flex items-center gap-5">
        <div className={`w-14 h-14 ${iconBg} rounded-2xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform`}>{icon}</div>
        <div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{subtitle}</p>
          <h2 className="text-xl font-black text-gray-900">{title}</h2>
        </div>
      </div>
      <span className="text-gray-300 font-black group-hover:text-blue-500 transition-colors mr-2">→</span>
    </Link>
  );
}

type StatCircleProps = { percentage: number; mastered: number; total: number };

export function StatCircle({ percentage, mastered, total }: StatCircleProps) {
  return (
    <div className="lg:col-span-1 bg-white rounded-3xl p-8 border-2 border-gray-200 flex flex-col items-center justify-center shadow-sm h-full">
      <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6 text-center">Overall Mastery</h3>
      <div className="relative w-40 h-40 flex items-center justify-center">
        <svg className="transform -rotate-90 w-40 h-40">
          <circle cx="80" cy="80" r="65" stroke="#f3f4f6" strokeWidth="14" fill="none" />
          <circle cx="80" cy="80" r="65" stroke="#2563eb" strokeWidth="14" fill="none" strokeDasharray={408} strokeDashoffset={408 - (percentage / 100) * 408} className="transition-all duration-1000 ease-out" strokeLinecap="round" />
        </svg>
        <div className="absolute flex flex-col items-center justify-center mt-1">
          <span className="text-3xl font-black leading-none">{percentage}%</span>
          <span className="text-[10px] font-bold text-gray-400 uppercase mt-1">{mastered} / {total}</span>
        </div>
      </div>
    </div>
  );
}

export type PosStat = { name: string; mastered: number; total: number; percentage: number };

export function ProgressBar({ stat }: { stat: PosStat }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-end">
        <span className="text-sm font-bold text-gray-700">{stat.name}</span>
        <span className="text-xs font-black text-gray-400">{stat.mastered} / {stat.total}</span>
      </div>
      <div className="h-4 bg-gray-100 rounded-full overflow-hidden border border-gray-100 relative">
        <div className={`h-full transition-all duration-1000 ease-in-out ${stat.percentage === 100 ? "bg-green-500" : "bg-blue-500"}`} style={{ width: `${stat.percentage}%` }} />
      </div>
    </div>
  );
}

type FilterButtonProps = { active: boolean; onClick: () => void; children: React.ReactNode };

export function FilterButton({ active, onClick, children }: FilterButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`px-6 py-3 rounded-2xl font-bold whitespace-nowrap transition-all border-2 ${active ? "bg-blue-600 border-blue-600 text-white shadow-lg" : "bg-white border-gray-200 text-gray-500 hover:border-blue-600 hover:text-blue-600"}`}
    >
      {children}
    </button>
  );
}

type VocabItemCardProps = {
  vocab: VocabItem;
  isWeak: boolean;
  onSpeak: (text: string) => void;
  isSelected: boolean;
  onToggle: (id: string) => void;
};

export function VocabItemCard({ vocab, isWeak, onSpeak, isSelected, onToggle }: VocabItemCardProps) {
  return (
    <div className={`p-6 transition-colors flex flex-col sm:flex-row sm:items-center justify-between group gap-4 relative ${isSelected ? "bg-red-50/40" : "hover:bg-gray-50"}`}>
      <div className="flex items-start sm:items-center gap-4 sm:gap-5">
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggle(vocab.id);
          }}
          className={`mt-1 sm:mt-0 shrink-0 z-20 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all shadow-sm ${
            isSelected ? "bg-red-500 border-red-500 text-white shadow-red-200" : "bg-white border-gray-300 text-transparent hover:border-red-300 hover:shadow-md"
          }`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </button>

        <span className={`hidden sm:block w-3 h-3 rounded-full shrink-0 ${vocab.is_remembered ? "bg-green-400" : "bg-orange-400"}`}></span>

        <div>
          <Link href={`/word/${vocab.id}`} className="block">
            <div className="flex items-center gap-2 flex-wrap">
              <p className={`text-xl font-black transition-colors ${isSelected ? "text-red-700" : "text-gray-900 group-hover:text-blue-600"}`}>{vocab.word}</p>
              {isWeak && !vocab.is_remembered && <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">Weak</span>}
            </div>
            <p className="text-sm font-medium text-gray-500 mt-1">{vocab.translation}</p>
          </Link>
          <div className="flex flex-wrap gap-2 mt-3 sm:mt-2">
            {vocab.gender && <span className="text-[9px] font-black bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-md uppercase tracking-wider border border-emerald-100">{vocab.gender}</span>}
            {vocab.verb_type && <span className="text-[9px] font-black bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-md uppercase tracking-wider border border-emerald-100">{vocab.verb_type}</span>}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 self-end sm:self-auto pl-10 sm:pl-0">
        <button onClick={() => onSpeak(vocab.word)} className="p-3 bg-gray-50 hover:bg-blue-50 text-gray-400 hover:text-blue-600 rounded-xl transition-all active:scale-90">🔊</button>
        <span className="hidden sm:inline-block text-[10px] font-bold bg-gray-100 text-gray-400 px-3 py-1 rounded-full uppercase tracking-widest">{vocab.part_of_speech || "N/A"}</span>
        <span className="text-2xl">{vocab.is_remembered ? "✅" : "🔥"}</span>
      </div>
    </div>
  );
}
