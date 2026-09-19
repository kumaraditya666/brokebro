"use client";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { AppShell } from "@/components/brokebro/AppShell";
import { Card, PageHeader, Badge } from "@/components/brokebro/ui";
import { AnimatedNumber } from "@/components/brokebro/AnimatedNumber";
import { useBroke } from "@/lib/brokebro/store";
import { calculateGoalETA, calculateProjectedSavings } from "@/lib/brokebro/calc";
import { fmtMoney } from "@/lib/brokebro/format";

export default function SimulatorPage() {
  const goals = useBroke((s) => s.goals);
  const cur = useBroke((s) => s.profile.currency);
  const [save, setSave] = useState(1000);
  const [cut, setCut] = useState(500);
  const [extra, setExtra] = useState(2000);
  const goal = goals[0];

  const annual = useMemo(() => calculateProjectedSavings(save, 12), [save]);
  const eta = goal ? calculateGoalETA(goal, save) : null;

  const Slider = ({ label, value, set, max, step = 100, emoji }: { label: string; value: number; set: (v: number) => void; max: number; step?: number; emoji: string }) => (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold">{emoji} {label}</span>
        <span className="font-display font-extrabold text-lime-200">₹{value.toLocaleString("en-IN")}</span>
      </div>
      <input type="range" min={0} max={max} step={step} value={value} onChange={(e) => set(Number(e.target.value))} className="broke-slider mt-3 w-full" aria-label={label} />
    </div>
  );

  return (
    <AppShell>
      <PageHeader kicker="What-if lab" title="Play with your future" sub="Drag sliders. Watch savings animate. No lectures, just leverage." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="space-y-3">
            <Slider label="Save every month" value={save} set={setSave} max={10000} emoji="🐷" />
            <Slider label="Spend less per month" value={cut} set={setCut} max={5000} emoji="✂️" />
            <Slider label="Earn extra per month" value={extra} set={setExtra} max={20000} step={500} emoji="💪" />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
            {["What if I spend ₹500 less?", "What if I save ₹1,000/mo?", "What if I earn ₹2,000 extra?", "What if I cut food 20%?"].map((t) => (
              <span key={t} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white/60">{t}</span>
            ))}
          </div>
        </Card>
        <motion.div key={`${save}-${cut}-${extra}`} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
          <Card glow>
            <Badge>Live projection</Badge>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-gradient-to-br from-lime-300/15 to-emerald-300/5 p-4"><p className="text-xs text-white/50">Monthly savings</p><p className="font-display text-3xl font-extrabold text-lime-200">₹<AnimatedNumber value={save} /></p></div>
              <div className="rounded-2xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/5 p-4"><p className="text-xs text-white/50">Annual savings</p><p className="font-display text-3xl font-extrabold text-violet-200">₹<AnimatedNumber value={annual} /></p></div>
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4"><p className="text-xs text-white/50">Cutting ₹{cut.toLocaleString("en-IN")}/mo saves yearly</p><p className="font-display text-2xl font-extrabold">{fmtMoney(cut * 12, cur)}</p></div>
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4"><p className="text-xs text-white/50">Extra ₹{extra.toLocaleString("en-IN")}/mo = yearly</p><p className="font-display text-2xl font-extrabold">+{fmtMoney(extra * 12, cur)}</p></div>
            </div>
            {goal && eta && <p className="mt-3 text-sm text-white/60">🎯 <b className="text-white">{goal.name}</b> at ₹{save.toLocaleString("en-IN")}/mo → <b className="text-lime-200">{eta.label}</b></p>}
            <p className="mt-2 text-[11px] text-white/35">Simple linear projection. Assumes consistency, not returns. This is organization, not investing.</p>
          </Card>
        </motion.div>
      </div>
    </AppShell>
  );
}
