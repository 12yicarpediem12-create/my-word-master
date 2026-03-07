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
      {isOpen && <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[60] transition-opacity" onClick={onClose} />}
      <div
        className={`fixed z-[70] bg-white shadow-2xl transition-transform duration-300 ease-in-out top-0 right-0 h-full w-72 md:left-0 md:w-full md:h-auto md:border-b-2 md:border-gray-200 ${
          isOpen ? "translate-x-0 md:translate-y-0" : "translate-x-full md:translate-x-0 md:-translate-y-full"
        }`}
      >
        <div className="p-8 md:p-6 h-full flex flex-col md:flex-row gap-8 md:gap-12 md:items-center">
          <div className="flex justify-between items-center md:w-auto">
            <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2">
              <span>⚙️</span> Settings
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-red-500 md:hidden">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          <div className="flex-1 flex flex-col md:flex-row gap-4">
            <Link href="/history" className="px-5 py-4 bg-gray-50 hover:bg-blue-50 border-2 border-gray-100 rounded-2xl font-bold transition-all text-center">
              ⏳ Review History
            </Link>
            <Link href="/manage" className="px-5 py-4 bg-gray-50 hover:bg-green-50 border-2 border-gray-100 rounded-2xl font-bold transition-all text-center">
              🌍 Add Language
            </Link>
            <Link href="/root" className="px-5 py-4 bg-gray-50 hover:bg-rose-50 border-2 border-gray-100 rounded-2xl font-bold transition-all text-center">
              🌱 Origins Library
            </Link>
            <button
              onClick={onSignOut}
              disabled={isSigningOut}
              className="px-5 py-4 bg-gray-50 hover:bg-red-50 border-2 border-gray-100 rounded-2xl font-bold transition-all text-center disabled:opacity-50"
            >
              {isSigningOut ? "Signing out..." : "↩ Sign Out"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
