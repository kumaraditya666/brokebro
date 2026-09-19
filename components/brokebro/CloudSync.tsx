"use client";
import { useEffect, useRef } from "react";
import { supabaseOrNull } from "@/lib/brokebro/supabase";
import { pullCloud, pushCloud } from "@/lib/brokebro/sync";
import { useBroke } from "@/lib/brokebro/store";

/**
 * Mount once (in AppShell): if Supabase is configured + user is signed in,
 * pull cloud state on login (MERGED with local — never wipes) and push local
 * changes (debounced 2.5s). Failures set a visible status instead of vanishing.
 */
export function CloudSync() {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const sb = supabaseOrNull();
    const setCloud = useBroke.getState().setCloud;
    if (!sb) {
      setCloud({ status: "local", userId: null, error: null });
      return;
    }
    let alive = true;
    const boot = async () => {
      const { data } = await sb.auth.getSession();
      if (!alive) return;
      const id = data.session?.user?.id ?? null;
      if (!id) {
        setCloud({ status: "local", userId: null, error: null });
        return;
      }
      setCloud({ status: "syncing", userId: id, error: null });
      try {
        await pullCloud(sb, id);
        if (!alive) return;
        setCloud({ status: "synced", error: null });
      } catch (e) {
        if (!alive) return;
        const msg = e instanceof Error ? e.message : "Sync failed.";
        setCloud({ status: "error", error: msg });
        console.error("[BrokeBro] cloud pull failed:", msg);
      }
    };
    boot();
    const { data: sub } = sb.auth.onAuthStateChange(async (ev, session) => {
      const id = session?.user?.id ?? null;
      if (ev === "SIGNED_OUT" || !id) {
        useBroke.getState().resetAll();
        useBroke.getState().setCloud({ status: "local", userId: null, error: null });
        return;
      }
      useBroke.getState().setCloud({ status: "syncing", userId: id, error: null });
      try {
        await pullCloud(sb, id);
        useBroke.getState().setCloud({ status: "synced", error: null });
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Sync failed.";
        useBroke.getState().setCloud({ status: "error", error: msg });
        console.error("[BrokeBro] cloud pull failed:", msg);
      }
    });
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    // Data signature: status-only flips (syncing→synced) must NOT retrigger pushes.
    const sig = { current: "" };
    const snapshot = (s: ReturnType<typeof useBroke.getState>) =>
      JSON.stringify([s.profile, s.transactions, s.budgets, s.goals]);
    const unsub = useBroke.subscribe((s) => {
      if (!s.cloud.userId) return; // guest: nothing to push
      const cur = snapshot(s);
      if (cur === sig.current) return;
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(async () => {
        const sb = supabaseOrNull();
        const st = useBroke.getState();
        if (!sb || !st.cloud.userId) return;
        st.setCloud({ status: "syncing", error: null });
        try {
          await pushCloud(sb, st.cloud.userId);
          const fresh = useBroke.getState();
          sig.current = snapshot(fresh); // includes post-push id remaps
          fresh.setCloud({ status: "synced", error: null });
        } catch (e) {
          const msg = e instanceof Error ? e.message : "Sync failed.";
          useBroke.getState().setCloud({ status: "error", error: msg });
          console.error("[BrokeBro] cloud push failed:", msg);
        }
      }, 2500);
    });
    return () => {
      unsub();
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  return null;
}
