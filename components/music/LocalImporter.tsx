// BROKE MUSIC — local music importer: drag-drop + file picker, MP3/WAV/
// FLAC/OGG/M4A where the browser allows. Metadata in IndexedDB, blobs stay
// on-device unless the user explicitly enables cloud.
"use client";

import { useRef, useState } from "react";
import { FolderUp, Music2 } from "lucide-react";
import type { Track } from "@/types/music";
import { parseFileName, uid } from "@/lib/music/format";
import { persistLocalFile, useMusicLibrary } from "@/store/useMusicLibrary";

const ACCEPT = "audio/*,.mp3,.wav,.flac,.ogg,.oga,.m4a,.aac,.opus,.webm";

function probeDuration(file: File): Promise<number | undefined> {
  return new Promise((resolve) => {
    try {
      const url = URL.createObjectURL(file);
      const a = new Audio();
      a.preload = "metadata";
      const done = () => {
        const d = isFinite(a.duration) ? Math.round(a.duration) : undefined;
        URL.revokeObjectURL(url);
        resolve(d);
      };
      a.onloadedmetadata = done;
      a.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(undefined);
      };
      a.src = url;
      setTimeout(() => resolve(undefined), 6000);
    } catch {
      resolve(undefined);
    }
  });
}

export function LocalImporter({ compact }: { compact?: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);
  const addLocalTracks = useMusicLibrary((s) => s.addLocalTracks);

  const handleFiles = async (files: FileList | File[]) => {
    const list = [...files].filter((f) => f.type.startsWith("audio/") || /\.(mp3|wav|flac|ogg|oga|m4a|aac|opus|webm)$/i.test(f.name));
    if (list.length === 0) return;
    setBusy(true);
    try {
      const tracks: Track[] = [];
      for (const file of list) {
        const id = uid("local");
        const { artist, title } = parseFileName(file.name);
        const url = URL.createObjectURL(file);
        const duration = await probeDuration(file);
        const t: Track = {
          id,
          title,
          artist,
          album: "Local files",
          duration,
          streamUrl: url,
          objectUrl: url,
          localId: id,
          source: "Local",
          playable: true,
        };
        await persistLocalFile(id, file, t);
        tracks.push(t);
      }
      addLocalTracks(tracks);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) void handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          if (e.dataTransfer.files.length > 0) void handleFiles(e.dataTransfer.files);
        }}
        className={`rounded-[1.75rem] border-2 border-dashed p-6 text-center transition sm:p-8 ${
          drag ? "border-lime-300/70 bg-lime-300/5" : "border-white/12 bg-white/[0.02]"
        }`}
      >
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-white/5">
          <Music2 size={22} className="text-lime-300" />
        </div>
        <p className="font-display mt-3 font-extrabold text-white">{busy ? "Reading your files…" : "Drop audio files here"}</p>
        <p className="mx-auto mt-1 max-w-sm text-xs text-white/45">
          MP3 · WAV · FLAC · OGG · M4A (where supported). Files stay on this device — nothing uploads.
        </p>
        <button
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          data-magnetic
          className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-lime-300 to-emerald-300 px-5 py-2.5 text-sm font-bold text-black transition hover:-translate-y-0.5 disabled:opacity-60"
        >
          <FolderUp size={16} /> {compact ? "Add music" : "Add Music"}
        </button>
      </div>
    </div>
  );
}
