import assert from "node:assert/strict";
import test from "node:test";
import { parseWordMasterImportText } from "../app/import/import-parser.ts";

test("parses normal CSV with normalized headers and optional support fields", () => {
  const csv = "\uFEFF Word , Meaning , POS , Gender , Verb_Type , Notes\nciao,hello,Interjection,,,common greeting";
  const { rows, preview } = parseWordMasterImportText(csv);

  assert.equal(preview.detectedDelimiter, ",");
  assert.equal(preview.validRows, 1);
  assert.equal(preview.errorRows, 0);
  assert.equal(rows[0]?.word, "ciao");
  assert.equal(rows[0]?.translation, "hello");
  assert.equal(rows[0]?.pos, "interjection");
  assert.equal(rows[0]?.notes, "common greeting");
});

test("detects TSV content even when the source is treated like CSV", () => {
  const tsv = [
    "word\tmeaning\tpos\tconjugation\tnotes",
    "parlare\tto speak\tverb\tPresent: io parlo\tquoted verb row",
  ].join("\n");

  const { rows, preview } = parseWordMasterImportText(tsv);

  assert.equal(preview.detectedDelimiter, "\t");
  assert.equal(preview.validRows, 1);
  assert.equal(rows[0]?.pos, "verb");
  assert.equal(rows[0]?.conjugation, "Present: io parlo");
});

test("allows missing optional columns and ignores column order", () => {
  const csv = [
    "pos,meaning,word",
    "phrase,good morning,buenos dias",
  ].join("\n");

  const { rows, preview } = parseWordMasterImportText(csv);

  assert.equal(preview.validRows, 1);
  assert.equal(preview.errorRows, 0);
  assert.equal(rows[0]?.word, "buenos dias");
  assert.equal(rows[0]?.translation, "good morning");
  assert.equal(rows[0]?.pos, "phrase");
  assert.equal(rows[0]?.root_word, "");
  assert.equal(rows[0]?.notes, "");
});

test("preserves quoted values, escaped quotes, and reordered category fields", () => {
  const csv = [
    "notes,category_sub_sub,word,example_sentence,meaning,pos,category_main,category_sub",
    "\"said \"\"hello, world\"\" in class\",Numbers,uno,\"He said, \"\"uno\"\" loudly.\",one,numeral,Basics,Counting",
  ].join("\n");

  const { rows, preview } = parseWordMasterImportText(csv);

  assert.equal(preview.validRows, 1);
  assert.equal(rows[0]?.notes, 'said "hello, world" in class');
  assert.equal(rows[0]?.example_sentence, 'He said, "uno" loudly.');
  assert.equal(rows[0]?.category_main, "Basics");
  assert.equal(rows[0]?.category_sub, "Counting");
  assert.equal(rows[0]?.category_sub_sub, "Numbers");
});

test("reports duplicate candidates without dropping either row", () => {
  const csv = [
    "word,meaning,pos",
    "dolce,sweet,adjective",
    "dolce,sweet,adjective",
  ].join("\n");

  const { rows, preview } = parseWordMasterImportText(csv);

  assert.equal(rows.length, 2);
  assert.equal(preview.duplicateCandidates.length, 1);
  assert.deepEqual(preview.duplicateCandidates[0], {
    rowNumber: 3,
    duplicateOfRowNumber: 2,
    word: "dolce",
    pos: "adjective",
    meaning: "sweet",
  });
});

test("reports invalid required-field rows with row number, field, and reason", () => {
  const csv = [
    "word,meaning,pos,gender",
    "ciao,,interjection,",
    ",hello,interjection,",
    "ciao,hello,,",
  ].join("\n");

  const { rows, preview } = parseWordMasterImportText(csv);

  assert.equal(rows.length, 0);
  assert.equal(preview.errorRows, 3);
  assert.deepEqual(
    preview.issues.filter((issue) => issue.field !== "header" && issue.field !== "file"),
    [
      { rowNumber: 2, field: "meaning", reason: "Required field is blank." },
      { rowNumber: 3, field: "word", reason: "Required field is blank." },
      { rowNumber: 4, field: "pos", reason: "Required field is blank." },
    ]
  );
});
