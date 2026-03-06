"use client";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function RootIndexPage() {
  const router = useRouter();
  const [vocab, setVocab] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function fetchRoots() {
      const { data } = await supabase
        .from("vocab")
        .select("id, word, language_code, root_word, translation")
        .not("root_word", "is", null);

      if (data) setVocab(data);
      setIsLoading(false);
    }
    fetchRoots();
  }, []);

  const rootGroups = useMemo(() => {
    const groups: Record<string, { count: number; langs: Set<string>; words: string[] }> = {};
    vocab.forEach((v) => {
      if (!v.root_word || v.root_word.trim() === "") return; 
      
      if (!groups[v.root_word]) {
        groups[v.root_word] = { count: 0, langs: new Set(), words: [] };
      }
      groups[v.root_word].count += 1;
      groups[v.root_word].langs.add(v.language_code);
      
      groups[v.root_word].words.push(v.word.toLowerCase());
      if (v.translation) groups[v.root_word].words.push(v.translation.toLowerCase());
    });
    
    return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]));
  }, [vocab]);

  const filteredRoots = useMemo(() => {
    if (!searchQuery.trim()) return rootGroups;
    
    const query = searchQuery.toLowerCase().trim();
    
    return rootGroups.filter(([root, info]) => {
      const matchRoot = root.toLowerCase().includes(query);
      const matchWords = info.words.some(w => w.includes(query));
      return matchRoot || matchWords;
    });
  }, [rootGroups, searchQuery]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans pb-20">
      <nav className="bg-white border-b-2 border-gray-200 px-6 py-5 flex justify-between items-center sticky top-0 z-50 shadow-sm">
        <Link href="/" className="text-2xl font-black text-blue-600 tracking-tighter">WordMaster.</Link>
        <button onClick={() => router.back()} className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-blue-600 transition-colors">
          ← Back
        </button>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <header className="mb-10 text-center sm:text-left">
          <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-3 flex items-center justify-center sm:justify-start gap-2">
            <span>🌱</span> Etymology Hub
          </p>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-gray-900">Origins Library</h1>
          <p className="text-sm font-bold text-gray-400 mt-4">Discover the historical connections between your words.</p>
        </header>

        <div className="mb-10 relative">
          <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by root word, vocab, or meaning..."
            className="w-full bg-white border-2 border-gray-200 text-gray-900 text-lg font-bold rounded-[2rem] pl-14 pr-6 py-5 outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-50 transition-all shadow-sm placeholder-gray-300"
          />
        </div>

        {isLoading ? (
          <div className="text-center py-20 font-bold text-gray-300 animate-pulse uppercase tracking-widest">
            Loading Origins...
          </div>
        ) : filteredRoots.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRoots.map(([root, info]) => (
              <Link 
                href={`/root/${encodeURIComponent(root).replace(/\*/g, '%2A').replace(/\(/g, '%28').replace(/\)/g, '%29')}`} 
                key={root}
                className="bg-white rounded-[2rem] p-8 border-2 border-rose-100 hover:border-rose-400 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between min-h-[160px]"
              >
                <div>
                  <h2 className="text-xl font-bold text-gray-900 group-hover:text-rose-600 transition-colors line-clamp-2 leading-tight">
                    {root}
                  </h2>
                </div>
                <div className="mt-6 flex items-end justify-between">
                  <div className="flex flex-wrap gap-1">
                    {Array.from(info.langs).map(lang => (
                      <span key={lang} className="text-[8px] font-black bg-gray-100 text-gray-500 px-2 py-0.5 rounded-md uppercase">
                        {lang}
                      </span>
                    ))}
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-rose-500 leading-none">{info.count}</span>
                    <span className="text-[8px] font-bold text-rose-300 uppercase block mt-1">Words</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-[2.5rem] p-16 border-2 border-gray-200 shadow-sm text-center">
            <div className="text-6xl mb-6 opacity-50">🧭</div>
            <h2 className="text-2xl font-black text-gray-900 mb-2">No matches found</h2>
            <p className="text-gray-500 font-medium text-sm">We couldn't find any roots or words matching "{searchQuery}"</p>
          </div>
        )}
      </main>
    </div>
  );
}