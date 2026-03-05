"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { generateVocabInfo } from "../actions/ai";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const initialForm = {
  word: "", hint: "", translation: "", pos: "", gender: "",
  verbType: "", categoryId: "", example: "", exampleTranslation: "",
  conjugation: "", notes: "", rootWord: "" 
};

const colorTheme = {
  gray: { label: "text-gray-400", input: "bg-gray-50 border-gray-100 text-gray-900 focus:border-blue-400" },
  emerald: { label: "text-emerald-500", input: "bg-emerald-50/20 border-emerald-100 text-emerald-800 focus:border-emerald-400" },
  purple: { label: "text-purple-500", input: "bg-purple-50/20 border-purple-100 text-purple-800 focus:border-purple-400" },
  blue: { label: "text-blue-400", input: "bg-blue-50/30 border-blue-100 text-blue-900 focus:border-blue-400" },
  amber: { label: "text-amber-500", input: "bg-amber-50/30 border-amber-100 text-amber-900 focus:border-amber-400" },
  // 🌟 語源用のテーマカラーを追加
  rose: { label: "text-rose-500", input: "bg-rose-50/30 border-rose-100 text-rose-900 focus:border-rose-400" }
};

const FieldWrapper = ({ label, color = "gray", children }: { label: string, color?: keyof typeof colorTheme, children: React.ReactNode }) => (
  <div className="flex flex-col gap-2 w-full">
    <label className={`text-[9px] font-black uppercase tracking-tight ml-2 ${colorTheme[color].label}`}>
      {label}
    </label>
    {children}
  </div>
);

