"use client";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import SearchBar from "../components/SearchBar";
import type { Language, VocabItem } from "@/app/lib/types";

type ViewRange = "7days" | "30days" | "month";

type HistoryCardProps = {
  vocab: VocabItem;
  langInfo?: Language;
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const TabButton = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
  <button
    onClick={onClick}
    className={`px-5 py-2 rounded-xl text-xs font-black uppercase transition-all ${active ? "bg-white text-blue-600 shadow-sm" : "text-gray-400"}`}
  >
    {children}
  </button>
);

const DateDivider = ({ date }: { date: string }) => (
  <div className="flex items-center gap-4 mb-6">
    <h3 className="font-black text-gray-400 uppercase text-xs tracking-[0.2em] whitespace-nowrap">{date}</h3>
    <div className="h-px bg-gray-200 w-full"></div>
  </div>
);

const HistoryCard = ({ vocab, langInfo }: HistoryCardProps) => (
  <Link href={`/word/${vocab.id}`} className="bg-white border-2 border-gray-100 p-5 rounded-[2rem] hover:border-blue-500 hover:shadow-xl transition-all flex items-center justify-between group">
    <div className="flex items-center gap-4">
      <span className="text-2xl">{langInfo?.emoji}</span>
      <div>
        <p className="font-black text-gray-900 group-hover:text-blue-600 transition-colors">{vocab.word}</p>
        <p className="text-xs text-gray-400 font-bold">{vocab.translation}</p>
      </div>
    </div>
    <span className="text-2xl">{vocab.is_remembered ? "✅" : "🔥"}</span>
  </Link>
);

export default function HistoryPage() {
  const router = useRouter();
  const [results, setResults] = useState<VocabItem[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [range, setRange] = useState<ViewRange>("7days");
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLanguages() {
      const { data, error } = await supabase.from("languages").select("*");
      if (error) {
        setErrorMsg(error.message);
        return;
      }
      setLanguages((data || []) as Language[]);
    }
    fetchLanguages();
  }, []);

  useEffect(() => {
    async function fetchHistory() {
      setIsLoading(true);
      setErrorMsg(null);
      let query = supabase
        .from("vocab")
        .select("id, language_code, word, translation, is_remembered, last_reviewed")
        .not("last_reviewed", "is", null);

      if (range === "month") {
        const startOfMonth = `${selectedMonth}-01T00:00:00Z`;
        const date = new Date(selectedMonth);
        const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59).toISOString();
        query = query.gte("last_reviewed", startOfMonth).lte("last_reviewed", endOfMonth);
      } else {
        const days = range === "7days" ? 7 : 30;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        query = query.gte("last_reviewed", startDate.toISOString());
      }

      const { data: vocabData, error } = await query.order("last_reviewed", { ascending: false });
      if (error) {
        setErrorMsg(error.message);
        setResults([]);
      } else {
        setResults((vocabData || []) as VocabItem[]);
      }
      setIsLoading(false);
    }
    fetchHistory();
  }, [range, selectedMonth]);

  const groupedByDate = useMemo(() => {
    return results.reduce((acc: Record<string, VocabItem[]>, vocab) => {
      const date = new Date(vocab.last_reviewed || "").toLocaleDateString("ja-JP", {
        month: "short",
        day: "numeric",
        weekday: "short",
      });
      if (!acc[date]) acc[date] = [];
      acc[date].push(vocab);
      return acc;
    }, {});
  }, [results]);

  const stats = useMemo(() => {
    const total = results.length;
    const mastered = results.filter((v) => v.is_remembered).length;
    return { total, mastered, rate: total === 0 ? 0 : Math.round((mastered / total) * 100) };
  }, [results]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans pb-20">
      <nav className="bg-white border-b-2 border-gray-200 px-6 py-4 flex flex-col md:flex-row justify-between items-center sticky top-0 z-50 shadow-sm gap-4">
        <Link href="/" className="text-3xl font-black tracking-tighter text-blue-600">
          WordMaster.
        </Link>
        <div className="w-full md:flex-1 md:max-w-2xl md:mx-8">
          <SearchBar />
        </div>
        <button onClick={() => router.back()} className="text-sm font-bold text-gray-500 hover:text-blue-600 uppercase tracking-widest flex items-center gap-2">
          <span>←</span> Dashboard
        </button>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <header className="mb-10">
          <h1 className="text-5xl font-black tracking-tight mb-4">Learning History</h1>
          <div className="flex flex-wrap items-center gap-4 bg-white p-2 rounded-3xl border-2 border-gray-100 shadow-sm">
            <div className="flex bg-gray-100 p-1 rounded-2xl">
              <TabButton active={range === "7days"} onClick={() => setRange("7days")}>7 Days</TabButton>
              <TabButton active={range === "30days"} onClick={() => setRange("30days")}>30 Days</TabButton>
              <TabButton active={range === "month"} onClick={() => setRange("month")}>Archive</TabButton>
            </div>

            {range === "month" && (
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-gray-50 border-2 border-gray-100 px-4 py-2 rounded-xl font-bold text-sm text-blue-600 outline-none"
              />
            )}

            <div className="ml-auto pr-4 hidden sm:block">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Mastery Rate: </span>
              <span className="text-sm font-black text-green-500">{stats.rate}%</span>
            </div>
          </div>
        </header>

        {errorMsg && <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 text-red-600 font-bold rounded-2xl">{errorMsg}</div>}

        {isLoading ? (
          <div className="text-center py-20 font-bold text-gray-400 animate-pulse tracking-widest uppercase">Fetching Records...</div>
        ) : Object.keys(groupedByDate).length > 0 ? (
          <div className="space-y-12">
            {Object.keys(groupedByDate).map((date) => (
              <div key={date}>
                <DateDivider date={date} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {groupedByDate[date].map((vocab) => (
                    <HistoryCard key={vocab.id} vocab={vocab} langInfo={languages.find((l) => l.code === vocab.language_code)} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-[3rem] p-20 border-2 border-gray-200 text-center">
            <div className="text-6xl mb-6">🏜️</div>
            <h2 className="text-2xl font-black text-gray-300 uppercase">No Activity Found</h2>
            <p className="text-gray-400 mt-2 font-medium">Try selecting a different period.</p>
          </div>
        )}
      </main>
    </div>
  );
}
