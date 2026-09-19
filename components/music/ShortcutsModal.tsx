// BROKE MUSIC — keyboard shortcut help modal.
"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

const ROWS: [string, string][] = [
  ["Space", "Play / pause"],
  ["← / →", "Seek 10s (or prev / next at edges)"],
  ["M", "Mute"],
  ["F", "Fullscreen player"],
  ["Q", "Queue"],
  ["/", "Search"],
  ["Esc", "Close overlays"],
];

export function ShortcutsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {open && (
        <div className="sheet-mobile fixed inset-0 z-[85] grid place-items-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose} role="dialog" aria-modal="true" aria-label="Keyboard shortcuts">
          <motion.div
            initial={{ y: 40, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 40, opacity: 0 }}
            className="glass w-full max-w-sm rounded-[1.75rem] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-extrabold text-white">Shortcuts</h3>
              <button onClick={onClose} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-full bg-white/5 text-white/60 hover:text-white">
                <X size={15} />
              </button>
            </div>
            <div className="mt-4 space-y-2">
              {ROWS.map(([k, v]) => (
                <div key={k} className="flex items-center justify-between rounded-xl bg-white/[0.03] px-3.5 py-2.5">
                  <span className="text-[13px] text-white/70">{v}</span>
                  <kbd className="rounded-lg border border-white/12 bg-white/5 px-2.5 py-1 text-[11px] font-bold text-lime-200">{k}</kbd>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
