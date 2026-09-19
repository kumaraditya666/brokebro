// BROKE MUSIC — PWA install prompt ("Install BROKE MUSIC").
"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Download, Share, Smartphone, X } from "lucide-react";

interface BIP extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
}

const KEY = "bm-install-dismissed";

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BIP | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const h = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIP);
    };
    window.addEventListener("beforeinstallprompt", h);
    const dismissed = localStorage.getItem(KEY);
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone;
    if (!dismissed && !standalone) {
      const t = setTimeout(() => setShow(true), 6000);
      return () => {
        clearTimeout(t);
        window.removeEventListener("beforeinstallprompt", h);
      };
    }
    return () => window.removeEventListener("beforeinstallprompt", h);
  }, []);

  useEffect(() => {
    if (deferred) setShow(true);
  }, [deferred]);

  if (!show) return null;
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) && !deferred;

  const later = () => {
    localStorage.setItem(KEY, String(Date.now()));
    setShow(false);
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt().catch(() => {});
    await deferred.userChoice.catch(() => ({ outcome: "dismissed" }));
    setDeferred(null);
    setShow(false);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[80] grid place-items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:place-items-center" onClick={later} role="dialog" aria-modal="true" aria-label="Install BROKE MUSIC">
        <motion.div
          initial={{ y: 60, opacity: 0, scale: 0.98 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 60, opacity: 0 }}
          className="glass glow-border w-full max-w-sm rounded-[1.75rem] p-6 text-center"
          onClick={(e) => e.stopPropagation()}
        >
          <button onClick={later} aria-label="Dismiss" className="float-right rounded-full p-1 text-white/40 hover:text-white">
            <X size={15} />
          </button>
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-lime-300 to-emerald-400 text-2xl font-black text-black">B</div>
          {isIOS ? (
            <>
              <h3 className="font-display mt-3 text-xl font-extrabold text-white">Add BROKE MUSIC to Home Screen</h3>
              <ol className="mx-auto mt-3 max-w-[260px] space-y-2 text-left text-sm text-white/70">
                <li className="flex gap-2"><Share size={15} className="mt-0.5 shrink-0 text-lime-300" /> Tap <b>Share</b> in Safari</li>
                <li className="flex gap-2"><Smartphone size={15} className="mt-0.5 shrink-0 text-lime-300" /> Tap <b>“Add to Home Screen”</b></li>
                <li className="flex gap-2"><Download size={15} className="mt-0.5 shrink-0 text-lime-300" /> Tap <b>Add</b> — zero bullshit, forever</li>
              </ol>
              <button onClick={later} className="mt-5 w-full rounded-2xl border border-white/15 py-3 text-sm font-bold text-white">Got it</button>
            </>
          ) : (
            <>
              <h3 className="font-display mt-3 text-xl font-extrabold text-white">Install BROKE MUSIC</h3>
              <p className="mt-1.5 text-sm text-white/60">Offline shell, local files, background playback. No ads — ever.</p>
              <div className="mt-5 flex gap-2">
                {deferred && (
                  <button onClick={install} className="flex-1 rounded-2xl bg-gradient-to-r from-lime-300 to-emerald-300 py-3 text-sm font-bold text-black transition hover:-translate-y-0.5">
                    Install now
                  </button>
                )}
                <button onClick={later} className={`rounded-2xl border border-white/15 py-3 text-sm font-bold text-white hover:bg-white/5 ${deferred ? "px-5" : "flex-1"}`}>
                  Later
                </button>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
