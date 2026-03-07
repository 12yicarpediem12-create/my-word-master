"use client";

import Link from "next/link";

type SettingsPanelProps = {
  isOpen: boolean;
  isSigningOut: boolean;
  onClose: () => void;
  onSignOut: () => void | Promise<void>;
};

export default function SettingsPanel({ isOpen, isSigningOut, onClose, onSignOut }: SettingsPanelProps) {
  return (
    <>
      {isOpen && <div className="fixed inset-0 z-[60] bg-slate-950/8" onClick={onClose} />}
      <div
        className={`fixed right-4 top-20 z-[70] w-[min(22rem,calc(100vw-2rem))] rounded-[1.75rem] border border-slate-200 bg-white/98 shadow-[0_30px_80px_-36px_rgba(15,23,42,0.35)] backdrop-blur-xl transition-all duration-200 ease-out sm:right-6 sm:top-24 ${
          isOpen ? "translate-y-0 scale-100 opacity-100" : "pointer-events-none -translate-y-2 scale-95 opacity-0"
        }`}
      >
        <div className="p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Settings</p>
              <h2 className="mt-2 text-lg font-black tracking-tight text-slate-950">Utilities and account</h2>
            </div>
            <button
              onClick={onClose}
              aria-label="Close settings"
              className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-slate-400 transition-colors hover:text-slate-700"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>

          <div className="mt-4 space-y-2">
            <Link
              href="/history"
              onClick={onClose}
              className="flex items-center justify-between rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-3 transition-all hover:border-blue-200 hover:bg-blue-50/60"
            >
              <div>
                <p className="text-sm font-black text-slate-950">History</p>
                <p className="mt-1 text-xs font-medium text-slate-500">Review past activity and study rhythm.</p>
              </div>
              <span className="text-lg">⏳</span>
            </Link>
            <Link
              href="/manage"
              onClick={onClose}
              className="flex items-center justify-between rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-3 transition-all hover:border-emerald-200 hover:bg-emerald-50/60"
            >
              <div>
                <p className="text-sm font-black text-slate-950">Manage</p>
                <p className="mt-1 text-xs font-medium text-slate-500">Add languages and maintain library setup.</p>
              </div>
              <span className="text-lg">🌍</span>
            </Link>
            <Link
              href="/root"
              onClick={onClose}
              className="flex items-center justify-between rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-3 transition-all hover:border-rose-200 hover:bg-rose-50/60"
            >
              <div>
                <p className="text-sm font-black text-slate-950">Roots</p>
                <p className="mt-1 text-xs font-medium text-slate-500">Browse etymology and related origins.</p>
              </div>
              <span className="text-lg">🌱</span>
            </Link>
          </div>

          <div className="mt-4 border-t border-slate-100 pt-4">
            <button
              onClick={onSignOut}
              disabled={isSigningOut}
              className="flex w-full items-center justify-between rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-3 text-left transition-all hover:border-red-200 hover:bg-red-50/60 disabled:opacity-50"
            >
              <div>
                <p className="text-sm font-black text-slate-950">{isSigningOut ? "Signing out..." : "Sign Out"}</p>
                <p className="mt-1 text-xs font-medium text-slate-500">End the current session on this device.</p>
              </div>
              <span className="text-lg">↩</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
