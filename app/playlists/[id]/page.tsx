// BROKE MUSIC — single playlist: header collage, rename, reorder, play.
"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { ArrowDown, ArrowUp, ListMusic, Pencil, Play, Shuffle, Trash2, X } from "lucide-react";
import { useMusicLibrary } from "@/store/useMusicLibrary";
import { usePlayer } from "@/components/music/PlayerProvider";
import { EmptyState, PageHeader } from "@/components/music/ui";

export default function PlaylistDetailPage() {
  const params = useParams();
  const raw = params?.id;
  const id = Array.isArray(raw) ? raw[0] ?? "" : (raw as string ?? "");
  const pl = useMusicLibrary((s) => s.playlists.find((p) => p.id === id));
  const renamePlaylist = useMusicLibrary((s) => s.renamePlaylist);
  const removeFromPlaylist = useMusicLibrary((s) => s.removeFromPlaylist);
  const reorderPlaylist = useMusicLibrary((s) => s.reorderPlaylist);
  const { playList, playTrack } = usePlayer();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");

  if (!pl) {
    return (
      <div>
        <PageHeader kicker="Playlist" title="Not found" sub="This playlist may have been deleted." />
        <EmptyState title="Gone like a deleted text" action={<Link href="/playlists" className="rounded-2xl bg-white px-5 py-2.5 text-sm font-bold text-black">All playlists</Link>} />
      </div>
    );
  }

  return (
    <div>
      {/* header collage */}
      <div className="glass relative overflow-hidden rounded-[2rem] p-6 sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end">
          <div className="grid h-36 w-36 shrink-0 grid-cols-2 gap-1 overflow-hidden rounded-[1.4rem] border border-white/10">
            {[0, 1, 2, 3].map((i) => {
              const t = pl.tracks[i];
              return (
                <span key={i} className="overflow-hidden bg-white/5">
                  {t?.artwork ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={t.artwork} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="grid h-full w-full place-items-center bg-gradient-to-br from-violet-600/40 to-lime-500/20 text-white/50">
                      <ListMusic size={18} />
                    </span>
                  )}
                </span>
              );
            })}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-lime-300/80">Playlist · {pl.tracks.length} tracks</p>
            {editing ? (
              <span className="mt-1 flex gap-2">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && name.trim()) {
                      renamePlaylist(pl.id, name.trim());
                      setEditing(false);
                    }
                  }}
                  autoFocus
                  className="w-full max-w-xs rounded-xl border border-lime-300/40 bg-black/40 px-3 py-2 text-lg font-extrabold text-white focus:outline-none"
                />
                <button
                  onClick={() => {
                    if (name.trim()) renamePlaylist(pl.id, name.trim());
                    setEditing(false);
                  }}
                  className="rounded-xl bg-lime-300 px-4 text-sm font-bold text-black"
                >
                  Save
                </button>
              </span>
            ) : (
              <h1 className="font-display mt-1 truncate text-3xl font-black tracking-tight text-white sm:text-4xl">{pl.name}</h1>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              <button onClick={() => playList(pl.tracks)} disabled={pl.tracks.length === 0} className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-lime-300 to-emerald-300 px-6 py-2.5 text-sm font-bold text-black disabled:opacity-40">
                <Play size={15} fill="currentColor" /> Play
              </button>
              <button onClick={() => playList([...pl.tracks].sort(() => Math.random() - 0.5))} disabled={pl.tracks.length === 0} className="inline-flex items-center gap-2 rounded-2xl border border-white/12 bg-white/5 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-40">
                <Shuffle size={15} /> Shuffle
              </button>
              <button onClick={() => { setName(pl.name); setEditing(true); }} className="inline-flex items-center gap-1.5 rounded-2xl border border-white/10 px-4 py-2.5 text-xs font-bold text-white/60 hover:text-white">
                <Pencil size={13} /> Rename
              </button>
            </div>
          </div>
        </div>
      </div>

      {pl.tracks.length === 0 ? (
        <div className="mt-4">
          <EmptyState title="Empty playlist" sub="Add tracks with the + button anywhere, or queue something up." action={<Link href="/search" className="text-sm font-bold text-lime-300 hover:underline">Search tracks →</Link>} />
        </div>
      ) : (
        <div className="mt-4 space-y-2">
          {pl.tracks.map((t, i) => (
            <div key={`${t.id}-${i}`} className="group flex items-center gap-2 rounded-2xl border border-white/5 bg-white/[0.02] p-2.5">
              <span className="w-6 text-center text-xs font-bold tabular-nums text-white/30">{i + 1}</span>
              {t.artwork && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={t.artwork} alt="" className="h-11 w-11 rounded-xl object-cover" />
              )}
              <button onClick={() => playTrack(t, pl.tracks)} className="min-w-0 flex-1 text-left">
                <span className="block truncate text-sm font-bold text-white">{t.title}</span>
                <span className="block truncate text-xs text-white/50">{t.artist}</span>
              </button>
              <span className="flex shrink-0 items-center gap-0.5">
                <button onClick={() => reorderPlaylist(pl.id, i, i - 1)} aria-label="Move up" disabled={i === 0} className="rounded p-1.5 text-white/35 hover:text-white disabled:opacity-20">
                  <ArrowUp size={13} />
                </button>
                <button onClick={() => reorderPlaylist(pl.id, i, i + 1)} aria-label="Move down" disabled={i === pl.tracks.length - 1} className="rounded p-1.5 text-white/35 hover:text-white disabled:opacity-20">
                  <ArrowDown size={13} />
                </button>
                <button onClick={() => removeFromPlaylist(pl.id, t.id)} aria-label="Remove" className="grid h-8 w-8 place-items-center rounded-full text-white/35 hover:bg-white/8 hover:text-red-300">
                  <X size={13} />
                </button>
              </span>
            </div>
          ))}
        </div>
      )}
      <p className="mt-6 text-center text-[11px] text-white/30">
        <Trash2 size={11} className="mr-1 inline" /> Tip: reorder with ↑ ↓ — order saves instantly, on-device.
      </p>
    </div>
  );
}
