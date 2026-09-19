"use client";
import { useState } from "react";
import { Btn, Field, inputCls } from "./ui";
import { EXPENSE_CATEGORIES, PAYMENT_METHODS, type Transaction } from "@/lib/brokebro/types";
import { parseQuickAdd, suggestCategory } from "@/lib/brokebro/categorize";

export function catEmoji(c: string) {
  const m: Record<string, string> = { Food: "🍜", Transport: "🛵", Entertainment: "🎬", Shopping: "🛍️", Education: "📚", Hostel: "🏠", Bills: "🧾", Health: "💊", Subscriptions: "🔁", Travel: "✈️", Other: "📦" };
  return m[c] ?? "💸";
}

export function ExpenseModal({ initial, onClose, onSave }: { initial: Transaction | null; onClose: () => void; onSave: (v: Omit<Transaction, "id" | "type"> & { type?: Transaction["type"] }) => void }) {
  const [quick, setQuick] = useState(initial?.note ?? "");
  const [amount, setAmount] = useState(initial ? String(initial.amount) : "");
  const [category, setCategory] = useState(initial?.category ?? "Food");
  const [note, setNote] = useState(initial?.note ?? "");
  const [pm, setPm] = useState(initial?.paymentMethod ?? "UPI");
  const [date, setDate] = useState((initial?.date ?? new Date().toISOString()).slice(0, 10));
  const [recurring, setRecurring] = useState(initial?.recurring ?? false);
  const [custom, setCustom] = useState("");
  const suggestion = suggestCategory(quick || note);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose} role="dialog" aria-modal="true" aria-label="Expense form">
      <form
        className="glass pop-in w-full max-w-md rounded-3xl p-6"
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault();
          const parsed = parseQuickAdd(quick);
          const amt = Number(amount) || parsed.amount || 0;
          if (!amt || amt <= 0) return;
          onSave({ amount: Math.round(amt), category: custom || category, note: note || quick, date: new Date(date).toISOString(), paymentMethod: pm, recurring });
        }}
      >
        <h3 className="font-display text-xl font-extrabold">{initial ? "Edit expense" : "Add expense ⚡"}</h3>
        <div className="mt-4 space-y-3.5">
          <Field label="Quick add (try “₹250 Zomato”)">
            <input value={quick} onChange={(e) => { setQuick(e.target.value); const p = parseQuickAdd(e.target.value); if (p.amount && !amount) setAmount(String(p.amount)); const s = suggestCategory(e.target.value); if (s.confidence === "high") setCategory(s.category); }} placeholder="₹250 Zomato" className={inputCls} />
          </Field>
          {(quick || note) && (
            <p className="rounded-2xl border border-lime-300/25 bg-lime-300/8 px-3.5 py-2 text-xs">🤖 AI suggests <b>{suggestion.category}</b> ({suggestion.confidence} confidence) — override freely.</p>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Amount (₹)"><input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" placeholder="250" className={inputCls} required /></Field>
            <Field label="Date"><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Category">
              <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputCls}>
                {EXPENSE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Payment">
              <select value={pm} onChange={(e) => setPm(e.target.value)} className={inputCls}>
                {PAYMENT_METHODS.map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Note"><input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Biryani night with roomies" className={inputCls} /></Field>
          <Field label="Custom category (optional)"><input value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="e.g. Gym fuel" className={inputCls} /></Field>
          <label className="flex items-center gap-2 text-sm text-white/70"><input type="checkbox" checked={recurring} onChange={(e) => setRecurring(e.target.checked)} className="h-4 w-4 accent-lime-300" /> Recurring monthly</label>
          <div className="flex gap-2 pt-1">
            <Btn type="submit" className="flex-1">{initial ? "Save changes" : "Add expense"}</Btn>
            <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
          </div>
          <p className="text-center text-[11px] text-white/35">Private by default. Never leaves your device unless you connect Supabase. 🔒</p>
        </div>
      </form>
    </div>
  );
}
