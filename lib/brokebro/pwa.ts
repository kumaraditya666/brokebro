"use client";
import { useCallback, useEffect, useState } from "react";
import { useBroke } from "./store";
export { useMounted } from "./use-mounted";

/**
 * Network status: online / offline / reconnecting.
 * On reconnect, triggers a cloud sync attempt (the Background-Sync equivalent
 * where the API is unavailable) and reports how many local rows are pending.
 */

export type NetState = "online" | "offline";



export function useOnline() {
  const [online, setOnline] = useState(() =>
    typeof navigator === "undefined" ? true : navigator.onLine
  );
  const cloudUser = useBroke((s) => s.cloud.userId);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  const syncOnReconnect = useCallback(async () => {
    if (!cloudUser) return { ok: false, pushed: 0 };
    const { syncNow } = await import("./sync");
    const before = useBroke.getState();
    const pending = pendingCount(before.transactions, before.budgets, before.goals);
    const r = await syncNow();
    return { ok: r.ok, pushed: r.ok ? pending : 0 };
  }, [cloudUser]);

  return { online: (online ? "online" : "offline") as NetState, syncOnReconnect };
}

/** Rows with local (non-UUID) ids haven't been pushed yet — the offline outbox depth. */
export function pendingCount(
  txns: Array<{ id: string }>,
  budgets: Array<{ id: string }>,
  goals: Array<{ id: string }>
) {
  const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const local = (r: { id: string }) => !UUID.test(r.id);
  return txns.filter(local).length + budgets.filter(local).length + goals.filter(local).length;
}

/** Subtle haptic tap where supported. Never required, always guarded. */
export function buzz(pattern: number | number[] = 12) {
  try {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(pattern);
  } catch {
    /* unsupported — silent */
  }
}

export function isIOS() {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

export function isStandalone() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true;
}
