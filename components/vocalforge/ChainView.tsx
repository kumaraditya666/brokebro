"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AudioLines, ChevronDown, Info, RotateCcw, Sparkles, SlidersHorizontal, Gauge } from "lucide-react";
import type { MixChain } from "@/types/vocalforge";
import { useVF } from "@/store/useVocalForge";
import { Slider, GlassCard } from "./ui";

const MODULES: { id: keyof MixChain | "final"; label: string; desc: string }[] = [
  { id: "pitchCorrection", label: "Pitch Correction", desc: "Key, scale, strength, retune" },
  { id: "eq", label: "EQ", desc: "Low-cut, presence, air" },
  { id: "compression", label: "Compression", desc: "Threshold, ratio, punch" },
  { id: "deEsser", label: "De-essing", desc: "Tame harsh S sounds" },
  { id: "saturation", label: "Saturation", desc: "Warmth, grit, color" },
  { id: "delay", label: "Delay", desc: "Echo timing + feedback" },
  { id: "reverb", label: "Reverb", desc: "Space, decay, pre-delay" },
  { id: "stereo", label: "Stereo / Widening", desc: "Width, chorus lift" },
  { id: "final", label: "Final Vocal", desc: "AI mix output" },
];

const SCALES = ["Minor", "Major", "Dorian", "Phrygian", "Chromatic", "Pentatonic Minor", "Pentatonic Major"] as const;
const KEYS = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"];

export function ChainView() {
  const vf = useVF();
  const mix = vf.project.mix;
  if (!mix) return <EmptyChain />;
  const chain = mix.chain;
  const sel = vf.selectedModule ?? "pitchCorrection";
  const simple = vf.project.simpleMode;

  return (
    <div className="space-y-4">
      {/* mode + summary */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/40 p-1 text-xs">
          {(["simple", "pro"] as const).map((m) => {
            const active = simple === (m === "simple");
            return (
              <button key={m} onClick={() => vf.setSimpleMode(m === "simple")}
                className={`pressable flex items-center gap-1.5 rounded-full px-4 py-1.5 font-semibold transition ${active ? "bg-gradient-to-r from-cyan-400 to-violet-500 text-black" : "text-slate-400 hover:text-white"}`}>
                {m === "simple" ? <Sparkles className="h-3.5 w-3.5" /> : <SlidersHorizontal className="h-3.5 w-3.5" />}
                {m === "simple" ? "Simple" : "Pro"}
              </button>
            );
          })}
        </div>
        <p className="max-w-md text-[11px] leading-relaxed text-slate-500">
          <span className="text-slate-300">{mix.instruction.summary}</span> Confidence {(mix.confidence * 100).toFixed(0)}% · {mix.engineNote.split(".")[0]}.
        </p>
      </div>

      {simple ? <SimpleControls /> : (
        <div className="grid gap-4 xl:grid-cols-[280px_1fr]">
          {/* vertical chain */}
          <div className="relative rounded-2xl border border-white/10 bg-black/30 p-3">
            <p className="mb-2 flex items-center gap-1.5 px-1 text-[11px] font-semibold uppercase tracking-widest text-slate-500"><AudioLines className="h-3.5 w-3.5 text-cyan-300" /> Vocal chain</p>
            <div className="absolute bottom-6 left-[27px] top-12 w-px bg-gradient-to-b from-cyan-400/50 via-violet-500/40 to-transparent" />
            {MODULES.map((m) => {
              const active = sel === m.id;
              return (
                <button key={m.id} onClick={() => vf.setSelectedModule(m.id)}
                  className={`relative mb-1 flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition ${active ? "border-cyan-300/40 bg-cyan-300/[0.08] shadow-[0_0_20px_rgba(34,211,238,0.15)]" : "border-transparent hover:border-white/10 hover:bg-white/[0.04]"}`}>
                  <span className={`relative z-10 grid h-6 w-6 shrink-0 place-items-center rounded-full text-[10px] font-bold ${active ? "bg-gradient-to-br from-cyan-400 to-violet-500 text-black" : "bg-white/10 text-slate-400"}`}>
                    {m.id === "final" ? "✓" : MODULES.indexOf(m) + 1}
                  </span>
                  <span><span className={`block text-[13px] font-semibold ${active ? "text-white" : "text-slate-300"}`}>{m.id === "pitchCorrection" ? "Pitch Correction" : m.label}</span>
                    <span className="block text-[10px] text-slate-500">{m.desc}</span></span>
                </button>
              );
            })}
          </div>
          {/* editor */}
          <AnimatePresence mode="wait">
            <motion.div key={sel} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.25 }}>
              <ModuleEditor />
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {/* AI Pitch section (always visible) */}
      <PitchSection chain={chain} />
    </div>
  );
}

function EmptyChain() {
  return (
    <GlassCard className="p-10 text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-cyan-400/20 to-violet-500/20 text-cyan-300"><Gauge className="h-7 w-7" /></div>
      <p className="mt-4 font-semibold text-white">No mix yet — your chain will appear here</p>
      <p className="mx-auto mt-1.5 max-w-sm text-sm text-slate-500">Upload a beat + vocal, describe your sound, then hit <span className="text-white">✨ Create My Vocal</span>.</p>
    </GlassCard>
  );
}

function SimpleControls() {
  const vf = useVF();
  const chain = vf.project.mix?.chain;
  if (!chain) return null;
  const set = vf.updateChainSection;
  const rows: { label: string; hint: string; value: number; on: (v: number) => void }[] = [
    { label: "Autotune", hint: "How hard the pitch snaps", value: chain.pitchCorrection.strength, on: (v) => set("pitchCorrection", { strength: v, retuneSpeedMs: v >= 78 ? 8 : v >= 60 ? 18 : v >= 40 ? 35 : 60, retuneLabel: v >= 78 ? "Hard" : v >= 60 ? "Fast" : v >= 40 ? "Medium" : "Slow" }) },
    { label: "Vocal Style", hint: "Dark ↔ Bright tone", value: chain.eq.airDb * 8 + 50, on: (v) => set("eq", { airDb: Number(((v - 50) / 8).toFixed(1)), presenceDb: Number((((v - 50) / 25) + 1.5).toFixed(1)), toneProfile: v >= 68 ? "Bright" : v <= 40 ? "Dark" : "Neutral" }) },
    { label: "Reverb", hint: "Room size + dreaminess", value: chain.reverb.mix * 2, on: (v) => set("reverb", { mix: Math.round(v / 2) }) },
    { label: "Delay", hint: "Echo presence", value: chain.delay.mix * 2, on: (v) => set("delay", { mix: Math.round(v / 2) }) },
    { label: "Vocal Presence", hint: "How far forward it sits", value: Math.min(100, chain.eq.presenceDb * 20 + 40), on: (v) => set("eq", { presenceDb: Number(((v - 40) / 20).toFixed(1)) }) },
    { label: "Reference Influence", hint: "Your words ↔ reference record", value: vf.project.referenceInfluence, on: (v) => vf.setInfluence(v) },
  ];
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {rows.map((r) => (
        <div key={r.label} className="rounded-2xl border border-white/10 bg-black/30 p-4">
          <div className="mb-1 flex items-baseline justify-between">
            <p className="text-sm font-semibold text-white">{r.label}</p>
            <p className="font-mono text-xs text-cyan-300">{Math.round(r.value)}%</p>
          </div>
          <p className="mb-2 text-[11px] text-slate-500">{r.hint}</p>
          <Slider value={Math.round(r.value)} onChange={r.on} label={r.label} />
        </div>
      ))}
    </div>
  );
}

