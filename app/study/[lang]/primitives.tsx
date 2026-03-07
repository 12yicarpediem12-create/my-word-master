import type { ReactNode } from "react";
import Link from "next/link";
import { WorkspaceChipButton } from "@/app/components/workspace/VocabWorkspace";
import type { VocabItem } from "@/app/lib/types";
import type { PosStat } from "./types";

type NavCardProps = {
  href: string;
  icon: string;
  subtitle: string;
  title: string;
  iconBg: string;
};

export function NavCard({ href, icon, subtitle, title, iconBg }: NavCardProps) {
  return (
    <Link
      href={href}
      className="group flex items-center justify-between rounded-[2rem] border border-slate-200/80 bg-white/75 p-5 transition-all hover:border-blue-200 hover:bg-white hover:shadow-[0_20px_40px_-30px_rgba(15,23,42,0.28)]"
    >
      <div className="flex items-center gap-5">
        <div className={`flex h-14 w-14 items-center justify-center rounded-[1.25rem] ${iconBg} text-3xl transition-transform group-hover:scale-105`}>{icon}</div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{subtitle}</p>
          <h2 className="mt-1 text-xl font-black tracking-tight text-slate-950">{title}</h2>
        </div>
      </div>
      <span className="mr-1 font-black text-slate-300 transition-colors group-hover:text-blue-500">→</span>
    </Link>
  );
}

export function ProgressBar({ stat }: { stat: PosStat }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-end">
        <span className="text-sm font-bold text-slate-700">{stat.name}</span>
        <span className="text-xs font-black text-slate-400">{stat.mastered} / {stat.total}</span>
      </div>
      <div className="relative h-3.5 overflow-hidden rounded-full border border-slate-100 bg-white">
        <div
          className={`h-full transition-all duration-1000 ease-in-out ${stat.percentage === 100 ? "bg-emerald-500" : "bg-blue-500"}`}
          style={{ width: `${stat.percentage}%` }}
        />
      </div>
    </div>
  );
}

type FilterButtonProps = {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
};

export function FilterButton({ active, onClick, children }: FilterButtonProps) {
  return <WorkspaceChipButton active={active} onClick={onClick}>{children}</WorkspaceChipButton>;
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
