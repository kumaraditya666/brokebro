"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Budget, Currency, GroupExpense, Profile, SavingsGoal, SplitGroup, Transaction } from "./types";
import { demoBudgets, demoGoals, demoGroups, demoTransactions } from "./demo-data";
import { monthKey, uid } from "./format";

export interface QuestProgress { questId: string; progress: number; done: boolean; xpClaimed: boolean; }
export interface AppNotification { id: string; title: string; body: string; at: string; read: boolean; }

export type ThemePref = "dark" | "light" | "system";

export interface Prefs {
  theme: ThemePref;
  notifs: { budgets: boolean; goals: boolean; quests: boolean; recaps: boolean };
  notifSeen: Record<string, number>;
  visits: number;
  installDismissedAt: number | null;
}

interface BrokeState {
  profile: Profile;
  transactions: Transaction[];
  budgets: Budget[];
  goals: SavingsGoal[];
  groups: SplitGroup[];
  groupExpenses: GroupExpense[];
  quests: QuestProgress[];
  xp: number;
  streak: number;
  lastLogDate: string | null;
  notifications: AppNotification[];
  demoMode: boolean;
  _hydrated: boolean;
  cloud: { status: "local" | "syncing" | "synced" | "error"; error: string | null; userId: string | null };
  prefs: Prefs;

