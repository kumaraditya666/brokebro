"use client";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { AppShell } from "@/components/brokebro/AppShell";
import { Card, PageHeader, Badge } from "@/components/brokebro/ui";
import { AnimatedNumber } from "@/components/brokebro/AnimatedNumber";
import { currentMonthTxns, useBroke } from "@/lib/brokebro/store";
import { affordability } from "@/lib/brokebro/calc";
import { fmtMoney, monthKey } from "@/lib/brokebro/format";
import { inputCls, Field, Btn } from "@/components/brokebro/ui";

export default function AffordPage() {
  const txns = useBroke((s) => s.transactions);
  const profile = useBroke((s) => s.profile);
  const cur = profile.currency;
  const [item, setItem] = useState("Headphones");
  const [price, setPrice] = useState("1499");

  const month = currentMonthTxns(txns, monthKey(new Date("2026-09-19")));
  const scope = month.length ? month : txns;
  const balance = scope.filter((t) => t.type === "income").reduce((a, t) => a + t.amount, 0) - scope.filter((t) => t.type === "expense").reduce((a, t) => a + t.amount, 0);
  const p = Number(price) || 0;
  const r = useMemo(() => affordability(balance, p, profile.nextIncomeDate || "2026-10-05", new Date("2026-09-19")), [balance, p, profile.nextIncomeDate]);

  return (
    <AppShell>
      <PageHeader kicker="Decision helper" title="Can I afford this?" sub="Neutral math, zero judgment. We show what changes — you decide what's worth it." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="space-y-3.5">
            <Field label="What is it?"><input value={item} onChange={(e) => setItem(e.target.value)} placeholder="Headphones" className={inputCls} /></Field>
            <Field label="Price (₹)"><input value={price} onChange={(e) => setPrice(e.target.value)} inputMode="decimal" placeholder="1499" className={inputCls} /></Field>
            <div className="flex flex-wrap gap-2">
              {[499, 999, 1499, 2999].map((v) => (
                <button key={v} onClick={() => setPrice(String(v))} className="rounded-full border border-white/12 bg-white/5 px-3.5 py-1.5 text-xs font-bold hover:border-lime-300/40">₹{v.toLocaleString("en-IN")}</button>
              ))}
            </div>
            <p className="text-xs text-white/40">We never tell you what to buy. Just the impact, clearly.</p>
          </div>
        </Card>

        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} key={p}>
          <Card glow>
            <div className="flex items-center justify-between">
              <Badge tone={r.brokeAfter ? "pink" : "lime"}>{r.brokeAfter ? "⚠️ goes negative" : "math checks out"}</Badge>
              <span className="text-xs text-white/45">{r.daysLeft} days left</span>
            </div>
            <h3 className="font-display mt-3 text-2xl font-extrabold">{item || "That thing"} — {fmtMoney(p, cur)}</h3>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-2xl border border-white/10 bg-black/30 p-3.5"><p className="text-xs text-white/45">Current balance</p><p className="font-display text-xl font-extrabold">{fmtMoney(r.balance, cur)}</p></div>
              <div className="rounded-2xl border border-white/10 bg-black/30 p-3.5"><p className="text-xs text-white/45">After purchase</p><p className={`font-display text-xl font-extrabold ${r.after < 0 ? "text-red-300" : "text-lime-200"}`}>{fmtMoney(r.after, cur)}</p></div>
              <div className="rounded-2xl border border-white/10 bg-black/30 p-3.5"><p className="text-xs text-white/45">Safe/day before</p><p className="font-display text-xl font-extrabold">₹<AnimatedNumber value={Math.round(r.beforeDaily)} /></p></div>
              <div className="rounded-2xl border border-white/10 bg-black/30 p-3.5"><p className="text-xs text-white/45">Safe/day after</p><p className="font-display text-xl font-extrabold">₹<AnimatedNumber value={Math.round(r.afterDaily)} /></p></div>
            </div>
            <p className="mt-3 text-sm text-white/60">
              Daily capacity {r.delta >= 0 ? "drops" : "changes"} by <b className="text-white">₹{Math.round(Math.abs(r.delta))}</b> across {r.daysLeft} days.
              {r.brokeAfter ? " This would push balance negative before next income — consider waiting or splitting the cost." : " Survivable if the rest of the month stays normal."}
            </p>
            <p className="mt-2 text-[11px] text-white/35">Assumes no other income before {(profile.nextIncomeDate || "2026-10-05").slice(0, 10)} and average spending.</p>
          </Card>
        </motion.div>
      </div>
    </AppShell>
  );
}
