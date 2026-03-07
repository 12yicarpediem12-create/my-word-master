"use client";

import { useEffect, useMemo, useState } from "react";
import Papa from "papaparse";
import { generateVocabInfo } from "../actions/ai";
import { bulkInsertVocabWords } from "../actions/vocab";
import { getSupabaseBrowserClient } from "@/app/lib/supabase-browser";
import type { Language } from "@/app/lib/types";
import { buildDuplicateWordSet, normalizeRootWord, normalizeWordForLookup } from "@/app/lib/vocab-form";
import type { AnalyzedWord, ImportLog, ParsedRow, Phase } from "./types";

const supabase = getSupabaseBrowserClient();

async function loadDuplicateIndex(lang: string) {
  const { data, error } = await supabase.from("vocab").select("word").eq("language_code", lang);
  if (error) {
    throw new Error(`Failed to load duplicates: ${error.message}`);
  }

  return buildDuplicateWordSet((data || []) as Array<{ word: string }>);
}

function toAnalyzedWord(index: number, row: ParsedRow, aiData: Awaited<ReturnType<typeof generateVocabInfo>>): AnalyzedWord {
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
  };
}

export function useImportWorkflow() {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [selectedLang, setSelectedLang] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [analyzedData, setAnalyzedData] = useState<AnalyzedWord[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [logs, setLogs] = useState<ImportLog[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
            translation: row.translation?.trim(),
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
    setProgress({ current: 0, total: parsedData.length });
    setLogs([]);
    setErrorMsg(null);

    try {
      const existingWords = await loadDuplicateIndex(selectedLang);
      const nextAnalyzed: AnalyzedWord[] = [];

      for (let index = 0; index < parsedData.length; index++) {
        const currentRow = parsedData[index];
        setProgress({ current: index + 1, total: parsedData.length });

        try {
          const normalized = normalizeWordForLookup(currentRow.word);
          if (existingWords.has(normalized)) {
            setLogs((prev) => [{ word: currentRow.word, status: "skipped", message: "Already exists" }, ...prev]);
            continue;
          }

          const contextHint = currentRow.pos || currentRow.translation
            ? ` (Hint: User intends this word to be POS: "${currentRow.pos || "any"}", meaning related to: "${currentRow.translation || "any"}")`
            : "";
          const aiData = await generateVocabInfo(currentRow.word + contextHint, selectedLang);

          if (aiData?.error) {
            setLogs((prev) => [{ word: currentRow.word, status: "error", message: aiData.error }, ...prev]);
            continue;
          }

          nextAnalyzed.push(toAnalyzedWord(index, currentRow, aiData));
          existingWords.add(normalized);
        } catch {
          setLogs((prev) => [{ word: currentRow.word, status: "error", message: "Unexpected error" }, ...prev]);
        }

        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      if (nextAnalyzed.length === 0 && parsedData.length > 0) {
        setErrorMsg("AI analysis failed for all rows. Check AI setup or retry later.");
      }

      setAnalyzedData(nextAnalyzed);
      setPhase("review");
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : "Failed to analyze import.");
      setPhase("idle");
    }
  };

  const handleEditChange = (id: number, field: keyof AnalyzedWord, value: string) => {
    setAnalyzedData((prev) => prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  };

  const handleRemoveFromReview = (id: number) => {
    setAnalyzedData((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSaveToDatabase = async () => {
    if (analyzedData.length === 0) return;

    setPhase("saving");
    setProgress({ current: 0, total: analyzedData.length });
    setErrorMsg(null);

    const { error } = await bulkInsertVocabWords(
      selectedLang,
      analyzedData.map((item) => ({
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

    setProgress({ current: analyzedData.length, total: analyzedData.length });
    setPhase("done");
  };

  const percentComplete = useMemo(() => {
    return progress.total === 0 ? 0 : Math.round((progress.current / progress.total) * 100);
  }, [progress]);
  const skippedCount = useMemo(() => logs.filter((log) => log.status === "skipped").length, [logs]);
  const failedCount = useMemo(() => logs.filter((log) => log.status === "error").length, [logs]);
  const readyToSaveCount = analyzedData.length;
  const analyzedCount = Math.min(parsedData.length, readyToSaveCount + skippedCount + failedCount);

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
    handleRemoveFromReview,
    handleSaveToDatabase,
    percentComplete,
    skippedCount,
    failedCount,
    readyToSaveCount,
    analyzedCount,
  };
}
