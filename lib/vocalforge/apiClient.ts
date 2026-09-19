/**
 * FRONTEND client — thin fetch wrapper over the backend API.
 * No AI logic here. If the backend is unreachable, callers surface a
 * friendly error (never a stack trace) and keep local file playback working.
 */
import type { BeatAnalysis, FlStudioPackageManifest, MixChain, MixResult, ReferenceAnalysis, VocalAnalysis } from "@/types/vocalforge";

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((json as { error?: string }).error || `Request to ${path} failed.`);
  return json as T;
}

export const api = {
  health: async () => (await fetch("/api/health")).json(),
  analyzeBeat: (p: { name: string; size: number; durationSec: number }) =>
    post<{ analysis: BeatAnalysis }>("/api/analyze/beat", p),
  analyzeVocal: (p: { name: string; size: number; durationSec: number }) =>
    post<{ analysis: VocalAnalysis }>("/api/analyze/vocal", p),
  analyzeReference: (p: { name: string; size: number; durationSec: number }) =>
    post<{ analysis: ReferenceAnalysis }>("/api/analyze/reference", p),
  generateMix: (p: { beat: BeatAnalysis; vocal: VocalAnalysis; reference: ReferenceAnalysis | null; prompt: string; referenceInfluence: number }) =>
    post<{ mix: MixResult }>("/api/mix/generate", p),
  flStudioManifest: (p: { projectName: string; chain: MixChain }) =>
    post<{ manifest: FlStudioPackageManifest; readme: string }>("/api/export/fl-studio", p),
};
