import type { Category, VocabDetail } from "./types";

export interface EditFormData {
  word: string;
  hint: string;
  translation: string;
  pos: string;
  notes: string;
  example: string;
  exampleTranslation: string;
  categoryId: string;
  conjugation: string;
  gender: string;
  verbType: string;
  rootWord: string;
}

export function normalizeRootWord(value: string | null | undefined): string {
  return String(value || "").replace(/^\*/, "").replace(/\s*↗$/, "");
}

export function buildEditFormFromVocab(vocab: VocabDetail): EditFormData {
  return {
    word: vocab.word || "",
    hint: "",
    translation: vocab.translation || "",
    pos: vocab.part_of_speech || "",
    notes: vocab.notes || "",
    example: vocab.example_sentence || "",
    exampleTranslation: vocab.example_translation || "",
    categoryId: vocab.category_id ? String(vocab.category_id) : "",
    conjugation: vocab.conjugation || "",
    gender: vocab.gender || "",
    verbType: vocab.verb_type || "",
    rootWord: vocab.root_word || "",
  };
}

export function resolveCategoryHierarchy(
  categoryId: string | number | null,
  allCats: Category[]
): { l1: string; l2: string; l3: string } {
  if (!categoryId) {
    return { l1: "", l2: "", l3: "" };
  }

  let current = allCats.find((c) => String(c.id) === String(categoryId));
  let l1 = "";
  let l2 = "";
  let l3 = "";

  if (current?.level === 3) {
    l3 = String(current.id);
    current = allCats.find((c) => String(c.id) === String(current?.parent_id));
  }
  if (current?.level === 2) {
    l2 = String(current.id);
    current = allCats.find((c) => String(c.id) === String(current?.parent_id));
  }
  if (current?.level === 1) {
    l1 = String(current.id);
  }

  return { l1, l2, l3 };
}
