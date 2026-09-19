// BROKE MUSIC — provider abstraction. Modular: add a new legal provider by
// implementing MusicProvider and registering it in `providers`.
// NEVER scrape / rip / proxy YouTube, Spotify, JioSaavn, Gaana, etc.
// Only URLs the source API explicitly returns for playback are used.
import type { MusicProvider, Track } from "@/types/music";
import { DEMO_CATALOG, demoSearch, demoTrending } from "./catalog";

class DemoProvider implements MusicProvider {
  name = "Demo";
  async searchTracks(query: string): Promise<Track[]> {
    return demoSearch(query);
  }
  async trending(limit = 8): Promise<Track[]> {
    return demoTrending(limit);
  }
  async getTrack(id: string): Promise<Track | null> {
    return DEMO_CATALOG.find((t) => t.id === id) ?? null;
  }
}

interface JamendoRaw {
  id: string;
  name: string;
  artist_name: string;
  album_name?: string;
  album_image?: string;
  image?: string;
  duration?: number;
  audio?: string;
  audiodownload_allowed?: boolean;
  shareurl?: string;
}

// Jamendo requires a free client_id (https://developer.jamendo.com).
// Without it we gracefully return [] — never fake results.
class JamendoProvider implements MusicProvider {
  name = "Jamendo";
  private key(): string {
    return process.env.NEXT_PUBLIC_JAMENDO_CLIENT_ID ?? "";
  }
  enabled(): boolean {
    return this.key().length > 0;
  }
  async searchTracks(query: string): Promise<Track[]> {
    if (!this.enabled() || !query.trim()) return [];
    try {
      const url =
        `https://api.jamendo.com/v3.0/tracks/?client_id=${encodeURIComponent(this.key())}` +
        `&format=jsonpretty&limit=20&audioformat=mp32&include=musicinfo&search=${encodeURIComponent(query)}`;
      const res = await fetch(url);
      if (!res.ok) return [];
      const json = await res.json();
      const list: JamendoRaw[] = json?.results ?? [];
      return list
        .filter((r) => typeof r.audio === "string" && r.audio.length > 0)
        .map((r) => ({
          id: `jamendo-${r.id}`,
          title: r.name || "Untitled",
          artist: r.artist_name || "Unknown artist",
          album: r.album_name,
          artwork: r.album_image || r.image,
          duration: r.duration,
          streamUrl: r.audio,
          source: "Jamendo",
          sourceUrl: r.shareurl,
          playable: true,
        }));
    } catch {
      return [];
    }
  }
  async trending(limit = 8): Promise<Track[]> {
    if (!this.enabled()) return [];
    try {
      const url =
        `https://api.jamendo.com/v3.0/tracks/?client_id=${encodeURIComponent(this.key())}` +
        `&format=jsonpretty&limit=${limit}&audioformat=mp32&include=musicinfo&order=popularity_total_week`;
      const res = await fetch(url);
      if (!res.ok) return [];
      const json = await res.json();
      const list: JamendoRaw[] = json?.results ?? [];
      return list
        .filter((r) => r.audio)
        .map((r) => ({
          id: `jamendo-${r.id}`,
          title: r.name || "Untitled",
          artist: r.artist_name || "Unknown artist",
          album: r.album_name,
          artwork: r.album_image || r.image,
          duration: r.duration,
          streamUrl: r.audio,
          source: "Jamendo",
          sourceUrl: r.shareurl,
          playable: true,
        }));
    } catch {
      return [];
    }
  }
}

// SoundCloud: only playable when an official API integration explicitly
// permits in-app playback. This stub never extracts streams; it surfaces
// unplayable matches so the UI can show "Playback unavailable here".
class SoundCloudProvider implements MusicProvider {
  name = "SoundCloud";
  async searchTracks(): Promise<Track[]> {
    return [];
  }
}

export const demoProvider = new DemoProvider();
export const jamendoProvider = new JamendoProvider();
export const soundcloudProvider = new SoundCloudProvider();

export const providers: MusicProvider[] = [demoProvider, jamendoProvider, soundcloudProvider];

function dedupe(tracks: Track[]): Track[] {
  const seen = new Set<string>();
  return tracks.filter((t) => {
    if (seen.has(t.id)) return false;
    seen.add(t.id);
    return true;
  });
}

/** Search every registered provider + local tracks. Never assumes playability. */
export async function searchAll(query: string, local: Track[] = []): Promise<Track[]> {
  const q = query.trim();
  if (!q) return [];
  const needle = q.toLowerCase();
  const localHits = local
    .filter((t) => `${t.title} ${t.artist} ${t.album ?? ""}`.toLowerCase().includes(needle))
    .map((t) => ({ ...t, source: "Local", playable: Boolean(t.streamUrl || t.objectUrl) }));
  const settled = await Promise.allSettled(providers.map((p) => p.searchTracks(q)));
  const remote = settled.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
  return dedupe([...localHits, ...remote]);
}

/** Trending / discover feed from permitted providers only. */
export async function getTrending(limit = 10): Promise<Track[]> {
  const [demo, jam] = await Promise.all([
    demoProvider.trending(limit).catch(() => [] as Track[]),
    jamendoProvider.trending(limit).catch(() => [] as Track[]),
  ]);
  const merged = dedupe([...jam, ...demo]);
  return merged.length > 0 ? merged.slice(0, limit) : demoTrending(limit);
}

export function jamendoEnabled(): boolean {
  return jamendoProvider.enabled();
}