function ModuleEditor() {
  const vf = useVF();
  const chain = vf.project.mix?.chain;
  const sel = vf.selectedModule;
  if (!chain || !sel) return null;
  if (sel === "final") {
    return (
      <GlassCard className="p-5">
        <EditorTitle t="Final Vocal" d="Master balance of your AI mix" />
        <Num label="Vocal level" value={chain.master.vocalLevelDb} min={-6} max={6} step={0.5} unit="dB" on={(v) => vf.patchChain({ master: { ...chain.master, vocalLevelDb: v } })} />
        <Num label="Beat level" value={chain.master.beatLevelDb} min={-6} max={3} step={0.5} unit="dB" on={(v) => vf.patchChain({ master: { ...chain.master, beatLevelDb: v } })} />
        <Num label="Limiter ceiling" value={chain.master.limiterCeilingDb} min={-3} max={0} step={0.1} unit="dB" on={(v) => vf.patchChain({ master: { ...chain.master, limiterCeilingDb: v } })} />
      </GlassCard>
    );
  }
  const set = (patch: Record<string, unknown>) => vf.updateChainSection(sel as keyof MixChain, patch);

  if (sel === "pitchCorrection") {
    const p = chain.pitchCorrection;
    return (
      <GlassCard className="p-5">
        <EditorTitle t="Pitch Correction" d="Tuning built on your beat's key estimate" />
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="text-xs text-slate-400">Key
            <select value={p.key.split(" ")[0]} onChange={(e) => set({ key: `${e.target.value} ${p.scale.includes("Major") ? "Major" : "Minor"}` })} className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-2 py-2 text-sm text-white">
              {KEYS.map((k) => <option key={k}>{k}</option>)}
            </select>
          </label>
          <label className="text-xs text-slate-400">Scale
            <select value={p.scale} onChange={(e) => set({ scale: e.target.value })} className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-2 py-2 text-sm text-white">
              {SCALES.map((k) => <option key={k}>{k}</option>)}
            </select>
          </label>
        </div>
        <Num label="Correction strength" value={p.strength} min={0} max={100} unit="%" on={(v) => set({ strength: v })} />
        <Num label="Retune speed" value={p.retuneSpeedMs} min={0} max={80} unit="ms" on={(v) => set({ retuneSpeedMs: v, retuneLabel: v <= 10 ? "Hard" : v <= 25 ? "Fast" : v <= 45 ? "Medium" : "Slow" })} />
        <p className="text-xs text-slate-500">Character: <span className="font-semibold text-cyan-300">{p.retuneLabel}</span></p>
      </GlassCard>
    );
  }
  if (sel === "eq") {
    const e = chain.eq;
    return (
      <GlassCard className="p-5">
        <EditorTitle t="EQ" d={`Tone profile: ${e.toneProfile}`} />
        <Num label="Low cut" value={e.lowCutHz} min={20} max={500} unit="Hz" on={(v) => set({ lowCutHz: v })} />
        <Num label="Low-mid" value={e.lowMidDb} min={-6} max={6} step={0.1} unit="dB" on={(v) => set({ lowMidDb: v })} />
        <Num label="Presence" value={e.presenceDb} min={-6} max={6} step={0.1} unit="dB" on={(v) => set({ presenceDb: v })} />
        <Num label="Air" value={e.airDb} min={-6} max={6} step={0.1} unit="dB" on={(v) => set({ airDb: v })} />
      </GlassCard>
    );
  }
  if (sel === "compression") {
    const c = chain.compression;
    return (
      <GlassCard className="p-5">
        <EditorTitle t="Compression" d="Glue + punch control" />
        <Num label="Threshold" value={c.thresholdDb} min={-30} max={0} unit="dB" on={(v) => set({ thresholdDb: v })} />
        <Num label="Ratio" value={c.ratio} min={1} max={10} step={0.5} unit=":1" on={(v) => set({ ratio: v })} />
        <Num label="Attack" value={c.attackMs} min={1} max={100} unit="ms" on={(v) => set({ attackMs: v })} />
        <Num label="Release" value={c.releaseMs} min={20} max={500} unit="ms" on={(v) => set({ releaseMs: v })} />
      </GlassCard>
    );
  }
  if (sel === "deEsser") {
    const d = chain.deEsser;
    return (
      <GlassCard className="p-5">
        <EditorTitle t="De-essing" d="Softens harsh S / SH sounds" />
        <Num label="Frequency" value={d.frequencyHz} min={4000} max={10000} step={100} unit="Hz" on={(v) => set({ frequencyHz: v })} />
        <Num label="Amount" value={d.amount} min={0} max={100} unit="%" on={(v) => set({ amount: v })} />
      </GlassCard>
    );
  }
  if (sel === "saturation") {
    const s = chain.saturation;
    return (
      <GlassCard className="p-5">
        <EditorTitle t="Saturation" d="Tape warmth → tube grit" />
        <Num label="Amount" value={s.amount} min={0} max={100} unit="%" on={(v) => set({ amount: v })} />
        <label className="mt-2 block text-xs text-slate-400">Character
          <select value={s.type} onChange={(e) => set({ type: e.target.value })} className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-2 py-2 text-sm text-white">
            {["Tape", "Tube", "Console", "Bitcrush-lite"].map((k) => <option key={k}>{k}</option>)}
          </select>
        </label>
      </GlassCard>
    );
  }
  if (sel === "delay") {
    const d = chain.delay;
    return (
      <GlassCard className="p-5">
        <EditorTitle t="Delay" d={`${d.timeNote} · ${d.timeMs} ms`} />
        <Num label="Feedback" value={d.feedback} min={0} max={70} unit="%" on={(v) => set({ feedback: v })} />
        <Num label="Mix" value={d.mix} min={0} max={60} unit="%" on={(v) => set({ mix: v })} />
      </GlassCard>
    );
  }
  if (sel === "reverb") {
    const r = chain.reverb;
    return (
      <GlassCard className="p-5">
        <EditorTitle t="Reverb" d={r.type} />
        <label className="mb-2 block text-xs text-slate-400">Type
          <select value={r.type} onChange={(e) => set({ type: e.target.value })} className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-2 py-2 text-sm text-white">
            {["Hall", "Plate", "Room", "Chamber", "Atmospheric"].map((k) => <option key={k}>{k}</option>)}
          </select>
        </label>
        <Num label="Decay" value={r.decaySec} min={0.3} max={6} step={0.1} unit="s" on={(v) => set({ decaySec: v })} />
        <Num label="Pre-delay" value={r.preDelayMs} min={0} max={120} unit="ms" on={(v) => set({ preDelayMs: v })} />
        <Num label="Mix" value={r.mix} min={0} max={60} unit="%" on={(v) => set({ mix: v })} />
      </GlassCard>
    );
  }
  if (sel === "stereo") {
    const s = chain.stereo;
    return (
      <GlassCard className="p-5">
        <EditorTitle t="Stereo / Widening" d="Mono-safe width" />
        <Num label="Width" value={s.width} min={0} max={100} unit="%" on={(v) => set({ width: v })} />
        <Num label="Verse width" value={s.verseWidth} min={0} max={100} unit="%" on={(v) => set({ verseWidth: v })} />
        <Num label="Chorus width" value={s.chorusWidth} min={0} max={100} unit="%" on={(v) => set({ chorusWidth: v })} />
      </GlassCard>
    );
  }
  return null;
}

