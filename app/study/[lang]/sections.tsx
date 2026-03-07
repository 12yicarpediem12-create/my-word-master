import Link from "next/link";
import {
  WorkspaceEmptyState,
  WorkspaceHeader,
  WorkspacePanel,
  WorkspaceSelectionBar,
} from "@/app/components/workspace/VocabWorkspace";
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
    <div className="surface-card mb-12 relative overflow-hidden rounded-3xl bg-[linear-gradient(145deg,rgba(255,255,255,0.99),rgba(238,242,255,0.95))] p-6 text-slate-950 shadow-[0_24px_50px_-34px_rgba(79,70,229,0.35)] group sm:p-8">
      <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6 text-center md:text-left">
        <div className="flex flex-col sm:flex-row items-center gap-6 w-full">
          <button onClick={() => onSpeak(randomWord.word)} className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-3xl transition-all hover:bg-indigo-100 active:scale-90">
            🔊
          </button>
          <div className="flex-1 min-w-0">
            <p className="mb-2 text-xs font-black uppercase tracking-widest text-indigo-500">Random Flashback</p>
            <h3 className="text-3xl sm:text-4xl font-black mb-1 truncate">{randomWord.word}</h3>
            <p className="truncate text-lg font-medium text-slate-600 sm:text-xl">{randomWord.translation}</p>
          </div>
        </div>
        <Link href={`/word/${randomWord.id}`} className="w-full whitespace-nowrap rounded-2xl bg-indigo-600 px-8 py-4 text-center font-bold text-white transition-all hover:bg-indigo-700 active:scale-95 md:w-auto">
          Review Now
        </Link>
      </div>
      <div className="pointer-events-none absolute -bottom-10 -right-10 select-none text-[200px] font-black text-indigo-200/60 transition-transform group-hover:scale-110">?</div>
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
    <WorkspacePanel className="mb-5 p-5 sm:p-6">
      <WorkspaceHeader
        eyebrow="Vocabulary Workspace"
        title="Study list"
        description={`${filteredCount} word${filteredCount !== 1 ? "s" : ""} in ${activeFilter === "All" ? "your current workspace" : activeFilter}.`}
        actions={
          <>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-500">
              {selectedCount} selected
            </span>
            {filteredCount > 0 && (
              <button
                onClick={onToggleSelectAll}
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 shadow-sm transition-all hover:text-slate-900 active:scale-95"
              >
                {allSelected ? "Deselect All" : "Select All"}
              </button>
            )}
            {selectedCount > 0 && (
              <button onClick={onClearSelection} className="rounded-xl border border-slate-200 bg-slate-100/90 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 transition-colors hover:text-slate-900">
                Clear
              </button>
            )}
          </>
        }
      />

      <div className="mt-5 overflow-x-auto pb-2 scrollbar-hide">
        <div className="flex gap-3">
          <button
            onClick={() => onFilterChange("All")}
            className={`rounded-2xl px-6 py-3 font-bold whitespace-nowrap transition-all border ${activeFilter === "All" ? "bg-slate-950 border-slate-950 text-white shadow-lg" : "bg-white border-slate-200 text-slate-600 hover:border-slate-950"}`}
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
    </WorkspacePanel>
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
    <WorkspacePanel className="mb-12 overflow-hidden rounded-3xl">
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
        <WorkspaceEmptyState
          icon="📚"
          title="No words found"
          description={`No ${activeFilter === "All" ? "words" : activeFilter.toLowerCase()} found in this workspace.`}
          className="rounded-none border-0 shadow-none"
        />
      )}
    </WorkspacePanel>
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
    <WorkspaceSelectionBar
      selectedCount={selectedCount}
      isBusy={isDeleting}
      busyLabel="Deleting..."
      actionLabel="🗑️ Delete All"
      onAction={onDelete}
    />
  );
}
