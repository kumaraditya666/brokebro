"use client";
import { Suspense, useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid } from "recharts";
import { AppShell } from "@/components/brokebro/AppShell";
import { Card, PageHeader, Badge, EmptyState } from "@/components/brokebro/ui";
import { useBroke } from "@/lib/brokebro/store";
import { calculateSpendingTrend, sumByCategory } from "@/lib/brokebro/calc";
import { fmtMoney } from "@/lib/brokebro/format";

const COLORS = ["#bef264", "#a78bfa", "#f472b6", "#34d399", "#fbbf24", "#60a5fa", "#fb7185", "#2dd4bf"];

function Charts({ range }: { range: number }) {
  const txns = useBroke((s) => s.transactions);
  const cur = useBroke((s) => s.profile.currency);
  const cutoff = useMemo(() => { const d = new Date("2026-09-19"); d.setDate(d.getDate() - range); return d; }, [range]);
  const scoped = txns.filter((t) => new Date(t.date) >= cutoff);
  const byCat = sumByCategory(scoped);
  const trend = calculateSpendingTrend(txns, Math.min(range, 30), new Date("2026-09-19"));
  const income = scoped.filter((t) => t.type === "income").reduce((a, t) => a + t.amount, 0);
  const spending = scoped.filter((t) => t.type === "expense").reduce((a, t) => a + t.amount, 0);
  const recurring = scoped.filter((t) => t.recurring).reduce((a, t) => a + t.amount, 0);

  if (txns.length === 0) return <EmptyState emoji="📊" title="No data to chart" body="Charts wake up after a few logs. Add expenses or load demo data." />;

  const tip = { contentStyle: { background: "#141110", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 14, fontSize: 12 } };
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <h3 className="font-display font-bold">Spending by category <Badge>interactive</Badge></h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={byCat} dataKey="total" nameKey="category" innerRadius={55} outerRadius={90} paddingAngle={3} strokeWidth={0}>
                {byCat.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip {...tip} formatter={(v) => fmtMoney(Number(v ?? 0), cur)} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {byCat.slice(0, 6).map((c, i) => <span key={c.category} className="text-xs text-white/55"><span style={{ color: COLORS[i % COLORS.length] }}>●</span> {c.category} {fmtMoney(c.total, cur)}</span>)}
        </div>
      </Card>
      <Card>
        <h3 className="font-display font-bold">Spending over time</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trend}>
              <XAxis dataKey="date" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} interval={Math.ceil(trend.length / 8)} />
              <YAxis tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} width={45} />
              <Tooltip {...tip} />
              <Bar dataKey="total" fill="#bef264" radius={[6, 6, 2, 2]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
      <Card>
        <h3 className="font-display font-bold">Income vs spending</h3>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={[{ k: "Last period", income, spending }]}>
              <XAxis dataKey="k" tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 12 }} />
              <YAxis tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} width={45} />
              <Tooltip {...tip} />
              <Bar dataKey="income" fill="#34d399" radius={[8, 8, 2, 2]} />
              <Bar dataKey="spending" fill="#f472b6" radius={[8, 8, 2, 2]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-1 text-xs text-white/50">Recurring burn: <b className="text-white">{fmtMoney(recurring, cur)}</b>/mo · Savings ≈ <b className="text-emerald-300">{fmtMoney(Math.max(0, income - spending), cur)}</b></p>
      </Card>
      <Card>
        <h3 className="font-display font-bold">Savings trend (cumulative)</h3>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trend.map((t, i, arr) => ({ ...t, cum: arr.slice(0, i + 1).reduce((a, x) => a + x.total, 0) }))}>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} interval={Math.ceil(trend.length / 6)} />
              <YAxis tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} width={45} />
              <Tooltip {...tip} />
              <Line type="monotone" dataKey="cum" stroke="#a78bfa" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}

export default function AnalyticsPage() {
  const [range, setRange] = useState(30);
  return (
    <AppShell>
      <PageHeader kicker="Analytics" title="Where it all goes" sub="Category splits, trends, recurring burn. Tooltips on everything."
        right={<div className="flex gap-1.5">{[[7, "7D"], [30, "30D"], [90, "3M"], [180, "6M"], [365, "1Y"]].map(([v, l]) => (
          <button key={l} onClick={() => setRange(v as number)} className={`rounded-xl px-3.5 py-2 text-xs font-bold transition ${range === v ? "bg-lime-300 text-black" : "border border-white/12 text-white/60 hover:bg-white/5"}`}>{l}</button>
        ))}</div>} />
      <Suspense fallback={<div className="shimmer h-64 rounded-3xl" />}>
        <Charts range={range} />
      </Suspense>
    </AppShell>
  );
}
