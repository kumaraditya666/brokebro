"use client";
import { useState } from "react";
import { Sparkles, Loader2, Wand2, ChevronDown } from "lucide-react";
import { PIPELINE_STAGES, type PipelineStageId } from "@/types/vocalforge";
import { api } from "@/lib/vocalforge/apiClient";
import { useVF } from "@/store/useVocalForge";

const EXAMPLES = [
  "Make my vocal dark and emotional, strong autotune, clean and upfront in the verse, wider in the chorus, with atmospheric reverb and a short delay.",
  "Bright radio vocal, natural autotune, punchy and upfront with tight dry verse.",
  "Dreamy wide chorus, phone-style verse, heavy saturation on ad-libs.",
  "Clean intimate dry vocal, soft tune, subtle plate and slap delay.",
];

export function PromptBox({ onDone }: { onDone?: () => void }) {
  const vf = useVF();
  const [showEx, setShowEx] = useState(false);
  const canRun = !!vf.project.beatAnalysis && !!vf.project.vocalAnalysis && !vf.pipelineActive;
  const missing = !vf.project.beatAnalysis ? "Upload a beat to begin." : !vf.project.vocalAnalysis ? "Upload your vocal to begin." : null;

  const run = async () => {
    if (!canRun) {
      vf.setError(missing ?? "Add your beat and vocal first.");
      return;
    }
    vf.setError(null);
    vf.setStudioTab("mix");
    const stages = PIPELINE_STAGES;
    vf.setPipeline(true, "uploading", 2);
    // Staged animation: advance through backend-timed steps (not instant).
    const stageTiming = [500, 700, 650, 750, 800, 650, 800, 900, 900, 1000, 1100, 400];
    for (let i = 0; i < stages.length; i++) {
      const st = stages[i];
      vf.setPipeline(true, st.id as PipelineStageId, Math.round(((i + 1) / stages.length) * 96));
      await new Promise((r) => setTimeout(r, stageTiming[i] ?? 700));
      // Fire the real backend call while "understanding instructions" shows.
      if (st.id === "understanding-instructions") {
        try {
          const { mix } = await api.generateMix({
            beat: vf.project.beatAnalysis!,
            vocal: vf.project.vocalAnalysis!,
            reference: vf.project.referenceAnalysis ?? null,
            prompt: vf.project.prompt,
            referenceInfluence: vf.project.referenceInfluence,
          });
          vf.setMix(mix);
          vf.setEngineOnline(true);
        } catch (e) {
          vf.setEngineOnline(false);
          vf.setError(e instanceof Error ? e.message : "The AI mix failed. Your files are safe — try again.");
          vf.setPipeline(false, null, 0);
          return;
        }
      }
    }
    vf.setPipeline(true, "complete", 100);
    vf.setNotice("Your AI vocal chain is ready — audition it below, then tweak anything.");
    setTimeout(() => vf.setPipeline(false, null, 100), 900);
    onDone?.();
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <label htmlFor="vf-prompt" className="flex items-center gap-2 text-sm font-semibold text-white">
          <Wand2 className="h-4 w-4 text-cyan-300" /> What do you want your vocal to sound like?
        </label>
        <button onClick={() => setShowEx(!showEx)} className="flex items-center gap-1 text-xs text-slate-400 hover:text-white">
          Examples <ChevronDown className={`h-3.5 w-3.5 transition ${showEx ? "rotate-180" : ""}`} />
        </button>
      </div>
      {showEx && (
        <div className="mt-2 grid gap-1.5">
          {EXAMPLES.map((e) => (
            <button key={e} onClick={() => vf.setPrompt(e)} className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-left text-xs leading-relaxed text-slate-300 transition hover:border-cyan-300/30 hover:text-white">
              “{e}”
            </button>
          ))}
        </div>
      )}
      <textarea
        id="vf-prompt"
        value={vf.project.prompt}
        onChange={(e) => vf.setPrompt(e.target.value)}
        rows={4}
        placeholder="Make my vocal dark and emotional, strong autotune, clean and upfront in the verse, wider in the chorus, with atmospheric reverb and a short delay."
        className="mt-3 w-full resize-none rounded-xl border border-white/10 bg-black/40 p-3.5 text-sm leading-relaxed text-white placeholder:text-slate-600 focus:border-cyan-300/50 focus:outline-none"
      />
      <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
        <span>{vf.project.prompt.length}/600 · plain words → mix parameters</span>
        {vf.project.referenceAnalysis && <span className="text-cyan-300">Reference linked · {vf.project.referenceInfluence}% influence</span>}
      </div>
      <button
        onClick={run}
        disabled={!canRun}
        className={`pressable mt-3 flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-4 text-base font-bold transition ${canRun
          ? "bg-gradient-to-r from-cyan-400 via-sky-400 to-violet-500 text-[#04060c] shadow-[0_0_44px_rgba(34,211,238,0.4)] hover:shadow-[0_0_60px_rgba(167,139,250,0.5)]"
          : "cursor-not-allowed bg-white/10 text-slate-500"}`}
      >
        {vf.pipelineActive ? (<><Loader2 className="h-5 w-5 animate-spin" /> Forging your vocal…</>) : (<><Sparkles className="h-5 w-5" /> ✨ Create My Vocal</>)}
      </button>
      {missing && <p className="mt-2 text-center text-xs text-amber-300/90">{missing} Analysis runs on the backend.</p>}
      <PipelineProgress />
    </div>
  );
}

export function PipelineProgress() {
  const vf = useVF();
  if (!vf.pipelineActive || !vf.pipelineStage) return null;
  const idx = PIPELINE_STAGES.findIndex((s) => s.id === vf.pipelineStage);
  const cur = PIPELINE_STAGES[idx];
  return (
    <div className="mt-4 rounded-2xl border border-cyan-300/20 bg-gradient-to-b from-cyan-400/[0.07] to-violet-500/[0.07] p-4">
      <div className="mb-2 flex items-center justify-between text-xs">
        <span className="font-semibold text-white">{cur.label}…</span>
        <span className="font-mono text-cyan-300">{vf.pipelineProgress}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-black/50">
        <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-500 transition-all duration-500" style={{ width: `${vf.pipelineProgress}%` }} />
      </div>
      <p className="mt-1.5 text-[11px] text-slate-400">{cur.detail} · step {idx + 1} of {PIPELINE_STAGES.length}</p>
      <div className="mt-3 grid grid-cols-4 gap-1 sm:grid-cols-6">
        {PIPELINE_STAGES.map((s, i) => (
          <div key={s.id} className={`rounded-lg px-1.5 py-1.5 text-center text-[9px] leading-tight transition ${i < idx ? "bg-emerald-400/15 text-emerald-300" : i === idx ? "bg-cyan-400/20 text-cyan-200" : "bg-white/5 text-slate-600"}`}>
            {s.label}
          </div>
        ))}
      </div>
      <p className="mt-2 text-[10px] text-slate-600">Jobs run server-side (POST /api/mix/generate) · engine mock-backend-v1</p>
    </div>
  );
}
