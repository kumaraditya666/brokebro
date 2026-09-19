"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, PartyPopper } from "lucide-react";
import { AppShell } from "@/components/brokebro/AppShell";
import { Card, Btn, PageHeader, Field, inputCls, Progress, EmptyState } from "@/components/brokebro/ui";
import { useBroke } from "@/lib/brokebro/store";
import { afterGoalContribute } from "@/components/brokebro/pwa-events";
import { calculateGoalETA, calculateGoalProgress } from "@/lib/brokebro/calc";
import { fmtMoney } from "@/lib/brokebro/format";

const KINDS = ["Laptop", "Phone", "Trip", "Headphones", "Emergency fund", "Course", "Other"];

export default function GoalsPage() {
  const goals = useBroke((s) => s.goals);
  const add = useBroke((s) => s.addGoal);
  const contribute = useBroke((s) => s.contributeGoal);
  const del = useBroke((s) => s.deleteGoal);
  const cur = useBroke((s) => s.profile.currency);
  const [show, setShow] = useState(false);
  const [name, setName] = useState("");
  const [kind, setKind] = useState("Trip");
  const [target, setTarget] = useState("8000");
  const [amt, setAmt] = useState<Record<string, string>>({});
  const [cheer, setCheer] = useState<string | null>(null);

  return (
    <AppShell>
      <PageHeader kicker="Goals" title="Savings goals" sub="Name it, fund it, flex it. Milestones + tasteful confetti when you finish."
        right={<Btn onClick={() => setShow(true)}><Plus size={15} /> New goal</Btn>} />
      {goals.length === 0 ? (
        <EmptyState emoji="🎯" title="No goals yet" body="Laptop? Goa? Emergency cushion? Create one — even ₹200/week counts." action={<Btn onClick={() => setShow(true)}>+ Create your first goal</Btn>} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {goals.map((g) => {
            const { pct, remaining } = calculateGoalProgress(g);
            const eta = calculateGoalETA(g, 1000);
            const done = pct >= 100;
            return (
              <motion.div key={g.id} layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                <Card glow={done} className={done ? "border-emerald-300/30" : ""}>
                  <div className="flex items-start justify-between">
                    <div><p className="text-xs font-bold uppercase tracking-widest text-white/45">{g.kind}</p>
                      <h3 className="font-display text-xl font-extrabold">{g.name} {done && "🎉"}</h3></div>
                    <button onClick={() => del(g.id)} className="rounded-xl border border-red-500/20 p-2 text-red-300 hover:bg-red-500/10" aria-label={`Delete ${g.name}`}><Trash2 size={14} /></button>
                  </div>
                  <p className="font-display mt-2 text-2xl font-extrabold">{fmtMoney(g.saved, cur)} <span className="text-sm text-white/45">/ {fmtMoney(g.target, cur)}</span></p>
                  <div className="mt-2"><Progress value={pct} tone={done ? "lime" : "violet"} /></div>
                  <p className="mt-1.5 text-xs text-white/55">{done ? "Completed — legendary. 🏆" : `${Math.round(pct)}% · ${fmtMoney(remaining, cur)} left · ${eta.label} at ₹1k/mo`}</p>
                  {!done && (
                    <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); const v = Number(amt[g.id]); if (!v || v <= 0) return; contribute(g.id, Math.round(v)); afterGoalContribute(g.id); const ng = g.saved + v; if (ng >= g.target) setCheer(g.name); setAmt((s) => ({ ...s, [g.id]: "" })); }}>
                      <input value={amt[g.id] ?? ""} onChange={(e) => setAmt((s) => ({ ...s, [g.id]: e.target.value }))} placeholder="Add ₹500" inputMode="decimal" className={inputCls} aria-label={`Contribute to ${g.name}`} />
                      <Btn type="submit">Add</Btn>
                    </form>
                  )}
                  {done && !g.celebrated && (
                    <button onClick={() => setCheer(g.name)} className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-emerald-300/15 px-4 py-2 text-xs font-bold text-emerald-200 hover:bg-emerald-300/25"><PartyPopper size={14} /> Celebrate</button>
                  )}
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {show && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4" onClick={() => setShow(false)} role="dialog" aria-modal="true" aria-label="New goal">
          <form className="glass pop-in w-full max-w-md rounded-3xl p-6" onClick={(e) => e.stopPropagation()} onSubmit={(e) => { e.preventDefault(); const t = Number(target); if (!name.trim() || !t || t <= 0) return; add({ name: name.trim(), kind, target: Math.round(t), saved: 0 }); setShow(false); setName(""); }}>
            <h3 className="font-display text-xl font-extrabold">New savings goal 🎯</h3>
            <div className="mt-4 space-y-3.5">
              <Field label="Goal name"><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Goa Trip Fund" className={inputCls} required /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Type"><select value={kind} onChange={(e) => setKind(e.target.value)} className={inputCls}>{KINDS.map((k) => <option key={k}>{k}</option>)}</select></Field>
                <Field label="Target (₹)"><input value={target} onChange={(e) => setTarget(e.target.value)} inputMode="decimal" className={inputCls} required /></Field>
              </div>
              <div className="flex gap-2"><Btn type="submit" className="flex-1">Create goal</Btn><Btn variant="ghost" onClick={() => setShow(false)}>Cancel</Btn></div>
            </div>
          </form>
        </div>
      )}

      <AnimatePresence>
        {cheer && (
          <motion.div className="fixed inset-0 z-[60] grid place-items-center bg-black/70 p-4 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setCheer(null)} role="dialog" aria-label="Goal complete">
            <motion.div initial={{ scale: 0.85, y: 20 }} animate={{ scale: 1, y: 0 }} className="glass glow-border max-w-sm rounded-[2rem] p-8 text-center">
              <div className="text-6xl">🏆</div>
              <h3 className="font-display mt-3 text-2xl font-extrabold">GOAL SMASHED</h3>
              <p className="mt-2 text-white/60">{cheer} is fully funded. Screenshot this. You earned it.</p>
              <div className="mt-2 text-2xl">🎊 ✨ 🥳 ✨ 🎊</div>
              <Btn className="mt-5 w-full" onClick={() => setCheer(null)}>Keep going</Btn>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AppShell>
  );
}
