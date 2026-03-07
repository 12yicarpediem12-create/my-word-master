"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import AppHeader from "@/app/components/AppHeader";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const BreadcrumbNav = ({ breadcrumbs, langCode, rootId }: { breadcrumbs: any[]; langCode: string; rootId: string }) => (
  <div className="text-[10px] sm:text-xs font-black text-blue-500 uppercase tracking-widest mb-3 flex flex-wrap items-center gap-2">
    {breadcrumbs.map((crumb) => (
      <span key={crumb.id} className="flex items-center gap-2">
        <Link 
          href={`/study/${langCode}/topics?open=${rootId}#topic-${crumb.id}`}
          className="hover:text-blue-700 hover:underline transition-all opacity-70 hover:opacity-100"
        >
          {crumb.name}
        </Link>
        <span className="opacity-40 text-blue-300">&gt;</span>
      </span>
    ))}
  </div>
);

const WordCard = ({ w }: { w: any }) => (
  <Link
    href={`/word/${w.id}`}
    className="p-6 sm:p-8 flex items-center justify-between hover:bg-gray-50 transition-all group gap-4"
  >
    <div className="flex-1 min-w-0">
      <p className="text-xl sm:text-2xl font-black text-gray-900 group-hover:text-blue-600 transition-colors truncate">
        {w.word}
      </p>
      <p className="text-xs sm:text-sm font-bold text-gray-400 mt-1 truncate">
        {w.translation}
      </p>
    </div>
    <div className="flex items-center gap-3 sm:gap-4 shrink-0">
      <span className="hidden sm:inline-block text-[10px] font-black bg-white border-2 border-gray-100 text-gray-400 px-3 py-1 rounded-lg uppercase tracking-widest">
        {w.part_of_speech || "N/A"}
      </span>
      <span className="text-xl sm:text-2xl">{w.is_remembered ? "✅" : "🔥"}</span>
    </div>
  </Link>
);

export default function TopicDetailPage() {
  const params = useParams();
  const langCode = params?.lang as string;
  const categoryId = params?.categoryId as string;

  const [category, setCategory] = useState<any>(null);
  const [words, setWords] = useState<any[]>([]);
  const [breadcrumbs, setBreadcrumbs] = useState<{ id: string; name: string }[]>([]); 
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!langCode || !categoryId) return;

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

        if (allCats) {
          const crumbs = [];
          let currentParentId = catData.parent_id;
          
          while (currentParentId) {
            const parent = allCats.find((c: any) => c.id === currentParentId);
            if (parent) {
              crumbs.unshift({ id: parent.id, name: parent.name });
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
  const rootId = breadcrumbs.length > 0 ? breadcrumbs[0].id : category?.id;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <AppHeader primarySection="study" backHref={topicsPath} backLabel="Topics" />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {isLoading ? (
          <div className="text-center py-20 font-black text-gray-300 animate-pulse uppercase tracking-widest">
            Loading Words...
          </div>
        ) : (
          <>
            <header className="mb-8 sm:mb-12">
              <BreadcrumbNav breadcrumbs={breadcrumbs} langCode={langCode} rootId={rootId} />
              
              <h1 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight break-words">
                {category?.name || "Topic"}
              </h1>
              <p className="text-gray-400 font-bold mt-2 uppercase text-[10px] sm:text-xs tracking-widest">
                {words.length} {words.length === 1 ? 'word' : 'words'} collected
              </p>
            </header>

            <div className="bg-white rounded-[2.5rem] border-2 border-gray-200 shadow-sm divide-y-2 divide-gray-100 overflow-hidden">
              {words.length > 0 ? (
                words.map((w) => <WordCard key={w.id} w={w} />)
              ) : (
                <div className="p-20 sm:p-32 text-center">
                  <span className="text-5xl sm:text-6xl opacity-20">🔍</span>
                  <p className="mt-4 sm:mt-6 font-black text-gray-300 uppercase text-xs sm:text-sm tracking-widest">
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
