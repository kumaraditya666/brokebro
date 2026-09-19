/**
 * BACKEND — aiMixService.ts (MOCK mix builder, engine mock-backend-v1)
 *
 * AIService.generateMixInstructions() contract:
 *   input:  { beat, vocal, reference|null, prompt, referenceInfluence }
 *   output: MixResult (structured JSON the UI consumes)
 *
 * Blend rule: user prompt dominates at 0% influence; reference production
 * traits pull params toward the reference at 100%. Identity is never cloned —
 * only production characteristics (levels, EQ curves, space, width).
 *
 * To go real: replace blendMix() internals with an LLM call + DSP preset
 * solver. Keep the MixChain JSON schema identical so the frontend,
 * FL Studio export, and future VST/plugin can reuse it unchanged.
 */
import type {
  BeatAnalysis, MixChain, MixResult, ReferenceAnalysis, ReferenceMatchRow, VocalAnalysis,
} from "@/types/vocalforge";
import { interpretPrompt } from "./promptInterpreter";

export interface GenerateInput {
  beat: BeatAnalysis;
  vocal: VocalAnalysis;
  reference: ReferenceAnalysis | null;
  prompt: string;
  referenceInfluence: number; // 0..100
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

function delayMsForBpm(bpm: number, kind: MixChain["delay"]["timeNote"]): number {
  const quarter = 60000 / Math.max(60, bpm);
  switch (kind) {
    case "1/8": return quarter / 2;
    case "1/8D": return (quarter / 2) * 1.5;
    case "1/4": return quarter;
    case "1/4D": return quarter * 1.5;
    case "Ping-Pong 1/8": return quarter / 2;
    case "Slap 110ms": return 110;
  }
}

export function generateMixInstructions(input: GenerateInput): MixResult {
  const { beat, vocal, reference, prompt, referenceInfluence } = input;
  const t = clamp(referenceInfluence, 0, 100) / 100;
  const instruction = interpretPrompt(prompt);
  const m = instruction.interpreted;

  // --- base from prompt ---
  const autotuneBase = m.autotune;
  const brightBase = m.brightness;
  const spaceBase = m.dreamy ? Math.max(m.spaciousness, 68) : m.spaciousness;
  const widthBase = m.width;

  // --- reference pull (production traits only) ---
  const ref = reference;
  const autotune = ref ? lerp(autotuneBase, ref.pitchCorrectionIntensity, t * 0.7) : autotuneBase;
  const brightness = ref ? lerp(brightBase, ref.eq.brightness, t * 0.6) : brightBase;
  const width = ref ? lerp(widthBase, ref.stereoWidth, t * 0.65) : widthBase;
  const space = ref ? lerp(spaceBase, (ref.reverb.amount + ref.delay.amount) / 2 + 15, t * 0.6) : spaceBase;
  const satBase = ref ? lerp(m.aggression, ref.saturation, t * 0.6) : m.aggression;

  const key = vocal.keyConfidence >= 0.4 ? vocal.approxKey : beat.musicalKey;
  const scale: MixChain["pitchCorrection"]["scale"] = /major/i.test(key) ? "Major" : "Minor";
  const retuneMs = autotune >= 78 ? 8 : autotune >= 60 ? 18 : autotune >= 40 ? 35 : 60;
  const retuneLabel = autotune >= 78 ? "Hard" : autotune >= 60 ? "Fast" : autotune >= 40 ? "Medium" : "Slow";

  const telephone = m.telephone;
  const toneProfile = telephone ? "Telephone" : m.radio ? "Radio" : brightness >= 68 ? "Bright" : brightness <= 42 ? "Dark" : "Neutral";

  const delayNote: MixChain["delay"]["timeNote"] =
    space >= 70 ? "1/8D" : space >= 50 ? "1/8" : "Slap 110ms";

  const chain: MixChain = {
    id: `chain_${Date.now().toString(36)}`,
    pitchCorrection: {
      enabled: true, key, scale,
      strength: Math.round(clamp(autotune, 0, 100)),
      retuneSpeedMs: retuneMs, retuneLabel,
      formantPreserve: 70,
    },
    eq: {
      lowCutHz: telephone ? 400 : 80,
      lowMidDb: Number(lerp(m.warmth >= 55 ? 1.5 : -0.5, 0, 0.3).toFixed(1)),
      presenceDb: Number((m.upfront >= 60 ? 2.5 : 1.2) + (brightness - 55) / 40).toFixed(1) as unknown as number,
      airDb: Number(((brightness - 50) / 18).toFixed(1)),
      toneProfile,
    },
    compression: {
      thresholdDb: m.punch >= 60 ? -18 : -14,
      ratio: m.punch >= 60 ? 4 : 3,
      attackMs: m.punch >= 60 ? 8 : 15,
      releaseMs: Math.round(clamp(60000 / Math.max(60, beat.bpm) * 1.5, 80, 320)),
      makeupDb: 3,
      punch: Math.round(m.punch),
    },
    deEsser: {
      enabled: true,
      frequencyHz: 6500,
      amount: Math.round(clamp(30 + vocal.sibilance * 50, 0, 100)),
    },
    saturation: {
      amount: Math.round(clamp(satBase, 0, 100)),
      type: telephone ? "Bitcrush-lite" : satBase > 45 ? "Tube" : "Tape",
      mix: telephone ? 60 : 25,
    },
    delay: {
      timeNote: delayNote,
      timeMs: Math.round(delayMsForBpm(beat.bpm, delayNote)),
      feedback: Math.round(ref ? lerp(28, ref.delay.feedback, t * 0.5) : 28),
      mix: Math.round(clamp(m.dryness > 55 ? 8 : space * 0.45, 0, 45)),
    },
    reverb: {
      type: m.dreamy || space >= 68 ? "Atmospheric" : space >= 50 ? "Hall" : "Plate",
      decaySec: Number((ref ? lerp(1.8, ref.reverb.decaySec, t * 0.5) : 1.8).toFixed(1)),
      preDelayMs: Math.round(clamp(60000 / Math.max(60, beat.bpm) / 4, 10, 60)),
      mix: Math.round(clamp(m.dryness > 55 ? 6 : space * 0.5, 0, 50)),
    },
    stereo: {
      width: Math.round(clamp(telephone ? 25 : width, 0, 100)),
      verseWidth: Math.round(clamp(width - 12, 10, 100)),
      chorusWidth: Math.round(clamp(width + 15, 10, 100)),
      monoLowBelowHz: 120,
    },
    sectionAutomation: vocal.sections.map((s) => {
      const isChorus = s.name === "Chorus";
      const isVerse = s.name === "Verse";
      return {
        section: s.name,
        width: Math.round(isChorus ? clamp(width + 15, 0, 100) : isVerse ? clamp(width - 12, 0, 100) : width),
        reverbMix: Math.round(isChorus ? clamp(space * 0.55 + 6, 0, 60) : clamp(space * 0.45, 0, 60)),
        delayMix: Math.round(isChorus ? clamp(space * 0.5 + 4, 0, 50) : clamp(space * 0.4, 0, 50)),
        autotune: Math.round(clamp(autotune + (isChorus ? 5 : 0), 0, 100)),
        presenceDb: Number((isChorus ? 2.8 : 1.8).toFixed(1)),
        note: isChorus ? "Wider + more space for lift" : isVerse ? "Tighter and drier to sit forward" : "Balanced default",
      };
    }),
    master: {
      vocalLevelDb: m.upfront >= 65 ? 1.5 : 0,
      beatLevelDb: -1,
      limiterCeilingDb: -1,
    },
  };

  const yours = {
    presence: clamp(50 + (m.upfront - 50) * 0.8, 0, 100),
    brightness, warmth: m.warmth,
    width: chain.stereo.width,
    dynamics: clamp(70 - chain.compression.ratio * 8, 0, 100),
    reverb: chain.reverb.mix * 2,
    delay: chain.delay.mix * 2,
    saturation: chain.saturation.amount,
  };
  const r = (v: number | undefined, fb: number) => Math.round(ref && v !== undefined ? v : fb);
  const matchRows: ReferenceMatchRow[] = [
    { key: "presence", label: "Vocal presence", reference: r(ref?.eq.presence, 70), yours: Math.round(yours.presence) },
    { key: "brightness", label: "Brightness", reference: r(ref?.eq.brightness, 60), yours: Math.round(yours.brightness) },
    { key: "warmth", label: "Warmth", reference: r(ref?.eq.warmth, 55), yours: Math.round(yours.warmth) },
    { key: "width", label: "Width", reference: r(ref?.stereoWidth, 60), yours: Math.round(yours.width) },
    { key: "dynamics", label: "Dynamics", reference: r(ref?.dynamics, 55), yours: Math.round(yours.dynamics) },
    { key: "reverb", label: "Reverb", reference: r(ref?.reverb.amount, 45), yours: Math.round(yours.reverb) },
    { key: "delay", label: "Delay", reference: r(ref?.delay.amount, 40), yours: Math.round(yours.delay) },
    { key: "saturation", label: "Saturation", reference: r(ref?.saturation, 25), yours: Math.round(yours.saturation) },
  ];

  return {
    mixId: `mix_${Date.now().toString(36)}`,
    chain, instruction, matchRows,
    referenceInfluence: Math.round(t * 100),
    confidence: Number((0.72 + Math.min(0.2, vocal.keyConfidence * 0.2)).toFixed(2)),
    engine: "mock-backend-v1",
    engineNote: "Simulated AI mix from the mock backend. Real LLM + DSP can replace this service without changing the API or UI.",
    createdAt: new Date().toISOString(),
  };
}
