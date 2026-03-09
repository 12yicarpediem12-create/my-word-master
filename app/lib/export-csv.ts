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

export function downloadLibraryCsvExport(rows: ExportableVocabRow[], filename: string) {
  const header = EXPORT_COLUMNS.join(",");
  const body = rows
    .map((row) => {
      const exportRecord = toExportRecord(row);
      return EXPORT_COLUMNS.map((column) => escapeCsvValue(exportRecord[column])).join(",");
    })
    .join("\n");

  const csv = [header, body].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();

  URL.revokeObjectURL(url);
}

export function buildLibraryExportFilename(selectedLang: string, filterStatus: string, date = new Date()) {
  const day = date.toISOString().slice(0, 10);
  const langPart = selectedLang === "all" ? "all-languages" : selectedLang;
  const statusPart = filterStatus === "all" ? "all-statuses" : filterStatus;
  return `library-export-${langPart}-${statusPart}-${day}.csv`;
}
