// BROKE MUSIC — bundled openly-playable demo catalog.
// These SoundHelix MP3s are provided for demo/testing and are explicitly
// streamable. They stand in for any CC / public-domain catalog until the
// user adds Jamendo credentials or local files. Zero ads, zero scraping.
import type { Track } from "@/types/music";

const MP3 = (n: number) => `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-${n}.mp3`;
const ART = (seed: string) => `https://picsum.photos/seed/${seed}/512/512`;

interface Seed {
  n: number;
  title: string;
  artist: string;
  album: string;
  genre: string;
  duration: number;
  seed: string;
}

const SEEDS: Seed[] = [
  { n: 1, title: "Midnight Static", artist: "Neon Coastline", album: "Afterglow", genre: "Electronic", duration: 376, seed: "bm-neon" },
  { n: 2, title: "Glass Hearts", artist: "Velvet Static", album: "Soft Machines", genre: "Indie", duration: 425, seed: "bm-glass" },
  { n: 3, title: "Low Orbit", artist: "Cassette Waves", album: "Low Orbit", genre: "Lo-fi", duration: 345, seed: "bm-orbit" },
  { n: 4, title: "Concrete Bloom", artist: "Night Bus", album: "City Petals", genre: "Hip-Hop", duration: 362, seed: "bm-bloom" },
  { n: 5, title: "Ultraviolet", artist: "PALMS//", album: "Ultraviolet", genre: "Electronic", duration: 313, seed: "bm-ultra" },
  { n: 6, title: "Slow Parade", artist: "Paper Moons", album: "Slow Parade", genre: "Indie", duration: 390, seed: "bm-parade" },
  { n: 7, title: "Honeydrip", artist: "SODA CLUB", album: "Honeydrip", genre: "Chill", duration: 402, seed: "bm-honey" },
  { n: 8, title: "Night Circuit", artist: "Vector Youth", album: "Night Circuit", genre: "Workout", duration: 355, seed: "bm-circuit" },
  { n: 9, title: "Daydream Tax", artist: "Velvet Static", album: "Soft Machines", genre: "Late Night", duration: 371, seed: "bm-daydream" },
  { n: 10, title: "Analog Dreams", artist: "Cassette Waves", album: "Tape Loop", genre: "Lo-fi", duration: 333, seed: "bm-analog" },
  { n: 11, title: "Chrome Petals", artist: "Neon Coastline", album: "Afterglow", genre: "Electronic", duration: 348, seed: "bm-chrome" },
  { n: 12, title: "Empty Rooms", artist: "Paper Moons", album: "Empty Rooms", genre: "Instrumental", duration: 382, seed: "bm-rooms" },
  { n: 13, title: "Fever Line", artist: "Night Bus", album: "Fever Line", genre: "Hip-Hop", duration: 367, seed: "bm-fever" },
  { n: 14, title: "Solar Bloom", artist: "PALMS//", album: "Solar", genre: "Chill", duration: 359, seed: "bm-solar" },
  { n: 15, title: "Wireframe", artist: "Vector Youth", album: "Wireframe", genre: "Workout", duration: 341, seed: "bm-wire" },
  { n: 16, title: "Last Train", artist: "SODA CLUB", album: "Last Train", genre: "Late Night", duration: 394, seed: "bm-train" },
];

export const DEMO_CATALOG: Track[] = SEEDS.map((s) => ({
  id: `demo-${s.n}`,
  title: s.title,
  artist: s.artist,
  album: s.album,
  artwork: ART(s.seed),
  duration: s.duration,
  streamUrl: MP3(s.n),
  source: "Demo",
  sourceUrl: "https://www.soundhelix.com",
  playable: true,
  genre: s.genre,
}));

export const DEMO_GENRES = [...new Set(DEMO_CATALOG.map((t) => t.genre ?? "Chill"))];

export function demoSearch(q: string): Track[] {
  const needle = q.trim().toLowerCase();
  if (!needle) return [];
  return DEMO_CATALOG.filter((t) =>
    `${t.title} ${t.artist} ${t.album ?? ""} ${t.genre ?? ""}`.toLowerCase().includes(needle),
  );
}

export function demoTrending(limit = 8): Track[] {
  return [...DEMO_CATALOG].sort((a, b) => a.id.localeCompare(b.id)).slice(0, limit);
}

export function demoByGenre(genre: string, limit = 6): Track[] {
  const g = genre.toLowerCase();
  const hits = DEMO_CATALOG.filter((t) => (t.genre ?? "").toLowerCase() === g);
  if (hits.length > 0) return hits.slice(0, limit);
  return DEMO_CATALOG.slice(0, limit);
}
