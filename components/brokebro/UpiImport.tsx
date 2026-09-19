"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Check, ImagePlus, Pencil, Trash2, TriangleAlert, X, Loader2 } from "lucide-react";
import { Btn, Field, inputCls, Badge } from "./ui";
import { EXPENSE_CATEGORIES, PAYMENT_METHODS, type Transaction } from "@/lib/brokebro/types";
import { useBroke } from "@/lib/brokebro/store";
import { extractTransactionFromImage } from "@/lib/brokebro/upi-client";
import { findDuplicate, type ExistingRef } from "@/lib/brokebro/upi-extract";
import { afterExpenseSaved } from "./pwa-events";
import { fmtMoney } from "@/lib/brokebro/format";
import { supabaseOrNull } from "@/lib/brokebro/supabase";

const PROCESS_STEPS = ["Reading your payment screenshot...", "Finding the important bits 👀", "Almost done..."];

interface ItemForm {
  key: string;
  fileName: string;
  amount: string;
  amountFixed: boolean;
  rawAmount: string;
  merchant: string;
  category: string;
  suggested: string;
  date: string; // yyyy-mm-dd
  time: string;
  payment: string;
  txnType: "Expense" | "Income";
  notes: string;
  transactionId: string;
  status: string;
  refundDetected: boolean;
  conf: Record<string, string>;
  demo: boolean;
  selected: boolean;
  dupAck: boolean;
}

type Stage = "choose" | "processing" | "error" | "review" | "success";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function toISO(date: string, time: string) {
  try {
    const m = time.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?/i);
    let h = 12;
    let min = "00";
    if (m) {
      h = Number(m[1]);
      min = m[2];
      if (m[4]?.toUpperCase() === "PM" && h < 12) h += 12;
      if (m[4]?.toUpperCase() === "AM" && h === 12) h = 0;
    }
    const d = new Date(`${date}T${String(h).padStart(2, "0")}:${min}:00`);
    if (Number.isNaN(d.getTime())) return new Date().toISOString();
    return d.toISOString();
  } catch {
    return new Date().toISOString();
  }
}

