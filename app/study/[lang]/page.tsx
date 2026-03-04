"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function LanguageTopicsPage() {
  const params = useParams();
  const langCode = params.lang as string; // URLから 'it' や 'en' を取得
  const [categories, setCategories] = useState<any[]>([]);
  const [expandedTopic, setExpandedTopic] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchCategories() {
      const { data } = await supabase
        .from("categories")
        .select("*")
        .order("id", { ascending: true });
      if (data) setCategories(data);
      setIsLoading(false);
    }
    fetchCategories();
  }, []);

  const mainTopics = categories.filter((c) => c.level === 1);
  const getChildren = (parentId: number) =>
    categories.filter((c) => c.parent_id === parentId);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Navigation */}
      <nav className="bg-white border-b-2 border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-50 shadow-sm">
        {/* 1. ロゴ: 最初の言語選択（ホームページ）に戻る */}
        <Link href="/" className="text-3xl font-black tracking-tighter text-blue-600 hover:opacity-80 transition-opacity">
          WordMaster.
        </Link>
        
        {/* 2. Back to Hub: その言語のハブ画面 (/study/it など) に戻る */}
        <Link 
          href={`/study/${langCode}`} 
          className="text-xs font-black text-gray-400 hover:text-blue-600 uppercase tracking-widest flex items-center gap-2 transition-colors"
        >
          <span>←</span> BACK TO HUB
        </Link>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <header className="mb-12">
          <p className="text-xs font-black text-blue-500 uppercase tracking-[0.2em] mb-2">OALD Taxonomy</p>
          <h1 className="text-5xl font-black text-gray-900 tracking-tight">Topics</h1>
          <p className="text-gray-500 mt-4 font-medium text-lg">Explore your vocabulary by themes.</p>
        </header>

        {isLoading ? (
          <div className="text-center py-20 font-black text-gray-300 animate-pulse uppercase tracking-widest">
            Loading Taxonomy...
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {mainTopics.map((topic) => (
              <div key={topic.id} className="bg-white border-2 border-gray-200 rounded-[2.5rem] overflow-hidden shadow-sm transition-all hover:shadow-md">
                {/* Topic Header (Level 1) */}
                <button 
                  onClick={() => setExpandedTopic(expandedTopic === topic.id ? null : topic.id)}
                  className="w-full flex items-center justify-between p-8 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex items-center gap-6">
                    <span className="text-4xl filter drop-shadow-sm">📁</span>
                    <h2 className="text-2xl font-black text-gray-900">{topic.name}</h2>
                  </div>
                  <span className={`text-xl font-black text-gray-300 transform transition-transform duration-300 ${expandedTopic === topic.id ? "rotate-180 text-blue-500" : ""}`}>
                    ↓
                  </span>
                </button>

                {/* Subtopics (Level 2 & 3) */}
                {expandedTopic === topic.id && (
                  <div className="px-8 pb-10 bg-gray-50/50 border-t-2 border-gray-100">
                    <div className="mt-8 space-y-10">
                      {getChildren(topic.id).map((sub) => (
                        <div key={sub.id} className="animate-in fade-in slide-in-from-top-2 duration-300">
                          <h3 className="text-xs font-black text-blue-400 uppercase tracking-widest mb-4 ml-2 border-l-4 border-blue-200 pl-3">
                            {sub.name}
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {getChildren(sub.id).map((ssub) => (
                              <Link 
                                href={`/study/${langCode}/topics/${ssub.id}`} 
                                key={ssub.id}
                                className="bg-white border-2 border-gray-100 px-5 py-2.5 rounded-xl text-sm font-bold text-gray-600 hover:border-blue-500 hover:text-blue-600 hover:shadow-md transition-all active:scale-95"
                              >
                                {ssub.name}
                              </Link>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}