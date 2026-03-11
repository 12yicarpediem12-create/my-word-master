"use client";

import { useEffect, useMemo, useState } from "react";
import {
  generateImportBetterRootWord,
  generateImportExamples,
  generateImportNounGender,
  generateImportRootWord,
  generateImportVerbConjugation,
  generateVocabInfo,
} from "../actions/ai";
import { bulkInsertVocabWords } from "../actions/vocab";
import { getSupabaseBrowserClient } from "@/app/lib/supabase-browser";
import type { Category, Language } from "@/app/lib/types";
import {
  appendDuplicateEntry,
  buildDuplicateIndex,
  hasDuplicateEntry,
  isNounPartOfSpeech,
  isSuspiciousRootWord,
  isVerbPartOfSpeech,
  normalizeRootWord,
  sanitizeRootWordForImport,
} from "@/app/lib/vocab-form";
import { getImportCategoryFieldsFromCategoryId, parseWordMasterImportText, resolveCategoryIdFromImportFields } from "./import-parser";
import type {
  AnalyzedWord,
  ImportBatchRunSummary,
  ImportLog,
  ImportPreviewSummary,
  ImportProgress,
  ParsedRow,
  Phase,
} from "./types";

const supabase = getSupabaseBrowserClient();

async function loadDuplicateIndex(lang: string) {
  const { data, error } = await supabase
    .from("vocab")
    .select("word, part_of_speech, translation")
    .eq("language_code", lang);
  if (error) {
    throw new Error(`Failed to load duplicates: ${error.message}`);
  }

  return buildDuplicateIndex((data || []) as Array<{ word: string; part_of_speech?: string | null; translation?: string | null }>);
}

function getResolvedImportCategoryState(
  row: Pick<ParsedRow, "category_main" | "category_sub" | "category_sub_sub">,
  categories: Category[],
  fallbackCategoryId?: string | null
) {
  const hasCsvCategoryFields = Boolean(row.category_main.trim() || row.category_sub.trim() || row.category_sub_sub.trim());
  if (hasCsvCategoryFields) {
    return {
      category_main: row.category_main,
      category_sub: row.category_sub,
      category_sub_sub: row.category_sub_sub,
      category_id: resolveCategoryIdFromImportFields(categories, row),
    };
  }

  const aiFields = getImportCategoryFieldsFromCategoryId(fallbackCategoryId, categories);
  return {
    ...aiFields,
    category_id: fallbackCategoryId ? String(fallbackCategoryId) : "",
  };
}

function buildUploadPreviewLogs(preview: ImportPreviewSummary): ImportLog[] {
  const issueLogs = preview.issues.map<ImportLog>((issue) => ({
    word:
      issue.field === "header"
        ? "Header"
        : issue.field === "file"
          ? "Parser"
          : `Row ${issue.rowNumber}`,
    status: "error",
    message:
      issue.field === "header" || issue.field === "file"
        ? issue.reason
        : `${issue.field}: ${issue.reason}`,
  }));

  const duplicateLogs = preview.duplicateCandidates.map<ImportLog>((candidate) => ({
    word: `Row ${candidate.rowNumber}`,
    status: "skipped",
    message: `Duplicate candidate of row ${candidate.duplicateOfRowNumber} as ${candidate.pos} · ${candidate.meaning}`,
  }));

  return [...issueLogs, ...duplicateLogs];
}

function toAnalyzedWord(
  index: number,
  row: ParsedRow,
  aiData: Awaited<ReturnType<typeof generateVocabInfo>>,
  languageCode: string,
  categories: Category[]
): AnalyzedWord {
  const isNeedsHint = aiData.status === "needs_hint";
  const categoryState = getResolvedImportCategoryState(row, categories, aiData?.category_id || "");
  return {
    id: index,
    rowNumber: row.rowNumber,
    word: aiData?.word || row.word,
    translation: aiData?.translation || row.translation,
    part_of_speech: aiData?.part_of_speech || row.pos,
    gender: row.gender || aiData?.gender || "",
    root_word: row.root_word || sanitizeRootWordForImport(aiData?.word || row.word, aiData?.root_word, languageCode),
    verb_type: row.verb_type || aiData?.verb_type || "",
    category_main: categoryState.category_main,
    category_sub: categoryState.category_sub,
    category_sub_sub: categoryState.category_sub_sub,
    category_id: categoryState.category_id,
    example_sentence: row.example_sentence || aiData?.example_sentence || "",
    example_translation: row.example_translation || aiData?.example_translation || "",
    conjugation: row.conjugation || aiData?.conjugation || "",
    notes: row.notes || aiData?.notes || "",
    ai_hint: "",
    ai_status: isNeedsHint ? "needs_hint" : "ready",
    ai_message: isNeedsHint ? aiData.error : "",
  };
}

function hasImportFallbackDisambiguation(row: Pick<ParsedRow, "translation" | "pos">): boolean {
  return Boolean(row.translation.trim() && row.pos.trim());
}

function isSingleWordEntry(word: string): boolean {
  return !/\s/.test(word.trim());
}

function isReadyImportRow(row: Pick<AnalyzedWord, "ai_status" | "word" | "translation" | "part_of_speech">): boolean {
  return row.ai_status === "ready" && Boolean(row.word.trim() && row.translation.trim() && row.part_of_speech.trim());
}

function rowNeedsSupportEnrichment(row: AnalyzedWord): boolean {
  if (!isReadyImportRow(row)) return false;

  return (
    (isNounPartOfSpeech(row.part_of_speech) && !row.gender.trim()) ||
    (isSingleWordEntry(row.word) && !row.root_word.trim()) ||
    (isVerbPartOfSpeech(row.part_of_speech) && !row.conjugation.trim()) ||
    !row.example_sentence.trim() ||
    !row.example_translation.trim()
  );
}

function rowNeedsGenderEnrichment(row: AnalyzedWord): boolean {
  return isReadyImportRow(row) && isNounPartOfSpeech(row.part_of_speech) && !row.gender.trim();
}

function rowNeedsConjugationEnrichment(row: AnalyzedWord): boolean {
  return isReadyImportRow(row) && isVerbPartOfSpeech(row.part_of_speech) && !row.conjugation.trim();
}

function rowNeedsRootEnrichment(row: AnalyzedWord): boolean {
  return isReadyImportRow(row) && isSingleWordEntry(row.word) && !row.root_word.trim();
}

