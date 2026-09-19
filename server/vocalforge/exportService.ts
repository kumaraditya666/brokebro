/**
 * BACKEND — exportService.ts
 * Builds the FL Studio project-package manifest. Real audio stems are rendered
 * by the (future) DSP backend; this mock describes the package layout so the
 * frontend + future FL plugin share one contract.
 *
 * We deliberately do NOT claim to emit a native .flp binary. The package is:
 *   VocalForge_Project/
 *     Vocal_Dry.wav / Vocal_Processed.wav / Beat.wav /
 *     Vocal_Reverb.wav / Vocal_Delay.wav /
 *     Mix_Settings.json / README.txt
 */
import type { FlStudioPackageManifest, MixChain } from "@/types/vocalforge";

export function buildFlStudioManifest(projectName: string, chain: MixChain): FlStudioPackageManifest {
  const safe = (projectName || "VocalForge_Project").replace(/[^\w\- ]+/g, "").trim() || "VocalForge_Project";
  return {
    projectName: safe,
    generatedAt: new Date().toISOString(),
    engine: "mock-backend-v1",
    files: [
      { path: `${safe}/Vocal_Dry.wav`, kind: "dry-vocal", note: "Your untouched vocal recording" },
      { path: `${safe}/Vocal_Processed.wav`, kind: "processed-vocal", note: "AI mix print with full chain" },
      { path: `${safe}/Beat.wav`, kind: "beat", note: "Your beat, level-matched" },
      { path: `${safe}/Vocal_Reverb.wav`, kind: "reverb-send", note: "100% wet reverb for FL mixer blending" },
      { path: `${safe}/Vocal_Delay.wav`, kind: "delay-send", note: "100% wet delay for FL mixer blending" },
      { path: `${safe}/Mix_Settings.json`, kind: "preset", note: "Full chain JSON — importable by future FL plugin" },
      { path: `${safe}/README.txt`, kind: "readme", note: "Step-by-step FL Studio import guide" },
    ],
    mixSettings: chain,
    dawNotes: [
      "1. Drag Vocal_Dry.wav onto a Mixer track (e.g. Insert 10).",
      "2. Recreate the chain from Mix_Settings.json (Pitch → EQ → Comp → De-esser → Saturation → Delay → Reverb → Stereo).",
      `3. Suggested starting point: Pitch ${chain.pitchCorrection.key} ${chain.pitchCorrection.scale} @ ${chain.pitchCorrection.strength}% (${chain.pitchCorrection.retuneLabel}), ` +
        `EQ low-cut ${chain.eq.lowCutHz}Hz / presence +${chain.eq.presenceDb}dB / air +${chain.eq.airDb}dB, ` +
        `Comp ${chain.compression.thresholdDb}dB / ${chain.compression.ratio}:1, ` +
        `Reverb ${chain.reverb.type} ${chain.reverb.decaySec}s @ ${chain.reverb.mix}%, ` +
        `Delay ${chain.delay.timeNote} (${chain.delay.timeMs}ms) @ ${chain.delay.mix}%.`,
      "4. Blend Vocal_Reverb.wav + Vocal_Delay.wav on separate mixer tracks for parallel control.",
      "5. Keep Beat.wav on its own track, sidechain-free, peaking with vocal 1–3 dB above instrumental.",
      "Native .flp writing is NOT included in this prototype — the JSON preset is the integration contract the future plugin will consume.",
    ],
    pluginBridge: {
      status: "coming-soon",
      endpoint: "POST /api/mix/generate + GET /api/export/fl-studio",
      description:
        "The future FL Studio plugin will send a vocal clip to the same backend endpoint the web studio uses, and receive the same MixChain JSON to instantiate native FL effects.",
    },
  };
}

export function readmeText(manifest: FlStudioPackageManifest): string {
  return [
    `${manifest.projectName} — VocalForge AI export (SIMULATED PREVIEW STEMS)`,
    `Generated: ${manifest.generatedAt} | Engine: ${manifest.engine}`,
    ``,
    ...manifest.dawNotes,
    ``,
    `Files:`,
    ...manifest.files.map((f) => ` - ${f.path} (${f.kind}): ${f.note}`),
    ``,
    `Note: preview stems in this prototype are rendered in-browser for auditioning.`,
    `Connect the production DSP backend (FFmpeg + pitch/DSP workers) for release-grade stems.`,
  ].join("\n");
}
