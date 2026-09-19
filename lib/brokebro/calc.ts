import { daysUntil } from "./format";
import type { GroupExpense, SavingsGoal, Transaction } from "./types";

/** Total balance = income - expenses (optionally scoped) */
export function calculateBalance(txns: Transaction[]) {
  let income = 0;
  let spending = 0;
  for (const t of txns) {
    if (t.type === "income") income += t.amount;
    else spending += t.amount;
  }
  return { income, spending, balance: income - spending };
}

export function sumByCategory(txns: Transaction[], type: "expense" | "income" = "expense") {
  const map = new Map<string, number>();
  for (const t of txns) {
    if (t.type !== type) continue;
    map.set(t.category, (map.get(t.category) ?? 0) + t.amount);
  }
  return [...map.entries()].map(([category, total]) => ({ category, total })).sort((a, b) => b.total - a.total);
}

/** Safe-to-spend per day = balance / days remaining (floor 1 day). */
export function calculateDailySpend(balance: number, daysLeft: number) {
  if (daysLeft <= 0) return Math.max(0, balance);
  return Math.max(0, balance / daysLeft);
}

export function calculateBudgetUsage(spent: number, limit: number) {
  if (limit <= 0) return { pct: 0, remaining: 0, status: "none" as const };
  const pct = (spent / limit) * 100;
  const remaining = limit - spent;
  const status = pct >= 100 ? "over" : pct >= 80 ? "warn" : pct >= 50 ? "watch" : "chill";
  return { pct, remaining, status };
}

export function brokeMeter(balance: number, budgetTotal: number, daysLeft: number, monthProgress: number) {
  // 0 = flush, 100 = fully broke. Blend of budget burn vs time elapsed.
  const spentRatio = budgetTotal > 0 ? Math.min(1.2, Math.max(0, 1 - balance / budgetTotal)) : 0.3;
  const timeRatio = Math.min(1, Math.max(0, monthProgress));
  const urgency = daysLeft <= 3 && balance < 1000 ? 0.15 : 0;
  const score = Math.round(Math.min(100, Math.max(2, (spentRatio * 0.65 + timeRatio * 0.35 + urgency) * 100)));
  const label =
    score < 25
      ? "Chillin'. Wallet is happy ✨"
      : score < 50
        ? "Vibing. Keep an eye tho 👀"
        : score < 70
          ? "Getting Suspicious 💀"
          : score < 88
            ? "Wallet is fighting for its life 🥲"
            : "YO, YOU'RE ALIVE 😭";
  return { score, label };
}

export function calculateSavingsRate(income: number, spending: number) {
  if (income <= 0) return 0;
  return Math.max(0, Math.min(100, ((income - spending) / income) * 100));
}

export function calculateGoalProgress(goal: SavingsGoal) {
  const pct = goal.target > 0 ? Math.min(100, (goal.saved / goal.target) * 100) : 0;
  return { pct, remaining: Math.max(0, goal.target - goal.saved) };
}

export function calculateGoalETA(goal: SavingsGoal, monthlySave: number) {
  const { remaining } = calculateGoalProgress(goal);
  if (remaining <= 0) return { months: 0, label: "Done 🎉" };
  if (monthlySave <= 0) return { months: Infinity, label: "Add a monthly save to see ETA" };
  const months = Math.ceil(remaining / monthlySave);
  return { months, label: months === 1 ? "1 month to go" : `${months} months to go` };
}

export function calculateProjectedSavings(monthlySave: number, months = 12) {
  return monthlySave * months;
}

/** Greedy minimal settlement: net per member -> [from, to, amount][] */
export function calculateSplitSettlement(members: string[], expenses: GroupExpense[]) {
  const paid = new Map<string, number>();
  const owed = new Map<string, number>();
  for (const m of members) {
    paid.set(m, 0);
    owed.set(m, 0);
  }
  for (const e of expenses) {
    paid.set(e.paidBy, (paid.get(e.paidBy) ?? 0) + e.amount);
    const weights = members.map((m) => e.shares?.[m] ?? 1);
    const wTotal = weights.reduce((a, b) => a + b, 0) || 1;
    members.forEach((m, i) => {
      owed.set(m, (owed.get(m) ?? 0) + (e.amount * weights[i]) / wTotal);
    });
  }
  const nets = members.map((m) => ({ member: m, net: (paid.get(m) ?? 0) - (owed.get(m) ?? 0) }));
  const debtors = nets.filter((n) => n.net < -0.5).sort((a, b) => a.net - b.net);
  const creditors = nets.filter((n) => n.net > 0.5).sort((a, b) => b.net - a.net);
  const settlements: Array<{ from: string; to: string; amount: number }> = [];
  let i = 0;
  let j = 0;
  while (i < debtors.length && j < creditors.length) {
    const d = debtors[i];
    const c = creditors[j];
    const amt = Math.min(-d.net, c.net);
    if (amt > 0.5) settlements.push({ from: d.member, to: c.member, amount: Math.round(amt) });
    d.net += amt;
    c.net -= amt;
    if (Math.abs(d.net) < 0.5) i++;
    if (Math.abs(c.net) < 0.5) j++;
  }
  return { nets, settlements };
}

export function calculateSpendingTrend(txns: Transaction[], days = 30, now = new Date()) {
  const buckets = new Map<string, number>();
  for (let k = days - 1; k >= 0; k--) {
    const d = new Date(now);
    d.setDate(d.getDate() - k);
    buckets.set(d.toISOString().slice(0, 10), 0);
  }
  for (const t of txns) {
    if (t.type !== "expense") continue;
    const key = t.date.slice(0, 10);
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + t.amount);
  }
  return [...buckets.entries()].map(([date, total]) => ({ date: date.slice(5), total }));
}

export function affordability(balance: number, price: number, nextIncomeISO: string, now = new Date()) {
  const daysLeft = Math.max(1, daysUntil(nextIncomeISO, now));
  const before = calculateDailySpend(balance, daysLeft);
  const after = balance - price;
  const afterDaily = calculateDailySpend(after, daysLeft);
  return {
    balance,
    price,
    after,
    daysLeft,
    beforeDaily: before,
    afterDaily,
    delta: before - afterDaily,
    brokeAfter: after < 0,
  };
}
