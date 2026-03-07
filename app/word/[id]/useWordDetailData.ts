"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getWordNuance, generateWordDetails } from "../../actions/ai";
import { deleteVocabWord, setVocabRemembered, updateVocabWord } from "../../actions/vocab";
import { getSupabaseBrowserClient } from "@/app/lib/supabase-browser";
import type { Category, VocabDetail, VocabItem } from "@/app/lib/types";
import { buildEditFormFromVocab, type EditFormData } from "@/app/lib/word-detail";
import {
  buildDuplicateIndex,
  getComparableLemma,
  getCategoryHierarchyOptions,
  getCategorySelection,
  getCategorySelectionAfterL1Change,
  getCategorySelectionAfterL2Change,
  getCategorySelectionAfterL3Change,
  hasDuplicateEntry,
  normalizeRootWord,
} from "@/app/lib/vocab-form";

const supabase = getSupabaseBrowserClient();

const WORD_DETAIL_COLUMNS =
  "id, language_code, word, translation, part_of_speech, gender, verb_type, category_id, example_sentence, example_translation, conjugation, notes, root_word, is_remembered, created_at, last_reviewed, next_review_date, mistake_count, repetition, efactor, interval";

function getWordAiIntent(editForm: EditFormData) {
  return {
    hint: editForm.hint || "",
    intendedPos: editForm.pos || "",
    intendedMeaning: editForm.translation || "",
  };
}

async function loadRelatedWords(rootWord: string, wordId: string) {
  const { data, error } = await supabase
    .from("vocab")
    .select("id, word, language_code, translation")
    .eq("root_word", rootWord)
    .neq("id", wordId);

  return {
    data: (data || []) as VocabItem[],
    error,
  };
}

async function loadSiblingEntries(languageCode: string, comparableLemma: string, wordId: string) {
  const { data, error } = await supabase
    .from("vocab")
    .select(`${WORD_DETAIL_COLUMNS}, categories:category_id ( id, name, full_path )`)
    .eq("language_code", languageCode);

  if (error) {
    return {
      data: [] as VocabDetail[],
      error,
    };
  }

  return {
    data: ((data || []) as unknown as VocabDetail[]).filter(
      (entry) => String(entry.id) !== String(wordId) && getComparableLemma(entry.word) === comparableLemma
    ),
    error: null,
  };
}

async function wouldCreateDuplicateWordRecord(wordId: string, languageCode: string, word: string, partOfSpeech: string) {
  if (!partOfSpeech.trim()) {
    return false;
  }

  const { data, error } = await supabase
    .from("vocab")
    .select("word, part_of_speech")
    .eq("language_code", languageCode)
    .neq("id", wordId);

  if (error) {
    throw new Error(error.message);
  }

  const duplicateIndex = buildDuplicateIndex((data || []) as Array<{ word: string; part_of_speech?: string | null }>);
  return hasDuplicateEntry(duplicateIndex, word, partOfSpeech);
}

