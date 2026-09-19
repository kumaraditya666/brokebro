/**
 * BACKEND — promptInterpreter.ts (MOCK rule-based baseline, engine mock-backend-v1)
 *
 * Role: convert arbitrary natural-language descriptions into structured
 * MixInstruction. This baseline uses weighted keyword families so the UI works
 * today. It is INTENTIONALLY generic (not a hardcoded list of 9 examples):
 * unknown words are ignored gracefully, and the function signature is stable
 * so a real LLM can replace the body later:
 *
 *   async function interpretPromptLLM(prompt, ctx) -> MixInstruction
 *
 * Future LLM wiring: POST prompt + beat/vocal/reference summaries to an LLM
 * with a JSON-schema response matching MixInstruction. Secrets stay server-side.
 */
import type { MixInstruction } from "@/types/vocalforge";

interface Family {
  keys: RegExp;
  apply: (m: MixInstruction["interpreted"], strength: number) => void;
  label: string;
}

const FAMILIES: Family[] = [
  { keys: /autotune|t-?pain|pitch|robotic|hard tune/i, label: "autotune", apply: (m, s) => { m.autotune = clamp(m.autotune + 38 * s); } },
  { keys: /natural|subtle|transparent|light tune|soft tune/i, label: "natural-tune", apply: (m, s) => { m.autotune = clamp(m.autotune - 22 * s); } },
  { keys: /dark|moody|emotional|sad|deep|warm\b/i, label: "dark", apply: (m, s) => { m.brightness = clamp(m.brightness - 22 * s); m.warmth = clamp(m.warmth + 18 * s); } },
  { keys: /bright|airy|crisp|shiny|clear|polished/i, label: "bright", apply: (m, s) => { m.brightness = clamp(m.brightness + 22 * s); } },
  { keys: /upfront|forward|in your face|present|infront|up front|lead/i, label: "upfront", apply: (m, s) => { m.upfront = clamp(m.upfront + 26 * s); } },
  { keys: /wide|wider|chorus.*(big|wide)|big chorus|stereo/i, label: "wide", apply: (m, s) => { m.width = clamp(m.width + 26 * s); } },
  { keys: /dreamy|ethereal|atmospheric|spacey|floaty|hazy|reverb/i, label: "dreamy", apply: (m, s) => { m.spaciousness = clamp(m.spaciousness + 30 * s); m.dreamy = true; } },
  { keys: /\bdry\b|intimate|close|no reverb|no delay|minimal effects/i, label: "dry", apply: (m, s) => { m.dryness = clamp(m.dryness + 34 * s); m.spaciousness = clamp(m.spaciousness - 20 * s); } },
  { keys: /punch|punchy|knock|aggressive|hard|energy|power/i, label: "punch", apply: (m, s) => { m.punch = clamp(m.punch + 26 * s); m.aggression = clamp(m.aggression + 10 * s); } },
  { keys: /phone|lo-?fi|telephone|narrow|vintage/i, label: "phone", apply: (m, s) => { m.telephone = true; m.brightness = clamp(m.brightness - 12 * s); } },
  { keys: /radio|broadcast|commercial|mainstream/i, label: "radio", apply: (m, s) => { m.radio = true; m.upfront = clamp(m.upfront + 12 * s); } },
  { keys: /delay|echo|slap|repeat/i, label: "delay", apply: (m, s) => { m.spaciousness = clamp(m.spaciousness + 12 * s); } },
  { keys: /smooth|silky|soft|warm vocal/i, label: "smooth", apply: (m, s) => { m.warmth = clamp(m.warmth + 12 * s); m.aggression = clamp(m.aggression - 10 * s); } },
  { keys: /distort|grit|saturat|dirty|fuzzy/i, label: "grit", apply: (m, s) => { m.aggression = clamp(m.aggression + 28 * s); } },
  { keys: /strong|heavy|extreme|max/i, label: "strong", apply: (m, s) => { m.autotune = clamp(m.autotune + 10 * s); m.punch = clamp(m.punch + 8 * s); } },
  { keys: /clean|tight|controlled/i, label: "clean", apply: (m, s) => { m.aggression = clamp(m.aggression - 12 * s); m.dryness = clamp(m.dryness + 8 * s); } },
];

function clamp(v: number, lo = 0, hi = 100) {
  return Math.min(hi, Math.max(lo, v));
}

function intensityOf(sentence: string): number {
  if (/(very|really|super|heavy|strong|extreme|much|a lot)/i.test(sentence)) return 1;
  if (/(slight|a bit|a little|subtle|touch)/i.test(sentence)) return 0.45;
  return 0.75;
}

export function interpretPrompt(prompt: string): MixInstruction {
  const text = (prompt || "").trim();
  const interpreted: MixInstruction["interpreted"] = {
    autotune: 55, brightness: 55, warmth: 45, upfront: 60,
    width: 50, spaciousness: 50, dryness: 20, punch: 50,
    aggression: 20, telephone: false, radio: false, dreamy: false,
  };
  const keywords: string[] = [];
  if (!text) {
    return {
      rawPrompt: "", interpreted,
      keywords: [],
      summary: "No description given — balanced modern vocal: gentle tune, clean presence, medium space.",
    };
  }
  const sentences = text.split(/[.\n;]+/).map((s) => s.trim()).filter(Boolean);
  for (const s of sentences) {
    const strength = intensityOf(s);
    for (const f of FAMILIES) {
      if (f.keys.test(s)) {
        f.apply(interpreted, strength);
        keywords.push(f.label);
      }
    }
  }
  // cross-rules
  if (interpreted.dryness > 55) interpreted.spaciousness = clamp(interpreted.spaciousness - 15);
  if (interpreted.telephone) { interpreted.width = clamp(interpreted.width - 20); }
  const parts: string[] = [];
  parts.push(interpreted.autotune >= 72 ? "strong pitch correction" : interpreted.autotune <= 35 ? "light transparent tuning" : "moderate pitch correction");
  parts.push(interpreted.brightness >= 65 ? "bright airy top" : interpreted.brightness <= 42 ? "dark warm tone" : "balanced tone");
  parts.push(interpreted.upfront >= 65 ? "upfront lead level" : "natural depth");
  parts.push(interpreted.dryness >= 55 ? "dry intimate space" : interpreted.spaciousness >= 65 ? "spacious atmospheric space" : "medium room space");
  if (interpreted.width >= 62) parts.push("wide chorus imaging");
  if (interpreted.punch >= 62) parts.push("punchy compression");
  if (interpreted.telephone) parts.push("telephone-style band character");
  if (interpreted.radio) parts.push("radio-ready polish");
  return {
    rawPrompt: text,
    interpreted,
    keywords: [...new Set(keywords)],
    summary: `Understood as ${parts.join(", ")}.`,
  };
}
