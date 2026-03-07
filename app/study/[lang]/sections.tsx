import Link from "next/link";
import type { ActivitySummary, HabitNudge } from "@/app/lib/activity-summary";
import type { Language, VocabItem } from "@/app/lib/types";
import { FilterButton, VocabItemCard } from "./primitives";

export function LanguageHubHero({
  language,
  weakWordsCount,
  totalWords,
  doneForToday,
  onStartReview,
  onStartWeakPointReview,
}: {
  language: Language | null;
  weakWordsCount: number;
  totalWords: number;
  doneForToday: boolean;
  onStartReview: () => void;
  onStartWeakPointReview: () => void;
}) {
  return (
    <div className="bg-white rounded-[2.5rem] p-6 sm:p-8 md:p-10 border-2 border-gray-200 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-8 mb-8 relative overflow-hidden">
      <div className="flex flex-col sm:flex-row items-center text-center sm:text-left gap-4 sm:gap-6 z-10">
        <div className="text-7xl md:text-8xl">{language?.emoji}</div>
        <div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-gray-900 mb-2">{language?.name}</h1>
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Mastery Hub</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 z-10 w-full lg:w-auto shrink-0">
        {weakWordsCount > 0 && (
          <button
            onClick={onStartWeakPointReview}
            className="w-full sm:w-auto h-[80px] px-6 bg-red-50 text-red-600 font-black rounded-2xl border-2 border-red-200 hover:bg-red-100 hover:-translate-y-1 transition-all flex items-center justify-center gap-3 shadow-sm shrink-0"
          >
            <span className="text-3xl animate-pulse">🚨</span>
            <div className="text-left leading-tight whitespace-nowrap">
              <p className="text-[10px] uppercase tracking-widest opacity-80 mb-0.5">Needs Focus</p>
              <p className="text-lg">
                {weakWordsCount} Weak Point{weakWordsCount > 1 ? "s" : ""}
              </p>
            </div>
          </button>
        )}
        <button
          onClick={onStartReview}
          disabled={totalWords === 0}
          className="w-full sm:w-auto h-[80px] px-8 bg-blue-600 text-white font-black text-xl rounded-2xl shadow-xl hover:bg-blue-700 hover:-translate-y-1 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shrink-0 whitespace-nowrap"
        >
          <span className="text-3xl">{doneForToday ? "✅" : "🚀"}</span> <span>{doneForToday ? "Done for Today" : "Start Today&apos;s Review"}</span>
        </button>
      </div>
    </div>
  );
}

export function LanguageHabitPanel({
  activitySummary,
  habitNudge,
  quickRecoverySize,
  totalWords,
  onStartReview,
}: {
  activitySummary: ActivitySummary;
  habitNudge: HabitNudge;
  quickRecoverySize: number;
  totalWords: number;
  onStartReview: () => void;
}) {
  const habitToneClass = {
    gray: "bg-gray-50 border-gray-100 text-gray-900",
    blue: "bg-blue-50 border-blue-100 text-blue-900",
    amber: "bg-amber-50 border-amber-100 text-amber-900",
    emerald: "bg-emerald-50 border-emerald-100 text-emerald-900",
  }[habitNudge.tone];

  return (
    <div className={`mb-8 rounded-[2rem] border-2 p-5 sm:p-6 ${habitToneClass}`}>
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest opacity-60">{habitNudge.eyebrow}</p>
          <h2 className="text-xl sm:text-2xl font-black mt-2">{habitNudge.title}</h2>
          <p className="text-sm font-medium opacity-70 mt-2">{habitNudge.description}</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 min-w-0">
          <div className="rounded-2xl bg-white/80 border border-white/70 px-4 py-3">
            <p className="text-[10px] font-black uppercase tracking-widest opacity-50">Streak</p>
            <p className="text-2xl font-black mt-1">{activitySummary.streak}</p>
          </div>
          <div className="rounded-2xl bg-white/80 border border-white/70 px-4 py-3">
            <p className="text-[10px] font-black uppercase tracking-widest opacity-50">Due</p>
            <p className="text-2xl font-black mt-1">{activitySummary.dueTodayCount}</p>
          </div>
          <div className="rounded-2xl bg-white/80 border border-white/70 px-4 py-3">
            <p className="text-[10px] font-black uppercase tracking-widest opacity-50">Overdue</p>
            <p className="text-2xl font-black mt-1">{activitySummary.overdueCount}</p>
          </div>
          <div className="rounded-2xl bg-white/80 border border-white/70 px-4 py-3">
            <p className="text-[10px] font-black uppercase tracking-widest opacity-50">Last Active</p>
            <p className="text-base font-black mt-2">{activitySummary.lastActivityLabel || "Not yet"}</p>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 border-t border-black/5">
        <p className="text-sm font-bold opacity-70">
          {activitySummary.overdueCount > 0
            ? `Try a ${quickRecoverySize}-card recovery run first to make tomorrow easier.`
            : activitySummary.dueTodayCount > 0
              ? `A short ${Math.min(activitySummary.dueTodayCount, 15)}-card review is enough for today.`
              : "You are mostly caught up. A small check-in keeps the rhythm warm."}
        </p>
        <button
          onClick={onStartReview}
          disabled={totalWords === 0}
          className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-white text-gray-900 border border-gray-200 font-black hover:border-gray-400 transition-all disabled:opacity-50"
        >
          {activitySummary.doneToday ? "Optional Study Modes" : activitySummary.overdueCount > 0 ? "Start Recovery Review" : "Start Today&apos;s Review"}
        </button>
      </div>
    </div>
  );
}

