// BROKE MUSIC — discover: genre sections from permitted providers only.
"use client";

import { useEffect, useState } from "react";
import { Flame } from "lucide-react";
import type { Track } from "@/types/music";
import { DEMO_CATALOG, DEMO_GENRES, demoByGenre } from "@/lib/music/catalog";
import { getTrending } from "@/lib/music/providers";
import { TrackCard, TrackRow } from "@/components/music/TrackViews";
import { PageHeader, SectionTitle, Skeleton } from "@/components/music/ui";
import { usePlayer } from "@/components/music/PlayerProvider";

const SHELVES: { title: string; sub: string; genre: string }[] = [
  { title: "New discoveries", sub: "Fresh from the demo vault", genre: "__new" },
  { title: "Chill", sub: "Low stakes, soft glow", genre: "Chill" },
  { title: "Workout", sub: "Loud. Fast. No skips.", genre: "Workout" },
  { title: "Late Night", sub: "For 1am thoughts", genre: "Late Night" },
  { title: "Electronic", sub: "Neon and chrome", genre: "Electronic" },
  { title: "Hip-Hop", sub: "Heavy drums, heavier moods", genre: "Hip-Hop" },
  { title: "Indie", sub: "Guitars with feelings", genre: "Indie" },
  { title: "Lo-fi", sub: "Study / rot / repeat", genre: "Lo-fi" },
  { title: "Instrumental", sub: "No words, all vibe", genre: "Instrumental" },
];

export default function DiscoverPage() {
  const [trending, setTrending] = useState<Track[] | null>(null);
  const { playList } = usePlayer();

  useEffect(() => {
    getTrending(10).then(setTrending).catch(() => setTrending(DEMO_CATALOG.slice(0, 10)));
  }, []);

  return (
    <div>
      <PageHeader kicker="Discover" title="Find your next obsession" sub="Every shelf below is playable right now — no dead ends, no grey-area rips." />
      <SectionTitle title="Trending now" sub="Most-played across permitted catalogs" right={<Flame size={16} className="text-orange-300" />} />
      {!trending ? (
        <div className="grid gap-2 sm:grid-cols-2">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-[76px]" />)}</div>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {trending.slice(0, 6).map((t, i) => (
            <TrackRow key={t.id} track={t} queue={trending} index={i} />
          ))}
        </div>
      )}
      {SHELVES.map((s) => {
        const tracks = s.genre === "__new" ? [...DEMO_CATALOG].reverse().slice(0, 6) : demoByGenre(s.genre, 6);
        if (tracks.length === 0) return null;
        return (
          <div key={s.title}>
            <SectionTitle
              title={s.title}
              sub={s.sub}
              right={<button onClick={() => playList(tracks)} className="text-xs font-bold text-lime-300 hover:underline">Play shelf</button>}
            />
            <div className="no-scrollbar -mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-1">
              {tracks.map((t, i) => (
                <TrackCard key={t.id} track={t} queue={tracks} index={i} />
              ))}
            </div>
          </div>
        );
      })}
      <p className="mt-8 text-center text-[11px] text-white/30">
        Genres available: {DEMO_GENRES.join(" · ")} — connect a Jamendo client ID to expand this shelf legally.
      </p>
    </div>
  );
}
