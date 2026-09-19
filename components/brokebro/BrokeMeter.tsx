"use client";
import { motion } from "framer-motion";
import { AnimatedNumber } from "./AnimatedNumber";
import { fmtMoney } from "@/lib/brokebro/format";
import type { Currency } from "@/lib/brokebro/types";

export function BrokeMeter({ score, label, currency = "INR", balance = 0 }: { score: number; label: string; currency?: Currency; balance?: number }) {
  const r = 64;
  const circ = 2 * Math.PI * r;
  const hue = score < 40 ? 110 : score < 65 ? 45 : score < 85 ? 20 : 340;
  return (
    <div className="glass glow-border relative overflow-hidden rounded-3xl p-6">
      <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-gradient-to-br from-lime-300/20 via-fuchsia-500/15 to-transparent blur-2xl" />
      <div className="flex flex-wrap items-center gap-6">
        <div className="relative h-40 w-40 shrink-0">
          <svg viewBox="0 0 160 160" className="h-full w-full -rotate-90">
            <circle cx="80" cy="80" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="14" />
            <motion.circle
              cx="80" cy="80" r={r} fill="none"
              stroke={`hsl(${hue} 95% 60%)`}
              strokeWidth="14" strokeLinecap="round"
              strokeDasharray={circ}
              initial={{ strokeDashoffset: circ }}
              animate={{ strokeDashoffset: circ - (circ * score) / 100 }}
              transition={{ duration: 1.2, ease: [0.2, 0.9, 0.25, 1] }}
              style={{ filter: `drop-shadow(0 0 12px hsl(${hue} 95% 60% / 0.6))` }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display text-4xl font-extrabold"><AnimatedNumber value={score} />%</span>
            <span className="text-[11px] uppercase tracking-widest text-white/45">broke meter</span>
          </div>
        </div>
        <div className="min-w-0 flex-1 basis-48">
          <p className="text-xs font-bold uppercase tracking-widest text-white/45">Broke level</p>
          <p className="font-display mt-1 text-xl font-bold leading-tight sm:text-2xl">{label}</p>
          <p className="mt-2 text-sm text-white/60">
            Balance <span className="font-bold text-white">{fmtMoney(balance, currency)}</span> — no shame, just signal. Stretch it, don't stress it.
          </p>
        </div>
      </div>
    </div>
  );
}
