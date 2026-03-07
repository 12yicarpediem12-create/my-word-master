import type { VocabDetail } from "./types";

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
