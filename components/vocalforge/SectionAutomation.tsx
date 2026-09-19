"use client";
import { motion } from "framer-motion";
import { Layers } from "lucide-react";
import { useVF } from "@/store/useVocalForge";
import { GlassCard } from "./ui";

const COLORS: Record<string, string> = {
  "Intro": "from-slate-400/30 to-slate-500/20",
  "Verse": "from-cyan-400/30 to-cyan-500/15",
  "Pre-Chorus": "from-sky-400/30 to-violet-500/20",
  "Chorus": "from-violet-500/40 to-fuchsia-500/25",
  "Bridge": "from-amber-400/30 to-orange-500/20",
  "Outro": "from-slate-400/25 to-transparent",
};

export function SectionAutomation() {
  const vf = useVF();
  const mix = vf.project.mix;
  const vocal = vf.project.vocalAnalysis;
  if (!mix || !vocal) {
    return (
      <GlassCard className="p-6 text-center">
        <p className="font-semibold text-white">Section-based processing</p>
        <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">Intro · Verse · Pre-Chorus · Chorus · Bridge · Outro get their own width, space and tune targets. Detection runs on the backend during analysis (mocked in this prototype).</p>
      </GlassCard>
    );
  }
  const total = Math.max(1, vocal.durationSec);
  return (
    <GlassCard className="p-5">
      <div className="mb-1 flex items-center gap-2">
        <Layers className="h-4 w-4 text-violet-300" />
        <p className="font-semibold text-white">Section automation</p>
        <span className="rounded-full bg-violet-400/10 px-2 py-0.5 text-[10px] text-violet-300">verse tight · chorus wide</span>
      </div>
      {/* timeline */}
      <div className="mt-3 flex h-12 overflow-hidden rounded-xl border border-white/10">
        {vocal.sections.map((s) => (
          <div key={s.name} style={{ width: `${Math.max(4, ((s.endSec - s.startSec) / total) * 100)}%` }}
            className={`relative bg-gradient-to-b ${COLORS[s.name] ?? "from-white/10 to-transparent"} border-r border-black/40 px-1.5 py-1`}>
            <p className="truncate text-[9px] font-bold uppercase tracking-wide text-white/90">{s.name}</p>
            <p className="font-mono text-[8px] text-white/50">{Math.round(s.startSec)}s</p>
          </div>
        ))}
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {mix.chain.sectionAutomation.map((a, i) => (
          <motion.div key={a.section} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="rounded-xl border border-white/10 bg-black/30 p-3">
            <p className="text-xs font-bold text-white">{a.section}</p>
            <div className="mt-1.5 space-y-1 font-mono text-[10px] text-slate-400">
              <p>width <span className="text-cyan-300">{a.width}%</span> · verb <span className="text-cyan-300">{a.reverbMix}%</span></p>
              <p>delay <span className="text-cyan-300">{a.delayMix}%</span> · tune <span className="text-cyan-300">{a.autotune}%</span></p>
            </div>
            <p className="mt-1.5 text-[10px] italic text-slate-500">{a.note}</p>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-500" style={{ width: `${a.width}%` }} />
            </div>
          </motion.div>
        ))}
      </div>
    </GlassCard>
  );
}
