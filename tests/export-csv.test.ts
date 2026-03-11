import assert from "node:assert/strict";
import test from "node:test";
import { buildWordMasterCsvExport, buildWordMasterImportTemplateCsv, WORDMASTER_IMPORT_COLUMNS } from "../app/lib/export-csv.ts";
import { parseWordMasterImportText } from "../app/import/import-parser.ts";

test("builds the exact canonical WordMaster template header", () => {
  const csv = buildWordMasterImportTemplateCsv();
  assert.equal(csv, `${WORDMASTER_IMPORT_COLUMNS.join(",")}\n`);
});

test("exports WordMaster rows with resolved category hierarchy", () => {
  const csv = buildWordMasterCsvExport(
    [
      {
        id: "1",
        language_code: "it",
        word: "dolce",
        translation: "sweet",
        part_of_speech: "adjective",
        gender: null,
        verb_type: null,
        root_word: "dulcis (Latin)",
        example_sentence: "Un dolce profumo.",
        example_translation: "A sweet smell.",
        conjugation: null,
        notes: "common adjective",
        category_id: 12,
        is_remembered: false,
      },
    ],
    [
      { id: 10, name: "Descriptors", level: 1, parent_id: null },
      { id: 11, name: "Taste", level: 2, parent_id: 10 },
      { id: 12, name: "Sweetness", level: 3, parent_id: 11 },
    ]
  );

  const lines = csv.trimEnd().split("\n");
  assert.equal(lines[0], WORDMASTER_IMPORT_COLUMNS.join(","));
  assert.equal(
    lines[1],
    [
      "dolce",
      "sweet",
      "adjective",
      "",
      "",
      "dulcis (Latin)",
      "Descriptors",
      "Taste",
      "Sweetness",
      "Un dolce profumo.",
      "A sweet smell.",
      "",
      "common adjective",
    ].join(",")
  );
});

test("leaves category hierarchy blank when category_id does not resolve", () => {
  const csv = buildWordMasterCsvExport(
    [
      {
        id: "2",
        language_code: "es",
        word: "hola",
        translation: "hello",
        part_of_speech: "interjection",
        gender: null,
        verb_type: null,
        root_word: null,
        example_sentence: "",
        example_translation: "",
        conjugation: null,
        notes: "",
        category_id: 999,
        is_remembered: false,
      },
    ],
    []
  );

  const row = csv.trimEnd().split("\n")[1];
  const values = row.split(",");
  assert.deepEqual(values.slice(0, 9), ["hola", "hello", "interjection", "", "", "", "", "", ""]);
});

test("canonical export parses back as canonical schema and preserves intentional blanks", () => {
  const csv = buildWordMasterCsvExport(
    [
      {
        id: "3",
        language_code: "it",
        word: "ciao",
        translation: "hello",
        part_of_speech: "interjection",
        gender: null,
        verb_type: null,
        root_word: null,
        example_sentence: "",
        example_translation: "",
        conjugation: null,
        notes: "",
        category_id: null,
        is_remembered: false,
      },
    ],
    []
  );

  const { rows, preview } = parseWordMasterImportText(csv);
  assert.equal(preview.isCanonicalSchema, true);
  assert.equal(rows[0]?.root_word, "");
  assert.equal(rows[0]?.notes, "");
  assert.equal(rows[0]?.category_main, "");
  assert.equal(rows[0]?.category_sub, "");
  assert.equal(rows[0]?.category_sub_sub, "");
});
