"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Plus, Sparkles, Wallet } from "lucide-react";
import { useMemo } from "react";
import { AppShell } from "@/components/brokebro/AppShell";
import { BrokeMeter } from "@/components/brokebro/BrokeMeter";
import { AnimatedNumber } from "@/components/brokebro/AnimatedNumber";
import { Card, Btn, Badge, Progress, EmptyState, PageHeader } from "@/components/brokebro/ui";
import { currentMonthTxns, useBroke } from "@/lib/brokebro/store";
import { brokeMeter, calculateBalance, calculateBudgetUsage, calculateDailySpend, sumByCategory } from "@/lib/brokebro/calc";
import { daysUntil, fmtMoney, monthKey } from "@/lib/brokebro/format";

export default function DashboardPage() {
  const profile = useBroke((s) => s.profile);
  const txns = useBroke((s) => s.transactions);
  const budgets = useBroke((s) => s.budgets);
  const goals = useBroke((s) => s.goals);
  const demoMode = useBroke((s) => s.demoMode);
  const loadDemo = useBroke((s) => s.loadDemo);
  const clearDemo = useBroke((s) => s.clearDemo);

  const cur = profile.currency;
  const month = currentMonthTxns(txns, monthKey(new Date("2026-09-19")));
  const { income, spending, balance } = useMemo(() => calculateBalance(month.length ? month : txns), [month, txns]);
  const daysLeft = daysUntil(profile.nextIncomeDate || "2026-10-05", new Date("2026-09-19"));
  const daily = calculateDailySpend(balance, Math.max(1, daysLeft));
  const totalBudget = budgets.filter((b) => b.category === "TOTAL").reduce((a, b) => a + b.limit, 0) || Math.max(8000, spending + balance);
  const now = new Date("2026-09-19");
  const monthProgress = now.getDate() / 30;
  const meter = brokeMeter(balance, totalBudget, daysLeft, monthProgress);
  const byCat = sumByCategory(month.length ? month : txns);
  const recent = [...txns].slice(0, 5);
  const goal = goals[0];
  const goalPct = goal ? Math.min(100, (goal.saved / goal.target) * 100) : 0;

  return (
    <AppShell>
      <PageHeader
        kicker="Dashboard"
        title={profile.name ? `Hey ${profile.name} 👋` : "YO, YOU'RE ALIVE 😭"}
        sub={demoMode ? "Showing demo data — explore freely, clear it anytime." : "How much money do I have? How long must it last? Answered below."}
        right={
          <div className="flex flex-wrap gap-2">
            {txns.length === 0 ? (
              <Btn onClick={loadDemo}><Sparkles size={15} /> Use Demo Data</Btn>
            ) : demoMode ? (
              <Btn variant="outline" onClick={clearDemo}>Clear Demo Data</Btn>
            ) : null}
            <Link href="/expenses?action=add" className="inline-flex min-h-[44px] items-center gap-2 whitespace-nowrap rounded-2xl bg-gradient-to-r from-lime-300 to-emerald-300 px-5 py-3 text-sm font-bold text-black"><Plus size={16} /> Add</Link>
          </div>
        }
      />

      {txns.length === 0 ? (
        <EmptyState
          emoji="👀"
          title="Your wallet is suspiciously clean"
          body="No expenses yet. Add your first one — it takes 5 seconds — or load demo data to see the magic."
          action={<div className="flex gap-2"><Btn onClick={loadDemo}><Sparkles size={15} /> Use Demo Data</Btn><Link href="/expenses?action=add" className="inline-flex items-center gap-2 rounded-2xl border border-white/15 px-5 py-3 text-sm font-bold hover:bg-white/5">+ Add first expense</Link></div>}
        />
      ) : (
        <>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <BrokeMeter score={meter.score} label={meter.label} currency={cur} balance={balance} />
          </motion.div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { k: "Balance", v: balance, pre: true, sub: `${daysLeft} days to survive` },
              { k: "Income", v: income, pre: true, sub: "this period" },
              { k: "Spent", v: spending, pre: true, sub: `${month.length || txns.length} txns logged` },
              { k: "Safe / day", v: Math.round(daily), pre: true, sub: "spend ≤ this & you survive" },
            ].map((s, i) => (
              <motion.div key={s.k} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 * i }}>
                <Card>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-white/45 sm:text-xs">{s.k}</p>
                  <p className="font-display mt-1 truncate text-2xl font-extrabold sm:text-3xl"><AnimatedNumber value={s.v} prefix={s.pre ? (cur === "INR" ? "₹" : "") : ""} /></p>
                  <p className="mt-1 truncate text-xs text-white/50">{s.sub}</p>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <Card>
              <div className="flex items-center justify-between">
                <h3 className="font-display font-bold">Recent activity</h3>
                <Link href="/expenses" className="inline-flex items-center gap-1 text-xs font-bold text-lime-200 hover:underline">View all <ArrowRight size={13} /></Link>
              </div>
              <div className="mt-3 space-y-2">
                {recent.map((t) => (
                  <div key={t.id} className="flex items-center gap-3 rounded-2xl border border-white/8 bg-black/30 px-3.5 py-2.5">
                    <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/8 text-base">{t.type === "income" ? "💰" : catEmoji(t.category)}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{t.note || t.category}</p>
                      <p className="text-xs text-white/40">{t.category} · {t.date.slice(0, 10)}</p>
                    </div>
                    <span className={`font-display text-sm font-extrabold ${t.type === "income" ? "text-emerald-300" : "text-white"}`}>
                      {t.type === "income" ? "+" : "−"}{fmtMoney(t.amount, cur)}
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <h3 className="font-display font-bold">Budgets</h3>
              <div className="mt-3 space-y-3.5">
                {budgets.filter((b) => b.category !== "TOTAL").slice(0, 4).map((b) => {
                  const spent = (month.length ? month : txns).filter((t) => t.type === "expense" && t.category === b.category).reduce((a, t) => a + t.amount, 0);
                  const u = calculateBudgetUsage(spent, b.limit);
                  return (
                    <div key={b.id}>
                      <div className="mb-1 flex justify-between text-sm">
                        <span className="font-semibold">{b.category}</span>
                        <span className="text-white/55">{fmtMoney(spent, cur)} / {fmtMoney(b.limit, cur)}</span>
                      </div>
                      <Progress value={u.pct} tone={u.status === "over" ? "pink" : u.status === "warn" ? "pink" : "lime"} />
                      <p className="mt-1 text-xs text-white/45">{u.status === "over" ? "Over — no stress, adjust next week 🌱" : u.status === "warn" ? "Heating up — gentle pace from here 🐢" : u.status === "watch" ? `${Math.round(u.pct)}% — still breathing` : "Chill zone ✨"}</p>
                    </div>
                  );
                })}
                {budgets.length === 0 && <p className="text-sm text-white/50">No budgets yet. <Link href="/budgets" className="font-bold text-lime-200 hover:underline">Create one →</Link></p>}
              </div>
            </Card>

            <div className="space-y-4">
              <Card>
                <h3 className="font-display font-bold">Savings progress</h3>
                {goal ? (
                  <div className="mt-2">
                    <p className="text-sm font-semibold">{goal.name}</p>
                    <p className="font-display mt-1 text-2xl font-extrabold text-lime-200">{fmtMoney(goal.saved, cur)} <span className="text-sm font-semibold text-white/45">/ {fmtMoney(goal.target, cur)}</span></p>
                    <div className="mt-2"><Progress value={goalPct} tone="violet" /></div>
                    <Link href="/goals" className="mt-2 inline-block text-xs font-bold text-violet-200 hover:underline">Open goals →</Link>
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-white/50">No goals yet. <Link href="/goals" className="font-bold text-lime-200 hover:underline">Start one →</Link></p>
                )}
              </Card>
              <Card className="bg-gradient-to-br from-violet-600/20 to-fuchsia-600/10">
                <p className="text-xs font-bold uppercase tracking-widest text-violet-200/80">Top spend</p>
                <p className="font-display mt-1 text-xl font-extrabold">{byCat[0] ? `${catEmoji(byCat[0].category)} ${byCat[0].category} · ${fmtMoney(byCat[0].total, cur)}` : "—"}</p>
                <div className="mt-3 flex gap-2">
                  <Link href="/wrapped" className="rounded-xl bg-white/10 px-4 py-2 text-xs font-bold hover:bg-white/15">Money Wrapped ✨</Link>
                  <Link href="/coach" className="rounded-xl bg-white/10 px-4 py-2 text-xs font-bold hover:bg-white/15"><Wallet size={12} className="mr-1 inline" />Ask Coach</Link>
                </div>
              </Card>
            </div>
          </div>
        </>
      )}
    </AppShell>
  );
}

function catEmoji(c: string) {
  const m: Record<string, string> = { Food: "🍜", Transport: "🛵", Entertainment: "🎬", Shopping: "🛍️", Education: "📚", Hostel: "🏠", Bills: "🧾", Health: "💊", Subscriptions: "🔁", Travel: "✈️", Other: "📦", Allowance: "💰" };
  return m[c] ?? "💸";
}
