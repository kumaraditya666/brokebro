import { describe, expect, it } from "vitest";
import {
  affordability,
  brokeMeter,
  calculateBalance,
  calculateBudgetUsage,
  calculateDailySpend,
  calculateGoalETA,
  calculateSplitSettlement,
} from "./calc";

describe("brokebro calc engine", () => {
  it("balance = income - spending", () => {
    const r = calculateBalance([
      { id: "1", type: "income", amount: 10000, category: "Allowance", note: "", date: "2026-09-01", paymentMethod: "UPI" },
      { id: "2", type: "expense", amount: 2500, category: "Food", note: "", date: "2026-09-02", paymentMethod: "UPI" },
    ]);
    expect(r).toMatchObject({ income: 10000, spending: 2500, balance: 7500 });
  });

  it("daily spend guards zero days", () => {
    expect(calculateDailySpend(3000, 12)).toBeCloseTo(250);
    expect(calculateDailySpend(3000, 0)).toBe(3000);
    expect(calculateDailySpend(-500, 10)).toBe(0);
  });

  it("budget usage statuses", () => {
    expect(calculateBudgetUsage(1820, 2500).status).toBe("watch");
    expect(calculateBudgetUsage(2400, 2500).status).toBe("warn");
    expect(calculateBudgetUsage(2600, 2500).status).toBe("over");
  });

  it("broke meter stays in range", () => {
    const m = brokeMeter(4200, 10000, 16, 0.5);
    expect(m.score).toBeGreaterThanOrEqual(0);
    expect(m.score).toBeLessThanOrEqual(100);
  });

  it("goal ETA", () => {
    expect(calculateGoalETA({ id: "g", name: "Laptop", kind: "Laptop", target: 50000, saved: 20000, createdAt: "2026-09-01" }, 5000).months).toBe(6);
  });

  it("split settlement simplifies debts", () => {
    const { settlements } = calculateSplitSettlement(["Aditya", "Rahul", "Aman"], [
      { id: "e1", groupId: "g", description: "Dinner", amount: 1200, paidBy: "Aditya", shares: {}, date: "2026-09-01" },
      { id: "e2", groupId: "g", description: "Auto", amount: 500, paidBy: "Rahul", shares: {}, date: "2026-09-02" },
    ]);
    expect(settlements.length).toBeGreaterThan(0);
    const total = settlements.reduce((a, s) => a + s.amount, 0);
    expect(total).toBeGreaterThan(0);
  });

  it("affordability math", () => {
    const r = affordability(4200, 1499, "2026-10-05", new Date("2026-09-19T00:00:00Z"));
    expect(r.after).toBe(2701);
    expect(r.daysLeft).toBeGreaterThan(10);
  });
});