function rowNeedsExampleEnrichment(row: AnalyzedWord): boolean {
  return isReadyImportRow(row) && (!row.example_sentence.trim() || !row.example_translation.trim());
}

function looksSuspiciousRootWord(word: string, rootWord: string, languageCode: string): boolean {
  return isSuspiciousRootWord(word, rootWord, languageCode);
}

function rowNeedsRootQualityCorrection(row: AnalyzedWord, languageCode: string): boolean {
  return (
    isReadyImportRow(row) &&
    isSingleWordEntry(row.word) &&
    row.root_word.trim().length > 0 &&
    looksSuspiciousRootWord(row.word, row.root_word, languageCode)
  );
}

function hasClearlyBetterRootWord(word: string, currentRootWord: string, nextRootWord: string, languageCode: string): boolean {
  const normalizedCurrent = normalizeRootWord(currentRootWord);
  const normalizedNext = sanitizeRootWordForImport(word, nextRootWord, languageCode);

  if (!normalizedNext || normalizedNext === normalizedCurrent) return false;
  if (!looksSuspiciousRootWord(word, normalizedCurrent, languageCode)) return false;
  if (looksSuspiciousRootWord(word, normalizedNext, languageCode)) return false;

  return true;
}

function mergeMissingSupportFields(
  row: AnalyzedWord,
  aiData: Awaited<ReturnType<typeof generateVocabInfo>>,
  languageCode: string
): AnalyzedWord {
  if (aiData.status !== "ok") return row;

  return {
    ...row,
    gender: row.gender.trim() ? row.gender : aiData.gender || "",
    root_word: row.root_word.trim() ? row.root_word : sanitizeRootWordForImport(row.word, aiData.root_word, languageCode),
    conjugation: row.conjugation.trim() ? row.conjugation : aiData.conjugation || "",
    example_sentence: row.example_sentence.trim() ? row.example_sentence : aiData.example_sentence || "",
    example_translation: row.example_translation.trim() ? row.example_translation : aiData.example_translation || "",
  };
}

function toImportReadyWord(
  index: number,
  row: ParsedRow,
  aiData?: Awaited<ReturnType<typeof generateVocabInfo>>,
  message?: string,
  languageCode?: string,
  categories: Category[] = []
): AnalyzedWord {
  const canUseAiEnrichment = aiData && aiData.status === "ok";
  const resolvedLanguageCode = languageCode || "";
  const categoryState = getResolvedImportCategoryState(row, categories, canUseAiEnrichment ? aiData.category_id : "");

  return {
    id: index,
    rowNumber: row.rowNumber,
    word: row.word,
    translation: row.translation,
    part_of_speech: row.pos,
    gender: row.gender || ((canUseAiEnrichment && aiData.gender) || ""),
    root_word: row.root_word || sanitizeRootWordForImport(row.word, canUseAiEnrichment ? aiData.root_word : null, resolvedLanguageCode),
    verb_type: row.verb_type || ((canUseAiEnrichment && aiData.verb_type) || ""),
    category_main: categoryState.category_main,
    category_sub: categoryState.category_sub,
    category_sub_sub: categoryState.category_sub_sub,
    category_id: categoryState.category_id,
    example_sentence: row.example_sentence || ((canUseAiEnrichment && aiData.example_sentence) || ""),
    example_translation: row.example_translation || ((canUseAiEnrichment && aiData.example_translation) || ""),
    conjugation: row.conjugation || ((canUseAiEnrichment && aiData.conjugation) || ""),
    notes: row.notes || ((canUseAiEnrichment && aiData.notes) || ""),
    ai_hint: "",
    ai_status: "ready",
    ai_message: message || "",
  };
}

