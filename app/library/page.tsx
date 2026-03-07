"use client";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { bulkDeleteVocab } from "../actions/vocab";
import AppHeader from "../components/AppHeader";
import DensityToggle, { type DensityMode } from "../components/DensityToggle";
import { AppMain, AppShell, PageIntro } from "../components/layout/AppShell";
import {
  WorkspaceChipButton,
  WorkspaceEmptyState,
  WorkspaceFilterGroup,
  WorkspaceHeader,
  WorkspacePanel,
  WorkspaceSelectionBar,
  WorkspaceUtilityPanel,
} from "../components/workspace/VocabWorkspace";
import { getSupabaseBrowserClient } from "../lib/supabase-browser";

const supabase = getSupabaseBrowserClient();

const VocabCard = ({ v, isSelected, onToggle }: { v: any, isSelected: boolean, onToggle: (id: string) => void }) => (
  <div className={`relative h-full transition-all duration-300 ${isSelected ? "scale-[1.02]" : ""}`}>
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onToggle(v.id);
      }}
      className={`absolute top-5 left-5 z-20 w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all shadow-sm ${
        isSelected 
          ? "bg-red-500 border-red-500 text-white shadow-red-200" 
          : "bg-white border-gray-200 text-transparent hover:border-red-300 hover:shadow-md"
      }`}
    >
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
      </svg>
    </button>

    <Link href={`/word/${v.id}`} className="group block h-full">
      <div className={`rounded-[2rem] border bg-white/80 pt-16 px-6 pb-6 h-full flex flex-col relative overflow-hidden transition-all duration-300 ${
        isSelected ? "border-red-400 ring-4 ring-red-50" : "border-slate-200/80 hover:border-blue-300 hover:bg-white hover:shadow-[0_22px_42px_-34px_rgba(15,23,42,0.3)]"
      }`}>
        <div className="absolute top-6 right-6 text-2xl group-hover:scale-110 transition-transform">
          {v.is_remembered ? "✅" : "🔥"}
        </div>
        <div className="flex items-center gap-2 mb-4">
          <span className="bg-gray-100 text-gray-500 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
            {v.language_code}
          </span>
          <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">
            {v.part_of_speech || "Word"}
          </span>
        </div>
        <h2 className={`text-3xl font-black tracking-tight mb-1 break-words transition-colors ${isSelected ? "text-red-600" : "text-gray-900 group-hover:text-blue-600"}`}>
          {v.word}
        </h2>
        <p className="text-gray-500 font-bold text-lg mb-6">{v.translation}</p>
        <div className="mt-auto flex flex-wrap gap-2">
          {v.gender && (
            <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] font-black px-3 py-1 rounded-xl uppercase tracking-widest">
              {v.gender}
            </span>
          )}
          {v.verb_type && (
            <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] font-black px-3 py-1 rounded-xl uppercase tracking-widest">
              {v.verb_type}
            </span>
          )}
          {v.category && v.category !== "Other" && (
            <span className="bg-indigo-50 text-indigo-600 border border-indigo-100 text-[10px] font-black px-3 py-1 rounded-xl uppercase tracking-widest">
              {v.category}
            </span>
          )}
        </div>
      </div>
    </Link>
  </div>
);

