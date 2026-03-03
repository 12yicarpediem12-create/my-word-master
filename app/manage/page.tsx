"use client";
import Link from "next/link";
import { useState, useEffect } from "react"; // 🌟 useEffectを追加
import { createClient } from "@supabase/supabase-js";
import CreateCardForm from "../components/CreateCardForm";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// 🌟 魔法の辞書：言語名を入力すると、自動でコードと国旗を判定します！
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

  // 🌟 【追加】この画面（Manage Library）が開かれた瞬間に、
  // ホーム画面のサイドバーが残した「スクロール禁止」を強制的に解除（unset）する魔法！
  useEffect(() => {
    document.body.style.overflow = "unset";
  }, []);

  const handleAddLanguage = async (e: React.FormEvent) => {
    e.preventDefault();
    const input = langInput.trim();
    if (!input) return;
    
    setIsSubmittingLang(true);

    // 入力された文字を小文字にして辞書と照らし合わせる
    const lowerInput = input.toLowerCase();
    
    // 辞書にあればそれを使用、なければ自動生成（最初の2文字 ＋ 地球の絵文字）
    const matchedData = LANGUAGE_AUTO_MAP[lowerInput];
    const finalCode = matchedData ? matchedData.code : lowerInput.substring(0, 2);
    const finalEmoji = matchedData ? matchedData.emoji : "🌐";
    
    // 表示用の名前（先頭だけ大文字にする。例: "french" -> "French"）
    const finalName = input.charAt(0).toUpperCase() + input.slice(1).toLowerCase();

    const { error } = await supabase.from("languages").insert([
      {
        code: finalCode,
        name: finalName,
        emoji: finalEmoji,
      },
    ]);

    setIsSubmittingLang(false);

    if (!error) {
      setLangSuccessMsg(`${finalEmoji} ${finalName} added automatically!`);
      setLangInput("");
      setTimeout(() => setLangSuccessMsg(""), 3000);
    } else {
      alert("Error adding language: " + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans pb-20">
      {/* ナビゲーションバー */}
      <nav className="bg-white border-b-2 border-gray-200 px-8 py-5 flex justify-between items-center sticky top-0 z-50 shadow-sm">
        <Link href="/" className="text-3xl font-black tracking-tighter text-blue-600 hover:opacity-80 transition-opacity">
          WordMaster.
        </Link>
        <Link href="/" className="text-sm font-bold text-gray-500 hover:text-blue-600 transition-colors uppercase tracking-widest flex items-center gap-2">
          <span>←</span> Back to Dashboard
        </Link>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-12 flex flex-col gap-12">
        <header className="mb-4">
          <h1 className="text-5xl font-black text-gray-900 tracking-tight mb-4 text-center md:text-left">Manage Library</h1>
          <p className="text-xl text-gray-600 font-medium italic text-center md:text-left">
            Expand your horizons. Add new words and languages.
          </p>
        </header>

        {/* 1. 一番上：単語の追加（部品の呼び出し） */}
        <section>
          <CreateCardForm />
        </section>

        {/* 2. その下：スマート言語追加フォーム */}
        <section>
          <div className="bg-white rounded-3xl p-8 border-2 border-gray-200 shadow-sm w-full transition-all hover:shadow-md">
            <h2 className="text-sm font-bold tracking-widest text-gray-900 uppercase mb-8 flex items-center gap-3">
              <span className="text-xl">🌍</span> QUICK ADD LANGUAGE
            </h2>

            <form onSubmit={handleAddLanguage} className="space-y-6">
              <div className="flex flex-col md:flex-row gap-6">
                <input
                  type="text"
                  placeholder="Type a language (e.g. French, Japanese...)"
                  value={langInput}
                  onChange={(e) => setLangInput(e.target.value)}
                  className="w-full md:flex-1 p-5 bg-gray-50 border-2 border-gray-200 rounded-2xl font-bold text-gray-900 placeholder-gray-400 outline-none focus:border-green-500 transition-colors text-lg"
                  required
                />
                
                <button
                  type="submit"
                  disabled={isSubmittingLang}
                  className="w-full md:w-auto px-10 py-5 bg-green-500 text-white font-bold text-lg rounded-2xl shadow-lg hover:bg-green-600 hover:scale-[1.01] transition-all disabled:opacity-50 whitespace-nowrap"
                >
                  {isSubmittingLang ? "Adding..." : langSuccessMsg || "+ Add Language"}
                </button>
              </div>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-4">
                ✨ Flags and codes will be added automatically.
              </p>
            </form>
          </div>
        </section>

      </main>
    </div>
  );
}