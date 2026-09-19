// BROKE MUSIC — small shared UI primitives.
"use client";

import React from "react";
import { motion } from "framer-motion";
import { Inbox } from "lucide-react";

export function PageHeader({ kicker, title, sub, right }: { kicker?: string; title: string; sub?: string; right?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        {kicker && <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-lime-300/80">{kicker}</p>}
        <h1 className="font-display mt-1 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">{title}</h1>
        {sub && <p className="mt-1.5 max-w-xl text-sm text-white/55">{sub}</p>}
      </div>
      {right && <div className="flex items-center gap-2">{right}</div>}
    </div>
  );
}

export function SectionTitle({ title, sub, right }: { title: string; sub?: string; right?: React.ReactNode }) {
  return (
    <div className="mb-3 mt-8 flex items-end justify-between gap-3 first:mt-0">
      <div>
        <h2 className="font-display text-lg font-extrabold tracking-tight text-white">{title}</h2>
        {sub && <p className="text-xs text-white/45">{sub}</p>}
      </div>
      {right}
    </div>
  );
}

export function EmptyState({ title, sub, action }: { title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div className="glass grid place-items-center rounded-[1.75rem] px-6 py-14 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white/5 text-white/50">
        <Inbox size={24} />
      </div>
      <h3 className="font-display mt-4 text-lg font-extrabold text-white">{title}</h3>
      {sub && <p className="mt-1.5 max-w-sm text-sm text-white/50">{sub}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`shimmer rounded-2xl bg-white/5 ${className}`} aria-hidden />;
}

export function TrackSkeletonRow() {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.02] p-3">
      <Skeleton className="h-12 w-12 shrink-0 !rounded-xl" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3.5 w-2/3 !rounded-full" />
        <Skeleton className="h-3 w-1/3 !rounded-full" />
      </div>
      <Skeleton className="h-9 w-9 !rounded-full" />
    </div>
  );
}

export function FadeIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay, ease: [0.2, 0.9, 0.25, 1] }}>
      {children}
    </motion.div>
  );
}