export function RandomFlashbackCard({
  randomWord,
  onSpeak,
}: {
  randomWord: VocabItem | null;
  onSpeak: (text: string) => void;
}) {
  if (!randomWord) return null;

  return (
    <div className="mb-12 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden group">
      <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6 text-center md:text-left">
        <div className="flex flex-col sm:flex-row items-center gap-6 w-full">
          <button onClick={() => onSpeak(randomWord.word)} className="w-16 h-16 bg-white/20 hover:bg-white/30 rounded-2xl flex items-center justify-center text-3xl transition-all active:scale-90 shrink-0">
            🔊
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-black uppercase tracking-widest opacity-70 mb-2">Random Flashback</p>
            <h3 className="text-3xl sm:text-4xl font-black mb-1 truncate">{randomWord.word}</h3>
            <p className="text-lg sm:text-xl opacity-90 font-medium truncate">{randomWord.translation}</p>
          </div>
        </div>
        <Link href={`/word/${randomWord.id}`} className="w-full md:w-auto bg-white text-indigo-600 px-8 py-4 rounded-2xl font-bold hover:bg-gray-100 transition-all shadow-lg active:scale-95 whitespace-nowrap text-center">
          Review Now
        </Link>
      </div>
      <div className="absolute -bottom-10 -right-10 text-[200px] font-black opacity-10 select-none group-hover:scale-110 transition-transform pointer-events-none">?</div>
    </div>
  );
}

export function VocabFilterToolbar({
  activeFilter,
  dynamicPosList,
  filteredCount,
  selectedCount,
  allSelected,
  onFilterChange,
  onToggleSelectAll,
  onClearSelection,
}: {
  activeFilter: string;
  dynamicPosList: string[];
  filteredCount: number;
  selectedCount: number;
  allSelected: boolean;
  onFilterChange: (filter: string) => void;
  onToggleSelectAll: () => void;
  onClearSelection: () => void;
}) {
  return (
    <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div className="overflow-x-auto pb-2 scrollbar-hide w-full sm:w-auto">
        <div className="flex gap-3">
          <button
            onClick={() => onFilterChange("All")}
            className={`px-6 py-3 rounded-2xl font-bold whitespace-nowrap transition-all border-2 ${activeFilter === "All" ? "bg-gray-900 border-gray-900 text-white shadow-lg" : "bg-white border-gray-200 text-gray-500 hover:border-gray-900"}`}
          >
            All
          </button>
          {dynamicPosList.map((pos) => (
            <FilterButton key={pos} active={activeFilter === pos} onClick={() => onFilterChange(pos)}>
              {pos}
            </FilterButton>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {filteredCount > 0 && (
          <button
            onClick={onToggleSelectAll}
            className="text-[10px] font-black text-gray-500 hover:text-gray-900 bg-white border-2 border-gray-200 px-4 py-3 rounded-xl uppercase tracking-widest transition-all shadow-sm active:scale-95"
          >
            {allSelected ? "Deselect All" : "Select All"}
          </button>
        )}
        {selectedCount > 0 && (
          <button onClick={onClearSelection} className="text-[10px] font-bold text-gray-400 hover:text-gray-700 bg-gray-200/50 px-4 py-3 rounded-xl uppercase tracking-widest transition-colors shrink-0">
            Clear
          </button>
        )}
      </div>
    </div>
  );
}

export function VocabListSection({
  vocabList,
  activeFilter,
  selectedIds,
  onToggleSelection,
  onSpeak,
}: {
  vocabList: VocabItem[];
  activeFilter: string;
  selectedIds: string[];
  onToggleSelection: (id: string) => void;
  onSpeak: (text: string) => void;
}) {
  return (
    <div className="bg-white rounded-3xl border-2 border-gray-200 shadow-sm overflow-hidden mb-12">
      {vocabList.length > 0 ? (
        <div className="divide-y-2 divide-gray-100">
          {vocabList.map((vocab) => (
            <VocabItemCard
              key={vocab.id}
              vocab={vocab}
              isWeak={(vocab.mistake_count || 0) > 0}
              onSpeak={onSpeak}
              isSelected={selectedIds.includes(vocab.id)}
              onToggle={onToggleSelection}
            />
          ))}
        </div>
      ) : (
        <div className="p-20 text-center text-gray-400 font-bold uppercase tracking-widest">No {activeFilter}s found.</div>
      )}
    </div>
  );
}

export function SelectionActionBar({
  selectedCount,
  isDeleting,
  onDelete,
}: {
  selectedCount: number;
  isDeleting: boolean;
  onDelete: () => void;
}) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-10 left-1/2 transform -translate-x-1/2 bg-gray-900/95 backdrop-blur-md text-white px-6 sm:px-10 py-5 rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] flex items-center gap-6 sm:gap-10 z-50 border border-gray-700 animate-in slide-in-from-bottom-20 duration-500">
      <div className="flex flex-col">
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Selected</span>
        <span className="text-xl sm:text-2xl font-black tracking-tight">
          {selectedCount} <span className="text-base text-gray-400 font-bold">words</span>
        </span>
      </div>

      <div className="w-px h-10 bg-gray-700"></div>

      <button
        onClick={onDelete}
        disabled={isDeleting}
        className="bg-red-500 hover:bg-red-600 text-white font-black px-6 sm:px-8 py-3 rounded-2xl transition-all shadow-lg shadow-red-500/30 disabled:opacity-50 flex items-center gap-2"
      >
        {isDeleting ? "Deleting..." : "🗑️ Delete All"}
      </button>
    </div>
  );
}
