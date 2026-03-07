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
      {isOpen && <div className="fixed inset-0 z-[60] bg-slate-950/10 backdrop-blur-[1px]" onClick={onClose} />}
      <div
        className={`fixed right-4 top-20 z-[70] w-[min(22rem,calc(100vw-2rem))] rounded-[1.6rem] border border-slate-200/80 bg-white/96 shadow-[0_28px_72px_-38px_rgba(15,23,42,0.28)] backdrop-blur-xl transition-all duration-200 ease-out sm:right-6 sm:top-24 ${
          isOpen ? "translate-y-0 scale-100 opacity-100" : "pointer-events-none -translate-y-2 scale-95 opacity-0"
        }`}
      >
        <div className="p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Settings</p>
              <h2 className="mt-2 text-lg font-semibold tracking-tight text-slate-950">Utilities and account</h2>
            </div>
            <button
              onClick={onClose}
              aria-label="Close settings"
              className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-2 text-slate-400 transition-colors hover:text-slate-700"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>

          <div className="mt-4 divide-y divide-slate-100">
            <Link
              href="/history"
              onClick={onClose}
              className="flex items-center justify-between px-1 py-3 transition-colors hover:text-blue-600"
            >
              <div>
                <p className="text-sm font-semibold text-slate-950">History</p>
                <p className="mt-1 text-xs text-slate-500">Review activity and your study rhythm.</p>
              </div>
              <span className="text-sm font-medium text-slate-400">Open</span>
            </Link>
            <Link
              href="/manage"
              onClick={onClose}
              className="flex items-center justify-between px-1 py-3 transition-colors hover:text-blue-600"
            >
              <div>
                <p className="text-sm font-semibold text-slate-950">Library settings</p>
                <p className="mt-1 text-xs text-slate-500">Languages, categories, and manual setup.</p>
              </div>
              <span className="text-sm font-medium text-slate-400">Open</span>
            </Link>
            <Link
              href="/root"
              onClick={onClose}
              className="flex items-center justify-between px-1 py-3 transition-colors hover:text-blue-600"
            >
              <div>
                <p className="text-sm font-semibold text-slate-950">Roots</p>
                <p className="mt-1 text-xs text-slate-500">Browse etymology and related origins.</p>
              </div>
              <span className="text-sm font-medium text-slate-400">Open</span>
            </Link>
          </div>

          <div className="mt-4 border-t border-slate-100 pt-4">
            <button
              onClick={onSignOut}
              disabled={isSigningOut}
              className="flex w-full items-center justify-between px-1 py-1 text-left transition-all hover:text-red-600 disabled:opacity-50"
            >
              <div>
                <p className="text-sm font-semibold text-slate-950">{isSigningOut ? "Signing out..." : "Sign out"}</p>
                <p className="mt-1 text-xs text-slate-500">End the current session on this device.</p>
              </div>
              <span className="text-sm font-medium text-slate-400">Leave</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