export function UpiImportFlow({
  open, onClose, onManual, onViewTransaction, initialFiles, clearInitialFiles,
}: {
  open: boolean;
  onClose: () => void;
  onManual: () => void;
  onViewTransaction?: (id: string) => void;
  /** Share-target / external handoff files: processed immediately on open. */
  initialFiles?: File[] | null;
  clearInitialFiles?: () => void;
}) {
  const txns = useBroke((s) => s.transactions);
  const budgets = useBroke((s) => s.budgets);
  const add = useBroke((s) => s.addTransaction);
  const cur = useBroke((s) => s.profile.currency);
  const notify = useBroke((s) => s.notify);

  const [stage, setStage] = useState<Stage>("choose");
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<ItemForm[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [retainShot, setRetainShot] = useState(false);
  const [saved, setSaved] = useState<{ count: number; total: number; firstId: string; budgetLine: string } | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const camRef = useRef<HTMLInputElement>(null);

  const existing: ExistingRef[] = txns.map((t) => ({
    id: t.id, amount: t.amount, date: t.date, note: t.note, category: t.category, transactionId: t.transactionId ?? null,
  }));

  const consumedShare = useRef<string | null>(null);

  useEffect(() => {
    if (open) {
      setStage("choose");
      setItems([]);
      setSaved(null);
      setError(null);
      consumedShare.current = null;
    }
  }, [open ]);

  useEffect(() => {
    if (stage !== "processing") return;
    const timers = PROCESS_STEPS.map((_, i) => setTimeout(() => setStep(i), i * 900));
    return () => timers.forEach(clearTimeout);
  }, [stage]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape" && stage !== "processing") onClose();
    };
    if (open) window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, stage, onClose]);

  const handleFiles = useCallback(async (files: File[]) => {
    const valid = files.filter((f) => ["image/png", "image/jpeg", "image/webp"].includes(f.type) && f.size > 0 && f.size <= 10 * 1024 * 1024);
    if (valid.length === 0) {
      setError("bad-type");
      setStage("error");
      return;
    }
    setStage("processing");
    setStep(0);
    setError(null);
    const next: ItemForm[] = [];
    let failed = 0;
    for (const f of valid) {
      const url = URL.createObjectURL(f); // preview only; revoked immediately after processing
      try {
        const { extractions, demo, history } = await extractTransactionFromImage(f);
        // One file can hold MANY transactions (history screens) — each row
        // becomes its own review item. Nothing is saved until the user confirms.
        extractions.forEach((extraction, ri) => {
          next.push({
            key: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            fileName: history ? `${f.name} · row ${ri + 1}` : f.name,
            amount: extraction.amount != null ? String(extraction.amount) : "",
            amountFixed: extraction.amountFixed,
            rawAmount: extraction.rawAmount != null ? String(extraction.rawAmount) : "",
            merchant: extraction.merchant ?? "",
            category: extraction.suggestedCategory,
            suggested: extraction.suggestedCategory,
            date: extraction.date ?? todayISO(),
            time: extraction.time ?? "",
            payment: "UPI",
            txnType: extraction.txnType === "Income" ? "Income" : "Expense",
            notes: extraction.merchant ? `${extraction.merchant}${extraction.paymentApp ? ` via ${extraction.paymentApp}` : ""}` : "",
            transactionId: extraction.transactionId ?? "",
            status: extraction.status,
            refundDetected: extraction.refundDetected,
            conf: extraction.confidence as unknown as Record<string, string>,
            demo,
            selected: true,
            dupAck: false,
          });
        });
        if (retainShot) await retainScreenshot(f).catch(() => {});
      } catch (err) {
        failed++;
        // Remember WHY the first file failed so the error screen can say something useful.
        if (next.length === 0 && failed === 1) {
          setError(err instanceof Error ? err.message : "unknown");
        }
      } finally {
        URL.revokeObjectURL(url); // temp image deleted from memory right after processing
      }
    }
    if (next.length === 0) {
      setStage("error");
      return;
    }
    setItems(next);
    setExpanded(next.length === 1 ? next[0].key : null);
    setStage("review");
  }, [retainShot]);

  // Share-target handoff: process immediately, skip the chooser.
  useEffect(() => {
    if (!open || stage !== "choose" || !initialFiles || initialFiles.length === 0) return;
    const key = initialFiles.map((f) => `${f.name}:${f.size}`).join("|");
    if (consumedShare.current === key) return;
    consumedShare.current = key;
    handleFiles(initialFiles);
    clearInitialFiles?.();
  }, [open, stage, initialFiles, handleFiles, clearInitialFiles]);

  const dupFor = (it: ItemForm) =>
    findDuplicate(
      { amount: it.amount ? Number(it.amount) : null, date: it.date, merchant: it.merchant || null, transactionId: it.transactionId || null },
      existing
    );

  const patch = (key: string, p: Partial<ItemForm>) => setItems((arr) => arr.map((it) => (it.key === key ? { ...it, ...p } : it)));

  const saveItems = (list: ItemForm[]) => {
    const valid = list.filter((it) => it.selected && Number(it.amount) > 0);
    if (valid.length === 0) return;
    let firstId = "";
    let total = 0;
    let firstCat = "";
    for (const it of valid) {
      const full: Omit<Transaction, "id"> = {
        type: it.txnType === "Income" ? "income" : "expense",
        amount: Math.round(Number(it.amount)),
        category: it.category,
        note: it.notes || it.merchant || "UPI import",
        date: toISO(it.date, it.time),
        paymentMethod: it.payment,
        merchant: it.merchant || null,
        status: it.status,
        transactionId: it.transactionId || null,
        source: "upi_screenshot",
      };
      add(full);
      if (full.type === "expense") afterExpenseSaved(full.category);
      total += full.amount;
      if (!firstId) {
        firstId = useBroke.getState().transactions[0]?.id ?? "";
        firstCat = full.category;
      }
    }
    // budget impact line
    const b = budgets.find((x) => x.category === firstCat);
    let budgetLine = "";
    if (b) {
      const spent = txns.filter((t) => t.type === "expense" && t.category === firstCat).reduce((a, t) => a + t.amount, 0) + total;
      budgetLine = `Your ${firstCat} budget is now ${Math.round((spent / b.limit) * 100)}% used.`;
    }
    notify("Screenshot imported 💸", `${valid.length} transaction${valid.length > 1 ? "s" : ""} · ${fmtMoney(total, cur)}`);
    setSaved({ count: valid.length, total, firstId, budgetLine });
    setStage("success");
  };

  if (!open) return null;

  return (
    <div className="sheet-mobile fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm" onClick={() => stage !== "processing" && onClose()} role="dialog" aria-modal="true" aria-label="UPI screenshot import">
      <AnimatePresence mode="wait">
        {stage === "choose" && (
          <motion.div key="choose" initial={{ opacity: 0, y: 16, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10 }} className="glass w-full max-w-md rounded-3xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-display text-xl font-extrabold">ADD EXPENSE</h3>
              <button onClick={onClose} className="rounded-xl p-2 text-white/50 hover:bg-white/5" aria-label="Close"><X size={17} /></button>
            </div>
            <div className="mt-4 space-y-2.5">
              <button onClick={() => { onClose(); onManual(); }} className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 text-left transition hover:border-white/25">
                <span className="text-xl">✍️</span><span><b className="block text-sm">Enter manually</b><span className="text-xs text-white/45">5 seconds, full control</span></span>
              </button>
              <button onClick={() => fileRef.current?.click()} className="glow-border flex w-full items-center gap-3 rounded-2xl border border-lime-300/30 bg-lime-300/8 px-4 py-3.5 text-left transition hover:bg-lime-300/15">
                <span className="text-xl">📸</span><span><b className="block text-sm">Upload UPI Screenshot</b><span className="text-xs text-white/50">Got a UPI screenshot? Drop it here. We&apos;ll do the boring typing.</span></span>
              </button>
              <button onClick={() => camRef.current?.click()} className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 text-left transition hover:border-white/25">
                <span className="text-xl">📷</span><span><b className="block text-sm">Scan Screenshot</b><span className="text-xs text-white/45">Camera or gallery — nothing saves without your OK</span></span>
              </button>
            </div>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles([...e.dataTransfer.files]); }}
              className={`mt-3 hidden rounded-2xl border border-dashed px-4 py-5 text-center text-xs transition sm:block ${dragOver ? "border-lime-300/60 bg-lime-300/10 text-lime-200" : "border-white/15 text-white/40"}`}
            >
              {dragOver ? "Drop it like it's hot 🔥" : "…or drag & drop screenshots here (desktop)"}
            </div>
            <label className="mt-3 flex items-start gap-2 text-[11px] text-white/40">
              <input type="checkbox" checked={retainShot} onChange={(e) => setRetainShot(e.target.checked)} className="mt-0.5 h-3.5 w-3.5 accent-lime-300" />
              Keep screenshots in private storage (off by default — we only need the typed data).
            </label>
            <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" multiple className="hidden" aria-label="Upload UPI screenshots" onChange={(e) => { if (e.target.files?.length) handleFiles([...e.target.files]); e.target.value = ""; }} />
            <input ref={camRef} type="file" accept="image/*" capture="environment" className="hidden" aria-label="Scan with camera" onChange={(e) => { if (e.target.files?.length) handleFiles([...e.target.files]); e.target.value = ""; }} />
          </motion.div>
        )}

        {stage === "processing" && (
          <motion.div key="proc" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="glass w-full max-w-sm rounded-3xl p-8 text-center" onClick={(e) => e.stopPropagation()}>
            <div className="relative mx-auto grid h-20 w-20 place-items-center">
              <span className="absolute inset-0 animate-ping rounded-full bg-lime-300/20" />
              <span className="glass grid h-20 w-20 place-items-center rounded-full text-3xl">📸</span>
            </div>
            <p className="font-display mt-5 font-bold" aria-live="polite">{PROCESS_STEPS[step]}</p>
            <div className="mx-auto mt-4 flex items-center justify-center gap-1.5" aria-hidden>
              {PROCESS_STEPS.map((_, i) => <span key={i} className={`h-1.5 rounded-full transition-all ${i <= step ? "w-8 bg-lime-300" : "w-4 bg-white/15"}`} />)}
            </div>
            <p className="mt-3 flex items-center justify-center gap-2 text-xs text-white/40"><Loader2 size={13} className="animate-spin" /> Reading on-device · nothing saved yet</p>
          </motion.div>
        )}

        {stage === "error" && (
          <motion.div key="err" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="glass w-full max-w-sm rounded-3xl p-8 text-center" onClick={(e) => e.stopPropagation()}>
            <div className="text-5xl">😭</div>
            <h3 className="font-display mt-3 text-xl font-extrabold">Couldn&apos;t read this screenshot.</h3>
            <p className="mt-1.5 text-sm text-white/55">{errorCopy(error)}</p>
            <div className="mt-5 flex gap-2">
              <Btn className="flex-1" onClick={() => setStage("choose")}>Try Again</Btn>
              <Btn variant="outline" className="flex-1" onClick={() => { onClose(); onManual(); }}>Enter Manually</Btn>
            </div>
          </motion.div>
        )}

        {stage === "review" && (
          <motion.div key="rev" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="glass w-full max-w-lg rounded-3xl p-6" onClick={(e) => e.stopPropagation()}>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-lime-300/80">👀 We found {items.length > 1 ? `${items.length} transactions` : "a transaction"}</p>
            <h3 className="font-display mt-1 text-2xl font-extrabold">Check everything before we add it.</h3>
            {items.length > 1 && (
              <div className="mt-3 flex items-center gap-2 text-xs">
                <button onClick={() => setItems((a) => a.map((i) => ({ ...i, selected: true })))} className="rounded-full border border-white/15 px-3 py-1.5 font-bold hover:bg-white/5">Select all</button>
                <button onClick={() => setItems((a) => a.map((i) => ({ ...i, selected: false })))} className="rounded-full border border-white/15 px-3 py-1.5 font-bold hover:bg-white/5">Deselect all</button>
                <span className="ml-auto text-white/45">{items.filter((i) => i.selected).length} selected</span>
              </div>
            )}
            <div className="mt-4 max-h-[50vh] space-y-3 overflow-y-auto pr-0.5">
              {items.map((it) => {
                const dup = dupFor(it);
                const open = expanded === it.key;
                const confHi = Object.values(it.conf).filter((c) => c === "high").length;
                return (
                  <div key={it.key} className={`rounded-2xl border p-4 transition ${it.selected ? "border-lime-300/25 bg-black/30" : "border-white/10 bg-black/20 opacity-60"}`}>
                    <div className="flex items-start gap-3">
                      {items.length > 1 && (
                        <input type="checkbox" checked={it.selected} onChange={() => patch(it.key, { selected: !it.selected })} className="mt-1 h-4 w-4 accent-lime-300" aria-label={`Select ${it.fileName}`} />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-display text-2xl font-extrabold">{it.amount ? fmtMoney(Number(it.amount) || 0, cur) : <span className="text-white/40">₹? — add amount</span>}</p>
                        <p className="mt-0.5 truncate text-sm font-semibold">🍔 {it.merchant || "Unknown"} <span className="font-normal text-white/40">· {it.date}{it.time ? ` • ${it.time}` : ""}</span></p>
                        <div className="mt-1.5 flex flex-wrap gap-1.5 text-[11px]">
                          <ConfTick label="Amount" v={it.conf.amount} />
                          <ConfTick label="Merchant" v={it.conf.merchant} />
                          <ConfTick label="Date" v={it.conf.date} />
                          <ConfTick label="Txn ID" v={it.conf.transactionId} />
                          {it.demo && <span className="rounded-full border border-amber-300/40 bg-amber-300/10 px-2 py-0.5 font-bold text-amber-200">DEMO — mock data</span>}
                          {dup.duplicate && <span className="rounded-full border border-pink-400/40 bg-pink-400/10 px-2 py-0.5 font-bold text-pink-200">⚠️ possible duplicate</span>}
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-1.5">
                        <button onClick={() => setExpanded(open ? null : it.key)} className="rounded-xl border border-white/12 p-2 text-white/60 hover:bg-white/5" aria-label={open ? "Collapse editor" : "Edit fields"}><Pencil size={14} /></button>
                        {items.length > 1 && <button onClick={() => setItems((a) => a.filter((x) => x.key !== it.key))} className="rounded-xl border border-red-500/25 p-2 text-red-300 hover:bg-red-500/10" aria-label="Remove"><Trash2 size={14} /></button>}
                      </div>
                    </div>

                    {it.refundDetected && (
                      <p className="mt-2 rounded-xl border border-violet-400/30 bg-violet-400/10 px-3 py-2 text-xs">💸 <b>Refund detected</b> — confirm it should be logged as {it.txnType}. We never reverse old transactions silently.</p>
                    )}

                    {it.amountFixed && (
                      <div className="mt-2 rounded-xl border border-sky-300/30 bg-sky-300/8 px-3 py-2.5 text-xs">
                        <p className="text-sky-200">🔧 Reader saw <b className="font-mono">{it.rawAmount}</b> — we think ₹ was misread as 3, so we corrected it to <b>{it.amount}</b>.</p>
                        <button onClick={() => patch(it.key, { amount: it.rawAmount, amountFixed: false })} className="mt-1.5 rounded-xl border border-sky-300/40 px-3 py-1.5 font-bold text-sky-200 hover:bg-sky-300/10">
                          Wrong — use {it.rawAmount}
                        </button>
                      </div>
                    )}

                    {dup.duplicate && (
                      <div className="mt-2 rounded-xl border border-pink-400/30 bg-pink-400/8 px-3 py-2.5 text-xs">
                        <p className="font-bold text-pink-200">⚠️ This looks like one you&apos;ve already added{dup.strong ? " (same transaction ID)" : ""}.</p>
                        <p className="mt-0.5 text-white/60">{dup.duplicate.note || dup.duplicate.category} · {fmtMoney(dup.duplicate.amount, cur)} · {dup.duplicate.date.slice(0, 10)}</p>
                        <div className="mt-2 flex gap-2">
                          <button onClick={() => patch(it.key, { dupAck: true })} className={`rounded-xl px-3 py-1.5 font-bold ${it.dupAck ? "bg-pink-400/25 text-pink-100" : "border border-pink-400/40 text-pink-200 hover:bg-pink-400/10"}`}>{it.dupAck ? <span className="inline-flex items-center gap-1"><Check size={12} /> Will add anyway</span> : "Add Anyway"}</button>
                          {items.length === 1 && <button onClick={onClose} className="rounded-xl border border-white/15 px-3 py-1.5 font-bold hover:bg-white/5">Cancel</button>}
                        </div>
                      </div>
                    )}

                    {open && (
                      <div className="mt-3 grid grid-cols-2 gap-2.5 border-t border-white/8 pt-3">
                        <Field label="Amount (₹)"><input value={it.amount} onChange={(e) => patch(it.key, { amount: e.target.value })} inputMode="decimal" className={inputCls} aria-label="Amount" /></Field>
                        <Field label="Merchant"><input value={it.merchant} onChange={(e) => patch(it.key, { merchant: e.target.value })} placeholder="Unknown" className={inputCls} aria-label="Merchant" /></Field>
                        <Field label="Category"><select value={it.category} onChange={(e) => patch(it.key, { category: e.target.value })} className={inputCls} aria-label="Category">{EXPENSE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></Field>
                        <Field label="Payment"><select value={it.payment} onChange={(e) => patch(it.key, { payment: e.target.value })} className={inputCls} aria-label="Payment method">{PAYMENT_METHODS.map((c) => <option key={c}>{c}</option>)}</select></Field>
                        <Field label="Date"><input type="date" value={it.date} onChange={(e) => patch(it.key, { date: e.target.value })} className={inputCls} aria-label="Date" /></Field>
                        <Field label="Time"><input value={it.time} onChange={(e) => patch(it.key, { time: e.target.value })} placeholder="7:32 PM" className={inputCls} aria-label="Time" /></Field>
                        <Field label="Type"><select value={it.txnType} onChange={(e) => patch(it.key, { txnType: e.target.value as ItemForm["txnType"] })} className={inputCls} aria-label="Transaction type"><option>Expense</option><option>Income</option></select></Field>
                        <Field label="Transaction ID"><input value={it.transactionId} onChange={(e) => patch(it.key, { transactionId: e.target.value })} placeholder="Not detected" className={inputCls} aria-label="Transaction ID" /></Field>
                        <div className="col-span-2"><Field label="Notes"><input value={it.notes} onChange={(e) => patch(it.key, { notes: e.target.value })} placeholder="Add context…" className={inputCls} aria-label="Notes" /></Field></div>
                        {it.category === it.suggested && it.suggested !== "Other" && <p className="col-span-2 text-[11px] text-white/45">✨ Suggested category: <b className="text-lime-200">{it.suggested}</b> — change freely.</p>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="mt-4 flex gap-2">
              <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
              <Btn
                className="flex-1"
                disabled={!items.some((i) => i.selected && Number(i.amount) > 0 && (!dupFor(i).duplicate || i.dupAck))}
                onClick={() => saveItems(items.filter((i) => !dupFor(i).duplicate || i.dupAck))}
              >
                {items.length > 1 ? `Add ${items.filter((i) => i.selected && Number(i.amount) > 0).length} transactions` : "Add Expense"}
              </Btn>
            </div>
            <p className="mt-2 text-center text-[11px] text-white/35">Nothing is saved until you press that button. Promise. 🔒</p>
          </motion.div>
        )}

        {stage === "success" && saved && (
          <motion.div key="ok" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="glass glow-border w-full max-w-sm rounded-3xl p-8 text-center" onClick={(e) => e.stopPropagation()}>
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 16 }} className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-lime-300 to-emerald-400 text-2xl text-black">✓</motion.div>
            <h3 className="font-display mt-4 text-2xl font-extrabold">Boom. {fmtMoney(saved.total, cur)} logged. 💸</h3>
            {saved.budgetLine && <p className="mt-1.5 text-sm text-white/60">{saved.budgetLine}</p>}
            <p className="mt-1 text-xs text-white/40">Dashboard, budgets, analytics & Broke Meter updated instantly.</p>
            <div className="mt-5 flex gap-2">
              <Btn variant="outline" className="flex-1" onClick={() => { if (saved.firstId && onViewTransaction) { onClose(); onViewTransaction(saved.firstId); } else onClose(); }}>View Transaction</Btn>
              <Btn className="flex-1" onClick={onClose}>Done</Btn>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function errorCopy(code: string | null) {
  switch (code) {
    case "bad-type":
      return "That file won't work — PNG, JPG or WEBP under 10 MB.";
    case "bad-size":
      return "That file is over 10 MB — try a smaller screenshot.";
    case "ocr-empty":
      return "The reader found no text in there — try a clearer, full-screen screenshot.";
    case "ocr-failed":
      return "On-device reading tripped. It needs internet on the first run (fetches a ~2 MB reader), takes 10–30s, and hates blurry crops. Try again, or type it in.";
    case "server-error":
      return "Our helper endpoint hiccuped — try again in a bit, or type it in.";
    default:
      return "That screenshot is playing hard to get 😭 — try a clearer one, or type it in.";
  }
}

function ConfTick({ label, v }: { label: string; v?: string }) {
  if (!v || v === "missing") return <span className="rounded-full border border-white/12 px-2 py-0.5 text-white/40">{label} ?</span>;
  return (
    <span className={`rounded-full border px-2 py-0.5 font-semibold ${v === "high" ? "border-lime-300/30 bg-lime-300/10 text-lime-200" : "border-amber-300/30 bg-amber-300/10 text-amber-200"}`} title={v === "high" ? "Confident" : "Could not confidently detect — please verify"}>
      {label} {v === "high" ? "✓" : "?"}
    </span>
  );
}

/** Optional private screenshot retention (opt-in only). Best-effort; never blocks the flow. */
async function retainScreenshot(file: File) {
  const sb = supabaseOrNull();
  if (!sb) return;
  const { data: session } = await sb.auth.getSession();
  const uid = session.session?.user?.id;
  if (!uid) return;
  const path = `${uid}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  await sb.storage.from("upi-screenshots").upload(path, file, { contentType: file.type, upsert: false });
}
