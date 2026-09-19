// BROKE MUSIC — listening history.
"use client";

import { Trash2 } from "lucide-react";
import { timeAgo } from "@/lib/music/format";
import { useMusicLibrary } from "@/store/useMusicLibrary";
import { usePlayer } from "@/components/music/PlayerProvider";
import { TrackRow } from "@/components/music/TrackViews";
import { EmptyState, PageHeader } from "@/components/music/ui";

export default function HistoryPage() {
  const history = useMusicLibrary((s) => s.history);
  const clearHistory = useMusicLibrary((s) => s.clearHistory);
  const { playList } = usePlayer();
  const tracks = history.map((h) => h.track);

  return (
    <div>
      <PageHeader
        kicker="Activity"
        title="Recently Played"
        sub={history.length > 0 ? `Last ${history.length} plays · newest first · capped at 80` : "Nothing yet — go make some noise."}
        right={
          history.length > 0 ? (
            <span className="flex gap-2">
              <button onClick={() => playList(tracks)} className="rounded-2xl bg-white px-5 py-2.5 text-sm font-bold text-black">Replay all</button>
              <button onClick={() => { if (confirm("Clear listening history?")) clearHistory(); }} className="inline-flex items-center gap-1.5 rounded-2xl border border-white/10 px-4 py-2.5 text-xs font-bold text-white/50 hover:text-red-300">
                <Trash2 size={13} /> Clear
              </button>
            </span>
          ) : undefined
        }
      />
      {history.length === 0 ? (
        <EmptyState title="Quiet… too quiet" sub="Every play lands here with artwork, title, artist and timestamp." />
      ) : (
        <div className="space-y-2">
          {history.map(({ track, playedAt }, i) => (
            <div key={`${track.id}-${playedAt}`} className="relative">
              <TrackRow track={track} queue={tracks} index={i} />
              <span className="pointer-events-none absolute right-3 top-1.5 text-[10px] font-bold text-white/30">{timeAgo(playedAt)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
