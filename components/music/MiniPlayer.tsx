// BROKE MUSIC — persistent mini player (desktop bar + mobile compact).
"use client";

import { motion } from "framer-motion";
import {
  ListMusic, Maximize2, MicVocal, Pause, Play, Repeat, Repeat1, Shuffle, SkipBack, SkipForward, Volume2, VolumeX, X,
} from "lucide-react";
import { formatTime } from "@/lib/music/format";
import { useMusicLibrary } from "@/store/useMusicLibrary";
import { usePlayer } from "./PlayerProvider";
import { LikeButton } from "./TrackViews";
import { Visualizer } from "./Visualizer";

export function MiniPlayer() {
  const p = usePlayer();
  const visual = useMusicLibrary((s) => s.settings.visual);
  const { currentTrack } = p;
  if (!currentTrack) return null;

  const progress = p.duration > 0 ? (p.currentTime / p.duration) * 100 : 0;

  return (
    <motion.div
      initial={{ y: 90, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", damping: 26, stiffness: 260 }}
      className="fixed inset-x-0 bottom-0 z-[60] px-2 pb-2 sm:px-4 sm:pb-4"
    >
      {/* error toast */}
      {p.error && (
        <div className="mx-auto mb-2 flex w-fit max-w-[92vw] items-center gap-2 rounded-2xl border border-amber-300/30 bg-[#171204]/95 px-4 py-2.5 text-xs font-bold text-amber-200 shadow-card backdrop-blur">
          {p.error}
          <button onClick={p.dismissError} aria-label="Dismiss" className="rounded-full p-0.5 hover:bg-white/10">
            <X size={13} />
          </button>
        </div>
      )}
      <div className="glass glow-border mx-auto max-w-6xl overflow-hidden rounded-[1.4rem]">
        {visual !== "minimal" && (
          <div className="border-b border-white/5 px-4 pt-1 opacity-80">
            <Visualizer mode={visual} height={34} />
          </div>
        )}
        {/* progress */}
        <button
          aria-label="Seek"
          onClick={(e) => {
            const r = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
            const ratio = (e.clientX - r.left) / r.width;
            p.seek(ratio * p.duration);
          }}
          className="group relative block h-1.5 w-full bg-white/8"
        >
          <span className="absolute inset-y-0 left-0 bg-gradient-to-r from-lime-300 via-emerald-300 to-violet-400" style={{ width: `${progress}%` }} />
          {p.buffering && <span className="absolute inset-0 shimmer" />}
        </button>
        <div className="flex items-center gap-2 px-3 py-2.5 sm:gap-3 sm:px-4">
          {/* left: artwork + meta (tap → fullscreen on mobile) */}
          <button onClick={() => p.setFullOpen(true)} className="flex min-w-0 flex-1 items-center gap-3 text-left sm:max-w-[32%]">
            <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl sm:h-12 sm:w-12">
              {currentTrack.artwork ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={currentTrack.artwork} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="grid h-full w-full place-items-center bg-gradient-to-br from-violet-600/60 to-lime-500/30 text-lg font-black text-white">
                  {currentTrack.title.slice(0, 1)}
                </span>
              )}
              {p.loading && <span className="absolute inset-0 grid place-items-center bg-black/50 text-[10px] font-bold text-lime-200">…</span>}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[13px] font-bold text-white sm:text-sm">{currentTrack.title}</span>
              <span className="block truncate text-[11px] text-white/50 sm:text-xs">{currentTrack.artist}</span>
            </span>
          </button>
          {/* center controls */}
          <div className="flex items-center gap-1 sm:gap-2">
            <button onClick={p.toggleShuffle} aria-label="Shuffle" className={`hidden h-9 w-9 place-items-center rounded-full transition sm:grid ${p.shuffle ? "text-lime-300" : "text-white/40 hover:text-white"}`}>
              <Shuffle size={16} />
            </button>
            <button onClick={p.previous} aria-label="Previous" data-magnetic className="grid h-10 w-10 place-items-center rounded-full text-white/80 transition hover:bg-white/8 hover:text-white active:scale-90">
              <SkipBack size={18} fill="currentColor" />
            </button>
            <button
              onClick={() => p.togglePlay()}
              aria-label={p.isPlaying ? "Pause" : "Play"}
              data-magnetic
              className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-lime-300 to-emerald-300 text-black shadow-glow transition hover:scale-105 active:scale-95"
            >
              {p.isPlaying ? <Pause size={19} fill="currentColor" /> : <Play size={19} fill="currentColor" className="ml-0.5" />}
            </button>
            <button onClick={p.next} aria-label="Next" data-magnetic className="grid h-10 w-10 place-items-center rounded-full text-white/80 transition hover:bg-white/8 hover:text-white active:scale-90">
              <SkipForward size={18} fill="currentColor" />
            </button>
            <button onClick={p.toggleRepeat} aria-label="Repeat" className={`hidden h-9 w-9 place-items-center rounded-full transition sm:grid ${p.repeatMode !== "off" ? "text-lime-300" : "text-white/40 hover:text-white"}`}>
              {p.repeatMode === "one" ? <Repeat1 size={16} /> : <Repeat size={16} />}
            </button>
          </div>
          {/* time (desktop) */}
          <span className="hidden text-[11px] font-semibold tabular-nums text-white/45 lg:block">
            {formatTime(p.currentTime)} / {formatTime(p.duration)}
          </span>
          {/* right cluster (desktop) */}
          <div className="ml-auto hidden items-center gap-1.5 sm:flex">
            <LikeButton track={currentTrack} />
            <button onClick={() => p.setQueueOpen(true)} aria-label="Queue (Q)" className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5 text-white/60 hover:text-white">
              <ListMusic size={15} />
            </button>
            <button onClick={() => p.setFullOpen(true)} aria-label="Fullscreen player (F)" className="hidden h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5 text-white/60 hover:text-white md:grid">
              <Maximize2 size={14} />
            </button>
            <button onClick={p.toggleMute} aria-label={p.muted ? "Unmute (M)" : "Mute (M)"} className="grid h-9 w-9 place-items-center rounded-full text-white/60 hover:text-white">
              {p.muted || p.volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={p.muted ? 0 : p.volume}
              onChange={(e) => p.setVolume(Number(e.target.value))}
              aria-label="Volume"
              className="desi-slider w-20"
            />
          </div>
          {/* mobile quick actions */}
          <div className="flex items-center gap-1 sm:hidden">
            <button onClick={() => p.setFullOpen(true)} aria-label="Open player" className="grid h-10 w-10 place-items-center rounded-full text-white/60">
              <MicVocal size={17} />
            </button>
          </div>
        </div>
      </div>
      {/* spacer so bottom nav never overlaps (mobile) */}
      <div className="h-[64px] sm:hidden" />
    </motion.div>
  );
}
