"use client";
import { useState, useEffect, Suspense, useMemo, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import AppHeader from "@/app/components/AppHeader";
import { getSupabaseBrowserClient } from "@/app/lib/supabase-browser";

const supabase = getSupabaseBrowserClient();

const TopicLink = ({ langCode, topic }: { langCode: string; topic: any }) => (
  <Link 
    href={`/study/${langCode}/topics/${topic.id}`} 
    id={`topic-${topic.id}`}
    className="bg-white border-2 border-gray-100 px-5 py-2.5 rounded-xl text-sm font-bold text-gray-600 hover:border-blue-500 hover:text-blue-600 hover:shadow-md transition-all active:scale-95"
  >
    {topic.name}
  </Link>
);

const SubTopicSection = ({ langCode, subTopic, childrenTopics }: { langCode: string; subTopic: any; childrenTopics: any[] }) => (
  <div id={`topic-${subTopic.id}`} className="animate-in fade-in slide-in-from-top-2 duration-300 p-2">
    <h3 className="text-xs font-black text-blue-400 uppercase tracking-widest mb-4 ml-2 border-l-4 border-blue-200 pl-3">
      {subTopic.name}
    </h3>
    <div className="flex flex-wrap gap-2">
      {childrenTopics.map((ssub) => (
        <TopicLink key={ssub.id} langCode={langCode} topic={ssub} />
      ))}
    </div>
  </div>
);

const MainTopicCard = ({ 
  topic, 
  isExpanded, 
  onToggle, 
  subTopics, 
  getChildren, 
  langCode 
}: { 
  topic: any; 
  isExpanded: boolean; 
  onToggle: () => void; 
  subTopics: any[]; 
  getChildren: (id: number) => any[]; 
  langCode: string 
}) => (
  <div id={`topic-${topic.id}`} className="bg-white border-2 border-gray-200 rounded-[2.5rem] overflow-hidden shadow-sm transition-all hover:shadow-md">
    <button 
      onClick={onToggle}
      className="w-full flex items-center justify-between p-6 sm:p-8 hover:bg-gray-50 transition-colors text-left"
    >
      <div className="flex items-center gap-4 sm:gap-6">
        <span className="text-3xl sm:text-4xl filter drop-shadow-sm">📁</span>
        <h2 className="text-xl sm:text-2xl font-black text-gray-900">{topic.name}</h2>
      </div>
      <span className={`text-xl font-black text-gray-300 transform transition-transform duration-300 ${isExpanded ? "rotate-180 text-blue-500" : ""}`}>
        ↓
      </span>
    </button>

    {isExpanded && (
      <div className="px-6 sm:px-8 pb-10 bg-gray-50/50 border-t-2 border-gray-100">
        <div className="mt-8 space-y-8 sm:space-y-10">
          {subTopics.map((sub) => (
            <SubTopicSection 
              key={sub.id} 
              langCode={langCode} 
              subTopic={sub} 
              childrenTopics={getChildren(sub.id)} 
            />
          ))}
        </div>
      </div>
    )}
  </div>
);

function TopicsContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const langCode = params?.lang as string; 
  
  const openTopicId = searchParams.get("open");

  const [categories, setCategories] = useState<any[]>([]);
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

  useEffect(() => {
    if (openTopicId && !isLoading) {
      setExpandedTopic(openTopicId);
      
      setTimeout(() => {
        const hash = window.location.hash;
        if (hash) {
          const element = document.querySelector(hash);
          if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "center" });
            element.classList.add("bg-blue-50", "rounded-2xl", "transition-colors", "duration-1000");
            setTimeout(() => element.classList.remove("bg-blue-50"), 2000);
          }
        }
      }, 300);
    }
  }, [openTopicId, isLoading]);

  const mainTopics = useMemo(() => categories.filter((c) => c.level === 1), [categories]);
  const getChildren = useCallback((parentId: number) => categories.filter((c) => c.parent_id === parentId), [categories]);

  const hubPath = langCode ? `/study/${langCode}` : "#";

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <AppHeader primarySection="study" backHref={hubPath} backLabel="Study Hub" />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <header className="mb-8 sm:mb-12">
          <h1 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight">Topics</h1>
          <p className="text-gray-500 mt-2 sm:mt-4 font-medium text-base sm:text-lg">Explore your vocabulary by themes.</p>
        </header>

        {isLoading ? (
          <div className="text-center py-20 font-black text-gray-300 animate-pulse uppercase tracking-widest">
            Loading Taxonomy...
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:gap-6">
            {mainTopics.map((topic) => (
              <MainTopicCard 
                key={topic.id}
                topic={topic}
                isExpanded={String(expandedTopic) === String(topic.id)}
                onToggle={() => setExpandedTopic(String(expandedTopic) === String(topic.id) ? null : topic.id)}
                subTopics={getChildren(topic.id)}
                getChildren={getChildren}
                langCode={langCode}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default function LanguageTopicsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center font-bold text-gray-400 tracking-widest uppercase">Loading...</div>}>
      <TopicsContent />
    </Suspense>
  );
}
