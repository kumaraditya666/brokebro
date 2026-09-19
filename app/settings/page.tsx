"use client";
import { useEffect, useState } from "react";
import { Bell, Download, Palette, RefreshCw, Trash2, Cloud, HardDrive, TriangleAlert } from "lucide-react";
import { AppShell } from "@/components/brokebro/AppShell";
import { Card, Btn, PageHeader, Badge } from "@/components/brokebro/ui";
import { SyncBadge } from "@/components/brokebro/SyncBadge";
import { applyTheme, useBroke, type ThemePref } from "@/lib/brokebro/store";
import { ensureNotifyPermission } from "@/lib/brokebro/notify";
import { isIOS, isStandalone, pendingCount, buzz } from "@/lib/brokebro/pwa";
import { syncNow } from "@/lib/brokebro/sync";
import { supabaseOrNull } from "@/lib/brokebro/supabase";

function Section({ icon, title, sub, children }: { icon: React.ReactNode; title: string; sub: string; children: React.ReactNode }) {
  return (
    <Card>
      <h3 className="font-display flex items-center gap-2 font-bold">{icon} {title}</h3>
      <p className="mt-1 text-xs text-white/50">{sub}</p>
      <div className="mt-3">{children}</div>
    </Card>
  );
}

export default function SettingsPage() {
  const prefs = useBroke((s) => s.prefs);
  const setPrefs = useBroke((s) => s.setPrefs);
  const setNotifPref = useBroke((s) => s.setNotifPref);
  const cloud = useBroke((s) => s.cloud);
  const txns = useBroke((s) => s.transactions);
  const budgets = useBroke((s) => s.budgets);
  const goals = useBroke((s) => s.goals);
  // Permission is browser-only: initialize server-identical, read it after mount.
  const [perm, setPerm] = useState<string>("loading");
  useEffect(() => {
    setPerm("Notification" in window ? Notification.permission : "unsupported");
  }, []);
  const [storage, setStorage] = useState<{ use?: number; quota?: number; localKB?: number }>({});
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const est = await navigator.storage?.estimate();
        let localKB: number | undefined;
        try {
          const raw = localStorage.getItem("brokebro-v1");
          localKB = raw ? raw.length : 0; // ~bytes; kb() formats tiers
        } catch { /* private mode */ }
        setStorage({ use: est?.usage, quota: est?.quota, localKB });
      } catch { /* unsupported */ }
    })();
  }, []);

  const pending = pendingCount(txns, budgets, goals);
  const theme = prefs.theme;

  const setTheme = (t: ThemePref) => {
    setPrefs({ theme: t });
    applyTheme(t);
  };

  const enableNotifs = async () => {
    const p = await ensureNotifyPermission();
    setPerm(p);
    if (p === "granted") {
      setMsg("Notifications on — useful money nudges only, never spam. 🔔");
      buzz(15);
    } else if (p === "denied") {
      setMsg("Blocked in browser settings — BrokeBro works fine without them. Re-enable via the lock icon in your address bar.");
    }
  };

  const clearCache = async () => {
    setBusy(true);
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
      if ("serviceWorker" in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        // Keep the worker (offline still works); just drop versioned caches.
        void regs;
      }
      setMsg(`App cache cleared (${keys.length} caches). Your transactions and cloud data are untouched. Reload to refetch fresh files.`);
    } catch {
      setMsg("Couldn't clear caches in this browser.");
    } finally {
      setBusy(false);
    }
  };

  const eraseCloud = async () => {
    const sb = supabaseOrNull();
    if (!sb || !cloud.userId) {
      setMsg("Not signed in — there's no cloud data to erase.");
      return;
    }
    if (!window.confirm("Erase ALL your cloud data (transactions, budgets, goals)? This cannot be undone. Your on-device copy stays.")) return;
    if (!window.confirm("Last check — really erase cloud data?")) return;
    setBusy(true);
    try {
      for (const t of ["goal_contributions", "notifications", "transactions", "budgets", "savings_goals", "user_quests", "user_achievements"] as const) {
        const { error } = await sb.from(t).delete().eq("user_id", cloud.userId);
        if (error) throw new Error(`${t}: ${error.message}`);
      }
      await sb.from("profiles").delete().eq("user_id", cloud.userId);
      setMsg("Cloud data erased. On-device data untouched. Log out to start fully fresh.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Erase failed.");
    } finally {
      setBusy(false);
    }
  };

  const kb = (n?: number) => {
    if (n == null || Number.isNaN(n)) return "—";
    if (n < 1024) return `${Math.round(n)} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
    return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`;
  };

  return (
    <AppShell>
      <PageHeader kicker="Settings" title="App settings" sub="Install, notifications, theme, offline data, sync. You control everything." />

      {msg && (
        <div className="glass mb-4 rounded-2xl border border-lime-300/25 px-4 py-3 text-sm" role="status">
          {msg}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Section icon={<Download size={17} className="text-lime-300" />} title="Install App" sub="Home-screen icon, standalone window, offline-first.">
          {isStandalone() ? (
            <Badge tone="lime">✓ Installed — running as an app</Badge>
          ) : (
            <div className="text-sm text-white/60">
              {isIOS() ? (
                <ol className="space-y-1.5">
                  <li>1. Tap <b>Share</b> in Safari</li>
                  <li>2. Tap <b>“Add to Home Screen”</b></li>
                  <li>3. Tap <b>Add</b> 🎉</li>
                </ol>
              ) : (
                <p>Use the app for a bit and an install card appears automatically. Or on desktop: browser menu → <b>“Install BrokeBro”</b> / <b>“Save and share”</b>.</p>
              )}
            </div>
          )}
        </Section>

        <Section icon={<Bell size={17} className="text-violet-300" />} title="Notifications" sub="Useful nudges only: budgets, goals, recaps. Never spam. App works fine denied.">
          <div className="flex items-center gap-2 text-sm">
            <Badge tone={perm === "granted" ? "lime" : "muted"}>{perm === "granted" ? "🔔 On" : perm === "denied" ? "🚫 Blocked" : perm === "loading" ? "…" : "○ Off"}</Badge>
            {perm !== "granted" ? (
              <button onClick={enableNotifs} className="rounded-xl bg-gradient-to-r from-lime-300 to-emerald-300 px-4 py-2 text-xs font-bold text-black">Enable Notifications</button>
            ) : (
              <button onClick={() => setMsg("To fully mute, use Not Now below or your OS notification settings.")} className="rounded-xl border border-white/15 px-4 py-2 text-xs font-bold hover:bg-white/5">Not Now</button>
            )}
          </div>
          <div className="mt-3 space-y-2">
            {(Object.keys(prefs.notifs) as Array<keyof typeof prefs.notifs>).map((k) => (
              <label key={k} className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/30 px-4 py-2.5 text-sm">
                <span className="font-semibold capitalize">{`${k} alerts`}</span>
                <input type="checkbox" checked={prefs.notifs[k]} onChange={(e) => setNotifPref(k, e.target.checked)} className="h-5 w-5 accent-lime-300" aria-label={`${k} notifications`} />
              </label>
            ))}
          </div>
        </Section>

        <Section icon={<Palette size={17} className="text-pink-300" />} title="Theme" sub="Dark-first, always. Light is a progressive extra.">
          <div className="grid grid-cols-3 gap-2 rounded-2xl bg-white/5 p-1 text-sm font-bold">
            {(["dark", "light", "system"] as const).map((t) => (
              <button key={t} onClick={() => setTheme(t)} className={`rounded-xl py-2.5 capitalize transition ${theme === t ? "bg-lime-300 text-black" : "text-white/55"}`}>{t}</button>
            ))}
          </div>
        </Section>

        <Section icon={<Cloud size={17} className="text-emerald-300" />} title="Sync Status" sub="Local-first: works offline, syncs when online. Retries are idempotent.">
          <p className="mb-2 font-mono text-[11px] text-white/45">
            {cloud.userId ? `signed in · id ${cloud.userId.slice(0, 8)}… · status ${cloud.status}` : "guest mode — log in to sync across devices"}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <SyncBadge />
            {pending > 0 && <Badge tone="violet">📥 {pending} pending upload</Badge>}
            <button
              onClick={async () => {
                setBusy(true);
                setMsg(null);
                try {
                  const r = await syncNow();
                  setMsg(r.message);
                  if (r.ok) useBroke.getState().setCloud({ status: "synced", error: null });
                } catch (e) {
                  const m = e instanceof Error ? e.message : "Sync crashed unexpectedly.";
                  setMsg(m);
                  useBroke.getState().setCloud({ status: "error", error: m });
                } finally {
                  setBusy(false); // never leave the button dead
                }
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 px-4 py-2 text-xs font-bold hover:bg-white/5 disabled:opacity-50"
              disabled={busy}
            >
              <RefreshCw size={13} /> {busy ? "Working…" : "Sync now"}
            </button>
          </div>
          {cloud.error && <p className="mt-2 text-xs text-amber-200/80">{cloud.error}</p>}
        </Section>

        <Section icon={<HardDrive size={17} className="text-cyan-300" />} title="Offline Data" sub="Cached app shell + your on-device data. Works on planes. ✈️">
          <div className="grid grid-cols-3 gap-2 text-center text-sm">
            <div className="rounded-2xl border border-white/10 bg-black/30 p-3"><p className="font-display text-lg font-extrabold">{kb(storage.use)}</p><p className="text-[11px] text-white/45">app cache</p></div>
            <div className="rounded-2xl border border-white/10 bg-black/30 p-3"><p className="font-display text-lg font-extrabold">{kb(storage.localKB)}</p><p className="text-[11px] text-white/45">my data</p></div>
            <div className="rounded-2xl border border-white/10 bg-black/30 p-3"><p className="font-display text-lg font-extrabold">{kb(storage.quota)}</p><p className="text-[11px] text-white/45">available</p></div>
          </div>
          <Btn variant="outline" className="mt-3 w-full" onClick={clearCache} disabled={busy}>
            {busy ? "Working…" : "Clear local cached files"}
          </Btn>
          <p className="mt-1.5 text-[11px] text-white/40">Clears offline app files only. Transactions + cloud data are NEVER touched by this.</p>
        </Section>

        <Section icon={<TriangleAlert size={17} className="text-red-300" />} title="Danger zone" sub="Sharp edges, clearly labeled. Cache-clearing above is the safe option.">
          <Btn variant="danger" className="w-full" onClick={eraseCloud} disabled={busy}>
            <Trash2 size={14} /> Erase my cloud data
          </Btn>
          <p className="mt-1.5 text-[11px] text-white/40">Deletes server rows only — on-device copy stays. “Delete my account” fully = erase above + sign out + delete the login in Supabase → Authentication → Users.</p>
        </Section>
      </div>
    </AppShell>
  );
}
