import type { ReactNode } from "react";
import Link from "next/link";
import type { Category, VocabDetail, VocabItem } from "@/app/lib/types";
import type { EditFormData } from "@/app/lib/word-detail";

const colorTheme = {
  gray: { label: "text-slate-400", input: "bg-slate-50 border-slate-200 text-slate-950 focus:border-blue-400" },
  emerald: { label: "text-emerald-500", input: "bg-emerald-50/40 border-emerald-100 text-emerald-900 focus:border-emerald-400" },
  purple: { label: "text-purple-500", input: "bg-purple-50/40 border-purple-100 text-purple-900 focus:border-purple-400" },
  blue: { label: "text-blue-500", input: "bg-blue-50/40 border-blue-100 text-blue-900 focus:border-blue-400" },
  amber: { label: "text-amber-500", input: "bg-amber-50/40 border-amber-100 text-amber-900 focus:border-amber-400" },
  rose: { label: "text-rose-500", input: "bg-rose-50/40 border-rose-100 text-rose-900 focus:border-rose-400" },
};

const baseInputClass = "w-full rounded-2xl border px-4 py-4 font-bold outline-none transition-all";
const baseTextareaClass = "w-full rounded-2xl border px-4 py-4 font-medium outline-none resize-none transition-all";

function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function encodeRootPath(rootWord: string) {
  return encodeURIComponent(encodeURIComponent(rootWord).replace(/\*/g, "%2A").replace(/\(/g, "%28").replace(/\)/g, "%29"));
}

function FieldWrapper({
  label,
  color = "gray",
  children,
}: {
  label: string;
  color?: keyof typeof colorTheme;
  children: ReactNode;
}) {
  return (
    <div className="flex w-full flex-col gap-2">
      <label className={`ml-2 text-[9px] font-black uppercase tracking-tight ${colorTheme[color].label}`}>
        {label}
      </label>
      {children}
    </div>
  );
}