function EditorTitle({ t, d }: { t: string; d: string }) {
  return (
    <div className="mb-3">
      <p className="font-semibold text-white">{t}</p>
      <p className="text-xs text-slate-500">{d}</p>
    </div>
  );
}

function Num({ label, value, min, max, step = 1, unit, on }: { label: string; value: number; min: number; max: number; step?: number; unit: string; on: (v: number) => void }) {
  return (
    <div className="mb-3">
      <div className="mb-1 flex justify-between text-xs">
        <span className="text-slate-400">{label}</span>
        <span className="font-mono text-cyan-300">{value}{unit}</span>
      </div>
      <Slider value={value} min={min} max={max} step={step} onChange={on} label={label} />
    </div>
  );
}

export function PitchSection({ chain }: { chain: MixChain }) {
  const vf = useVF();
  const beat = vf.project.beatAnalysis;
  const p = chain.pitchCorrection;
  const [open, setOpen] = useState(false);
  return (
    <div className="overflow-hidden rounded-2xl border border-violet-400/20 bg-gradient-to-br from-violet-500/[0.08] to-cyan-400/[0.06]">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between px-5 py-4 text-left">
        <span className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-violet-500/20 text-violet-200">♪</span>
          <span>
            <span className="block text-sm font-bold text-white">AI Pitch</span>
            <span className="block text-[11px] text-slate-400">Key {p.key} · {beat ? `${beat.bpm} BPM` : "BPM —"} · {p.strength}% {p.retuneLabel}</span>
          </span>
        </span>
        <ChevronDown className={`h-4 w-4 text-slate-400 transition ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="grid gap-2 px-5 pb-5 sm:grid-cols-4">
              {[
                ["Key", p.key],
                ["BPM", beat ? String(beat.bpm) : "—"],
                ["Correction", `${p.strength}%`],
                ["Retune", p.retuneLabel],
              ].map(([k, v]) => (
                <div key={k} className="rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-center">
                  <p className="text-[10px] uppercase tracking-widest text-slate-500">{k}</p>
                  <p className="font-display font-bold text-white">{v}</p>
                </div>
              ))}
            </div>
            <p className="mx-5 mb-4 flex items-start gap-1.5 rounded-xl bg-white/[0.04] p-3 text-[11px] leading-relaxed text-slate-400">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-300" />
              Automatic key detection is an estimate from your beat{vf.project.vocalAnalysis ? " + vocal" : ""} — change key, scale, strength or retune speed anytime. Edits update the preview instantly.
            </p>
            <div className="mx-5 mb-5 flex gap-2">
              <button onClick={() => { vf.setSelectedModule("pitchCorrection"); vf.setSimpleMode(false); }} className="pressable rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-white hover:bg-white/10">Open pitch editor</button>
              <button onClick={() => vf.updateChainSection("pitchCorrection", { key: vf.project.beatAnalysis?.musicalKey ?? p.key })} className="pressable flex items-center gap-1.5 rounded-xl border border-white/10 px-4 py-2 text-xs text-slate-400 hover:text-white"><RotateCcw className="h-3.5 w-3.5" /> Reset to detected</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
