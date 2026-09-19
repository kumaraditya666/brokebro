// BROKE MUSIC — local-first library store (likes, playlists, history,
// local tracks metadata, settings). Persisted to localStorage; audio blobs
// live in IndexedDB. Supabase sync is optional and explicit.
"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { HistoryItem, MusicSettings, Playlist, Track } from "@/types/music";
import { DEFAULT_SETTINGS } from "@/types/music";
import { uid } from "@/lib/music/format";
import { idbDel, idbGet, idbKeys, idbSet } from "@/lib/music/idb";

const HISTORY_LIMIT = 80;

interface LibraryState {
  likes: Record<string, Track>;
  playlists: Playlist[];
  history: HistoryItem[];
  localTracks: Track[];
  settings: MusicSettings;
  hydratedLocal: boolean;

  toggleLike: (t: Track) => void;
  isLiked: (id: string) => boolean;
  clearLikes: () => void;

  createPlaylist: (name: string, tracks?: Track[]) => string;
  renamePlaylist: (id: string, name: string) => void;
  deletePlaylist: (id: string) => void;
  addToPlaylist: (id: string, t: Track) => void;
  removeFromPlaylist: (id: string, trackId: string) => void;
  reorderPlaylist: (id: string, from: number, to: number) => void;

  pushHistory: (t: Track) => void;
  clearHistory: () => void;

  addLocalTracks: (tracks: Track[]) => void;
  removeLocalTrack: (id: string) => Promise<void>;
  clearLocalLibrary: () => Promise<void>;
  loadLocalBlobs: () => Promise<void>;

  updateSettings: (p: Partial<MusicSettings>) => void;
  resetAll: () => void;
}

export const useMusicLibrary = create<LibraryState>()(
  persist(
    (set, get) => ({
      likes: {},
      playlists: [],
      history: [],
      localTracks: [],
      settings: DEFAULT_SETTINGS,
      hydratedLocal: false,

      toggleLike: (t) =>
        set((s) => {
          const next = { ...s.likes };
          if (next[t.id]) delete next[t.id];
          else next[t.id] = t;
          return { likes: next };
        }),
      isLiked: (id) => Boolean(get().likes[id]),
      clearLikes: () => set({ likes: {} }),

      createPlaylist: (name, tracks = []) => {
        const id = uid("pl");
        const now = Date.now();
        const pl: Playlist = {
          id,
          name: name.trim() || "Untitled playlist",
          createdAt: now,
          updatedAt: now,
          trackIds: tracks.map((t) => t.id),
          tracks: [...tracks],
        };
        set((s) => ({ playlists: [pl, ...s.playlists] }));
        return id;
      },
      renamePlaylist: (id, name) =>
        set((s) => ({
          playlists: s.playlists.map((p) => (p.id === id ? { ...p, name, updatedAt: Date.now() } : p)),
        })),
      deletePlaylist: (id) => set((s) => ({ playlists: s.playlists.filter((p) => p.id !== id) })),
      addToPlaylist: (id, t) =>
        set((s) => ({
          playlists: s.playlists.map((p) =>
            p.id === id && !p.trackIds.includes(t.id)
              ? { ...p, trackIds: [...p.trackIds, t.id], tracks: [...p.tracks, t], updatedAt: Date.now() }
              : p,
          ),
        })),
      removeFromPlaylist: (id, trackId) =>
        set((s) => ({
          playlists: s.playlists.map((p) =>
            p.id === id
              ? {
                  ...p,
                  trackIds: p.trackIds.filter((x) => x !== trackId),
                  tracks: p.tracks.filter((x) => x.id !== trackId),
                  updatedAt: Date.now(),
                }
              : p,
          ),
        })),
      reorderPlaylist: (id, from, to) =>
        set((s) => ({
          playlists: s.playlists.map((p) => {
            if (p.id !== id) return p;
            const tracks = [...p.tracks];
            if (from < 0 || to < 0 || from >= tracks.length || to >= tracks.length) return p;
            const [m] = tracks.splice(from, 1);
            tracks.splice(to, 0, m);
            return { ...p, tracks, trackIds: tracks.map((t) => t.id), updatedAt: Date.now() };
          }),
        })),

      pushHistory: (t) =>
        set((s) => ({
          history: [{ track: t, playedAt: Date.now() }, ...s.history.filter((h) => h.track.id !== t.id)].slice(
            0,
            HISTORY_LIMIT,
          ),
        })),
      clearHistory: () => set({ history: [] }),

      addLocalTracks: (tracks) =>
        set((s) => {
          const ids = new Set(s.localTracks.map((t) => t.id));
          const fresh = tracks.filter((t) => !ids.has(t.id));
          return { localTracks: [...fresh, ...s.localTracks] };
        }),
      removeLocalTrack: async (id) => {
        const t = get().localTracks.find((x) => x.id === id);
        if (t?.objectUrl) URL.revokeObjectURL(t.objectUrl);
        try {
          await idbDel("blobs", id);
        } catch {
          /* ignore */
        }
        set((s) => ({ localTracks: s.localTracks.filter((x) => x.id !== id) }));
      },
      clearLocalLibrary: async () => {
        for (const t of get().localTracks) {
          if (t.objectUrl) URL.revokeObjectURL(t.objectUrl);
          try {
            await idbDel("blobs", t.id);
          } catch {
            /* ignore */
          }
        }
        set({ localTracks: [] });
      },
      loadLocalBlobs: async () => {
        if (get().hydratedLocal || typeof window === "undefined") return;
        try {
          const keys = await idbKeys("blobs");
          const metas = await Promise.all(
            keys.map(async (k) => {
              const blob = await idbGet<Blob>("blobs", k);
              const meta = await idbGet<Omit<Track, "streamUrl" | "objectUrl">>("meta", k);
              if (!blob || !meta) return null;
              const url = URL.createObjectURL(blob);
              return { ...meta, streamUrl: url, objectUrl: url, source: "Local", playable: true } as Track;
            }),
          );
          const valid = metas.filter((x): x is Track => Boolean(x));
          if (valid.length > 0) {
            set((s) => {
              const ids = new Set(s.localTracks.map((t) => t.id));
              return { localTracks: [...valid.filter((t) => !ids.has(t.id)), ...s.localTracks], hydratedLocal: true };
            });
          } else {
            set({ hydratedLocal: true });
          }
        } catch {
          set({ hydratedLocal: true });
        }
      },

      updateSettings: (p) => set((s) => ({ settings: { ...s.settings, ...p } })),
      resetAll: () =>
        set({ likes: {}, playlists: [], history: [], settings: DEFAULT_SETTINGS }),
    }),
    {
      name: "broke-music-v1",
      partialize: (s) => ({
        likes: s.likes,
        playlists: s.playlists,
        history: s.history,
        localTracks: s.localTracks.map(({ objectUrl, streamUrl, ...rest }) => rest as Track),
        settings: s.settings,
      }),
    },
  ),
);

/** Persist a local file blob + metadata, return the Track. */
export async function persistLocalFile(id: string, file: File, meta: Track): Promise<void> {
  try {
    await idbSet("blobs", id, file);
    const { objectUrl: _drop1, streamUrl: _drop2, ...rest } = meta;
    void _drop1;
    void _drop2;
    await idbSet("meta", id, rest);
  } catch {
    /* storage may be unavailable — library still works in-memory */
  }
}
