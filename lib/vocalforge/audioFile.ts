/**
 * FRONTEND — audio file helpers. Validation + duration + peak extraction.
 * Heavy decode runs once per file; waveform peaks are downsampled so large
 * files never freeze the UI.
 */
import type { AudioSlot } from "@/types/vocalforge";

export const ACCEPT_BY_SLOT: Record<AudioSlot, { accept: string; exts: string[]; maxMb: number }> = {
  beat: { accept: "audio/mpeg,audio/wav,audio/x-wav,audio/mp4,audio/aac,audio/ogg,audio/flac,.mp3,.wav,.m4a,.ogg,.flac", exts: ["mp3", "wav", "m4a", "ogg", "flac", "aac"], maxMb: 150 },
  vocal: { accept: "audio/wav,audio/mpeg,audio/mp4,.wav,.mp3,.m4a", exts: ["wav", "mp3", "m4a"], maxMb: 150 },
  reference: { accept: "audio/mpeg,audio/wav,audio/mp4,audio/ogg,.mp3,.wav,.m4a,.ogg", exts: ["mp3", "wav", "m4a", "ogg"], maxMb: 150 },
};

export function validateAudioFile(file: File, slot: AudioSlot): string | null {
  const cfg = ACCEPT_BY_SLOT[slot];
  const ext = (file.name.split(".").pop() || "").toLowerCase();
  if (!cfg.exts.includes(ext)) {
    return `"${file.name}" isn't a supported ${slot} format. Try ${cfg.exts.join(", ").toUpperCase()}.`;
  }
  if (file.size > cfg.maxMb * 1024 * 1024) {
    return `"${file.name}" is over the ${cfg.maxMb} MB prototype limit. Trim or compress it and retry.`;
  }
  if (file.size === 0) return `"${file.name}" looks empty or corrupted. Try exporting it again.`;
  return null;
}

export function probeDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const el = document.createElement("audio");
    el.preload = "metadata";
    const done = (d: number) => { URL.revokeObjectURL(url); resolve(d); };
    el.onloadedmetadata = () => done(Number.isFinite(el.duration) ? el.duration : 0);
    el.onerror = () => done(0);
    el.src = url;
    setTimeout(() => done(0), 8000);
  });
}

/** Fast peak extraction for waveform display (not analysis-grade). */
export async function extractPeaks(file: File, buckets = 96): Promise<number[]> {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const buf = await file.arrayBuffer();
    const audio = await ctx.decodeAudioData(buf.slice(0));
    const ch = audio.getChannelData(0);
    const step = Math.max(1, Math.floor(ch.length / buckets));
    const peaks: number[] = [];
    for (let i = 0; i < ch.length; i += step) {
      let max = 0;
      for (let j = i; j < Math.min(i + step, ch.length); j += Math.max(1, Math.floor(step / 16))) {
        const v = Math.abs(ch[j]);
        if (v > max) max = v;
      }
      peaks.push(Number(Math.min(1, max * 1.4).toFixed(3)));
      if (peaks.length >= buckets) break;
    }
    void ctx.close().catch(() => undefined);
    return peaks.length ? peaks : fallbackPeaks(buckets);
  } catch {
    return fallbackPeaks(buckets);
  }
}

function fallbackPeaks(n: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < n; i++) out.push(Number((0.25 + 0.35 * Math.abs(Math.sin(i * 0.55)) + 0.1 * Math.abs(Math.sin(i * 2.3))).toFixed(3)));
  return out;
}

export function fmtTime(sec: number): string {
  if (!Number.isFinite(sec) || sec <= 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function fmtSize(bytes: number): string {
  if (bytes > 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}