export default function CreateCardForm() {
  const router = useRouter();
  const [languages, setLanguages] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedLang, setSelectedLang] = useState("");
  
  const [selL1, setSelL1] = useState<string>("");
  const [selL2, setSelL2] = useState<string>("");
  const [selL3, setSelL3] = useState<string>("");

  const [formData, setFormData] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState(false);

  useEffect(() => {
    async function fetchData() {
      const [langRes, catRes] = await Promise.all([
        supabase.from("languages").select("*"),
        supabase.from("categories").select("*")
      ]);
      if (langRes.data) {
        setLanguages(langRes.data);
        if (langRes.data.length > 0) setSelectedLang(langRes.data[0].code);
      }
      if (catRes.data) {
        setCategories(catRes.data);
      }
    }
    fetchData();
  }, []);

  const handleChange = (field: keyof typeof initialForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateCategoryHierarchy = (categoryId: string | number | null, allCats: any[]) => {
    if (!categoryId) {
      setSelL1(""); setSelL2(""); setSelL3("");
      handleChange("categoryId", "");
      return;
    }
    
    let current = allCats.find(c => String(c.id) === String(categoryId));
    let l1 = "", l2 = "", l3 = "";

    if (current?.level === 3) {
      l3 = String(current.id);
      current = allCats.find(c => String(c.id) === String(current.parent_id));
    }
    if (current?.level === 2) {
      l2 = String(current.id);
      current = allCats.find(c => String(c.id) === String(current.parent_id));
    }
    if (current?.level === 1) {
      l1 = String(current.id);
    }
    
    setSelL1(l1); setSelL2(l2); setSelL3(l3);
    handleChange("categoryId", String(categoryId));
  };

  const handleL1Change = (val: string) => {
    setSelL1(val); setSelL2(""); setSelL3("");
    handleChange("categoryId", val);
  };

  const handleL2Change = (val: string) => {
    setSelL2(val); setSelL3("");
    handleChange("categoryId", val || selL1);
  };

  const handleL3Change = (val: string) => {
    setSelL3(val);
    handleChange("categoryId", val || selL2);
  };

  const checkDuplicate = async (wordToCheck: string, lang: string, posToCheck: string) => {
    if (!posToCheck) return false;
    const articlesRegex = /^(il |la |lo |l'|i |gli |le |un |uno |una |un'|der |die |das |el |la |los |las |le |la |les |l')/i;
    const cleanInputWord = wordToCheck.toLowerCase().replace(articlesRegex, "").trim();

    const { data } = await supabase.from("vocab").select("word, part_of_speech").eq("language_code", lang);
    if (data) {
      return data.some(item => {
        const itemClean = item.word.toLowerCase().replace(articlesRegex, "").trim();
        const posMatch = (item.part_of_speech || "").toLowerCase() === posToCheck.toLowerCase();
        return itemClean === cleanInputWord && posMatch;
      });
    }
    return false;
  };

  const handleAIGenerate = async () => {
    if (!formData.word.trim()) return;
    setErrorMsg(null);
    setSuccessMsg(false);
    setIsGenerating(true);

    try {
      const aiData = await generateVocabInfo(formData.word + (formData.hint ? ` (Hint: ${formData.hint})` : ""), selectedLang);
      if (aiData?.error) { setErrorMsg("AI Error: " + aiData.error); return; }

      if (aiData) {
        const isDup = await checkDuplicate(aiData.word || formData.word, selectedLang, aiData.part_of_speech);
        if (isDup) {
          setErrorMsg(`Already in library as ${aiData.part_of_speech}.`);
          setIsGenerating(false);
          return;
        }

        updateCategoryHierarchy(aiData.category_id, categories);

        setFormData(prev => ({
          ...prev,
          word: aiData.word || prev.word,
          translation: String(aiData.translation || ""),
          pos: String(aiData.part_of_speech || ""),
          gender: String(aiData.gender || ""),
          verbType: String(aiData.verb_type || ""),
          example: String(aiData.example_sentence || ""),
          exampleTranslation: String(aiData.example_translation || ""),
          conjugation: String(aiData.conjugation || ""),
          notes: String(aiData.notes || ""),
          rootWord: String(aiData.root_word || "") 
        }));
      }
    } catch (error: any) {
      setErrorMsg("System Error: " + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddWord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.word || !formData.translation || !selectedLang) return;
    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(false);

    const isDup = await checkDuplicate(formData.word, selectedLang, formData.pos);
    if (isDup) {
      setErrorMsg("This word + Part of Speech already exists.");
      setIsSubmitting(false);
      return;
    }
    
    const { error } = await supabase.from("vocab").insert([{
      language_code: selectedLang, word: formData.word.trim(), translation: formData.translation.trim(),
      part_of_speech: formData.pos || null, gender: formData.gender || null, verb_type: formData.verbType || null,
      category_id: formData.categoryId || null, example_sentence: formData.example || null,
      example_translation: formData.exampleTranslation || null, conjugation: formData.conjugation || null,
      notes: formData.notes || null, 
      root_word: formData.rootWord || null, 
      is_remembered: false,
    }]);

    setIsSubmitting(false);

    if (!error) {
      setFormData(initialForm);
      setSelL1(""); setSelL2(""); setSelL3("");
      setSuccessMsg(true);
      router.refresh(); 
      setTimeout(() => setSuccessMsg(false), 3000);
    } else {
      setErrorMsg("Error: " + error.message);
    }
  };

  const baseInputClass = "w-full p-4 border-2 rounded-2xl font-bold outline-none transition-all";
  const baseTextareaClass = "w-full p-4 border-2 rounded-2xl font-medium outline-none resize-none transition-all";

  const l1Options = categories.filter(c => c.level === 1);
  const l2Options = selL1 ? categories.filter(c => String(c.parent_id) === selL1) : [];
  const l3Options = selL2 ? categories.filter(c => String(c.parent_id) === selL2) : [];

  return (
    <div className="bg-white rounded-[2rem] p-6 sm:p-10 lg:p-14 border-2 border-gray-200 shadow-sm relative overflow-hidden transition-all">
      <div className="absolute top-0 right-0 bg-blue-50 text-blue-600 font-black text-[10px] uppercase tracking-widest px-6 py-3 rounded-bl-2xl border-b-2 border-l-2 border-blue-100">
        ADD NEW WORD
      </div>

      {errorMsg && (
        <div className="mt-8 p-4 bg-red-50 border-2 border-red-200 text-red-600 font-bold rounded-2xl flex items-center justify-between animate-in fade-in zoom-in-95">
          <span>⚠️ {errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="text-xl">×</button>
        </div>
      )}

      {successMsg && (
        <div className="mt-8 p-4 bg-emerald-50 border-2 border-emerald-200 text-emerald-600 font-bold rounded-2xl flex items-center animate-in fade-in slide-in-from-top-4">
          <span>✅ Successfully added to your library!</span>
        </div>
      )}

      <form onSubmit={handleAddWord} className="flex flex-col gap-y-8 lg:gap-y-10 mt-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-start">
          <FieldWrapper label="Language">
            <select value={selectedLang} onChange={(e) => setSelectedLang(e.target.value)} className={`${baseInputClass} ${colorTheme.gray.input}`}>
              {languages.map((l) => (
                <option key={l.code} value={l.code}>{l.emoji} {l.name}</option>
              ))}
            </select>
          </FieldWrapper>

          <FieldWrapper label="Word">
            <div className="flex gap-2 w-full">
              <input type="text" value={formData.word} onChange={(e) => handleChange("word", e.target.value)} required placeholder="e.g. mela" className={`flex-1 min-w-0 ${baseInputClass} ${colorTheme.gray.input}`} />
              <button type="button" onClick={handleAIGenerate} disabled={isGenerating || !formData.word.trim()} className="px-5 py-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-black rounded-2xl text-[10px] shadow-md disabled:opacity-50 shrink-0 hover:opacity-90 transition-opacity">
                {isGenerating ? "..." : "Auto-Fill"}
              </button>
            </div>
            <input type="text" value={formData.hint} onChange={(e) => handleChange("hint", e.target.value)} placeholder="Hint: specific meaning..." className={`mt-2 p-2 rounded-xl text-[9px] font-bold outline-none w-full border border-blue-100 ${colorTheme.blue.input}`} />
          </FieldWrapper>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          <FieldWrapper label="Meaning">
            <input type="text" value={formData.translation} onChange={(e) => handleChange("translation", e.target.value)} required placeholder="English translation" className={`${baseInputClass} ${colorTheme.gray.input}`} />
          </FieldWrapper>
          <FieldWrapper label="Part of Speech">
            <input type="text" value={formData.pos} onChange={(e) => handleChange("pos", e.target.value)} placeholder="Verb" className={`${baseInputClass} ${colorTheme.gray.input}`} />
          </FieldWrapper>
        </div>

        {/* 🌟 3カラムに変更し、Root Wordの入力欄を追加しました */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          <FieldWrapper label="Gender" color="emerald">
            <input type="text" value={formData.gender} onChange={(e) => handleChange("gender", e.target.value)} placeholder="Feminine" className={`${baseInputClass} ${colorTheme.emerald.input}`} />
          </FieldWrapper>
          <FieldWrapper label="Verb Type" color="emerald">
            <input type="text" value={formData.verbType} onChange={(e) => handleChange("verbType", e.target.value)} placeholder="Transitive" className={`${baseInputClass} ${colorTheme.emerald.input}`} />
          </FieldWrapper>
          <FieldWrapper label="Root Word (Etymology)" color="rose">
            <input type="text" value={formData.rootWord} onChange={(e) => handleChange("rootWord", e.target.value)} placeholder="e.g. noctem (Latin)" className={`${baseInputClass} ${colorTheme.rose.input}`} />
          </FieldWrapper>
        </div>

        <FieldWrapper label="Category Taxonomy" color="purple">
          <div className="flex flex-col md:flex-row gap-3 w-full">
            <select value={selL1} onChange={(e) => handleL1Change(e.target.value)} className={`flex-1 ${baseInputClass} ${colorTheme.purple.input} text-sm`}>
              <option value="">-- Main Category --</option>
              {l1Options.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            
            {l2Options.length > 0 && (
              <select value={selL2} onChange={(e) => handleL2Change(e.target.value)} className={`flex-1 ${baseInputClass} ${colorTheme.purple.input} text-sm animate-in fade-in slide-in-from-left-2`}>
                <option value="">-- Sub Category --</option>
                {l2Options.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            )}

            {l3Options.length > 0 && (
              <select value={selL3} onChange={(e) => handleL3Change(e.target.value)} className={`flex-1 ${baseInputClass} ${colorTheme.purple.input} text-sm animate-in fade-in slide-in-from-left-2`}>
                <option value="">-- Specific Topic --</option>
                {l3Options.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            )}
          </div>
        </FieldWrapper>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          <FieldWrapper label="Example Sentence" color="blue">
            <textarea value={formData.example} onChange={(e) => handleChange("example", e.target.value)} rows={3} placeholder="Example..." className={`${baseTextareaClass} ${colorTheme.blue.input}`} />
          </FieldWrapper>
          <FieldWrapper label="Example Translation" color="blue">
            <textarea value={formData.exampleTranslation} onChange={(e) => handleChange("exampleTranslation", e.target.value)} rows={3} placeholder="Translation..." className={`${baseTextareaClass} ${colorTheme.blue.input}`} />
          </FieldWrapper>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          <FieldWrapper label="Conjugation Guide" color="amber">
            <textarea value={formData.conjugation} onChange={(e) => handleChange("conjugation", e.target.value)} rows={4} className={`${baseTextareaClass} ${colorTheme.amber.input}`} />
          </FieldWrapper>
          <FieldWrapper label="Notes / Grammar Pattern">
            <textarea value={formData.notes} onChange={(e) => handleChange("notes", e.target.value)} rows={4} className={`${baseTextareaClass} ${colorTheme.gray.input}`} />
          </FieldWrapper>
        </div>

        <button type="submit" disabled={isSubmitting} className="w-full bg-gray-900 text-white font-black text-lg py-5 rounded-[2rem] hover:bg-black transition-all shadow-lg disabled:bg-gray-400 mt-2">
          {isSubmitting ? "ADDING..." : "+ ADD TO LIBRARY"}
        </button>
      </form>
    </div>
  );
}