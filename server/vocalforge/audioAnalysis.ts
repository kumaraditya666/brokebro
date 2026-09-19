/**
 * BACKEND — audioAnalysis.ts (MOCK deterministic analysis, engine mock-backend-v1)
 *
 * Real implementation roadmap (do NOT implement in frontend):
 *  - BPM: onset detection / Essentia / aubio
 *  - Key: chroma + Krumhansl profiles
 *  - Loudness: ITU-R BS.1770 (ffmpeg ebur128)
 *  - Vocal pitch: PYIN / CREPE
 *  - Sections: self-similarity matrix / All-in-one segmentation
 *  - Reference traits: spectral centroid, crest factor, stereo correlation,
 *    RT60 estimate, transient density — production traits only.
 *
 * Mock is deterministic: seeded by file name+size so the same upload gives
 * the same believable result, and different files vary.
 */
import type { BeatAnalysis, VocalAnalysis, ReferenceAnalysis, VocalSection } from "@/types/vocalforge";

function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function mulberry(seed: number) {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const KEYS = ["C Minor", "G Minor", "A Minor", "F Minor", "D Minor", "E Minor", "C Major", "G Major", "A Major", "F Major", "Bb Minor", "Eb Minor"];
const BPM_POOL = [128, 130, 135, 140, 142, 144, 148, 150, 152, 96, 100, 75, 85];

export function peaksFor(seedStr: string, n = 96): number[] {
  const rnd = mulberry(hashSeed(seedStr));
  const out: number[] = [];
  let env = 0.5;
  for (let i = 0; i < n; i++) {
    env += (rnd() - 0.5) * 0.35;
    env = Math.min(1, Math.max(0.08, env));
    const beat = 0.25 * Math.max(0, Math.sin((i / n) * Math.PI * 8)) ;
    out.push(Number(Math.min(1, env * 0.8 + beat + rnd() * 0.12).toFixed(3)));
  }
  return out;
}

export function mockBeatAnalysis(name: string, size: number, durationSec: number): BeatAnalysis {
  const rnd = mulberry(hashSeed(name + size));
  const bpm = BPM_POOL[Math.floor(rnd() * BPM_POOL.length)];
  const musicalKey = KEYS[Math.floor(rnd() * KEYS.length)];
  const warnings: string[] = [];
  let keyConfidence = 0.55 + rnd() * 0.35;
  if (durationSec < 10) { warnings.push("Beat is very short — key estimate is less reliable."); keyConfidence -= 0.15; }
  return {
    bpm, bpmConfidence: Number((0.7 + rnd() * 0.28).toFixed(2)),
    musicalKey, keyConfidence: Number(keyConfidence.toFixed(2)),
    loudnessLufs: Number((-12 + rnd() * 5).toFixed(1)),
    peakDb: Number((-3 + rnd() * 2.4).toFixed(1)),
    durationSec, energy: Number((0.5 + rnd() * 0.45).toFixed(2)),
    danceability: Number((0.5 + rnd() * 0.4).toFixed(2)),
    waveformPeaks: peaksFor("beat:" + name, 96),
    warnings,
  };
}

function buildSections(durationSec: number, seed: number): VocalSection[] {
  const rnd = mulberry(seed);
  const names: VocalSection["name"][] = ["Intro", "Verse", "Pre-Chorus", "Chorus", "Bridge", "Outro"];
  // proportional template scaled to duration
  const template: [VocalSection["name"], number][] = [
    ["Intro", 0.06], ["Verse", 0.28], ["Pre-Chorus", 0.12], ["Chorus", 0.3], ["Bridge", 0.12], ["Outro", 0.12],
  ];
  let t = 0;
  return template.map(([name, frac]) => {
    const start = t;
    const end = Math.min(durationSec, t + durationSec * frac);
    t = end;
    return { name, startSec: Number(start.toFixed(1)), endSec: Number(end.toFixed(1)), confidence: Number((0.55 + rnd() * 0.35).toFixed(2)) };
  }).filter((s) => s.endSec > s.startSec);
}

export function mockVocalAnalysis(name: string, size: number, durationSec: number): VocalAnalysis {
  const seed = hashSeed(name + size);
  const rnd = mulberry(seed);
  const approxKey = KEYS[Math.floor(rnd() * KEYS.length)];
  const warnings: string[] = [];
  let keyConfidence = 0.5 + rnd() * 0.35;
  if (durationSec < 8) {
    warnings.push("Your vocal uploaded successfully, but we couldn't detect a reliable key. You can choose the key manually.");
    keyConfidence = 0.32;
  }
  if (size < 50_000) warnings.push("Vocal file is very small — dynamics estimate may be noisy.");
  return {
    pitchMedianHz: Math.round(150 + rnd() * 160),
    pitchRangeCents: Math.round(300 + rnd() * 700),
    approxKey, keyConfidence: Number(keyConfidence.toFixed(2)),
    timingOffsetMs: Math.round((rnd() - 0.5) * 60),
    loudnessLufs: Number((-20 + rnd() * 6).toFixed(1)),
    dynamicRangeDb: Number((8 + rnd() * 10).toFixed(1)),
    sibilance: Number((0.3 + rnd() * 0.5).toFixed(2)),
    breathiness: Number((0.2 + rnd() * 0.5).toFixed(2)),
    durationSec,
    sections: buildSections(durationSec || 60, seed),
    waveformPeaks: peaksFor("vocal:" + name, 96),
    warnings,
  };
}

export function mockReferenceAnalysis(name: string, size: number, durationSec: number): ReferenceAnalysis {
  const rnd = mulberry(hashSeed("ref:" + name + size));
  const r = (a: number, b: number) => Number((a + rnd() * (b - a)).toFixed(0));
  return {
    vocalToInstrumentDb: Number((1 + rnd() * 4).toFixed(1)),
    eq: { brightness: r(45, 85), warmth: r(35, 75), presence: r(50, 90), air: r(40, 85) },
    compression: { intensity: r(45, 85), glue: r(40, 80) },
    pitchCorrectionIntensity: r(35, 90),
    reverb: { amount: r(25, 75), decaySec: Number((1 + rnd() * 2.2).toFixed(1)), brightness: r(30, 80) },
    delay: { amount: r(15, 70), feedback: r(15, 55), stereoSpread: r(30, 85) },
    stereoWidth: r(40, 85),
    saturation: r(5, 60),
    dynamics: r(30, 80),
    tonalNotes: [
      "Lead sits slightly above the instrumental bed.",
      "Upper-mid presence with controlled sibilance.",
      "Medium-length space, wider in choruses.",
    ],
    productionOnly: true,
  };
}
