"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { PageFrame } from "./layout/AppShell";

type PrimarySection = "dashboard" | "study" | "library" | "import" | null;

type AppHeaderProps = {
  primarySection?: PrimarySection;
  searchSlot?: ReactNode;
  utility?: ReactNode;
  backHref?: string;
  backLabel?: string;
  secondaryLinks?: { href: string; label: string }[];
};

const PRIMARY_LINKS: { href: string; label: string; key: Exclude<PrimarySection, null> }[] = [
  { href: "/", label: "Dashboard", key: "dashboard" },
  { href: "/study", label: "Study", key: "study" },
  { href: "/library", label: "Library", key: "library" },
  { href: "/import", label: "Import", key: "import" },
];

const DEFAULT_SECONDARY_LINKS = [
  { href: "/history", label: "History" },
  { href: "/manage", label: "Manage" },
  { href: "/root", label: "Roots" },
];

function inferPrimarySection(pathname: string): PrimarySection {
  if (pathname === "/") return "dashboard";
  if (pathname.startsWith("/study") || pathname.startsWith("/history")) return "study";
  if (pathname.startsWith("/library") || pathname.startsWith("/word") || pathname.startsWith("/search")) return "library";
  if (pathname.startsWith("/import")) return "import";
  return null;
}

export default function AppHeader({
  primarySection,
  searchSlot,
  utility,
  backHref,
  backLabel = "Back",
  secondaryLinks = DEFAULT_SECONDARY_LINKS,
}: AppHeaderProps) {
  const pathname = usePathname();
  const activePrimary = primarySection ?? inferPrimarySection(pathname);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-[rgba(248,251,255,0.78)] backdrop-blur-xl">
      <PageFrame as="div" width="xl">
        <div className="py-4 sm:py-5">
          <div className="flex items-center justify-between gap-4">
            <Link href="/" className="shrink-0 text-[1.75rem] sm:text-[2rem] font-black tracking-[-0.08em] text-slate-950 hover:opacity-80 transition-opacity">
              WordMaster<span className="text-blue-600">.</span>
            </Link>

            <div className="flex items-center gap-4 shrink-0">
              {secondaryLinks.length > 0 && (
                <div className="hidden lg:flex items-center gap-3">
                  {secondaryLinks.map((link) => {
                    const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={`text-[11px] font-black uppercase tracking-[0.18em] transition-colors ${
                          isActive ? "text-slate-900" : "text-slate-400 hover:text-blue-600"
                        }`}
                      >
                        {link.label}
                      </Link>
                    );
                  })}
                </div>
              )}

              <div className="flex items-center gap-3">{utility}</div>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-4 border-t border-slate-200/70 pt-4 sm:mt-5 sm:pt-5">
            <nav className="flex items-center gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {PRIMARY_LINKS.map((link) => {
                const isActive = activePrimary === link.key;

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-4 py-2.5 rounded-2xl text-sm font-black whitespace-nowrap transition-all border ${
                      isActive
                        ? "bg-blue-600 text-white border-blue-600 shadow-[0_14px_30px_-20px_rgba(37,99,235,0.8)]"
                        : "bg-white/80 text-slate-600 border-slate-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            {(searchSlot || backHref) && (
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                {searchSlot ? <div className="w-full lg:max-w-2xl">{searchSlot}</div> : <div />}

                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
                  {backHref && (
                    <Link
                      href={backHref}
                      className="text-[10px] sm:text-xs font-black uppercase tracking-[0.18em] text-slate-500 hover:text-blue-600 transition-colors"
                    >
                      ← {backLabel}
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </PageFrame>
    </header>
  );
}
