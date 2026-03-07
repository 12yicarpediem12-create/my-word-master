export interface Language {
  code: string;
  name: string;
  emoji: string | null;
  created_at?: string | null;
}

export interface Category {
  id: number;
  name: string;
  full_path: string;
  level: number;
  parent_id: number | null;
}

export interface VocabItem {
  id: string;
  user_id?: string | null;
  language_code: string;
  word: string;
  translation: string;
  part_of_speech: string | null;
  gender: string | null;
  verb_type: string | null;
  category_id: number | null;
  example_sentence: string | null;
  example_translation: string | null;
  conjugation: string | null;
  notes: string | null;
  root_word: string | null;
  is_remembered: boolean;
  created_at: string | null;
  last_reviewed: string | null;
  next_review_date: string | null;
  mistake_count: number | null;
  repetition?: number | null;
  efactor?: number | null;
  interval?: number | null;
}

export interface VocabCategoryRef {
  id: number;
  name: string;
  full_path: string;
}

export interface VocabDetail extends VocabItem {
  categories: VocabCategoryRef | null;
}

export interface HeatmapValue {
  date: string;
  count: number;
}