const CompactVocabRow = ({ v, isSelected, onToggle }: { v: any, isSelected: boolean, onToggle: (id: string) => void }) => (
  <div className={`relative rounded-[1.75rem] border bg-white/85 transition-all ${isSelected ? "border-red-300 bg-red-50/50" : "border-slate-200/80 hover:border-blue-200 hover:bg-white"}`}>
    <button
      onClick={() => onToggle(v.id)}
      className={`absolute left-4 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-xl border-2 flex items-center justify-center transition-all ${
        isSelected
          ? "bg-red-500 border-red-500 text-white shadow-sm"
          : "bg-white border-gray-200 text-gray-300 hover:border-red-300"
      }`}
      aria-label={isSelected ? "Deselect word" : "Select word"}
    >
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
      </svg>
    </button>

    <Link href={`/word/${v.id}`} className="block pl-16 sm:pl-20 pr-5 py-4 sm:py-5">
      <div className="flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="bg-gray-100 text-gray-500 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest">
              {v.language_code}
            </span>
            <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest border ${v.is_remembered ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-orange-50 text-orange-600 border-orange-100"}`}>
              {v.is_remembered ? "Mastered" : "Learning"}
            </span>
            {v.part_of_speech && (
              <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">
                {v.part_of_speech}
              </span>
            )}
          </div>
          <div className="mt-2 flex flex-col sm:flex-row sm:items-baseline sm:gap-3">
            <p className="text-lg sm:text-xl font-black text-gray-900 break-words">{v.word}</p>
            <p className="text-sm sm:text-base font-bold text-gray-500 break-words">{v.translation}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap lg:justify-end">
          {v.gender && (
            <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] font-black px-3 py-1 rounded-xl uppercase tracking-widest">
              {v.gender}
            </span>
          )}
          {v.verb_type && (
            <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] font-black px-3 py-1 rounded-xl uppercase tracking-widest">
              {v.verb_type}
            </span>
          )}
          <span className="text-gray-300 font-black text-sm uppercase tracking-widest">Open →</span>
        </div>
      </div>
    </Link>
  </div>
);

