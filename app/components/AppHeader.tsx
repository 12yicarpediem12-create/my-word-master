"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

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
    <header className="sticky top-0 z-50 bg-white border-b-2 border-gray-200 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
        <Link href="/" className="text-2xl sm:text-3xl font-black tracking-tighter text-blue-600 hover:opacity-80 transition-opacity shrink-0">
          WordMaster.
        </Link>

        <div className="flex items-center gap-3 shrink-0">{utility}</div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-4">
        <nav className="flex items-center gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {PRIMARY_LINKS.map((link) => {
            const isActive = activePrimary === link.key;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2.5 rounded-2xl text-sm font-black whitespace-nowrap transition-all border ${
                  isActive
                    ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                    : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {(searchSlot || secondaryLinks.length > 0 || backHref) && (
          <div className="mt-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {searchSlot ? <div className="w-full lg:max-w-2xl">{searchSlot}</div> : <div />}

            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
              {secondaryLinks.length > 0 && (
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-300">More</span>
                  {secondaryLinks.map((link) => {
                    const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={`text-[10px] font-black uppercase tracking-widest transition-colors ${
                          isActive ? "text-gray-900" : "text-gray-400 hover:text-blue-600"
                        }`}
                      >
                        {link.label}
                      </Link>
                    );
                  })}
                </div>
              )}

              {backHref && (
                <Link
                  href={backHref}
                  className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-gray-500 hover:text-blue-600 transition-colors"
                >
                  ← {backLabel}
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
