"use client";
import { motion } from "framer-motion";
import { Trophy, Zap, Flame } from "lucide-react";
import { AppShell } from "@/components/brokebro/AppShell";
import { Card, Btn, PageHeader, Progress, Badge } from "@/components/brokebro/ui";
import { QUEST_DEFS, currentMonthTxns, useBroke } from "@/lib/brokebro/store";
import { afterQuestClaim } from "@/components/brokebro/pwa-events";
import { monthKey } from "@/lib/brokebro/format";

export default function QuestsPage() {
  const txns = useBroke((s) => s.transactions);
  const goals = useBroke((s) => s.goals);
  const qp = useBroke((s) => s.quests);
  const xp = useBroke((s) => s.xp);
  const streak = useBroke((s) => s.streak);
  const claim = useBroke((s) => s.claimQuest);
  const setQ = useBroke((s) => s.setQuestProgress);

  const logDays = new Set(txns.filter((t) => t.type === "expense").map((t) => t.date.slice(0, 10))).size;
  const savedTotal = goals.reduce((a, g) => a + g.saved, 0);
  const goalsDone = goals.filter((g) => g.saved >= g.target && g.target > 0).length;

  const progressFor = (id: string) => {
    if (id === "q_first_log") return Math.min(1, txns.length);
    if (id === "q_7day") return Math.min(7, logDays);
    if (id === "q_save300") return Math.min(300, savedTotal);
    if (id === "q_first_goal") return goalsDone;
    if (id === "q_food_budget") return goals.length ? 1 : 0;
    return qp.find((q) => q.questId === id)?.progress ?? 0;
  };

  const level = Math.floor(xp / 200) + 1;
  const levelPct = ((xp % 200) / 200) * 100;

  return (
    <AppShell>
      <PageHeader kicker="Gamification" title="Money quests" sub="Healthy habits only. No crash-diet budgeting — consistency beats restriction." />
      <div className="grid gap-4 sm:grid-cols-3">
        <Card glow><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/45"><Zap size={13} /> Level {level}</p><p className="font-display mt-1 text-3xl font-extrabold">{xp} XP</p><div className="mt-2"><Progress value={levelPct} /></div></Card>
        <Card><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/45"><Flame size={13} /> Streak</p><p className="font-display mt-1 text-3xl font-extrabold">🔥 {streak} days</p><p className="mt-1 text-xs text-white/50">Log daily to keep it alive.</p></Card>
        <Card><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/45"><Trophy size={13} /> Badges</p><p className="font-display mt-1 text-3xl font-extrabold">{qp.filter((q) => q.done).length}/{QUEST_DEFS.length}</p><p className="mt-1 text-xs text-white/50">Completed quests unlock badges.</p></Card>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {QUEST_DEFS.map((q, i) => {
          const prog = progressFor(q.id);
          const pct = Math.min(100, (prog / q.target) * 100);
          const done = pct >= 100;
          const claimed = qp.find((x) => x.questId === q.id)?.xpClaimed;
          return (
            <motion.div key={q.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className={done ? "border-lime-300/25" : ""}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex gap-3">
                    <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/8 text-2xl">{q.badge}</span>
                    <div><h3 className="font-bold">{q.title}</h3><p className="text-xs text-white/50">{q.desc}</p></div>
                  </div>
                  <Badge tone={done ? "lime" : "muted"}>+{q.xp} XP</Badge>
                </div>
                <div className="mt-3"><Progress value={pct} /></div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-white/50">{Math.min(prog, q.target)}/{q.target} {done ? "— done 🎉" : ""}</span>
                  {done && !claimed ? (
                    <button onClick={() => { claim(q.id, q.xp); afterQuestClaim(q.title, q.xp); }} className="rounded-xl bg-gradient-to-r from-lime-300 to-emerald-300 px-4 py-2 text-xs font-bold text-black">Claim XP</button>
                  ) : q.check === "manual" ? (
                    <button onClick={() => { setQ(q.id, 1, true); }} className="rounded-xl border border-white/15 px-4 py-2 text-xs font-bold hover:bg-white/5">Mark done</button>
                  ) : null}
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>
      <p className="mt-4 text-center text-xs text-white/35">Quests nudge healthy tracking & saving — never extreme restriction. 🌱</p>
    </AppShell>
  );
}
