"use client";
import { useEffect } from "react";
import Link from "next/link";
import { AudioWaveform, ArrowLeft, X, Info, Play, Pause, FlaskConical } from "lucide-react";
import { useVF, type StudioTab } from "@/store/useVocalForge";
import { UploadCard } from "./UploadCard";
import { PromptBox } from "./PromptBox";
import { ChainView } from "./ChainView";
import { ReferenceMatch } from "./ReferenceMatch";
import { MixPreview } from "./MixPreview";
import { SectionAutomation } from "./SectionAutomation";
import { ExportPanel } from "./ExportPanel";
import { ProjectsPanel } from "./ProjectsPanel";
import { Slider } from "./ui";

const TABS: { id: StudioTab; label: string }[] = [
  { id: "mix", label: "AI Mix Chain" },
  { id: "sections", label: "Sections" },
  { id: "export", label: "Export + FL Studio" },
  { id: "projects", label: "Projects" },
];

export default function StudioPage() {
  const vf = useVF();

  useEffect(() => { vf.init(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen bg-[#05070d] pb-28 font-display text-slate-200">
      {/* top bar */}
      <header className="sticky top-0 z-40 border-b border-white/5 bg-[#05070d]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center gap-3 px-4 py-3">
          <Link href="/" className="pressable flex items-center gap-1.5 rounded-xl border border-white/10 px-3 py-1.5 text-xs text-slate-300 hover:text-white">
            <ArrowLeft className="h-3.5 w-3.5" /> Home
          </Link>
          <span className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-cyan-400 to-violet-600"><AudioWaveform className="h-4 w-4 text-white" /></span>
            <input
              value={vf.project.name}
              onChange={(e) => vf.renameProject(e.target.value)}
              className="w-44 bg-transparent text-sm font-bold text-white focus:outline-none sm:w-56"
              aria-label="Project name"
            />
          </span>
          <span className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] ${vf.engineOnline === false ? "border-red-400/30 bg-red-400/10 text-red-300" : "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${vf.engineOnline === false ? "bg-red-400" : "bg-emerald-400 animate-pulse"}`} />
            {vf.engineOnline === false ? "backend unreachable" : "mock backend · mock-backend-v1"}
          </span>
          <div className="ml-auto flex rounded-full border border-white/10 bg-black/40 p-1 text-xs">
            {TABS.map((t) => (
              <button key={t.id} onClick={() => vf.setStudioTab(t.id)}
                className={`pressable rounded-full px-3.5 py-1.5 font-semibold transition sm:px-4 ${vf.studioTab === t.id ? "bg-white text-black" : "text-slate-400 hover:text-white"}`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
        {/* banners */}
        {vf.error && (
          <div className="mx-auto flex max-w-[1500px] items-start gap-2 px-4 pb-2">
            <p className="flex flex-1 items-start gap-2 rounded-xl border border-red-400/25 bg-red-500/10 px-3.5 py-2.5 text-xs text-red-200">
              <X className="mt-0.5 h-4 w-4 shrink-0" />{vf.error}
              <button onClick={() => vf.setError(null)} className="ml-auto font-bold">Dismiss</button>
            </p>
          </div>
        )}
        {vf.notice && (
          <div className="mx-auto flex max-w-[1500px] items-start gap-2 px-4 pb-2">
            <p className="flex flex-1 items-start gap-2 rounded-xl border border-cyan-300/20 bg-cyan-400/10 px-3.5 py-2.5 text-xs text-cyan-100">
              <Info className="mt-0.5 h-4 w-4 shrink-0" />{vf.notice}
              <button onClick={() => vf.setNotice(null)} className="ml-auto font-bold">Dismiss</button>
            </p>
          </div>
        )}
      </header>

      {/* main */}
      <main className="mx-auto grid max-w-[1500px] gap-4 px-4 pt-5 lg:grid-cols-[320px_minmax(0,1fr)_340px]">
        {/* LEFT: inputs */}
        <section className="space-y-4">
          <UploadCard slot="beat" />
          <UploadCard slot="vocal" />
          <UploadCard slot="reference" />
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="mb-1 flex justify-between text-xs"><span className="font-semibold text-white">Reference Influence</span><span className="font-mono text-cyan-300">{vf.project.referenceInfluence}%</span></div>
            <Slider value={vf.project.referenceInfluence} onChange={vf.setInfluence} label="Reference influence" />
            <p className="mt-1 text-[10px] text-slate-500">0% your words · 100% reference production</p>
          </div>
        </section>

        {/* CENTER: prompt + preview + workspace tabs */}
        <section className="min-w-0 space-y-4">
          <PromptBox />
          <MixPreview />
          {vf.studioTab === "mix" && <ChainView />}
          {vf.studioTab === "sections" && <SectionAutomation />}
          {vf.studioTab === "export" && <ExportPanel />}
          {vf.studioTab === "projects" && <ProjectsPanel />}
        </section>

        {/* RIGHT: settings */}
        <aside className="space-y-4">
          <ReferenceMatch />
          <MixSummary />
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-[11px] leading-relaxed text-slate-500">
            <p className="mb-1 flex items-center gap-1.5 font-semibold text-slate-300"><FlaskConical className="h-3.5 w-3.5 text-amber-300" /> Prototype honesty</p>
            Simulated AI + preview DSP are labeled everywhere. Real autotune, separation, reference DSP and FL plugin reuse these same API routes — no UI rewrite needed.
          </div>
        </aside>
      </main>

      {/* BOTTOM transport */}
      <footer className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#070b14]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center gap-3 px-4 py-2.5">
          <button onClick={() => vf.setPlaying(!vf.isPlaying)} className="pressable grid h-9 w-9 place-items-center rounded-full bg-white text-black">
            {vf.isPlaying ? <Pause className="h-4 w-4" /> : <Play className="ml-0.5 h-4 w-4" />}
          </button>
          <span className="font-mono text-[11px] text-slate-400">
            {vf.project.beatAnalysis ? `${vf.project.beatAnalysis.bpm} BPM · ${vf.project.beatAnalysis.musicalKey}` : "no beat"}
            {"  ·  "}
            {vf.project.mix ? `tune ${vf.project.mix.chain.pitchCorrection.strength}% ${vf.project.mix.chain.pitchCorrection.retuneLabel}` : "no mix yet"}
          </span>
          <span className="ml-auto flex items-center gap-2 text-[11px] text-slate-400">
            Before
            <input type="range" min={0} max={100} value={vf.beforeAfter} onChange={(e) => {
              vf.setBeforeAfter(Number(e.target.value));
              vf.setPreviewTab(Number(e.target.value) >= 50 ? "aimix" : "original");
            }} className="vf-slider w-24 sm:w-32" aria-label="Before after transport" />
            After
          </span>
        </div>
      </footer>
    </div>
  );
}

function MixSummary() {
  const vf = useVF();
  const mix = vf.project.mix;
  if (!mix) return null;
  const c = mix.chain;
  const rows: [string, string][] = [
    ["Pitch", `${c.pitchCorrection.key} ${c.pitchCorrection.scale} · ${c.pitchCorrection.strength}%`],
    ["EQ", `${c.eq.toneProfile} · cut ${c.eq.lowCutHz}Hz · +${c.eq.presenceDb}dB`],
    ["Comp", `${c.compression.thresholdDb}dB · ${c.compression.ratio}:1`],
    ["Space", `${c.reverb.type} ${c.reverb.decaySec}s · DDL ${c.delay.timeNote}`],
    ["Width", `${c.stereo.width}% (verse ${c.stereo.verseWidth} / chorus ${c.stereo.chorusWidth})`],
  ];
  return (
    <div className="rounded-2xl border border-cyan-300/15 bg-gradient-to-b from-cyan-400/[0.07] to-transparent p-4">
      <p className="mb-2 text-xs font-bold uppercase tracking-widest text-cyan-200">Your AI mix</p>
      {rows.map(([k, v]) => (
        <p key={k} className="mb-1 text-[11px]"><span className="text-slate-500">{k}: </span><span className="font-medium text-slate-200">{v}</span></p>
      ))}
      <button onClick={() => vf.setStudioTab("export")} className="pressable mt-2 w-full rounded-xl bg-white py-2 text-xs font-bold text-black">Continue to export →</button>
    </div>
  );
}
