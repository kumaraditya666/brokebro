"use client";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { AppShell } from "@/components/brokebro/AppShell";
import { Card, Btn, PageHeader, Field, inputCls, EmptyState } from "@/components/brokebro/ui";
import { INCOME_SOURCES } from "@/lib/brokebro/types";
import { useBroke } from "@/lib/brokebro/store";
import { fmtMoney } from "@/lib/brokebro/format";

export default function IncomePage() {
  const txns = useBroke((s) => s.transactions);
  const add = useBroke((s) => s.addTransaction);
  const del = useBroke((s) => s.deleteTransaction);
  const cur = useBroke((s) => s.profile.currency);
  const [show, setShow] = useState(false);
  const [amount, setAmount] = useState("");
  const [source, setSource] = useState("Allowance");
  const [note, setNote] = useState("");

  const incomes = txns.filter((t) => t.type === "income");
  const total = incomes.reduce((a, t) => a + t.amount, 0);
  const bySource = new Map<string, number>();
  for (const t of incomes) bySource.set(t.category, (bySource.get(t.category) ?? 0) + t.amount);

  return (
    <AppShell>
      <PageHeader kicker="Income Lab" title="Student income tracker" sub="Allowance, freelance, tutoring, design gigs, gifts — track it all. No guaranteed-income promises, just clarity."
        right={<Btn onClick={() => setShow(true)}><Plus size={15} /> Add income</Btn>} />
      <div className="grid gap-4 lg:grid-cols-3">
        <Card glow>
          <p className="text-xs font-bold uppercase tracking-widest text-white/45">Total income (this view)</p>
          <p className="font-display mt-1 text-4xl font-extrabold text-emerald-300">{fmtMoney(total, cur)}</p>
          <p className="mt-1 text-xs text-white/50">Side-hustle energy. Keep receipts, stay consistent. 🌱</p>
        </Card>
        <Card className="lg:col-span-2">
          <h3 className="font-display font-bold">Income by source</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {[...bySource.entries()].map(([k, v]) => (
              <span key={k} className="rounded-2xl border border-white/10 bg-black/30 px-4 py-2.5 text-sm"><b>{k}</b> · {fmtMoney(v, cur)}</span>
            ))}
            {bySource.size === 0 && <p className="text-sm text-white/50">Nothing yet — add allowance or a gig.</p>}
          </div>
          <div className="mt-4 rounded-2xl border border-white/8 bg-black/30 p-4 text-sm text-white/60">
            <b className="text-white">Student income ideas (education, not promises):</b> tutoring juniors · design/thumbnail gigs · campus ambassador · content editing · event volunteering (paid) · selling notes/printables. Track experiments here and see what actually pays.
          </div>
        </Card>
      </div>

      <h3 className="font-display mb-3 mt-6 font-bold">All income</h3>
      {incomes.length === 0 ? (
        <EmptyState emoji="💰" title="No income logged" body="Allowance day deserves a log entry. Add it and watch the balance breathe." action={<Btn onClick={() => setShow(true)}>+ Add income</Btn>} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {incomes.map((t) => (
            <Card key={t.id}>
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-300/12 text-xl">💰</span>
                <div className="flex-1"><p className="font-semibold">{t.note || t.category}</p><p className="text-xs text-white/45">{t.category} · {t.date.slice(0, 10)}</p></div>
                <p className="font-display font-extrabold text-emerald-300">+{fmtMoney(t.amount, cur)}</p>
                <button onClick={() => del(t.id)} className="rounded-xl border border-red-500/20 p-2 text-red-300 hover:bg-red-500/10" aria-label="Delete income"><Trash2 size={14} /></button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {show && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4" onClick={() => setShow(false)} role="dialog" aria-modal="true" aria-label="Add income">
          <form className="glass pop-in w-full max-w-md rounded-3xl p-6" onClick={(e) => e.stopPropagation()} onSubmit={(e) => { e.preventDefault(); const a = Number(amount); if (!a || a <= 0) return; add({ amount: Math.round(a), category: source, note, date: new Date().toISOString(), paymentMethod: "UPI", type: "income" }); setShow(false); setAmount(""); setNote(""); }}>
            <h3 className="font-display text-xl font-extrabold">Add income 💸</h3>
            <div className="mt-4 space-y-3.5">
              <Field label="Amount"><input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" placeholder="12000" className={inputCls} required /></Field>
              <Field label="Source"><select value={source} onChange={(e) => setSource(e.target.value)} className={inputCls}>{INCOME_SOURCES.map((s) => <option key={s}>{s}</option>)}</select></Field>
              <Field label="Note"><input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Monthly allowance" className={inputCls} /></Field>
              <div className="flex gap-2"><Btn type="submit" className="flex-1">Add income</Btn><Btn variant="ghost" onClick={() => setShow(false)}>Cancel</Btn></div>
            </div>
          </form>
        </div>
      )}
    </AppShell>
  );
}
