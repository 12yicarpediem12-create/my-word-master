"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import Papa from "papaparse";
import { generateVocabInfo } from "../actions/ai";
import { bulkInsertVocabWords } from "../actions/vocab";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface ParsedRow {
  word: string;
  translation?: string;
  pos?: string;
}

interface AnalyzedWord {
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
}

type Phase = "idle" | "analyzing" | "review" | "saving" | "done";

export default function ImportPage() {
  const router = useRouter();
  const [languages, setLanguages] = useState<any[]>([]);
  const [selectedLang, setSelectedLang] = useState("");
  
  const [phase, setPhase] = useState<Phase>("idle");
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [analyzedData, setAnalyzedData] = useState<AnalyzedWord[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [logs, setLogs] = useState<{ word: string; status: "success" | "error" | "skipped"; message?: string }[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLanguages() {
      const { data } = await supabase.from("languages").select("*");
      if (data) {
        setLanguages(data);
        if (data.length > 0) setSelectedLang(data[0].code);
      }
    }
    fetchLanguages();
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
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

        const data = results.data as any[];
        const formattedData: ParsedRow[] = data.map(row => ({
          word: row.word?.trim(),
          translation: row.translation?.trim(),
          pos: row.pos?.trim()
        })).filter(row => row.word);

        setParsedData(formattedData);
      },
      error: (error) => setErrorMsg("Error parsing CSV: " + error.message)
    });
  };

  const normalizeWord = (word: string) => {
    const articlesRegex = /^(il |la |lo |l'|i |gli |le |un |uno |una |un'|der |die |das |el |la |los |las |le |la |les |l')/i;
    return word.toLowerCase().replace(articlesRegex, "").trim();
  };

  const loadDuplicateIndex = async (lang: string) => {
    const { data, error } = await supabase.from("vocab").select("word").eq("language_code", lang);
    if (error) {
      setErrorMsg(`Failed to load duplicates: ${error.message}`);
      return new Set<string>();
    }
    const existing = new Set<string>();
    (data || []).forEach((item) => {
      existing.add(normalizeWord(item.word));
    });
    return existing;
  };

  const handleAnalyzeData = async () => {
    if (parsedData.length === 0 || !selectedLang) return;
    setPhase("analyzing");
    setProgress({ current: 0, total: parsedData.length });
    setLogs([]);
    setErrorMsg(null);
    const tempAnalyzed: AnalyzedWord[] = [];
    const existingWords = await loadDuplicateIndex(selectedLang);

    for (let i = 0; i < parsedData.length; i++) {
      const currentRow = parsedData[i];
      setProgress({ current: i + 1, total: parsedData.length });

      try {
        const normalized = normalizeWord(currentRow.word);
        const isDup = existingWords.has(normalized);
        if (isDup) {
          setLogs(prev => [{ word: currentRow.word, status: "skipped", message: "Already exists" }, ...prev]);
          continue;
        }

        const contextHint = (currentRow.pos || currentRow.translation) 
          ? ` (Hint: User intends this word to be POS: "${currentRow.pos || 'any'}", meaning related to: "${currentRow.translation || 'any'}")` 
          : "";

        const aiData = await generateVocabInfo(currentRow.word + contextHint, selectedLang);
        
        if (aiData?.error) {
          setLogs(prev => [{ word: currentRow.word, status: "error", message: aiData.error }, ...prev]);
          continue;
        }

        tempAnalyzed.push({
          id: i,
          word: aiData.word || currentRow.word,
          translation: aiData.translation || currentRow.translation || "",
          part_of_speech: aiData.part_of_speech || currentRow.pos || "",
          gender: aiData.gender || "",
          root_word: String(aiData.root_word || "").replace(/^\*/, '').replace(/\s*↗$/, ''),
          verb_type: aiData.verb_type || "",
          category_id: aiData.category_id || "",
          example_sentence: aiData.example_sentence || "",
          example_translation: aiData.example_translation || "",
          conjugation: aiData.conjugation || "",
          notes: aiData.notes || "",
        });
        existingWords.add(normalized);

      } catch (err: any) {
        setLogs(prev => [{ word: currentRow.word, status: "error", message: "Unexpected error" }, ...prev]);
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    setAnalyzedData(tempAnalyzed);
    setPhase("review");
  };

  const handleEditChange = (id: number, field: keyof AnalyzedWord, value: string) => {
    setAnalyzedData(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleRemoveFromReview = (id: number) => {
    setAnalyzedData(prev => prev.filter(item => item.id !== id));
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

  const percentComplete = progress.total === 0 ? 0 : Math.round((progress.current / progress.total) * 100);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans pb-32">
      <nav className="bg-white border-b-2 border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-40 shadow-sm">
        <Link href="/" className="text-3xl font-black tracking-tighter text-blue-600 hover:opacity-80">WordMaster.</Link>
        <button onClick={() => router.back()} className="text-sm font-bold text-gray-500 hover:text-blue-600 flex items-center gap-2 uppercase tracking-widest">
          <span>←</span> Dashboard
        </button>
      </nav>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        {errorMsg && <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 text-red-600 font-bold rounded-2xl">{errorMsg}</div>}
        {phase === "idle" && (
          <div className="animate-in fade-in zoom-in-95 duration-500">
            <header className="mb-10 text-center">
              <p className="text-[10px] font-black text-purple-500 uppercase tracking-widest mb-3 flex items-center justify-center gap-2"><span>✨</span> AI-Powered Magic</p>
              <h1 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight mb-4">Bulk Import</h1>
              <p className="text-lg text-gray-500 font-medium">Upload your vocabulary list. AI will do the heavy lifting.</p>
            </header>

            <div className="bg-white rounded-[2.5rem] p-8 sm:p-12 border-2 border-gray-200 shadow-sm relative overflow-hidden">
              <div className="grid grid-cols-1 gap-8">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black uppercase tracking-tight ml-2 text-gray-400">Select Target Language</label>
                  <select value={selectedLang} onChange={(e) => setSelectedLang(e.target.value)} className="w-full p-4 border-2 rounded-2xl font-bold bg-gray-50 border-gray-100 text-gray-900 outline-none">
                    {languages.map((l) => <option key={l.code} value={l.code}>{l.emoji} {l.name}</option>)}
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black uppercase tracking-tight ml-2 text-gray-400">Upload CSV File</label>
                  <div className="relative border-2 border-dashed border-purple-200 bg-purple-50/30 rounded-[2rem] p-10 text-center hover:bg-purple-50 transition-colors">
                    <input type="file" accept=".csv" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                    <div className="pointer-events-none">
                      <span className="text-4xl block mb-4">📄</span>
                      <p className="text-lg font-black text-purple-700 mb-1">{fileName ? fileName : "Click or drag CSV here"}</p>
                      <p className="text-sm font-bold text-purple-400">Required column: <span className="bg-white px-2 py-0.5 rounded-md border border-purple-100">word</span></p>
                    </div>
                  </div>
                </div>

                {parsedData.length > 0 && (
                  <button onClick={handleAnalyzeData} className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black text-xl py-5 rounded-[2rem] hover:opacity-90 transition-all shadow-xl shadow-purple-500/20 mt-4 flex items-center justify-center gap-3">
                    <span className="text-2xl">🧠</span> Analyze with AI ({parsedData.length} words)
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {(phase === "analyzing" || phase === "saving") && (
          <div className="bg-white rounded-[2.5rem] p-12 border-2 border-gray-200 shadow-sm text-center animate-in fade-in duration-500 mt-10">
            <div className="text-6xl mb-6 animate-pulse">{phase === "analyzing" ? "🧠" : "💾"}</div>
            <h2 className="text-3xl font-black text-gray-900 mb-2">
              {phase === "analyzing" ? "AI is analyzing your words..." : "Saving to your library..."}
            </h2>
            <p className="text-gray-500 font-bold mb-8">Please don't close this window.</p>
            
            <div className="flex justify-between items-end mb-3">
              <span className="text-sm font-black text-gray-400 uppercase tracking-widest">Progress</span>
              <span className="text-2xl font-black text-purple-600">{percentComplete}%</span>
            </div>
            <div className="h-4 bg-gray-100 rounded-full overflow-hidden border-2 border-gray-100 relative">
              <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500 ease-out" style={{ width: `${percentComplete}%` }} />
            </div>
            <p className="text-center text-xs font-bold text-gray-400 mt-3 uppercase tracking-widest">{progress.current} / {progress.total} Processed</p>
          </div>
        )}

        {phase === "review" && (
          <div className="animate-in slide-in-from-bottom-8 duration-500">
            <header className="mb-10 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div>
                <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-2 flex items-center gap-2"><span>👀</span> Review Required</p>
                <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">AI Analysis Complete</h1>
                <p className="text-gray-500 font-medium mt-1">こんな感じで追加していいですか？自由に修正できます。</p>
              </div>
              <button onClick={handleSaveToDatabase} disabled={analyzedData.length === 0} className="w-full sm:w-auto bg-gray-900 text-white font-black px-8 py-4 rounded-2xl hover:bg-black transition-all shadow-xl disabled:opacity-50">
                💾 Confirm & Save All
              </button>
            </header>

            <div className="bg-white rounded-[2rem] border-2 border-gray-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-50 border-b-2 border-gray-200">
                    <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      <th className="p-4 w-10 text-center"></th>
                      <th className="p-4 min-w-[150px]">Word</th>
                      <th className="p-4 min-w-[150px]">Meaning</th>
                      <th className="p-4 min-w-[120px]">POS</th>
                      <th className="p-4 min-w-[120px]">Gender</th>
                      <th className="p-4 min-w-[150px]">Root (Origin)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-gray-100">
                    {analyzedData.length === 0 ? (
                      <tr><td colSpan={6} className="p-10 text-center text-gray-400 font-bold">No words to import. (All duplicates or errors)</td></tr>
                    ) : analyzedData.map((item) => (
                      <tr key={item.id} className="hover:bg-blue-50/30 transition-colors group">
                        <td className="p-4 text-center">
                          <button onClick={() => handleRemoveFromReview(item.id)} className="text-gray-300 hover:text-red-500 transition-colors" title="Remove from import list">✖</button>
                        </td>
                        <td className="p-2">
                          <input type="text" value={item.word} onChange={(e) => handleEditChange(item.id, "word", e.target.value)} className="w-full p-2 bg-transparent border-b-2 border-transparent focus:border-blue-400 outline-none font-bold text-gray-900 transition-colors" />
                        </td>
                        <td className="p-2">
                          <input type="text" value={item.translation} onChange={(e) => handleEditChange(item.id, "translation", e.target.value)} className="w-full p-2 bg-transparent border-b-2 border-transparent focus:border-blue-400 outline-none font-bold text-blue-600 transition-colors" />
                        </td>
                        <td className="p-2">
                          <input type="text" value={item.part_of_speech} onChange={(e) => handleEditChange(item.id, "part_of_speech", e.target.value)} className="w-full p-2 bg-transparent border-b-2 border-transparent focus:border-blue-400 outline-none text-sm font-medium text-gray-600 transition-colors" />
                        </td>
                        <td className="p-2">
                          <input type="text" value={item.gender} onChange={(e) => handleEditChange(item.id, "gender", e.target.value)} className="w-full p-2 bg-transparent border-b-2 border-transparent focus:border-emerald-400 outline-none text-sm font-medium text-emerald-600 transition-colors" />
                        </td>
                        <td className="p-2">
                          <input type="text" value={item.root_word} onChange={(e) => handleEditChange(item.id, "root_word", e.target.value)} className="w-full p-2 bg-transparent border-b-2 border-transparent focus:border-rose-400 outline-none text-sm font-medium text-rose-600 transition-colors" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {phase === "done" && (
          <div className="bg-white rounded-[2.5rem] p-12 border-2 border-gray-200 shadow-sm text-center animate-in zoom-in-95 duration-500 mt-10">
            <div className="text-7xl mb-6">🎉</div>
            <h2 className="text-4xl font-black text-gray-900 mb-4">Import Successful!</h2>
            <p className="text-gray-500 font-bold mb-8 text-lg">Your vocabulary library has grown.</p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button onClick={() => setPhase("idle")} className="px-8 py-4 bg-gray-100 text-gray-600 font-black rounded-2xl hover:bg-gray-200 transition-colors">Import More</button>
              <Link href={`/study/${selectedLang}`} className="px-8 py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl hover:bg-blue-700 transition-colors">Go to Library</Link>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
