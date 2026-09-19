"use client";
import { useState } from "react";
import { Cloud, CloudOff, Loader2, TriangleAlert } from "lucide-react";
import { useBroke } from "@/lib/brokebro/store";
import { useMounted } from "@/lib/brokebro/use-mounted";
import { syncNow } from "@/lib/brokebro/sync";

const LOCAL_FALLBACK = (
  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-white/45" title="Running on this device only. Log in with Supabase keys configured to sync.">
    <CloudOff size={12} /> Local
  </span>
);

/** Visible cloud status. Click to retry a failed sync. */
export function SyncBadge({ compact }: { compact?: boolean }) {
  const mounted = useMounted();
  const cloud = useBroke((s) => s.cloud);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const retry = async () => {
    setBusy(true);
    setNote(null);
    const r = await syncNow();
    if (r.ok) useBroke.getState().setCloud({ status: "synced", error: null });
    else {
      useBroke.getState().setCloud({ status: "error", error: r.message });
      setNote(r.message);
    }
    setBusy(false);
  };

  // Persisted cloud state only exists on the client — server always renders the
  // local badge, so hold the identical fallback until mounted (no flash for guests).
  if (!mounted || cloud.status === "local") {
    if (!mounted) return LOCAL_FALLBACK;
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-white/45" title="Running on this device only. Log in with Supabase keys configured to sync.">
        <CloudOff size={12} /> {compact ? "Local" : "Local only"}
      </span>
    );
  }
  if (cloud.status === "syncing" || busy) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-white/60">
        <Loader2 size={12} className="animate-spin" /> Syncing…
      </span>
    );
  }
  if (cloud.status === "error") {
    return (
      <span title={cloud.error ?? "Sync failed"}>
        <button onClick={retry} className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/40 bg-amber-300/10 px-2.5 py-1 text-[11px] font-bold text-amber-200 hover:bg-amber-300/20" title={`Sync failed: ${cloud.error ?? ""} — click to retry`}>
          <TriangleAlert size={12} /> Sync failed — retry
        </button>
        {note && <span className="mt-1 block max-w-[200px] text-[10px] text-amber-200/70">{note}</span>}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/25 bg-emerald-300/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-200" title="Your data is saved to your cloud account.">
      <Cloud size={12} /> {compact ? "Synced" : "☁ Synced"}
    </span>
  );
}
