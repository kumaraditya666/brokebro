"use client";
import { useEffect } from "react";

/**
 * Removes the boot splash AFTER hydration (timer-based removal races hydration
 * and crashes it). Mounted in the root layout so it runs on every page,
 * including ones without AppShell (landing, login, onboarding…).
 */
export function SplashKiller() {
  useEffect(() => {
    const splash = document.getElementById("boot-splash");
    if (!splash) return;
    splash.classList.add("boot-done");
    const t = setTimeout(() => splash.remove(), 450);
    return () => clearTimeout(t);
  }, []);
  return null;
}
