import Papa from "papaparse";
import { normalizeMeaningForDuplicateCheck, normalizePartOfSpeech, normalizeWordForLookup } from "../lib/vocab-form.ts";
import type { Category } from "../lib/types.ts";
import type { ImportDuplicateCandidate, ImportPreviewSummary, ImportValidationIssue, ParsedRow } from "./types";

const SUPPORTED_DELIMITERS = [",", "\t"] as const;

const CANONICAL_HEADERS = [
  "word",
  "meaning",
  "pos",
  "gender",
  "verb_type",
  "root_word",
  "category_main",
  "category_sub",
  "category_sub_sub",
  "example_sentence",
  "example_translation",
  "conjugation",
  "notes",
] as const;

type CanonicalHeader = (typeof CANONICAL_HEADERS)[number];

const HEADER_ALIASES: Record<string, CanonicalHeader> = {
  word: "word",
  meaning: "meaning",
  translation: "meaning",
  pos: "pos",
  part_of_speech: "pos",
  gender: "gender",
  verb_type: "verb_type",
  root_word: "root_word",
  category_main: "category_main",
  category_sub: "category_sub",
  category_sub_sub: "category_sub_sub",
  example_sentence: "example_sentence",
  example_translation: "example_translation",
  conjugation: "conjugation",
  notes: "notes",
};

const REQUIRED_HEADERS: CanonicalHeader[] = ["word", "meaning", "pos"];

function normalizeHeader(header: string): string {
  return header.replace(/^\uFEFF/, "").trim().toLowerCase();
}

function canonicalizeHeader(header: string): string {
  const normalized = normalizeHeader(header);
  return HEADER_ALIASES[normalized] || normalized;
}

function normalizeCell(value: unknown): string {
  return String(value ?? "").replace(/^\uFEFF/, "").trim();
}

function normalizeImportPos(value: string): string {
  const normalized = normalizePartOfSpeech(value);
  if (!normalized) return "";
  if (normalized === "n" || normalized === "n.") return "noun";
  if (normalized === "v" || normalized === "v.") return "verb";
  if (normalized === "adj" || normalized === "adj.") return "adjective";
  if (normalized === "adv" || normalized === "adv.") return "adverb";
  if (normalized === "interj" || normalized === "interj.") return "interjection";
  if (normalized === "num" || normalized === "num.") return "numeral";
  if (normalized === "phrase" || normalized === "phr" || normalized === "phr.") return "phrase";
  return normalized;
}

function normalizeImportGender(value: string): string {
  const normalized = value.trim().toLowerCase().replace(/\s*\/\s*/g, "/");
  if (!normalized) return "";
  if (normalized === "masculine" || normalized === "m") return "Masculine";
  if (normalized === "feminine" || normalized === "f") return "Feminine";
  if (normalized === "neuter" || normalized === "n") return "Neuter";
  if (
    normalized === "masculine/feminine" ||
    normalized === "feminine/masculine" ||
    normalized === "m/f" ||
    normalized === "f/m"
  ) {
    return "Masculine/Feminine";
  }
  return value.trim();
}

function normalizeImportVerbType(value: string): string {
  const normalized = value.trim().toLowerCase().replace(/\s*\/\s*/g, "/");
  if (!normalized) return "";
  if (normalized === "transitive") return "Transitive";
  if (normalized === "intransitive") return "Intransitive";
  if (
    normalized === "transitive/intransitive" ||
    normalized === "intransitive/transitive" ||
    normalized === "transitive / intransitive"
  ) {
    return "Transitive/Intransitive";
  }
  return value.trim();
}

function isStructurallyEmptyRow(row: ParsedRow): boolean {
  return CANONICAL_HEADERS.every((header) => {
    if (header === "meaning") return row.translation.length === 0;
    if (header === "pos") return row.pos.length === 0;
    return row[header === "word" ? "word" : header].length === 0;
  });
}

function getIssueFieldLabel(field: CanonicalHeader): ImportValidationIssue["field"] {
  if (field === "meaning") return "meaning";
  return field as ImportValidationIssue["field"];
}

function buildDuplicateKey(row: ParsedRow): string {
  return [
    normalizeWordForLookup(row.word),
    normalizePartOfSpeech(row.pos),
    normalizeMeaningForDuplicateCheck(row.translation),
  ].join("::");
}

