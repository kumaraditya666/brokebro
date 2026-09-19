"use client";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { RefreshCw } from "lucide-react";
import { AppShell } from "@/components/brokebro/AppShell";
import { Card, Btn, PageHeader, Badge, EmptyState } from "@/components/brokebro/ui";
import { currentMonthTxns, useBroke } from "@/lib/brokebro/store";
import { sumByCategory } from "@/lib/brokebro/calc";
import { monthKey } from "@/lib/brokebro/format";

const PERSONAS: Record<string, { emoji: string; line: string }> = {
  Foodie: { emoji: "🍜", line: "Food is your love language. Canteen regular, midnight-magii loyalist." },
  "Weekend Warrior": { emoji: "🎉", line: "Quiet weekdays, legendary weekends. Entertainment spikes Fri–Sun." },
  "Budget Monk": { emoji: "🧘", line: "Calm, balanced, suspiciously disciplined. Teach us your ways." },
  "Silent Saver": { emoji: "🐷", line: "Money in > money out. The group fund's safest hands." },
  "Social Spender": { emoji: "👯", line: "Every plan gets a yes. Splits keep you honest — keep the crew." },
  "Impulse Goblin": { emoji: "👾", line: "Cart-first, think-later. Cute stuff finds YOU. Budgets are your side quest." },
  "Goal Getter": { emoji: "🎯", line: "Eyes on the prize. Goals get fed before cravings do." },
};

function infer(txns: ReturnType<typeof currentMonthTxns>) {
  const byCat = sumByCategory(txns.filter((t) => t.type === "expense"));
  const total = byCat.reduce((a, c) => a + c.total, 0) || 1;
  const share = (c: string) => (byCat.find((x) => x.category === c)?.total ?? 0) / total;
  const weekend = txns.filter((t) => { const d = new Date(t.date).getDay(); return d === 0 || d === 6; }).length;
  const weekendShare = txns.length ? weekend / txns.length : 0;
  let persona = "Budget Monk";
  let why: string[] = [];
  if (share("Food") > 0.35) { persona = "Foodie"; why.push(`Food is ${Math.round(share("Food") * 100)}% of your spending`); }
  else if (weekendShare > 0.45) { persona = "Weekend Warrior"; why.push(`${Math.round(weekendShare * 100)}% of logs land on weekends`); }
  else if (share("Shopping") + share("Entertainment") > 0.4) { persona = "Impulse Goblin"; why.push(`Fun + carts = ${Math.round((share("Shopping") + share("Entertainment")) * 100)}% of burn`); }
  else if (share("Entertainment") > 0.25) { persona = "Social Spender"; why.push(`Entertainment at ${Math.round(share("Entertainment") * 100)}% — plans > savings (for now)`); }
  const top = byCat[0];
  if (top) why.push(`Top category: ${top.category}`);
  return { persona, why, top };
}

export default function PersonalityPage() {
  const txns = useBroke((s) => s.transactions);
  const goals = useBroke((s) => s.goals);
  const [regen, setRegen] = useState(0);
  const month = currentMonthTxns(txns, monthKey(new Date("2026-09-19")));
  const scope = useMemo(() => (month.length ? month : txns), [month, txns, regen]);

  if (scope.length < 3)
    return (
      <AppShell>
        <PageHeader kicker="Personality" title="Financial personality" sub="Playful labels from YOUR patterns. Never judgments." />
        <EmptyState emoji="🔮" title="Not enough data" body="Log 3+ expenses and I'll reveal your money persona — Foodie? Budget Monk? Impulse Goblin?" />
      </AppShell>
    );

  const hasGoalProgress = goals.some((g) => g.saved > 0);
  let { persona, why } = infer(scope);
  if (hasGoalProgress && (persona === "Budget Monk" || persona === "Foodie") && goals.some((g) => g.saved / Math.max(1, g.target) > 0.4)) {
    persona = "Goal Getter";
    why = [...why, "Feeding goals consistently (+40% on at least one)"];
  }
  const p = PERSONAS[persona];

  return (
    <AppShell>
      <PageHeader kicker="Personality" title="Financial personality" sub="Playful, not judgmental. Based only on your logged patterns." />
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} key={regen} className="mx-auto max-w-lg">
        <Card glow className="bg-gradient-to-br from-lime-300/12 via-transparent to-violet-500/15 p-8 text-center">
          <Badge>your persona</Badge>
          <div className="mt-4 text-7xl">{p.emoji}</div>
          <h2 className="font-display mt-3 text-4xl font-extrabold">{persona}</h2>
          <p className="mx-auto mt-2 max-w-sm text-white/60">{p.line}</p>
          <div className="mx-auto mt-4 max-w-sm space-y-1.5 text-left">
            {why.map((w) => <p key={w} className="rounded-xl border border-white/10 bg-black/30 px-3.5 py-2 text-xs text-white/70">📊 {w}</p>)}
          </div>
          <Btn variant="outline" className="mt-5" onClick={() => setRegen((v) => v + 1)}><RefreshCw size={14} /> Regenerate</Btn>
          <p className="mt-3 text-[11px] text-white/35">Regenerate after new logs — personas evolve with you.</p>
        </Card>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {Object.entries(PERSONAS).filter(([k]) => k !== persona).slice(0, 3).map(([k, v]) => (
            <Card key={k} className="p-3 text-center opacity-60"><div className="text-2xl">{v.emoji}</div><p className="mt-1 text-[11px] font-bold">{k}</p></Card>
          ))}
        </div>
      </motion.div>
    </AppShell>
  );
}
