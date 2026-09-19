// BROKE MUSIC — search: debounce, `/` shortcut, skeleton, empty, error,
// source badges, never assumes playability.
"use client";

import { useEffect, useMemo, useState } from "react";
import { SearchX, TriangleAlert } from "lucide-react";
import type { Track } from "@/types/music";
import { searchAll } from "@/lib/music/providers";
import { useMusicLibrary } from "@/store/useMusicLibrary";
import { SearchBox } from "@/components/music/SearchBox";
import { TrackRow } from "@/components/music/TrackViews";
import { EmptyState, PageHeader, TrackSkeletonRow } from "@/components/music/ui";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [results, setResults] = useState<Track[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const localTracks = useMusicLibrary((s) => s.localTracks);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 350);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    if (!debounced) {
      setResults(null);
      setError(null);
      setLoading(false);
      return;
    }
    let alive = true;
    setLoading(true);
    setError(null);
    searchAll(debounced, localTracks)
      .then((r) => {
        if (alive) setResults(r);
      })
      .catch(() => {
        if (alive) setError("Search hiccup — check your connection and try again.");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [debounced, localTracks]);

  const playable = useMemo(() => results?.filter((t) => t.playable) ?? [], [results]);
  const unplayable = useMemo(() => results?.filter((t) => !t.playable) ?? [], [results]);

  return (
    <div>
      <PageHeader kicker="Search" title="What are we finding?" sub="Across Demo vault, Jamendo (if connected) and your local files." />
      <SearchBox value={query} onChange={setQuery} loading={loading} autoFocus />
      {!debounced && (
        <div className="mt-6">
          <EmptyState
            title="Search songs, artists, albums…"
            sub="Try “neon”, “lo-fi”, “night bus” — or add your own MP3s in Library and search them here."
          />
          <div className="mt-3 flex flex-wrap gap-2">
            {["neon", "lo-fi", "night", "chill", "workout"].map((s) => (
              <button key={s} onClick={() => setQuery(s)} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-white/60 hover:text-white">
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
      {loading && debounced && (
        <div className="mt-5 space-y-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <TrackSkeletonRow key={i} />
          ))}
        </div>
      )}
      {error && (
        <div className="mt-5 flex items-center gap-2.5 rounded-2xl border border-red-400/25 bg-red-500/8 p-4 text-sm font-semibold text-red-200">
          <TriangleAlert size={17} /> {error}
        </div>
      )}
      {!loading && !error && debounced && results && results.length === 0 && (
        <div className="mt-6">
          <EmptyState
            title="No matches"
            sub={`Nothing for “${debounced}” in connected catalogs. Check spelling, or add local files — they’re searchable instantly.`}
          />
        </div>
      )}
      {!loading && results && results.length > 0 && (
        <div className="mt-6">
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-white/40">
            {playable.length} playable · {unplayable.length} unavailable
          </p>
          <div className="space-y-2">
            {results.map((t, i) => (
              <TrackRow key={t.id} track={t} queue={results} index={i} />
            ))}
          </div>
          {unplayable.length > 0 && (
            <p className="mt-4 flex items-start gap-2 text-[11px] leading-relaxed text-white/35">
              <SearchX size={13} className="mt-0.5 shrink-0" />
              Unavailable tracks are searchable but can’t legally stream here — use “Open source” to listen where the rights allow.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
