import Link from "next/link";
import {
  WorkspaceEmptyState,
  WorkspaceHeader,
  WorkspacePanel,
  WorkspaceSelectionBar,
} from "@/app/components/workspace/VocabWorkspace";
import type { ActivitySummary, HabitNudge } from "@/app/lib/activity-summary";
import type { Language, VocabItem } from "@/app/lib/types";
import type { PosStat } from "./types";
import { FilterButton, ProgressBar, VocabItemCard } from "./primitives";

export function LanguageHubHero({
  language,
  activitySummary,
  globalPercentage,
  weakWordsCount,
  totalWords,
  doneForToday,
  onStartReview,
  onStartWeakPointReview,
  onOpenCustomModes,
}: {
  language: Language | null;
  activitySummary: ActivitySummary;
  globalPercentage: number;
  weakWordsCount: number;
  totalWords: number;
  doneForToday: boolean;
  onStartReview: () => void;
  onStartWeakPointReview: () => void;
  onOpenCustomModes: () => void;
}) {
  return (
    <section className="surface-hero overflow-hidden rounded-[2.5rem] p-6 sm:p-8 md:p-10">
      <div className="flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">
              Language Workspace
            </span>
            <span className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
              {language?.code || "language"}
            </span>
          </div>

          <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-start">
            <div className="text-6xl sm:text-7xl">{language?.emoji || "🌍"}</div>
            <div className="min-w-0">
              <h1 className="text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">{language?.name}</h1>
              <p className="mt-3 max-w-3xl text-sm font-medium leading-relaxed text-slate-600 sm:text-base">
                This is the focused workspace for {language?.name || "this language"}: start review, browse topics, and manage the active vocabulary list without leaving the language context.
              </p>
            </div>
          </div>
        </div>

        <div className="flex w-full flex-col gap-3 xl:w-auto xl:min-w-[20rem]">
          <button
            onClick={onStartReview}
            disabled={totalWords === 0}
            className="flex w-full items-center justify-center gap-3 rounded-[1.75rem] bg-blue-600 px-6 py-4 text-base font-black text-white shadow-[0_24px_50px_-26px_rgba(37,99,235,0.75)] transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="text-2xl">{doneForToday ? "✅" : "🚀"}</span>
            <span>{doneForToday ? "Done for Today" : "Start Today's Review"}</span>
          </button>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <button
              onClick={onOpenCustomModes}
              className="rounded-[1.5rem] border border-slate-200 bg-white px-5 py-4 text-left transition-colors hover:border-blue-200 hover:text-blue-600"
            >
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Study Setup</p>
              <p className="mt-1 text-sm font-black text-slate-950">Open custom modes</p>
            </button>
            {weakWordsCount > 0 && (
              <button
                onClick={onStartWeakPointReview}
                className="rounded-[1.5rem] border border-red-200 bg-red-50 px-5 py-4 text-left text-red-700 transition-colors hover:bg-red-100"
              >
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-red-500">Needs Focus</p>
                <p className="mt-1 text-sm font-black">
                  {weakWordsCount} weak point{weakWordsCount > 1 ? "s" : ""}
                </p>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        <div className="rounded-[1.5rem] border border-slate-200 bg-white/80 px-4 py-4">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Due Now</p>
          <p className="mt-2 text-3xl font-black text-slate-950">{activitySummary.dueTodayCount}</p>
        </div>
        <div className="rounded-[1.5rem] border border-slate-200 bg-white/80 px-4 py-4">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Weak Points</p>
          <p className="mt-2 text-3xl font-black text-slate-950">{weakWordsCount}</p>
        </div>
        <div className="rounded-[1.5rem] border border-slate-200 bg-white/80 px-4 py-4">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Mastery</p>
          <p className="mt-2 text-3xl font-black text-slate-950">{globalPercentage}%</p>
        </div>
      </div>
    </section>
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
    gray: "border-slate-200/80 bg-slate-100/80 text-slate-900",
    blue: "border-blue-100 bg-blue-50/90 text-blue-900",
    amber: "border-amber-100 bg-amber-50/90 text-amber-900",
    emerald: "border-emerald-100 bg-emerald-50/90 text-emerald-900",
  }[habitNudge.tone];

  return (
    <section className={`rounded-[2rem] border p-5 sm:p-6 ${habitToneClass}`}>
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] opacity-60">{habitNudge.eyebrow}</p>
          <h2 className="mt-2 text-xl font-black sm:text-2xl">{habitNudge.title}</h2>
          <p className="mt-2 text-sm font-medium opacity-70">{habitNudge.description}</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 min-w-0">
          <div className="rounded-[1.5rem] border border-white/70 bg-white/80 px-4 py-3">
            <p className="text-[10px] font-black uppercase tracking-widest opacity-50">Streak</p>
            <p className="text-2xl font-black mt-1">{activitySummary.streak}</p>
          </div>
          <div className="rounded-[1.5rem] border border-white/70 bg-white/80 px-4 py-3">
            <p className="text-[10px] font-black uppercase tracking-widest opacity-50">Due</p>
            <p className="text-2xl font-black mt-1">{activitySummary.dueTodayCount}</p>
          </div>
          <div className="rounded-[1.5rem] border border-white/70 bg-white/80 px-4 py-3">
            <p className="text-[10px] font-black uppercase tracking-widest opacity-50">Overdue</p>
            <p className="text-2xl font-black mt-1">{activitySummary.overdueCount}</p>
          </div>
          <div className="rounded-[1.5rem] border border-white/70 bg-white/80 px-4 py-3">
            <p className="text-[10px] font-black uppercase tracking-widest opacity-50">Last Active</p>
            <p className="text-base font-black mt-2">{activitySummary.lastActivityLabel || "Not yet"}</p>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 border-t border-black/5 pt-4 sm:flex-row sm:items-center sm:justify-between">
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
          className="w-full rounded-2xl border border-gray-200 bg-white px-5 py-3 font-black text-gray-900 transition-all hover:border-gray-400 disabled:opacity-50 sm:w-auto"
        >
          {activitySummary.doneToday ? "Optional Study Modes" : activitySummary.overdueCount > 0 ? "Start Recovery Review" : "Start Today's Review"}
        </button>
      </div>
    </section>
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
    <section className="surface-muted relative overflow-hidden rounded-[2rem] p-5 text-slate-950 sm:p-6">
      <div className="relative z-10 flex flex-col gap-5">
        <div className="flex items-start gap-4">
          <button onClick={() => onSpeak(randomWord.word)} className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.25rem] bg-indigo-50 text-3xl transition-all hover:bg-indigo-100 active:scale-90">
            🔊
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-indigo-500">Random Flashback</p>
            <h3 className="mt-2 truncate text-2xl font-black tracking-tight sm:text-3xl">{randomWord.word}</h3>
            <p className="mt-1 truncate text-base font-medium text-slate-600">{randomWord.translation}</p>
          </div>
        </div>
        <Link href={`/word/${randomWord.id}`} className="w-full rounded-[1.5rem] bg-indigo-600 px-5 py-3 text-center text-sm font-black text-white transition-all hover:bg-indigo-700 active:scale-95">
          Review Now
        </Link>
      </div>
      <div className="pointer-events-none absolute -bottom-12 -right-8 select-none text-[140px] font-black text-indigo-200/50">?</div>
    </section>
  );
}

