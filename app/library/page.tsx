// BROKE MUSIC — library: local files, artists, albums, quick links.
"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Disc3, Heart, History, ListMusic, MicVocal, Trash2 } from "lucide-react";
import { useMusicLibrary } from "@/store/useMusicLibrary";
import { usePlayer } from "@/components/music/PlayerProvider";
import { LocalImporter } from "@/components/music/LocalImporter";
import { TrackRow } from "@/components/music/TrackViews";
import { EmptyState, PageHeader, SectionTitle } from "@/components/music/ui";

export default function LibraryPage() {
  const localTracks = useMusicLibrary((s) => s.localTracks);
  const removeLocalTrack = useMusicLibrary((s) => s.removeLocalTrack);
  const clearLocalLibrary = useMusicLibrary((s) => s.clearLocalLibrary);
  const loadLocalBlobs = useMusicLibrary((s) => s.loadLocalBlobs);
  const likes = useMusicLibrary((s) => s.likes);
  const playlists = useMusicLibrary((s) => s.playlists);
  const history = useMusicLibrary((s) => s.history);
  const { playList } = usePlayer();

  useEffect(() => {
    loadLocalBlobs();
  }, [loadLocalBlobs]);

  const artists = [...new Set(localTracks.map((t) => t.artist))];
  const albums = [...new Set(localTracks.map((t) => t.album ?? "Local files"))];

  return (
    <div>
      <PageHeader kicker="Library" title="Your stash" sub="Local files live on this device. Likes, playlists and history sync nowhere unless you say so." />
      <div className="grid gap-2 sm:grid-cols-3">
        {[
          { href: "/liked", icon: Heart, label: "Liked Songs", sub: `${Object.keys(likes).length} tracks` },
          { href: "/playlists", icon: ListMusic, label: "Playlists", sub: `${playlists.length} playlists` },
          { href: "/history", icon: History, label: "History", sub: `${history.length} plays` },
        ].map((c) => (
          <Link key={c.href} href={c.href} data-magnetic className="glass flex items-center gap-3 rounded-[1.4rem] p-4 transition hover:border-lime-300/30">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/5 text-lime-300"><c.icon size={19} /></span>
            <span>
              <span className="font-display block text-sm font-extrabold text-white">{c.label}</span>
              <span className="block text-[11px] text-white/45">{c.sub}</span>
            </span>
          </Link>
        ))}
      </div>

      <SectionTitle title="Local music" sub={`${localTracks.length} ${localTracks.length === 1 ? "file" : "files"} on this device`} />
      <LocalImporter />
      {localTracks.length === 0 ? (
        <div className="mt-3">
          <EmptyState title="No local files yet" sub="Add MP3 / WAV / FLAC / OGG above — they’ll appear here with artists, albums and instant search." />
        </div>
      ) : (
        <>
          <div className="mt-4 flex flex-wrap gap-2">
            <button onClick={() => playList(localTracks)} className="rounded-2xl bg-gradient-to-r from-lime-300 to-emerald-300 px-5 py-2.5 text-sm font-bold text-black">Play all local</button>
            <button
              onClick={() => {
                if (confirm("Remove all local files from the library? (Files on disk are untouched; blobs on this device are deleted.)")) void clearLocalLibrary();
              }}
              className="inline-flex items-center gap-1.5 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-bold text-white/60 hover:text-red-300"
            >
              <Trash2 size={13} /> Clear local
            </button>
          </div>
          <div className="mt-4 space-y-2">
            {localTracks.map((t, i) => (
              <div key={t.id} className="relative">
                <TrackRow track={t} queue={localTracks} index={i} />
                <button onClick={() => void removeLocalTrack(t.id)} aria-label={`Remove ${t.title}`} className="absolute right-2 top-2 text-[10px] font-bold text-white/25 hover:text-red-300">
                  remove
                </button>
              </div>
            ))}
          </div>
          {artists.length > 0 && (
            <>
              <SectionTitle title="Artists" sub={`${artists.length} on device`} />
              <div className="flex flex-wrap gap-2">
                {artists.map((a) => (
                  <span key={a} className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-white/70">
                    <MicVocal size={13} className="text-violet-300" /> {a}
                  </span>
                ))}
              </div>
              <SectionTitle title="Albums" sub={`${albums.length} on device`} />
              <div className="flex flex-wrap gap-2">
                {albums.map((a) => (
                  <span key={a} className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-white/70">
                    <Disc3 size={13} className="text-lime-300" /> {a}
                  </span>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
