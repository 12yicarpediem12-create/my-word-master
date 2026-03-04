"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function TopicDetailPage() {
  const params = useParams();
  const { lang, categoryId } = params;
  const [category, setCategory] = useState<any>(null);
  const [words, setWords] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const { data: catData } = await supabase.from("categories").select("*").eq("id", categoryId).single();
      setCategory(catData);

      const { data: wordData } = await supabase
        .from("vocab")
        .select("*")
        .eq("language_code", lang)
        .eq("category_id", categoryId);
      
      if (wordData) setWords(wordData);
      setIsLoading(false);
    }
    fetchData();
  }, [lang, categoryId]);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <nav className="bg-white border-b-2 border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-50">
        <Link href={`/language/${lang}/topics`} className="text-xs font-black text-gray-400 hover:text-blue-600 uppercase tracking-widest">← Back to Topics</Link>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <header className="mb-12">
          <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-2">{category?.full_path}</p>
          <h1 className="text-5xl font-black text-gray-900 tracking-tight">{category?.name}</h1>
        </header>

        <div className="bg-white rounded-[2rem] border-2 border-gray-200 shadow-sm divide-y-2 divide-gray-100 overflow-hidden">
          {words.length > 0 ? (
            words.map((w) => (
              <Link href={`/word/${w.id}`} key={w.id} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors group">
                <div>
                  <p className="text-xl font-black text-gray-900 group-hover:text-blue-600 transition-colors">{w.word}</p>
                  <p className="text-sm font-bold text-gray-400">{w.translation}</p>
                </div>
                <span className="text-2xl">{w.is_remembered ? "✅" : "🔥"}</span>
              </Link>
            ))
          ) : (
            <div className="p-20 text-center font-bold text-gray-300">No words in this category yet.</div>
          )}
        </div>
      </main>
    </div>
  );
}