"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function LanguageTopicsPage() {
  const params = useParams();
  const langCode = params.lang as string;
  const [categories, setCategories] = useState<any[]>([]);
  const [expandedTopic, setExpandedTopic] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchCategories() {
      const { data } = await supabase.from("categories").select("*").order("id", { ascending: true });
      if (data) setCategories(data);
      setIsLoading(false);
    }
    fetchCategories();
  }, []);

  const mainTopics = categories.filter(c => c.level === 1);
  const getChildren = (parentId: number) => categories.filter(c => c.parent_id === parentId);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <nav className="bg-white border-b-2 border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-50">
        <Link href={`/language/${langCode}`} className="text-2xl font-black tracking-tighter text-blue-600">WordMaster.</Link>
        <Link href={`/language/${langCode}`} className="text-xs font-black text-gray-400 hover:text-blue-600 uppercase tracking-widest">← Back to Hub</Link>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <header className="mb-12">
          <h1 className="text-5xl font-black text-gray-900 tracking-tight">Topics</h1>
          <p className="text-gray-500 mt-2 font-medium">Explore vocabulary by OALD categories.</p>
        </header>

        <div className="grid grid-cols-1 gap-4">
          {mainTopics.map((topic) => (
            <div key={topic.id} className="bg-white border-2 border-gray-200 rounded-[2rem] overflow-hidden shadow-sm">
              <button 
                onClick={() => setExpandedTopic(expandedTopic === topic.id ? null : topic.id)}
                className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition-colors"
              >
                <h2 className="text-xl font-black text-gray-900">{topic.name}</h2>
                <span className={`transform transition-transform ${expandedTopic === topic.id ? "rotate-180" : ""}`}>▼</span>
              </button>

              {expandedTopic === topic.id && (
                <div className="px-6 pb-6 bg-gray-50/50 border-t-2 border-gray-100">
                  <div className="mt-6 space-y-8">
                    {getChildren(topic.id).map((sub) => (
                      <div key={sub.id}>
                        <h3 className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-3 ml-1">{sub.name}</h3>
                        <div className="flex flex-wrap gap-2">
                          {getChildren(sub.id).map((ssub) => (
                            <Link 
                              href={`/language/${langCode}/topics/${ssub.id}`} 
                              key={ssub.id}
                              className="bg-white border-2 border-gray-100 px-4 py-2 rounded-xl text-sm font-bold text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-all shadow-sm"
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
      </main>
    </div>
  );
}