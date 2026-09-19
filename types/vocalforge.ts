/**
 * VocalForge AI — shared domain types.
 *
 * These types are shared between frontend and backend (Next.js API routes).
 * The backend owns AI interpretation + audio processing. The frontend only
 * renders state and calls the API via lib/vocalforge/apiClient.ts.
 */

export type AudioSlot = "beat" | "vocal" | "reference";

export interface AudioFileMeta {
  id: string;
  slot: AudioSlot;
  name: string;
  size: number;
  mime: string;
  durationSec: number;
  /** object URL for local playback (frontend only, never sent to backend) */
  objectUrl?: string;
  uploadedAt: string;
}

export interface BeatAnalysis {
  bpm: number;
  bpmConfidence: number; // 0..1
  musicalKey: string; // e.g. "C Minor"
  keyConfidence: number;
  loudnessLufs: number;
  peakDb: number;
  durationSec: number;
  energy: number; // 0..1
  danceability: number; // 0..1
  waveformPeaks: number[]; // downsampled 0..1
  warnings: string[];
}

export interface VocalSection {
  name: "Intro" | "Verse" | "Pre-Chorus" | "Chorus" | "Bridge" | "Outro";
  startSec: number;
  endSec: number;
  confidence: number;
}

export interface VocalAnalysis {
  pitchMedianHz: number;
  pitchRangeCents: number;
  approxKey: string;
  keyConfidence: number;
  timingOffsetMs: number;
  loudnessLufs: number;
  dynamicRangeDb: number;
  sibilance: number; // 0..1
  breathiness: number; // 0..1
  durationSec: number;
  sections: VocalSection[];
  waveformPeaks: number[];
  warnings: string[];
}

export interface ReferenceAnalysis {
  vocalToInstrumentDb: number;
  eq: { brightness: number; warmth: number; presence: number; air: number }; // 0..100
  compression: { intensity: number; glue: number }; // 0..100
  pitchCorrectionIntensity: number; // 0..100
  reverb: { amount: number; decaySec: number; brightness: number }; // amount 0..100
  delay: { amount: number; feedback: number; stereoSpread: number };
  stereoWidth: number; // 0..100
  saturation: number; // 0..100
  dynamics: number; // 0..100 (higher = more dynamic)
  tonalNotes: string[];
  /** Always true: we model production, never identity. */
  productionOnly: true;
}

export interface MixInstruction {
  rawPrompt: string;
  interpreted: {
    autotune: number; // 0..100
    brightness: number; // 0..100 (50 neutral)
    warmth: number;
    upfront: number; // vocal forwardness
    width: number;
    spaciousness: number; // reverb+delay send
    dryness: number;
    punch: number;
    aggression: number; // saturation/distortion
    telephone: boolean;
    radio: boolean;
    dreamy: boolean;
  };
  keywords: string[];
  summary: string;
}

export interface PitchCorrectionSettings {
  enabled: boolean;
  key: string; // e.g. "C Minor"
  scale: "Minor" | "Major" | "Dorian" | "Phrygian" | "Chromatic" | "Pentatonic Minor" | "Pentatonic Major";
  strength: number; // 0..100
  retuneSpeedMs: number; // 0..100ms-ish, lower = harder
  retuneLabel: "Slow" | "Medium" | "Fast" | "Hard";
  formantPreserve: number; // 0..100
}

export interface EqSettings {
  lowCutHz: number;
  lowMidDb: number;
  presenceDb: number;
  airDb: number;
  toneProfile: "Dark" | "Neutral" | "Bright" | "Telephone" | "Radio";
}

export interface CompressionSettings {
  thresholdDb: number;
  ratio: number;
  attackMs: number;
  releaseMs: number;
  makeupDb: number;
  punch: number; // 0..100 helper
}

export interface DeEsserSettings {
  enabled: boolean;
  frequencyHz: number;
  amount: number; // 0..100
}

export interface SaturationSettings {
  amount: number; // 0..100
  type: "Tape" | "Tube" | "Console" | "Bitcrush-lite";
  mix: number;
}

export interface ReverbSettings {
  type: "Hall" | "Plate" | "Room" | "Chamber" | "Atmospheric";
  decaySec: number;
  preDelayMs: number;
  mix: number; // 0..100
}

