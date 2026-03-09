"use client";

import { useEffect, useMemo, useState } from "react";
import Papa from "papaparse";
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
import type { Language } from "@/app/lib/types";
import {
  appendDuplicateEntry,
  buildDuplicateIndex,
  hasDuplicateEntry,
  isNounPartOfSpeech,
  isVerbPartOfSpeech,
  normalizeRootWord,
} from "@/app/lib/vocab-form";
import type { AnalyzedWord, ImportLog, ImportProgress, ParsedRow, Phase } from "./types";

const supabase = getSupabaseBrowserClient();

async function loadDuplicateIndex(lang: string) {
  const { data, error } = await supabase
    .from("vocab")
    .select("word, part_of_speech")
    .eq("language_code", lang);
  if (error) {
    throw new Error(`Failed to load duplicates: ${error.message}`);
  }

  return buildDuplicateIndex((data || []) as Array<{ word: string; part_of_speech?: string | null }>);
}

function toAnalyzedWord(index: number, row: ParsedRow, aiData: Awaited<ReturnType<typeof generateVocabInfo>>): AnalyzedWord {
  const isNeedsHint = aiData.status === "needs_hint";
  return {
    id: index,
    word: aiData?.word || row.word,
    translation: aiData?.translation || row.translation || "",
    part_of_speech: aiData?.part_of_speech || row.pos || "",
    gender: aiData?.gender || "",
    root_word: normalizeRootWord(aiData?.root_word),
    verb_type: aiData?.verb_type || "",
    category_id: aiData?.category_id || "",
    example_sentence: aiData?.example_sentence || "",
    example_translation: aiData?.example_translation || "",
    conjugation: aiData?.conjugation || "",
    notes: aiData?.notes || "",
    ai_hint: "",
    ai_status: isNeedsHint ? "needs_hint" : "ready",
    ai_message: isNeedsHint ? aiData.error : "",
  };
}

function hasImportFallbackDisambiguation(row: Pick<ParsedRow, "translation" | "pos">): boolean {
  return Boolean(row.translation?.trim() && row.pos?.trim());
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

function looksSuspiciousRootWord(word: string, rootWord: string): boolean {
  const normalizedRoot = normalizeRootWord(rootWord);
  if (!normalizedRoot) return false;

  if (!/^.+ \([A-Za-z][A-Za-z\s-]*\)$/.test(normalizedRoot)) {
    return true;
  }

  if (/\((?:Late Latin|Vulgar Latin|Medieval Latin|Post-Classical Latin)\)$/i.test(normalizedRoot)) {
    return true;
  }

  const rootLemma = normalizedRoot.replace(/\s*\([^)]*\)\s*$/, "").trim().toLowerCase();
  const surfaceLemma = word.trim().toLowerCase();

  return rootLemma === surfaceLemma;
}

function rowNeedsRootQualityCorrection(row: AnalyzedWord): boolean {
  return (
    isReadyImportRow(row) &&
    isSingleWordEntry(row.word) &&
    row.root_word.trim().length > 0 &&
    looksSuspiciousRootWord(row.word, row.root_word)
  );
}

function mergeMissingSupportFields(row: AnalyzedWord, aiData: Awaited<ReturnType<typeof generateVocabInfo>>): AnalyzedWord {
  if (aiData.status !== "ok") return row;

  return {
    ...row,
    gender: row.gender.trim() ? row.gender : aiData.gender || "",
    root_word: row.root_word.trim() ? row.root_word : normalizeRootWord(aiData.root_word),
    conjugation: row.conjugation.trim() ? row.conjugation : aiData.conjugation || "",
    example_sentence: row.example_sentence.trim() ? row.example_sentence : aiData.example_sentence || "",
    example_translation: row.example_translation.trim() ? row.example_translation : aiData.example_translation || "",
  };
}

function toImportReadyWord(
  index: number,
  row: ParsedRow,
  aiData?: Awaited<ReturnType<typeof generateVocabInfo>>,
  message?: string
): AnalyzedWord {
  const canUseAiEnrichment = aiData && aiData.status === "ok";

  return {
    id: index,
    word: row.word,
    translation: row.translation || "",
    part_of_speech: row.pos || "",
    gender: (canUseAiEnrichment && aiData.gender) || "",
    root_word: normalizeRootWord(canUseAiEnrichment ? aiData.root_word : null),
    verb_type: (canUseAiEnrichment && aiData.verb_type) || "",
    category_id: (canUseAiEnrichment && aiData.category_id) || "",
    example_sentence: (canUseAiEnrichment && aiData.example_sentence) || "",
    example_translation: (canUseAiEnrichment && aiData.example_translation) || "",
    conjugation: (canUseAiEnrichment && aiData.conjugation) || "",
    notes: (canUseAiEnrichment && aiData.notes) || "",
    ai_hint: "",
    ai_status: "ready",
    ai_message: message || "",
  };
}