function RecordSection({
  eyebrow,
  title,
  description,
  actions,
  children,
  className,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-[2rem] border border-slate-200/80 bg-white/85 p-6 shadow-[0_22px_44px_-38px_rgba(15,23,42,0.22)] sm:p-8", className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{eyebrow}</p>
          <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950">{title}</h2>
          {description && <p className="mt-2 text-sm font-medium leading-relaxed text-slate-600">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-3">{actions}</div>}
      </div>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function MetadataChip({
  children,
  tone = "default",
  asButton = false,
  onClick,
}: {
  children: ReactNode;
  tone?: "default" | "blue" | "emerald" | "orange" | "indigo";
  asButton?: boolean;
  onClick?: () => void;
}) {
  const toneClass = {
    default: "bg-white/80 border-slate-200 text-slate-600",
    blue: "bg-blue-50 border-blue-100 text-blue-600",
    emerald: "bg-emerald-50 border-emerald-100 text-emerald-600",
    orange: "bg-orange-50 border-orange-100 text-orange-600",
    indigo: "bg-indigo-50 border-indigo-100 text-indigo-600",
  }[tone];

  const baseClass = `inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest transition-all ${toneClass}`;

  if (asButton) {
    return (
      <button onClick={onClick} className={cn(baseClass, "hover:opacity-90")}>
        {children}
      </button>
    );
  }

  return <span className={baseClass}>{children}</span>;
}

function QuickFact({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "blue" | "emerald" | "rose";
}) {
  const toneClass = {
    default: "bg-slate-50 border-slate-200 text-slate-950",
    blue: "bg-blue-50 border-blue-100 text-blue-950",
    emerald: "bg-emerald-50 border-emerald-100 text-emerald-950",
    rose: "bg-rose-50 border-rose-100 text-rose-950",
  }[tone];

  return (
    <div className={`rounded-[1.5rem] border px-4 py-4 ${toneClass}`}>
      <p className="mb-1 text-[9px] font-black uppercase tracking-widest opacity-55">{label}</p>
      <p className="break-words text-sm font-black sm:text-base">{value}</p>
    </div>
  );
}

function SidebarSection({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="surface-muted rounded-[2rem] p-5 sm:p-6">
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{eyebrow}</p>
      <h3 className="mt-3 text-xl font-black tracking-tight text-slate-950">{title}</h3>
      <div className="mt-5">{children}</div>
    </section>
  );
}

export function WordDetailView({
  vocab,
  relatedWords,
  isDeleting,
  isAskingAI,
  tempNuance,
  mainTopicName,
  onSpeak,
  onToggleRemembered,
  onStartEditing,
  onDelete,
  onAskNuance,
}: {
  vocab: VocabDetail;
  relatedWords: VocabItem[];
  isDeleting: boolean;
  isAskingAI: boolean;
  tempNuance: string | null;
  mainTopicName: string;
  onSpeak: (text: string) => void;
  onToggleRemembered: () => void;
  onStartEditing: () => void;
  onDelete: () => void;
  onAskNuance: () => void;
}) {
  return (
    <div className="mt-4 space-y-6 lg:mt-6">
      <section className="surface-hero relative overflow-hidden rounded-[2.75rem] p-6 sm:p-8 lg:p-10">
        <div className="pointer-events-none absolute right-0 top-0 h-44 w-44 rounded-full bg-blue-200/30 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-36 w-36 rounded-full bg-sky-100/50 blur-3xl" />

        <div className="relative grid gap-8 xl:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.65fr)] xl:items-start">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <MetadataChip tone="blue">{vocab.language_code}</MetadataChip>
              <MetadataChip tone="default">Lexicon Record</MetadataChip>
              {vocab.categories?.name && <MetadataChip tone="indigo">{vocab.categories.name}</MetadataChip>}
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-4">
              <h1 className="break-all text-4xl font-black leading-[0.95] tracking-tight text-slate-950 sm:text-6xl">{vocab.word}</h1>
              <button
                onClick={() => onSpeak(vocab.word)}
                className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white text-lg shadow-sm transition-colors hover:bg-blue-50"
              >
                🔊
              </button>
            </div>

            <p className="mt-4 break-words text-2xl font-bold leading-tight text-blue-600 sm:text-3xl">{vocab.translation}</p>

            <div className="mt-5 flex flex-wrap gap-2">
              <MetadataChip tone="blue">{vocab.part_of_speech || "Word"}</MetadataChip>
              {vocab.gender && <MetadataChip tone="emerald">{vocab.gender}</MetadataChip>}
              <MetadataChip
                tone={vocab.is_remembered ? "emerald" : "orange"}
                asButton
                onClick={onToggleRemembered}
              >
                {vocab.is_remembered ? "Mastered" : "Learning"}
              </MetadataChip>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <QuickFact label="Mastery" value={vocab.is_remembered ? "Mastered" : "Learning"} tone={vocab.is_remembered ? "emerald" : "default"} />
              <QuickFact label="Topic" value={vocab.categories?.name || "Uncategorized"} tone="blue" />
              <QuickFact label="Root" value={vocab.root_word ? vocab.root_word.replace(/^\*/, "") : "No root"} tone={vocab.root_word ? "rose" : "default"} />
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200/80 bg-white/88 p-5 shadow-[0_22px_44px_-38px_rgba(15,23,42,0.22)] sm:p-6">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Record Actions</p>
            <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950">Work with this entry</h2>
            <p className="mt-2 text-sm font-medium leading-relaxed text-slate-600">
              Update details, keep mastery accurate, or remove the record if it no longer belongs in your library.
            </p>

            <div className="mt-6 grid gap-3">
              <button
                onClick={onStartEditing}
                className="rounded-2xl bg-slate-950 px-5 py-4 font-black text-white transition-colors hover:bg-slate-800"
              >
                Edit Details
              </button>
              <button
                onClick={onDelete}
                disabled={isDeleting}
                className="rounded-2xl border border-red-100 bg-red-50 px-5 py-4 font-black text-red-500 transition-colors hover:bg-red-100 disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)]">
        <div className="space-y-6">
          {(vocab.example_sentence || vocab.example_translation) && (
            <RecordSection
              eyebrow="Primary Learning"
              title="Example Sentence"
              description="Keep context, phrasing, and pronunciation in the main reading lane so the word behaves like a real record, not just a label."
            >
              <div className="rounded-[1.75rem] border border-blue-100 bg-blue-50/80 p-5 sm:p-7">
                {vocab.example_sentence && (
                  <div className="flex flex-col items-start gap-4">
                    <p className="text-xl font-bold leading-relaxed text-slate-950 italic sm:text-2xl">
                      &quot;{vocab.example_sentence}&quot;
                    </p>
                    <button
                      onClick={() => onSpeak(vocab.example_sentence || "")}
                      className="rounded-2xl border border-blue-100 bg-white px-4 py-2 text-[10px] font-black uppercase tracking-widest text-blue-600 shadow-sm transition-all hover:bg-blue-100"
                    >
                      Play Example
                    </button>
                  </div>
                )}
                {vocab.example_translation && (
                  <div className="mt-5 border-t border-blue-100 pt-5">
                    <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-blue-400">Meaning</p>
                    <p className="text-sm font-medium leading-relaxed text-slate-600 sm:text-base">
                      {vocab.example_translation}
                    </p>
                  </div>
                )}
              </div>
            </RecordSection>
          )}

          <RecordSection
            eyebrow="Primary Learning"
            title="Usage & Nuance"
            description="Nuance stays near the example and translation so the record reads like one learning object with meaning, context, and usage together."
            actions={
              <button
                onClick={onAskNuance}
                disabled={isAskingAI}
                className="rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-blue-600 transition-all hover:bg-blue-100 disabled:opacity-50"
              >
                {isAskingAI ? "Analyzing..." : "Ask AI"}
              </button>
            }
          >
            {tempNuance ? (
              <div className="rounded-[2rem] border-2 border-dashed border-indigo-100 bg-indigo-50/60 p-6 animate-in fade-in duration-500 sm:p-8">
                <p className="whitespace-pre-wrap text-sm font-medium leading-relaxed text-slate-700 lg:text-base">{tempNuance}</p>
                <p className="mt-4 text-[8px] font-bold uppercase text-indigo-300">Insight is not saved in your library.</p>
              </div>
            ) : (
              <div className="rounded-[1.75rem] border-2 border-dashed border-slate-200 bg-slate-50 px-5 py-6">
                <p className="text-sm font-medium text-slate-500">
                  {isAskingAI
                    ? "Looking up nuance and usage detail..."
                    : "No AI nuance yet. Use the button above when you want extra usage context."}
                </p>
              </div>
            )}
          </RecordSection>

          <RecordSection
            eyebrow="Primary Learning"
            title="Grammar & Recall Notes"
            description="Keep grammar guidance and memory cues close to the main content, but secondary to meaning, example, and nuance."
          >
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {vocab.conjugation && (
                <div className="rounded-[1.75rem] border border-emerald-100 bg-emerald-50/85 p-5 sm:p-6">
                  <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-emerald-500">Conjugation</p>
                  <p className="whitespace-pre-wrap text-sm font-medium leading-relaxed text-emerald-950 sm:text-base">
                    {vocab.conjugation}
                  </p>
                </div>
              )}
              <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50/90 p-5 sm:p-6">
                <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Notes</p>
                <p className="whitespace-pre-wrap text-sm font-medium leading-relaxed text-slate-700 italic sm:text-base">
                  {vocab.notes || "No grammar notes added."}
                </p>
              </div>
            </div>
          </RecordSection>
        </div>

        <aside className="space-y-6">
          <SidebarSection eyebrow="Record Snapshot" title="Grammar & Facts">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <QuickFact label="Part of Speech" value={vocab.part_of_speech || "---"} tone="blue" />
              <QuickFact label="Mastery" value={vocab.is_remembered ? "Mastered" : "Learning"} tone={vocab.is_remembered ? "emerald" : "default"} />
              {vocab.gender && <QuickFact label="Gender" value={vocab.gender} tone="emerald" />}
              {vocab.verb_type && <QuickFact label="Verb Type" value={vocab.verb_type} tone="emerald" />}
            </div>
          </SidebarSection>

          {vocab.categories && (
            <SidebarSection eyebrow="Context" title="Category & Navigation">
              <div className="space-y-4">
                <div className="rounded-[1.5rem] border border-indigo-100 bg-indigo-50/80 p-5">
                  <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-indigo-400">Topic Path</p>
                  <p className="break-words text-sm font-bold leading-relaxed text-indigo-950 sm:text-base">
                    {vocab.categories.full_path}
                  </p>
                </div>
                <Link
                  href={`/study/${vocab.language_code}/topics/${vocab.category_id}`}
                  className="block rounded-[1.5rem] border border-slate-200 bg-white px-5 py-5 transition-all hover:border-indigo-200 hover:text-indigo-600"
                >
                  <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Study More Like This</p>
                  <p className="font-black text-slate-950">Open {mainTopicName}</p>
                  <p className="mt-4 text-[10px] font-bold uppercase tracking-widest text-indigo-400">Go to topic list</p>
                </Link>
              </div>
            </SidebarSection>
          )}

          {vocab.root_word && (
            <SidebarSection eyebrow="Context" title="Etymology & Related Words">
              <div className="space-y-4">
                <div className="rounded-[1.5rem] border border-rose-100 bg-rose-50/85 p-5">
                  <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-rose-400">Origin</p>
                  <Link
                    href={`/root/${encodeRootPath(vocab.root_word)}`}
                    className="inline-block text-base font-bold text-rose-700 transition-all hover:text-rose-500 hover:underline sm:text-lg"
                  >
                    {vocab.root_word.replace(/^\*/, "")}
                  </Link>
                </div>

                {relatedWords.length > 0 && (
                  <div>
                    <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Words sharing this root</p>
                    <div className="space-y-3">
                      {relatedWords.map((rw) => (
                        <Link
                          href={`/word/${rw.id}`}
                          key={rw.id}
                          className="block rounded-[1.25rem] border border-rose-100 bg-white px-4 py-4 transition-all hover:border-rose-300"
                        >
                          <div className="flex items-center gap-2">
                            <span className="rounded-md bg-rose-50 px-2 py-0.5 text-[9px] font-black uppercase text-rose-500">
                              {rw.language_code}
                            </span>
                            <span className="font-bold text-slate-900">{rw.word}</span>
                          </div>
                          <span className="mt-1 block text-[10px] font-medium text-slate-400">{rw.translation}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </SidebarSection>
          )}
        </aside>
      </div>
    </div>
  );
}

export function WordDetailEditForm({
  editForm,
  selL1,
  selL2,
  selL3,
  l1Options,
  l2Options,
  l3Options,
  isAutoFilling,
  onChange,
  onL1Change,
  onL2Change,
  onL3Change,
  onAutoFill,
  onCancel,
  onSave,
}: {
  editForm: EditFormData;
  selL1: string;
  selL2: string;
  selL3: string;
  l1Options: Category[];
  l2Options: Category[];
  l3Options: Category[];
  isAutoFilling: boolean;
  onChange: (field: keyof EditFormData, value: string) => void;
  onL1Change: (value: string) => void;
  onL2Change: (value: string) => void;
  onL3Change: (value: string) => void;
  onAutoFill: () => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  return (
    <div className="mt-4 space-y-6 animate-in fade-in duration-300 lg:mt-6">
      <section className="surface-hero relative overflow-hidden rounded-[2.75rem] p-6 sm:p-8 lg:p-10">
        <div className="pointer-events-none absolute right-0 top-0 h-44 w-44 rounded-full bg-blue-200/30 blur-3xl" />
        <div className="relative grid gap-8 xl:grid-cols-[minmax(0,1.3fr)_minmax(18rem,0.7fr)] xl:items-start">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <MetadataChip tone="blue">Editing Record</MetadataChip>
              <MetadataChip tone="default">Word Detail</MetadataChip>
            </div>

            <div className="mt-5 space-y-4">
              <FieldWrapper label="Word">
                <input type="text" value={editForm.word} onChange={(e) => onChange("word", e.target.value)} className={`${baseInputClass} ${colorTheme.gray.input}`} />
              </FieldWrapper>
              <FieldWrapper label="Meaning">
                <input type="text" value={editForm.translation} onChange={(e) => onChange("translation", e.target.value)} className={`${baseInputClass} ${colorTheme.gray.input}`} />
              </FieldWrapper>
              <FieldWrapper label="AI Disambiguation Hint" color="blue">
                <div className="space-y-2">
                  <input
                    type="text"
                    value={editForm.hint}
                    onChange={(e) => onChange("hint", e.target.value)}
                    placeholder="Example: adjective — calm and steady, noun — a state of rest"
                    className={`${baseInputClass} ${colorTheme.blue.input}`}
                  />
                  <p className="ml-2 text-[11px] leading-relaxed text-slate-500">
                    Use this when the spelling could map to multiple entries. The AI will stay inside one intended part of speech and use.
                  </p>
                </div>
              </FieldWrapper>
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200/80 bg-white/88 p-5 shadow-[0_22px_44px_-38px_rgba(15,23,42,0.22)] sm:p-6">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Edit Actions</p>
            <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950">Update this record</h2>
            <p className="mt-2 text-sm font-medium leading-relaxed text-slate-600">
              Keep the same record, refine its details, and use AI autofill when you want help filling one specific lexical entry.
            </p>

            <div className="mt-6 grid gap-3">
              <button
                onClick={onAutoFill}
                disabled={isAutoFilling}
                className="rounded-2xl border border-purple-100 bg-purple-50 px-5 py-4 text-xs font-black uppercase tracking-widest text-purple-600 transition-colors hover:bg-purple-100 disabled:opacity-50"
              >
                {isAutoFilling ? "AI Auto-filling..." : "AI Auto-Fill"}
              </button>
              <button
                onClick={onSave}
                className="rounded-2xl bg-blue-600 px-5 py-4 font-black text-white shadow-xl shadow-blue-100 transition-colors hover:bg-blue-700"
              >
                Save Changes
              </button>
              <button
                onClick={onCancel}
                className="rounded-2xl border border-slate-200 bg-white px-5 py-4 font-black text-slate-500 transition-colors hover:text-slate-900"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)]">
        <div className="space-y-6">
          <RecordSection
            eyebrow="Primary Fields"
            title="Meaning & Usage"
            description="Edit the core learning content in the main column so the record still reads like the same study object."
          >
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <FieldWrapper label="Intended Part of Speech">
                <div className="space-y-2">
                  <input type="text" value={editForm.pos} onChange={(e) => onChange("pos", e.target.value)} className={`${baseInputClass} ${colorTheme.gray.input}`} />
                  <p className="ml-2 text-[11px] leading-relaxed text-slate-500">
                    Keep this focused on one POS. If the spelling has noun and verb uses, edit them as separate records.
                  </p>
                </div>
              </FieldWrapper>
              <FieldWrapper label="Example Sentence" color="blue">
                <textarea value={editForm.example} onChange={(e) => onChange("example", e.target.value)} rows={3} className={`${baseTextareaClass} ${colorTheme.blue.input}`} />
              </FieldWrapper>
              <FieldWrapper label="Example Translation" color="blue">
                <textarea value={editForm.exampleTranslation} onChange={(e) => onChange("exampleTranslation", e.target.value)} rows={3} className={`${baseTextareaClass} ${colorTheme.blue.input}`} />
              </FieldWrapper>
              <FieldWrapper label="Conjugation Guide" color="amber">
                <textarea value={editForm.conjugation} onChange={(e) => onChange("conjugation", e.target.value)} rows={5} className={`${baseTextareaClass} ${colorTheme.amber.input}`} />
              </FieldWrapper>
              <FieldWrapper label="Notes / Grammar Pattern">
                <textarea value={editForm.notes} onChange={(e) => onChange("notes", e.target.value)} rows={5} className={`${baseTextareaClass} ${colorTheme.gray.input}`} />
              </FieldWrapper>
            </div>
          </RecordSection>
        </div>

        <aside className="space-y-6">
          <SidebarSection eyebrow="Supporting Context" title="Classification">
            <div className="space-y-5">
              <FieldWrapper label="Category Taxonomy" color="purple">
                <div className="flex flex-col gap-3">
                  <select value={selL1} onChange={(e) => onL1Change(e.target.value)} className={`${baseInputClass} ${colorTheme.purple.input} text-sm`}>
                    <option value="">-- Main Category --</option>
                    {l1Options.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                  </select>

                  {l2Options.length > 0 && (
                    <select value={selL2} onChange={(e) => onL2Change(e.target.value)} className={`${baseInputClass} ${colorTheme.purple.input} text-sm animate-in fade-in slide-in-from-left-2`}>
                      <option value="">-- Sub Category --</option>
                      {l2Options.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                    </select>
                  )}

                  {l3Options.length > 0 && (
                    <select value={selL3} onChange={(e) => onL3Change(e.target.value)} className={`${baseInputClass} ${colorTheme.purple.input} text-sm animate-in fade-in slide-in-from-left-2`}>
                      <option value="">-- Specific Topic --</option>
                      {l3Options.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                    </select>
                  )}
                </div>
              </FieldWrapper>

              <FieldWrapper label="Gender" color="emerald">
                <input type="text" value={editForm.gender} onChange={(e) => onChange("gender", e.target.value)} className={`${baseInputClass} ${colorTheme.emerald.input}`} />
              </FieldWrapper>

              <FieldWrapper label="Verb Type" color="emerald">
                <input type="text" value={editForm.verbType} onChange={(e) => onChange("verbType", e.target.value)} className={`${baseInputClass} ${colorTheme.emerald.input}`} />
              </FieldWrapper>

              <FieldWrapper label="Root Word (Etymology)" color="rose">
                <input
                  type="text"
                  value={editForm.rootWord}
                  onChange={(e) => onChange("rootWord", e.target.value)}
                  placeholder="e.g. noctem (Latin)"
                  className={`${baseInputClass} ${colorTheme.rose.input}`}
                />
              </FieldWrapper>
            </div>
          </SidebarSection>
        </aside>
      </div>
    </div>
  );
}
