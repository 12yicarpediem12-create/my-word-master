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

function SpellingFamilyHeader({
  vocab,
  siblingCount,
}: {
  vocab: VocabDetail;
  siblingCount: number;
}) {
  const totalEntries = siblingCount + 1;

  return (
    <section className="surface-hero relative overflow-hidden rounded-[2.75rem] p-6 sm:p-8 lg:p-10">
      <div className="pointer-events-none absolute right-0 top-0 h-44 w-44 rounded-full bg-blue-200/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-36 w-36 rounded-full bg-sky-100/40 blur-3xl" />

      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <MetadataChip tone="blue">{vocab.language_code}</MetadataChip>
            <MetadataChip tone="default">Spelling Family</MetadataChip>
            <MetadataChip tone="indigo">
              {totalEntries} {totalEntries === 1 ? "entry" : "entries"}
            </MetadataChip>
          </div>

          <h1 className="mt-5 break-all text-4xl font-black leading-[0.95] tracking-tight text-slate-950 sm:text-6xl">
            {vocab.word}
          </h1>
          <p className="mt-4 max-w-3xl text-base font-medium leading-relaxed text-slate-600 sm:text-lg">
            Browse the distinct records stored under this spelling. Each entry below stays separate by part of
            speech and central meaning, even when the surface form is shared.
          </p>
        </div>

        <div className="grid max-w-md grid-cols-1 gap-3 sm:grid-cols-3">
          <QuickFact label="Current Topic" value={vocab.categories?.name || "Uncategorized"} tone="blue" />
          <QuickFact label="Selected Entry" value={vocab.part_of_speech || "Word"} tone="emerald" />
          <QuickFact
            label="Mastery"
            value={vocab.is_remembered ? "Mastered" : "Learning"}
            tone={vocab.is_remembered ? "emerald" : "default"}
          />
        </div>
      </div>
    </section>
  );
}

