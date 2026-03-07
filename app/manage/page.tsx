"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import CreateCardForm from "../components/CreateCardForm";
import AppHeader from "../components/AppHeader";
import { AppMain, AppShell, PageIntro, Surface } from "../components/layout/AppShell";
import { getSupabaseBrowserClient } from "../lib/supabase-browser";

const supabase = getSupabaseBrowserClient();

const LANGUAGE_AUTO_MAP: Record<string, { code: string; emoji: string }> = {
  english: { code: "en", emoji: "🇺🇸" }, spanish: { code: "es", emoji: "🇪🇸" },
  french: { code: "fr", emoji: "🇫🇷" }, german: { code: "de", emoji: "🇩🇪" },
  japanese: { code: "ja", emoji: "🇯🇵" }, korean: { code: "ko", emoji: "🇰🇷" },
  chinese: { code: "zh", emoji: "🇨🇳" }, italian: { code: "it", emoji: "🇮🇹" },
  portuguese: { code: "pt", emoji: "🇵🇹" }, russian: { code: "ru", emoji: "🇷🇺" },
  arabic: { code: "ar", emoji: "🇸🇦" }, hindi: { code: "hi", emoji: "🇮🇳" },
  turkish: { code: "tr", emoji: "🇹🇷" }, dutch: { code: "nl", emoji: "🇳🇱" },
  polish: { code: "pl", emoji: "🇵🇱" }, vietnamese: { code: "vi", emoji: "🇻🇳" },
  thai: { code: "th", emoji: "🇹🇭" }, indonesian: { code: "id", emoji: "🇮🇩" },
  swedish: { code: "sv", emoji: "🇸🇪" }, danish: { code: "da", emoji: "🇩🇰" },
  finnish: { code: "fi", emoji: "🇫🇮" }, greek: { code: "el", emoji: "🇬🇷" },
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
    <AppShell className="pb-24">
      <AppHeader primarySection={null} backHref="/" backLabel="Dashboard" />

      <AppMain width="lg" className="section-stack">
        <PageIntro
          eyebrow="Manage"
          title="Maintain your study system"
          description="Use this page for setup and maintenance: add words manually, bulk import, or add a new language. It supports the main study flow rather than replacing it."
        />

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.18fr)_minmax(18rem,0.82fr)] xl:items-start">
          <section className="space-y-6">
            <div>
              <p className="mb-3 support-label">Manual entry</p>
              <CreateCardForm />
            </div>
          </section>

          <aside className="space-y-6">
            <Surface tone="muted" className="rounded-[1.65rem] p-6">
              <p className="support-label">Bulk import</p>
              <h2 className="mt-3 text-[1.65rem] font-semibold tracking-tight text-slate-950">Import larger batches</h2>
              <p className="mt-2 support-copy">
                Use the import wizard when you want AI-assisted structure, duplicate checks, and review before saving.
              </p>
              <Link
                href="/import"
                className="mt-6 flex items-center justify-between rounded-[1.5rem] border border-purple-100 bg-purple-50/60 px-5 py-5 transition-all hover:border-purple-300 hover:bg-purple-50/80"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-[1.25rem] bg-white/90 text-2xl shadow-sm">🪄</div>
                  <div>
                    <p className="support-label text-purple-400">AI-assisted</p>
                    <p className="mt-1 font-semibold text-purple-900">Bulk import CSV</p>
                  </div>
                </div>
                <span className="text-xl font-medium text-purple-300">→</span>
              </Link>
            </Surface>

            <Surface tone="muted" className="rounded-[1.65rem] p-6">
              <p className="support-label">Languages</p>
              <h2 className="mt-3 text-[1.65rem] font-semibold tracking-tight text-slate-950">Add a language</h2>
              <p className="mt-2 support-copy">
                Add a language once, then it becomes available across study, import, search, and the library.
              </p>

              <form onSubmit={handleAddLanguage} className="mt-6 space-y-4">
                <input
                  type="text"
                  placeholder="Type a language, for example French"
                  value={langInput}
                  onChange={(e) => setLangInput(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 font-medium text-slate-950 outline-none transition-all placeholder:text-slate-300 focus:border-green-400"
                  required
                />

                <button
                  type="submit"
                  disabled={isSubmittingLang}
                  className="w-full rounded-2xl bg-green-500 px-6 py-4 font-semibold text-white transition-all hover:bg-green-600 disabled:opacity-50"
                >
                  {isSubmittingLang ? "Adding..." : langSuccessMsg || "Add language"}
                </button>

                <p className="text-xs text-slate-400">
                  Flags and codes are added automatically.
                </p>
              </form>
            </Surface>
          </aside>
        </div>
      </AppMain>
    </AppShell>
  );
}
