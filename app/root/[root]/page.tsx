"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function RootMindMapPage() {
  const params = useParams();
  const router = useRouter();
  const [vocabList, setVocabList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 🌟 1. 最大の解決策：URLの安全な文字(%20など)を、元の文字(スペースやカッコ)に復元する！
  const rawRoot = params?.root as string || "";
  const decodedRoot = decodeURIComponent(rawRoot);

  useEffect(() => {
    async function fetchRelatedWords() {
      if (!decodedRoot) return;
      
      // 復元した正しい文字（例: "actor (Latin)"）でSupabaseを検索
      const { data } = await supabase
        .from("vocab")
        .select("*")
        .eq("root_word", decodedRoot);

      if (data) setVocabList(data);
      setIsLoading(false);
    }
    fetchRelatedWords();
  }, [decodedRoot]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl font-bold text-gray-300 animate-pulse uppercase tracking-widest">
          Loading Mind Map...
        </div>
      </div>
    );
  }

  if (vocabList.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center font-bold">
        <div className="text-6xl mb-6 opacity-50">🧭</div>
        <h2 className="text-2xl font-black text-gray-900 mb-2">Root Not Found</h2>
        <p className="text-gray-400 mb-8 font-medium">We couldn't find any words derived from "{decodedRoot}"</p>
        <button onClick={() => router.back()} className="px-8 py-4 bg-rose-50 text-rose-500 rounded-2xl font-black uppercase tracking-widest hover:bg-rose-100 transition-colors">
          ← Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans pb-20 overflow-x-hidden">
      <nav className="bg-white border-b-2 border-gray-200 px-6 py-5 flex justify-between items-center sticky top-0 z-50 shadow-sm">
        <Link href="/" className="text-2xl font-black text-blue-600 tracking-tighter">WordMaster.</Link>
        <button onClick={() => router.back()} className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-blue-600 transition-colors">
          ← Back
        </button>
      </nav>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-12 lg:py-20 flex flex-col items-center">
        
        {/* 🌟 語源の親玉（中心ノード） */}
        <div className="bg-rose-600 text-white rounded-[2.5rem] p-10 sm:p-14 border-4 border-rose-200 shadow-2xl relative z-10 w-full max-w-2xl text-center transform hover:scale-[1.02] transition-transform">
          <p className="text-[10px] font-black text-rose-200 uppercase tracking-widest mb-4 flex items-center justify-center gap-2">
            <span>🌱</span> Etymological Root
          </p>
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight break-words">
            {decodedRoot}
          </h1>
          <p className="text-xs font-bold text-rose-200 mt-6 uppercase tracking-widest bg-rose-700/50 inline-block px-4 py-2 rounded-full">
            {vocabList.length} Derived Words
          </p>
        </div>

        {/* 🌟 枝分かれの線（視覚的効果でマインドマップ感を演出） */}
        <div className="w-1 h-12 sm:h-20 bg-rose-200 relative -mt-2 z-0"></div>
        <div className="w-[80%] max-w-3xl border-t-4 border-rose-200 relative z-0 rounded-t-xl">
           <div className="absolute left-0 top-0 w-1 h-8 sm:h-12 bg-rose-200"></div>
           <div className="absolute right-0 top-0 w-1 h-8 sm:h-12 bg-rose-200"></div>
           <div className="absolute left-1/2 top-0 w-1 h-8 sm:h-12 bg-rose-200 transform -translate-x-1/2"></div>
        </div>

        {/* 🌟 派生した単語リスト（子ノード群） */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 w-full max-w-5xl mt-8 sm:mt-12">
          {vocabList.map((vocab) => (
            <Link 
              href={`/word/${vocab.id}`} 
              key={vocab.id}
              className="bg-white rounded-[2rem] p-8 border-2 border-gray-200 shadow-sm hover:border-rose-400 hover:shadow-xl transition-all group flex flex-col justify-between animate-in fade-in slide-in-from-bottom-4 duration-500"
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <span className="text-[10px] font-black bg-gray-100 text-gray-500 px-3 py-1 rounded-lg uppercase tracking-widest group-hover:bg-rose-50 group-hover:text-rose-500 transition-colors">
                    {vocab.language_code}
                  </span>
                </div>
                <h2 className="text-3xl font-black text-gray-900 group-hover:text-rose-600 transition-colors break-words leading-tight">
                  {vocab.word}
                </h2>
                <p className="text-sm font-bold text-gray-400 mt-3 line-clamp-2">
                  {vocab.translation}
                </p>
              </div>
              
              {vocab.part_of_speech && (
                 <div className="mt-6 pt-4 border-t-2 border-gray-50 flex items-center justify-between">
                    <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Type</span>
                    <span className="text-xs font-bold text-gray-600">{vocab.part_of_speech}</span>
                 </div>
              )}
            </Link>
          ))}
        </div>

      </main>
    </div>
  );
}