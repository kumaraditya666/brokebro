export type Currency = "INR" | "USD" | "EUR" | "GBP" | "AED" | "SGD";

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
  AED: "د.إ ",
  SGD: "S$",
};

export type TxnType = "expense" | "income";

export interface Transaction {
  id: string;
  type: TxnType;
  amount: number;
  category: string;
  note: string;
  date: string; // ISO
  paymentMethod: string;
  recurring?: boolean;
}

export interface Budget {
  id: string;
  scope: "monthly" | "weekly";
  category: string | "TOTAL";
  limit: number;
  periodKey: string; // e.g. 2026-09
}

export interface SavingsGoal {
  id: string;
  name: string;
  kind: string;
  target: number;
  saved: number;
  targetDate?: string;
  createdAt: string;
  celebrated?: boolean;
}

export interface SplitGroup {
  id: string;
  name: string;
  members: string[];
  createdAt: string;
}

export interface GroupExpense {
  id: string;
  groupId: string;
  description: string;
  amount: number;
  paidBy: string;
  shares: Record<string, number>; // member -> share weight (default 1)
  date: string;
}

export interface Quest {
  id: string;
  title: string;
  desc: string;
  xp: number;
  badge: string;
  check: string; // rule key
  target: number;
}

export interface Profile {
  name: string;
  currency: Currency;
  monthlyIncome: number;
  nextIncomeDate: string;
  savingsGoalName?: string;
  onboarded: boolean;
}

export const EXPENSE_CATEGORIES = [
  "Food",
  "Transport",
  "Entertainment",
  "Shopping",
  "Education",
  "Hostel",
  "Bills",
  "Health",
  "Subscriptions",
  "Travel",
  "Other",
] as const;

export const INCOME_SOURCES = [
  "Allowance",
  "Salary",
  "Freelance",
  "Tutoring",
  "Design",
  "Gifts",
  "Other",
] as const;

export const PAYMENT_METHODS = ["UPI", "Cash", "Card", "Netbanking", "Wallet", "Other"] as const;
