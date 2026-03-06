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

  const rawRoot = params?.root as string || "";
  const decodedRoot = decodeURIComponent(rawRoot);

  useEffect(() => {
    async function fetchRelatedWords() {
      if (!decodedRoot) return;
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
      <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center">
        <div className="text-sm font-black text-gray-400 animate-pulse uppercase tracking-widest flex items-center gap-3">
          <span className="w-4 h-4 rounded-full bg-blue-500 animate-bounce"></span> Loading Canvas...
        </div>
      </div>
    );
  }

  if (vocabList.length === 0) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex flex-col items-center justify-center font-sans">
        <div className="bg-white border border-gray-200 rounded-3xl p-16 shadow-lg text-center max-w-lg mx-auto">
          <div className="text-6xl mb-6 opacity-40">🍃</div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">Root Not Found</h2>
          <p className="text-gray-500 mb-8 font-medium">We couldn't find any words derived from "{decodedRoot}"</p>
          <button onClick={() => router.back()} className="px-8 py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-md">
            ← Back to Library
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-gray-900 font-sans flex flex-col overflow-hidden">
      
      {/* 🌟 背景：マインドマップ特有のドット方眼キャンバス */}
      <div 
        className="fixed inset-0 pointer-events-none z-0" 
        style={{ 
          backgroundImage: 'radial-gradient(#cbd5e1 1.5px, transparent 1.5px)', 
          backgroundSize: '24px 24px' 
        }}
      ></div>

      {/* 🌟 ツールバー風のナビゲーション */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 px-6 py-4 flex justify-between items-center z-50 shadow-sm relative">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors">
            ←
          </button>
          <div>
            <Link href="/" className="text-xl font-black text-gray-800 tracking-tight">WordMaster.</Link>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Etymology Canvas</p>
          </div>
        </div>
      </nav>

      {/* 🌟 無限キャンバスエリア（スクロール可能） */}
      <main className="relative z-10 flex-1 overflow-auto p-10 md:p-20 flex items-center justify-start xl:justify-center">
        
        {/* ツリー全体を包むコンテナ（横並び） */}
        <div className="flex items-stretch min-w-max mx-auto animate-in fade-in zoom-in-95 duration-500">
          
          {/* 🌿 1. 左側：親ノード（語源） */}
          <div className="flex items-center relative z-20">
            <div className="bg-[#3b82f6] text-white p-8 rounded-xl shadow-lg border border-blue-400 w-72 transform hover:scale-[1.02] transition-transform">
              <p className="text-[10px] font-bold text-blue-200 uppercase tracking-widest mb-1">Root Origin</p>
              <h1 className="text-3xl font-black tracking-tight leading-tight break-words mb-4">
                {decodedRoot}
              </h1>
              <div className="inline-block bg-blue-700/50 px-3 py-1 rounded-md text-xs font-bold text-blue-100">
                {vocabList.length} Derived Words
              </div>
            </div>
            {/* 親ノードから出る短い横線 */}
            <div className="w-8 h-[2px] bg-slate-400"></div>
          </div>

          {/* 🌿 2. 右側：子ノード群と接続線 */}
          <div className="flex flex-col justify-center relative z-10">
            {vocabList.map((vocab, index) => {
              const isFirst = index === 0;
              const isLast = index === vocabList.length - 1;
              const isOnly = vocabList.length === 1;

              return (
                <div key={vocab.id} className="flex items-stretch py-2 group">
                  
                  {/* 🔗 接続線（純粋なCSSで滑らかなカーブを描画） */}
                  <div className="relative w-12 flex-shrink-0">
                    {/* 要素が1つだけの場合の直線 */}
                    {isOnly && (
                      <div className="absolute top-1/2 left-0 w-full h-[2px] bg-slate-400 -translate-y-1/2"></div>
                    )}
                    
                    {/* 一番上の要素のカーブ */}
                    {isFirst && !isOnly && (
                      <div className="absolute top-1/2 bottom-0 left-0 w-full border-l-[2px] border-t-[2px] border-slate-400 rounded-tl-[16px]"></div>
                    )}
                    
                    {/* 一番下の要素のカーブ */}
                    {isLast && !isOnly && (
                      <div className="absolute top-0 bottom-1/2 left-0 w-full border-l-[2px] border-b-[2px] border-slate-400 rounded-bl-[16px]"></div>
                    )}
                    
                    {/* 真ん中の要素のT字路 */}
                    {!isFirst && !isLast && !isOnly && (
                      <>
                        <div className="absolute top-0 bottom-0 left-0 border-l-[2px] border-slate-400"></div>
                        <div className="absolute top-1/2 left-0 w-full h-[2px] bg-slate-400 -translate-y-1/2"></div>
                      </>
                    )}
                  </div>

                  {/* 📝 子ノード（派生単語カード） */}
                  <Link 
                    href={`/word/${vocab.id}`}
                    className="flex-1 ml-1 transform transition-transform duration-200 hover:-translate-y-1 hover:z-30"
                  >
                    <div className="bg-[#eef2ff] text-indigo-950 p-6 rounded-xl shadow-sm border border-indigo-200/60 w-72 hover:border-indigo-400 hover:shadow-md transition-all h-full">
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-[10px] font-black bg-white/60 text-indigo-600 px-2.5 py-1 rounded-md uppercase tracking-widest shadow-sm">
                          {vocab.language_code}
                        </span>
                        {vocab.part_of_speech && (
                          <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">
                            {vocab.part_of_speech}
                          </span>
                        )}
                      </div>
                      <h2 className="text-2xl font-black mb-1 text-gray-800 break-words leading-tight">
                        {vocab.word}
                      </h2>
                      <p className="text-sm font-medium text-indigo-800/60 line-clamp-2">
                        {vocab.translation}
                      </p>
                    </div>
                  </Link>
                  
                </div>
              );
            })}
          </div>

        </div>
      </main>

    </div>
  );
}