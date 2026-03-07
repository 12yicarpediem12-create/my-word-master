export interface ParsedRow {
  word: string;
  translation?: string;
  pos?: string;
}

export interface AnalyzedWord {
  id: number;
  word: string;
  translation: string;
  part_of_speech: string;
  gender: string;
  root_word: string;
  verb_type: string;
  category_id: string;
  example_sentence: string;
  example_translation: string;
  conjugation: string;
  notes: string;
  ai_status?: "ready" | "needs_hint";
  ai_message?: string;
}

export type ImportLog = {
  word: string;
  status: "success" | "error" | "skipped";
  message?: string;
};

export type Phase = "idle" | "analyzing" | "review" | "saving" | "done";