export function useImportWorkflow() {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedLang, setSelectedLang] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [uploadPreview, setUploadPreview] = useState<ImportPreviewSummary | null>(null);
  const [uploadPreviewLogs, setUploadPreviewLogs] = useState<ImportLog[]>([]);
  const [analyzedData, setAnalyzedData] = useState<AnalyzedWord[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [progress, setProgress] = useState<ImportProgress>({
    current: 0,
    total: 0,
    currentWord: null,
    currentStage: null,
  });
  const [logs, setLogs] = useState<ImportLog[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [rerunningRowId, setRerunningRowId] = useState<number | null>(null);
  const [isEnrichingSupportFields, setIsEnrichingSupportFields] = useState(false);
  const [supportEnrichmentProgress, setSupportEnrichmentProgress] = useState<ImportProgress>({
    current: 0,
    total: 0,
    currentWord: null,
    currentStage: null,
  });
  const [isEnrichingMissingGender, setIsEnrichingMissingGender] = useState(false);
  const [missingGenderSummary, setMissingGenderSummary] = useState<ImportBatchRunSummary | null>(null);
  const [missingGenderProgress, setMissingGenderProgress] = useState<ImportProgress>({
    current: 0,
    total: 0,
    currentWord: null,
    currentStage: null,
  });
  const [isEnrichingMissingConjugation, setIsEnrichingMissingConjugation] = useState(false);
  const [missingConjugationSummary, setMissingConjugationSummary] = useState<ImportBatchRunSummary | null>(null);
  const [missingConjugationProgress, setMissingConjugationProgress] = useState<ImportProgress>({
    current: 0,
    total: 0,
    currentWord: null,
    currentStage: null,
  });
  const [isEnrichingMissingRoots, setIsEnrichingMissingRoots] = useState(false);
  const [missingRootsSummary, setMissingRootsSummary] = useState<ImportBatchRunSummary | null>(null);
  const [missingRootsProgress, setMissingRootsProgress] = useState<ImportProgress>({
    current: 0,
    total: 0,
    currentWord: null,
    currentStage: null,
  });
  const [isEnrichingMissingExamples, setIsEnrichingMissingExamples] = useState(false);
  const [missingExamplesSummary, setMissingExamplesSummary] = useState<ImportBatchRunSummary | null>(null);
  const [missingExamplesProgress, setMissingExamplesProgress] = useState<ImportProgress>({
    current: 0,
    total: 0,
    currentWord: null,
    currentStage: null,
  });
  const [isImprovingWeakRoots, setIsImprovingWeakRoots] = useState(false);
  const [weakRootsSummary, setWeakRootsSummary] = useState<ImportBatchRunSummary | null>(null);
  const [weakRootsProgress, setWeakRootsProgress] = useState<ImportProgress>({
    current: 0,
    total: 0,
    currentWord: null,
    currentStage: null,
  });

  useEffect(() => {
    async function fetchSetupData() {
      const [languageResult, categoryResult] = await Promise.all([
        supabase.from("languages").select("*"),
        supabase.from("categories").select("*"),
      ]);
      if (languageResult.data) {
        const loadedLanguages = languageResult.data as Language[];
        setLanguages(loadedLanguages);
        if (loadedLanguages.length > 0) setSelectedLang(loadedLanguages[0].code);
      }
      if (categoryResult.data) {
        setCategories(categoryResult.data as Category[]);
      }
    }

    fetchSetupData();
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setPhase("idle");
    setAnalyzedData([]);
    setLogs([]);
    setProgress({ current: 0, total: 0, currentWord: null, currentStage: null });
    setUploadPreview(null);
    setUploadPreviewLogs([]);
    setErrorMsg(null);

    try {
      const text = await file.text();
      const { rows, preview } = parseWordMasterImportText(text);
      setParsedData(rows);
      setUploadPreview(preview);
      setUploadPreviewLogs(buildUploadPreviewLogs(preview));

      const missingHeaderIssues = preview.issues.filter((issue) => issue.field === "header");
      if (missingHeaderIssues.length > 0) {
        setErrorMsg(missingHeaderIssues.map((issue) => issue.reason).join(" "));
        return;
      }

      if (rows.length === 0) {
        setErrorMsg("No valid import rows were found. Check the required fields and review the upload preview.");
      }
    } catch (error) {
      setErrorMsg(error instanceof Error ? `Error parsing import file: ${error.message}` : "Error parsing import file.");
      setParsedData([]);
      setUploadPreview(null);
      setUploadPreviewLogs([]);
    }
  };

  const handleAnalyzeData = async () => {
    if (parsedData.length === 0 || !selectedLang) return;

    setPhase("analyzing");
    setProgress({ current: 0, total: parsedData.length, currentWord: null, currentStage: "Preparing analysis queue" });
    setAnalyzedData([]);
    setLogs([]);
    setErrorMsg(null);

    try {
      let existingWords = await loadDuplicateIndex(selectedLang);
      const nextAnalyzed: AnalyzedWord[] = [];

      for (let index = 0; index < parsedData.length; index++) {
        const currentRow = parsedData[index];
        const hasCsvDisambiguation = hasImportFallbackDisambiguation(currentRow);
        setProgress({
          current: index + 1,
          total: parsedData.length,
          currentWord: currentRow.word,
          currentStage: "Checking duplicates and generating entry",
        });

        try {
          if (hasDuplicateEntry(existingWords, currentRow.word, currentRow.pos, currentRow.translation)) {
            setLogs((prev) => [
              {
                word: `Row ${currentRow.rowNumber} · ${currentRow.word}`,
                status: "skipped",
                message: `Duplicate found as ${currentRow.pos} · ${currentRow.translation}`,
              },
              ...prev,
            ]);
            continue;
          }

          const aiData = await generateVocabInfo({
            word: currentRow.word,
            langCode: selectedLang,
            intendedPos: currentRow.pos,
            intendedMeaning: currentRow.translation,
            source: "import",
          });

          if (aiData.status === "needs_hint") {
            if (hasCsvDisambiguation) {
              const fallbackRow = toImportReadyWord(
                index,
                currentRow,
                undefined,
                "Used CSV part of speech and meaning because the AI stayed conservative.",
                selectedLang,
                categories
              );
              if (hasDuplicateEntry(existingWords, fallbackRow.word, fallbackRow.part_of_speech, fallbackRow.translation)) {
                setLogs((prev) => [
                  {
                    word: `Row ${currentRow.rowNumber} · ${currentRow.word}`,
                    status: "skipped",
                    message: `Duplicate found as ${fallbackRow.part_of_speech} · ${fallbackRow.translation}`,
                  },
                  ...prev,
                ]);
                continue;
              }
              nextAnalyzed.push(fallbackRow);
              setAnalyzedData([...nextAnalyzed]);
              setLogs((prev) => [
                {
                  word: currentRow.word,
                  status: "success",
                  message: `Used CSV fields as ${currentRow.pos}${currentRow.translation ? ` · ${currentRow.translation}` : ""}`,
                },
                ...prev,
              ]);
              existingWords = appendDuplicateEntry(existingWords, fallbackRow.word, fallbackRow.part_of_speech, fallbackRow.translation);
              continue;
            }

            nextAnalyzed.push(toAnalyzedWord(index, currentRow, aiData, selectedLang, categories));
            setAnalyzedData([...nextAnalyzed]);
            setLogs((prev) => [
              {
                word: `Row ${currentRow.rowNumber} · ${currentRow.word}`,
                status: "needs_hint",
                message: "Needs one clear part of speech or meaning before save.",
              },
              ...prev,
            ]);
            continue;
          }

          if (aiData?.error) {
            if (hasCsvDisambiguation) {
              const fallbackRow = toImportReadyWord(
                index,
                currentRow,
                undefined,
                "Used CSV part of speech and meaning because AI enrichment was unavailable.",
                selectedLang,
                categories
              );
              if (hasDuplicateEntry(existingWords, fallbackRow.word, fallbackRow.part_of_speech, fallbackRow.translation)) {
                setLogs((prev) => [
                  {
                    word: `Row ${currentRow.rowNumber} · ${currentRow.word}`,
                    status: "skipped",
                    message: `Duplicate found as ${fallbackRow.part_of_speech} · ${fallbackRow.translation}`,
                  },
                  ...prev,
                ]);
                continue;
              }
              nextAnalyzed.push(fallbackRow);
              setAnalyzedData([...nextAnalyzed]);
              setLogs((prev) => [
                {
                  word: currentRow.word,
                  status: "success",
                  message: `Used CSV fields as ${currentRow.pos}${currentRow.translation ? ` · ${currentRow.translation}` : ""}`,
                },
                ...prev,
              ]);
              existingWords = appendDuplicateEntry(existingWords, fallbackRow.word, fallbackRow.part_of_speech, fallbackRow.translation);
              continue;
            }

            setLogs((prev) => [{ word: `Row ${currentRow.rowNumber} · ${currentRow.word}`, status: "error", message: aiData.error }, ...prev]);
            continue;
          }

          const preparedRow = hasCsvDisambiguation
            ? toImportReadyWord(index, currentRow, aiData, undefined, selectedLang, categories)
            : toAnalyzedWord(index, currentRow, aiData, selectedLang, categories);

          if (hasDuplicateEntry(existingWords, preparedRow.word, preparedRow.part_of_speech, preparedRow.translation)) {
            setLogs((prev) => [
              {
                word: `Row ${currentRow.rowNumber} · ${currentRow.word}`,
                status: "skipped",
                message: `Duplicate found as ${preparedRow.part_of_speech} · ${preparedRow.translation}`,
              },
              ...prev,
            ]);
            continue;
          }

          nextAnalyzed.push(preparedRow);
          setAnalyzedData([...nextAnalyzed]);
          setLogs((prev) => [
            {
              word: preparedRow.word,
              status: "success",
              message: `Prepared as ${preparedRow.part_of_speech}${preparedRow.translation ? ` · ${preparedRow.translation}` : ""}`,
            },
            ...prev,
          ]);
          existingWords = appendDuplicateEntry(existingWords, preparedRow.word, preparedRow.part_of_speech, preparedRow.translation);
        } catch {
          setLogs((prev) => [{ word: `Row ${currentRow.rowNumber} · ${currentRow.word}`, status: "error", message: "Unexpected error" }, ...prev]);
        }

        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      if (nextAnalyzed.length === 0 && parsedData.length > 0) {
        setErrorMsg("AI analysis failed for all rows. Check AI setup or retry later.");
      }

      setAnalyzedData(nextAnalyzed);
      setProgress({
        current: parsedData.length,
        total: parsedData.length,
        currentWord: null,
        currentStage: "Analysis complete",
      });
      setPhase("review");
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : "Failed to analyze import.");
      setPhase("idle");
    }
  };

  const handleEditChange = (id: number, field: keyof AnalyzedWord, value: string) => {
    setAnalyzedData((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;

        const nextItem = { ...item, [field]: value };
        if (field === "category_main" || field === "category_sub" || field === "category_sub_sub") {
          nextItem.category_id = resolveCategoryIdFromImportFields(categories, nextItem);
        }
        return nextItem;
      })
    );
  };

  const handleRerunRow = async (id: number) => {
    const row = analyzedData.find((item) => item.id === id);
    if (!row || !selectedLang) return;

    setRerunningRowId(id);
    setAnalyzedData((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              ai_message: "Re-running AI with the current hint and part of speech...",
            }
          : item
      )
    );

    try {
      const rerunSourceRow: ParsedRow = {
        rowNumber: row.rowNumber,
        word: row.word,
        translation: row.translation,
        pos: row.part_of_speech,
        gender: row.gender,
        verb_type: row.verb_type,
        root_word: row.root_word,
        category_main: row.category_main,
        category_sub: row.category_sub,
        category_sub_sub: row.category_sub_sub,
        example_sentence: row.example_sentence,
        example_translation: row.example_translation,
        conjugation: row.conjugation,
        notes: row.notes,
      };
      const hasCsvDisambiguation = hasImportFallbackDisambiguation(rerunSourceRow);

      const aiData = await generateVocabInfo({
        word: row.word,
        langCode: selectedLang,
        hint: row.ai_hint,
        intendedPos: row.part_of_speech,
        intendedMeaning: row.translation,
        source: "import",
      });

      if (aiData.status === "error") {
        if (hasCsvDisambiguation) {
          const fallbackRow = toImportReadyWord(
            id,
            rerunSourceRow,
            undefined,
            "Used the current POS and meaning because AI enrichment was unavailable.",
            selectedLang,
            categories
          );
          setAnalyzedData((prev) =>
            prev.map((item) =>
              item.id === id
                ? {
                    ...item,
                    ...fallbackRow,
                    ai_hint: item.ai_hint || "",
                  }
                : item
            )
          );
          setLogs((prev) => [
            { word: row.word, status: "success", message: `Used current fields as ${rerunSourceRow.pos}${rerunSourceRow.translation ? ` · ${rerunSourceRow.translation}` : ""}` },
            ...prev,
          ]);
          return;
        }

        setAnalyzedData((prev) =>
          prev.map((item) =>
            item.id === id
              ? {
                  ...item,
                  ai_status: "needs_hint",
                  ai_message: aiData.error,
                }
              : item
          )
        );
        setLogs((prev) => [{ word: row.word, status: "error", message: aiData.error }, ...prev]);
        return;
      }

      setAnalyzedData((prev) =>
        prev.map((item) => {
          if (item.id !== id) return item;

          const nextRow =
            hasCsvDisambiguation
              ? toImportReadyWord(
                  id,
                  rerunSourceRow,
                  aiData.status === "ok" ? aiData : undefined,
                  aiData.status === "needs_hint" ? "Used the current POS and meaning because the AI stayed conservative." : "",
                  selectedLang,
                  categories
                )
              : toAnalyzedWord(id, rerunSourceRow, aiData, selectedLang, categories);

          return {
            ...item,
            rowNumber: nextRow.rowNumber,
            word: nextRow.word,
            translation: nextRow.translation,
            part_of_speech: nextRow.part_of_speech,
            gender: nextRow.gender,
            root_word: nextRow.root_word,
            verb_type: nextRow.verb_type,
            category_main: nextRow.category_main,
            category_sub: nextRow.category_sub,
            category_sub_sub: nextRow.category_sub_sub,
            category_id: nextRow.category_id,
            example_sentence: nextRow.example_sentence,
            example_translation: nextRow.example_translation,
            conjugation: nextRow.conjugation,
            notes: nextRow.notes,
            ai_status: nextRow.ai_status,
            ai_message:
              nextRow.ai_status === "needs_hint"
                ? nextRow.ai_message || "This row still needs one clear part of speech and meaning."
                : nextRow.ai_message || "",
            ai_hint: item.ai_hint || "",
          };
        })
      );

      setLogs((prev) => [
        {
          word: row.word,
          status: aiData.status === "needs_hint" && !hasCsvDisambiguation ? "needs_hint" : "success",
          message:
            aiData.status === "needs_hint"
              ? hasCsvDisambiguation
                ? `Used current fields as ${rerunSourceRow.pos}${rerunSourceRow.translation ? ` · ${rerunSourceRow.translation}` : ""}`
                : "Still needs a clearer hint or part of speech."
              : `Re-prepared as ${hasCsvDisambiguation ? rerunSourceRow.pos : aiData.part_of_speech}${(hasCsvDisambiguation ? rerunSourceRow.translation : aiData.translation) ? ` · ${hasCsvDisambiguation ? rerunSourceRow.translation : aiData.translation}` : ""}`,
        },
        ...prev,
      ]);
    } catch {
      setAnalyzedData((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                ai_status: "needs_hint",
                ai_message: "AI re-run failed. Update the hint or part of speech and try again.",
              }
            : item
        )
      );
      setLogs((prev) => [{ word: row.word, status: "error", message: "AI re-run failed." }, ...prev]);
    } finally {
      setRerunningRowId(null);
    }
  };

  const handleEnrichReadyRows = async () => {
    if (!selectedLang) return;

    const eligibleRows = analyzedData.filter(rowNeedsSupportEnrichment);
    if (eligibleRows.length === 0) return;

    setIsEnrichingSupportFields(true);
    setSupportEnrichmentProgress({
      current: 0,
      total: eligibleRows.length,
      currentWord: null,
      currentStage: "Preparing support-field enrichment",
    });

    let updatedCount = 0;

    try {
      for (let index = 0; index < eligibleRows.length; index++) {
        const row = eligibleRows[index];
        setSupportEnrichmentProgress({
          current: index + 1,
          total: eligibleRows.length,
          currentWord: row.word,
          currentStage: "Filling missing support fields",
        });

        try {
          const aiData = await generateVocabInfo({
            word: row.word,
            langCode: selectedLang,
            intendedPos: row.part_of_speech,
            intendedMeaning: row.translation,
            source: "import",
          });

          if (aiData.status === "ok") {
            setAnalyzedData((prev) =>
              prev.map((item) => {
                if (item.id !== row.id) return item;
                const next = mergeMissingSupportFields(item, aiData, selectedLang);
                const changed =
                  next.gender !== item.gender ||
                  next.root_word !== item.root_word ||
                  next.conjugation !== item.conjugation ||
                  next.example_sentence !== item.example_sentence ||
                  next.example_translation !== item.example_translation;

                if (changed) updatedCount += 1;
                return next;
              })
            );
          }
        } catch {
          setLogs((prev) => [{ word: row.word, status: "error", message: "Support-field enrichment failed." }, ...prev]);
        }

        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      setLogs((prev) => [
        {
          word: `${updatedCount} row${updatedCount === 1 ? "" : "s"}`,
          status: "success",
          message: "Filled missing support fields where AI could provide a plausible answer.",
        },
        ...prev,
      ]);
    } finally {
      setSupportEnrichmentProgress({
        current: eligibleRows.length,
        total: eligibleRows.length,
        currentWord: null,
        currentStage: "Support-field enrichment complete",
      });
      setIsEnrichingSupportFields(false);
    }
  };

  const handleFillMissingGender = async () => {
    if (!selectedLang) return;

    const eligibleRows = analyzedData.filter(rowNeedsGenderEnrichment);
    if (eligibleRows.length === 0) return;

    setIsEnrichingMissingGender(true);
    setMissingGenderProgress({
      current: 0,
      total: eligibleRows.length,
      currentWord: null,
      currentStage: "Preparing noun gender enrichment",
    });

    let updatedCount = 0;
    let noResultCount = 0;
    let errorCount = 0;
    let sampleDetail: string | undefined;
    setMissingGenderSummary({
      attempted: eligibleRows.length,
      updated: 0,
      noResult: 0,
      failed: 0,
      sampleDetail: undefined,
    });

    try {
      for (let index = 0; index < eligibleRows.length; index++) {
        const row = eligibleRows[index];
        setMissingGenderProgress({
          current: index + 1,
          total: eligibleRows.length,
          currentWord: row.word,
          currentStage: "Filling noun gender",
        });

        try {
          const result = await generateImportNounGender({
            word: row.word,
            langCode: selectedLang,
            intendedMeaning: row.translation,
            partOfSpeech: row.part_of_speech,
          });

          if (result.status === "ok" && result.gender) {
            const nextGender = result.gender;
            setAnalyzedData((prev) =>
              prev.map((item) => {
                if (item.id !== row.id || item.gender.trim()) return item;
                updatedCount += 1;
                return {
                  ...item,
                  gender: nextGender,
                };
              })
            );
          } else if (result.status === "error") {
            errorCount += 1;
            if (!sampleDetail && result.detail) sampleDetail = result.detail;
            setLogs((prev) => [
              { word: row.word, status: "error", message: `Gender enrichment failed: ${result.detail || "Unknown error"}` },
              ...prev,
            ]);
          } else {
            noResultCount += 1;
            if (!sampleDetail && result.detail) sampleDetail = result.detail;
          }
        } catch {
          errorCount += 1;
          if (!sampleDetail) sampleDetail = `Gender enrichment failed unexpectedly for ${row.word}.`;
          setLogs((prev) => [
            { word: row.word, status: "error", message: "Gender enrichment failed." },
            ...prev,
          ]);
        }

        await new Promise((resolve) => setTimeout(resolve, 350));
      }

      setLogs((prev) => [
        {
          word: `${updatedCount} noun row${updatedCount === 1 ? "" : "s"}`,
          status: updatedCount > 0 ? "success" : errorCount > 0 ? "error" : "needs_hint",
          message:
            updatedCount > 0
              ? `Filled missing noun gender for ${updatedCount} row${updatedCount === 1 ? "" : "s"}${noResultCount > 0 ? ` · ${noResultCount} returned no usable gender` : ""}${errorCount > 0 ? ` · ${errorCount} failed` : ""}.`
              : noResultCount > 0 || errorCount > 0
                ? `No noun gender values were filled${noResultCount > 0 ? ` · ${noResultCount} returned no usable gender` : ""}${errorCount > 0 ? ` · ${errorCount} failed` : ""}.`
                : "No eligible noun rows changed.",
        },
        ...prev,
      ]);
      setMissingGenderSummary({
        attempted: eligibleRows.length,
        updated: updatedCount,
        noResult: noResultCount,
        failed: errorCount,
        sampleDetail,
      });
    } finally {
      setMissingGenderProgress({
        current: eligibleRows.length,
        total: eligibleRows.length,
        currentWord: null,
        currentStage: "Noun gender enrichment complete",
      });
      setIsEnrichingMissingGender(false);
    }
  };

  const handleFillMissingConjugation = async () => {
    if (!selectedLang) return;

    const eligibleRows = analyzedData.filter(rowNeedsConjugationEnrichment);
    if (eligibleRows.length === 0) return;

    setIsEnrichingMissingConjugation(true);
    setMissingConjugationProgress({
      current: 0,
      total: eligibleRows.length,
      currentWord: null,
      currentStage: "Preparing verb conjugation enrichment",
    });

    let updatedCount = 0;
    let noResultCount = 0;
    let errorCount = 0;
    setMissingConjugationSummary({
      attempted: eligibleRows.length,
      updated: 0,
      noResult: 0,
      failed: 0,
    });

    try {
      for (let index = 0; index < eligibleRows.length; index++) {
        const row = eligibleRows[index];
        setMissingConjugationProgress({
          current: index + 1,
          total: eligibleRows.length,
          currentWord: row.word,
          currentStage: "Filling verb conjugation",
        });

        try {
          const result = await generateImportVerbConjugation({
            word: row.word,
            langCode: selectedLang,
            intendedMeaning: row.translation,
            partOfSpeech: row.part_of_speech,
          });

          const nextConjugation = result.conjugation;
          const nextVerbType = result.verb_type;

          if (nextConjugation || nextVerbType) {
            setAnalyzedData((prev) =>
              prev.map((item) => {
                if (item.id !== row.id) return item;

                const shouldFillConjugation = !item.conjugation.trim() && Boolean(nextConjugation);
                const shouldFillVerbType = !item.verb_type.trim() && Boolean(nextVerbType);

                if (!shouldFillConjugation && !shouldFillVerbType) {
                  return item;
                }

                updatedCount += 1;
                return {
                  ...item,
                  conjugation: shouldFillConjugation ? nextConjugation! : item.conjugation,
                  verb_type: shouldFillVerbType ? nextVerbType! : item.verb_type,
                };
              })
            );
          } else if (result.error) {
            errorCount += 1;
            setLogs((prev) => [
              { word: row.word, status: "error", message: `Conjugation enrichment failed: ${result.error}` },
              ...prev,
            ]);
          } else {
            noResultCount += 1;
          }
        } catch {
          errorCount += 1;
          setLogs((prev) => [
            { word: row.word, status: "error", message: "Conjugation enrichment failed." },
            ...prev,
          ]);
        }

        await new Promise((resolve) => setTimeout(resolve, 350));
      }

      setLogs((prev) => [
        {
          word: `${updatedCount} verb row${updatedCount === 1 ? "" : "s"}`,
          status: updatedCount > 0 ? "success" : errorCount > 0 ? "error" : "needs_hint",
          message:
            updatedCount > 0
              ? `Filled missing verb conjugation for ${updatedCount} row${updatedCount === 1 ? "" : "s"}${noResultCount > 0 ? ` · ${noResultCount} returned no usable conjugation` : ""}${errorCount > 0 ? ` · ${errorCount} failed` : ""}.`
              : noResultCount > 0 || errorCount > 0
                ? `No conjugation values were filled${noResultCount > 0 ? ` · ${noResultCount} returned no usable conjugation` : ""}${errorCount > 0 ? ` · ${errorCount} failed` : ""}.`
                : "No eligible verb rows changed.",
        },
        ...prev,
      ]);
      setMissingConjugationSummary({
        attempted: eligibleRows.length,
        updated: updatedCount,
        noResult: noResultCount,
        failed: errorCount,
      });
    } finally {
      setMissingConjugationProgress({
        current: eligibleRows.length,
        total: eligibleRows.length,
        currentWord: null,
        currentStage: "Verb conjugation enrichment complete",
      });
      setIsEnrichingMissingConjugation(false);
    }
  };

  const handleFillMissingRoots = async () => {
    if (!selectedLang) return;

    const eligibleRows = analyzedData.filter(rowNeedsRootEnrichment);
    if (eligibleRows.length === 0) return;

    setIsEnrichingMissingRoots(true);
    setMissingRootsProgress({
      current: 0,
      total: eligibleRows.length,
      currentWord: null,
      currentStage: "Preparing root-word enrichment",
    });

    let updatedCount = 0;
    let noResultCount = 0;
    let errorCount = 0;
    setMissingRootsSummary({
      attempted: eligibleRows.length,
      updated: 0,
      noResult: 0,
      failed: 0,
    });

    try {
      for (let index = 0; index < eligibleRows.length; index++) {
        const row = eligibleRows[index];
        setMissingRootsProgress({
          current: index + 1,
          total: eligibleRows.length,
          currentWord: row.word,
          currentStage: "Filling root words",
        });

        try {
          const result = await generateImportRootWord({
            word: row.word,
            langCode: selectedLang,
            intendedMeaning: row.translation,
            partOfSpeech: row.part_of_speech,
          });

          const nextRootWord = sanitizeRootWordForImport(row.word, result.root_word, selectedLang);
          if (nextRootWord) {
            setAnalyzedData((prev) =>
              prev.map((item) => {
                if (item.id !== row.id || item.root_word.trim()) return item;
                updatedCount += 1;
                return {
                  ...item,
                  root_word: nextRootWord,
                };
              })
            );
          } else if (result.error) {
            errorCount += 1;
            setLogs((prev) => [
              { word: row.word, status: "error", message: `Root enrichment failed: ${result.error}` },
              ...prev,
            ]);
          } else {
            noResultCount += 1;
          }
        } catch {
          errorCount += 1;
          setLogs((prev) => [
            { word: row.word, status: "error", message: "Root enrichment failed." },
            ...prev,
          ]);
        }

        await new Promise((resolve) => setTimeout(resolve, 350));
      }

      setLogs((prev) => [
        {
          word: `${updatedCount} row${updatedCount === 1 ? "" : "s"}`,
          status: updatedCount > 0 ? "success" : errorCount > 0 ? "error" : "needs_hint",
          message:
            updatedCount > 0
              ? `Filled missing roots for ${updatedCount} row${updatedCount === 1 ? "" : "s"}${noResultCount > 0 ? ` · ${noResultCount} returned no usable root` : ""}${errorCount > 0 ? ` · ${errorCount} failed` : ""}.`
              : noResultCount > 0 || errorCount > 0
                ? `No roots were filled${noResultCount > 0 ? ` · ${noResultCount} returned no usable root` : ""}${errorCount > 0 ? ` · ${errorCount} failed` : ""}.`
                : "No eligible single-word rows changed.",
        },
        ...prev,
      ]);
      setMissingRootsSummary({
        attempted: eligibleRows.length,
        updated: updatedCount,
        noResult: noResultCount,
        failed: errorCount,
      });
    } finally {
      setMissingRootsProgress({
        current: eligibleRows.length,
        total: eligibleRows.length,
        currentWord: null,
        currentStage: "Root-word enrichment complete",
      });
      setIsEnrichingMissingRoots(false);
    }
  };

  const handleFillMissingExamples = async () => {
    if (!selectedLang) return;

    const eligibleRows = analyzedData.filter(rowNeedsExampleEnrichment);
    if (eligibleRows.length === 0) return;

    setIsEnrichingMissingExamples(true);
    setMissingExamplesProgress({
      current: 0,
      total: eligibleRows.length,
      currentWord: null,
      currentStage: "Preparing example enrichment",
    });

    let updatedCount = 0;
    let noResultCount = 0;
    let errorCount = 0;
    setMissingExamplesSummary({
      attempted: eligibleRows.length,
      updated: 0,
      noResult: 0,
      failed: 0,
    });

    try {
      for (let index = 0; index < eligibleRows.length; index++) {
        const row = eligibleRows[index];
        setMissingExamplesProgress({
          current: index + 1,
          total: eligibleRows.length,
          currentWord: row.word,
          currentStage: "Filling example fields",
        });

        try {
          const result = await generateImportExamples({
            word: row.word,
            langCode: selectedLang,
            intendedMeaning: row.translation,
            partOfSpeech: row.part_of_speech,
          });

          const nextExampleSentence = result.example_sentence;
          const nextExampleTranslation = result.example_translation;

          if (nextExampleSentence || nextExampleTranslation) {
            setAnalyzedData((prev) =>
              prev.map((item) => {
                if (item.id !== row.id) return item;

                const shouldFillSentence = !item.example_sentence.trim() && Boolean(nextExampleSentence);
                const shouldFillTranslation = !item.example_translation.trim() && Boolean(nextExampleTranslation);

                if (!shouldFillSentence && !shouldFillTranslation) {
                  return item;
                }

                updatedCount += 1;
                return {
                  ...item,
                  example_sentence: shouldFillSentence ? nextExampleSentence! : item.example_sentence,
                  example_translation: shouldFillTranslation ? nextExampleTranslation! : item.example_translation,
                };
              })
            );
          } else if (result.error) {
            errorCount += 1;
            setLogs((prev) => [
              { word: row.word, status: "error", message: `Example enrichment failed: ${result.error}` },
              ...prev,
            ]);
          } else {
            noResultCount += 1;
          }
        } catch {
          errorCount += 1;
          setLogs((prev) => [
            { word: row.word, status: "error", message: "Example enrichment failed." },
            ...prev,
          ]);
        }

        await new Promise((resolve) => setTimeout(resolve, 350));
      }

      setLogs((prev) => [
        {
          word: `${updatedCount} row${updatedCount === 1 ? "" : "s"}`,
          status: updatedCount > 0 ? "success" : errorCount > 0 ? "error" : "needs_hint",
          message:
            updatedCount > 0
              ? `Filled missing examples for ${updatedCount} row${updatedCount === 1 ? "" : "s"}${noResultCount > 0 ? ` · ${noResultCount} returned no usable examples` : ""}${errorCount > 0 ? ` · ${errorCount} failed` : ""}.`
              : noResultCount > 0 || errorCount > 0
                ? `No example fields were filled${noResultCount > 0 ? ` · ${noResultCount} returned no usable examples` : ""}${errorCount > 0 ? ` · ${errorCount} failed` : ""}.`
                : "No eligible rows changed.",
        },
        ...prev,
      ]);
      setMissingExamplesSummary({
        attempted: eligibleRows.length,
        updated: updatedCount,
        noResult: noResultCount,
        failed: errorCount,
      });
    } finally {
      setMissingExamplesProgress({
        current: eligibleRows.length,
        total: eligibleRows.length,
        currentWord: null,
        currentStage: "Example enrichment complete",
      });
      setIsEnrichingMissingExamples(false);
    }
  };

  const handleImproveWeakRoots = async () => {
    if (!selectedLang) return;

    const eligibleRows = analyzedData.filter((row) => rowNeedsRootQualityCorrection(row, selectedLang));
    if (eligibleRows.length === 0) return;

    setIsImprovingWeakRoots(true);
    setWeakRootsProgress({
      current: 0,
      total: eligibleRows.length,
      currentWord: null,
      currentStage: "Preparing root-quality correction",
    });

    let updatedCount = 0;
    let noResultCount = 0;
    let errorCount = 0;
    setWeakRootsSummary({
      attempted: eligibleRows.length,
      updated: 0,
      noResult: 0,
      failed: 0,
    });

    try {
      for (let index = 0; index < eligibleRows.length; index++) {
        const row = eligibleRows[index];
        setWeakRootsProgress({
          current: index + 1,
          total: eligibleRows.length,
          currentWord: row.word,
          currentStage: "Improving weak roots",
        });

        try {
          const result = await generateImportBetterRootWord({
            word: row.word,
            langCode: selectedLang,
            intendedMeaning: row.translation,
            partOfSpeech: row.part_of_speech,
            currentRootWord: row.root_word,
          });

          const nextRootWord = normalizeRootWord(result.root_word);
          if (hasClearlyBetterRootWord(row.word, row.root_word, nextRootWord, selectedLang)) {
            setAnalyzedData((prev) =>
              prev.map((item) => {
                if (item.id !== row.id) return item;
                if (normalizeRootWord(item.root_word) !== normalizeRootWord(row.root_word)) return item;
                updatedCount += 1;
                return {
                  ...item,
                  root_word: nextRootWord,
                };
              })
            );
          } else if (result.error) {
            errorCount += 1;
            setLogs((prev) => [
              { word: row.word, status: "error", message: `Root quality correction failed: ${result.error}` },
              ...prev,
            ]);
          } else {
            noResultCount += 1;
          }
        } catch {
          errorCount += 1;
          setLogs((prev) => [
            { word: row.word, status: "error", message: "Root quality correction failed." },
            ...prev,
          ]);
        }

        await new Promise((resolve) => setTimeout(resolve, 350));
      }

      setLogs((prev) => [
        {
          word: `${updatedCount} row${updatedCount === 1 ? "" : "s"}`,
          status: updatedCount > 0 ? "success" : errorCount > 0 ? "error" : "needs_hint",
          message:
            updatedCount > 0
              ? `Improved weak roots for ${updatedCount} row${updatedCount === 1 ? "" : "s"}${noResultCount > 0 ? ` · ${noResultCount} returned no better root` : ""}${errorCount > 0 ? ` · ${errorCount} failed` : ""}.`
              : noResultCount > 0 || errorCount > 0
                ? `No roots were improved${noResultCount > 0 ? ` · ${noResultCount} returned no better root` : ""}${errorCount > 0 ? ` · ${errorCount} failed` : ""}.`
                : "No eligible weak-root rows changed.",
        },
        ...prev,
      ]);
      setWeakRootsSummary({
        attempted: eligibleRows.length,
        updated: updatedCount,
        noResult: noResultCount,
        failed: errorCount,
      });
    } finally {
      setWeakRootsProgress({
        current: eligibleRows.length,
        total: eligibleRows.length,
        currentWord: null,
        currentStage: "Root-quality correction complete",
      });
      setIsImprovingWeakRoots(false);
    }
  };

  const handleRemoveFromReview = (id: number) => {
    setAnalyzedData((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSaveToDatabase = async () => {
    const validRows = analyzedData.filter(
      (item) => item.ai_status !== "needs_hint" && item.translation.trim() && item.part_of_speech.trim()
    );
    if (validRows.length === 0) return;

    setPhase("saving");
    setProgress({
      current: 0,
      total: validRows.length,
      currentWord: null,
      currentStage: `Submitting ${validRows.length} approved row${validRows.length === 1 ? "" : "s"}`,
    });
    setErrorMsg(null);

    const { error } = await bulkInsertVocabWords(
      selectedLang,
      validRows.map((item) => ({
        word: item.word,
        translation: item.translation,
        part_of_speech: item.part_of_speech || null,
        gender: item.gender || null,
        verb_type: item.verb_type || null,
        category_id: resolveCategoryIdFromImportFields(categories, item) || item.category_id || null,
        example_sentence: item.example_sentence || null,
        example_translation: item.example_translation || null,
        conjugation: item.conjugation || null,
        notes: item.notes || null,
        root_word: item.root_word || null,
        is_remembered: false,
      }))
    );

    if (error) {
      setErrorMsg(`Save failed: ${error}`);
      setPhase("review");
      return;
    }

    setLogs((prev) => [
      {
        word: `${validRows.length} row${validRows.length === 1 ? "" : "s"}`,
        status: "success",
        message: "Saved to your library.",
      },
      ...prev,
    ]);
    setProgress({
      current: validRows.length,
      total: validRows.length,
      currentWord: null,
      currentStage: "Save complete",
    });
    setPhase("done");
  };

  const percentComplete = useMemo(() => {
    return progress.total === 0 ? 0 : Math.round((progress.current / progress.total) * 100);
  }, [progress]);
  const skippedCount = useMemo(() => logs.filter((log) => log.status === "skipped").length, [logs]);
  const failedCount = useMemo(() => logs.filter((log) => log.status === "error").length, [logs]);
  const readyToSaveCount = useMemo(
    () => analyzedData.filter((item) => item.ai_status !== "needs_hint" && item.translation.trim() && item.part_of_speech.trim()).length,
    [analyzedData]
  );
  const needsHintCount = useMemo(
    () => analyzedData.filter((item) => item.ai_status === "needs_hint").length,
    [analyzedData]
  );
  const enrichableCount = useMemo(
    () => analyzedData.filter(rowNeedsSupportEnrichment).length,
    [analyzedData]
  );
  const genderEnrichableCount = useMemo(
    () => analyzedData.filter(rowNeedsGenderEnrichment).length,
    [analyzedData]
  );
  const conjugationEnrichableCount = useMemo(
    () => analyzedData.filter(rowNeedsConjugationEnrichment).length,
    [analyzedData]
  );
  const rootEnrichableCount = useMemo(
    () => analyzedData.filter(rowNeedsRootEnrichment).length,
    [analyzedData]
  );
  const exampleEnrichableCount = useMemo(
    () => analyzedData.filter(rowNeedsExampleEnrichment).length,
    [analyzedData]
  );
  const weakRootCorrectionCount = useMemo(
    () => analyzedData.filter((row) => rowNeedsRootQualityCorrection(row, selectedLang)).length,
    [analyzedData, selectedLang]
  );
  const analyzedCount = Math.min(parsedData.length, readyToSaveCount + needsHintCount + skippedCount + failedCount);
  const remainingCount = useMemo(() => {
    if (phase === "saving") {
      return Math.max(progress.total - progress.current, 0);
    }
    return Math.max(parsedData.length - (readyToSaveCount + needsHintCount + skippedCount + failedCount), 0);
  }, [failedCount, needsHintCount, parsedData.length, phase, progress.current, progress.total, readyToSaveCount, skippedCount]);

  return {
    languages,
    selectedLang,
    setSelectedLang,
    phase,
    setPhase,
    parsedData,
    uploadPreview,
    uploadPreviewLogs,
    analyzedData,
    fileName,
    progress,
    logs,
    errorMsg,
    handleFileUpload,
    handleAnalyzeData,
    handleEditChange,
    handleRerunRow,
    handleFillMissingGender,
    handleFillMissingConjugation,
    handleFillMissingRoots,
    handleFillMissingExamples,
    handleImproveWeakRoots,
    handleEnrichReadyRows,
    handleRemoveFromReview,
    handleSaveToDatabase,
    percentComplete,
    skippedCount,
    failedCount,
    remainingCount,
    readyToSaveCount,
    needsHintCount,
    enrichableCount,
    genderEnrichableCount,
    conjugationEnrichableCount,
    rootEnrichableCount,
    exampleEnrichableCount,
    weakRootCorrectionCount,
    analyzedCount,
    rerunningRowId,
    isEnrichingMissingGender,
    missingGenderSummary,
    missingGenderProgress,
    isEnrichingMissingConjugation,
    missingConjugationSummary,
    missingConjugationProgress,
    isEnrichingMissingRoots,
    missingRootsSummary,
    missingRootsProgress,
    isEnrichingMissingExamples,
    missingExamplesSummary,
    missingExamplesProgress,
    isImprovingWeakRoots,
    weakRootsSummary,
    weakRootsProgress,
    isEnrichingSupportFields,
    supportEnrichmentProgress,
  };
}
