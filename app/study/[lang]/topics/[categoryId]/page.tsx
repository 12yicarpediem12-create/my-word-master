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
  // 🌟 追加: パンくずリスト用のState
  const [breadcrumbs, setBreadcrumbs] = useState<{ id: string; name: string }[]>([]); 
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!langCode || !categoryId) return;

      // 🌟 修正: 現在のカテゴリ、全カテゴリ（親を辿るため）、単語データを同時に取得
      const [
        { data: catData },
        { data: allCats },
        { data: wordData }
      ] = await Promise.all([
        supabase.from("categories").select("*").eq("id", categoryId).single(),
        supabase.from("categories").select("id, name, parent_id"),
        supabase.from("vocab").select("*").eq("language_code", langCode).eq("category_id", categoryId)
      ]);

      if (catData) {
        setCategory(catData);

        // 🌟 追加: parent_id を辿って、クリックできるパンくずリストを生成
        if (allCats) {
          const crumbs = [];
          let currentParentId = catData.parent_id;
          
          while (currentParentId) {
            const parent = allCats.find((c: any) => c.id === currentParentId);
            if (parent) {
              crumbs.unshift({ id: parent.id, name: parent.name }); // 親を先頭に追加していく
              currentParentId = parent.parent_id;
            } else {
              break;
            }
          }
          setBreadcrumbs(crumbs);
        }
      }

      if (wordData) setWords(wordData);
      setIsLoading(false);
    }

    fetchData();
  }, [langCode, categoryId]);

  const topicsPath = langCode ? `/study/${langCode}/topics` : "#";

  // 🌟 追加: 一番親のID（大フォルダ）を取得
  const rootId = breadcrumbs.length > 0 ? breadcrumbs[0].id : category?.id;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
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
              <div className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-2 flex flex-wrap items-center gap-2">
                {breadcrumbs.map((crumb) => (
                  <span key={crumb.id} className="flex items-center gap-2">
                    {/* 🌟 修正: 一覧画面のURLに、開くフォルダ(?open)とスクロール位置(#topic)の目印を付ける */}
                    <Link 
                      href={`/study/${langCode}/topics?open=${rootId}#topic-${crumb.id}`}
                      className="hover:text-blue-700 hover:underline transition-all opacity-70 hover:opacity-100"
                    >
                      {crumb.name}
                    </Link>
                    <span className="opacity-40 text-blue-300"> &gt; </span>
                  </span>
                ))}
              </div>

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
                      <span className="text-2xl">{w.is_remembered ? " ✅ " : " 🔥 "}</span>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="p-32 text-center">
                  <span className="text-6xl opacity-20"> 🔍 </span>
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