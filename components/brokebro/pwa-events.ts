"use client";
import { currentMonthTxns, useBroke } from "@/lib/brokebro/store";
import { calculateBalance, calculateBudgetUsage } from "@/lib/brokebro/calc";
import { monthKey } from "@/lib/brokebro/format";
import { buzz } from "@/lib/brokebro/pwa";
import { notifyBudgetCrossing, notifyGoalMilestone, canNotify, localNotify } from "@/lib/brokebro/notify";

/** Fire-and-forget side effects after user-confirmed saves. Never blocks UI. */
export function afterExpenseSaved(category: string) {
  buzz(15);
  try {
    const s = useBroke.getState();
    const month = currentMonthTxns(s.transactions, monthKey(new Date("2026-09-19")));
    const scope = month.length ? month : s.transactions;
    const spent = scope.filter((t) => t.type === "expense" && t.category === category).reduce((a, t) => a + t.amount, 0);
    const b = s.budgets.find((x) => x.category === category);
    if (!b) return;
    const u = calculateBudgetUsage(spent, b.limit);
    if (u.pct >= 80) notifyBudgetCrossing(category, u.pct);
  } catch {
    /* analytics of joy must never crash */
  }
}

export function afterGoalContribute(goalId: string) {
  buzz(20);
  try {
    const g = useBroke.getState().goals.find((x) => x.id === goalId);
    if (!g || g.target <= 0) return;
    notifyGoalMilestone(goalId, (g.saved / g.target) * 100);
  } catch {
    /* silent */
  }
}

export function afterQuestClaim(title: string, xp: number) {
  buzz([15, 40, 15]);
  try {
    if (!canNotify("quests")) return;
    useBroke.getState().notify("Quest complete! 🏆", `${title} — +${xp} XP.`);
    localNotify("Quest complete! 🏆", `${title} — +${xp} XP.`, `quest_${Date.now()}`);
  } catch {
    /* silent */
  }
}

export function balanceNow() {
  const { income, spending, balance } = calculateBalance(useBroke.getState().transactions);
  return { income, spending, balance };
}
