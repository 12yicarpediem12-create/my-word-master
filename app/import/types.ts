export interface ParsedRow {
  rowNumber: number;
  word: string;
  translation: string;
  pos: string;
  gender: string;
  verb_type: string;
  root_word: string;
  category_main: string;
  category_sub: string;
  category_sub_sub: string;
  example_sentence: string;
  example_translation: string;
  conjugation: string;
  notes: string;
}

export interface AnalyzedWord {
  id: number;
  rowNumber: number;
  word: string;
  translation: string;
  part_of_speech: string;
  gender: string;
  root_word: string;
  verb_type: string;
  category_main: string;
  category_sub: string;
  category_sub_sub: string;
  category_id: string;
  example_sentence: string;
  example_translation: string;
  conjugation: string;
  notes: string;
  ai_hint?: string;
  ai_status?: "ready" | "needs_hint";
  ai_message?: string;
}

export type ImportLog = {
  word: string;
  status: "success" | "error" | "skipped" | "needs_hint";
  message?: string;
};

export type Phase = "idle" | "analyzing" | "review" | "saving" | "done";

export type ImportProgress = {
  current: number;
  total: number;
  currentWord: string | null;
  currentStage: string | null;
};

export type ImportBatchRunSummary = {
  attempted: number;
  updated: number;
  noResult: number;
  failed: number;
  sampleDetail?: string;
};

export type ImportValidationIssue = {
  rowNumber: number;
  field: "header" | "word" | "meaning" | "pos" | "gender" | "verb_type" | "file";
  reason: string;
};

export type ImportDuplicateCandidate = {
  rowNumber: number;
  duplicateOfRowNumber: number;
  word: string;
  pos: string;
  meaning: string;
};

export type ImportPreviewSummary = {
  detectedDelimiter: "," | "\t" | "";
  isCanonicalSchema: boolean;
  totalRows: number;
  validRows: number;
  skippedRows: number;
  errorRows: number;
  issues: ImportValidationIssue[];
  duplicateCandidates: ImportDuplicateCandidate[];
};
