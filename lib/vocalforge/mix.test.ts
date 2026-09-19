/**
 * Contract tests for the mock backend (server/vocalforge/*).
 * These run in vitest via the lib/ include pattern; they import the pure
 * server modules to lock the API shapes the UI depends on.
 */
import { describe, expect, it } from "vitest";
import { interpretPrompt } from "@/server/vocalforge/promptInterpreter";
import { mockBeatAnalysis, mockVocalAnalysis, mockReferenceAnalysis } from "@/server/vocalforge/audioAnalysis";
import { generateMixInstructions } from "@/server/vocalforge/aiMixService";
import { buildFlStudioManifest } from "@/server/vocalforge/exportService";

describe("promptInterpreter", () => {
  it("maps heavy autotune + dark + dreamy wording to params", () => {
    const m = interpretPrompt("dark and emotional, strong autotune, atmospheric reverb, wide chorus");
    expect(m.interpreted.autotune).toBeGreaterThan(70);
    expect(m.interpreted.brightness).toBeLessThan(55);
    expect(m.interpreted.spaciousness).toBeGreaterThan(55);
  });
  it("handles empty prompt with a balanced default", () => {
    const m = interpretPrompt("");
    expect(m.keywords).toEqual([]);
    expect(m.summary).toMatch(/balanced/i);
  });
  it("detects telephone character without crashing on unknown words", () => {
    const m = interpretPrompt("xyzzy phone vocal plugh");
    expect(m.interpreted.telephone).toBe(true);
  });
});

describe("audioAnalysis mocks", () => {
  it("returns deterministic beat results with warnings for short files", () => {
    const a = mockBeatAnalysis("beat.mp3", 1000, 148);
    const b = mockBeatAnalysis("beat.mp3", 1000, 148);
    expect(a).toEqual(b);
    expect(a.bpm).toBeGreaterThan(60);
    expect(mockBeatAnalysis("x.mp3", 1, 5).warnings.length).toBeGreaterThan(0);
  });
  it("flags unreliable vocal key with a friendly warning", () => {
    const v = mockVocalAnalysis("take.wav", 1000, 4);
    expect(v.keyConfidence).toBeLessThan(0.4);
    expect(v.warnings.join(" ")).toMatch(/couldn't detect a reliable key/);
    expect(v.sections.length).toBeGreaterThan(0);
  });
  it("models reference production traits only", () => {
    const r = mockReferenceAnalysis("ref.mp3", 999, 200);
    expect(r.productionOnly).toBe(true);
  });
});

describe("aiMixService", () => {
  const beat = mockBeatAnalysis("beat.mp3", 8421000, 148);
  const vocal = mockVocalAnalysis("take.wav", 12500000, 96);
  const ref = mockReferenceAnalysis("ref.mp3", 9000000, 210);

  it("builds a complete chain from prompt alone", () => {
    const mix = generateMixInstructions({ beat, vocal, reference: null, prompt: "bright upfront vocal", referenceInfluence: 0 });
    expect(mix.chain.pitchCorrection.key).toBeTruthy();
    expect(mix.chain.sectionAutomation.length).toBe(vocal.sections.length);
    expect(mix.matchRows).toHaveLength(8);
    expect(mix.engine).toBe("mock-backend-v1");
  });
  it("pulls params toward the reference at 100% influence", () => {
    const lo = generateMixInstructions({ beat, vocal, reference: ref, prompt: "dry vocal", referenceInfluence: 0 });
    const hi = generateMixInstructions({ beat, vocal, reference: ref, prompt: "dry vocal", referenceInfluence: 100 });
    expect(hi.chain.reverb.mix).toBeGreaterThanOrEqual(lo.chain.reverb.mix);
  });
});

describe("exportService", () => {
  it("builds an honest FL package manifest (no .flp claims)", () => {
    const beat = mockBeatAnalysis("b.mp3", 10, 120);
    const vocal = mockVocalAnalysis("v.wav", 10, 60);
    const mix = generateMixInstructions({ beat, vocal, reference: null, prompt: "", referenceInfluence: 50 });
    const man = buildFlStudioManifest("My Project", mix.chain);
    expect(man.files.map((f) => f.path).join("\n")).toMatch(/Mix_Settings\.json/);
    expect(man.files.map((f) => f.path).join("\n")).not.toMatch(/\.flp/);
    expect(man.pluginBridge.status).toBe("coming-soon");
  });
});
