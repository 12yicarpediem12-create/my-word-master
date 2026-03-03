"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import CreateCardForm from "../components/CreateCardForm";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const LANGUAGE_AUTO_MAP: Record<string, { code: string; emoji: string }> = {
  english: { code: "en", emoji: "🇺🇸" },
  spanish: { code: "es", emoji: "🇪🇸" },
  french: { code: "fr", emoji: "🇫🇷" },
  german: { code: "de", emoji: "🇩🇪" },
  japanese: { code: "ja", emoji: "🇯🇵" },
  korean: { code: "ko", emoji: "🇰🇷" },
  chinese: { code: "zh", emoji: "🇨🇳" },
  italian: { code: "it", emoji: "🇮🇹" },
  portuguese: { code: "pt", emoji: "🇵🇹" },
  russian: { code: "ru", emoji: "🇷🇺" },
  arabic: { code: "ar", emoji: "🇸🇦" },
  hindi: { code: "hi", emoji: "🇮🇳" },
  turkish: { code: "tr", emoji: "🇹🇷" },
  dutch: { code: "nl", emoji: "🇳🇱" },
  polish: { code: "pl", emoji: "🇵🇱" },
  vietnamese: { code: "vi", emoji: "🇻🇳" },
  thai: { code: "th", emoji: "🇹🇭" },
  indonesian: { code: "id", emoji: "🇮🇩" },
  swedish: { code: "sv", emoji: "🇸🇪" },
  danish: { code: "da", emoji: "🇩🇰" },
  finnish: { code: "fi", emoji: "🇫🇮" },
  greek: { code: "el", emoji: "🇬🇷" },
};

export default function ManageLibrary() {
  const [langInput, setLangInput] = useState("");
  const [isSubmittingLang, setIsSubmittingLang] = useState(false);
  const [langSuccessMsg, setLangSuccessMsg] = useState("");

  useEffect(() => {
    document.body.style.overflow = "unset";
  }, []);

  const handleAddLanguage = async (e: React.FormEvent) => {
    e.preventDefault();
    const input = langInput.trim();
    if (!input) return;
    
    setIsSubmittingLang(true);
    const lowerInput = input.toLowerCase();
    const matchedData = LANGUAGE_AUTO_MAP[lowerInput];
    const finalCode = matchedData ? matchedData.code : lowerInput.substring(0, 2);
    const finalEmoji = matchedData ? matchedData.emoji : "🌐";
    const finalName = input.charAt(0).toUpperCase() + input.slice(1).toLowerCase();

    const { error } = await supabase.from("languages").insert([
      { code: finalCode, name: finalName, emoji: finalEmoji },
    ]);

    setIsSubmittingLang(false);

    if (!error) {
      setLangSuccessMsg(`${finalEmoji} ${finalName} added!`);
      setLangInput("");
      setTimeout(() => setLangSuccessMsg(""), 3000);
    } else {
      alert("Error adding language: " + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans pb-20">
      {/* ナビゲーションバー */}
      <nav className="bg-white border-b-2 border-gray-200 px-4 md:px-8 py-5 flex justify-between items-center sticky top-0 z-50 shadow-sm">
        <Link href="/" className="text-2xl md:text-3xl font-black tracking-tighter text-blue-600 hover:opacity-80 transition-opacity">
          WordMaster.
        </Link>
        <Link href="/" className="text-[10px] md:text-sm font-bold text-gray-500 hover:text-blue-600 transition-colors uppercase tracking-widest flex items-center gap-2">
          <span>←</span> Back
        </Link>
      </nav>

      {/* 🛠 修正: スマホ用に px-4 / pt-12 を設定。md以上では px-8 / pt-16 に広げる */}
      <main className="max-w-4xl mx-auto px-4 md:px-8 pt-12 md:pt-16 flex flex-col gap-10">
        
        {/* ヘッダーセクション */}
        <header className="flex flex-col gap-2">
          <h1 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tight leading-tight">
            Manage Library
          </h1>
          <p className="text-sm md:text-xl text-gray-500 font-medium italic">
            Expand your horizons. Add new words and languages.
          </p>
        </header>

        {/* 1. 単語追加フォーム (CreateCardForm 内のレスポンシブ対応はこの部品側で行う必要があります) */}
        <section className="w-full">
          <CreateCardForm />
        </section>

        {/* 2. 言語追加フォーム */}
        <section className="w-full">
          <div className="bg-white rounded-3xl p-6 md:p-8 border-2 border-gray-200 shadow-sm transition-all hover:shadow-md">
            <h2 className="text-[10px] md:text-xs font-bold tracking-widest text-gray-400 uppercase mb-6 flex items-center gap-2">
              <span className="text-lg">🌍</span> Quick Add Language
            </h2>

            <form onSubmit={handleAddLanguage} className="space-y-4">
              {/* 🛠 修正: 入力欄とボタンを縦並び(flex-col)にし、タブレット以上で横並び(md:flex-row)にする */}
              <div className="flex flex-col md:flex-row gap-4">
                <input
                  type="text"
                  placeholder="Type a language (e.g. French...)"
                  value={langInput}
                  onChange={(e) => setLangInput(e.target.value)}
                  className="w-full md:flex-1 p-4 md:p-5 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold text-gray-900 placeholder-gray-300 outline-none focus:border-green-400 transition-all text-base md:text-lg"
                  required
                />
                
                <button
                  type="submit"
                  disabled={isSubmittingLang}
                  className="w-full md:w-auto px-8 py-4 md:py-5 bg-green-500 text-white font-black text-sm md:text-lg rounded-2xl shadow-lg shadow-green-100 hover:bg-green-600 hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-50 whitespace-nowrap"
                >
                  {isSubmittingLang ? "Adding..." : langSuccessMsg || "+ Add Language"}
                </button>
              </div>
              <p className="text-[10px] text-gray-300 font-bold uppercase tracking-widest mt-2">
                ✨ Flags and codes will be added automatically.
              </p>
            </form>
          </div>
        </section>

      </main>
    </div>
  );
}