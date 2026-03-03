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
    async function fetchTodayHistory() {
      setIsLoading(true);

      // 1. 言語マスターデータを取得
      const { data: langData } = await supabase.from("languages").select("*");
      if (langData) setLanguages(langData);

      // 2. 「今日」の始まり（00:00:00）を計算
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      // 3. 今日復習（last_reviewedが今日）した単語を取得
      const { data: vocabData } = await supabase
        .from("vocab")
        .select("*")
        .gte("last_reviewed", startOfToday.toISOString())
        .order("last_reviewed", { ascending: false });

      setResults(vocabData || []);
      setIsLoading(false);
    }

    fetchTodayHistory();
  }, []);

  // 言語ごとにグループ化
  const groupedResults = results.reduce((acc: Record<string, any[]>, vocab: any) => {
    if (!acc[vocab.language_code]) acc[vocab.language_code] = [];
    acc[vocab.language_code].push(vocab);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans pb-20">
      <nav className="bg-white border-b-2 border-gray-200 px-6 py-4 flex flex-col md:flex-row justify-between items-center sticky top-0 z-50 shadow-sm gap-4">
        <Link href="/" className="text-3xl font-black tracking-tighter text-blue-600">WordMaster.</Link>
        <div className="w-full md:flex-1 md:max-w-2xl md:mx-8"><SearchBar /></div>
        <button onClick={() => router.back()} className="text-sm font-bold text-gray-500 hover:text-blue-600 uppercase tracking-widest flex items-center gap-2"><span>←</span> Dashboard</button>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-12">
          <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Your Activity</p>
          <h1 className="text-5xl font-black tracking-tight text-gray-900">Reviewed Today</h1>
          <p className="text-lg text-gray-500 font-medium mt-4">
            {results.length > 0 
              ? `Amazing! You've tackled ${results.length} words today.` 
              : "No words reviewed yet today. Let's start a session!"}
          </p>
        </div>

        {isLoading ? (
          <div className="text-center py-20 font-bold text-gray-400 animate-pulse uppercase tracking-widest">Loading History...</div>
        ) : results.length > 0 ? (
          <div className="space-y-10">
            {Object.keys(groupedResults).map((langCode) => {
              const langInfo = languages.find((l: any) => l.code === langCode);
              const words = groupedResults[langCode];

              return (
                <div key={langCode} className="bg-white rounded-[2.5rem] p-8 border-2 border-gray-200 shadow-sm">
                  <div className="flex items-center gap-4 mb-6 border-b-2 border-gray-50 pb-4">
                    <span className="text-4xl">{langInfo?.emoji || "🌍"}</span>
                    <h2 className="text-2xl font-black text-gray-900">{langInfo?.name}</h2>
                    <span className="ml-auto bg-blue-50 text-blue-600 text-xs font-black px-3 py-1 rounded-full">{words.length} items</span>
                  </div>

                  <div className="divide-y-2 divide-gray-100">
                    {words.map((vocab: any) => (
                      <Link href={`/word/${vocab.id}`} key={vocab.id} className="py-5 hover:bg-gray-50 flex items-center justify-between group px-4 -mx-4 rounded-2xl transition-all">
                        <div className="flex items-center gap-6">
                          <span className={`w-3 h-3 rounded-full ${vocab.is_remembered ? "bg-green-400" : "bg-orange-400"}`}></span>
                          <div>
                            <p className="text-xl font-black text-gray-900 group-hover:text-blue-600 transition-colors">{vocab.word}</p>
                            <p className="text-sm font-medium text-gray-500">{vocab.translation}</p>
                          </div>
                        </div>
                        <span className="text-2xl">{vocab.is_remembered ? "✅" : "🔥"}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-[3rem] p-16 border-2 border-gray-200 text-center shadow-sm">
            <div className="text-7xl mb-6 opacity-30">📚</div>
            <h2 className="text-2xl font-black text-gray-400">Nothing here yet.</h2>
            <Link href="/" className="mt-6 inline-block bg-blue-600 text-white font-black px-8 py-4 rounded-2xl hover:bg-blue-700 transition-all">Start Learning</Link>
          </div>
        )}
      </main>
    </div>
  );
}