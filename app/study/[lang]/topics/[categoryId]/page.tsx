"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function TopicDetailPage() {
  const params = useParams();
  const langCode = params?.lang as string;
  const categoryId = params?.categoryId as string;
  
  const [category, setCategory] = useState<any>(null);
  const [words, setWords] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!langCode || !categoryId) return;

      // カテゴリ情報の取得
      const { data: catData } = await supabase
        .from("categories")
        .select("*")
        .eq("id", categoryId)
        .single();
      setCategory(catData);

      // そのカテゴリに属する単語の取得
      const { data: wordData } = await supabase
        .from("vocab")
        .select("*")
        .eq("language_code", langCode)
        .eq("category_id", categoryId);
      
      if (wordData) setWords(wordData);
      setIsLoading(false);
    }
    fetchData();
  }, [langCode, categoryId]);

  // パスのガード
  const topicsPath = langCode ? `/study/${langCode}/topics` : "#";

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Navigation: Topicsページとデザインを統一 */}
      <nav className="bg-white border-b-2 border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-50 shadow-sm">
        <Link href="/" className="text-3xl font-black tracking-tighter text-blue-600 hover:opacity-80 transition-opacity">
          WordMaster.
        </Link>
        
        <Link 
          href={topicsPath} 
          className={`text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-colors ${
            !langCode ? "text-gray-200 cursor-not-allowed" : "text-gray-400 hover:text-blue-600"
          }`}
        >
          <span>←</span> BACK TO TOPICS
        </Link>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-12">
        {isLoading ? (
          <div className="text-center py-20 font-black text-gray-300 animate-pulse uppercase tracking-widest">
            Loading Words...
          </div>
        ) : (
          <>
            <header className="mb-12">
              <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-2 opacity-60">
                {category?.full_path?.split(" > ").slice(0, -1).join(" > ")}
              </p>
              <h1 className="text-5xl font-black text-gray-900 tracking-tight">
                {category?.name || "Topic"}
              </h1>
              <p className="text-gray-400 font-bold mt-2 uppercase text-xs tracking-widest">
                {words.length} {words.length === 1 ? 'word' : 'words'} collected
              </p>
            </header>

            <div className="bg-white rounded-[2.5rem] border-2 border-gray-200 shadow-sm divide-y-2 divide-gray-100 overflow-hidden">
              {words.length > 0 ? (
                words.map((w) => (
                  <Link 
                    href={`/word/${w.id}`} 
                    key={w.id} 
                    className="p-8 flex items-center justify-between hover:bg-gray-50 transition-all group"
                  >
                    <div>
                      <p className="text-2xl font-black text-gray-900 group-hover:text-blue-600 transition-colors">
                        {w.word}
                      </p>
                      <p className="text-sm font-bold text-gray-400 mt-1">
                        {w.translation}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-[10px] font-black bg-gray-50 text-gray-400 px-3 py-1 rounded-lg uppercase tracking-widest">
                        {w.part_of_speech}
                      </span>
                      <span className="text-2xl">{w.is_remembered ? "✅" : "🔥"}</span>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="p-32 text-center">
                  <span className="text-6xl opacity-20">🔍</span>
                  <p className="mt-6 font-black text-gray-300 uppercase tracking-widest">
                    No words in this topic yet
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}