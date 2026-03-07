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
};

const PRIMARY_LINKS: { href: string; label: string; key: Exclude<PrimarySection, null> }[] = [
  { href: "/", label: "Dashboard", key: "dashboard" },
  { href: "/study", label: "Study", key: "study" },
  { href: "/library", label: "Library", key: "library" },
  { href: "/import", label: "Import", key: "import" },
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
}: AppHeaderProps) {
  const pathname = usePathname();
  const activePrimary = primarySection ?? inferPrimarySection(pathname);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/60 bg-[rgba(248,251,255,0.66)] backdrop-blur-xl">
      <PageFrame as="div" width="xl">
        <div className="py-3 sm:py-4">
          <div className="flex items-center justify-between gap-4">
            <Link href="/" className="font-display shrink-0 text-[1.85rem] sm:text-[2.1rem] font-semibold tracking-[-0.06em] text-slate-950 hover:opacity-80 transition-opacity">
              WordMaster<span className="text-blue-600">.</span>
            </Link>

            <div className="flex items-center gap-3 shrink-0">{utility}</div>
          </div>

          <div className="mt-3 flex flex-col gap-3 border-t border-slate-200/55 pt-3 sm:mt-4 sm:pt-4">
            <nav className="flex items-center gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {PRIMARY_LINKS.map((link) => {
                const isActive = activePrimary === link.key;

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`rounded-full border px-4 py-2 text-[13px] font-semibold whitespace-nowrap transition-all ${
                      isActive
                        ? "border-blue-600/90 bg-blue-600 text-white shadow-[0_14px_28px_-22px_rgba(37,99,235,0.68)]"
                        : "border-slate-200/80 bg-white/55 text-slate-600 hover:border-blue-200 hover:bg-white hover:text-blue-600"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            {(searchSlot || backHref) && (
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                {searchSlot ? <div className="w-full lg:max-w-2xl">{searchSlot}</div> : <div className="h-0" />}

                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
                  {backHref && (
                    <Link
                      href={backHref}
                      className="text-xs font-semibold tracking-[0.08em] text-slate-500 hover:text-blue-600 transition-colors"
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
