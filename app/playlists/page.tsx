// BROKE MUSIC — playlists index: create / open / delete.
"use client";

import Link from "next/link";
import { useState } from "react";
import { ListMusic, Play, Plus, Shuffle, Trash2 } from "lucide-react";
import { useMusicLibrary } from "@/store/useMusicLibrary";
import { usePlayer } from "@/components/music/PlayerProvider";
import { EmptyState, PageHeader } from "@/components/music/ui";

export default function PlaylistsPage() {
  const playlists = useMusicLibrary((s) => s.playlists);
  const createPlaylist = useMusicLibrary((s) => s.createPlaylist);
  const deletePlaylist = useMusicLibrary((s) => s.deletePlaylist);
  const { playList } = usePlayer();
  const [name, setName] = useState("");

  const create = () => {
    if (!name.trim()) return;
    createPlaylist(name.trim());
    setName("");
  };

  return (
    <div>
      <PageHeader kicker="Playlists" title="Your worlds" sub={`${playlists.length} ${playlists.length === 1 ? "playlist" : "playlists"} · stored on-device`} />
      <div className="glass flex flex-col gap-2 rounded-[1.4rem] p-4 sm:flex-row">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") create();
          }}
          placeholder="New playlist name…"
          aria-label="New playlist name"
          className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white placeholder:text-white/30 focus:border-lime-300/40 focus:outline-none"
        />
        <button onClick={create} data-magnetic className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-lime-300 to-emerald-300 px-6 py-3 text-sm font-bold text-black">
          <Plus size={16} /> Create
        </button>
      </div>
      {playlists.length === 0 ? (
        <div className="mt-4">
          <EmptyState title="No playlists yet" sub="Create one above, or tap + on any track to file it away. Drag to reorder inside." />
        </div>
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {playlists.map((p) => (
            <div key={p.id} className="glass group relative overflow-hidden rounded-[1.6rem] p-5">
              {/* collage */}
              <div className="mb-4 grid grid-cols-4 gap-1 overflow-hidden rounded-2xl">
                {[0, 1, 2, 3].map((i) => {
                  const t = p.tracks[i];
                  return (
                    <span key={i} className="aspect-square overflow-hidden bg-white/5">
                      {t?.artwork ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={t.artwork} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <span className="grid h-full w-full place-items-center bg-gradient-to-br from-violet-600/40 to-lime-500/20 text-white/50">
                          <ListMusic size={16} />
                        </span>
                      )}
                    </span>
                  );
                })}
              </div>
              <Link href={`/playlists/${p.id}`} className="font-display text-lg font-extrabold text-white hover:text-lime-200">
                {p.name}
              </Link>
              <p className="text-xs text-white/45">{p.tracks.length} {p.tracks.length === 1 ? "track" : "tracks"}</p>
              <div className="mt-4 flex gap-2">
                <button onClick={() => playList(p.tracks)} disabled={p.tracks.length === 0} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-black transition hover:scale-[1.02] disabled:opacity-40">
                  <Play size={13} fill="currentColor" /> Play
                </button>
                <button
                  onClick={() => playList([...p.tracks].sort(() => Math.random() - 0.5))}
                  disabled={p.tracks.length === 0}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-white/12 bg-white/5 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-white/10 disabled:opacity-40"
                >
                  <Shuffle size={13} /> Shuffle
                </button>
                <button onClick={() => { if (confirm(`Delete “${p.name}”?`)) deletePlaylist(p.id); }} aria-label={`Delete ${p.name}`} className="grid w-11 place-items-center rounded-xl border border-white/10 text-white/40 hover:text-red-300">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
