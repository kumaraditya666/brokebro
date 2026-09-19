"use client";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { AppShell } from "@/components/brokebro/AppShell";
import { Card, Btn, PageHeader, Field, inputCls, Progress, EmptyState } from "@/components/brokebro/ui";
import { EXPENSE_CATEGORIES } from "@/lib/brokebro/types";
import { currentMonthTxns, useBroke } from "@/lib/brokebro/store";
import { calculateBudgetUsage } from "@/lib/brokebro/calc";
import { fmtMoney, monthKey } from "@/lib/brokebro/format";

export default function BudgetsPage() {
  const budgets = useBroke((s) => s.budgets);
  const add = useBroke((s) => s.addBudget);
  const del = useBroke((s) => s.deleteBudget);
  const txns = useBroke((s) => s.transactions);
  const cur = useBroke((s) => s.profile.currency);
  const [cat, setCat] = useState("Food");
  const [limit, setLimit] = useState("2500");

  const month = currentMonthTxns(txns, monthKey(new Date("2026-09-19")));
  const scope = month.length ? month : txns;

  return (
    <AppShell>
      <PageHeader kicker="Budgets" title="Spend with guardrails" sub="Monthly, weekly, per-category. Friendly nudges — never aggressive alarms."
        right={null} />
      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <h3 className="font-display font-bold">New budget</h3>
          <form className="mt-3 space-y-3" onSubmit={(e) => { e.preventDefault(); const l = Number(limit); if (!l || l <= 0) return; add({ scope: "monthly", category: cat, limit: Math.round(l), periodKey: "2026-09" }); }}>
            <Field label="Category"><select value={cat} onChange={(e) => setCat(e.target.value)} className={inputCls}>{EXPENSE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}<option>TOTAL</option></select></Field>
            <Field label="Monthly limit (₹)"><input value={limit} onChange={(e) => setLimit(e.target.value)} inputMode="decimal" className={inputCls} required /></Field>
            <Btn type="submit" className="w-full"><Plus size={15} /> Create budget</Btn>
          </form>
        </Card>
        <div className="space-y-3 lg:col-span-2">
          {budgets.length === 0 && <EmptyState emoji="🪙" title="No budgets yet" body="Start with Food — the usual suspect. Set a limit and we'll nudge you gently at 80%." />}
          {budgets.map((b) => {
            const spent = b.category === "TOTAL" ? scope.filter((t) => t.type === "expense").reduce((a, t) => a + t.amount, 0) : scope.filter((t) => t.type === "expense" && t.category === b.category).reduce((a, t) => a + t.amount, 0);
            const u = calculateBudgetUsage(spent, b.limit);
            return (
              <Card key={b.id}>
                <div className="flex items-center justify-between gap-3">
                  <div><p className="font-bold">{b.category} <span className="ml-1 rounded-full bg-white/8 px-2 py-0.5 text-[11px] text-white/50">{b.scope}</span></p>
                    <p className="mt-0.5 text-sm text-white/55">{fmtMoney(spent, cur)} / {fmtMoney(b.limit, cur)} · {Math.round(u.pct)}%</p></div>
                  <button onClick={() => del(b.id)} className="rounded-xl border border-red-500/20 p-2 text-red-300 hover:bg-red-500/10" aria-label={`Delete ${b.category} budget`}><Trash2 size={14} /></button>
                </div>
                <div className="mt-2.5"><Progress value={u.pct} tone={u.status === "over" ? "pink" : u.status === "warn" ? "pink" : "lime"} /></div>
                <p className="mt-1.5 text-xs text-white/50">{u.status === "over" ? "Over the line — totally fine, shrink one outing next week 🌱" : u.status === "warn" ? "At 80%+ — easy does it, future-you says thanks 🐢" : u.status === "watch" ? "Halfway — pacing nicely" : "Lots of runway ✨"}</p>
              </Card>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
