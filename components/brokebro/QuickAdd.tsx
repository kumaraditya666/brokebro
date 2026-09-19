"use client";
import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Zap, ScanLine, Wallet } from "lucide-react";
import { ExpenseModal } from "./ExpenseModal";
import { UpiImportFlow } from "./UpiImport";
import { useBroke } from "@/lib/brokebro/store";
import { buzz } from "@/lib/brokebro/pwa";
import { afterExpenseSaved } from "./pwa-events";

/** Mobile-only FAB + bottom sheet: the fastest path to logging money. */
export function QuickAddSheet() {
  const [sheet, setSheet] = useState(false);
  const [manual, setManual] = useState(false);
  const [scan, setScan] = useState(false);
  const add = useBroke((s) => s.addTransaction);

  const open = () => {
    buzz(10);
    setSheet(true);
  };

  return (
    <>
      <button
        onClick={open}
        aria-label="Quick add"
        className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] right-4 z-40 grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-lime-300 to-emerald-300 text-black shadow-[0_0_30px_rgba(190,242,100,0.5)] transition active:scale-95 lg:hidden"
      >
        <Plus size={26} strokeWidth={2.5} />
      </button>

      <AnimatePresence>
        {sheet && (
          <div className="fixed inset-0 z-[75] grid place-items-end bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setSheet(false)} role="dialog" aria-modal="true" aria-label="Quick add">
            <motion.div
              initial={{ y: 120, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 120, opacity: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 30 }}
              className="glass w-full rounded-t-[1.75rem] p-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20" />
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-display text-lg font-extrabold">Add money move ⚡</h3>
                <button onClick={() => setSheet(false)} className="rounded-xl p-2 text-white/50 hover:bg-white/5" aria-label="Close"><X size={17} /></button>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => { setSheet(false); setManual(true); }}
                  className="flex items-center gap-3 rounded-2xl border border-lime-300/30 bg-lime-300/10 px-4 py-4 text-left"
                >
                  <Zap size={20} className="shrink-0 text-lime-300" />
                  <span><b className="block text-sm">Quick Expense</b><span className="text-[11px] text-white/45">5 seconds</span></span>
                </button>
                <button
                  onClick={() => { setSheet(false); setScan(true); }}
                  className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-left"
                >
                  <ScanLine size={20} className="shrink-0 text-violet-300" />
                  <span><b className="block text-sm">📸 UPI Shot</b><span className="text-[11px] text-white/45">Gallery / photo</span></span>
                </button>
                <button
                  onClick={() => { setSheet(false); setScan(true); }}
                  className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-left"
                >
                  <span className="text-xl">📷</span>
                  <span><b className="block text-sm">Scan</b><span className="text-[11px] text-white/45">Camera receipt</span></span>
                </button>
                <Link
                  href="/income"
                  onClick={() => setSheet(false)}
                  className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-left"
                >
                  <Wallet size={20} className="shrink-0 text-emerald-300" />
                  <span><b className="block text-sm">💰 Income</b><span className="text-[11px] text-white/45">Allowance, gigs</span></span>
                </Link>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {manual && (
        <ExpenseModal
          initial={null}
          onClose={() => setManual(false)}
          onSave={(v) => {
            add({ ...v, type: "expense", source: "manual" });
            afterExpenseSaved(v.category);
            setManual(false);
          }}
        />
      )}
      <UpiImportFlow open={scan} onClose={() => setScan(false)} onManual={() => { setScan(false); setManual(true); }} />
    </>
  );
}
