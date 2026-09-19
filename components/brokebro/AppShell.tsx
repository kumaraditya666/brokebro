"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard, Receipt, Wallet, PiggyBank, Users, Sparkles,
  FlaskConical, Trophy, Gift, BarChart3, User, Plus, Search, LogOut, Zap,
} from "lucide-react";
import { cn } from "@/lib/brokebro/format";
import { useBroke } from "@/lib/brokebro/store";
import { CloudSync } from "./CloudSync";
import { SyncBadge } from "./SyncBadge";

const NAV = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/expenses", label: "Money", icon: Receipt },
  { href: "/goals", label: "Goals", icon: PiggyBank },
  { href: "/friends", label: "Friends", icon: Users },
  { href: "/profile", label: "Profile", icon: User },
];

const SIDE = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/expenses", label: "Expenses", icon: Receipt },
  { href: "/income", label: "Income Lab", icon: Wallet },
  { href: "/budgets", label: "Budgets", icon: PiggyBank },
  { href: "/afford", label: "Can I afford this?", icon: Search },
  { href: "/simulator", label: "What-If Lab", icon: FlaskConical },
  { href: "/goals", label: "Savings Goals", icon: Gift },
  { href: "/friends", label: "Split with Friends", icon: Users },
  { href: "/quests", label: "Money Quests", icon: Trophy },
  { href: "/wrapped", label: "Money Wrapped", icon: Sparkles },
  { href: "/coach", label: "Money Coach", icon: Zap },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/personality", label: "Personality", icon: Sparkles },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const [cmdk, setCmdk] = useState(false);
  const xp = useBroke((s) => s.xp);
  const streak = useBroke((s) => s.streak);
  const demoMode = useBroke((s) => s.demoMode);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmdk((v) => !v);
      }
      if (e.key === "Escape") setCmdk(false);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  const CMDS = [
    { label: "Add expense", hint: "expenses", run: () => router.push("/expenses?action=add") },
    { label: "Add income", hint: "income", run: () => router.push("/income?action=add") },
    { label: "View dashboard", hint: "home", run: () => router.push("/dashboard") },
    { label: "Create goal", hint: "goals", run: () => router.push("/goals?action=add") },
    { label: "Split expense", hint: "friends", run: () => router.push("/friends") },
    { label: "Can I afford this?", hint: "check", run: () => router.push("/afford") },
    { label: "Open Money Coach", hint: "ai", run: () => router.push("/coach") },
    { label: "View Wrapped", hint: "recap", run: () => router.push("/wrapped") },
  ];
  const [q, setQ] = useState("");
  const filtered = CMDS.filter((c) => c.label.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="min-h-screen bg-ink text-white">
      <CloudSync />
      {/* desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-white/8 bg-black/50 p-4 backdrop-blur-xl lg:flex" aria-label="Primary">
        <Link href="/" className="flex items-center gap-2.5 rounded-2xl px-2 py-3">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-lime-300 to-emerald-400 text-xl font-black text-black shadow-[0_0_25px_rgba(190,242,100,0.4)]">B</span>
          <span className="font-display text-xl font-extrabold tracking-tight">BrokeBro</span>
          {demoMode && <span className="ml-1 rounded-full border border-amber-300/40 bg-amber-300/15 px-2 py-0.5 text-[10px] font-bold text-amber-200">DEMO</span>}
        </Link>
        <button
          onClick={() => setCmdk(true)}
          className="mb-3 flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white/50 hover:border-white/20"
        >
          <Search size={15} /> <span className="flex-1 text-left">Search or command…</span>
          <kbd className="rounded-md border border-white/15 bg-black/50 px-1.5 py-0.5 text-[11px]">⌘K</kbd>
        </button>
        <nav className="flex-1 space-y-1 overflow-y-auto">
          {SIDE.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-medium transition",
                path === n.href || path.startsWith(n.href + "/")
                  ? "bg-lime-300/12 text-lime-200 shadow-[inset_0_0_0_1px_rgba(190,242,100,0.25)]"
                  : "text-white/60 hover:bg-white/5 hover:text-white"
              )}
            >
              <n.icon size={17} /> {n.label}
            </Link>
          ))}
        </nav>
        <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 p-3.5 text-sm">
          <div className="flex items-center justify-between text-xs text-white/55">
            <span className="flex items-center gap-1.5"><Zap size={13} className="text-lime-300" /> {xp} XP</span>
            <span>🔥 {streak}-day streak</span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <SyncBadge />
            <Link href="/quests" className="text-xs font-bold text-lime-200 hover:underline">View quests →</Link>
          </div>
        </div>
      </aside>

      {/* mobile top bar */}
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-white/8 bg-ink/85 px-4 py-3 backdrop-blur-xl lg:hidden">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-lime-300 to-emerald-400 text-lg font-black text-black">B</span>
          <span className="font-display text-lg font-extrabold">BrokeBro</span>
        </Link>
        <div className="ml-auto flex items-center gap-2 text-xs text-white/60">
          <SyncBadge compact />
          <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1">🔥 {streak}</span>
          <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1">⚡ {xp}</span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 pb-28 pt-6 sm:px-6 lg:pl-72 lg:pr-8">{children}</main>

      {/* mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-black/85 backdrop-blur-xl lg:hidden" aria-label="Mobile">
        <div className="mx-auto grid max-w-md grid-cols-5 px-2 pb-[env(safe-area-inset-bottom)] pt-2">
          {NAV.map((n) => {
            const active = path === n.href || (n.href !== "/dashboard" && path.startsWith(n.href));
            return (
              <Link key={n.href} href={n.href} className={cn("flex flex-col items-center gap-1 rounded-2xl py-2 text-[11px] font-semibold", active ? "text-lime-300" : "text-white/50")}>
                <n.icon size={20} />
                {n.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* floating quick add (desktop) */}
      <Link href="/expenses?action=add" className="fixed bottom-6 right-6 z-40 hidden h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-lime-300 to-emerald-300 text-black shadow-[0_0_35px_rgba(190,242,100,0.5)] transition hover:scale-105 lg:grid" aria-label="Add expense">
        <Plus size={24} strokeWidth={2.5} />
      </Link>

      {cmdk && (
        <div className="fixed inset-0 z-50 grid place-items-start justify-center bg-black/70 p-4 pt-[12vh] backdrop-blur-sm" onClick={() => setCmdk(false)} role="dialog" aria-modal="true" aria-label="Command menu">
          <div className="glass w-full max-w-lg overflow-hidden rounded-3xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
              <Search size={16} className="text-white/40" />
              <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Type a command…" className="w-full bg-transparent text-sm outline-none placeholder:text-white/30" aria-label="Command search" />
              <kbd className="rounded-md border border-white/15 px-1.5 text-[11px] text-white/40">esc</kbd>
            </div>
            <div className="max-h-72 overflow-y-auto p-2">
              {filtered.map((c) => (
                <button key={c.label} onClick={() => { setCmdk(false); setQ(""); c.run(); }} className="flex w-full items-center justify-between rounded-2xl px-3.5 py-3 text-left text-sm hover:bg-lime-300/10">
                  <span className="font-medium">{c.label}</span>
                  <span className="text-xs text-white/35">{c.hint}</span>
                </button>
              ))}
              {filtered.length === 0 && <p className="px-4 py-6 text-center text-sm text-white/45">Nothing found. Try “afford” or “coach”.</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function MarketingNav() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/8 bg-ink/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3.5 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-lime-300 to-emerald-400 text-lg font-black text-black">B</span>
          <span className="font-display text-lg font-extrabold">BrokeBro</span>
        </Link>
        <nav className="ml-6 hidden items-center gap-5 text-sm text-white/60 md:flex" aria-label="Site">
          <a href="#features" className="hover:text-white">Features</a>
          <a href="#coach" className="hover:text-white">AI Coach</a>
          <a href="#wrapped" className="hover:text-white">Wrapped</a>
          <a href="#quests" className="hover:text-white">Quests</a>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Link href="/login" className="rounded-2xl px-4 py-2.5 text-sm font-semibold text-white/70 hover:text-white">Log in</Link>
          <Link href="/dashboard" className="rounded-2xl bg-gradient-to-r from-lime-300 to-emerald-300 px-5 py-2.5 text-sm font-bold text-black shadow-[0_0_25px_rgba(190,242,100,0.35)] transition hover:-translate-y-0.5">Start Tracking</Link>
        </div>
      </div>
    </header>
  );
}
