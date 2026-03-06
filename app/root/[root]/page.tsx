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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-sm font-black text-gray-300 animate-pulse uppercase tracking-widest flex items-center gap-3">
          <span className="w-4 h-4 rounded-full bg-rose-200 animate-bounce"></span> Loading Origins...
        </div>
      </div>
    );
  }

  if (vocabList.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center font-sans">
        <div className="bg-white/60 backdrop-blur-xl border border-gray-200 rounded-[3rem] p-16 shadow-xl text-center max-w-lg mx-auto">
          <div className="text-6xl mb-6 opacity-40">🍃</div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">Root Not Found</h2>
          <p className="text-gray-400 mb-8 font-medium">We couldn't find any words derived from "{decodedRoot}"</p>
          <button onClick={() => router.back()} className="px-8 py-4 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg hover:shadow-xl hover:-translate-y-1">
            ← Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans pb-32 relative overflow-hidden">
      
      {/* 🌟 画面全体を包む柔らかなアンビエントライト（背景の光） */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[600px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-rose-100/60 via-gray-50/10 to-transparent pointer-events-none"></div>

      <nav className="bg-white/70 backdrop-blur-md border-b border-gray-200/50 px-6 py-5 flex justify-between items-center sticky top-0 z-50">
        <Link href="/" className="text-2xl font-black text-blue-600 tracking-tighter">WordMaster.</Link>
        <button onClick={() => router.back()} className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-blue-600 transition-colors">
          ← Back
        </button>
      </nav>

      <main className="relative z-10 flex flex-col items-center mt-12 sm:mt-20 px-4">
        
        {/* 🌟 1. 親玉ノード：超絶モダンなグラスモーフィズムデザイン */}
        <div className="bg-white/80 backdrop-blur-xl border border-rose-100/80 rounded-[3rem] p-10 sm:p-14 shadow-[0_20px_60px_-15px_rgba(225,29,72,0.15)] text-center max-w-3xl transform transition-transform hover:scale-[1.02] duration-500 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-300 via-rose-400 to-rose-300 opacity-50"></div>
          
          <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-4 flex items-center justify-center gap-2">
            <span className="text-sm">✨</span> Etymological Root
          </p>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight mb-8 break-words text-gray-900 leading-tight">
            {decodedRoot}
          </h1>
          
          <div className="inline-flex items-center gap-3 bg-rose-50 border border-rose-100/50 px-5 py-2.5 rounded-full shadow-inner">
            <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse shadow-[0_0_10px_rgba(251,113,133,0.8)]"></span>
            <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest">
              {vocabList.length} Connected Words
            </span>
          </div>
        </div>

        {/* 🌟 2. つながりを暗示するエレガントな縦線（フェードアウト） */}
        <div className="flex flex-col items-center mt-4 mb-8">
          <div className="w-px h-16 sm:h-24 bg-gradient-to-b from-rose-300 to-transparent opacity-60"></div>
        </div>

        {/* 🌟 3. 子ノード群：ホバーエフェクト付きの美しいカード */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8 w-full max-w-7xl relative z-10">
          {vocabList.map((vocab) => (
            <Link 
              href={`/word/${vocab.id}`} 
              key={vocab.id}
              className="block group"
            >
              <div className="bg-white rounded-[2rem] p-6 sm:p-8 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_-15px_rgba(225,29,72,0.15)] hover:border-rose-200 hover:-translate-y-1.5 transition-all duration-300 h-full flex flex-col justify-between relative overflow-hidden">
                
                {/* カード内のさりげないホバー時グラデーション */}
                <div className="absolute -right-10 -top-10 w-32 h-32 bg-rose-50 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

                <div className="relative z-10">
                  <div className="flex justify-between items-center mb-5">
                    <span className="text-[9px] font-black bg-gray-50 text-gray-500 px-3 py-1.5 rounded-lg uppercase tracking-widest group-hover:bg-rose-50 group-hover:text-rose-600 transition-colors shadow-sm">
                      {vocab.language_code}
                    </span>
                    {vocab.part_of_speech && (
                      <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">
                        {vocab.part_of_speech}
                      </span>
                    )}
                  </div>
                  
                  <h2 className="text-2xl sm:text-3xl font-black text-gray-800 mb-2 group-hover:text-rose-600 transition-colors leading-tight break-words">
                    {vocab.word}
                  </h2>
                  
                  <p className="text-sm font-medium text-gray-500 line-clamp-2">
                    {vocab.translation}
                  </p>
                </div>

                <div className="mt-8 relative z-10 flex items-center justify-between">
                   <div className="w-full h-px bg-gray-100 absolute top-0 left-0"></div>
                   <div className="w-full pt-4 flex justify-between items-center text-[10px] font-black text-gray-300 uppercase tracking-widest group-hover:text-rose-400 transition-colors">
                     <span>View Card</span>
                     <span className="text-base transition-transform group-hover:translate-x-1">→</span>
                   </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

      </main>
    </div>
  );
}