"use client";
import { motion } from "framer-motion";
import { GitCompareArrows } from "lucide-react";
import { useVF } from "@/store/useVocalForge";
import { Slider, GlassCard } from "./ui";

export function ReferenceMatch() {
  const vf = useVF();
  const mix = vf.project.mix;
  const ref = vf.project.referenceAnalysis;
  if (!mix) {
    return (
      <GlassCard className="p-6 text-center">
        <p className="font-semibold text-white">Reference Match</p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">Create your vocal to see the production-trait comparison. No reference? Your words alone still build a full mix.</p>
      </GlassCard>
    );
  }
  return (
    <GlassCard className="p-5">
      <div className="mb-1 flex items-center gap-2">
        <GitCompareArrows className="h-4 w-4 text-cyan-300" />
        <p className="font-semibold text-white">Reference Match</p>
        <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-slate-400">{ref ? "reference linked" : "prompt-only baseline"}</span>
      </div>
      <p className="mb-4 font-display text-center text-xs tracking-[0.2em] text-slate-500">REFERENCE <span className="text-slate-600">vs</span> YOUR VOCAL</p>
      <div className="space-y-3">
        {mix.matchRows.map((r, i) => (
          <div key={r.key}>
            <div className="mb-1 flex justify-between text-xs">
              <span className="text-slate-300">{r.label}</span>
              <span className="font-mono text-slate-500">{r.reference} <span className="text-slate-700">/</span> <span className="text-cyan-300">{r.yours}</span></span>
            </div>
            <div className="relative h-2.5 overflow-hidden rounded-full bg-white/[0.07]">
              <motion.div initial={{ width: 0 }} animate={{ width: `${r.reference}%` }} transition={{ delay: i * 0.05, duration: 0.7 }} className="absolute inset-y-0 left-0 rounded-full bg-white/25" />
              <motion.div initial={{ width: 0 }} animate={{ width: `${r.yours}%` }} transition={{ delay: i * 0.05 + 0.1, duration: 0.7 }} className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-cyan-400 to-violet-500 opacity-90" />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-5 rounded-2xl border border-white/10 bg-black/30 p-4">
        <div className="mb-1 flex justify-between text-xs">
          <span className="font-semibold text-white">Reference Influence</span>
          <span className="font-mono text-cyan-300">{vf.project.referenceInfluence}%</span>
        </div>
        <Slider value={vf.project.referenceInfluence} onChange={(v) => vf.setInfluence(v)} label="Reference influence" />
        <div className="mt-1 flex justify-between text-[10px] text-slate-500">
          <span>0% — your words dominate</span>
          <span>100% — reference shapes the mix</span>
        </div>
        {!ref && <p className="mt-2 text-[11px] text-amber-300/90">No reference uploaded — slider previews intent; upload one to bend the mix for real.</p>}
        <button
          onClick={async () => {
            if (!vf.project.beatAnalysis || !vf.project.vocalAnalysis) return;
            const { api } = await import("@/lib/vocalforge/apiClient");
            try {
              const { mix: m } = await api.generateMix({
                beat: vf.project.beatAnalysis, vocal: vf.project.vocalAnalysis,
                reference: vf.project.referenceAnalysis ?? null,
                prompt: vf.project.prompt, referenceInfluence: vf.project.referenceInfluence,
              });
              vf.setMix(m);
              vf.setNotice("Mix rebalanced with new reference influence.");
            } catch (e) { vf.setError(e instanceof Error ? e.message : "Rebalance failed."); }
          }}
          className="pressable mt-3 w-full rounded-xl bg-white/10 py-2 text-xs font-semibold text-white hover:bg-white/15"
        >
          Rebalance mix at {vf.project.referenceInfluence}%
        </button>
      </div>
      <p className="mt-3 text-[11px] leading-relaxed text-slate-500">Production characteristics only — level, tone, glue, space, width. Never vocal identity.</p>
    </GlassCard>
  );
}
