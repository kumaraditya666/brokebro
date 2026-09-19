"use client";
import { useMemo, useRef, useState } from "react";
import { Upload, Play, Pause, X, RefreshCw, Loader2, Music2, Mic2, Disc3, AlertCircle, CheckCircle2 } from "lucide-react";
import type { AudioSlot } from "@/types/vocalforge";
import { ACCEPT_BY_SLOT, fmtSize, fmtTime, probeDuration, validateAudioFile, extractPeaks } from "@/lib/vocalforge/audioFile";
import { api } from "@/lib/vocalforge/apiClient";
import { useVF } from "@/store/useVocalForge";
import { Waveform } from "./ui";

const SLOT_META: Record<AudioSlot, { label: string; sub: string; icon: React.ReactNode; optional?: boolean }> = {
  beat: { label: "Your Beat", sub: "MP3 · WAV · M4A · OGG · FLAC", icon: <Music2 className="h-5 w-5" /> },
  vocal: { label: "Your Vocal", sub: "WAV · MP3 · M4A", icon: <Mic2 className="h-5 w-5" /> },
  reference: { label: "Reference Sound", sub: "Optional — production inspiration", icon: <Disc3 className="h-5 w-5" />, optional: true },
};

export function UploadCard({ slot }: { slot: AudioSlot }) {
  const meta = SLOT_META[slot];
  const inputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const vf = useVF();
  const file = vf.files[slot];
  const stored = slot === "beat" ? vf.project.beat : slot === "vocal" ? vf.project.vocal : vf.project.reference;
  const peaks = vf.peaks[slot];
  const analysis = slot === "beat" ? vf.project.beatAnalysis : slot === "vocal" ? vf.project.vocalAnalysis : vf.project.referenceAnalysis;
  const analyzing = vf.analyzing[slot];
  const fileUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);

  const onPick = async (f: File | undefined) => {
    if (!f) return;
    const err = validateAudioFile(f, slot);
    if (err) { vf.setError(err); return; }
    vf.setError(null);
    setBusy(true);
    vf.setNotice(null);
    try {
      const durationSec = (await probeDuration(f)) || 60;
      const url = URL.createObjectURL(f);
      const metaFile = {
        id: `${slot}_${Date.now().toString(36)}`,
        slot, name: f.name, size: f.size, mime: f.type || "audio/*",
        durationSec: Number(durationSec.toFixed(1)), objectUrl: url,
        uploadedAt: new Date().toISOString(),
      };
      const localPeaks = await extractPeaks(f, 96);
      vf.setFile(slot, f, metaFile, localPeaks);
      // Backend analysis (mock). Frontend sends metadata only.
      set({ analyzing: true });
      try {
        if (slot === "beat") {
          const { analysis } = await api.analyzeBeat({ name: f.name, size: f.size, durationSec });
          analysis.waveformPeaks = localPeaks;
          vf.setAnalysis(slot, analysis);
        } else if (slot === "vocal") {
          const { analysis } = await api.analyzeVocal({ name: f.name, size: f.size, durationSec });
          analysis.waveformPeaks = localPeaks;
          vf.setAnalysis(slot, analysis);
        } else {
          const { analysis } = await api.analyzeReference({ name: f.name, size: f.size, durationSec });
          vf.setAnalysis(slot, analysis);
        }
        vf.setEngineOnline(true);
        vf.setNotice(`${meta.label} analyzed — ${slot === "beat" ? "BPM + key estimated" : slot === "vocal" ? "pitch + sections detected" : "production traits mapped"}.`);
      } catch (e) {
        vf.setEngineOnline(false);
        vf.setError(e instanceof Error ? e.message : "Backend unavailable — file kept locally, analysis skipped.");
      } finally {
        set({ analyzing: false });
      }
    } finally {
      setBusy(false);
    }
    function set(patch: Partial<{ analyzing: boolean }>) {
      void patch;
      useVF.setState((s) => ({ analyzing: { ...s.analyzing, [slot]: patch.analyzing ?? s.analyzing[slot] } }));
    }
  };

  const toggle = () => {
    const el = audioRef.current;
    if (!el || !file) return;
    if (playing) { el.pause(); } else { void el.play(); }
  };

  const remove = () => {
    setPlaying(false); setProgress(0);
    vf.setFile(slot, null, null, []);
    vf.setAnalysis(slot, null);
  };

  const border = slot === "vocal"
    ? "border-violet-400/25 hover:border-violet-300/50"
    : slot === "beat" ? "border-cyan-300/25 hover:border-cyan-300/50" : "border-white/10 hover:border-white/25";

  return (
    <div className={`rounded-2xl border bg-white/[0.03] backdrop-blur-xl transition ${border}`}>
      <div className="flex items-center justify-between px-4 pt-3.5">
        <div className="flex items-center gap-2.5">
          <span className={`grid h-9 w-9 place-items-center rounded-xl ${slot === "vocal" ? "bg-violet-500/15 text-violet-300" : slot === "beat" ? "bg-cyan-400/15 text-cyan-300" : "bg-white/10 text-slate-300"}`}>{meta.icon}</span>
          <div>
            <p className="text-sm font-semibold text-white">{meta.label} {meta.optional && <span className="ml-1 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-medium text-slate-400">optional</span>}</p>
            <p className="text-[11px] text-slate-500">{meta.sub}</p>
          </div>
        </div>
        {analyzing && <Loader2 className="h-4 w-4 animate-spin text-cyan-300" />}
      </div>

      <div className="p-4">
        {!file ? (
          <button
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); void onPick(e.dataTransfer.files?.[0]); }}
            className="group flex w-full flex-col items-center gap-2 rounded-xl border border-dashed border-white/15 bg-black/20 px-4 py-7 transition hover:border-cyan-300/40 hover:bg-cyan-300/[0.04]"
          >
            {busy ? <Loader2 className="h-6 w-6 animate-spin text-cyan-300" /> : <Upload className="h-6 w-6 text-slate-400 transition group-hover:-translate-y-0.5 group-hover:text-cyan-300" />}
            <span className="text-sm font-medium text-slate-300">Drop audio here or <span className="text-cyan-300 underline underline-offset-2">browse</span></span>
            <span className="text-[11px] text-slate-500">Analyzed on the backend · max {ACCEPT_BY_SLOT[slot].maxMb} MB</span>
          </button>
        ) : (
          <div className="rounded-xl border border-white/10 bg-black/30 p-3">
            <div className="flex items-center gap-2.5">
              <button onClick={toggle} className="pressable grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-black">
                {playing ? <Pause className="h-4 w-4" /> : <Play className="ml-0.5 h-4 w-4" />}
              </button>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white" title={stored?.name}>{stored?.name}</p>
                <p className="text-[11px] text-slate-500">{stored && `${fmtTime(stored.durationSec)} · ${fmtSize(stored.size)}`}</p>
              </div>
              <button onClick={() => inputRef.current?.click()} title="Replace" className="pressable rounded-lg border border-white/10 p-1.5 text-slate-400 hover:text-white"><RefreshCw className="h-3.5 w-3.5" /></button>
              <button onClick={remove} title="Remove" className="pressable rounded-lg border border-white/10 p-1.5 text-slate-400 hover:text-red-300"><X className="h-3.5 w-3.5" /></button>
            </div>
            <div className="mt-2.5">
              <Waveform peaks={peaks.length ? peaks : Array.from({ length: 64 }, () => 0.3)} progress={progress} height={52} onSeek={(t) => {
                const el = audioRef.current;
                if (el && Number.isFinite(el.duration)) { el.currentTime = t * el.duration; setProgress(t); }
              }} />
            </div>
            {analysis && <AnalysisChips slot={slot} />}
            {analysis && (analysis as { warnings?: string[] }).warnings?.map((w) => (
              <p key={w} className="mt-2 flex items-start gap-1.5 rounded-lg bg-amber-300/[0.07] px-2.5 py-2 text-[11px] leading-relaxed text-amber-200"><AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />{w}</p>
            ))}
            {!analyzing && analysis && (
              <p className="mt-2 flex items-center gap-1.5 text-[11px] text-emerald-300"><CheckCircle2 className="h-3.5 w-3.5" />Backend analysis complete</p>
            )}
            <audio
              ref={audioRef}
              src={fileUrl ?? undefined}
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              onTimeUpdate={(e) => {
                const el = e.currentTarget;
                if (el.duration) setProgress(el.currentTime / el.duration);
              }}
              onEnded={() => { setPlaying(false); setProgress(0); }}
            />
          </div>
        )}
        {slot === "reference" && !file && (
          <p className="mt-2.5 rounded-xl border border-white/10 bg-white/[0.02] p-2.5 text-[11px] leading-relaxed text-slate-400">
            Reference analysis helps reproduce the production characteristics of the reference while keeping your own voice.
          </p>
        )}
      </div>
      <input type="file"
        accept={ACCEPT_BY_SLOT[slot].accept}
        className="hidden"
        ref={inputRef}
        onChange={(e) => { void onPick(e.target.files?.[0]); e.target.value = ""; }}
      />
    </div>
  );
}

