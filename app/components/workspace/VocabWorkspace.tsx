"use client";

import type { ReactNode } from "react";

function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

const PANEL_TONE_CLASS = {
  card: "surface-card",
  muted: "surface-muted",
  open: "",
} as const;

export function WorkspacePanel({
  children,
  tone = "card",
  className,
}: {
  children: ReactNode;
  tone?: keyof typeof PANEL_TONE_CLASS;
  className?: string;
}) {
  return <section className={cn(PANEL_TONE_CLASS[tone], tone === "open" && "section-open", className)}>{children}</section>;
}

export function WorkspaceHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between", className)}>
      <div className="min-w-0">
        {eyebrow && <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{eyebrow}</p>}
        <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950">{title}</h2>
        {description && <p className="mt-2 text-sm font-medium leading-relaxed text-slate-600">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3 lg:justify-end">{actions}</div>}
    </div>
  );
}

export function WorkspaceFilterGroup({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-3", className)}>
      <p className="ml-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <div className="flex flex-wrap gap-2.5">{children}</div>
    </div>
  );
}

export function WorkspaceUtilityPanel({
  tone = "muted",
  eyebrow,
  title,
  description,
  children,
  className,
}: {
  tone?: "muted" | "open";
  eyebrow?: string;
  title: string;
  description?: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <aside
      className={cn(
        tone === "muted"
          ? "surface-muted flex flex-col justify-between gap-4 rounded-[1.75rem] p-4 sm:p-5"
          : "flex flex-col justify-between gap-4 border-t border-slate-200/80 pt-4 sm:pt-5 xl:border-l xl:border-t-0 xl:pl-6 xl:pt-0",
        className
      )}
    >
      <div>
        {eyebrow && <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{eyebrow}</p>}
        <h3 className="mt-2 text-base font-black tracking-tight text-slate-950">{title}</h3>
        {description && <p className="mt-2 text-sm font-medium leading-relaxed text-slate-600">{description}</p>}
      </div>
      {children}
    </aside>
  );
}

export function WorkspaceChipButton({
  active,
  onClick,
  children,
  activeClass = "bg-blue-600 text-white border-blue-600 shadow-[0_14px_28px_-20px_rgba(37,99,235,0.75)]",
  inactiveClass = "bg-white text-slate-600 border-slate-200 hover:border-blue-200 hover:text-blue-600",
  className,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  activeClass?: string;
  inactiveClass?: string;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-2xl border px-5 py-3 text-sm font-bold transition-all",
        active ? activeClass : inactiveClass,
        className
      )}
    >
      {children}
    </button>
  );
}

export function WorkspaceEmptyState({
  icon,
  title,
  description,
  className,
}: {
  icon: string;
  title: string;
  description: string;
  className?: string;
}) {
  return (
    <WorkspacePanel tone="muted" className={cn("rounded-[2.25rem] p-10 text-center sm:p-12", className)}>
      <div className="mb-6 text-5xl opacity-50 sm:text-6xl">{icon}</div>
      <h3 className="text-xl font-black text-slate-950 sm:text-2xl">{title}</h3>
      <p className="mt-2 text-sm font-medium text-slate-600 sm:text-base">{description}</p>
    </WorkspacePanel>
  );
}

export function WorkspaceSelectionBar({
  selectedCount,
  itemLabel = "words",
  isBusy,
  busyLabel,
  actionLabel,
  onAction,
}: {
  selectedCount: number;
  itemLabel?: string;
  isBusy: boolean;
  busyLabel: string;
  actionLabel: string;
  onAction: () => void;
}) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-10 left-1/2 z-50 flex -translate-x-1/2 items-center gap-6 rounded-[2.5rem] border border-slate-700 bg-slate-950/95 px-6 py-5 text-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] backdrop-blur-md animate-in slide-in-from-bottom-20 duration-500 sm:gap-10 sm:px-10">
      <div className="flex flex-col">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Selected</span>
        <span className="text-xl font-black tracking-tight sm:text-2xl">
          {selectedCount} <span className="text-base font-bold text-slate-400">{itemLabel}</span>
        </span>
      </div>

      <div className="h-10 w-px bg-slate-700"></div>

      <button
        onClick={onAction}
        disabled={isBusy}
        className="flex items-center gap-2 rounded-2xl bg-red-500 px-6 py-3 font-black text-white shadow-lg shadow-red-500/30 transition-all hover:bg-red-600 disabled:opacity-50 sm:px-8"
      >
        {isBusy ? busyLabel : actionLabel}
      </button>
    </div>
  );
}
