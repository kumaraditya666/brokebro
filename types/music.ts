// BROKE MUSIC — shared music domain types.
// Legal-first: a Track is only playable when the source explicitly permits it.

export type RepeatMode = "off" | "all" | "one";

export type VisualMode = "minimal" | "wave" | "spectrum" | "orbital";

export type ThemeMode = "amoled" | "dark" | "light";

export interface Track {
  id: string;
  title: string;
  artist: string;
  album?: string;
  artwork?: string;
  duration?: number; // seconds
  streamUrl?: string;
  source: string; // e.g. "Demo" | "Jamendo" | "Local" | "SoundCloud"
  sourceUrl?: string;
  playable: boolean;
  genre?: string;
  // local-only fields (not synced)
  localId?: string;
  objectUrl?: string;
}

export interface Playlist {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  trackIds: string[];
  // denormalized snapshot so playlists survive provider changes
  tracks: Track[];
}

export interface HistoryItem {
  track: Track;
  playedAt: number;
}

export interface EqSettings {
  preset: string;
  bands: number[]; // dB per band, length EQ_FREQS.length
}

export interface MusicSettings {
  autoplay: boolean;
  defaultVolume: number; // 0..1
  crossfade: boolean;
  gapless: boolean;
  theme: ThemeMode;
  dynamicColors: boolean;
  animations: boolean;
  reducedMotion: boolean;
  visual: VisualMode;
  eq: EqSettings;
}

export interface MusicProvider {
  name: string;
  searchTracks(query: string): Promise<Track[]>;
  trending?(limit?: number): Promise<Track[]>;
  getTrack?(id: string): Promise<Track | null>;
}

export const EQ_FREQS = [60, 250, 1000, 4000, 8000, 12000];

export const EQ_PRESETS: Record<string, number[]> = {
  Flat: [0, 0, 0, 0, 0, 0],
  "Bass Boost": [7, 5, 1, 0, 0, 1],
  "Treble Boost": [-1, 0, 0, 3, 5, 6],
  Vocal: [-2, 1, 4, 4, 2, 0],
  Electronic: [6, 3, 0, 1, 4, 5],
  Chill: [3, 2, 1, 0, 1, 2],
  Rock: [4, 2, -1, 2, 4, 4],
};

export const DEFAULT_SETTINGS: MusicSettings = {
  autoplay: true,
  defaultVolume: 0.85,
  crossfade: false,
  gapless: true,
  theme: "amoled",
  dynamicColors: true,
  animations: true,
  reducedMotion: false,
  visual: "spectrum",
  eq: { preset: "Flat", bands: [...EQ_PRESETS.Flat] },
};
