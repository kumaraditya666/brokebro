"use client";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Share2, Download } from "lucide-react";
import { AppShell } from "@/components/brokebro/AppShell";
import { Card, Btn, PageHeader, Badge, EmptyState } from "@/components/brokebro/ui";
import { useBroke } from "@/lib/brokebro/store";
import { calculateBalance, calculateSavingsRate, sumByCategory } from "@/lib/brokebro/calc";
import { fmtMoney } from "@/lib/brokebro/format";

const MONTHS = ["2026-07", "2026-08", "2026-09"];

export default function WrappedPage() {
  const txns = useBroke((s) => s.transactions);
  const cur = useBroke((s) => s.profile.currency);
  const [mi, setMi] = useState(2);
  const [slide, setSlide] = useState(0);
  const [shared, setShared] = useState(false);
  const key = MONTHS[mi];

  const scoped = useMemo(() => txns.filter((t) => t.date.slice(0, 7) === key), [txns, key]);
  const { income, spending, balance } = calculateBalance(scoped.length ? scoped : mi === 2 ? txns : []);
  const byCat = sumByCategory(scoped.length ? scoped : txns);
  const top = byCat[0];
  const rate = calculateSavingsRate(income || 1, spending);
  const moved = income + spending;

  const slides = [
    { e: "💸", t: `${fmtMoney(moved || 12430, cur)} moved through your wallet.`, d: `Your ${monthName(key)} Money Wrapped` },
    { e: "🍜", t: `${top?.category ?? "Food"} was your main character.`, d: `${fmtMoney(top?.total ?? 1820, cur)} — ${spending ? Math.round(((top?.total ?? 1820) / Math.max(1, spending)) * 100) : 31}% of spending` },
    { e: "🔥", t: `${scoped.length || txns.length} transactions logged.`, d: "Consistency is the whole game. Every log = +XP." },
    { e: "🐷", t: `You kept ${Math.round(rate)}% of income.`, d: `Saved ≈ ${fmtMoney(Math.max(0, balance), cur)}. ${rate > 20 ? "Silent Saver energy." : "Room to grow — simulator can help."}` },
    { e: "✨", t: "October loading…", d: "Set one quest. Protect one category. Future-you says thanks." },
  ];

  if (txns.length === 0)
    return (
      <AppShell>
        <PageHeader kicker="Wrapped" title="Money Wrapped" sub="Your month, as stories." />
        <EmptyState emoji="✨" title="Not enough data yet" body="Log a few expenses and your Wrapped will magically appear — like Spotify, but for your wallet." />
      </AppShell>
    );

  return (
    <AppShell>
      <PageHeader kicker="Wrapped" title={`Your ${monthName(key)} Money Wrapped`} sub="Story-style recap. Privacy-safe sharing — balances hidden unless you opt in."
        right={
          <div className="flex gap-2">
            <button onClick={() => setMi((v) => (v + MONTHS.length - 1) % MONTHS.length)} className="rounded-2xl border border-white/15 p-2.5 hover:bg-white/5" aria-label="Previous month"><ChevronLeft size={16} /></button>
            <button onClick={() => setMi((v) => (v + 1) % MONTHS.length)} className="rounded-2xl border border-white/15 p-2.5 hover:bg-white/5" aria-label="Next month"><ChevronRight size={16} /></button>
          </div>
        } />

      <div className="mx-auto max-w-md">
        <div className="mb-3 flex gap-1.5">
          {slides.map((_, i) => (
            <button key={i} onClick={() => setSlide(i)} className={`h-1.5 flex-1 rounded-full transition ${i === slide ? "bg-lime-300" : i < slide ? "bg-lime-300/40" : "bg-white/15"}`} aria-label={`Slide ${i + 1}`} />
          ))}
        </div>
        <AnimatePresence mode="wait">
          <motion.div key={`${key}-${slide}`} initial={{ opacity: 0, x: 60, rotate: 1 }} animate={{ opacity: 1, x: 0, rotate: 0 }} exit={{ opacity: 0, x: -60 }} transition={{ duration: 0.35 }}>
            <Card glow className="min-h-[380px] bg-gradient-to-br from-violet-600/30 via-fuchsia-600/15 to-lime-300/10 p-8 text-center">
              <Badge tone="violet">{monthName(key)} · {slide + 1}/{slides.length}</Badge>
              <div className="mt-8 text-7xl">{slides[slide].e}</div>
              <h2 className="font-display mt-6 text-3xl font-extrabold leading-tight">{slides[slide].t}</h2>
              <p className="mt-3 text-white/60">{slides[slide].d}</p>
              <div className="mt-8 flex justify-center gap-2">
                <button onClick={() => setSlide((s) => Math.max(0, s - 1))} disabled={slide === 0} className="rounded-2xl border border-white/15 px-5 py-2.5 text-sm font-bold disabled:opacity-30">Back</button>
                <button onClick={() => setSlide((s) => Math.min(slides.length - 1, s + 1))} className="rounded-2xl bg-white px-5 py-2.5 text-sm font-bold text-black">{slide === slides.length - 1 ? "Replay ⟳" : "Next →"}</button>
              </div>
            </Card>
          </motion.div>
        </AnimatePresence>

        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <Card><p className="text-xs text-white/45">Income</p><p className="font-display text-xl font-extrabold text-emerald-300">{fmtMoney(income, cur)}</p></Card>
          <Card><p className="text-xs text-white/45">Spending</p><p className="font-display text-xl font-extrabold">{fmtMoney(spending, cur)}</p></Card>
        </div>

        <Card className="mt-3">
          <h3 className="font-display font-bold">Share (privacy-safe)</h3>
          <p className="mt-1 text-xs text-white/50">Default share card hides balances & transaction details. Only vibes: top category + streak + savings rate band.</p>
          <div className="mt-3 rounded-2xl border border-dashed border-lime-300/30 bg-black/40 p-4 text-center text-sm">
            <p className="font-display font-extrabold">✨ My {monthName(key)} Wrapped</p>
            <p className="text-white/60">🍜 {top?.category ?? "Food"} era · 🔥 transaction logger · 🐷 {Math.round(rate)}% keeper</p>
            <p className="mt-1 text-[11px] text-white/35">via BrokeBro — numbers hidden 🔒</p>
          </div>
          <div className="mt-3 flex gap-2">
            <Btn className="flex-1" onClick={() => { navigator.clipboard?.writeText(`✨ My ${monthName(key)} Money Wrapped via BrokeBro: ${top?.category ?? "Food"} era, ${Math.round(rate)}% keeper. Balances hidden 🔒`); setShared(true); setTimeout(() => setShared(false), 1800); }}><Share2 size={15} /> {shared ? "Copied!" : "Copy share text"}</Btn>
            <Btn variant="outline" onClick={() => window.print()}><Download size={15} /> Print / PDF</Btn>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}

function monthName(key: string) {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleString("en", { month: "long" });
}