export function useWordDetailData(wordId: string) {
  const router = useRouter();

  const [vocab, setVocab] = useState<VocabDetail | null>(null);
  const [siblingEntries, setSiblingEntries] = useState<VocabDetail[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [relatedWords, setRelatedWords] = useState<VocabItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isAskingAI, setIsAskingAI] = useState(false);
  const [tempNuance, setTempNuance] = useState<string | null>(null);
  const [isAutoFilling, setIsAutoFilling] = useState(false);
  const [selL1, setSelL1] = useState("");
  const [selL2, setSelL2] = useState("");
  const [selL3, setSelL3] = useState("");
  const [editForm, setEditForm] = useState<EditFormData>({
    word: "",
    hint: "",
    translation: "",
    pos: "",
    notes: "",
    example: "",
    exampleTranslation: "",
    categoryId: "",
    conjugation: "",
    gender: "",
    verbType: "",
    rootWord: "",
  });

  const updateCategoryHierarchy = useCallback((categoryId: string | number | null, allCats: Category[]) => {
    const selection = getCategorySelection(categoryId, allCats);
    setSelL1(selection.l1);
    setSelL2(selection.l2);
    setSelL3(selection.l3);
    setEditForm((prev) => ({ ...prev, categoryId: selection.categoryId }));
  }, []);

  const syncRelatedWords = useCallback(
    async (rootWord: string | null) => {
      if (!rootWord) {
        setRelatedWords([]);
        return;
      }

      const { data, error } = await loadRelatedWords(rootWord, wordId);
      if (error) {
        setErrorMsg(error.message);
        return;
      }

      setRelatedWords(data);
    },
    [wordId]
  );

  const syncSiblingEntries = useCallback(
    async (languageCode: string, lemmaWord: string) => {
      const comparableLemma = getComparableLemma(lemmaWord);
      const { data, error } = await loadSiblingEntries(languageCode, comparableLemma, wordId);
      if (error) {
        setErrorMsg(error.message);
        return;
      }

      setSiblingEntries(data);
    },
    [wordId]
  );

  useEffect(() => {
    async function fetchData() {
      if (!wordId) return;

      setIsLoading(true);
      setErrorMsg(null);

      const [vocabRes, catRes] = await Promise.all([
        supabase
          .from("vocab")
          .select(`${WORD_DETAIL_COLUMNS}, categories:category_id ( id, name, full_path )`)
          .eq("id", wordId)
          .single(),
        supabase.from("categories").select("*").order("full_path"),
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
      await syncSiblingEntries(loadedVocab.language_code, loadedVocab.word);
      setEditForm(buildEditFormFromVocab(loadedVocab));
      updateCategoryHierarchy(loadedVocab.category_id, loadedCategories);
      await syncRelatedWords(loadedVocab.root_word);
      setIsLoading(false);
    }

    fetchData();
  }, [syncRelatedWords, syncSiblingEntries, updateCategoryHierarchy, wordId]);

  const handleChange = useCallback((field: keyof EditFormData, value: string) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleL1Change = useCallback(
    (value: string) => {
      const selection = getCategorySelectionAfterL1Change(value);
      setSelL1(selection.l1);
      setSelL2(selection.l2);
      setSelL3(selection.l3);
      handleChange("categoryId", selection.categoryId);
    },
    [handleChange]
  );

  const handleL2Change = useCallback(
    (value: string) => {
      const selection = getCategorySelectionAfterL2Change(value, selL1);
      setSelL1(selection.l1);
      setSelL2(selection.l2);
      setSelL3(selection.l3);
      handleChange("categoryId", selection.categoryId);
    },
    [handleChange, selL1]
  );

  const handleL3Change = useCallback(
    (value: string) => {
      const selection = getCategorySelectionAfterL3Change(value, selL1, selL2);
      setSelL1(selection.l1);
      setSelL2(selection.l2);
      setSelL3(selection.l3);
      handleChange("categoryId", selection.categoryId);
    },
    [handleChange, selL1, selL2]
  );

  const startEditing = useCallback(() => {
    if (!vocab) return;
    setEditForm(buildEditFormFromVocab(vocab));
    updateCategoryHierarchy(vocab.category_id, categories);
    setIsEditing(true);
  }, [categories, updateCategoryHierarchy, vocab]);

  const cancelEditing = useCallback(() => {
    if (vocab) {
      setEditForm(buildEditFormFromVocab(vocab));
      updateCategoryHierarchy(vocab.category_id, categories);
    }
    setIsEditing(false);
  }, [categories, updateCategoryHierarchy, vocab]);

  const handleAskNuance = useCallback(async () => {
    if (!vocab) return;

    setErrorMsg(null);
    setIsAskingAI(true);
    setTempNuance(null);

    try {
      const nuance = await getWordNuance(vocab.word, vocab.language_code, vocab.translation);
      setTempNuance(String(nuance).replace(/\*\*/g, ""));
    } catch (error) {
      console.error(error);
      setErrorMsg("Could not fetch nuance details.");
    } finally {
      setIsAskingAI(false);
    }
  }, [vocab]);

  const handleAutoFill = useCallback(async () => {
    if (!editForm.word || !vocab) return;

    setErrorMsg(null);
    setIsAutoFilling(true);

    try {
      const aiIntent = getWordAiIntent(editForm);
      const aiData = (await generateWordDetails(
        {
          word: editForm.word,
          langCode: vocab.language_code,
          hint: aiIntent.hint,
          intendedPos: aiIntent.intendedPos,
          intendedMeaning: aiIntent.intendedMeaning,
          source: "edit",
        }
      )) as Record<string, string | number | null | undefined> & { error?: string };

      if (aiData.error) {
        setErrorMsg(`AI Auto-Fill failed: ${aiData.error}`);
        return;
      }

      setEditForm((prev) => ({
        ...prev,
        translation: String(aiData.translation || prev.translation),
        pos: String(aiData.part_of_speech || prev.pos),
        gender: String(aiData.gender || prev.gender),
        verbType: String(aiData.verb_type || prev.verbType),
        conjugation: String(aiData.conjugation || prev.conjugation),
        example: String(aiData.example_sentence || prev.example),
        exampleTranslation: String(aiData.example_translation || prev.exampleTranslation),
        rootWord: normalizeRootWord(String(aiData.root_word || prev.rootWord)),
        notes: String(aiData.notes || prev.notes),
      }));

      if (aiData.category_id) {
        updateCategoryHierarchy(aiData.category_id, categories);
      }
    } catch (error) {
      console.error(error);
      setErrorMsg("AI Auto-Fill failed due to an unexpected error.");
    } finally {
      setIsAutoFilling(false);
    }
  }, [categories, editForm, updateCategoryHierarchy, vocab]);

  const handleUpdate = useCallback(async () => {
    setErrorMsg(null);

    if (!vocab) {
      setErrorMsg("Word not found.");
      return;
    }

    try {
      const wouldDuplicate = await wouldCreateDuplicateWordRecord(
        wordId,
        vocab.language_code,
        editForm.word,
        editForm.pos
      );

      if (wouldDuplicate) {
        setErrorMsg("Another record already exists for this word and part of speech.");
        return;
      }
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : "Could not verify duplicates.");
      return;
    }

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

    if (error) {
      setErrorMsg(`Update failed: ${error}`);
      return;
    }

    const selectedCategory = categories.find((category) => String(category.id) === String(editForm.categoryId));

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
        categories: selectedCategory
          ? { id: selectedCategory.id, name: selectedCategory.name, full_path: selectedCategory.full_path }
          : null,
      };
    });

    setIsEditing(false);
    await syncSiblingEntries(vocab.language_code, editForm.word);
    await syncRelatedWords(editForm.rootWord || null);
    router.refresh();
  }, [categories, editForm, router, syncRelatedWords, syncSiblingEntries, vocab, wordId]);

  const handleToggleRemembered = useCallback(async () => {
    if (!vocab) return;

    setErrorMsg(null);
    const newStatus = !vocab.is_remembered;
    const { error } = await setVocabRemembered(wordId, newStatus);

    if (error) {
      setErrorMsg(`Could not update mastery: ${error}`);
      return;
    }

    setVocab({ ...vocab, is_remembered: newStatus });
  }, [vocab, wordId]);

  const handleDelete = useCallback(async () => {
    if (!vocab) return;
    if (!window.confirm("Are you sure you want to delete this word from your library?")) return;

    setErrorMsg(null);
    setIsDeleting(true);
    const { error } = await deleteVocabWord(wordId);

    if (error) {
      setIsDeleting(false);
      setErrorMsg(`Delete failed: ${error}`);
      return;
    }

    router.push(`/study/${vocab.language_code}`);
  }, [router, vocab, wordId]);

  const { l1Options, l2Options, l3Options } = useMemo(
    () => getCategoryHierarchyOptions(categories, selL1, selL2),
    [categories, selL1, selL2]
  );
  const mainTopicName = useMemo(() => {
    if (!vocab?.categories?.full_path) return "General";
    return vocab.categories.full_path.split(" > ")[0];
  }, [vocab]);
  const secondaryContext = useMemo(
    () => ({
      categories,
      relatedWords,
      mainTopicName,
    }),
    [categories, relatedWords, mainTopicName]
  );

  return {
    vocab,
    currentRecord: vocab,
    siblingEntries,
    secondaryContext,
    relatedWords,
    isLoading,
    isEditing,
    isDeleting,
    errorMsg,
    setErrorMsg,
    isAskingAI,
    tempNuance,
    isAutoFilling,
    editForm,
    selL1,
    selL2,
    selL3,
    l1Options,
    l2Options,
    l3Options,
    mainTopicName,
    handleChange,
    handleL1Change,
    handleL2Change,
    handleL3Change,
    startEditing,
    cancelEditing,
    handleAskNuance,
    handleAutoFill,
    handleUpdate,
    handleToggleRemembered,
    handleDelete,
  };
}
