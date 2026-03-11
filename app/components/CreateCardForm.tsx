"use client";
import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { generateVocabInfo } from "../actions/ai";
import { addVocabWord } from "../actions/vocab";
import { getSupabaseBrowserClient } from "@/app/lib/supabase-browser";
import type { Category, Language } from "@/app/lib/types";
import {
  appendDuplicateEntry,
  buildDuplicateIndex,
  getCategoryHierarchyOptions,
  getCategorySelection,
  getCategorySelectionAfterL1Change,
  getCategorySelectionAfterL2Change,
  getCategorySelectionAfterL3Change,
  hasDuplicateEntry,
  normalizeRootWord,
  type DuplicateIndexEntry,
} from "@/app/lib/vocab-form";

const supabase = getSupabaseBrowserClient();

type CreateCardFormData = {
  word: string;
  hint: string;
  translation: string;
  pos: string;
  gender: string;
  verbType: string;
  categoryId: string;
  example: string;
  exampleTranslation: string;
  conjugation: string;
  notes: string;
  rootWord: string;
};

const initialForm: CreateCardFormData = {
  word: "", hint: "", translation: "", pos: "", gender: "",
  verbType: "", categoryId: "", example: "", exampleTranslation: "",
  conjugation: "", notes: "", rootWord: "" 
};

const colorTheme = {
  gray: { label: "text-gray-400", input: "bg-gray-50 border-gray-100 text-gray-900 focus:border-blue-400" },
  emerald: { label: "text-emerald-500", input: "bg-emerald-50/20 border-emerald-100 text-emerald-800 focus:border-emerald-400" },
  purple: { label: "text-purple-500", input: "bg-purple-50/20 border-purple-100 text-purple-800 focus:border-purple-400" },
  blue: { label: "text-blue-400", input: "bg-blue-50/30 border-blue-100 text-blue-900 focus:border-blue-400" },
  amber: { label: "text-amber-500", input: "bg-amber-50/30 border-amber-100 text-amber-900 focus:border-amber-400" },
  rose: { label: "text-rose-500", input: "bg-rose-50/30 border-rose-100 text-rose-900 focus:border-rose-400" }
};

const FieldWrapper = ({ label, color = "gray", children }: { label: string, color?: keyof typeof colorTheme, children: ReactNode }) => (
  <div className="flex flex-col gap-2 w-full">
    <label className={`text-[9px] font-black uppercase tracking-tight ml-2 ${colorTheme[color].label}`}>
      {label}
    </label>
    {children}
  </div>
);

