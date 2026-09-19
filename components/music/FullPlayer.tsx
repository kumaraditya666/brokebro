// BROKE MUSIC — full-screen player: artwork glow + parallax + orbital,
// gradient from artwork colors, swipe gestures, queue + lyrics tabs.
"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown, ListMusic, Pause, Play, Repeat, Repeat1, Shuffle,
  SkipBack, SkipForward, Volume2, VolumeX,
} from "lucide-react";
import { extractArtworkColors, fallbackColors, gradientCss } from "@/lib/music/colors";
import { formatTime } from "@/lib/music/format";
import { useMusicLibrary } from "@/store/useMusicLibrary";
import { usePlayer } from "./PlayerProvider";
import { LikeButton, AddToPlaylistButton } from "./TrackViews";
import { Visualizer } from "./Visualizer";
import { LyricsPanel } from "./LyricsPanel";

export function FullPlayer() {
  const p = usePlayer();
  const visual = useMusicLibrary((s) => s.settings.visual);
  const dynamic = useMusicLibrary((s) => s.settings.dynamicColors);
  const { currentTrack, fullOpen } = p;
  const [colors, setColors] = useState<[string, string, string]>(["#bef264", "#34d399", "#8b5cf6"]);
  const [tab, setTab] = useState<"lyrics" | "next">("lyrics");
  const touch = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!currentTrack) return;
    if (!dynamic) {
      setColors(fallbackColors("broke"));
      return;
    }
    extractArtworkColors(currentTrack.artwork, currentTrack.id).then(setColors);
  }, [currentTrack?.artwork, currentTrack?.id, dynamic]);

  // lock scroll when open
  useEffect(() => {
    document.body.style.overflow = fullOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [fullOpen]);

  const progress = p.duration > 0 ? (p.currentTime / p.duration) * 100 : 0;
  const upNext = p.queue.slice(p.currentIndex + 1, p.currentIndex + 6);

  return (
    <AnimatePresence>
      {fullOpen && currentTrack && (
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 30, stiffness: 260 }}
          className="fixed inset-0 z-[70] flex flex-col overflow-y-auto"
          style={{ background: `#060607` }}
          role="dialog"
          aria-label="Fullscreen player"
          onTouchStart={(e) => {
            touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
          }}
          onTouchEnd={(e) => {
            if (!touch.current) return;
            const dx = e.changedTouches[0].clientX - touch.current.x;
            const dy = e.changedTouches[0].clientY - touch.current.y;
            if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy)) {
              if (dx < 0) p.next();
              else p.previous();
            } else if (dy > 90 && Math.abs(dy) > Math.abs(dx)) {
              p.setFullOpen(false);
            }
            touch.current = null;
          }}
        >
          {/* animated artwork-tinted background */}
          <div className="pointer-events-none fixed inset-0" style={{ background: gradientCss(colors) }} />
          <div className="pointer-events-none fixed -left-32 top-[-10%] h-[55vmax] w-[55vmax] rounded-full opacity-30 blur-[120px]" style={{ background: colors[0] }} />
          <div className="pointer-events-none fixed -right-32 bottom-[-15%] h-[50vmax] w-[50vmax] rounded-full opacity-25 blur-[130px]" style={{ background: colors[1] }} />

          <div className="relative mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 pb-10 pt-[max(1rem,env(safe-area-inset-top))] sm:px-8">
            <div className="flex items-center justify-between">
              <button onClick={() => p.setFullOpen(false)} aria-label="Close player (Esc)" data-magnetic className="grid h-11 w-11 place-items-center rounded-full border border-white/12 bg-white/5 text-white/80 backdrop-blur hover:text-white">
                <ChevronDown size={20} />
              </button>
              <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-white/40">Now playing</p>
              <button onClick={() => { p.setFullOpen(false); p.setQueueOpen(true); }} aria-label="Open queue" className="grid h-11 w-11 place-items-center rounded-full border border-white/12 bg-white/5 text-white/80 backdrop-blur hover:text-white">
                <ListMusic size={18} />
              </button>
            </div>

            <div className="mt-4 grid flex-1 items-start gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
              {/* artwork side */}
              <div className="mx-auto w-full max-w-sm lg:max-w-none">
                <div className="relative">
                  {visual === "orbital" && (
                    <div className="pointer-events-none absolute -inset-6 opacity-90">
                      <Visualizer mode="orbital" height={420} />
                    </div>
                  )}
                  <motion.div
                    animate={p.isPlaying ? { y: [0, -10, 0] } : { y: 0 }}
                    transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                    className="relative aspect-square overflow-hidden rounded-[2rem] border border-white/12 shadow-card"
                    style={{ boxShadow: `0 30px 90px ${colors[0]}44, 0 20px 60px rgba(0,0,0,0.6)` }}
                  >
                    {currentTrack.artwork ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={currentTrack.artwork} alt={`${currentTrack.album ?? currentTrack.title} artwork`} className="h-full w-full object-cover" />
                    ) : (
                      <div className="grid h-full w-full place-items-center bg-gradient-to-br from-violet-700 to-lime-600 text-7xl font-black text-white">
                        {currentTrack.title.slice(0, 1)}
                      </div>
                    )}
                  </motion.div>
                </div>
                <div className="mt-5 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="font-display truncate text-2xl font-extrabold tracking-tight text-white sm:text-3xl">{currentTrack.title}</h2>
                    <p className="mt-1 truncate text-sm text-white/55">{currentTrack.artist}{currentTrack.album ? ` · ${currentTrack.album}` : ""}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <LikeButton track={currentTrack} />
                    <AddToPlaylistButton track={currentTrack} />
                  </div>
                </div>
                {/* progress */}
                <div className="mt-5">
                  <input
                    type="range"
                    min={0}
                    max={p.duration || 0}
                    step={0.1}
                    value={p.currentTime}
                    onChange={(e) => p.seek(Number(e.target.value))}
                    aria-label="Seek"
                    className="desi-slider w-full"
                  />
                  <div className="mt-1.5 flex justify-between text-[11px] font-semibold tabular-nums text-white/45">
                    <span>{formatTime(p.currentTime)}</span>
                    <span>{formatTime(p.duration)}</span>
                  </div>
                  <div className="mt-1 h-1 overflow-hidden rounded-full bg-white/8">
                    <div className="h-full bg-gradient-to-r from-lime-300 to-violet-400" style={{ width: `${progress}%` }} />
                  </div>
                </div>
                {/* controls */}
                <div className="mt-4 flex items-center justify-center gap-2">
                  <button onClick={p.toggleShuffle} aria-label="Shuffle" className={`grid h-11 w-11 place-items-center rounded-full transition ${p.shuffle ? "text-lime-300" : "text-white/45 hover:text-white"}`}>
                    <Shuffle size={18} />
                  </button>
                  <button onClick={p.previous} aria-label="Previous" data-magnetic className="grid h-12 w-12 place-items-center rounded-full p-3 text-white transition hover:bg-white/8 active:scale-90">
                    <SkipBack size={24} fill="currentColor" />
                  </button>
                  <button onClick={() => p.togglePlay()} aria-label={p.isPlaying ? "Pause" : "Play"} data-magnetic className="grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-lime-300 to-emerald-300 text-black shadow-glow transition hover:scale-105 active:scale-95">
                    {p.isPlaying ? <Pause size={26} fill="currentColor" /> : <Play size={26} fill="currentColor" className="ml-1" />}
                  </button>
                  <button onClick={p.next} aria-label="Next" data-magnetic className="grid place-items-center rounded-full p-3 text-white transition hover:bg-white/8 active:scale-90">
                    <SkipForward size={24} fill="currentColor" />
                  </button>
                  <button onClick={p.toggleRepeat} aria-label="Repeat" className={`grid h-11 w-11 place-items-center rounded-full transition ${p.repeatMode !== "off" ? "text-lime-300" : "text-white/45 hover:text-white"}`}>
                    {p.repeatMode === "one" ? <Repeat1 size={18} /> : <Repeat size={18} />}
                  </button>
                </div>
                <div className="mt-3 flex items-center justify-center gap-3">
                  <button onClick={p.toggleMute} aria-label="Mute" className="text-white/55 hover:text-white">
                    {p.muted || p.volume === 0 ? <VolumeX size={17} /> : <Volume2 size={17} />}
                  </button>
                  <input type="range" min={0} max={1} step={0.01} value={p.muted ? 0 : p.volume} onChange={(e) => p.setVolume(Number(e.target.value))} aria-label="Volume" className="desi-slider w-40" />
                </div>
              </div>

              {/* side panel */}
              <div className="w-full">
                {(visual === "wave" || visual === "spectrum") && (
                  <div className="mb-4 rounded-3xl border border-white/8 bg-black/30 p-4 backdrop-blur">
                    <Visualizer mode={visual} height={84} />
                  </div>
                )}
                <div className="mb-3 flex gap-2">
                  {(["lyrics", "next"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTab(t)}
                      className={`rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-wider transition ${
                        tab === t ? "border-lime-300/50 bg-lime-300/12 text-lime-200" : "border-white/10 bg-white/5 text-white/50 hover:text-white"
                      }`}
                    >
                      {t === "lyrics" ? "Lyrics" : `Next up (${upNext.length})`}
                    </button>
                  ))}
                </div>
                {tab === "lyrics" ? (
                  <LyricsPanel track={currentTrack} />
                ) : (
                  <div className="space-y-2">
                    {upNext.length === 0 && <p className="rounded-2xl border border-dashed border-white/12 p-6 text-center text-xs text-white/40">Queue is empty after this.</p>}
                    {upNext.map((t) => (
                      <button key={t.id} onClick={() => p.playTrack(t, p.queue)} className="flex w-full items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.03] p-2.5 text-left transition hover:bg-white/[0.06]">
                        {t.artwork && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={t.artwork} alt="" className="h-11 w-11 rounded-xl object-cover" />
                        )}
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-bold text-white">{t.title}</span>
                          <span className="block truncate text-xs text-white/50">{t.artist}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                )}
                <p className="mt-4 text-center text-[11px] text-white/30">Swipe artwork ←/→ to skip · swipe down to minimize</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
