"use client";
import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { getWordNuance, generateWordDetails } from "../../actions/ai";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const colorTheme = {
  gray: { label: "text-gray-400", input: "bg-gray-50 border-gray-100 text-gray-900 focus:border-blue-400" },
  emerald: { label: "text-emerald-500", input: "bg-emerald-50/20 border-emerald-100 text-emerald-800 focus:border-emerald-400" },
  purple: { label: "text-purple-500", input: "bg-purple-50/20 border-purple-100 text-purple-800 focus:border-purple-400" },
  blue: { label: "text-blue-400", input: "bg-blue-50/30 border-blue-100 text-blue-900 focus:border-blue-400" },
  amber: { label: "text-amber-500", input: "bg-amber-50/30 border-amber-100 text-amber-900 focus:border-amber-400" }
};

const FieldWrapper = ({ label, color = "gray", children }: { label: string, color?: keyof typeof colorTheme, children: React.ReactNode }) => (
  <div className="flex flex-col gap-2 w-full">
    <label className={`text-[9px] font-black uppercase tracking-tight ml-2 ${colorTheme[color].label}`}>
      {label}
    </label>
    {children}
  </div>
);

export default function WordDetail() {
  const params = useParams();
  const router = useRouter();
  const wordId = params.id as string;
  
  const [vocab, setVocab] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [isAskingAI, setIsAskingAI] = useState(false);
  const [tempNuance, setTempNuance] = useState<string | null>(null);
  const [isAutoFilling, setIsAutoFilling] = useState(false);

  const [editForm, setEditForm] = useState({
    word: "", translation: "", pos: "", notes: "", example: "",
    exampleTranslation: "", categoryId: "", conjugation: "", gender: "", verbType: ""
  });

  useEffect(() => {
    async function fetchData() {
      if (!wordId) return;
      const [vocabRes, catRes] = await Promise.all([
        supabase.from("vocab").select(`*, categories:category_id ( id, name, full_path )`).eq("id", wordId).single(),
        supabase.from("categories").select("id, full_path").order("full_path")
      ]);
      
      if (catRes.data) setCategories(catRes.data);

      if (vocabRes.data) {
        setVocab(vocabRes.data);
        setEditForm({
          word: vocabRes.data.word || "",
          translation: vocabRes.data.translation || "",
          pos: vocabRes.data.part_of_speech || "",
          notes: vocabRes.data.notes || "",
          example: vocabRes.data.example_sentence || "",
          exampleTranslation: vocabRes.data.example_translation || "",
          categoryId: vocabRes.data.category_id || "",
          conjugation: vocabRes.data.conjugation || "",
          gender: vocabRes.data.gender || "",
          verbType: vocabRes.data.verb_type || ""
        });
      }
      setIsLoading(false);
    }
    fetchData();
  }, [wordId]);

  const speak = useCallback((text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const langMap: Record<string, string> = { 
      it: "it-IT", fr: "fr-FR", es: "es-ES", de: "de-DE", pt: "pt-PT", ja: "ja-JP", ko: "ko-KR", ru: "ru-RU", zh: "zh-CN", en: "en-US",
    };
    utterance.lang = langMap[vocab?.language_code] || "en-US";
    window.speechSynthesis.speak(utterance);
  }, [vocab]);

  const handleAskNuance = async () => {
    if (!vocab) return;
    setIsAskingAI(true);
    setTempNuance(null);
    try {
      const nuance = await getWordNuance(vocab.word, vocab.language_code, vocab.translation);
      setTempNuance(String(nuance).replace(/\*\*/g, ''));
    } catch (err) { 
      console.error(err); 
    } finally { 
      setIsAskingAI(false); 
    }
  };

  const handleAutoFill = async () => {
    if (!editForm.word || !vocab) return;
    setIsAutoFilling(true);
    try {
      const aiData = await generateWordDetails(editForm.word, vocab.language_code);
      if (!aiData.error) {
        setEditForm(prev => ({
          ...prev,
          translation: aiData.translation || prev.translation,
          pos: aiData.part_of_speech || prev.pos,
          gender: aiData.gender || prev.gender,
          verbType: aiData.verb_type || prev.verbType,
          conjugation: aiData.conjugation || prev.conjugation,
          example: aiData.example_sentence || prev.example,
          exampleTranslation: aiData.example_translation || prev.exampleTranslation,
          categoryId: aiData.category_id ? String(aiData.category_id) : prev.categoryId,
          notes: aiData.notes || prev.notes
        }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAutoFilling(false);
    }
  };

  const handleChange = (field: keyof typeof editForm, value: string) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  const handleUpdate = async () => {
    const { error } = await supabase
      .from("vocab")
      .update({
        word: editForm.word,
        translation: editForm.translation,
        part_of_speech: editForm.pos || null,
        notes: editForm.notes || null,
        example_sentence: editForm.example || null,
        example_translation: editForm.exampleTranslation || null,
        category_id: editForm.categoryId || null,
        conjugation: editForm.conjugation || null,
        gender: editForm.gender || null,
        verb_type: editForm.verbType || null,
      })
      .eq("id", wordId);

    if (!error) {
      const selectedCategory = categories.find(c => String(c.id) === String(editForm.categoryId));
      
      setVocab((prev: any) => ({
        ...prev,
        word: editForm.word,
        translation: editForm.translation,
        part_of_speech: editForm.pos || null,
        notes: editForm.notes || null,
        example_sentence: editForm.example || null,
        example_translation: editForm.exampleTranslation || null,
        category_id: editForm.categoryId || null,
        conjugation: editForm.conjugation || null,
        gender: editForm.gender || null,
        verb_type: editForm.verbType || null,
        categories: selectedCategory ? { id: selectedCategory.id, full_path: selectedCategory.full_path } : null
      }));
      setIsEditing(false);
      router.refresh(); 
    }
  };

  const handleToggleRemembered = async () => {
    const newStatus = !vocab.is_remembered;
    const { error } = await supabase.from("vocab").update({ is_remembered: newStatus }).eq("id", wordId);
    if (!error) setVocab({ ...vocab, is_remembered: newStatus });
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this word from your library?")) return;
    setIsDeleting(true);
    const { error } = await supabase.from("vocab").delete().eq("id", wordId);
    if (!error) router.push(`/study/${vocab.language_code}`);
    else setIsDeleting(false);
  };

  const getMainTopicName = () => {
    if (!vocab.categories?.full_path) return "General";
    return vocab.categories.full_path.split(" > ")[0];
  };

  if (isLoading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center font-bold text-gray-400">Loading...</div>;
  if (!vocab) return <div className="min-h-screen bg-gray-50 flex items-center justify-center font-bold">Word Not Found.</div>;

  const baseInputClass = "w-full p-4 border-2 rounded-2xl font-bold outline-none transition-all";
  const baseTextareaClass = "w-full p-4 border-2 rounded-2xl font-medium outline-none resize-none transition-all";

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans pb-20">
      <nav className="bg-white border-b-2 border-gray-200 px-6 py-5 flex justify-between items-center sticky top-0 z-50">
        <Link href="/" className="text-2xl font-black text-blue-600 tracking-tighter">WordMaster.</Link>
        <button onClick={() => router.back()} className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-blue-600 transition-colors">← Back</button>
      </nav>

      <main className="max-w-2xl lg:max-w-4xl mx-auto px-4 sm:px-6 py-8 lg:py-12 transition-all">
        <div className="bg-white rounded-[2.5rem] p-6 sm:p-10 lg:p-14 border-2 border-gray-200 shadow-lg relative overflow-hidden transition-all">
          
          <div className="absolute top-0 right-0 bg-blue-50 text-blue-600 font-black uppercase tracking-widest px-6 py-3 border-b-2 border-l-2 border-blue-100 text-[10px]">
            {vocab.language_code}
          </div>

          {!isEditing ? (
            <div className="space-y-10 mt-6 lg:mt-8">
              <div className="text-center">
                <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-3">Word</p>
                <div className="flex items-center justify-center gap-4 flex-wrap">
                  <h1 className="text-4xl sm:text-6xl font-black break-all leading-tight">{vocab.word}</h1>
                  <button onClick={() => speak(vocab.word)} className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-50 rounded-full flex items-center justify-center text-lg hover:bg-blue-50 transition-all shadow-sm"> 🔊 </button>
                </div>
              </div>

              {vocab.conjugation && (
                <div className="bg-amber-50 rounded-[2rem] p-6 sm:p-8 border-2 border-amber-100">
                  <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-4 flex items-center gap-2"><span>⚡</span> Conjugation Guide</p>
                  <p className="text-base sm:text-lg font-bold text-amber-900 whitespace-pre-wrap leading-relaxed italic">{vocab.conjugation}</p>
                </div>
              )}

              <div className="text-center border-t-2 border-gray-50 pt-10">
                <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-3">Meaning</p>
                <h2 className="text-2xl sm:text-4xl font-bold text-blue-600 leading-tight">{vocab.translation}</h2>
              </div>

              {(vocab.example_sentence || vocab.example_translation) && (
                <div className="bg-blue-50 p-6 sm:p-8 rounded-[2rem] border-2 border-blue-100">
                  <p className="text-[10px] font-black text-blue-300 uppercase tracking-widest mb-4 text-center">Context & Example</p>
                  {vocab.example_sentence && (
                    <div className="flex flex-col items-center gap-4">
                      <p className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 text-center leading-relaxed italic">"{vocab.example_sentence}"</p>
                      <button onClick={() => speak(vocab.example_sentence)} className="bg-white/80 px-4 py-2 rounded-2xl shadow-sm hover:bg-white transition-all text-[10px] font-bold text-blue-600"> 🔊 Play Example</button>
                    </div>
                  )}
                  {vocab.example_translation && <p className="text-xs lg:text-sm font-medium text-gray-500 mt-6 text-center border-t border-blue-100 pt-4">{vocab.example_translation}</p>}
                </div>
              )}

              <div className="border-t-2 border-gray-50 pt-10">
                <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-4">Notes / Grammar Pattern</p>
                <div className="bg-gray-50 rounded-[2rem] p-6 sm:p-8 border-2 border-gray-100">
                  <p className="text-sm lg:text-base font-medium text-gray-700 whitespace-pre-wrap leading-relaxed italic">
                    {vocab.notes || "No grammar notes added."}
                  </p>
                </div>
              </div>

              <div className="border-t-2 border-gray-50 pt-10">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Usage & Nuance</p>
                  <button onClick={handleAskNuance} disabled={isAskingAI} className="text-[9px] font-black bg-blue-50 text-blue-600 px-4 py-2 rounded-full hover:bg-blue-100 transition-all disabled:opacity-50">
                    {isAskingAI ? "✨ ANALYZING..." : "🪄 ASK AI"}
                  </button>
                </div>
                {tempNuance && (
                  <div className="bg-indigo-50/50 rounded-[2rem] p-6 sm:p-8 border-2 border-dashed border-indigo-100 animate-in fade-in duration-500">
                    <p className="text-sm lg:text-base font-medium text-gray-700 whitespace-pre-wrap leading-relaxed">{tempNuance}</p>
                    <p className="text-[8px] font-bold text-indigo-300 mt-4 uppercase">※ Insight not saved in library.</p>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-4 border-t-2 border-gray-50 pt-10">
                {vocab.categories && (
                  <Link 
                    href={`/study/${vocab.language_code}/topics/${vocab.category_id}`}
                    className="flex-1 min-w-[140px] bg-indigo-50 p-5 rounded-3xl border border-indigo-100 group hover:border-indigo-400 transition-all overflow-hidden"
                  >
                    <p className="text-[9px] font-black text-indigo-400 uppercase tracking-tight mb-2 whitespace-nowrap">Topic</p>
                    <p className="font-bold text-indigo-900 text-sm sm:text-base break-words leading-tight group-hover:text-indigo-600 transition-colors">
                      {getMainTopicName()}
                    </p>
                    <p className="text-[8px] font-bold text-indigo-300 mt-2 uppercase">Go to Sub-list →</p>
                  </Link>
                )}

                <div className="flex-1 min-w-[140px] bg-gray-50 p-5 rounded-3xl border border-gray-100 overflow-hidden">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-tight mb-2 whitespace-nowrap">Part of Speech</p>
                  <p className="font-bold text-gray-800 text-sm break-words leading-tight">{vocab.part_of_speech || "---"}</p>
                </div>

                {vocab.part_of_speech === 'Verb' ? (
                  <div className="flex-1 min-w-[140px] bg-emerald-50 p-5 rounded-3xl border border-emerald-100 overflow-hidden">
                    <p className="text-[9px] font-black text-emerald-500 uppercase tracking-tight mb-2 whitespace-nowrap">Verb Type</p>
                    <p className="font-bold text-emerald-800 text-[11px] sm:text-sm break-all leading-tight">{vocab.verb_type || "---"}</p>
                  </div>
                ) : vocab.part_of_speech === 'Noun' ? (
                  <div className="flex-1 min-w-[140px] bg-emerald-50 p-5 rounded-3xl border border-emerald-100 overflow-hidden">
                    <p className="text-[9px] font-black text-emerald-500 uppercase tracking-tight mb-2 whitespace-nowrap">Gender</p>
                    <p className="font-bold text-emerald-800 text-sm sm:text-base break-words leading-tight">{vocab.gender || "---"}</p>
                  </div>
                ) : null}

                <div className="flex-1 min-w-[120px] bg-gray-50 p-5 rounded-3xl border border-gray-100 flex flex-col items-center justify-center">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Mastery</p>
                  <button onClick={handleToggleRemembered} className={`w-full py-2 px-3 rounded-2xl font-black text-[10px] transition-all uppercase tracking-widest shadow-sm ${vocab.is_remembered ? "bg-green-500 text-white shadow-lg" : "bg-orange-100 text-orange-600"}`}>
                    {vocab.is_remembered ? "Mastered" : "Learning"}
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t-2 border-gray-50">
                <button onClick={() => setIsEditing(true)} className="flex-1 bg-gray-900 text-white font-black py-4 rounded-2xl sm:rounded-[2rem] hover:bg-gray-800 transition-all shadow-xl active:scale-[0.98]">✏️ Edit Details</button>
                <button onClick={handleDelete} disabled={isDeleting} className="w-full sm:w-auto px-8 bg-red-50 text-red-500 font-black py-4 rounded-2xl sm:rounded-[2rem] hover:bg-red-100 transition-colors">🗑️ Delete</button>
              </div>
            </div>
          ) : (
            <div className="space-y-6 mt-10 lg:mt-12 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                <h2 className="text-2xl font-black tracking-tight">Edit Word Details</h2>
                <button 
                  onClick={handleAutoFill} 
                  disabled={isAutoFilling}
                  className="bg-purple-100 text-purple-600 px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-purple-200 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
                >
                  {isAutoFilling ? "✨ Auto-filling..." : "🪄 AI Auto-Fill"}
                </button>
              </div>

              <div className="flex flex-col gap-y-6 lg:gap-y-8">
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-start">
                  <FieldWrapper label="Word">
                    <input type="text" value={editForm.word} onChange={(e) => handleChange("word", e.target.value)} className={`${baseInputClass} ${colorTheme.gray.input}`} />
                  </FieldWrapper>
                  <FieldWrapper label="Category" color="purple">
                    <select 
                      value={editForm.categoryId || ""} 
                      onChange={(e) => handleChange("categoryId", e.target.value)} 
                      className={`${baseInputClass} ${colorTheme.purple.input} text-xs truncate`}
                    >
                      <option value="">-- No Category --</option>
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.full_path}</option>
                      ))}
                    </select>
                  </FieldWrapper>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                  <FieldWrapper label="Meaning">
                    <input type="text" value={editForm.translation} onChange={(e) => handleChange("translation", e.target.value)} className={`${baseInputClass} ${colorTheme.gray.input}`} />
                  </FieldWrapper>
                  <FieldWrapper label="Part of Speech">
                    <input type="text" value={editForm.pos} onChange={(e) => handleChange("pos", e.target.value)} className={`${baseInputClass} ${colorTheme.gray.input}`} />
                  </FieldWrapper>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
                  <FieldWrapper label="Gender" color="emerald">
                    <input type="text" value={editForm.gender} onChange={(e) => handleChange("gender", e.target.value)} className={`${baseInputClass} ${colorTheme.emerald.input}`} />
                  </FieldWrapper>
                  <FieldWrapper label="Verb Type" color="emerald">
                    <input type="text" value={editForm.verbType} onChange={(e) => handleChange("verbType", e.target.value)} className={`${baseInputClass} ${colorTheme.emerald.input}`} />
                  </FieldWrapper>
                  <FieldWrapper label="Placeholder" color="gray">
                     <div className="w-full p-4 border-2 border-transparent"></div>
                  </FieldWrapper>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                  <FieldWrapper label="Example Sentence" color="blue">
                    <textarea value={editForm.example} onChange={(e) => handleChange("example", e.target.value)} rows={3} className={`${baseTextareaClass} ${colorTheme.blue.input}`} />
                  </FieldWrapper>
                  <FieldWrapper label="Example Translation" color="blue">
                    <textarea value={editForm.exampleTranslation} onChange={(e) => handleChange("exampleTranslation", e.target.value)} rows={3} className={`${baseTextareaClass} ${colorTheme.blue.input}`} />
                  </FieldWrapper>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                  <FieldWrapper label="Conjugation Guide" color="amber">
                    <textarea value={editForm.conjugation} onChange={(e) => handleChange("conjugation", e.target.value)} rows={5} className={`${baseTextareaClass} ${colorTheme.amber.input}`} />
                  </FieldWrapper>
                  <FieldWrapper label="Notes / Grammar Pattern">
                    <textarea value={editForm.notes} onChange={(e) => handleChange("notes", e.target.value)} rows={4} className={`${baseTextareaClass} ${colorTheme.gray.input}`} />
                  </FieldWrapper>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-6">
                  <button onClick={() => setIsEditing(false)} className="w-full sm:w-1/3 bg-gray-100 text-gray-500 font-black py-4 rounded-2xl hover:bg-gray-200 transition-colors">Cancel</button>
                  <button onClick={handleUpdate} className="flex-1 bg-blue-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all">Save Changes</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}