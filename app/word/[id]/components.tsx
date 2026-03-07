import Link from "next/link";
import type { Category, VocabDetail, VocabItem } from "@/app/lib/types";
import type { EditFormData } from "@/app/lib/word-detail";

const colorTheme = {
  gray: { label: "text-gray-400", input: "bg-gray-50 border-gray-100 text-gray-900 focus:border-blue-400" },
  emerald: { label: "text-emerald-500", input: "bg-emerald-50/20 border-emerald-100 text-emerald-800 focus:border-emerald-400" },
  purple: { label: "text-purple-500", input: "bg-purple-50/20 border-purple-100 text-purple-800 focus:border-purple-400" },
  blue: { label: "text-blue-400", input: "bg-blue-50/30 border-blue-100 text-blue-900 focus:border-blue-400" },
  amber: { label: "text-amber-500", input: "bg-amber-50/30 border-amber-100 text-amber-900 focus:border-amber-400" },
  rose: { label: "text-rose-500", input: "bg-rose-50/30 border-rose-100 text-rose-900 focus:border-rose-400" },
};

const baseInputClass = "w-full p-4 border-2 rounded-2xl font-bold outline-none transition-all";
const baseTextareaClass = "w-full p-4 border-2 rounded-2xl font-medium outline-none resize-none transition-all";

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
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 w-full">
      <label className={`text-[9px] font-black uppercase tracking-tight ml-2 ${colorTheme[color].label}`}>
        {label}
      </label>
      {children}
    </div>
  );
}

function DetailSection({
  eyebrow,
  title,
  accentClass,
  children,
}: {
  eyebrow: string;
  title: string;
  accentClass: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white rounded-[2rem] p-6 sm:p-8 border-2 border-gray-200 shadow-sm">
      <p className={`text-[10px] font-black uppercase tracking-widest mb-3 ${accentClass}`}>{eyebrow}</p>
      <h2 className="text-xl sm:text-2xl font-black tracking-tight text-gray-900 mb-5">{title}</h2>
      {children}
    </section>
  );
}

