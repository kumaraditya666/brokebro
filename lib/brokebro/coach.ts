import type { Transaction } from "./types";
import { calculateBalance, sumByCategory, calculateDailySpend } from "./calc";
import { daysUntil } from "./format";

/**
 * Local-first Money Coach. Uses ONLY the user's own app data.
 * No investment advice, no speculation. Short, explainable answers.
 */
export function coachAnswer(question: string, txns: Transaction[], balance: number, nextIncomeISO: string): string {
  const q = question.toLowerCase();
  const { income, spending } = calculateBalance(txns);
  const byCat = sumByCategory(txns);
  const top = byCat[0];
  const food = byCat.find((c) => c.category === "Food")?.total ?? 0;
  const days = Math.max(1, daysUntil(nextIncomeISO));
  const daily = calculateDailySpend(balance, days);

  if (/(afford|buy|headphone|price|₹?\s?\d+.*(purchase|afford))/.test(q)) {
    const m = q.replace(/,/g, "").match(/(\d+(?:\.\d+)?)/);
    const price = m ? Number(m[1]) : null;
    if (price != null) {
      const after = balance - price;
      const afterDaily = calculateDailySpend(after, days);
      return `Quick math, no judgment:\n• Right now: balance ≈ ₹${Math.round(balance).toLocaleString("en-IN")}, ${days} days to go → ~₹${Math.round(daily)}/day safe.\n• After ₹${price.toLocaleString("en-IN")}: balance ≈ ₹${Math.round(after).toLocaleString("en-IN")} → ~₹${Math.round(afterDaily)}/day.\nAssumption: no other income before ${nextIncomeISO.slice(0, 10)}. Your call — want me to check your Food burn too?`;
    }
  }
  if (q.includes("where") && q.includes("money")) {
    if (!top) return "No expenses logged yet — add a few and I'll break it down for you.";
    return `Most of your money went to ${top.category} — ₹${top.total.toLocaleString("en-IN")} of ₹${spending.toLocaleString("en-IN")} total. ${byCat[1] ? `Next: ${byCat[1].category} at ₹${byCat[1].total.toLocaleString("en-IN")}.` : ""} Want a 7-day quest to trim it by 10%?`;
  }
  if (q.includes("food")) {
    return `Food total: ₹${food.toLocaleString("en-IN")}${spending ? ` (${Math.round((food / spending) * 100)}% of spending)` : ""}. Assumption: counting all Food-category expenses this view. Small lever: one mess/canteen swap a week usually saves students ₹300–600/month.`;
  }
  if (q.includes("save") && q.includes("month")) {
    const m = q.replace(/,/g, "").match(/(\d+)/);
    const s = m ? Number(m[1]) : 500;
    return `If you save ₹${s.toLocaleString("en-IN")}/month:\n• 6 months → ₹${(s * 6).toLocaleString("en-IN")}\n• 12 months → ₹${(s * 12).toLocaleString("en-IN")}\nAssumption: saved separately (goal/emergency fund), not mixed with daily balance. I can't recommend investments — but I can track the streak with you.`;
  }
  if (q.includes("left") && q.includes("day")) {
    return `You have ~₹${Math.round(balance).toLocaleString("en-IN")} for ${days} days → ~₹${Math.round(daily)}/day safe to spend. Buffer tip: keep 1 day's spend aside and treat the rest as the real daily.`;
  }
  if (q.includes("spending") && (q.includes("month") || q.includes("understand"))) {
    return `This view: income ₹${income.toLocaleString("en-IN")}, spending ₹${spending.toLocaleString("en-IN")}, saved ≈ ₹${Math.max(0, income - spending).toLocaleString("en-IN")}. Top driver: ${top ? `${top.category} (₹${top.total.toLocaleString("en-IN")})` : "—"}. I explain from your logged data only.`;
  }
  return `Here's what I see: balance ~₹${Math.round(balance).toLocaleString("en-IN")}, ${days} days left (~₹${Math.round(daily)}/day), top category ${top ? `${top.category}` : "none yet"}. Ask me things like:\n• "Where did most of my money go?"\n• "How much did I spend on food?"\n• "Can I afford ₹700?"\n• "What if I save ₹500 every month?"`;
}

export const COACH_SUGGESTIONS = [
  "I have ₹3,000 left and 12 days — how am I doing?",
  "Where did most of my money go?",
  "How much did I spend on food?",
  "Can I afford a ₹700 purchase?",
  "What happens if I save ₹500 every month?",
  "Help me understand my spending this month.",
];