function WordEntryBlock({
  entry,
  entryNumber,
  isCurrent,
  isDeleting = false,
  isAskingAI = false,
  tempNuance = null,
  onSpeak,
  onToggleRemembered,
  onStartEditing,
  onDelete,
  onAskNuance,
}: {
  entry: VocabDetail;
  entryNumber: number;
  isCurrent: boolean;
  isDeleting?: boolean;
  isAskingAI?: boolean;
  tempNuance?: string | null;
  onSpeak: (text: string) => void;
  onToggleRemembered?: () => void;
  onStartEditing?: () => void;
  onDelete?: () => void;
  onAskNuance?: () => void;
}) {
  const canEdit = isCurrent && !!onStartEditing && !!onDelete;
  const canToggleRemembered = isCurrent && !!onToggleRemembered;
  const canAskNuance = isCurrent && !!onAskNuance;

  return (
    <section
      className={cn(
        "rounded-[2rem] border bg-white/90 p-6 shadow-[0_18px_40px_-36px_rgba(15,23,42,0.24)] sm:p-7",
        isCurrent ? "border-blue-200 shadow-[0_24px_44px_-36px_rgba(37,99,235,0.25)]" : "border-slate-200/80"
      )}
    >
      <div className="flex flex-col gap-5 border-b border-slate-200/80 pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold tracking-[0.16em] text-slate-500">
              {entryNumber}.
            </span>
            {isCurrent && <MetadataChip tone="blue">Current Entry</MetadataChip>}
            <MetadataChip tone="blue">{entry.part_of_speech || "Word"}</MetadataChip>
            {entry.gender && <MetadataChip tone="emerald">{entry.gender}</MetadataChip>}
            {entry.verb_type && <MetadataChip tone="indigo">{entry.verb_type}</MetadataChip>}
            {entry.categories?.name && <MetadataChip tone="default">{entry.categories.name}</MetadataChip>}
            {canToggleRemembered ? (
              <MetadataChip
                tone={entry.is_remembered ? "emerald" : "orange"}
                asButton
                onClick={onToggleRemembered}
              >
                {entry.is_remembered ? "Mastered" : "Learning"}
              </MetadataChip>
            ) : (
              <MetadataChip tone={entry.is_remembered ? "emerald" : "default"}>
                {entry.is_remembered ? "Mastered" : "Learning"}
              </MetadataChip>
            )}
          </div>

          <p className="mt-4 break-words text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
            {entry.translation}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 sm:justify-end">
          <button
            onClick={() => onSpeak(entry.word)}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-lg shadow-sm transition-colors hover:bg-blue-50"
          >
            🔊
          </button>
          {isCurrent ? (
            <span className="text-xs font-medium text-slate-500">Selected by this route</span>
          ) : (
            <Link
              href={`/word/${entry.id}`}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition-colors hover:border-blue-200 hover:text-blue-600"
            >
              Open entry
            </Link>
          )}
        </div>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(16rem,0.75fr)]">
        <div className="space-y-4">
          {(entry.example_sentence || entry.example_translation) && (
            <div className="rounded-[1.5rem] border border-blue-100 bg-blue-50/75 p-5">
              <p className="support-label text-blue-500">Example</p>
              {entry.example_sentence && (
                <div className="mt-2 flex flex-col items-start gap-3">
                  <p className="text-lg font-semibold leading-relaxed text-slate-950 italic">
                    &quot;{entry.example_sentence}&quot;
                  </p>
                  <button
                    onClick={() => onSpeak(entry.example_sentence || "")}
                    className="rounded-full border border-blue-100 bg-white px-4 py-2 text-[11px] font-bold text-blue-600 transition-colors hover:bg-blue-100"
                  >
                    Play example
                  </button>
                </div>
              )}
              {entry.example_translation && (
                <p className="mt-3 border-t border-blue-100 pt-3 text-sm font-medium leading-relaxed text-slate-600">
                  {entry.example_translation}
                </p>
              )}
            </div>
          )}

          {(entry.notes || entry.conjugation) && (
            <div className="grid gap-4 lg:grid-cols-2">
              {entry.notes && (
                <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50/75 p-5">
                  <p className="support-label">Notes</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm font-medium leading-relaxed text-slate-700">
                    {entry.notes}
                  </p>
                </div>
              )}
              {entry.conjugation && (
                <div className="rounded-[1.5rem] border border-emerald-100 bg-emerald-50/75 p-5">
                  <p className="support-label text-emerald-600">Conjugation</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm font-medium leading-relaxed text-emerald-950">
                    {entry.conjugation}
                  </p>
                </div>
              )}
            </div>
          )}

          {(isCurrent || tempNuance) && (
            <div className="rounded-[1.5rem] border border-indigo-100 bg-indigo-50/55 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="support-label text-indigo-500">Nuance</p>
                  <p className="mt-1 text-sm font-medium text-slate-500">
                    {isCurrent
                      ? "Keep nuance specific to this one lexical record."
                      : "Nuance is available on the selected entry only in this first pass."}
                  </p>
                </div>
                {canAskNuance && (
                  <button
                    onClick={onAskNuance}
                    disabled={isAskingAI}
                    className="rounded-full border border-indigo-100 bg-white px-4 py-2 text-[11px] font-bold text-indigo-600 transition-colors hover:bg-indigo-100 disabled:opacity-50"
                  >
                    {isAskingAI ? "Analyzing..." : "Ask AI"}
                  </button>
                )}
              </div>

              <div className="mt-4">
                {tempNuance ? (
                  <p className="whitespace-pre-wrap text-sm font-medium leading-relaxed text-slate-700">{tempNuance}</p>
                ) : (
                  <p className="text-sm font-medium text-slate-500">
                    {canAskNuance
                      ? "No AI nuance yet. Use the action above when you want an extra usage distinction."
                      : "Open this entry to ask for nuance and save or edit it as its own study record."}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <QuickFact label="Topic" value={entry.categories?.name || "Uncategorized"} tone="blue" />
            <QuickFact
              label="Mastery"
              value={entry.is_remembered ? "Mastered" : "Learning"}
              tone={entry.is_remembered ? "emerald" : "default"}
            />
            {entry.gender && <QuickFact label="Gender" value={entry.gender} tone="emerald" />}
            {entry.verb_type && <QuickFact label="Verb Type" value={entry.verb_type} tone="emerald" />}
          </div>

          <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50/70 p-5">
            <p className="support-label">Actions</p>
            <div className="mt-3 grid gap-3">
              {canEdit ? (
                <>
                  <button
                    onClick={onStartEditing}
                    className="rounded-2xl bg-slate-950 px-5 py-3 font-bold text-white transition-colors hover:bg-slate-800"
                  >
                    Edit entry
                  </button>
                  <button
                    onClick={onDelete}
                    disabled={isDeleting}
                    className="rounded-2xl border border-red-100 bg-red-50 px-5 py-3 font-bold text-red-500 transition-colors hover:bg-red-100 disabled:opacity-50"
                  >
                    {isDeleting ? "Deleting..." : "Delete entry"}
                  </button>
                </>
              ) : (
                <Link
                  href={`/word/${entry.id}`}
                  className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-center font-bold text-slate-700 transition-colors hover:border-blue-200 hover:text-blue-600"
                >
                  View this entry
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function WordDetailView({
  currentRecord,
  siblingEntries,
  secondaryContext,
  isDeleting,
  isAskingAI,
  tempNuance,
  onSpeak,
  onToggleRemembered,
  onStartEditing,
  onDelete,
  onAskNuance,
}: {
  currentRecord: VocabDetail;
  siblingEntries: VocabDetail[];
  secondaryContext: {
    categories: Category[];
    relatedWords: VocabItem[];
    mainTopicName: string;
  };
  isDeleting: boolean;
  isAskingAI: boolean;
  tempNuance: string | null;
  onSpeak: (text: string) => void;
  onToggleRemembered: () => void;
  onStartEditing: () => void;
  onDelete: () => void;
  onAskNuance: () => void;
}) {
  const familyEntries = [currentRecord, ...siblingEntries];
  const { relatedWords, mainTopicName } = secondaryContext;

  return (
    <div className="mt-4 space-y-6 lg:mt-6">
      <SpellingFamilyHeader vocab={currentRecord} siblingCount={siblingEntries.length} />

      <section className="section-open space-y-4">
        <div className="flex flex-col gap-2 border-b border-slate-200/80 pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="section-eyebrow">Entries</p>
            <h2 className="section-title">Distinct records under this spelling</h2>
            <p className="section-copy">
              Each block below is its own lexical record. The current route stays selected, while sibling entries remain
              separate by part of speech and meaning.
            </p>
          </div>
        </div>

        <div className="space-y-5">
          {familyEntries.map((entry, index) => {
            const isCurrent = entry.id === currentRecord.id;

            return (
              <WordEntryBlock
                key={entry.id}
                entry={entry}
                entryNumber={index + 1}
                isCurrent={isCurrent}
                isDeleting={isCurrent ? isDeleting : false}
                isAskingAI={isCurrent ? isAskingAI : false}
                tempNuance={isCurrent ? tempNuance : null}
                onSpeak={onSpeak}
                onToggleRemembered={isCurrent ? onToggleRemembered : undefined}
                onStartEditing={isCurrent ? onStartEditing : undefined}
                onDelete={isCurrent ? onDelete : undefined}
                onAskNuance={isCurrent ? onAskNuance : undefined}
              />
            );
          })}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {currentRecord.categories && (
          <SidebarSection eyebrow="Context" title="Category & Navigation">
            <div className="space-y-4">
              <div className="rounded-[1.5rem] border border-indigo-100 bg-indigo-50/80 p-5">
                <p className="support-label text-indigo-500">Topic Path</p>
                <p className="mt-2 break-words text-sm font-bold leading-relaxed text-indigo-950 sm:text-base">
                  {currentRecord.categories.full_path}
                </p>
              </div>
              <Link
                href={`/study/${currentRecord.language_code}/topics/${currentRecord.category_id}`}
                className="block rounded-[1.5rem] border border-slate-200 bg-white px-5 py-5 transition-all hover:border-indigo-200 hover:text-indigo-600"
              >
                <p className="support-label">Study More Like This</p>
                <p className="mt-2 text-lg font-black text-slate-950">Open {mainTopicName}</p>
                <p className="mt-3 text-xs font-medium text-indigo-500">Go to topic list</p>
              </Link>
            </div>
          </SidebarSection>
        )}

        {currentRecord.root_word && (
          <SidebarSection eyebrow="Context" title="Etymology & Related Words">
            <div className="space-y-4">
              <div className="rounded-[1.5rem] border border-rose-100 bg-rose-50/85 p-5">
                <p className="support-label text-rose-500">Origin</p>
                <Link
                  href={`/root/${encodeRootPath(currentRecord.root_word)}`}
                  className="mt-2 inline-block text-base font-bold text-rose-700 transition-all hover:text-rose-500 hover:underline sm:text-lg"
                >
                  {currentRecord.root_word.replace(/^\*/, "")}
                </Link>
              </div>

              {relatedWords.length > 0 && (
                <div>
                  <p className="support-label">Words sharing this root</p>
                  <div className="mt-3 space-y-3">
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
