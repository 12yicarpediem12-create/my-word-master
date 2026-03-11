type ExportableVocabRow = {
  id: string | number;
  language_code: string;
  word: string;
  translation: string | null;
  part_of_speech: string | null;
  gender: string | null;
  verb_type: string | null;
  root_word: string | null;
  example_sentence: string | null;
  example_translation: string | null;
  conjugation: string | null;
  notes: string | null;
  category_id: string | number | null;
  is_remembered: boolean | null;
};

type ExportableCategoryRow = {
  id: number | string;
  name: string;
  level: number;
  parent_id: number | null;
};

const EXPORT_COLUMNS = [
  "id",
  "language_code",
  "word",
  "meaning",
  "pos",
  "gender",
  "verb_type",
  "root_word",
  "example_sentence",
  "example_translation",
  "conjugation",
  "notes",
  "category_id",
  "is_remembered",
] as const;

export const WORDMASTER_IMPORT_COLUMNS = [
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

type WordMasterExportRecord = Record<(typeof WORDMASTER_IMPORT_COLUMNS)[number], string>;

function escapeCsvValue(value: unknown): string {
  const stringValue = value == null ? "" : String(value);
  const escapedValue = stringValue.replace(/"/g, "\"\"");
  return /[",\n]/.test(escapedValue) ? `"${escapedValue}"` : escapedValue;
}

function toExportRecord(row: ExportableVocabRow): Record<(typeof EXPORT_COLUMNS)[number], string | number | boolean | null> {
  return {
    id: row.id,
    language_code: row.language_code,
    word: row.word,
    meaning: row.translation,
    pos: row.part_of_speech,
    gender: row.gender,
    verb_type: row.verb_type,
    root_word: row.root_word,
    example_sentence: row.example_sentence,
    example_translation: row.example_translation,
    conjugation: row.conjugation,
    notes: row.notes,
    category_id: row.category_id,
    is_remembered: row.is_remembered,
  };
}

function resolveCategoryHierarchyLabels(
  categoryId: string | number | null,
  categories: ExportableCategoryRow[]
): { category_main: string; category_sub: string; category_sub_sub: string } {
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

function toWordMasterExportRecord(row: ExportableVocabRow, categories: ExportableCategoryRow[]): WordMasterExportRecord {
  const categoryHierarchy = resolveCategoryHierarchyLabels(row.category_id, categories);

  return {
    word: row.word,
    meaning: row.translation || "",
    pos: row.part_of_speech || "",
    gender: row.gender || "",
    verb_type: row.verb_type || "",
    root_word: row.root_word || "",
    category_main: categoryHierarchy.category_main,
    category_sub: categoryHierarchy.category_sub,
    category_sub_sub: categoryHierarchy.category_sub_sub,
    example_sentence: row.example_sentence || "",
    example_translation: row.example_translation || "",
    conjugation: row.conjugation || "",
    notes: row.notes || "",
  };
}

export function buildWordMasterImportTemplateCsv(): string {
  return `${WORDMASTER_IMPORT_COLUMNS.join(",")}\n`;
}

export function buildWordMasterCsvExport(rows: ExportableVocabRow[], categories: ExportableCategoryRow[]): string {
  const header = WORDMASTER_IMPORT_COLUMNS.join(",");
  const body = rows
    .map((row) => {
      const exportRecord = toWordMasterExportRecord(row, categories);
      return WORDMASTER_IMPORT_COLUMNS.map((column) => escapeCsvValue(exportRecord[column])).join(",");
    })
    .join("\n");

  return body ? [header, body].join("\n") : `${header}\n`;
}

function downloadCsv(csv: string, filename: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();

  URL.revokeObjectURL(url);
}

export function downloadLibraryCsvExport(rows: ExportableVocabRow[], filename: string) {
  const header = EXPORT_COLUMNS.join(",");
  const body = rows
    .map((row) => {
      const exportRecord = toExportRecord(row);
      return EXPORT_COLUMNS.map((column) => escapeCsvValue(exportRecord[column])).join(",");
    })
    .join("\n");

  downloadCsv([header, body].join("\n"), filename);
}

export function downloadWordMasterImportTemplate(filename = "wordmaster-import-template.csv") {
  downloadCsv(buildWordMasterImportTemplateCsv(), filename);
}

export function downloadWordMasterCsvExport(
  rows: ExportableVocabRow[],
  categories: ExportableCategoryRow[],
  filename: string
) {
  downloadCsv(buildWordMasterCsvExport(rows, categories), filename);
}

export function buildLibraryExportFilename(selectedLang: string, filterStatus: string, date = new Date()) {
  const day = date.toISOString().slice(0, 10);
  const langPart = selectedLang === "all" ? "all-languages" : selectedLang;
  const statusPart = filterStatus === "all" ? "all-statuses" : filterStatus;
  return `library-export-${langPart}-${statusPart}-${day}.csv`;
}

export function buildWordMasterExportFilename(selectedLang: string, filterStatus: string, date = new Date()) {
  const day = date.toISOString().slice(0, 10);
  const langPart = selectedLang === "all" ? "all-languages" : selectedLang;
  const statusPart = filterStatus === "all" ? "all-statuses" : filterStatus;
  return `wordmaster-export-${langPart}-${statusPart}-${day}.csv`;
}
