// BROKE MUSIC — single HTMLAudioElement + Web Audio graph.
// Chain: audio → MediaElementSource → 6 EQ biquads → Gain → Analyser → speakers.
// Client-side EQ only (no server processing claims). AudioContext is created
// lazily after a user gesture, per browser autoplay policy.
"use client";

import { EQ_FREQS } from "@/types/music";

let audio: HTMLAudioElement | null = null;
let ctx: AudioContext | null = null;
let analyser: AnalyserNode | null = null;
let filters: BiquadFilterNode[] = [];
let master: GainNode | null = null;
let graphReady = false;

export function getAudio(): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;
  if (!audio) {
    audio = new Audio();
    audio.preload = "auto";
    audio.crossOrigin = "anonymous";
  }
  return audio;
}

/** Must be called from a user gesture at least once. Safe to call repeatedly. */
export function ensureGraph(): boolean {
  if (typeof window === "undefined") return false;
  const el = getAudio();
  if (!el || graphReady) return graphReady;
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    const src = ctx.createMediaElementSource(el);
    filters = EQ_FREQS.map((f, i) => {
      const b = ctx!.createBiquadFilter();
      b.type = i === 0 ? "lowshelf" : i === filters.length - 1 || i === EQ_FREQS.length - 1 ? "highshelf" : "peaking";
      b.frequency.value = f;
      b.Q.value = 1.0;
      b.gain.value = 0;
      return b;
    });
    master = ctx.createGain();
    analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.82;
    let node: AudioNode = src;
    for (const f of filters) {
      node.connect(f);
      node = f;
    }
    node.connect(master);
    master.connect(analyser);
    analyser.connect(ctx.destination);
    graphReady = true;
    return true;
  } catch {
    return false;
  }
}

export function resumeContext(): void {
  try {
    if (ctx && ctx.state === "suspended") void ctx.resume();
  } catch {
    /* ignore */
  }
}

export function applyEq(bands: number[]): void {
  if (!graphReady) return;
  filters.forEach((f, i) => {
    try {
      f.gain.setTargetAtTime(bands[i] ?? 0, ctx?.currentTime ?? 0, 0.03);
    } catch {
      /* ignore */
    }
  });
}

export function getAnalyser(): AnalyserNode | null {
  return graphReady ? analyser : null;
}

export function freqData(): Uint8Array | null {
  if (!analyser) return null;
  const arr = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteFrequencyData(arr);
  return arr;
}

export function waveData(): Uint8Array | null {
  if (!analyser) return null;
  const arr = new Uint8Array(analyser.fftSize);
  analyser.getByteTimeDomainData(arr);
  return arr;
}