export function LanguageProgressPanel({
  totalWords,
  masteredWords,
  globalPercentage,
  weakWordsCount,
  dueTodayCount,
  posStats,
}: {
  totalWords: number;
  masteredWords: number;
  globalPercentage: number;
  weakWordsCount: number;
  dueTodayCount: number;
  posStats: PosStat[];
}) {
  return (
    <section className="surface-muted rounded-[2rem] p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Workspace Snapshot</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Mastery and review mix</h2>
          <p className="mt-2 text-sm font-medium leading-relaxed text-slate-600">
            Keep the review queue, weak areas, and category coverage visible without turning the hub into a separate analytics page.
          </p>
        </div>
        <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-blue-600">
          {globalPercentage}% mastered
        </span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-[1.5rem] border border-slate-200 bg-white px-4 py-4">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Library</p>
          <p className="mt-2 text-3xl font-black text-slate-950">{totalWords}</p>
          <p className="mt-1 text-xs font-bold uppercase tracking-widest text-slate-400">total words</p>
        </div>
        <div className="rounded-[1.5rem] border border-slate-200 bg-white px-4 py-4">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Mastered</p>
          <p className="mt-2 text-3xl font-black text-slate-950">{masteredWords}</p>
          <p className="mt-1 text-xs font-bold uppercase tracking-widest text-slate-400">remembered now</p>
        </div>
        <div className="rounded-[1.5rem] border border-slate-200 bg-white px-4 py-4">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Attention</p>
          <p className="mt-2 text-3xl font-black text-slate-950">{weakWordsCount + dueTodayCount}</p>
          <p className="mt-1 text-xs font-bold uppercase tracking-widest text-slate-400">weak + due now</p>
        </div>
      </div>

      {posStats.length > 0 && (
        <div className="mt-6 border-t border-slate-200 pt-6">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Mastery by Category</h3>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{posStats.length} groups</span>
          </div>
          <div className="mt-5 space-y-4">
            {posStats.map((stat) => (
              <ProgressBar key={stat.name} stat={stat} />
            ))}
          </div>
        </div>
      )}
    </section>
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
