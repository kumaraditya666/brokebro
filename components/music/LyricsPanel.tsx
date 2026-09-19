// BROKE MUSIC — lyrics panel. Licensed-only; otherwise a beautiful empty state.
"use client";

import { useEffect, useState } from "react";
import { MicVocal } from "lucide-react";
import type { Track } from "@/types/music";
import { activeLyricIndex, getLyrics, type LyricsResult } from "@/lib/music/lyrics";
import { usePlayer } from "./PlayerProvider";

export function LyricsPanel({ track }: { track: Track | null }) {
  const { currentTime } = usePlayer();
  const [lyrics, setLyrics] = useState<LyricsResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!track) {
      setLyrics(null);
      return;
    }
    setLoading(true);
    getLyrics(track)
      .then(setLyrics)
      .finally(() => setLoading(false));
  }, [track]);

  if (!track) {
    return (
      <div className="grid place-items-center rounded-3xl border border-white/8 bg-white/[0.02] p-10 text-center">
        <MicVocal size={22} className="text-white/30" />
        <p className="mt-2 text-sm font-bold text-white/60">Play something to see lyrics</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-2.5 rounded-3xl border border-white/8 bg-white/[0.02] p-6" aria-label="Loading lyrics">
        {[90, 70, 80, 55].map((w, i) => (
          <div key={i} className="shimmer h-4 rounded-full bg-white/5" style={{ width: `${w}%` }} />
        ))}
      </div>
    );
  }

  if (!lyrics || (!lyrics.text && (!lyrics.lines || lyrics.lines.length === 0))) {
    return (
      <div className="relative overflow-hidden rounded-3xl border border-white/8 bg-white/[0.02] p-10 text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-white/5">
          <MicVocal size={22} className="text-white/40" />
        </div>
        <p className="font-display mt-3 text-base font-extrabold text-white">No lyrics available</p>
        <p className="mx-auto mt-1 max-w-xs text-xs leading-relaxed text-white/45">
          We only show lyrics from providers whose terms allow it. No scraping, no grey-area mirrors.
        </p>
      </div>
    );
  }

  const idx = activeLyricIndex(lyrics.lines, currentTime);
  return (
    <div className="rounded-3xl border border-white/8 bg-black/30 p-6 backdrop-blur">
      <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.2em] text-white/35">
        Lyrics {lyrics.source ? `· ${lyrics.source}` : ""}
      </p>
      {lyrics.lines ? (
        <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
          {lyrics.lines.map((l, i) => (
            <p
              key={i}
              className={`text-sm leading-relaxed transition ${
                i === idx ? "font-extrabold text-lime-200" : i < idx ? "text-white/40" : "text-white/75"
              }`}
            >
              {l.text}
            </p>
          ))}
        </div>
      ) : (
        <p className="whitespace-pre-line text-sm leading-relaxed text-white/75">{lyrics.text}</p>
      )}
    </div>
  );
}
