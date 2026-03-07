"use client";

import type { ElementType, ReactNode } from "react";

type FrameWidth = "sm" | "md" | "lg" | "xl";
type SurfaceTone = "card" | "hero" | "muted";
type IntroAlign = "left" | "center";

const FRAME_WIDTH_CLASS: Record<FrameWidth, string> = {
  sm: "page-frame-sm",
  md: "page-frame-md",
  lg: "page-frame-lg",
  xl: "page-frame-xl",
};

const SURFACE_CLASS: Record<SurfaceTone, string> = {
  card: "surface-card",
  hero: "surface-hero",
  muted: "surface-muted",
};

function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function AppShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("app-shell", className)}>{children}</div>;
}

export function PageFrame<T extends ElementType = "div">({
  as,
  width = "lg",
  className,
  children,
}: {
  as?: T;
  width?: FrameWidth;
  className?: string;
  children: ReactNode;
}) {
  const Component = (as || "div") as ElementType;
  return <Component className={cn("page-frame", FRAME_WIDTH_CLASS[width], className)}>{children}</Component>;
}

export function AppMain({
  children,
  width = "lg",
  className,
}: {
  children: ReactNode;
  width?: FrameWidth;
  className?: string;
}) {
  return (
    <PageFrame as="main" width={width} className={cn("page-stack", className)}>
      {children}
    </PageFrame>
  );
}

export function PageIntro({
  eyebrow,
  title,
  description,
  actions,
  align = "left",
  framed = false,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  align?: IntroAlign;
  framed?: boolean;
  className?: string;
}) {
  return (
    <section
      className={cn(
        framed && "page-intro-frame",
        framed && "page-intro-framed",
        "page-intro",
        align === "center" && "page-intro-center",
        Boolean(actions) && "page-intro-with-actions",
        className
      )}
    >
      <div className="min-w-0">
        {eyebrow && <p className="page-eyebrow">{eyebrow}</p>}
        <h1 className="page-title">{title}</h1>
        {description && <p className="page-subtitle">{description}</p>}
      </div>
      {actions && <div className="page-intro-actions">{actions}</div>}
    </section>
  );
}

export function Surface<T extends ElementType = "section">({
  as,
  tone = "card",
  className,
  children,
}: {
  as?: T;
  tone?: SurfaceTone;
  className?: string;
  children: ReactNode;
}) {
  const Component = (as || "section") as ElementType;
  return <Component className={cn(SURFACE_CLASS[tone], className)}>{children}</Component>;
}
