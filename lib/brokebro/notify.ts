"use client";
import { useBroke } from "./store";

/**
 * Local notifications (event-driven, on-device). No push server needed:
 * fires for budget warnings, goal milestones and quest wins while the app runs.
 * Preferences live in the persisted store; denied permission degrades silently.
 */

export type NotifPrefs = { budgets: boolean; goals: boolean; quests: boolean; recaps: boolean };

export async function ensureNotifyPermission(): Promise<NotificationPermission | "unsupported"> {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  try {
    return await Notification.requestPermission();
  } catch {
    return Notification.permission;
  }
}

export function canNotify(kind: keyof NotifPrefs) {
  if (typeof window === "undefined" || !("Notification" in window)) return false;
  if (Notification.permission !== "granted") return false;
  return useBroke.getState().prefs.notifs[kind];
}

export async function localNotify(title: string, body: string, tag: string) {
  try {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission !== "granted") return;
    // Prefer the service worker (works even as favourably as the platform allows),
    // fall back to a page notification.
    const reg = await navigator.serviceWorker?.getRegistration();
    if (reg?.showNotification) {
      await reg.showNotification(title, { body, tag, icon: "/icons/icon-192.png", badge: "/icons/icon-192.png" });
    } else {
      new Notification(title, { body, tag });
    }
  } catch {
    /* never break the app for a notification */
  }
}

/** Called after an expense is saved. Warns once per category at 80%/100%. */
export function notifyBudgetCrossing(category: string, pct: number) {
  if (!canNotify("budgets")) return;
  const key = `nb_${category}_${pct >= 100 ? "100" : "80"}`;
  const seen = useBroke.getState().prefs.notifSeen?.[key];
  if (seen) return;
  useBroke.getState().markNotifSeen(key);
  const s = useBroke.getState();
  s.notify(
    pct >= 100 ? `${category} budget hit 100%` : `${category} budget at ${Math.round(pct)}%`,
    pct >= 100 ? "Over the line — no stress, adjust next week 🌱" : "Heating up — gentle pace from here 🐢"
  );
  localNotify(
    pct >= 100 ? `${category} budget full` : `${category} budget almost full`,
    pct >= 100 ? "You crossed 100%. Future-you says adjust one outing 🌱" : `At ${Math.round(pct)}% — easy does it 🐢`,
    key
  );
}

/** Called after a goal contribution. Celebrates 50% + 100%. */
export function notifyGoalMilestone(goalId: string, pct: number) {
  if (!canNotify("goals")) return;
  const mark = pct >= 100 ? "100" : pct >= 50 ? "50" : null;
  if (!mark) return;
  const key = `ng_${goalId}_${mark}`;
  if (useBroke.getState().prefs.notifSeen?.[key]) return;
  useBroke.getState().markNotifSeen(key);
  const g = useBroke.getState().goals.find((x) => x.id === goalId);
  const name = g?.name ?? "Goal";
  useBroke.getState().notify(
    mark === "100" ? `${name} smashed! 🏆` : `${name} hit 50% 🎯`,
    mark === "100" ? "Fully funded. Screenshot this. You earned it." : "Halfway there — keep the streak alive."
  );
  localNotify(
    mark === "100" ? `${name} smashed! 🏆` : `${name} hit 50% 🎯`,
    mark === "100" ? "Fully funded. Legendary." : "Halfway there — keep going.",
    key
  );
}
