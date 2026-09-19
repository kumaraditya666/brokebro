"use client";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Plus, Search, Trash2, Pencil, ScanLine } from "lucide-react";
import { AppShell } from "@/components/brokebro/AppShell";
import { Card, Btn, EmptyState, PageHeader, inputCls, Badge } from "@/components/brokebro/ui";
import { ExpenseModal, catEmoji } from "@/components/brokebro/ExpenseModal";
import { UpiImportFlow } from "@/components/brokebro/UpiImport";
import { afterExpenseSaved } from "@/components/brokebro/pwa-events";
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
  const [show, setShow] = useState(false);
  const [chooser, setChooser] = useState(params.get("action") === "add" || params.get("shared") === "1" || params.get("shared") === "bad");
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [sharedFiles, setSharedFiles] = useState<File[] | null>(null);

  // Web Share Target pickup: Gallery → Share → BrokeBro lands here.
  useEffect(() => {
    if (params.get("shared") !== "1") return;
    fetch("/api/share-target", { credentials: "same-origin" })
      .then(async (r) => {
        if (!r.ok) return;
        const blob = await r.blob();
        if (!blob.size) return;
        setSharedFiles([new File([blob], "shared-screenshot", { type: blob.type || "image/jpeg" })]);
        setChooser(true);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openAdd = () => {
    setEditing(null);
    setChooser(true);
  };

  const expenses = useMemo(() => {
    return txns
      .filter((t) => t.type === "expense")
      .filter((t) => (cat === "All" ? true : t.category === cat))
      .filter((t) => (q ? `${t.note} ${t.category} ${t.amount} ${t.transactionId ?? ""}`.toLowerCase().includes(q.toLowerCase()) : true));
  }, [txns, q, cat]);

  return (
    <AppShell>
      <PageHeader kicker="Money" title="Expense tracker" sub="5-second logging. Type “₹250 Zomato” and we guess the category — you always have the final say."
        right={
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setChooser(true)} className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-2xl border border-lime-300/30 bg-lime-300/10 px-4 py-3 text-sm font-bold text-lime-200 transition hover:bg-lime-300/20 sm:flex-none" aria-label="Scan payment screenshot">
              <ScanLine size={16} /> 📸 Scan
            </button>
            <Btn onClick={openAdd} className="flex-1 whitespace-nowrap sm:flex-none"><Plus size={15} /> Add expense</Btn>
          </div>
        } />
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
        <EmptyState emoji="🧾" title="No expenses yet" body="Your wallet is suspiciously clean 👀 — add your first expense to wake up the dashboard." action={<Btn onClick={openAdd}>+ Add your first expense</Btn>} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {expenses.map((t) => (
            <Card key={t.id} className="transition hover:border-white/20">
              <div className="flex items-start gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/8 text-xl">{catEmoji(t.category)}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{t.note || t.category}</p>
                  <p className="mt-0.5 text-xs text-white/45">{t.category} · {t.paymentMethod} · {t.date.slice(0, 10)}{t.recurring ? " · 🔁 recurring" : ""}{t.source === "upi_screenshot" ? " · 📸 screenshot" : ""}</p>
                </div>
                <p className="font-display text-lg font-extrabold">−{fmtMoney(t.amount, cur)}</p>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <button onClick={() => { setEditing(t); setShow(true); }} className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 px-3 py-1.5 text-xs font-semibold text-white/70 hover:bg-white/5" aria-label={`Edit ${t.note}`}><Pencil size={13} /> Edit</button>
                <button onClick={() => del(t.id)} className="inline-flex items-center gap-1.5 rounded-xl border border-red-500/20 px-3 py-1.5 text-xs font-semibold text-red-300 hover:bg-red-500/10" aria-label={`Delete ${t.note}`}><Trash2 size={13} /> Delete</button>
                {t.source === "upi_screenshot" && <Badge tone="muted">📸 UPI import</Badge>}
              </div>
            </Card>
          ))}
        </div>
      )}

      <UpiImportFlow
        open={chooser}
        onClose={() => setChooser(false)}
        initialFiles={sharedFiles}
        clearInitialFiles={() => setSharedFiles(null)}
        onManual={() => { setEditing(null); setShow(true); }}
        onViewTransaction={(id) => {
          const t = useBroke.getState().transactions.find((x) => x.id === id);
          if (t) {
            setQ(t.merchant || t.note || String(t.amount));
            setCat("All");
          }
        }}
      />

      {show && (
        <ExpenseModal
          initial={editing}
          onClose={() => { setShow(false); setEditing(null); }}
          onSave={(v) => { if (editing) update(editing.id, v); else { add({ ...v, type: "expense", source: "manual" }); afterExpenseSaved(v.category); } setShow(false); setEditing(null); }}
        />
      )}
    </AppShell>
  );
}