export default function CreateCardForm() {
  const router = useRouter();
  const [languages, setLanguages] = useState<Language[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedLang, setSelectedLang] = useState("");
  
  const [selL1, setSelL1] = useState<string>("");
  const [selL2, setSelL2] = useState<string>("");
  const [selL3, setSelL3] = useState<string>("");

  const [formData, setFormData] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState(false);
  const [duplicateIndex, setDuplicateIndex] = useState<DuplicateIndexEntry[]>([]);

  const refreshDuplicateIndex = useCallback(async (languageCode: string) => {
    if (!languageCode) {
      setDuplicateIndex([]);
      return [];
    }

    const { data, error } = await supabase
      .from("vocab")
      .select("word, part_of_speech, translation")
      .eq("language_code", languageCode);

    if (error) {
      throw new Error(`Failed to load duplicate index: ${error.message}`);
    }
    const nextIndex = buildDuplicateIndex((data || []) as Array<{ word: string; part_of_speech?: string | null; translation?: string | null }>);
    setDuplicateIndex(nextIndex);
    return nextIndex;
  }, []);

  useEffect(() => {
    async function fetchData() {
      const [langRes, catRes] = await Promise.all([
        supabase.from("languages").select("*"),
        supabase.from("categories").select("*")
      ]);
      if (langRes.data) {
        setLanguages(langRes.data);
        if (langRes.data.length > 0) setSelectedLang(langRes.data[0].code);
      }
      if (catRes.data) {
        setCategories(catRes.data);
      }
    }
    fetchData();
  }, []);

  useEffect(() => {
    async function loadDuplicateIndex() {
      try {
        await refreshDuplicateIndex(selectedLang);
      } catch (error) {
        setErrorMsg(error instanceof Error ? error.message : "Failed to load duplicate index.");
        setDuplicateIndex([]);
      }
    }
    loadDuplicateIndex();
  }, [refreshDuplicateIndex, selectedLang]);

  const handleChange = (field: keyof CreateCardFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateCategoryHierarchy = (categoryId: string | number | null, allCats: Category[]) => {
    const selection = getCategorySelection(categoryId, allCats);
    setSelL1(selection.l1);
    setSelL2(selection.l2);
    setSelL3(selection.l3);
    handleChange("categoryId", selection.categoryId);
  };

  const handleL1Change = (val: string) => {
    const selection = getCategorySelectionAfterL1Change(val);
    setSelL1(selection.l1);
    setSelL2(selection.l2);
    setSelL3(selection.l3);
    handleChange("categoryId", selection.categoryId);
  };

  const handleL2Change = (val: string) => {
    const selection = getCategorySelectionAfterL2Change(val, selL1);
    setSelL1(selection.l1);
    setSelL2(selection.l2);
    setSelL3(selection.l3);
    handleChange("categoryId", selection.categoryId);
  };

  const handleL3Change = (val: string) => {
    const selection = getCategorySelectionAfterL3Change(val, selL1, selL2);
    setSelL1(selection.l1);
    setSelL2(selection.l2);
    setSelL3(selection.l3);
    handleChange("categoryId", selection.categoryId);
  };

  const handleAIGenerate = async () => {
    if (!formData.word.trim()) return;
    setErrorMsg(null);
    setSuccessMsg(false);
    setIsGenerating(true);

    try {
      const latestDuplicateIndex = await refreshDuplicateIndex(selectedLang);
      const aiData = await generateVocabInfo({
        word: formData.word,
        langCode: selectedLang,
        hint: formData.hint,
        intendedPos: formData.pos,
        intendedMeaning: formData.translation,
        source: "add",
      });
      if (aiData?.error) { setErrorMsg("AI Error: " + aiData.error); return; }

      if (aiData) {
        const isDup = hasDuplicateEntry(
          latestDuplicateIndex,
          aiData.word || formData.word,
          aiData.part_of_speech,
          aiData.translation || formData.translation
        );
        if (isDup) {
          setErrorMsg(`Already in library as ${aiData.part_of_speech} · ${aiData.translation || formData.translation}.`);
          setIsGenerating(false);
          return;
        }

        updateCategoryHierarchy(aiData.category_id, categories);

        setFormData(prev => ({
          ...prev,
          word: aiData.word || prev.word,
          translation: String(aiData.translation || ""),
          pos: String(aiData.part_of_speech || ""),
          gender: String(aiData.gender || ""),
          verbType: String(aiData.verb_type || ""),
          example: String(aiData.example_sentence || ""),
          exampleTranslation: String(aiData.example_translation || ""),
          conjugation: String(aiData.conjugation || ""),
          notes: String(aiData.notes || ""),
          rootWord: normalizeRootWord(aiData.root_word)
        }));
      }
    } catch (error) {
      setErrorMsg(`System Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddWord = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.word || !formData.translation || !selectedLang) return;
    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(false);

    try {
      const latestDuplicateIndex = await refreshDuplicateIndex(selectedLang);
      const isDup = hasDuplicateEntry(latestDuplicateIndex, formData.word, formData.pos, formData.translation);
      if (isDup) {
        setErrorMsg("This word + Part of Speech + Meaning already exists.");
        setIsSubmitting(false);
        return;
      }
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : "Failed to verify duplicates.");
      setIsSubmitting(false);
      return;
    }
    
    const { error } = await addVocabWord({
      language_code: selectedLang, word: formData.word.trim(), translation: formData.translation.trim(),
      part_of_speech: formData.pos || null, gender: formData.gender || null, verb_type: formData.verbType || null,
      category_id: formData.categoryId || null, example_sentence: formData.example || null,
      example_translation: formData.exampleTranslation || null, conjugation: formData.conjugation || null,
      notes: formData.notes || null, 
      root_word: formData.rootWord || null, 
      is_remembered: false,
    });

    setIsSubmitting(false);

    if (!error) {
      setDuplicateIndex((prev) => appendDuplicateEntry(prev, formData.word, formData.pos, formData.translation));
      setFormData(initialForm);
      setSelL1(""); setSelL2(""); setSelL3("");
      setSuccessMsg(true);
      router.refresh(); 
      setTimeout(() => setSuccessMsg(false), 3000);
    } else {
      setErrorMsg("Error: " + error);
    }
  };

  const baseInputClass = "w-full p-4 border-2 rounded-2xl font-bold outline-none transition-all";
  const baseTextareaClass = "w-full p-4 border-2 rounded-2xl font-medium outline-none resize-none transition-all";

  const { l1Options, l2Options, l3Options } = getCategoryHierarchyOptions(categories, selL1, selL2);

  return (
    <div className="surface-card relative overflow-hidden rounded-[2rem] p-6 sm:p-10 lg:p-12 transition-all">
      <div className="absolute top-0 right-0 rounded-bl-2xl border-b border-l border-blue-100 bg-blue-50/90 px-6 py-3 text-[10px] font-black uppercase tracking-widest text-blue-600">
        ADD NEW WORD
      </div>

      {errorMsg && (
        <div className="mt-8 p-4 bg-red-50 border-2 border-red-200 text-red-600 font-bold rounded-2xl flex items-center justify-between animate-in fade-in zoom-in-95">
          <span>⚠️ {errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="text-xl">×</button>
        </div>
      )}

      {successMsg && (
        <div className="mt-8 p-4 bg-emerald-50 border-2 border-emerald-200 text-emerald-600 font-bold rounded-2xl flex items-center animate-in fade-in slide-in-from-top-4">
          <span>✅ Successfully added to your library!</span>
        </div>
      )}

      <form onSubmit={handleAddWord} className="flex flex-col gap-y-8 lg:gap-y-10 mt-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-start">
          <FieldWrapper label="Language">
            <select value={selectedLang} onChange={(e) => setSelectedLang(e.target.value)} className={`${baseInputClass} ${colorTheme.gray.input}`}>
              {languages.map((l) => (
                <option key={l.code} value={l.code}>{l.emoji} {l.name}</option>
              ))}
            </select>
          </FieldWrapper>

          <FieldWrapper label="Word">
            <div className="flex gap-2 w-full">
              <input type="text" value={formData.word} onChange={(e) => handleChange("word", e.target.value)} required placeholder="e.g. mela" className={`flex-1 min-w-0 ${baseInputClass} ${colorTheme.gray.input}`} />
              <button type="button" onClick={handleAIGenerate} disabled={isGenerating || !formData.word.trim()} className="px-5 py-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-black rounded-2xl text-[10px] shadow-md disabled:opacity-50 shrink-0 hover:opacity-90 transition-opacity">
                {isGenerating ? "..." : "Auto-Fill"}
              </button>
            </div>
            <div className="mt-2 space-y-2">
              <input
                type="text"
                value={formData.hint}
                onChange={(e) => handleChange("hint", e.target.value)}
                placeholder="Disambiguation hint: verb — to record audio, noun — a written record"
                className={`p-2 rounded-xl text-[10px] font-bold outline-none w-full border border-blue-100 ${colorTheme.blue.input}`}
              />
              <p className="ml-2 text-[11px] leading-relaxed text-slate-500">
                Use this when one spelling can map to multiple parts of speech or meanings. The AI will create one lexical entry only.
              </p>
            </div>
          </FieldWrapper>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          <FieldWrapper label="Meaning">
            <input type="text" value={formData.translation} onChange={(e) => handleChange("translation", e.target.value)} required placeholder="English translation" className={`${baseInputClass} ${colorTheme.gray.input}`} />
          </FieldWrapper>
          <FieldWrapper label="Intended Part of Speech">
            <div className="space-y-2">
              <input type="text" value={formData.pos} onChange={(e) => handleChange("pos", e.target.value)} placeholder="Verb" className={`${baseInputClass} ${colorTheme.gray.input}`} />
              <p className="ml-2 text-[11px] leading-relaxed text-slate-500">
                Add a POS here if you already know it. This helps the AI stay on one specific record instead of blending senses.
              </p>
            </div>
          </FieldWrapper>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          <FieldWrapper label="Gender" color="emerald">
            <input type="text" value={formData.gender} onChange={(e) => handleChange("gender", e.target.value)} placeholder="Feminine" className={`${baseInputClass} ${colorTheme.emerald.input}`} />
          </FieldWrapper>
          <FieldWrapper label="Verb Type" color="emerald">
            <input type="text" value={formData.verbType} onChange={(e) => handleChange("verbType", e.target.value)} placeholder="Transitive" className={`${baseInputClass} ${colorTheme.emerald.input}`} />
          </FieldWrapper>
          <FieldWrapper label="Root Word (Etymology)" color="rose">
            <input type="text" value={formData.rootWord} onChange={(e) => handleChange("rootWord", e.target.value)} placeholder="e.g. noctem (Latin)" className={`${baseInputClass} ${colorTheme.rose.input}`} />
          </FieldWrapper>
        </div>

        <FieldWrapper label="Category Taxonomy" color="purple">
          <div className="flex flex-col md:flex-row gap-3 w-full">
            <select value={selL1} onChange={(e) => handleL1Change(e.target.value)} className={`flex-1 ${baseInputClass} ${colorTheme.purple.input} text-sm`}>
              <option value="">-- Main Category --</option>
              {l1Options.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            
            {l2Options.length > 0 && (
              <select value={selL2} onChange={(e) => handleL2Change(e.target.value)} className={`flex-1 ${baseInputClass} ${colorTheme.purple.input} text-sm animate-in fade-in slide-in-from-left-2`}>
                <option value="">-- Sub Category --</option>
                {l2Options.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            )}

            {l3Options.length > 0 && (
              <select value={selL3} onChange={(e) => handleL3Change(e.target.value)} className={`flex-1 ${baseInputClass} ${colorTheme.purple.input} text-sm animate-in fade-in slide-in-from-left-2`}>
                <option value="">-- Specific Topic --</option>
                {l3Options.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            )}
          </div>
        </FieldWrapper>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          <FieldWrapper label="Example Sentence" color="blue">
            <textarea value={formData.example} onChange={(e) => handleChange("example", e.target.value)} rows={3} placeholder="Example..." className={`${baseTextareaClass} ${colorTheme.blue.input}`} />
          </FieldWrapper>
          <FieldWrapper label="Example Translation" color="blue">
            <textarea value={formData.exampleTranslation} onChange={(e) => handleChange("exampleTranslation", e.target.value)} rows={3} placeholder="Translation..." className={`${baseTextareaClass} ${colorTheme.blue.input}`} />
          </FieldWrapper>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          <FieldWrapper label="Conjugation Guide" color="amber">
            <textarea value={formData.conjugation} onChange={(e) => handleChange("conjugation", e.target.value)} rows={4} className={`${baseTextareaClass} ${colorTheme.amber.input}`} />
          </FieldWrapper>
          <FieldWrapper label="Notes / Grammar Pattern">
            <textarea value={formData.notes} onChange={(e) => handleChange("notes", e.target.value)} rows={4} className={`${baseTextareaClass} ${colorTheme.gray.input}`} />
          </FieldWrapper>
        </div>

        <button type="submit" disabled={isSubmitting} className="w-full bg-gray-900 text-white font-black text-lg py-5 rounded-[2rem] hover:bg-black transition-all shadow-lg disabled:bg-gray-400 mt-2">
          {isSubmitting ? "ADDING..." : "+ ADD TO LIBRARY"}
        </button>
      </form>
    </div>
  );
}
