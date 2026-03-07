"use client";
import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { getWordNuance, generateWordDetails } from "../../actions/ai";
import { deleteVocabWord, setVocabRemembered, updateVocabWord } from "../../actions/vocab";
import AppHeader from "@/app/components/AppHeader";
import type { Category, VocabDetail, VocabItem } from "@/app/lib/types";
import { buildEditFormFromVocab, EditFormData, normalizeRootWord, resolveCategoryHierarchy } from "@/app/lib/word-detail";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const WORD_DETAIL_COLUMNS =
  "id, language_code, word, translation, part_of_speech, gender, verb_type, category_id, example_sentence, example_translation, conjugation, notes, root_word, is_remembered, created_at, last_reviewed, next_review_date, mistake_count, repetition, efactor, interval";

const colorTheme = {
  gray: { label: "text-gray-400", input: "bg-gray-50 border-gray-100 text-gray-900 focus:border-blue-400" },
  emerald: { label: "text-emerald-500", input: "bg-emerald-50/20 border-emerald-100 text-emerald-800 focus:border-emerald-400" },
  purple: { label: "text-purple-500", input: "bg-purple-50/20 border-purple-100 text-purple-800 focus:border-purple-400" },
  blue: { label: "text-blue-400", input: "bg-blue-50/30 border-blue-100 text-blue-900 focus:border-blue-400" },
  amber: { label: "text-amber-500", input: "bg-amber-50/30 border-amber-100 text-amber-900 focus:border-amber-400" },
  rose: { label: "text-rose-500", input: "bg-rose-50/30 border-rose-100 text-rose-900 focus:border-rose-400" } 
};

const FieldWrapper = ({ label, color = "gray", children }: { label: string, color?: keyof typeof colorTheme, children: React.ReactNode }) => (
  <div className="flex flex-col gap-2 w-full">
    <label className={`text-[9px] font-black uppercase tracking-tight ml-2 ${colorTheme[color].label}`}>
      {label}
    </label>
    {children}
  </div>
);

const DetailSection = ({
  eyebrow,
  title,
  accentClass,
  children,
}: {
  eyebrow: string;
  title: string;
  accentClass: string;
  children: React.ReactNode;
}) => (
  <section className="bg-white rounded-[2rem] p-6 sm:p-8 border-2 border-gray-200 shadow-sm">
    <p className={`text-[10px] font-black uppercase tracking-widest mb-3 ${accentClass}`}>{eyebrow}</p>
    <h2 className="text-xl sm:text-2xl font-black tracking-tight text-gray-900 mb-5">{title}</h2>
    {children}
  </section>
);

const QuickFact = ({
  label,
  value,
  tone = "gray",
}: {
  label: string;
  value: string;
  tone?: "gray" | "blue" | "emerald" | "rose";
}) => {
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
};