export function parseWordMasterImportText(text: string): { rows: ParsedRow[]; preview: ImportPreviewSummary } {
  const result = Papa.parse<Record<string, unknown>>(text, {
    header: true,
    skipEmptyLines: "greedy",
    delimiter: "",
    delimitersToGuess: [...SUPPORTED_DELIMITERS],
    transformHeader: canonicalizeHeader,
  });

  const issues: ImportValidationIssue[] = [];
  const duplicateCandidates: ImportDuplicateCandidate[] = [];
  const rows: ParsedRow[] = [];
  const firstSeenByKey = new Map<string, number>();

  for (const parseError of result.errors) {
    issues.push({
      rowNumber: (parseError.row ?? 0) + 2,
      field: "file",
      reason: parseError.message,
    });
  }

  const presentHeaders = new Set((result.meta.fields || []).map(canonicalizeHeader));
  const isCanonicalSchema = CANONICAL_HEADERS.every((header) => presentHeaders.has(header));
  for (const requiredHeader of REQUIRED_HEADERS) {
    if (!presentHeaders.has(requiredHeader)) {
      issues.push({
        rowNumber: 1,
        field: "header",
        reason: `Missing required header "${requiredHeader}".`,
      });
    }
  }

  let skippedRows = 0;
  let errorRows = 0;

  (result.data || []).forEach((rawRow, index) => {
    const parsedRow: ParsedRow = {
      rowNumber: index + 2,
      word: normalizeCell(rawRow.word),
      translation: normalizeCell(rawRow.meaning ?? rawRow.translation),
      pos: normalizeImportPos(normalizeCell(rawRow.pos ?? rawRow.part_of_speech)),
      gender: normalizeImportGender(normalizeCell(rawRow.gender)),
      verb_type: normalizeImportVerbType(normalizeCell(rawRow.verb_type)),
      root_word: normalizeCell(rawRow.root_word),
      category_main: normalizeCell(rawRow.category_main),
      category_sub: normalizeCell(rawRow.category_sub),
      category_sub_sub: normalizeCell(rawRow.category_sub_sub),
      example_sentence: normalizeCell(rawRow.example_sentence),
      example_translation: normalizeCell(rawRow.example_translation),
      conjugation: normalizeCell(rawRow.conjugation),
      notes: normalizeCell(rawRow.notes),
    };

    if (isStructurallyEmptyRow(parsedRow)) {
      skippedRows += 1;
      return;
    }

    const rowIssues: ImportValidationIssue[] = [];

    if (!parsedRow.word) {
      rowIssues.push({ rowNumber: parsedRow.rowNumber, field: "word", reason: "Required field is blank." });
    }
    if (!parsedRow.translation) {
      rowIssues.push({ rowNumber: parsedRow.rowNumber, field: "meaning", reason: "Required field is blank." });
    }
    if (!parsedRow.pos) {
      rowIssues.push({ rowNumber: parsedRow.rowNumber, field: "pos", reason: "Required field is blank." });
    }

    if (rowIssues.length > 0) {
      issues.push(...rowIssues);
      errorRows += 1;
      return;
    }

    const duplicateKey = buildDuplicateKey(parsedRow);
    const firstSeenRowNumber = firstSeenByKey.get(duplicateKey);
    if (firstSeenRowNumber) {
      duplicateCandidates.push({
        rowNumber: parsedRow.rowNumber,
        duplicateOfRowNumber: firstSeenRowNumber,
        word: parsedRow.word,
        pos: parsedRow.pos,
        meaning: parsedRow.translation,
      });
    } else {
      firstSeenByKey.set(duplicateKey, parsedRow.rowNumber);
    }

    rows.push(parsedRow);
  });

  return {
    rows,
    preview: {
      detectedDelimiter: (result.meta.delimiter as ImportPreviewSummary["detectedDelimiter"]) || "",
      isCanonicalSchema,
      totalRows: (result.data || []).length,
      validRows: rows.length,
      skippedRows,
      errorRows,
      issues,
      duplicateCandidates,
    },
  };
}

function normalizeCategoryLabel(value: string): string {
  return value.trim().toLowerCase();
}

export function resolveCategoryIdFromImportFields(
  categories: Category[],
  fields: Pick<ParsedRow, "category_main" | "category_sub" | "category_sub_sub">
): string {
  const main = normalizeCategoryLabel(fields.category_main);
  const sub = normalizeCategoryLabel(fields.category_sub);
  const subSub = normalizeCategoryLabel(fields.category_sub_sub);

  if (!main && !sub && !subSub) return "";

  let matchedMain = categories.find((category) => category.level === 1 && normalizeCategoryLabel(category.name) === main);
  if (!matchedMain && main) return "";

  if (!matchedMain && sub) {
    const candidates = categories.filter((category) => category.level === 2 && normalizeCategoryLabel(category.name) === sub);
    matchedMain = candidates.length === 1
      ? categories.find((category) => category.id === candidates[0]?.parent_id)
      : undefined;
  }

  if (!matchedMain && subSub) {
    const candidates = categories.filter((category) => category.level === 3 && normalizeCategoryLabel(category.name) === subSub);
    matchedMain = candidates.length === 1
      ? categories.find((category) => category.id === categories.find((category) => category.id === candidates[0]?.parent_id)?.parent_id)
      : undefined;
  }

  if (!matchedMain) return "";

  let resolvedCategoryId = String(matchedMain.id);
  if (!sub) return resolvedCategoryId;

  const matchedSub = categories.find(
    (category) =>
      category.level === 2 &&
      String(category.parent_id) === String(matchedMain.id) &&
      normalizeCategoryLabel(category.name) === sub
  );
  if (!matchedSub) return resolvedCategoryId;

  resolvedCategoryId = String(matchedSub.id);
  if (!subSub) return resolvedCategoryId;

  const matchedSubSub = categories.find(
    (category) =>
      category.level === 3 &&
      String(category.parent_id) === String(matchedSub.id) &&
      normalizeCategoryLabel(category.name) === subSub
  );

  return matchedSubSub ? String(matchedSubSub.id) : resolvedCategoryId;
}

export function getImportCategoryFieldsFromCategoryId(
  categoryId: string | number | null | undefined,
  categories: Category[]
): Pick<ParsedRow, "category_main" | "category_sub" | "category_sub_sub"> {
  if (!categoryId) {
    return {
      category_main: "",
      category_sub: "",
      category_sub_sub: "",
    };
  }

  let current = categories.find((category) => String(category.id) === String(categoryId));
  let categoryMain = "";
  let categorySub = "";
  let categorySubSub = "";

  if (current?.level === 3) {
    categorySubSub = current.name;
    current = categories.find((category) => String(category.id) === String(current?.parent_id));
  }
  if (current?.level === 2) {
    categorySub = current.name;
    current = categories.find((category) => String(category.id) === String(current?.parent_id));
  }
  if (current?.level === 1) {
    categoryMain = current.name;
  }

  return {
    category_main: categoryMain,
    category_sub: categorySub,
    category_sub_sub: categorySubSub,
  };
}