  setProfile: (p: Partial<Profile>) => void;
  addTransaction: (t: Omit<Transaction, "id">) => void;
  updateTransaction: (id: string, patch: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  addBudget: (b: Omit<Budget, "id">) => void;
  deleteBudget: (id: string) => void;
  addGoal: (g: Omit<SavingsGoal, "id" | "createdAt">) => void;
  contributeGoal: (id: string, amount: number) => void;
  deleteGoal: (id: string) => void;
  addGroup: (name: string, members: string[]) => void;
  addGroupExpense: (e: Omit<GroupExpense, "id">) => void;
  claimQuest: (questId: string, xp: number) => void;
  setQuestProgress: (questId: string, progress: number, done: boolean) => void;
  notify: (title: string, body: string) => void;
  markRead: (id: string) => void;
  loadDemo: () => void;
  clearDemo: () => void;
  resetAll: () => void;
  setCloud: (c: Partial<{ status: "local" | "syncing" | "synced" | "error"; error: string | null; userId: string | null }>) => void;
  setPrefs: (p: Partial<Prefs>) => void;
  setNotifPref: (k: keyof Prefs["notifs"], v: boolean) => void;
  markNotifSeen: (k: string) => void;
  bumpVisit: () => void;
  dismissInstall: () => void;
  importCloud: (d: {
    profile?: Partial<Profile>;
    transactions?: Transaction[];
    budgets?: Budget[];
    goals?: SavingsGoal[];
    notifications?: AppNotification[];
  }) => void;
  remapId: (kind: "txn" | "bud" | "goal", oldId: string, newId: string) => void;
}

const defaultProfile: Profile = {
  name: "",
  currency: "INR",
  monthlyIncome: 12000,
  nextIncomeDate: "2026-10-05",
  onboarded: false,
};

export const QUEST_DEFS = [
  { id: "q_first_log", title: "First log", desc: "Log your first expense", xp: 20, badge: "🌱", check: "logs", target: 1 },
  { id: "q_7day", title: "Log expenses for 7 days", desc: "Consistency > intensity", xp: 100, badge: "🔥", check: "logs", target: 7 },
  { id: "q_save300", title: "Save ₹300 this week", desc: "Move ₹300 to a goal", xp: 60, badge: "🐷", check: "save", target: 300 },
  { id: "q_food_budget", title: "Stay under food budget", desc: "Finish month under Food limit", xp: 80, badge: "🍜", check: "budget", target: 1 },
  { id: "q_first_goal", title: "Complete your first savings goal", desc: "Any goal at 100%", xp: 120, badge: "🏆", check: "goal", target: 1 },
  { id: "q_no_drink", title: "No random drinks week", desc: "Zero cafe/boba splurges for 7 days", xp: 50, badge: "🧋", check: "manual", target: 1 },
];

export function applyTheme(theme: ThemePref) {
  if (typeof document === "undefined") return;
  const light =
    theme === "light" ||
    (theme === "system" && window.matchMedia("(prefers-color-scheme: light)").matches);
  document.documentElement.classList.toggle("theme-light", light);
}

export const useBroke = create<BrokeState>()(
  persist(
    (set, get) => ({
      profile: defaultProfile,
      transactions: [],
      budgets: [],
      goals: [],
      groups: [],
      groupExpenses: [],
      quests: [],
      xp: 0,
      streak: 0,
      lastLogDate: null,
      notifications: [],
      demoMode: false,
      _hydrated: true,
      cloud: { status: "local", error: null, userId: null },
      prefs: {
        theme: "dark",
        notifs: { budgets: true, goals: true, quests: false, recaps: true },
        notifSeen: {},
        visits: 0,
        installDismissedAt: null,
      },

      setProfile: (p) => set((s) => ({ profile: { ...s.profile, ...p } })),
      addTransaction: (t) =>
        set((s) => {
          const today = new Date().toISOString().slice(0, 10);
          const last = s.lastLogDate;
          let streak = s.streak;
          if (last !== today) {
            const y = new Date();
            y.setDate(y.getDate() - 1);
            streak = last === y.toISOString().slice(0, 10) ? streak + 1 : 1;
          }
          return {
            transactions: [{ ...t, id: uid("txn") }, ...s.transactions],
            lastLogDate: today,
            streak,
          };
        }),
      updateTransaction: (id, patch) =>
        set((s) => ({ transactions: s.transactions.map((t) => (t.id === id ? { ...t, ...patch } : t)) })),
      deleteTransaction: (id) => set((s) => ({ transactions: s.transactions.filter((t) => t.id !== id) })),
      addBudget: (b) => set((s) => ({ budgets: [...s.budgets, { ...b, id: uid("bud") }] })),
      deleteBudget: (id) => set((s) => ({ budgets: s.budgets.filter((b) => b.id !== id) })),
      addGoal: (g) => set((s) => ({ goals: [...s.goals, { ...g, id: uid("goal"), createdAt: new Date().toISOString() }] })),
      contributeGoal: (id, amount) =>
        set((s) => ({
          goals: s.goals.map((g) => (g.id === id ? { ...g, saved: Math.min(g.target, g.saved + amount) } : g)),
          xp: s.xp + Math.min(30, Math.round(amount / 50)),
        })),
      deleteGoal: (id) => set((s) => ({ goals: s.goals.filter((g) => g.id !== id) })),
      addGroup: (name, members) =>
        set((s) => ({ groups: [...s.groups, { id: uid("grp"), name, members, createdAt: new Date().toISOString() }] })),
      addGroupExpense: (e) => set((s) => ({ groupExpenses: [{ ...e, id: uid("ge") }, ...s.groupExpenses] })),
      claimQuest: (questId, xp) =>
        set((s) => ({
          xp: s.xp + xp,
          quests: s.quests.map((q) => (q.questId === questId ? { ...q, xpClaimed: true } : q)),
        })),
      setQuestProgress: (questId, progress, done) =>
        set((s) => {
          const ex = s.quests.find((q) => q.questId === questId);
          if (ex) return { quests: s.quests.map((q) => (q.questId === questId ? { ...q, progress, done } : q)) };
          return { quests: [...s.quests, { questId, progress, done, xpClaimed: false }] };
        }),
      notify: (title, body) =>
        set((s) => ({ notifications: [{ id: uid("n"), title, body, at: new Date().toISOString(), read: false }, ...s.notifications].slice(0, 30) })),
      markRead: (id) => set((s) => ({ notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) })),
      loadDemo: () => {
        const { groups, expenses } = demoGroups();
        set({
          transactions: demoTransactions(),
          budgets: demoBudgets(),
          goals: demoGoals(),
          groups,
          groupExpenses: expenses,
          demoMode: true,
          xp: 140,
          streak: 6,
          profile: { name: "Aditya", currency: "INR", monthlyIncome: 12000, nextIncomeDate: "2026-10-05", onboarded: true },
        });
      },
      clearDemo: () =>
        set({
          transactions: [],
          budgets: [],
          goals: [],
          groups: [],
          groupExpenses: [],
          demoMode: false,
          xp: 0,
          streak: 0,
          quests: [],
          notifications: [],
        }),
      resetAll: () =>
        set({
          profile: defaultProfile,
          transactions: [],
          budgets: [],
          goals: [],
          groups: [],
          groupExpenses: [],
          quests: [],
          xp: 0,
          streak: 0,
          notifications: [],
          demoMode: false,
        }),
      importCloud: (d) =>
        set((s) => ({
          profile: d.profile ? { ...s.profile, ...d.profile, onboarded: true } : s.profile,
          transactions: d.transactions ?? s.transactions,
          budgets: d.budgets ?? s.budgets,
          goals: d.goals ?? s.goals,
          notifications: d.notifications ?? s.notifications,
          demoMode: false,
        })),
      remapId: (kind, oldId, newId) =>
        set((s) => {
          if (kind === "txn") return { transactions: s.transactions.map((t) => (t.id === oldId ? { ...t, id: newId } : t)) };
          if (kind === "bud") return { budgets: s.budgets.map((b) => (b.id === oldId ? { ...b, id: newId } : b)) };
          return { goals: s.goals.map((g) => (g.id === oldId ? { ...g, id: newId } : g)) };
        }),
      setCloud: (c) => set((s) => ({ cloud: { ...s.cloud, ...c } })),
      setPrefs: (p) => {
        set((s) => ({ prefs: { ...s.prefs, ...p } }));
        applyTheme(useBroke.getState().prefs.theme);
      },
      setNotifPref: (k, v) => set((s) => ({ prefs: { ...s.prefs, notifs: { ...s.prefs.notifs, [k]: v } } })),
      markNotifSeen: (k) => set((s) => ({ prefs: { ...s.prefs, notifSeen: { ...s.prefs.notifSeen, [k]: Date.now() } } })),
      bumpVisit: () => set((s) => ({ prefs: { ...s.prefs, visits: s.prefs.visits + 1 } })),
      dismissInstall: () => set((s) => ({ prefs: { ...s.prefs, installDismissedAt: Date.now() } })),
    }),
    { name: "brokebro-v1", version: 1 }
  )
);

export function useCurrency(): Currency {
  return useBroke((s) => s.profile.currency);
}

export function currentMonthTxns(txns: Transaction[], key = monthKey()) {
  return txns.filter((t) => t.date.slice(0, 7) === key);
}

export function setCurrencySymbol(_c: Currency) {}
