// BROKE MUSIC — lyrics architecture.
// Only lyrics from a provider whose terms permit in-app display are shown.
// No scraping of copyrighted lyrics sites. Returns null → "No lyrics available".
import type { Track } from "@/types/music";

export interface LyricLine {
  t: number; // seconds
  text: string;
}

export interface LyricsResult {
  text?: string;
  lines?: LyricLine[];
  source?: string;
  synced: boolean;
}

export function parseLrc(lrc: string): LyricLine[] {
  const lines: LyricLine[] = [];
  const re = /\[(\d+):(\d+(?:\.\d+)?)\]\s*(.*)/;
  for (const raw of lrc.split("\n")) {
    const m = raw.match(re);
    if (!m) continue;
    const t = parseInt(m[1], 10) * 60 + parseFloat(m[2]);
    const text = m[3].trim();
    if (text) lines.push({ t, text });
  }
  return lines.sort((a, b) => a.t - b.t);
}

/** Placeholder for a licensed lyrics provider (e.g. Musixmatch/LRCLIB with terms). */
export async function getLyrics(track: Track): Promise<LyricsResult | null> {
  void track;
  // No licensed lyrics provider is wired in this build.
  // Wire one here (server-side, respecting its ToS) and return synced lines.
  return null;
}

export function activeLyricIndex(lines: LyricLine[] | undefined, time: number): number {
  if (!lines || lines.length === 0) return -1;
  let idx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].t <= time + 0.15) idx = i;
    else break;
  }
  return idx;
}