function QuickFact({
  label,
  value,
  tone = "gray",
}: {
  label: string;
  value: string;
  tone?: "gray" | "blue" | "emerald" | "rose";
}) {
  const toneMap = {
    gray: "bg-gray-50 border-gray-100 text-gray-900",
    blue: "bg-blue-50 border-blue-100 text-blue-900",
    emerald: "bg-emerald-50 border-emerald-100 text-emerald-900",
    rose: "bg-rose-50 border-rose-100 text-rose-900",
  };

  return (
    <div className={`rounded-2xl border px-4 py-3 ${toneMap[tone]}`}>
      <p className="text-[9px] font-black uppercase tracking-widest opacity-50 mb-1">{label}</p>
      <p className="text-sm sm:text-base font-black break-words">{value}</p>
    </div>
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
    <div className="space-y-8 mt-6 lg:mt-8">
      <section className="bg-gradient-to-br from-gray-50 to-white rounded-[2.2rem] border-2 border-gray-200 p-6 sm:p-8 lg:p-10 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div className="min-w-0">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Study Focus</p>
            <div className="flex items-center gap-4 flex-wrap">
              <h1 className="text-4xl sm:text-6xl font-black break-all leading-tight tracking-tight">{vocab.word}</h1>
              <button onClick={() => onSpeak(vocab.word)} className="w-11 h-11 sm:w-12 sm:h-12 bg-white rounded-full border-2 border-gray-100 flex items-center justify-center text-lg hover:bg-blue-50 hover:border-blue-100 transition-all shadow-sm">
                🔊
              </button>
            </div>
            <p className="mt-4 text-2xl sm:text-3xl font-bold text-blue-600 leading-tight break-words">{vocab.translation}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest border border-blue-100">
                {vocab.part_of_speech || "Word"}
              </span>
              <button
                onClick={onToggleRemembered}
                className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${vocab.is_remembered ? "bg-emerald-500 text-white border-emerald-500" : "bg-orange-50 text-orange-600 border-orange-100"}`}
              >
                {vocab.is_remembered ? "Mastered" : "Learning"}
              </button>
              {vocab.categories?.name && (
                <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest border border-indigo-100">
                  {vocab.categories.name}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
            <button
              onClick={onStartEditing}
              className="bg-gray-900 text-white font-black px-5 py-3 rounded-2xl hover:bg-gray-800 transition-all shadow-sm"
            >
              Edit Details
            </button>
            <button
              onClick={onDelete}
              disabled={isDeleting}
              className="bg-red-50 text-red-500 border border-red-100 font-black px-5 py-3 rounded-2xl hover:bg-red-100 transition-colors disabled:opacity-50"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 mt-8">
          <QuickFact label="Part of Speech" value={vocab.part_of_speech || "---"} tone="blue" />
          <QuickFact label="Mastery" value={vocab.is_remembered ? "Mastered" : "Learning"} tone={vocab.is_remembered ? "emerald" : "gray"} />
          {vocab.gender && <QuickFact label="Gender" value={vocab.gender} tone="emerald" />}
          {vocab.verb_type && <QuickFact label="Verb Type" value={vocab.verb_type} tone="emerald" />}
          {vocab.root_word && <QuickFact label="Root" value={vocab.root_word.replace(/^\*/, "")} tone="rose" />}
          {vocab.categories?.name && <QuickFact label="Topic" value={vocab.categories.name} tone="gray" />}
        </div>
      </section>

      {(vocab.example_sentence || vocab.example_translation) && (
        <DetailSection eyebrow="See It In Context" title="Example Sentence" accentClass="text-blue-400">
          <div className="bg-blue-50 rounded-[1.75rem] border-2 border-blue-100 p-5 sm:p-7">
            {vocab.example_sentence && (
              <div className="flex flex-col items-start gap-4">
                <p className="text-lg sm:text-xl font-bold text-gray-900 leading-relaxed italic">
                  "{vocab.example_sentence}"
                </p>
                <button
                  onClick={() => onSpeak(vocab.example_sentence || "")}
                  className="bg-white px-4 py-2 rounded-2xl shadow-sm hover:bg-blue-100 transition-all text-[10px] font-black uppercase tracking-widest text-blue-600"
                >
                  Play Example
                </button>
              </div>
            )}
            {vocab.example_translation && (
              <div className="mt-5 pt-5 border-t border-blue-100">
                <p className="text-[10px] font-black uppercase tracking-widest text-blue-300 mb-2">Meaning</p>
                <p className="text-sm sm:text-base font-medium text-gray-600 leading-relaxed">
                  {vocab.example_translation}
                </p>
              </div>
            )}
          </div>
        </DetailSection>
      )}

      <DetailSection eyebrow="Quick Review" title="Grammar & Recall Notes" accentClass="text-emerald-500">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {vocab.conjugation && (
            <div className="bg-emerald-50 rounded-[1.75rem] border-2 border-emerald-100 p-5 sm:p-6">
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-3">Conjugation</p>
              <p className="text-sm sm:text-base font-medium text-emerald-900 whitespace-pre-wrap leading-relaxed">
                {vocab.conjugation}
              </p>
            </div>
          )}
          <div className="bg-gray-50 rounded-[1.75rem] border-2 border-gray-100 p-5 sm:p-6">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Notes</p>
            <p className="text-sm sm:text-base font-medium text-gray-700 whitespace-pre-wrap leading-relaxed italic">
              {vocab.notes || "No grammar notes added."}
            </p>
          </div>
        </div>
      </DetailSection>

      <DetailSection eyebrow="Meaning In Use" title="Usage & Nuance" accentClass="text-indigo-500">
        <div className="flex items-center justify-between gap-4 mb-5">
          <div>
            <p className="text-sm font-bold text-gray-700">Ask AI for extra nuance or usage detail.</p>
            <p className="text-xs text-gray-400 mt-1">This is helpful for subtle meanings or context differences.</p>
          </div>
          <button onClick={onAskNuance} disabled={isAskingAI} className="text-[9px] font-black bg-blue-50 text-blue-600 px-4 py-2 rounded-full hover:bg-blue-100 transition-all disabled:opacity-50">
            {isAskingAI ? "Analyzing..." : "Ask AI"}
          </button>
        </div>
        {tempNuance && (
          <div className="bg-indigo-50/50 rounded-[2rem] p-6 sm:p-8 border-2 border-dashed border-indigo-100 animate-in fade-in duration-500">
            <p className="text-sm lg:text-base font-medium text-gray-700 whitespace-pre-wrap leading-relaxed">{tempNuance}</p>
            <p className="text-[8px] font-bold text-indigo-300 mt-4 uppercase">※ Insight not saved in library.</p>
          </div>
        )}
        {!tempNuance && !isAskingAI && (
          <div className="rounded-[1.75rem] border-2 border-dashed border-gray-200 bg-gray-50 px-5 py-6">
            <p className="text-sm font-medium text-gray-500">No AI nuance yet. Use the button above when you want extra usage context.</p>
          </div>
        )}
      </DetailSection>

      {vocab.root_word && (
        <DetailSection eyebrow="Word History" title="Etymology & Root" accentClass="text-rose-500">
          <div className="bg-rose-50 rounded-[1.75rem] p-5 sm:p-7 border-2 border-rose-100">
            <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-2">Origin</p>
            <Link
              href={`/root/${encodeRootPath(vocab.root_word)}`}
              className="inline-block text-base sm:text-lg font-bold text-rose-700 hover:text-rose-500 hover:underline transition-all"
            >
              {vocab.root_word.replace(/^\*/, "")}
            </Link>

            {relatedWords.length > 0 && (
              <div className="mt-6 border-t-2 border-rose-100 pt-6">
                <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-4">Words sharing this root</p>
                <div className="flex flex-wrap gap-3">
                  {relatedWords.map((rw) => (
                    <Link
                      href={`/word/${rw.id}`}
                      key={rw.id}
                      className="bg-white border-2 border-rose-100 px-4 py-2 rounded-xl hover:border-rose-400 transition-all group flex flex-col"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black bg-rose-50 text-rose-500 px-2 py-0.5 rounded-md uppercase">{rw.language_code}</span>
                        <span className="font-bold text-gray-800 group-hover:text-rose-600 transition-colors">{rw.word}</span>
                      </div>
                      <span className="text-[10px] font-medium text-gray-400 mt-1">{rw.translation}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DetailSection>
      )}

      {vocab.categories && (
        <DetailSection eyebrow="Where It Fits" title="Category & Navigation" accentClass="text-indigo-500">
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] gap-4">
            <div className="bg-indigo-50 p-5 sm:p-6 rounded-[1.75rem] border border-indigo-100">
              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">Topic Path</p>
              <p className="font-bold text-indigo-900 text-sm sm:text-base break-words leading-relaxed">
                {vocab.categories.full_path}
              </p>
            </div>
            <Link
              href={`/study/${vocab.language_code}/topics/${vocab.category_id}`}
              className="bg-white p-5 sm:p-6 rounded-[1.75rem] border-2 border-gray-200 hover:border-indigo-300 transition-all group"
            >
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Study More Like This</p>
              <p className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                Open {mainTopicName}
              </p>
              <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mt-4">Go to topic list</p>
            </Link>
          </div>
        </DetailSection>
      )}
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
    <div className="space-y-6 mt-10 lg:mt-12 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <h2 className="text-2xl font-black tracking-tight">Edit Word Details</h2>
        <div className="flex flex-col gap-2">
          <button
            onClick={onAutoFill}
            disabled={isAutoFilling}
            className="bg-purple-100 text-purple-600 px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-purple-200 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
          >
            {isAutoFilling ? "✨ Auto-filling..." : "🪄 AI Auto-Fill"}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-y-6 lg:gap-y-8">
        <div className="grid grid-cols-1 gap-6 lg:gap-8 items-start">
          <FieldWrapper label="Word">
            <input type="text" value={editForm.word} onChange={(e) => onChange("word", e.target.value)} className={`${baseInputClass} ${colorTheme.gray.input}`} />
            <input type="text" value={editForm.hint} onChange={(e) => onChange("hint", e.target.value)} placeholder="Hint for AI: specific meaning or part of speech..." className={`mt-2 p-2 rounded-xl text-[9px] font-bold outline-none w-full border border-blue-100 ${colorTheme.blue.input}`} />
          </FieldWrapper>
        </div>

        <FieldWrapper label="Category Taxonomy" color="purple">
          <div className="flex flex-col md:flex-row gap-3 w-full">
            <select value={selL1} onChange={(e) => onL1Change(e.target.value)} className={`flex-1 ${baseInputClass} ${colorTheme.purple.input} text-sm`}>
              <option value="">-- Main Category --</option>
              {l1Options.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>

            {l2Options.length > 0 && (
              <select value={selL2} onChange={(e) => onL2Change(e.target.value)} className={`flex-1 ${baseInputClass} ${colorTheme.purple.input} text-sm animate-in fade-in slide-in-from-left-2`}>
                <option value="">-- Sub Category --</option>
                {l2Options.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select>
            )}

            {l3Options.length > 0 && (
              <select value={selL3} onChange={(e) => onL3Change(e.target.value)} className={`flex-1 ${baseInputClass} ${colorTheme.purple.input} text-sm animate-in fade-in slide-in-from-left-2`}>
                <option value="">-- Specific Topic --</option>
                {l3Options.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select>
            )}
          </div>
        </FieldWrapper>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 mt-2">
          <FieldWrapper label="Meaning">
            <input type="text" value={editForm.translation} onChange={(e) => onChange("translation", e.target.value)} className={`${baseInputClass} ${colorTheme.gray.input}`} />
          </FieldWrapper>
          <FieldWrapper label="Part of Speech">
            <input type="text" value={editForm.pos} onChange={(e) => onChange("pos", e.target.value)} className={`${baseInputClass} ${colorTheme.gray.input}`} />
          </FieldWrapper>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          <FieldWrapper label="Gender" color="emerald">
            <input type="text" value={editForm.gender} onChange={(e) => onChange("gender", e.target.value)} className={`${baseInputClass} ${colorTheme.emerald.input}`} />
          </FieldWrapper>
          <FieldWrapper label="Verb Type" color="emerald">
            <input type="text" value={editForm.verbType} onChange={(e) => onChange("verbType", e.target.value)} className={`${baseInputClass} ${colorTheme.emerald.input}`} />
          </FieldWrapper>
          <FieldWrapper label="Root Word (Etymology)" color="rose">
            <input type="text" value={editForm.rootWord} onChange={(e) => onChange("rootWord", e.target.value)} placeholder="e.g. noctem (Latin)" className={`${baseInputClass} ${colorTheme.rose.input}`} />
          </FieldWrapper>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          <FieldWrapper label="Example Sentence" color="blue">
            <textarea value={editForm.example} onChange={(e) => onChange("example", e.target.value)} rows={3} className={`${baseTextareaClass} ${colorTheme.blue.input}`} />
          </FieldWrapper>
          <FieldWrapper label="Example Translation" color="blue">
            <textarea value={editForm.exampleTranslation} onChange={(e) => onChange("exampleTranslation", e.target.value)} rows={3} className={`${baseTextareaClass} ${colorTheme.blue.input}`} />
          </FieldWrapper>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          <FieldWrapper label="Conjugation Guide" color="amber">
            <textarea value={editForm.conjugation} onChange={(e) => onChange("conjugation", e.target.value)} rows={5} className={`${baseTextareaClass} ${colorTheme.amber.input}`} />
          </FieldWrapper>
          <FieldWrapper label="Notes / Grammar Pattern">
            <textarea value={editForm.notes} onChange={(e) => onChange("notes", e.target.value)} rows={4} className={`${baseTextareaClass} ${colorTheme.gray.input}`} />
          </FieldWrapper>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 pt-6">
          <button onClick={onCancel} className="w-full sm:w-1/3 bg-gray-100 text-gray-500 font-black py-4 rounded-2xl hover:bg-gray-200 transition-colors">Cancel</button>
          <button onClick={onSave} className="flex-1 bg-blue-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all">Save Changes</button>
        </div>
      </div>
    </div>
  );
}
