// BROKE MUSIC — queue drawer: NOW PLAYING / NEXT UP, reorder, remove,
// clear, save-as-playlist.
"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowDown, ArrowUp, ListMusic, Trash2, X, Save } from "lucide-react";
import { formatTime } from "@/lib/music/format";
import { useMusicLibrary } from "@/store/useMusicLibrary";
import { usePlayer } from "./PlayerProvider";

export function QueueDrawer() {
  const { queue, currentIndex, currentTrack, queueOpen, setQueueOpen, removeFromQueue, clearQueue, moveInQueue, playTrack } = usePlayer();
  const createPlaylist = useMusicLibrary((s) => s.createPlaylist);
  const [saved, setSaved] = useState(false);

  const upNext = queue.slice(currentIndex + 1);

  const save = () => {
    if (queue.length === 0) return;
    createPlaylist(`Queue · ${new Date().toLocaleDateString()}`, queue);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <AnimatePresence>
      {queueOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setQueueOpen(false)}
            className="fixed inset-0 z-[65] bg-black/60 backdrop-blur-sm"
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="glass fixed bottom-0 right-0 top-0 z-[66] flex w-full max-w-md flex-col !rounded-none !border-y-0 !border-r-0"
            role="dialog"
            aria-label="Queue"
          >
            <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
              <h2 className="font-display flex items-center gap-2 text-base font-extrabold text-white">
                <ListMusic size={18} className="text-lime-300" /> Queue
                <span className="rounded-full bg-white/8 px-2 py-0.5 text-[11px] font-bold text-white/60">{queue.length}</span>
              </h2>
              <div className="flex items-center gap-1.5">
                <button onClick={save} className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-white/70 hover:text-white">
                  <Save size={13} /> {saved ? "Saved!" : "Save"}
                </button>
                <button onClick={clearQueue} aria-label="Clear queue" className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/5 text-white/60 hover:text-red-300">
                  <Trash2 size={15} />
                </button>
                <button onClick={() => setQueueOpen(false)} aria-label="Close queue" className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/5 text-white/60 hover:text-white">
                  <X size={15} />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4">
              {currentTrack && (
                <>
                  <p className="mb-2 px-1 text-[11px] font-bold uppercase tracking-[0.2em] text-lime-300/80">Now playing</p>
                  <div className="mb-5 flex items-center gap-3 rounded-2xl border border-lime-300/25 bg-lime-300/[0.06] p-3">
                    {currentTrack.artwork && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={currentTrack.artwork} alt="" className="h-12 w-12 rounded-xl object-cover" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-white">{currentTrack.title}</p>
                      <p className="truncate text-xs text-white/50">{currentTrack.artist}</p>
                    </div>
                    <span className="text-[11px] text-white/40">{formatTime(currentTrack.duration)}</span>
                  </div>
                </>
              )}
              <p className="mb-2 px-1 text-[11px] font-bold uppercase tracking-[0.2em] text-white/40">Next up</p>
              {upNext.length === 0 && (
                <p className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-xs text-white/40">
                  Nothing queued. Hit play on anything — it lands here.
                </p>
              )}
              <div className="space-y-2">
                {upNext.map((t, k) => {
                  const gi = currentIndex + 1 + k;
                  return (
                    <div key={`${t.id}-${gi}`} className="group flex items-center gap-2 rounded-2xl border border-white/5 bg-white/[0.02] p-2">
                      <div className="flex flex-col">
                        <button onClick={() => moveInQueue(gi, Math.max(0, gi - 1))} aria-label="Move up" className="rounded p-1 text-white/35 hover:text-white">
                          <ArrowUp size={12} />
                        </button>
                        <button onClick={() => moveInQueue(gi, Math.min(queue.length - 1, gi + 1))} aria-label="Move down" className="rounded p-1 text-white/35 hover:text-white">
                          <ArrowDown size={12} />
                        </button>
                      </div>
                      {t.artwork && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={t.artwork} alt="" className="h-10 w-10 rounded-lg object-cover" />
                      )}
                      <button onClick={() => playTrack(t, queue)} className="min-w-0 flex-1 text-left">
                        <p className="truncate text-[13px] font-bold text-white">{t.title}</p>
                        <p className="truncate text-[11px] text-white/50">{t.artist}</p>
                      </button>
                      <button onClick={() => removeFromQueue(gi)} aria-label="Remove" className="grid h-8 w-8 place-items-center rounded-full text-white/35 opacity-0 transition hover:bg-white/8 hover:text-red-300 group-hover:opacity-100">
                        <X size={13} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
