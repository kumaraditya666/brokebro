import type { Budget, GroupExpense, SavingsGoal, SplitGroup, Transaction } from "./types";
import { uid } from "./format";

const D = (day: number, h = 12) => `2026-09-${String(day).padStart(2, "0")}T${String(h).padStart(2, "0")}:00:00.000Z`;

export function demoTransactions(): Transaction[] {
  const rows: Array<[string, number, string, string, string, number]> = [
    ["income", 12000, "Allowance", "Monthly allowance from home", "UPI", 1],
    ["income", 2500, "Freelance", "Thumbnail pack for junior", "UPI", 9],
    ["income", 800, "Gifts", "Birthday from chacha", "Cash", 14],
    ["expense", 250, "Food", "₹250 Zomato — biryani night", "UPI", 2],
    ["expense", 120, "Transport", "₹120 Uber auto to campus", "UPI", 2],
    ["expense", 199, "Subscriptions", "Spotify student", "Card", 3],
    ["expense", 450, "Food", "Canteen + chai week", "UPI", 4],
    ["expense", 899, "Shopping", "Decathlon tee", "Card", 5],
    ["expense", 320, "Food", "Swiggy maggi + fries", "UPI", 6],
    ["expense", 150, "Bills", "Jio recharge split", "UPI", 7],
    ["expense", 600, "Entertainment", "Movie + popcorn", "UPI", 8],
    ["expense", 210, "Transport", "Metro + rapido", "UPI", 10],
    ["expense", 340, "Food", "Cafe with friends", "UPI", 11],
    ["expense", 499, "Education", "Udemy course sale", "Card", 12],
    ["expense", 180, "Health", "Apollo meds", "UPI", 13],
    ["expense", 750, "Travel", "Bus to home", "UPI", 15],
    ["expense", 420, "Food", "Hostel night mess extra", "Cash", 16],
    ["expense", 299, "Subscriptions", "iCloud + YouTube", "Card", 17],
    ["expense", 520, "Shopping", "Stationery + print", "UPI", 18],
  ];
  return rows.map(([type, amount, category, note, pm, day], i) => ({
    id: uid(`demo_t${i}`),
    type: type as "expense" | "income",
    amount,
    category,
    note,
    date: D(day as number, 12 + (i % 8)),
    paymentMethod: pm,
    recurring: category === "Subscriptions",
  }));
}

export function demoBudgets(): Budget[] {
  return [
    { id: uid("b1"), scope: "monthly", category: "Food", limit: 2500, periodKey: "2026-09" },
    { id: uid("b2"), scope: "monthly", category: "Transport", limit: 1000, periodKey: "2026-09" },
    { id: uid("b3"), scope: "monthly", category: "Entertainment", limit: 1200, periodKey: "2026-09" },
    { id: uid("b4"), scope: "monthly", category: "TOTAL", limit: 10000, periodKey: "2026-09" },
  ];
}

export function demoGoals(): SavingsGoal[] {
  return [
    { id: uid("g1"), name: "Boat Headphones", kind: "Headphones", target: 1499, saved: 900, targetDate: "2026-10-31", createdAt: D(1) },
    { id: uid("g2"), name: "Goa Trip Fund", kind: "Trip", target: 8000, saved: 2350, targetDate: "2026-12-20", createdAt: D(2) },
    { id: uid("g3"), name: "Emergency fund", kind: "Emergency fund", target: 5000, saved: 5000, targetDate: "2026-09-30", createdAt: D(1), celebrated: true },
  ];
}

export function demoGroups(): { groups: SplitGroup[]; expenses: GroupExpense[] } {
  const groups: SplitGroup[] = [
    { id: "grp_goa", name: "Goa Trip", members: ["Aditya", "Rahul", "Aman"], createdAt: D(3) },
    { id: "grp_hostel", name: "Hostel Room 204", members: ["Aditya", "Rahul"], createdAt: D(1) },
  ];
  const expenses: GroupExpense[] = [
    { id: uid("ge1"), groupId: "grp_goa", description: "Bus booking", amount: 1200, paidBy: "Aditya", shares: {}, date: D(5) },
    { id: uid("ge2"), groupId: "grp_goa", description: "Snacks + auto", amount: 500, paidBy: "Rahul", shares: {}, date: D(6) },
    { id: uid("ge3"), groupId: "grp_hostel", description: "Wifi split", amount: 600, paidBy: "Rahul", shares: {}, date: D(7) },
  ];
  return { groups, expenses };
}
