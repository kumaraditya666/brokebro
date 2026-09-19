// BROKE MUSIC — home: hero, recently played, quick mix, trending, made for you.
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Clock3, Dices, Heart, Play, RotateCcw, Sparkles, Trash2, TrendingUp } from "lucide-react";
import type { Track } from "@/types/music";
import { DEMO_CATALOG, demoByGenre } from "@/lib/music/catalog";
import { getTrending } from "@/lib/music/providers";
import { greeting, timeAgo } from "@/lib/music/format";
import { useMusicLibrary } from "@/store/useMusicLibrary";
import { usePlayer } from "@/components/music/PlayerProvider";
import { TrackCard, TrackRow } from "@/components/music/TrackViews";
import { EmptyState, FadeIn, SectionTitle, Skeleton } from "@/components/music/ui";
import { LocalImporter } from "@/components/music/LocalImporter";

function quickMixes(history: { track: Track }[], likes: Record<string, Track>, local: Track[]): { title: string; sub: string; tracks: Track[]; hue: string }[] {
  const mixes: { title: string; sub: string; tracks: Track[]; hue: string }[] = [];
  const genreCount = new Map<string, number>();
  for (const h of history) {
    const g = h.track.genre ?? "Chill";
    genreCount.set(g, (genreCount.get(g) ?? 0) + 1);
  }
  const topGenre = [...genreCount.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  if (topGenre) {
    mixes.push({ title: `${topGenre} Mix`, sub: `Because you keep replaying ${topGenre.toLowerCase()}`, tracks: demoByGenre(topGenre, 6), hue: "from-lime-400/25 to-emerald-500/10" });
  }
  const liked = Object.values(likes);
  if (liked.length > 0) {
    mixes.push({ title: "Liked Reloaded", sub: `${liked.length} liked ${liked.length === 1 ? "song" : "songs"} on shuffle`, tracks: liked.slice(0, 6), hue: "from-pink-500/25 to-rose-500/10" });
  }
  if (history.length > 0) {
    const artists = [...new Set(history.map((h) => h.track.artist))].slice(0, 3);
    const tracks = DEMO_CATALOG.filter((t) => artists.includes(t.artist)).slice(0, 6);
    if (tracks.length > 0) mixes.push({ title: "Your Artists FM", sub: artists.join(" · "), tracks, hue: "from-violet-500/25 to-indigo-500/10" });
  }
  if (local.length > 0) {
    mixes.push({ title: "Local Heat", sub: `${local.length} files on this device`, tracks: local.slice(0, 6), hue: "from-sky-400/25 to-cyan-500/10" });
  }
  // onboarding fallback
  if (mixes.length === 0) {
    mixes.push(
      { title: "Starter Static", sub: "New here? Start loud.", tracks: DEMO_CATALOG.slice(0, 6), hue: "from-lime-400/25 to-emerald-500/10" },
      { title: "Late Night Drive", sub: "For 1am thoughts", tracks: demoByGenre("Late Night", 6), hue: "from-indigo-500/25 to-violet-500/10" },
    );
  }
  return mixes.slice(0, 4);
}

function madeForYou(history: { track: Track }[], likes: Record<string, Track>): Track[] {
  const likedGenres = new Set(Object.values(likes).map((t) => t.genre).filter(Boolean) as string[]);
  const histGenres = new Set(history.map((h) => h.track.genre).filter(Boolean) as string[]);
  const known = new Set([...likedGenres, ...histGenres]);
  if (known.size === 0) return [...DEMO_CATALOG].slice(4, 10);
  const seen = new Set([...history.map((h) => h.track.id), ...Object.keys(likes)]);
  return DEMO_CATALOG.filter((t) => t.genre && known.has(t.genre) && !seen.has(t.id)).slice(0, 8);
}

export default function HomePage() {
  const history = useMusicLibrary((s) => s.history);
  const likes = useMusicLibrary((s) => s.likes);
  const localTracks = useMusicLibrary((s) => s.localTracks);
  const clearHistory = useMusicLibrary((s) => s.clearHistory);
  const loadLocalBlobs = useMusicLibrary((s) => s.loadLocalBlobs);
  const { playList, playTrack } = usePlayer();
  const [trending, setTrending] = useState<Track[] | null>(null);

  useEffect(() => {
    loadLocalBlobs();
    getTrending(8).then(setTrending).catch(() => setTrending(DEMO_CATALOG.slice(0, 8)));
  }, [loadLocalBlobs]);

  const mixes = useMemo(() => quickMixes(history, likes, localTracks), [history, likes, localTracks]);
  const forYou = useMemo(() => madeForYou(history, likes), [history, likes]);
  const recent = history.slice(0, 8);

  return (
    <div>
      {/* HERO */}
      <FadeIn>
        <section className="glass glow-border relative overflow-hidden rounded-[2rem] p-6 sm:p-10">
          <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-lime-400/15 blur-[80px]" />
          <div className="pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-violet-500/15 blur-[80px]" />
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-lime-300/80">Broke Music · zero ads</p>
          <h1 className="font-display mt-2 text-4xl font-black tracking-tight text-white sm:text-6xl">
            {greeting("BRO")}
          </h1>
          <p className="mt-2 max-w-md text-sm text-white/55 sm:text-base">
            What are we playing today? <span className="text-white/80">Your music. One player. Zero bullshit.</span>
          </p>
          <div className="mt-6 flex flex-wrap gap-2.5">
            <button
              onClick={() => playList(trending && trending.length > 0 ? trending : DEMO_CATALOG)}
              data-magnetic
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-lime-300 to-emerald-300 px-6 py-3 text-sm font-bold text-black transition hover:-translate-y-0.5"
            >
              <Play size={16} fill="currentColor" /> Play trending
            </button>
            <button
              onClick={() => {
                const pool = [...DEMO_CATALOG, ...localTracks];
                const t = pool[Math.floor(Math.random() * pool.length)];
                if (t) playTrack(t, pool);
              }}
              data-magnetic
              className="inline-flex items-center gap-2 rounded-2xl border border-white/12 bg-white/5 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/10"
            >
              <Dices size={16} /> Surprise me
            </button>
            <Link href="/discover" className="inline-flex items-center gap-1.5 rounded-2xl px-4 py-3 text-sm font-bold text-lime-200 hover:underline">
              Discover <ArrowRight size={15} />
            </Link>
          </div>
          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-1 text-[11px] font-semibold text-white/40">
            <span>✓ Ad-free · always</span>
            <span>✓ Only licensed / local playback</span>
            <span>✓ Offline-ready shell</span>
          </div>
        </section>
      </FadeIn>

      {/* RECENTLY PLAYED */}
      <SectionTitle
        title="Recently played"
        sub={recent.length > 0 ? "Pick up where you left off" : "Your history shows up here"}
        right={
          recent.length > 0 ? (
            <button onClick={clearHistory} className="inline-flex items-center gap-1.5 text-xs font-bold text-white/40 hover:text-red-300">
              <Trash2 size={13} /> Clear
            </button>
          ) : undefined
        }
      />
      {recent.length === 0 ? (
        <EmptyState
          title="Nothing played yet"
          sub="Hit play on anything below — your recent tracks, mixes and recommendations are built from this."
          action={<button onClick={() => playList(DEMO_CATALOG)} className="rounded-2xl bg-gradient-to-r from-lime-300 to-emerald-300 px-5 py-2.5 text-sm font-bold text-black">Play the starter mix</button>}
        />
      ) : (
        <div className="no-scrollbar -mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-1">
          {recent.map(({ track, playedAt }) => (
            <div key={`${track.id}-${playedAt}`} className="relative">
              <TrackCard track={track} queue={recent.map((r) => r.track)} index={0} />
              <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white/70 backdrop-blur">{timeAgo(playedAt)}</span>
            </div>
          ))}
        </div>
      )}

      {/* QUICK MIX */}
      <SectionTitle title="Quick Mix" sub="Large dynamic cards from your history" />
      <div className="grid gap-3 sm:grid-cols-2">
        {mixes.map((m, i) => (
          <motion.button
            key={m.title}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            onClick={() => playList(m.tracks)}
            data-magnetic
            className={`group relative overflow-hidden rounded-[1.75rem] border border-white/8 bg-gradient-to-br p-5 text-left ${m.hue}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/50">Mix · {m.tracks.length} songs</p>
                <h3 className="font-display mt-1 text-xl font-extrabold text-white">{m.title}</h3>
                <p className="mt-0.5 truncate text-xs text-white/55">{m.sub}</p>
              </div>
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white text-black transition group-hover:scale-110">
                <Play size={18} fill="currentColor" className="ml-0.5" />
              </span>
            </div>
            <div className="mt-4 flex -space-x-3">
              {m.tracks.slice(0, 5).map((t) => (
                <span key={t.id} className="h-10 w-10 overflow-hidden rounded-full border-2 border-black/60">
                  {t.artwork ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={t.artwork} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="grid h-full w-full place-items-center bg-white/10 text-xs font-black text-white">{t.title.slice(0, 1)}</span>
                  )}
                </span>
              ))}
            </div>
          </motion.button>
        ))}
      </div>

      {/* TRENDING */}
      <SectionTitle
        title="Trending / Discover"
        sub="Only tracks our licensed providers can actually play"
        right={<Link href="/discover" className="inline-flex items-center gap-1 text-xs font-bold text-lime-300 hover:underline"><TrendingUp size={13} /> All</Link>}
      />
      {!trending ? (
        <div className="grid gap-2 sm:grid-cols-2">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-[76px]" />)}</div>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {trending.slice(0, 6).map((t, i) => (
            <TrackRow key={t.id} track={t} queue={trending} index={i} />
          ))}
        </div>
      )}

      {/* MADE FOR YOU */}
      <SectionTitle title="Made for you" sub={Object.keys(likes).length > 0 || history.length > 0 ? "From your genres, likes and history" : "Onboarding picks — like songs to tune this"} right={<Sparkles size={16} className="text-lime-300" />} />
      <div className="no-scrollbar -mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-1">
        {forYou.map((t, i) => (
          <TrackCard key={t.id} track={t} queue={forYou} index={i} />
        ))}
      </div>

      {/* LOCAL TEASER */}
      {localTracks.length === 0 && (
        <>
          <SectionTitle title="Your files, your rules" sub="MP3 · FLAC · WAV · OGG — stays on-device" />
          <LocalImporter compact />
        </>
      )}
      {history.length > 0 && (
        <div className="mt-8 flex items-center justify-center gap-4 text-xs font-bold text-white/35">
          <Link href="/history" className="inline-flex items-center gap-1.5 hover:text-white"><Clock3 size={13} /> Full history</Link>
          <Link href="/liked" className="inline-flex items-center gap-1.5 hover:text-white"><Heart size={13} /> Liked songs</Link>
          <Link href="/library" className="inline-flex items-center gap-1.5 hover:text-white"><RotateCcw size={13} /> Library</Link>
        </div>
      )}
    </div>
  );
}