export function useImportWorkflow() {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [selectedLang, setSelectedLang] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
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
  const [missingGenderProgress, setMissingGenderProgress] = useState<ImportProgress>({
    current: 0,
    total: 0,
    currentWord: null,
    currentStage: null,
  });
  const [isEnrichingMissingConjugation, setIsEnrichingMissingConjugation] = useState(false);
  const [missingConjugationProgress, setMissingConjugationProgress] = useState<ImportProgress>({
    current: 0,
    total: 0,
    currentWord: null,
    currentStage: null,
  });
  const [isEnrichingMissingRoots, setIsEnrichingMissingRoots] = useState(false);
  const [missingRootsProgress, setMissingRootsProgress] = useState<ImportProgress>({
    current: 0,
    total: 0,
    currentWord: null,
    currentStage: null,
  });
  const [isEnrichingMissingExamples, setIsEnrichingMissingExamples] = useState(false);
  const [missingExamplesProgress, setMissingExamplesProgress] = useState<ImportProgress>({
    current: 0,
    total: 0,
    currentWord: null,
    currentStage: null,
  });
  const [isImprovingWeakRoots, setIsImprovingWeakRoots] = useState(false);
  const [weakRootsProgress, setWeakRootsProgress] = useState<ImportProgress>({
    current: 0,
    total: 0,
    currentWord: null,
    currentStage: null,
  });

  useEffect(() => {
    async function fetchLanguages() {
      const { data } = await supabase.from("languages").select("*");
      if (!data) return;

      const loadedLanguages = data as Language[];
      setLanguages(loadedLanguages);
      if (loadedLanguages.length > 0) setSelectedLang(loadedLanguages[0].code);
    }

    fetchLanguages();
  }, []);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setPhase("idle");
    setAnalyzedData([]);
    setLogs([]);
    setProgress({ current: 0, total: 0, currentWord: null, currentStage: null });
    setErrorMsg(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.meta.fields && !results.meta.fields.includes("word")) {
          setErrorMsg("CSV must contain a 'word' column header.");
          setParsedData([]);
          setFileName(null);
          return;
        }

        const formattedData = (results.data as Record<string, string>[]).reduce<ParsedRow[]>((acc, row) => {
          const word = row.word?.trim();
          if (!word) return acc;

          acc.push({
            word,
            translation: row.translation?.trim() || row.meaning?.trim(),
            pos: row.pos?.trim(),
          });
          return acc;
        }, []);

        setParsedData(formattedData);
      },
      error: (error) => setErrorMsg(`Error parsing CSV: ${error.message}`),
    });
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
          if (currentRow.pos && hasDuplicateEntry(existingWords, currentRow.word, currentRow.pos)) {
            setLogs((prev) => [{ word: currentRow.word, status: "skipped", message: `Duplicate found as ${currentRow.pos}` }, ...prev]);
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
                "Used CSV part of speech and meaning because the AI stayed conservative."
              );
              if (hasDuplicateEntry(existingWords, fallbackRow.word, fallbackRow.part_of_speech)) {
                setLogs((prev) => [{ word: currentRow.word, status: "skipped", message: `Duplicate found as ${fallbackRow.part_of_speech}` }, ...prev]);
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
              existingWords = appendDuplicateEntry(existingWords, fallbackRow.word, fallbackRow.part_of_speech);
              continue;
            }

            nextAnalyzed.push(toAnalyzedWord(index, currentRow, aiData));
            setAnalyzedData([...nextAnalyzed]);
            setLogs((prev) => [
              {
                word: currentRow.word,
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
                "Used CSV part of speech and meaning because AI enrichment was unavailable."
              );
              if (hasDuplicateEntry(existingWords, fallbackRow.word, fallbackRow.part_of_speech)) {
                setLogs((prev) => [{ word: currentRow.word, status: "skipped", message: `Duplicate found as ${fallbackRow.part_of_speech}` }, ...prev]);
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
              existingWords = appendDuplicateEntry(existingWords, fallbackRow.word, fallbackRow.part_of_speech);
              continue;
            }

            setLogs((prev) => [{ word: currentRow.word, status: "error", message: aiData.error }, ...prev]);
            continue;
          }

          const preparedRow = hasCsvDisambiguation
            ? toImportReadyWord(index, currentRow, aiData)
            : toAnalyzedWord(index, currentRow, aiData);

          if (hasDuplicateEntry(existingWords, preparedRow.word, preparedRow.part_of_speech)) {
            setLogs((prev) => [{ word: currentRow.word, status: "skipped", message: `Duplicate found as ${preparedRow.part_of_speech}` }, ...prev]);
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
          existingWords = appendDuplicateEntry(existingWords, preparedRow.word, preparedRow.part_of_speech);
        } catch {
          setLogs((prev) => [{ word: currentRow.word, status: "error", message: "Unexpected error" }, ...prev]);
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
    setAnalyzedData((prev) => prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
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
      const rerunSourceRow = {
        word: row.word,
        translation: row.translation,
        pos: row.part_of_speech,
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
            "Used the current POS and meaning because AI enrichment was unavailable."
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
                  aiData.status === "needs_hint" ? "Used the current POS and meaning because the AI stayed conservative." : ""
                )
              : toAnalyzedWord(id, rerunSourceRow, aiData);

          return {
            ...item,
            word: nextRow.word,
            translation: nextRow.translation,
            part_of_speech: nextRow.part_of_speech,
            gender: nextRow.gender,
            root_word: nextRow.root_word,
            verb_type: nextRow.verb_type,
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
                const next = mergeMissingSupportFields(item, aiData);
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

          const nextGender = result.gender;
          if (nextGender) {
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
          } else if (result.error) {
            setLogs((prev) => [
              { word: row.word, status: "error", message: `Gender enrichment failed: ${result.error}` },
              ...prev,
            ]);
          }
        } catch {
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
          status: "success",
          message: "Filled missing noun gender where AI could provide a defensible answer.",
        },
        ...prev,
      ]);
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
            setLogs((prev) => [
              { word: row.word, status: "error", message: `Conjugation enrichment failed: ${result.error}` },
              ...prev,
            ]);
          }
        } catch {
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
          status: "success",
          message: "Filled missing verb conjugation where AI could provide a defensible answer.",
        },
        ...prev,
      ]);
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

          const nextRootWord = normalizeRootWord(result.root_word);
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
            setLogs((prev) => [
              { word: row.word, status: "error", message: `Root enrichment failed: ${result.error}` },
              ...prev,
            ]);
          }
        } catch {
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
          status: "success",
          message: "Filled missing root words where AI could provide a defensible answer.",
        },
        ...prev,
      ]);
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
            setLogs((prev) => [
              { word: row.word, status: "error", message: `Example enrichment failed: ${result.error}` },
              ...prev,
            ]);
          }
        } catch {
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
          status: "success",
          message: "Filled missing example fields where AI could provide a defensible answer.",
        },
        ...prev,
      ]);
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

    const eligibleRows = analyzedData.filter(rowNeedsRootQualityCorrection);
    if (eligibleRows.length === 0) return;

    setIsImprovingWeakRoots(true);
    setWeakRootsProgress({
      current: 0,
      total: eligibleRows.length,
      currentWord: null,
      currentStage: "Preparing root-quality correction",
    });

    let updatedCount = 0;

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
          if (nextRootWord && nextRootWord !== normalizeRootWord(row.root_word)) {
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
            setLogs((prev) => [
              { word: row.word, status: "error", message: `Root quality correction failed: ${result.error}` },
              ...prev,
            ]);
          }
        } catch {
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
          status: "success",
          message: "Improved weak root values where AI found a clearly better alternative.",
        },
        ...prev,
      ]);
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
        category_id: item.category_id || null,
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
    () => analyzedData.filter(rowNeedsRootQualityCorrection).length,
    [analyzedData]
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
    missingGenderProgress,
    isEnrichingMissingConjugation,
    missingConjugationProgress,
    isEnrichingMissingRoots,
    missingRootsProgress,
    isEnrichingMissingExamples,
    missingExamplesProgress,
    isImprovingWeakRoots,
    weakRootsProgress,
    isEnrichingSupportFields,
    supportEnrichmentProgress,
  };
}
