"use client";
import { useState, useEffect, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function TopicsContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const langCode = params?.lang as string; // URLから 'it' や 'en' を取得
  
  // 🌟 URLから "open" の値（開くべき大フォルダのID）を取得
  const openTopicId = searchParams.get("open");

  const [categories, setCategories] = useState<any[]>([]);
  // 🌟 型を string | number | null に拡張
  const [expandedTopic, setExpandedTopic] = useState<string | number | null>(null);
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

  // 🌟 URLに目印があったら、フォルダを開いてスクロールする魔法
  useEffect(() => {
    if (openTopicId && !isLoading) {
      setExpandedTopic(openTopicId);
      
      // フォルダが開くアニメーションを少し待ってから、ハッシュ（#topic-〇〇）へスクロール
      setTimeout(() => {
        const hash = window.location.hash;
        if (hash) {
          const element = document.querySelector(hash);
          if (element) {
            // 対象の場所までなめらかにスクロール
            element.scrollIntoView({ behavior: "smooth", block: "center" });
            // どこに飛んだか分かりやすいように、一瞬だけ青く光らせるエフェクト
            element.classList.add("bg-blue-50", "rounded-2xl", "transition-colors", "duration-1000");
            setTimeout(() => element.classList.remove("bg-blue-50"), 2000);
          }
        }
      }, 300);
    }
  }, [openTopicId, isLoading]);

  const mainTopics = categories.filter((c) => c.level === 1);
  const getChildren = (parentId: number) =>
    categories.filter((c) => c.parent_id === parentId);

  // langCode が取れるまでリンクを無効化、またはローディング表示
  const hubPath = langCode ? `/study/${langCode}` : "#";

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Navigation */}
      <nav className="bg-white border-b-2 border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-50 shadow-sm">
        <Link href="/" className="text-3xl font-black tracking-tighter text-blue-600 hover:opacity-80 transition-opacity">
          WordMaster.
        </Link>
        
        <Link 
          href={hubPath} 
          className={`text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-colors ${
            !langCode ? "text-gray-200 cursor-not-allowed" : "text-gray-400 hover:text-blue-600"
          }`}
        >
          <span>←</span> BACK TO HUB
        </Link>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <header className="mb-12">
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
              // 🌟 スクロールできるようにidを付与
              <div key={topic.id} id={`topic-${topic.id}`} className="bg-white border-2 border-gray-200 rounded-[2.5rem] overflow-hidden shadow-sm transition-all hover:shadow-md">
                <button 
                  // 型の不一致を防ぐためStringで比較
                  onClick={() => setExpandedTopic(String(expandedTopic) === String(topic.id) ? null : topic.id)}
                  className="w-full flex items-center justify-between p-8 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex items-center gap-6">
                    <span className="text-4xl filter drop-shadow-sm">📁</span>
                    <h2 className="text-2xl font-black text-gray-900">{topic.name}</h2>
                  </div>
                  <span className={`text-xl font-black text-gray-300 transform transition-transform duration-300 ${String(expandedTopic) === String(topic.id) ? "rotate-180 text-blue-500" : ""}`}>
                    ↓
                  </span>
                </button>

                {String(expandedTopic) === String(topic.id) && (
                  <div className="px-8 pb-10 bg-gray-50/50 border-t-2 border-gray-100">
                    <div className="mt-8 space-y-10">
                      {getChildren(topic.id).map((sub) => (
                        // 🌟 ここにもスクロール用のidを付与
                        <div key={sub.id} id={`topic-${sub.id}`} className="animate-in fade-in slide-in-from-top-2 duration-300 p-2">
                          <h3 className="text-xs font-black text-blue-400 uppercase tracking-widest mb-4 ml-2 border-l-4 border-blue-200 pl-3">
                            {sub.name}
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {getChildren(sub.id).map((ssub) => (
                              <Link 
                                href={`/study/${langCode}/topics/${ssub.id}`} 
                                key={ssub.id}
                                id={`topic-${ssub.id}`}
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

// 🌟 Next.jsの仕様：useSearchParamsを使うコンポーネントはSuspenseで囲む必要がある
export default function LanguageTopicsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center font-bold text-gray-400 tracking-widest uppercase">Loading...</div>}>
      <TopicsContent />
    </Suspense>
  );
}