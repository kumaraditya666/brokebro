"use client";
import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Plus, Search, Trash2, Pencil } from "lucide-react";
import { AppShell } from "@/components/brokebro/AppShell";
import { Card, Btn, EmptyState, PageHeader, inputCls } from "@/components/brokebro/ui";
import { ExpenseModal, catEmoji } from "@/components/brokebro/ExpenseModal";
import { EXPENSE_CATEGORIES, type Transaction } from "@/lib/brokebro/types";
import { useBroke } from "@/lib/brokebro/store";
import { fmtMoney } from "@/lib/brokebro/format";

export default function ExpensesPage() {
  return (
    <Suspense fallback={<div className="shimmer h-64 rounded-3xl" />}>
      <ExpensesInner />
    </Suspense>
  );
}

function ExpensesInner() {
  const txns = useBroke((s) => s.transactions);
  const add = useBroke((s) => s.addTransaction);
  const update = useBroke((s) => s.updateTransaction);
  const del = useBroke((s) => s.deleteTransaction);
  const cur = useBroke((s) => s.profile.currency);
  const params = useSearchParams();
  const [show, setShow] = useState(params.get("action") === "add");
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  const [editing, setEditing] = useState<Transaction | null>(null);

  const expenses = useMemo(() => {
    return txns
      .filter((t) => t.type === "expense")
      .filter((t) => (cat === "All" ? true : t.category === cat))
      .filter((t) => (q ? `${t.note} ${t.category} ${t.amount}`.toLowerCase().includes(q.toLowerCase()) : true));
  }, [txns, q, cat]);

  return (
    <AppShell>
      <PageHeader kicker="Money" title="Expense tracker" sub="5-second logging. Type “₹250 Zomato” and we guess the category — you always have the final say."
        right={<Btn onClick={() => { setEditing(null); setShow(true); }}><Plus size={15} /> Add expense</Btn>} />
      <div className="mb-4 flex flex-wrap gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/35" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search biryani, uber, 500…" className={`${inputCls} pl-10`} aria-label="Search transactions" />
        </div>
        <select value={cat} onChange={(e) => setCat(e.target.value)} className="rounded-2xl border border-white/12 bg-black/40 px-4 py-3 text-sm" aria-label="Filter by category">
          <option>All</option>
          {EXPENSE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>

      {expenses.length === 0 ? (
        <EmptyState emoji="🧾" title="No expenses yet" body="Your wallet is suspiciously clean 👀 — add your first expense to wake up the dashboard." action={<Btn onClick={() => setShow(true)}>+ Add your first expense</Btn>} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {expenses.map((t) => (
            <Card key={t.id} className="transition hover:border-white/20">
              <div className="flex items-start gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/8 text-xl">{catEmoji(t.category)}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{t.note || t.category}</p>
                  <p className="mt-0.5 text-xs text-white/45">{t.category} · {t.paymentMethod} · {t.date.slice(0, 10)}{t.recurring ? " · 🔁 recurring" : ""}</p>
                </div>
                <p className="font-display text-lg font-extrabold">−{fmtMoney(t.amount, cur)}</p>
              </div>
              <div className="mt-3 flex gap-2">
                <button onClick={() => { setEditing(t); setShow(true); }} className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 px-3 py-1.5 text-xs font-semibold text-white/70 hover:bg-white/5" aria-label={`Edit ${t.note}`}><Pencil size={13} /> Edit</button>
                <button onClick={() => del(t.id)} className="inline-flex items-center gap-1.5 rounded-xl border border-red-500/20 px-3 py-1.5 text-xs font-semibold text-red-300 hover:bg-red-500/10" aria-label={`Delete ${t.note}`}><Trash2 size={13} /> Delete</button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {show && (
        <ExpenseModal
          initial={editing}
          onClose={() => { setShow(false); setEditing(null); }}
          onSave={(v) => { if (editing) update(editing.id, v); else add({ ...v, type: "expense" }); setShow(false); setEditing(null); }}
        />
      )}
    </AppShell>
  );
}


