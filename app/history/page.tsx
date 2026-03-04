"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import SearchBar from "../components/SearchBar";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function HistoryPage() {
  const router = useRouter();
  const [results, setResults] = useState<any[]>([]);
  const [languages, setLanguages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchHistory() {
      setIsLoading(true);

      const { data: langData } = await supabase.from("languages").select("*");
      if (langData) setLanguages(langData);

      // 全履歴を取得（最新順）
      const { data: vocabData } = await supabase
        .from("vocab")
        .select("*")
        .not("last_reviewed", "is", null) // 復習したことがあるものだけ
        .order("last_reviewed", { ascending: false })
        .limit(50); // 直近50件

      setResults(vocabData || []);
      setIsLoading(false);
    }

    fetchHistory();
  }, []);

  // 日付ごとにグループ化
  const groupedByDate = results.reduce((acc: Record<string, any[]>, vocab: any) => {
    const date = new Date(vocab.last_reviewed).toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "short",
    });
    if (!acc[date]) acc[date] = [];
    acc[date].push(vocab);
    return acc;
  }, {} as Record<string, any[]>);

  // 今日の統計
  const todayStr = new Date().toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric", weekday: "short" });
  const todayWords = groupedByDate[todayStr] || [];
  const masteredToday = todayWords.filter(w => w.is_remembered).length;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans pb-20">
      <nav className="bg-white border-b-2 border-gray-200 px-6 py-4 flex flex-col md:flex-row justify-between items-center sticky top-0 z-50 shadow-sm gap-4">
        <Link href="/" className="text-3xl font-black tracking-tighter text-blue-600">WordMaster.</Link>
        <div className="w-full md:flex-1 md:max-w-2xl md:mx-8"><SearchBar /></div>
        <button onClick={() => router.back()} className="text-sm font-bold text-gray-500 hover:text-blue-600 uppercase tracking-widest flex items-center gap-2"><span>←</span> Dashboard</button>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* 今日のサマリー */}
        <div className="mb-16 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-blue-600 rounded-[2.5rem] p-8 text-white shadow-xl shadow-blue-100">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70 mb-2">Daily Achievements</p>
            <h1 className="text-4xl font-black mb-1">Learning History</h1>
            <p className="text-sm opacity-90 font-medium">Your progress is being etched into memory.</p>
          </div>
          
          <div className="bg-white rounded-[2.5rem] p-8 border-2 border-gray-200 flex items-center justify-around">
            <div className="text-center">
              <p className="text-3xl font-black text-blue-600">{results.length}</p>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Reviews</p>
            </div>
            <div className="w-px h-12 bg-gray-100"></div>
            <div className="text-center">
              <p className="text-3xl font-black text-green-500">{masteredToday}</p>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Mastered Today</p>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-20 font-bold text-gray-400 animate-pulse uppercase tracking-widest">Loading Your Journey...</div>
        ) : Object.keys(groupedByDate).length > 0 ? (
          <div className="space-y-16">
            {Object.keys(groupedByDate).map((date) => (
              <section key={date}>
                <div className="flex items-center gap-4 mb-8">
                  <h2 className="text-xl font-black text-gray-900 whitespace-nowrap">{date}</h2>
                  <div className="h-px bg-gray-200 w-full"></div>
                  <span className="bg-gray-100 text-gray-400 text-[10px] font-black px-3 py-1 rounded-full uppercase">{groupedByDate[date].length} Words</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {groupedByDate[date].map((vocab: any) => {
                    const langInfo = languages.find((l: any) => l.code === vocab.language_code);
                    return (
                      <Link href={`/word/${vocab.id}`} key={vocab.id} className="bg-white border-2 border-gray-100 p-5 rounded-[2rem] hover:border-blue-500 hover:shadow-lg transition-all group flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <span className="text-2xl">{langInfo?.emoji || "🌍"}</span>
                          <div>
                            <p className="font-black text-gray-900 group-hover:text-blue-600 transition-colors">{vocab.word}</p>
                            <p className="text-xs text-gray-400 font-bold">{vocab.translation}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[9px] font-black bg-gray-50 text-gray-400 px-2 py-1 rounded-md uppercase">{vocab.part_of_speech}</span>
                          <span className="text-xl">{vocab.is_remembered ? "✅" : "🔥"}</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-[3rem] p-16 border-2 border-gray-200 text-center shadow-sm">
            <div className="text-7xl mb-6 opacity-30">🏜️</div>
            <h2 className="text-2xl font-black text-gray-400">The history is blank.</h2>
            <p className="text-gray-500 mb-8 mt-2">Time to write your first chapter.</p>
            <Link href="/" className="inline-block bg-blue-600 text-white font-black px-10 py-4 rounded-2xl hover:bg-blue-700 transition-all shadow-lg">Back to Dashboard</Link>
          </div>
        )}
      </main>
    </div>
  );
}