export default function WordDetail() {
  const params = useParams();
  const router = useRouter();
  const wordId = params.id as string;
  
  const [vocab, setVocab] = useState<VocabDetail | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [relatedWords, setRelatedWords] = useState<VocabItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const [isAskingAI, setIsAskingAI] = useState(false);
  const [tempNuance, setTempNuance] = useState<string | null>(null);
  const [isAutoFilling, setIsAutoFilling] = useState(false);

  const [selL1, setSelL1] = useState<string>("");
  const [selL2, setSelL2] = useState<string>("");
  const [selL3, setSelL3] = useState<string>("");

  const [editForm, setEditForm] = useState<EditFormData>({
    word: "", hint: "", translation: "", pos: "", notes: "", example: "",
    exampleTranslation: "", categoryId: "", conjugation: "", gender: "", verbType: "", rootWord: "" 
  });

  const handleChange = (field: keyof typeof editForm, value: string) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  const updateCategoryHierarchy = useCallback((categoryId: string | number | null, allCats: Category[]) => {
    const { l1, l2, l3 } = resolveCategoryHierarchy(categoryId, allCats);
    setSelL1(l1);
    setSelL2(l2);
    setSelL3(l3);
    setEditForm((prev) => ({ ...prev, categoryId: categoryId ? String(categoryId) : "" }));
  }, []);

  const handleL1Change = (val: string) => {
    setSelL1(val); setSelL2(""); setSelL3("");
    handleChange("categoryId", val);
  };

  const handleL2Change = (val: string) => {
    setSelL2(val); setSelL3("");
    handleChange("categoryId", val || selL1);
  };

  const handleL3Change = (val: string) => {
    setSelL3(val);
    handleChange("categoryId", val || selL2);
  };

  useEffect(() => {
    async function fetchData() {
      if (!wordId) return;
      setErrorMsg(null);
      const [vocabRes, catRes] = await Promise.all([
        supabase
          .from("vocab")
          .select(`${WORD_DETAIL_COLUMNS}, categories:category_id ( id, name, full_path )`)
          .eq("id", wordId)
          .single(),
        supabase.from("categories").select("*").order("full_path")
      ]);

      if (catRes.error) {
        setErrorMsg(catRes.error.message);
        setIsLoading(false);
        return;
      }
      const loadedCategories = (catRes.data || []) as Category[];
      setCategories(loadedCategories);

      if (vocabRes.error || !vocabRes.data) {
        setErrorMsg(vocabRes.error?.message || "Word not found.");
        setIsLoading(false);
        return;
      }

      const loadedVocab = vocabRes.data as unknown as VocabDetail;
      setVocab(loadedVocab);
      setEditForm(buildEditFormFromVocab(loadedVocab));

      if (loadedVocab.category_id) {
        updateCategoryHierarchy(loadedVocab.category_id, loadedCategories);
      }

      if (loadedVocab.root_word) {
        const { data: related, error: relatedError } = await supabase
          .from("vocab")
          .select("id, word, language_code, translation")
          .eq("root_word", loadedVocab.root_word)
          .neq("id", wordId);

        if (relatedError) {
          setErrorMsg(relatedError.message);
        } else if (related) {
          setRelatedWords(related as VocabItem[]);
        }
      }
      setIsLoading(false);
    }
    fetchData();
  }, [wordId, updateCategoryHierarchy]);

  const speak = useCallback((text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const langMap: Record<string, string> = { 
      it: "it-IT", fr: "fr-FR", es: "es-ES", de: "de-DE", pt: "pt-PT", ja: "ja-JP", ko: "ko-KR", ru: "ru-RU", zh: "zh-CN", en: "en-US",
    };
    const languageCode = vocab?.language_code || "en";
    utterance.lang = langMap[languageCode] || "en-US";
    window.speechSynthesis.speak(utterance);
  }, [vocab]);

  const handleAskNuance = async () => {
    if (!vocab) return;
    setErrorMsg(null);
    setIsAskingAI(true);
    setTempNuance(null);
    try {
      const nuance = await getWordNuance(vocab.word, vocab.language_code, vocab.translation);
      setTempNuance(String(nuance).replace(/\*\*/g, ''));
    } catch (err) {
      console.error(err);
      setErrorMsg("Could not fetch nuance details.");
    } finally { 
      setIsAskingAI(false); 
    }
  };

  const handleAutoFill = async () => {
    if (!editForm.word || !vocab) return;
    setErrorMsg(null);
    setIsAutoFilling(true);
    try {
      const contextHint = editForm.hint 
        ? ` (Hint: ${editForm.hint})` 
        : (editForm.pos || editForm.translation ? ` (Hint: User intends this word to be POS: "${editForm.pos}", meaning related to: "${editForm.translation}")` : "");

      const aiData = await generateWordDetails(editForm.word + contextHint, vocab.language_code) as Record<string, string | number | null | undefined> & { error?: string };
      
      if (!aiData.error) {
        setEditForm(prev => ({
          ...prev,
          translation: String(aiData.translation || prev.translation),
          pos: String(aiData.part_of_speech || prev.pos),
          gender: String(aiData.gender || prev.gender),
          verbType: String(aiData.verb_type || prev.verbType),
          conjugation: String(aiData.conjugation || prev.conjugation),
          example: String(aiData.example_sentence || prev.example),
          exampleTranslation: String(aiData.example_translation || prev.exampleTranslation),
          rootWord: normalizeRootWord(String(aiData.root_word || prev.rootWord)),
          notes: String(aiData.notes || prev.notes)
        }));

        if (aiData.category_id) {
          updateCategoryHierarchy(aiData.category_id, categories);
        }
      } else {
        setErrorMsg(`AI Auto-Fill failed: ${aiData.error}`);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("AI Auto-Fill failed due to an unexpected error.");
    } finally {
      setIsAutoFilling(false);
    }
  };

  const handleUpdate = async () => {
    setErrorMsg(null);
    const { error } = await updateVocabWord(wordId, {
      word: editForm.word,
      translation: editForm.translation,
      part_of_speech: editForm.pos || null,
      notes: editForm.notes || null,
      example_sentence: editForm.example || null,
      example_translation: editForm.exampleTranslation || null,
      category_id: editForm.categoryId || null,
      conjugation: editForm.conjugation || null,
      gender: editForm.gender || null,
      verb_type: editForm.verbType || null,
      root_word: editForm.rootWord || null,
    });

    if (!error) {
      const selectedCategory = categories.find(c => String(c.id) === String(editForm.categoryId));
      
      setVocab((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          word: editForm.word,
          translation: editForm.translation,
          part_of_speech: editForm.pos || null,
          notes: editForm.notes || null,
          example_sentence: editForm.example || null,
          example_translation: editForm.exampleTranslation || null,
          category_id: editForm.categoryId ? Number(editForm.categoryId) : null,
          conjugation: editForm.conjugation || null,
          gender: editForm.gender || null,
          verb_type: editForm.verbType || null,
          root_word: editForm.rootWord || null,
          categories: selectedCategory ? { id: selectedCategory.id, name: selectedCategory.name, full_path: selectedCategory.full_path } : null,
        };
      });
      setIsEditing(false);
      
      if (editForm.rootWord) {
        const { data: related, error: relatedError } = await supabase
          .from("vocab")
          .select("id, word, language_code, translation")
          .eq("root_word", editForm.rootWord)
          .neq("id", wordId);
        if (relatedError) {
          setErrorMsg(relatedError.message);
        } else if (related) {
          setRelatedWords(related as VocabItem[]);
        }
      } else {
        setRelatedWords([]);
      }
      router.refresh(); 
    } else {
      setErrorMsg(`Update failed: ${error}`);
    }
  };

  const handleToggleRemembered = async () => {
    if (!vocab) return;
    setErrorMsg(null);
    const newStatus = !vocab.is_remembered;
    const { error } = await setVocabRemembered(wordId, newStatus);
    if (!error) setVocab({ ...vocab, is_remembered: newStatus });
    else setErrorMsg(`Could not update mastery: ${error}`);
  };

  const handleDelete = async () => {
    if (!vocab) return;
    if (!window.confirm("Are you sure you want to delete this word from your library?")) return;
    setErrorMsg(null);
    setIsDeleting(true);
    const { error } = await deleteVocabWord(wordId);
    if (!error) router.push(`/study/${vocab.language_code}`);
    else {
      setIsDeleting(false);
      setErrorMsg(`Delete failed: ${error}`);
    }
  };

  const getMainTopicName = () => {
    if (!vocab?.categories?.full_path) return "General";
    return vocab.categories.full_path.split(" > ")[0];
  };

  if (isLoading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center font-bold text-gray-400">Loading...</div>;
  if (!vocab) return <div className="min-h-screen bg-gray-50 flex items-center justify-center font-bold">Word Not Found.</div>;

  const baseInputClass = "w-full p-4 border-2 rounded-2xl font-bold outline-none transition-all";
  const baseTextareaClass = "w-full p-4 border-2 rounded-2xl font-medium outline-none resize-none transition-all";

  const l1Options = categories.filter(c => c.level === 1);
  const l2Options = selL1 ? categories.filter(c => String(c.parent_id) === selL1) : [];
  const l3Options = selL2 ? categories.filter(c => String(c.parent_id) === selL2) : [];

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans pb-20">
      <AppHeader primarySection="library" backHref={`/study/${vocab.language_code}`} backLabel="Study Hub" />

      <main className="max-w-2xl lg:max-w-4xl mx-auto px-4 sm:px-6 py-8 lg:py-12 transition-all">
        <div className="bg-white rounded-[2.5rem] p-6 sm:p-10 lg:p-14 border-2 border-gray-200 shadow-lg relative overflow-hidden transition-all">
          {errorMsg && <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 text-red-600 font-bold rounded-2xl">{errorMsg}</div>}
          
          <div className="absolute top-0 right-0 bg-blue-50 text-blue-600 font-black uppercase tracking-widest px-6 py-3 border-b-2 border-l-2 border-blue-100 text-[10px]">
            {vocab.language_code}
          </div>

          {!isEditing ? (
            <div className="space-y-8 mt-6 lg:mt-8">
              <section className="bg-gradient-to-br from-gray-50 to-white rounded-[2.2rem] border-2 border-gray-200 p-6 sm:p-8 lg:p-10 shadow-sm">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                  <div className="min-w-0">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Study Focus</p>
                    <div className="flex items-center gap-4 flex-wrap">
                      <h1 className="text-4xl sm:text-6xl font-black break-all leading-tight tracking-tight">{vocab.word}</h1>
                      <button onClick={() => speak(vocab.word)} className="w-11 h-11 sm:w-12 sm:h-12 bg-white rounded-full border-2 border-gray-100 flex items-center justify-center text-lg hover:bg-blue-50 hover:border-blue-100 transition-all shadow-sm">
                        🔊
                      </button>
                    </div>
                    <p className="mt-4 text-2xl sm:text-3xl font-bold text-blue-600 leading-tight break-words">{vocab.translation}</p>
                    <div className="mt-5 flex flex-wrap gap-2">
                      <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest border border-blue-100">
                        {vocab.part_of_speech || "Word"}
                      </span>
                      <button
                        onClick={handleToggleRemembered}
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
                      onClick={() => {
                        setEditForm(buildEditFormFromVocab(vocab));
                        updateCategoryHierarchy(vocab.category_id, categories);
                        setIsEditing(true);
                      }}
                      className="bg-gray-900 text-white font-black px-5 py-3 rounded-2xl hover:bg-gray-800 transition-all shadow-sm"
                    >
                      Edit Details
                    </button>
                    <button
                      onClick={handleDelete}
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
                          onClick={() => speak(vocab.example_sentence || "")}
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
                  <button onClick={handleAskNuance} disabled={isAskingAI} className="text-[9px] font-black bg-blue-50 text-blue-600 px-4 py-2 rounded-full hover:bg-blue-100 transition-all disabled:opacity-50">
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
                      href={`/root/${encodeURIComponent(encodeURIComponent(vocab.root_word).replace(/\*/g, "%2A").replace(/\(/g, "%28").replace(/\)/g, "%29"))}`}
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
                        Open {getMainTopicName()}
                      </p>
                      <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mt-4">Go to topic list</p>
                    </Link>
                  </div>
                </DetailSection>
              )}
            </div>
          ) : (
            <div className="space-y-6 mt-10 lg:mt-12 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                <h2 className="text-2xl font-black tracking-tight">Edit Word Details</h2>
                <div className="flex flex-col gap-2"> 
                  <button 
                    onClick={handleAutoFill} 
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
                    <input type="text" value={editForm.word} onChange={(e) => handleChange("word", e.target.value)} className={`${baseInputClass} ${colorTheme.gray.input}`} />
                    <input type="text" value={editForm.hint} onChange={(e) => handleChange("hint", e.target.value)} placeholder="Hint for AI: specific meaning or part of speech..." className={`mt-2 p-2 rounded-xl text-[9px] font-bold outline-none w-full border border-blue-100 ${colorTheme.blue.input}`} />
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

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 mt-2">
                  <FieldWrapper label="Meaning">
                    <input type="text" value={editForm.translation} onChange={(e) => handleChange("translation", e.target.value)} className={`${baseInputClass} ${colorTheme.gray.input}`} />
                  </FieldWrapper>
                  <FieldWrapper label="Part of Speech">
                    <input type="text" value={editForm.pos} onChange={(e) => handleChange("pos", e.target.value)} className={`${baseInputClass} ${colorTheme.gray.input}`} />
                  </FieldWrapper>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
                  <FieldWrapper label="Gender" color="emerald">
                    <input type="text" value={editForm.gender} onChange={(e) => handleChange("gender", e.target.value)} className={`${baseInputClass} ${colorTheme.emerald.input}`} />
                  </FieldWrapper>
                  <FieldWrapper label="Verb Type" color="emerald">
                    <input type="text" value={editForm.verbType} onChange={(e) => handleChange("verbType", e.target.value)} className={`${baseInputClass} ${colorTheme.emerald.input}`} />
                  </FieldWrapper>
                  <FieldWrapper label="Root Word (Etymology)" color="rose">
                    <input type="text" value={editForm.rootWord} onChange={(e) => handleChange("rootWord", e.target.value)} placeholder="e.g. noctem (Latin)" className={`${baseInputClass} ${colorTheme.rose.input}`} />
                  </FieldWrapper>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                  <FieldWrapper label="Example Sentence" color="blue">
                    <textarea value={editForm.example} onChange={(e) => handleChange("example", e.target.value)} rows={3} className={`${baseTextareaClass} ${colorTheme.blue.input}`} />
                  </FieldWrapper>
                  <FieldWrapper label="Example Translation" color="blue">
                    <textarea value={editForm.exampleTranslation} onChange={(e) => handleChange("exampleTranslation", e.target.value)} rows={3} className={`${baseTextareaClass} ${colorTheme.blue.input}`} />
                  </FieldWrapper>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                  <FieldWrapper label="Conjugation Guide" color="amber">
                    <textarea value={editForm.conjugation} onChange={(e) => handleChange("conjugation", e.target.value)} rows={5} className={`${baseTextareaClass} ${colorTheme.amber.input}`} />
                  </FieldWrapper>
                  <FieldWrapper label="Notes / Grammar Pattern">
                    <textarea value={editForm.notes} onChange={(e) => handleChange("notes", e.target.value)} rows={4} className={`${baseTextareaClass} ${colorTheme.gray.input}`} />
                  </FieldWrapper>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-6">
                  <button onClick={() => setIsEditing(false)} className="w-full sm:w-1/3 bg-gray-100 text-gray-500 font-black py-4 rounded-2xl hover:bg-gray-200 transition-colors">Cancel</button>
                  <button onClick={handleUpdate} className="flex-1 bg-blue-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all">Save Changes</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