function AnalysisChips({ slot }: { slot: AudioSlot }) {
  const vf = useVF();
  if (slot === "beat" && vf.project.beatAnalysis) {
    const a = vf.project.beatAnalysis;
    return (
      <div className="mt-2.5 flex flex-wrap gap-1.5 text-[11px]">
        {[`♩ ${a.bpm} BPM`, `Key ${a.musicalKey}`, `${a.loudnessLufs} LUFS`].map((t) => (
          <span key={t} className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-2.5 py-1 font-medium text-cyan-200">{t}</span>
        ))}
      </div>
    );
  }
  if (slot === "vocal" && vf.project.vocalAnalysis) {
    const a = vf.project.vocalAnalysis;
    return (
      <div className="mt-2.5 flex flex-wrap gap-1.5 text-[11px]">
        {[`Pitch ${a.pitchMedianHz} Hz`, `Key ~${a.approxKey}`, `Dyn ${a.dynamicRangeDb} dB`, `${a.sections.length} sections`].map((t) => (
          <span key={t} className="rounded-full border border-violet-300/20 bg-violet-400/10 px-2.5 py-1 font-medium text-violet-200">{t}</span>
        ))}
      </div>
    );
  }
  if (slot === "reference" && vf.project.referenceAnalysis) {
    const a = vf.project.referenceAnalysis;
    return (
      <div className="mt-2.5 flex flex-wrap gap-1.5 text-[11px]">
        {[`V/+${a.vocalToInstrumentDb} dB`, `Width ${a.stereoWidth}`, `Tune ${a.pitchCorrectionIntensity}%`].map((t) => (
          <span key={t} className="rounded-full border border-white/15 bg-white/10 px-2.5 py-1 font-medium text-slate-300">{t}</span>
        ))}
      </div>
    );
  }
  return null;
}
