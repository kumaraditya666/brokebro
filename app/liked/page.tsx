// BROKE MUSIC — liked songs (optimistic UI via instant store toggle).
"use client";

import { Heart } from "lucide-react";
import { useMusicLibrary } from "@/store/useMusicLibrary";
import { usePlayer } from "@/components/music/PlayerProvider";
import { TrackRow } from "@/components/music/TrackViews";
import { EmptyState, PageHeader } from "@/components/music/ui";

export default function LikedPage() {
  const likes = useMusicLibrary((s) => s.likes);
  const clearLikes = useMusicLibrary((s) => s.clearLikes);
  const { playList } = usePlayer();
  const list = Object.values(likes).sort((a, b) => b.id.localeCompare(a.id));

  return (
    <div>
      <PageHeader
        kicker="Collection"
        title="Liked Songs"
        sub={`${list.length} ${list.length === 1 ? "song" : "songs"} with a heart on it`}
        right={
          list.length > 0 ? (
            <span className="flex gap-2">
              <button onClick={() => playList(list)} className="rounded-2xl bg-gradient-to-r from-pink-400 to-rose-400 px-5 py-2.5 text-sm font-bold text-black">Play all</button>
              <button onClick={() => { if (confirm("Unlike everything?")) clearLikes(); }} className="rounded-2xl border border-white/10 px-4 py-2.5 text-xs font-bold text-white/50 hover:text-red-300">Clear</button>
            </span>
          ) : undefined
        }
      />
      {list.length === 0 ? (
        <EmptyState
          title="No crushes yet"
          sub="Tap the heart on any track — it lands here instantly. No second guessing."
        />
      ) : (
        <div className="mb-3 flex items-center gap-2 text-xs text-white/40">
          <Heart size={13} className="text-pink-400" fill="currentColor" /> Optimistic UI: hearts flip instantly, even offline.
        </div>
      )}
      <div className="space-y-2">
        {list.map((t, i) => (
          <TrackRow key={t.id} track={t} queue={list} index={i} />
        ))}
      </div>
    </div>
  );
}
