"use client";
import React from "react";
import { cn } from "@/lib/brokebro/format";

export function Card({ className, children, glow }: { className?: string; children: React.ReactNode; glow?: boolean }) {
  return (
    <div className={cn("glass rounded-3xl p-4 shadow-card sm:p-5", glow && "glow-border", className)}>
      {children}
    </div>
  );
}

export function Btn({
  children, onClick, variant = "primary", className, type = "button", disabled,
}: {
  children: React.ReactNode; onClick?: () => void; variant?: "primary" | "ghost" | "outline" | "danger";
  className?: string; type?: "button" | "submit"; disabled?: boolean;
}) {
  const base = "pressable inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold transition-all focus-visible:outline-2 disabled:opacity-50";
  const styles = {
    primary: "bg-gradient-to-r from-lime-300 via-lime-200 to-emerald-200 text-black shadow-[0_0_30px_rgba(190,242,100,0.35)] hover:shadow-[0_0_45px_rgba(190,242,100,0.5)] hover:-translate-y-0.5",
    ghost: "text-white/70 hover:text-white hover:bg-white/5",
    outline: "border border-white/15 text-white hover:border-lime-300/50 hover:bg-white/5",
    danger: "border border-red-500/30 text-red-300 hover:bg-red-500/10",
  } as const;
  return (
    <button type={type} disabled={disabled} onClick={onClick} className={cn(base, styles[variant], className)}>
      {children}
    </button>
  );
}

export function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-white/50">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-white/40">{hint}</span>}
    </label>
  );
}

export const inputCls =
  "w-full rounded-2xl border border-white/12 bg-black/40 px-4 py-3 text-base text-white placeholder:text-white/30 outline-none transition focus:border-lime-300/60 focus:ring-2 focus:ring-lime-300/20 sm:text-sm";

export function Badge({ children, tone = "lime" }: { children: React.ReactNode; tone?: "lime" | "violet" | "pink" | "muted" }) {
  const map = {
    lime: "bg-lime-300/15 text-lime-200 border-lime-300/30",
    violet: "bg-violet-500/15 text-violet-200 border-violet-400/30",
    pink: "bg-pink-500/15 text-pink-200 border-pink-400/30",
    muted: "bg-white/5 text-white/60 border-white/10",
  } as const;
  return <span className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold", map[tone])}>{children}</span>;
}

export function Progress({ value, tone = "lime" }: { value: number; tone?: "lime" | "violet" | "pink" }) {
  const grad = { lime: "from-lime-300 to-emerald-300", violet: "from-violet-400 to-fuchsia-400", pink: "from-orange-400 to-pink-500" }[tone];
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/8" role="progressbar" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100}>
      <div className={cn("h-full rounded-full bg-gradient-to-r transition-all duration-700", grad)} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

export function EmptyState({ emoji, title, body, action }: { emoji: string; title: string; body: string; action?: React.ReactNode }) {
  return (
    <div className="glass flex flex-col items-center rounded-3xl px-6 py-12 text-center">
      <div className="text-5xl">{emoji}</div>
      <h3 className="font-display mt-4 text-xl font-bold">{title}</h3>
      <p className="mt-2 max-w-xs text-sm text-white/55">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function PageHeader({ kicker, title, sub, right }: { kicker?: string; title: string; sub?: string; right?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {kicker && <p className="mb-1 text-xs font-bold uppercase tracking-[0.2em] text-lime-300/80">{kicker}</p>}
        <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-4xl">{title}</h1>
        {sub && <p className="mt-1.5 max-w-lg text-sm text-white/55">{sub}</p>}
      </div>
      {right && <div className="flex items-center gap-2">{right}</div>}
    </div>
  );
}
