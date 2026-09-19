"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Smartphone, Share, X, RefreshCw, Download } from "lucide-react";
import { applyTheme, useBroke } from "@/lib/brokebro/store";
import { isIOS, isStandalone, pendingCount, useOnline, buzz } from "@/lib/brokebro/pwa";
import { shouldShowInstall } from "@/lib/brokebro/pwa-gate";
import { useMounted } from "@/lib/brokebro/use-mounted";
import { syncNow } from "@/lib/brokebro/sync";

/** One-time boot tasks: engagement counting + theme application + OS theme follow. */
export function PwaBoot() {
  useEffect(() => {
    useBroke.getState().bumpVisit();
    applyTheme(useBroke.getState().prefs.theme);
    // Remove the boot splash AFTER hydration (timer removal races hydration).
    const splash = document.getElementById("boot-splash");
    if (splash) {
      splash.classList.add("boot-done");
      setTimeout(() => splash.remove(), 450);
    }
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const onChange = () => {
      if (useBroke.getState().prefs.theme === "system") applyTheme("system");
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return null;
}

/** Global network status: offline bar, pending outbox count, reconnect sync. */
export function OfflineBar() {
  const mounted = useMounted();
  const { online, syncOnReconnect } = useOnline();
  const txns = useBroke((s) => s.transactions);
  const budgets = useBroke((s) => s.budgets);
  const goals = useBroke((s) => s.goals);
  const [flash, setFlash] = useState<string | null>(null);
  const wasOffline = useRef(false);

  const pending = pendingCount(txns, budgets, goals);

  useEffect(() => {
    if (online === "offline") {
      wasOffline.current = true;
      return;
    }
    if (wasOffline.current) {
      wasOffline.current = false;
      setFlash("Back online ✓");
      syncOnReconnect().then((r) => {
        if (r.ok) {
          setFlash(r.pushed > 0 ? `${r.pushed} transaction${r.pushed > 1 ? "s" : ""} synced ✓` : "Synced ✓");
          buzz(15);
        }
        setTimeout(() => setFlash(null), 4000);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [online]);

  // Tab refocus = sync attempt (the Background-Sync equivalent where unsupported).
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "visible" && navigator.onLine) {
        syncNow().then((r) => {
          if (r.ok) useBroke.getState().setCloud({ status: "synced", error: null });
        });
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  // navigator.onLine differs between SSR (always online) and a device that loads
  // while offline — render nothing until mounted so hydration always matches.
  if (!mounted) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[70] flex justify-center px-4 pt-[max(0.5rem,env(safe-area-inset-top))]" aria-live="polite">
      <AnimatePresence>
        {online === "offline" && (
          <motion.div key="off" initial={{ y: -60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -60, opacity: 0 }} className="offline-bar pointer-events-auto rounded-2xl border border-amber-300/40 bg-[#1a1408]/95 px-4 py-2.5 text-center text-xs font-bold text-amber-200 shadow-card backdrop-blur">
            📴 You&apos;re offline{pending > 0 ? ` · ${pending} saved offline 📥` : ""} — everything still works, syncs later.
          </motion.div>
        )}
        {online === "online" && flash && (
          <motion.div key="on" initial={{ y: -60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -60, opacity: 0 }} className="offline-bar pointer-events-auto rounded-2xl border border-emerald-300/40 bg-[#07130c]/95 px-4 py-2.5 text-center text-xs font-bold text-emerald-200 shadow-card backdrop-blur">
            {flash}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** "New version available" toast. Never interrupts; user applies when ready. */
export function UpdateToast() {
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    let reg: ServiceWorkerRegistration | undefined;
    let timer: ReturnType<typeof setInterval>;
    navigator.serviceWorker.getRegistration().then((r) => {
      reg = r ?? undefined;
      if (!reg) return;
      reg.addEventListener("updatefound", () => {
        const sw = reg!.installing;
        if (!sw) return;
        sw.addEventListener("statechange", () => {
          if (sw.state === "installed" && navigator.serviceWorker.controller) setWaiting(sw);
        });
      });
      timer = setInterval(() => reg?.update().catch(() => {}), 60 * 60 * 1000);
    });
    const onController = () => window.location.reload();
    navigator.serviceWorker.addEventListener("controllerchange", onController);
    return () => {
      clearInterval(timer);
      navigator.serviceWorker.removeEventListener("controllerchange", onController);
    };
  }, []);

  const apply = useCallback(() => {
    waiting?.postMessage({ type: "SKIP_WAITING" });
    setTimeout(() => window.location.reload(), 800);
  }, [waiting]);

  return (
    <AnimatePresence>
      {waiting && (
        <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }} className="fixed inset-x-0 bottom-24 z-[70] mx-auto w-fit rounded-2xl border border-lime-300/30 bg-black/90 px-5 py-3.5 text-center shadow-card backdrop-blur">
          <p className="text-sm font-bold">New BrokeBro update available 🚀</p>
          <button onClick={apply} className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-lime-300 to-emerald-300 px-5 py-2 text-xs font-bold text-black">
            <RefreshCw size={13} /> Update Now
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface BIPEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
}

/** Engagement-gated install prompt: Android/desktop modal, iOS share-guide. */
export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [show, setShow] = useState(false);
  const visits = useBroke((s) => s.prefs.visits);
  const dismissedAt = useBroke((s) => s.prefs.installDismissedAt);
  const txns = useBroke((s) => s.transactions.length);

  useEffect(() => {
    const h = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
    };
    window.addEventListener("beforeinstallprompt", h);
    return () => window.removeEventListener("beforeinstallprompt", h);
  }, []);

  useEffect(() => {
    if (!shouldShowInstall({ standalone: isStandalone(), dismissedAt, visits, txns, promptable: !!deferred, ios: isIOS() })) return;
    const t = setTimeout(() => setShow(true), 2500);
    return () => clearTimeout(t);
  }, [deferred, visits, txns, dismissedAt]);

  const later = () => {
    useBroke.getState().dismissInstall();
    setShow(false);
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    const choice = await deferred.userChoice.catch(() => ({ outcome: "dismissed" }));
    if (choice.outcome !== "dismissed") setShow(false);
    else later();
    setDeferred(null);
    buzz(20);
  };

  const ios = !deferred && isIOS();

  return (
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 z-[80] grid place-items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:place-items-center" onClick={later} role="dialog" aria-modal="true" aria-label="Install BrokeBro">
          <motion.div initial={{ y: 60, opacity: 0, scale: 0.98 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 60, opacity: 0 }} className="glass glow-border w-full max-w-sm rounded-[1.75rem] p-6 text-center" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-lime-300 to-emerald-400 text-2xl">📱</div>
            {ios ? (
              <>
                <h3 className="font-display mt-3 text-xl font-extrabold">Add BrokeBro to your Home Screen</h3>
                <ol className="mx-auto mt-3 max-w-[260px] space-y-2 text-left text-sm text-white/70">
                  <li className="flex gap-2"><Share size={15} className="mt-0.5 shrink-0 text-lime-300" /> Step 1: Tap <b>Share</b> in Safari</li>
                  <li className="flex gap-2"><Smartphone size={15} className="mt-0.5 shrink-0 text-lime-300" /> Step 2: Tap <b>“Add to Home Screen”</b></li>
                  <li className="flex gap-2"><Download size={15} className="mt-0.5 shrink-0 text-lime-300" /> Step 3: Tap <b>Add</b> — done 🎉</li>
                </ol>
              </>
            ) : (
              <>
                <h3 className="font-display mt-3 text-xl font-extrabold">Make BrokeBro an app 📱</h3>
                <p className="mt-1.5 text-sm text-white/60">Track your money faster from your home screen. Your money, but less boring.</p>
              </>
            )}
            <div className="mt-5 flex gap-2">
              {!ios && (
                <button onClick={install} className="flex-1 rounded-2xl bg-gradient-to-r from-lime-300 to-emerald-300 py-3 text-sm font-bold text-black transition hover:-translate-y-0.5">
                  Install BrokeBro
                </button>
              )}
              <button onClick={later} className={`rounded-2xl border border-white/15 py-3 text-sm font-bold hover:bg-white/5 ${ios ? "flex-1" : "px-5"}`}>
                {ios ? "Got it" : "Maybe Later"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