export default function LibraryPage() {
  const [vocab, setVocab] = useState<any[]>([]);
  const [languages, setLanguages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLang, setSelectedLang] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [densityMode, setDensityMode] = useState<DensityMode>("rich");

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      const [{ data: langs }, { data: words }] = await Promise.all([
        supabase.from("languages").select("*"),
        supabase
          .from("vocab")
          .select("id, language_code, word, translation, part_of_speech, gender, verb_type, is_remembered")
          .order("created_at", { ascending: false })
      ]);
      
      if (langs) setLanguages(langs);
      if (words) setVocab(words);
      setIsLoading(false);
    }
    fetchData();
  }, []);

  const filteredVocab = useMemo(() => {
    return vocab.filter(v => {
      const matchLang = selectedLang === "all" || v.language_code === selectedLang;
      const matchStatus = filterStatus === "all" 
        ? true 
        : filterStatus === "mastered" ? v.is_remembered : !v.is_remembered;
      return matchLang && matchStatus;
    });
  }, [vocab, selectedLang, filterStatus]);

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredVocab.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredVocab.map(v => v.id));
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${selectedIds.length} words? This action cannot be undone.`)) return;
    
    setIsDeleting(true);
    setErrorMsg(null);
    const { error } = await bulkDeleteVocab(selectedIds);

    if (!error) {
      setVocab(prev => prev.filter(v => !selectedIds.includes(v.id)));
      setSelectedIds([]);
    } else {
      setErrorMsg("Error deleting words: " + error);
    }
    setIsDeleting(false);
  };

  return (
    <AppShell className="pb-32 relative">
      <AppHeader primarySection="library" backHref="/" backLabel="Dashboard" />

      <AppMain width="xl" className="section-stack">
        {errorMsg && <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 text-red-600 font-bold rounded-2xl">{errorMsg}</div>}
        <PageIntro
          eyebrow="Learning Workspace"
          title="Library workspace"
          description={`Browse, filter, and maintain ${vocab.length} word${vocab.length !== 1 ? "s" : ""} across your languages.`}
          actions={undefined}
        />

        <WorkspacePanel tone="open">
          <WorkspaceHeader
            eyebrow="Vocabulary Workspace"
            title="Workspace controls"
            description={`${filteredVocab.length} word${filteredVocab.length !== 1 ? "s" : ""} match your current library filters.`}
            actions={
              <>
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-500">
                  {selectedIds.length} selected
                </span>
                {filteredVocab.length > 0 && (
                  <button
                    onClick={handleSelectAll}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 shadow-sm transition-all hover:text-slate-900 active:scale-95"
                  >
                    {selectedIds.length === filteredVocab.length ? "Deselect All" : "Select All"}
                  </button>
                )}
                {selectedIds.length > 0 && (
                  <button
                    onClick={() => setSelectedIds([])}
                    className="rounded-xl border border-slate-200 bg-slate-100/90 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 transition-colors hover:text-slate-900"
                  >
                    Clear
                  </button>
                )}
              </>
            }
          />

          <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
            <div className="space-y-5">
              <WorkspaceFilterGroup label="Language">
                  <WorkspaceChipButton active={selectedLang === "all"} onClick={() => setSelectedLang("all")}>
                    🌍 All
                  </WorkspaceChipButton>
                  {languages.map(lang => (
                    <WorkspaceChipButton key={lang.code} active={selectedLang === lang.code} onClick={() => setSelectedLang(lang.code)}>
                      <span>{lang.emoji}</span> {lang.name}
                    </WorkspaceChipButton>
                  ))}
              </WorkspaceFilterGroup>

              <WorkspaceFilterGroup label="Status">
                  <WorkspaceChipButton
                    active={filterStatus === "all"}
                    onClick={() => setFilterStatus("all")}
                    activeClass="bg-slate-950 text-white border-slate-950 shadow-[0_14px_28px_-20px_rgba(15,23,42,0.75)]"
                  >
                    All Words
                  </WorkspaceChipButton>
                  <WorkspaceChipButton
                    active={filterStatus === "learning"}
                    onClick={() => setFilterStatus("learning")}
                    activeClass="bg-orange-500 text-white border-orange-500 shadow-[0_14px_28px_-20px_rgba(249,115,22,0.75)]"
                    inactiveClass="bg-orange-50 text-orange-600 border-orange-100 hover:bg-orange-100"
                  >
                    🔥 Learning
                  </WorkspaceChipButton>
                  <WorkspaceChipButton
                    active={filterStatus === "mastered"}
                    onClick={() => setFilterStatus("mastered")}
                    activeClass="bg-emerald-500 text-white border-emerald-500 shadow-[0_14px_28px_-20px_rgba(16,185,129,0.75)]"
                    inactiveClass="bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100"
                  >
                    ✅ Mastered
                  </WorkspaceChipButton>
              </WorkspaceFilterGroup>
            </div>

            <WorkspaceUtilityPanel
              tone="open"
              eyebrow="Display"
              title="View density"
              description={densityMode === "rich" ? "Larger cards with more breathing room." : "Tighter rows for faster scanning and bulk selection."}
            >
              <DensityToggle value={densityMode} onChange={setDensityMode} />
            </WorkspaceUtilityPanel>
          </div>
        </WorkspacePanel>

        <WorkspacePanel tone="open">
          <WorkspaceHeader
            eyebrow="Results"
            title="Library results"
            description={`Showing ${filteredVocab.length} word${filteredVocab.length !== 1 ? "s" : ""}${selectedLang !== "all" ? ` in ${selectedLang.toUpperCase()}` : ""}${filterStatus !== "all" ? ` with ${filterStatus} status` : ""}.`}
            actions={
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-500">
                {densityMode} view
              </span>
            }
          />

          <div className="mt-5 border-t border-slate-200/75 pt-5">
            {isLoading ? (
              <div className="rounded-[2rem] border border-slate-200/70 bg-white/55 px-6 py-20 text-center font-bold uppercase tracking-widest text-gray-400 animate-pulse">
                Loading your library...
              </div>
            ) : filteredVocab.length > 0 ? (
              densityMode === "rich" ? (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredVocab.map((v) => (
                    <VocabCard
                      key={v.id}
                      v={v}
                      isSelected={selectedIds.includes(v.id)}
                      onToggle={toggleSelection}
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredVocab.map((v) => (
                    <CompactVocabRow
                      key={v.id}
                      v={v}
                      isSelected={selectedIds.includes(v.id)}
                      onToggle={toggleSelection}
                    />
                  ))}
                </div>
              )
            ) : (
              <WorkspaceEmptyState
                icon="📭"
                title="No words found"
                description="Try changing your filters or add new words from the dashboard."
                className="rounded-[2rem] border border-dashed border-slate-200 bg-slate-50/50 p-12 shadow-none"
              />
            )}
          </div>
        </WorkspacePanel>
      </AppMain>

      <WorkspaceSelectionBar
        selectedCount={selectedIds.length}
        isBusy={isDeleting}
        busyLabel="Deleting..."
        actionLabel="🗑️ Delete All"
        onAction={handleBulkDelete}
      />

    </AppShell>
  );
}
