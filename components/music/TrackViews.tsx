// BROKE MUSIC — track views: source badge, like button, cards, rows.
"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { AlertCircle, ExternalLink, Heart, Play, Plus } from "lucide-react";
import type { Track } from "@/types/music";
import { formatTime } from "@/lib/music/format";
import { useMusicLibrary } from "@/store/useMusicLibrary";
import { usePlayer } from "./PlayerProvider";

const SOURCE_STYLES: Record<string, string> = {
  Local: "border-sky-300/30 bg-sky-400/10 text-sky-200",
  Demo: "border-lime-300/30 bg-lime-400/10 text-lime-200",
  Jamendo: "border-violet-300/30 bg-violet-400/10 text-violet-200",
  SoundCloud: "border-orange-300/30 bg-orange-400/10 text-orange-200",
};

export function SourceBadge({ source }: { source: string }) {
  const cls = SOURCE_STYLES[source] ?? "border-white/15 bg-white/5 text-white/60";
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${cls}`}>
      {source}
    </span>
  );
}

export function LikeButton({ track, size = 16 }: { track: Track; size?: number }) {
  const toggleLike = useMusicLibrary((s) => s.toggleLike);
  const liked = useMusicLibrary((s) => Boolean(s.likes[track.id]));
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        toggleLike(track);
      }}
      aria-label={liked ? "Unlike" : "Like"}
      aria-pressed={liked}
      data-magnetic
      className={`grid h-9 w-9 place-items-center rounded-full border transition active:scale-90 ${
        liked ? "border-pink-400/50 bg-pink-500/15 text-pink-300" : "border-white/10 bg-white/5 text-white/50 hover:text-white"
      }`}
    >
      <Heart size={size} fill={liked ? "currentColor" : "none"} />
    </button>
  );
}

export function AddToPlaylistButton({ track }: { track: Track }) {
  const playlists = useMusicLibrary((s) => s.playlists);
  const addToPlaylist = useMusicLibrary((s) => s.addToPlaylist);
  const createPlaylist = useMusicLibrary((s) => s.createPlaylist);
  return (
    <div className="group relative">
      <button
        aria-label="Add to playlist"
        data-magnetic
        className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5 text-white/50 transition hover:text-white active:scale-90"
      >
        <Plus size={16} />
      </button>
      <div className="invisible absolute right-0 top-10 z-30 w-52 rounded-2xl border border-white/10 bg-[#0c0c0e]/95 p-2 opacity-0 shadow-card backdrop-blur transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
        <button
          onClick={() => createPlaylist("New playlist", [track])}
          className="w-full rounded-xl px-3 py-2 text-left text-xs font-bold text-lime-200 hover:bg-white/5"
        >
          + New playlist
        </button>
        {playlists.map((p) => (
          <button
            key={p.id}
            onClick={() => addToPlaylist(p.id, track)}
            className="w-full truncate rounded-xl px-3 py-2 text-left text-xs text-white/70 hover:bg-white/5 hover:text-white"
          >
            {p.name}
          </button>
        ))}
        {playlists.length === 0 && <p className="px-3 py-2 text-[11px] text-white/35">No playlists yet.</p>}
      </div>
    </div>
  );
}

function UnplayableNote({ track }: { track: Track }) {
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-200/90">
      <AlertCircle size={12} /> Playback unavailable here
      {track.sourceUrl && (
        <a
          href={track.sourceUrl}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="ml-1 inline-flex items-center gap-0.5 rounded-full border border-white/15 px-2 py-0.5 text-[10px] font-bold text-white/70 hover:text-white"
        >
          Open source <ExternalLink size={10} />
        </a>
      )}
    </span>
  );
}

export function TrackCard({ track, queue, index }: { track: Track; queue: Track[]; index: number }) {
  const { playTrack, currentTrack, isPlaying } = usePlayer();
  const active = currentTrack?.id === track.id;
  return (
    <motion.button
      data-tilt
      data-magnetic
      onClick={() => playTrack(track, queue)}
      whileHover={{ y: -4 }}
      className={`group w-40 shrink-0 snap-start overflow-hidden rounded-[1.4rem] border text-left transition sm:w-48 ${
        active ? "border-lime-300/40 bg-white/[0.06]" : "border-white/8 bg-white/[0.03] hover:border-white/15"
      }`}
    >
      <div className="relative aspect-square overflow-hidden">
        {track.artwork ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={track.artwork} alt="" loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        ) : (
          <div className="grid h-full w-full place-items-center bg-gradient-to-br from-violet-600/40 to-lime-500/20 text-3xl font-black text-white/70">
            {track.title.slice(0, 1)}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        <span className={`absolute bottom-2 right-2 grid h-10 w-10 place-items-center rounded-full transition ${
          active && isPlaying ? "bg-lime-300 text-black" : "bg-white/15 text-white opacity-0 backdrop-blur group-hover:opacity-100"
        }`}>
          <Play size={16} fill="currentColor" />
        </span>
        {active && (
          <span className="absolute left-2 top-2 flex gap-0.5" aria-hidden>
            {[0, 1, 2].map((i) => (
              <span key={i} className="typing-dot inline-block h-3 w-1 rounded-full bg-lime-300" style={{ animationDelay: `${i * 0.18}s` }} />
            ))}
          </span>
        )}
      </div>
      <div className="p-3">
        <p className="truncate text-sm font-bold text-white">{track.title}</p>
        <p className="truncate text-xs text-white/50">{track.artist}</p>
        <div className="mt-2 flex items-center justify-between gap-2">
          <SourceBadge source={track.source} />
          {!track.playable && <AlertCircle size={13} className="text-amber-300" />}
        </div>
        {!track.playable && (
          <div className="mt-1.5" onClick={(e) => e.stopPropagation()}>
            <UnplayableNote track={track} />
          </div>
        )}
      </div>
      <span className="sr-only">{index}</span>
    </motion.button>
  );
}

export function TrackRow({ track, queue, index, showArt = true }: { track: Track; queue: Track[]; index: number; showArt?: boolean }) {
  const { playTrack, currentTrack, isPlaying, playNext } = usePlayer();
  const active = currentTrack?.id === track.id;
  return (
    <div
      onClick={() => track.playable && playTrack(track, queue)}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && track.playable) playTrack(track, queue);
      }}
      role="button"
      tabIndex={0}
      className={`group flex cursor-pointer items-center gap-3 rounded-2xl border p-2.5 pr-3 transition ${
        active ? "border-lime-300/35 bg-lime-300/[0.07]" : "border-white/5 bg-white/[0.02] hover:border-white/12 hover:bg-white/[0.05]"
      } ${track.playable ? "" : "cursor-default"}`}
    >
      {showArt && (
        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl">
          {track.artwork ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={track.artwork} alt="" loading="lazy" className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full w-full place-items-center bg-gradient-to-br from-violet-600/50 to-lime-500/25 text-lg font-black text-white/80">
              {track.title.slice(0, 1)}
            </div>
          )}
          {active && isPlaying && (
            <span className="absolute inset-0 grid place-items-center bg-black/45">
              <span className="flex gap-0.5">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="typing-dot inline-block h-3.5 w-1 rounded-full bg-lime-300" style={{ animationDelay: `${i * 0.18}s` }} />
                ))}
              </span>
            </span>
          )}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className={`truncate text-sm font-bold ${active ? "text-lime-200" : "text-white"}`}>{track.title}</p>
        <p className="truncate text-xs text-white/50">
          {track.artist} {track.album ? `· ${track.album}` : ""}
        </p>
        {!track.playable ? (
          <div onClick={(e) => e.stopPropagation()}>
            <UnplayableNote track={track} />
          </div>
        ) : (
          <div className="mt-1 flex items-center gap-2">
            <SourceBadge source={track.source} />
            {track.duration ? <span className="text-[11px] text-white/35">{formatTime(track.duration)}</span> : null}
          </div>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
        <LikeButton track={track} />
        <AddToPlaylistButton track={track} />
        {track.playable && (
          <button
            onClick={() => playNext(track)}
            aria-label="Play next"
            title="Play next"
            className="hidden h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5 text-white/50 transition hover:text-white group-hover:grid sm:grid"
          >
            <Play size={14} />
          </button>
        )}
      </div>
      <span className="sr-only">{index}</span>
    </div>
  );
}

export function QueuelessLink() {
  return (
    <Link href="/search" className="text-xs font-bold text-lime-300 hover:underline">
      Find something to play →
    </Link>
  );
}
