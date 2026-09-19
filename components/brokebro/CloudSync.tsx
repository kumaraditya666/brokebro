"use client";
import { useEffect, useRef, useState } from "react";
import { supabaseOrNull } from "@/lib/brokebro/supabase";
import { pullCloud, pushCloud } from "@/lib/brokebro/sync";
import { useBroke } from "@/lib/brokebro/store";

/**
 * Mount once (in AppShell): if Supabase is configured + user is signed in,
 * pull cloud state on login and push local changes (debounced 2.5s).
 * Silent failures → stays local-first, never blocks the UI.
 */
export function CloudSync() {
  const [userId, setUserId] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastPush = useRef(0);

  useEffect(() => {
    const sb = supabaseOrNull();
    if (!sb) return;
    let alive = true;
    sb.auth.getSession().then(({ data }) => {
      if (!alive) return;
      const id = data.session?.user?.id ?? null;
      setUserId(id);
      if (id) pullCloud(sb, id).catch(() => {});
    });
    const { data: sub } = sb.auth.onAuthStateChange((_ev, session) => {
      const id = session?.user?.id ?? null;
      setUserId(id);
      if (id) {
        const sb2 = supabaseOrNull();
        if (sb2) pullCloud(sb2, id).catch(() => {});
      } else {
        useBroke.getState().resetAll();
      }
    });
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!userId) return;
    const unsub = useBroke.subscribe(() => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(async () => {
        if (Date.now() - lastPush.current < 2000) return;
        lastPush.current = Date.now();
        const sb = supabaseOrNull();
        if (!sb) return;
        try {
          await pushCloud(sb, userId);
        } catch {
          /* stay local-first */
        }
      }, 2500);
    });
    return () => {
      unsub();
      if (timer.current) clearTimeout(timer.current);
    };
  }, [userId]);

  return null;
}