export interface DelaySettings {
  timeNote: "1/8" | "1/8D" | "1/4" | "1/4D" | "Ping-Pong 1/8" | "Slap 110ms";
  timeMs: number;
  feedback: number; // 0..100
  mix: number; // 0..100
}

export interface StereoSettings {
  width: number; // 0..100
  chorusWidth: number;
  verseWidth: number;
  monoLowBelowHz: number;
}

export interface SectionAutomation {
  section: VocalSection["name"];
  width: number;
  reverbMix: number;
  delayMix: number;
  autotune: number;
  presenceDb: number;
  note: string;
}

export interface MixChain {
  id: string;
  pitchCorrection: PitchCorrectionSettings;
  eq: EqSettings;
  compression: CompressionSettings;
  deEsser: DeEsserSettings;
  saturation: SaturationSettings;
  delay: DelaySettings;
  reverb: ReverbSettings;
  stereo: StereoSettings;
  sectionAutomation: SectionAutomation[];
  master: { vocalLevelDb: number; beatLevelDb: number; limiterCeilingDb: number };
}

export interface ReferenceMatchRow {
  key: "presence" | "brightness" | "warmth" | "width" | "dynamics" | "reverb" | "delay" | "saturation";
  label: string;
  reference: number; // 0..100
  yours: number; // 0..100
}

export interface MixResult {
  mixId: string;
  chain: MixChain;
  instruction: MixInstruction;
  matchRows: ReferenceMatchRow[];
  referenceInfluence: number; // 0..100
  confidence: number;
  engine: "mock-backend-v1";
  engineNote: string;
  createdAt: string;
}

export type PipelineStageId =
  | "uploading"
  | "analyzing-beat"
  | "detecting-bpm"
  | "detecting-key"
  | "analyzing-vocal"
  | "detecting-pitch"
  | "analyzing-reference"
  | "understanding-instructions"
  | "building-chain"
  | "mixing"
  | "rendering"
  | "complete";

export interface PipelineStage {
  id: PipelineStageId;
  label: string;
  detail: string;
}

export const PIPELINE_STAGES: PipelineStage[] = [
  { id: "uploading", label: "Uploading", detail: "Securing your audio in session" },
  { id: "analyzing-beat", label: "Analyzing beat", detail: "Reading energy, loudness, waveform" },
  { id: "detecting-bpm", label: "Detecting BPM", detail: "Tempo + groove mapping" },
  { id: "detecting-key", label: "Detecting musical key", detail: "Harmonic estimate — you can override" },
  { id: "analyzing-vocal", label: "Analyzing vocal", detail: "Dynamics, sibilance, sections" },
  { id: "detecting-pitch", label: "Detecting pitch", detail: "Median pitch + range" },
  { id: "analyzing-reference", label: "Analyzing reference", detail: "Production traits only — never identity" },
  { id: "understanding-instructions", label: "Understanding your instructions", detail: "AI maps words → mix parameters" },
  { id: "building-chain", label: "Building vocal chain", detail: "Pitch → EQ → Comp → Space" },
  { id: "mixing", label: "Mixing", detail: "Balancing vocal against beat" },
  { id: "rendering", label: "Rendering", detail: "Printing preview mix" },
  { id: "complete", label: "Complete", detail: "Your AI mix is ready" },
];

export interface Project {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  beat?: AudioFileMeta | null;
  vocal?: AudioFileMeta | null;
  reference?: AudioFileMeta | null;
  prompt: string;
  referenceInfluence: number;
  simpleMode: boolean;
  beatAnalysis?: BeatAnalysis | null;
  vocalAnalysis?: VocalAnalysis | null;
  referenceAnalysis?: ReferenceAnalysis | null;
  mix?: MixResult | null;
  exportHistory: { id: string; kind: string; at: string; note: string }[];
}

export interface FlStudioPackageManifest {
  projectName: string;
  generatedAt: string;
  engine: string;
  files: { path: string; kind: string; note: string }[];
  mixSettings: MixChain;
  dawNotes: string[];
  pluginBridge: {
    status: "coming-soon";
    endpoint: string;
    description: string;
  };
}
