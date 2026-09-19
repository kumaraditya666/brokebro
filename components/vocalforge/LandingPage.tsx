"use client";
import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  Mic2, AudioWaveform, Sparkles, ArrowRight, Play, Pause, Disc3,
  SlidersHorizontal, GitBranch, Download, Plug2, Check, ChevronDown,
  Wand2, FileMusic, Layers, Radio, ShieldCheck, Zap,
} from "lucide-react";
import Link from "next/link";
import { Waveform, MiniMeters } from "./ui";

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: (i: number = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.7, ease: [0.22, 1, 0.36, 1] as const } }),
};

function useMouseGlow() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const move = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${e.clientX - r.left}px`);
      el.style.setProperty("--my", `${e.clientY - r.top}px`);
    };
    el.addEventListener("mousemove", move);
    return () => el.removeEventListener("mousemove", move);
  }, []);
  return ref;
}

function Nav() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/5 bg-[#05070d]/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-cyan-400 via-sky-500 to-violet-600 shadow-[0_0_24px_rgba(34,211,238,0.45)]">
            <AudioWaveform className="h-5 w-5 text-white" />
          </span>
          <span className="font-display text-lg font-700 tracking-tight text-white" style={{ fontWeight: 700 }}>
            VocalForge <span className="bg-gradient-to-r from-cyan-300 to-violet-400 bg-clip-text text-transparent">AI</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-7 text-sm text-slate-300 md:flex">
          {["How it works", "AI Chain", "Reference", "FL Studio", "FAQ"].map((a) => (
            <a key={a} href={`#${a.toLowerCase().replace(/ /g, "-")}`} className="transition hover:text-white">{a}</a>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <span className="hidden items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[11px] text-emerald-300 lg:flex">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" /> Mock backend online
          </span>
          <Link href="/studio" className="pressable group flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-violet-500 px-4 py-2 text-sm font-semibold text-[#04060c] shadow-[0_0_28px_rgba(34,211,238,0.35)] hover:shadow-[0_0_36px_rgba(167,139,250,0.5)]">
            Start Mixing <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  const glowRef = useMouseGlow();
  const [playing, setPlaying] = useState(true);
  const [progress, setProgress] = useState(0.32);
  const peaks = useRef<number[]>(Array.from({ length: 96 }, (_, i) => 0.25 + 0.5 * Math.abs(Math.sin(i * 0.42)) * (0.6 + 0.4 * Math.sin(i * 1.7)))).current;

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setProgress((p) => (p + 0.004 > 1 ? 0 : p + 0.004)), 60);
    return () => clearInterval(id);
  }, [playing]);

  return (
    <section ref={glowRef} className="vf-hero-glow relative overflow-hidden pt-36 pb-20">
      <div className="pointer-events-none absolute inset-0">
        <div className="hero-drift absolute -top-32 left-1/4 h-96 w-96 rounded-full bg-cyan-500/15 blur-[120px]" />
        <div className="hero-drift2 absolute top-40 right-1/5 h-[28rem] w-[28rem] rounded-full bg-violet-600/15 blur-[130px]" />
        <div className="absolute inset-0 ed-grid-bg opacity-60" />
      </div>
      <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <motion.div variants={fadeUp} initial="hidden" animate="show" className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs text-slate-300">
            <Sparkles className="h-3.5 w-3.5 text-cyan-300" /> AI mixing for your voice — FL Studio ready
          </motion.div>
          <motion.h1 variants={fadeUp} initial="hidden" animate="show" custom={1}
            className="font-display text-5xl font-bold leading-[1.02] tracking-tight text-white sm:text-6xl lg:text-7xl">
            Your Voice.<br />
            Your Sound.<br />
            <span className="bg-gradient-to-r from-cyan-300 via-sky-400 to-violet-400 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(34,211,238,0.25)]">AI Mixed.</span>
          </motion.h1>
          <motion.p variants={fadeUp} initial="hidden" animate="show" custom={2} className="mt-6 max-w-xl text-lg leading-relaxed text-slate-400">
            Upload your vocal, beat and a reference track. Tell VocalForge how you want it to sound — AI builds the mix.
          </motion.p>
          <motion.div variants={fadeUp} initial="hidden" animate="show" custom={3} className="mt-8 flex flex-wrap gap-3">
            <Link href="/studio" className="pressable group flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 to-violet-500 px-7 py-3.5 font-semibold text-[#04060c] shadow-[0_0_40px_rgba(34,211,238,0.35)]">
              <Mic2 className="h-5 w-5" /> Start Mixing
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <a href="#how-it-works" className="pressable rounded-2xl border border-white/15 bg-white/5 px-7 py-3.5 font-semibold text-white backdrop-blur hover:bg-white/10">
              See How It Works
            </a>
          </motion.div>
          <motion.div variants={fadeUp} initial="hidden" animate="show" custom={4} className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-400">
            {[["No theory needed", <Check key="c" className="h-4 w-4 text-emerald-400" />], ["Reference-matched production", <Check key="c" className="h-4 w-4 text-emerald-400" />], ["FL Studio export package", <Check key="c" className="h-4 w-4 text-emerald-400" />]].map(([t, icon]) => (
              <span key={t as string} className="flex items-center gap-1.5">{icon}{t}</span>
            ))}
          </motion.div>
        </div>

        {/* Interactive hero console */}
        <motion.div initial={{ opacity: 0, y: 40, rotateX: 6 }} animate={{ opacity: 1, y: 0, rotateX: 0 }} transition={{ duration: 0.9, delay: 0.2 }}
          className="group relative rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.08] to-white/[0.02] p-5 shadow-[0_20px_80px_rgba(0,0,0,0.5)] backdrop-blur-2xl transition-transform duration-500 hover:[transform:perspective(1000px)_rotateY(-2deg)_rotateX(1deg)]">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button onClick={() => setPlaying(!playing)} className="pressable grid h-10 w-10 place-items-center rounded-full bg-white text-black hover:scale-105">
                {playing ? <Pause className="h-4 w-4" /> : <Play className="ml-0.5 h-4 w-4" />}
              </button>
              <div>
                <p className="text-sm font-semibold text-white">Midnight Confessions — AI Mix</p>
                <p className="text-xs text-slate-400">C Minor · 142 BPM · Pitch 78% Fast</p>
              </div>
            </div>
            <MiniMeters playing={playing} />
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/40 p-3">
            <Waveform peaks={peaks} progress={progress} height={110} onSeek={setProgress} />
            <div className="mt-2 flex justify-between text-[11px] text-slate-500"><span>0:47</span><span className="text-cyan-300">AI MIX • simulated preview</span><span>2:28</span></div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            {[["Autotune", "78%"], ["Space", "Atmos."], ["Width", "Chorus+"]].map(([k, v]) => (
              <div key={k} className="rounded-xl border border-white/10 bg-white/[0.04] px-2 py-2.5">
                <p className="text-[10px] uppercase tracking-widest text-slate-500">{k}</p>
                <p className="font-display text-sm font-semibold text-white">{v}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-amber-300/20 bg-amber-300/[0.07] px-3 py-2 text-[11px] text-amber-200">
            <ShieldCheck className="h-4 w-4 shrink-0" /> Preview is simulated in-browser. Release render runs on the backend DSP service.
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { icon: <FileMusic className="h-5 w-5" />, t: "Upload beat + vocal", d: "Drop your beat, your vocal take, and optionally a reference song. We read BPM, key, pitch and dynamics." },
    { icon: <Wand2 className="h-5 w-5" />, t: "Describe your sound", d: "“Dark and emotional, strong autotune, wide chorus…” — plain words become structured mix parameters." },
    { icon: <GitBranch className="h-5 w-5" />, t: "AI builds your chain", d: "Pitch → EQ → Compression → De-ess → Saturation → Delay → Reverb → Stereo. Every knob editable." },
    { icon: <Download className="h-5 w-5" />, t: "Preview & export to FL", d: "A/B your mix, then export WAV/MP3, separated stems, and an FL Studio project package." },
  ];
  return (
    <section id="how-it-works" className="mx-auto max-w-7xl scroll-mt-24 px-5 py-20">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300">How it works</p>
      <h2 className="font-display mt-2 text-3xl font-bold text-white sm:text-4xl">From raw vocal to release-ready in minutes</h2>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((s, i) => (
          <motion.div key={s.t} variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }} custom={i}
            whileHover={{ y: -6 }} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur transition-colors hover:border-cyan-300/30">
            <div className="mb-3 flex items-center justify-between">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-cyan-400/20 to-violet-500/20 text-cyan-300">{s.icon}</span>
              <span className="font-display text-4xl font-bold text-white/10">0{i + 1}</span>
            </div>
            <p className="font-semibold text-white">{s.t}</p>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{s.d}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function ChainShowcase() {
  const mods = ["Pitch Correction", "EQ", "Compression", "De-essing", "Saturation", "Delay", "Reverb", "Stereo"];
  return (
    <section id="ai-chain" className="scroll-mt-24 border-y border-white/5 bg-white/[0.015] py-20">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 lg:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-violet-300">AI vocal processing</p>
          <h2 className="font-display mt-2 text-3xl font-bold text-white sm:text-4xl">A real chain, not a black box</h2>
          <p className="mt-4 leading-relaxed text-slate-400">Every AI decision lands in a visible, clickable module. Tweak retune speed, presence, threshold, decay — Simple mode keeps it friendly, Pro mode opens every parameter.</p>
          <ul className="mt-6 space-y-2.5 text-sm text-slate-300">
            {["Automatic key + BPM estimate (overridable)", "Section-aware verse/chorus automation", "Simple ↔ Pro modes for beginners → engineers"].map((t) => (
              <li key={t} className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400" />{t}</li>
            ))}
          </ul>
          <Link href="/studio" className="pressable mt-7 inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10">
            Open the live chain <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="rounded-3xl border border-white/10 bg-[#070b14]/80 p-5 backdrop-blur">
          <div className="mb-3 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1.5"><Disc3 className="h-3.5 w-3.5 animate-spin text-cyan-300" /> VOCAL INPUT</span>
            <span className="rounded-full bg-cyan-400/10 px-2 py-0.5 text-cyan-300">AI chain • editable</span>
          </div>
          <div className="space-y-1.5">
            {mods.map((m, i) => (
              <motion.div key={m} initial={{ opacity: 0, x: 24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}
                className="group flex cursor-default items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] px-3.5 py-2.5 transition hover:border-cyan-300/30 hover:bg-cyan-300/[0.06]">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-cyan-400/30 to-violet-500/30 text-[11px] font-bold text-cyan-200">{String(i + 1).padStart(2, "0")}</span>
                <span className="flex-1 text-sm font-medium text-slate-200">{m}</span>
                <span className="text-[11px] text-slate-500 transition group-hover:text-cyan-300">click to edit →</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ReferenceSection() {
  const rows = [["Presence", 82, 76], ["Brightness", 74, 68], ["Width", 80, 72], ["Reverb", 55, 58], ["Saturation", 34, 30]];
  return (
    <section id="reference" className="mx-auto max-w-7xl scroll-mt-24 px-5 py-20">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <div className="order-2 rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur lg:order-1">
          <p className="mb-4 text-xs uppercase tracking-widest text-slate-500">Reference vs yours • production traits only</p>
          {rows.map(([k, ref, yours]) => (
            <div key={k as string} className="mb-3">
              <div className="mb-1 flex justify-between text-xs"><span className="text-slate-300">{k}</span><span className="text-slate-500">ref {ref} · you {yours}</span></div>
              <div className="relative h-2 overflow-hidden rounded-full bg-white/10">
                <motion.div initial={{ width: 0 }} whileInView={{ width: `${ref}%` }} viewport={{ once: true }} transition={{ duration: 0.9 }} className="absolute inset-y-0 left-0 rounded-full bg-white/30" />
                <motion.div initial={{ width: 0 }} whileInView={{ width: `${yours}%` }} viewport={{ once: true }} transition={{ duration: 0.9, delay: 0.15 }} className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-cyan-400 to-violet-500" />
              </div>
            </div>
          ))}
          <p className="mt-4 rounded-xl border border-white/10 bg-black/30 p-3 text-xs leading-relaxed text-slate-400">Reference analysis reproduces the <span className="text-white">production characteristics</span> of the reference while keeping your own voice. We never clone identity.</p>
        </div>
        <div className="order-1 lg:order-2">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300">Reference matching</p>
          <h2 className="font-display mt-2 text-3xl font-bold text-white sm:text-4xl">Sound like the record, still sound like you</h2>
          <p className="mt-4 leading-relaxed text-slate-400">Upload any song as inspiration. VocalForge reads its loudness balance, EQ curve, compression glue, space and width — then bends your mix toward it with the Reference Influence slider. 0% is all-you, 100% leans hard into the reference.</p>
        </div>
      </div>
    </section>
  );
}

function FLSection() {
  return (
    <section id="fl-studio" className="scroll-mt-24 border-y border-white/5 bg-gradient-to-b from-violet-600/[0.07] to-transparent py-20">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 lg:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-300">FL Studio workflow</p>
          <h2 className="font-display mt-2 text-3xl font-bold text-white sm:text-4xl">Built for FL Studio producers</h2>
          <p className="mt-4 leading-relaxed text-slate-400">Export a ready-to-import project package: dry + processed vocals, beat, isolated reverb/delay sends, mix-settings JSON and a step-by-step README. Your mixer routing survives the trip.</p>
          <div className="mt-5 rounded-2xl border border-white/10 bg-black/40 p-4 font-mono text-xs leading-relaxed text-slate-300">
            VocalForge_Project/<br />
            <span className="text-slate-500">├─</span> Vocal_Dry.wav<br />
            <span className="text-slate-500">├─</span> Vocal_Processed.wav<br />
            <span className="text-slate-500">├─</span> Beat.wav · Vocal_Reverb.wav · Vocal_Delay.wav<br />
            <span className="text-slate-500">├─</span> <span className="text-cyan-300">Mix_Settings.json</span> <span className="text-slate-500">(plugin contract)</span><br />
            <span className="text-slate-500">└─</span> README.txt
          </div>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-500 text-black"><Plug2 className="h-5 w-5" /></span>
            <div><p className="font-semibold text-white">FL Studio Plugin — Coming Soon</p><p className="text-xs text-slate-400">Same backend, inside your DAW</p></div>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-slate-400">The long-term version sends a vocal clip straight from FL Studio to VocalForge AI and returns the identical MixChain JSON to instantiate native mixer effects. The API contract (<span className="font-mono text-xs text-cyan-300">POST /api/mix/generate</span>) is already plugin-shaped.</p>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
            {[["Step 1", "Send clip"], ["Step 2", "AI mixes"], ["Step 3", "Chain loads"]].map(([a, b]) => (
              <div key={a} className="rounded-xl border border-white/10 bg-black/30 px-2 py-3"><p className="text-slate-500">{a}</p><p className="mt-0.5 font-semibold text-white">{b}</p></div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function BeforeAfter() {
  const [mix, setMix] = useState(75);
  return (
    <section id="before-after" className="mx-auto max-w-7xl scroll-mt-24 px-5 py-20">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300">Before / After</p>
      <h2 className="font-display mt-2 text-3xl font-bold text-white sm:text-4xl">Drag the difference</h2>
      <div className="relative mt-8 overflow-hidden rounded-3xl border border-white/10">
        <div className="grid grid-cols-2">
          <div className="bg-[#0a0f1c] p-8"><p className="text-xs uppercase tracking-widest text-slate-500">Before — raw phone take</p><MiniMeters playing={false} /><p className="mt-3 text-sm text-slate-500">Thin · boxy · sits behind the beat</p></div>
          <div className="bg-gradient-to-br from-cyan-500/15 to-violet-600/15 p-8"><p className="text-xs uppercase tracking-widest text-cyan-300">After — VocalForge AI</p><MiniMeters playing /><p className="mt-3 text-sm text-slate-200">Present · wide chorus · glued to the 808s</p></div>
        </div>
        <div className="absolute inset-y-0" style={{ left: `${mix}%` }}>
          <div className="h-full w-[2px] bg-white shadow-[0_0_20px_rgba(255,255,255,0.6)]" />
          <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/30 bg-black/70 px-3 py-1.5 font-mono text-xs text-white backdrop-blur">↔ {mix}%</div>
        </div>
        <input type="range" min={0} max={100} value={mix} onChange={(e) => setMix(Number(e.target.value))} className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0" aria-label="Before after comparison" />
      </div>
      <p className="mt-3 text-xs text-slate-500">Interactive illustration — connect backend stems for true A/B audio.</p>
    </section>
  );
}

function Features() {
  const feats = [
    { icon: <Zap className="h-5 w-5" />, t: "Natural-language mixing", d: "“Dreamy but upfront, phone-verse into wide chorus” just works. A rule-based interpreter today, an LLM tomorrow — same JSON." },
    { icon: <SlidersHorizontal className="h-5 w-5" />, t: "Simple ↔ Pro modes", d: "Six friendly knobs for beginners; full EQ/comp/space surgery for engineers. One chain, two lenses." },
    { icon: <Layers className="h-5 w-5" />, t: "Section automation", d: "Intro / Verse / Chorus / Bridge each get their own width, space and tune targets." },
    { icon: <Radio className="h-5 w-5" />, t: "Honest mock backend", d: "Every simulated result is labeled. Real FFmpeg + DSP + LLM workers plug into the same routes." },
    { icon: <ShieldCheck className="h-5 w-5" />, t: "Production-only references", d: "We match tone, glue and space — never vocal identity. Your voice stays yours." },
    { icon: <Disc3 className="h-5 w-5" />, t: "Stems + FL package", d: "Dry, processed, beat, reverb and delay stems plus Mix_Settings.json for FL Studio and the future plugin." },
  ];
  return (
    <section id="features" className="mx-auto max-w-7xl scroll-mt-24 px-5 py-20">
      <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">Everything a bedroom producer needs</h2>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {feats.map((f, i) => (
          <motion.div key={f.t} variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }} custom={i}
            whileHover={{ y: -5 }} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-cyan-400/20 to-violet-500/20 text-cyan-300">{f.icon}</span>
            <p className="mt-3 font-semibold text-white">{f.t}</p>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{f.d}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function FAQ() {
  const [open, setOpen] = useState(0);
  const faqs = [
    { q: "Is this real AI mixing or a demo?", a: "The product flow is real; the intelligence is currently a clearly-labeled mock backend (engine mock-backend-v1) with deterministic, musical results. The API contracts — /api/analyze/*, /api/mix/generate, /api/export/fl-studio — are designed so real LLM + DSP workers replace the mocks without touching the UI." },
    { q: "Do I need music theory?", a: "No. Describe the vibe in plain words and pick Simple mode. Key, BPM and pitch are auto-estimated and every guess is overridable with one click." },
    { q: "Does the reference clone someone's voice?", a: "Never. Reference analysis reads production traits only — level balance, EQ curve, compression, space, width, saturation — and applies them to your own recording." },
    { q: "How does the FL Studio export work?", a: "You get a VocalForge_Project folder with dry + processed vocals, beat, isolated reverb/delay sends, Mix_Settings.json (the exact AI chain as data) and a README with mixer routing steps. We don't claim native .flp generation — the JSON is the contract the coming plugin will consume." },
    { q: "Where does processing happen?", a: "All analysis and mix decisions live server-side in server/vocalforge/*, called from Next.js API routes. The browser only uploads metadata, renders UI, and plays a labeled in-browser preview simulation. API keys stay in server environment variables." },
  ];
  return (
    <section id="faq" className="mx-auto max-w-4xl scroll-mt-24 px-5 py-20">
      <h2 className="font-display text-center text-3xl font-bold text-white sm:text-4xl">Questions, answered</h2>
      <div className="mt-8 space-y-3">
        {faqs.map((f, i) => (
          <div key={f.q} className={`overflow-hidden rounded-2xl border transition ${open === i ? "border-cyan-300/30 bg-cyan-300/[0.05]" : "border-white/10 bg-white/[0.03]"}`}>
            <button onClick={() => setOpen(open === i ? -1 : i)} className="flex w-full items-center justify-between px-5 py-4 text-left font-medium text-white">
              {f.q}<ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${open === i ? "rotate-180 text-cyan-300" : "text-slate-500"}`} />
            </button>
            {open === i && <p className="px-5 pb-5 text-sm leading-relaxed text-slate-400">{f.a}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="mx-auto max-w-7xl px-5 pb-24">
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-cyan-500/15 via-[#0a0f1c] to-violet-600/15 p-10 text-center sm:p-16">
        <div className="pointer-events-none absolute -top-24 left-1/2 h-64 w-[36rem] -translate-x-1/2 rounded-full bg-cyan-400/15 blur-[100px]" />
        <h2 className="font-display relative text-3xl font-bold text-white sm:text-5xl">Stop guessing knob positions.<br />Describe the sound.</h2>
        <p className="relative mx-auto mt-4 max-w-xl text-slate-400">Your next vocal mix is one upload and one sentence away.</p>
        <Link href="/studio" className="pressable relative mt-8 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 to-violet-500 px-8 py-4 font-semibold text-[#04060c] shadow-[0_0_50px_rgba(34,211,238,0.4)]">
          <Sparkles className="h-5 w-5" /> Create My Vocal
        </Link>
      </div>
      <footer className="mt-10 flex flex-col items-center justify-between gap-3 text-xs text-slate-600 sm:flex-row">
        <span>VocalForge AI — prototype with mock backend (engine mock-backend-v1). Simulated results are labeled.</span>
        <span className="font-mono">POST /api/mix/generate · GET /api/health</span>
      </footer>
    </section>
  );
}

export default function LandingPage() {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 600], [0, 60]);
  return (
    <div className="min-h-screen bg-[#05070d] font-display text-slate-200">
      <Nav />
      <motion.div style={{ y }}><Hero /></motion.div>
      <HowItWorks />
      <ChainShowcase />
      <ReferenceSection />
      <FLSection />
      <BeforeAfter />
      <Features />
      <FAQ />
      <CTA />
    </div>
  );
}
