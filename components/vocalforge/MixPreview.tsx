"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Play, Pause, Repeat, Volume2, FlaskConical, Loader2 } from "lucide-react";
import type { PreviewTab } from "@/store/useVocalForge";
import { useVF } from "@/store/useVocalForge";
import { Waveform, Slider } from "./ui";
import { fmtTime } from "@/lib/vocalforge/audioFile";
import { renderPreviewMix } from "@/lib/vocalforge/previewRender";

export function MixPreview() {
  const vf = useVF();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [cur, setCur] = useState(0);
  const [dur, setDur] = useState(0);
  const [rawUrl, setRawUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [rendering, setRendering] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);

  const mix = vf.project.mix;
  const vocalFile = vf.files.vocal;
  // Re-render the audition whenever the chain changes (debounced below).
  const chainKey = useMemo(() => (mix ? JSON.stringify(mix.chain) : null), [mix]);

  // Raw file URL for Original / Reference tabs.
  useEffect(() => {
    const f =
      vf.previewTab === "reference" ? vf.files.reference ?? vf.files.beat :
      vf.files.vocal ?? vf.files.beat;
    if (f) {
      const url = URL.createObjectURL(f);
      setRawUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setRawUrl(null);
  }, [vf.previewTab, vf.files.vocal, vf.files.beat, vf.files.reference]);

  // Rendered AI preview: re-run the (simulated) chain off the main thread
  // via OfflineAudioContext whenever the mix or vocal changes.
  useEffect(() => {
    if (!mix || !vocalFile || !chainKey) { setPreviewUrl(null); return; }
    let cancelled = false;
    setRendering(true);
    setRenderError(null);
    const id = setTimeout(() => {
      renderPreviewMix(vocalFile, mix.chain, 0)
        .then(({ wav }) => {
          if (cancelled) return;
          setPreviewUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return URL.createObjectURL(wav);
          });
        })
        .catch((e) => {
          if (!cancelled) setRenderError(e instanceof Error ? e.message : "Preview render failed.");
        })
        .finally(() => { if (!cancelled) setRendering(false); });
    }, 700); // debounce: lets knob drags settle before re-rendering
    return () => { cancelled = true; clearTimeout(id); };
  }, [mix, vocalFile, chainKey]);

  const src = vf.previewTab === "aimix" ? previewUrl ?? rawUrl : rawUrl;

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    el.volume = vf.volume / 100;
  }, [vf.volume]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    if (vf.isPlaying && src) void el.play().catch(() => vf.setPlaying(false));
    else el.pause();
  }, [vf.isPlaying, src]); // eslint-disable-line react-hooks/exhaustive-deps

  const peaks =
    vf.previewTab === "original" ? vf.peaks.vocal :
    vf.previewTab === "reference" ? vf.peaks.reference :
    vf.peaks.vocal.length ? vf.peaks.vocal : vf.peaks.beat;
  const shown = peaks.length ? peaks : Array.from({ length: 96 }, (_, i) => 0.3 + 0.3 * Math.abs(Math.sin(i * 0.5)));
  const progress = dur ? cur / dur : 0;

  const tabs: { id: PreviewTab; label: string }[] = [
    { id: "original", label: "Original" },
    { id: "aimix", label: "AI Mix" },
    { id: "reference", label: "Reference" },
  ];

  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.05] to-transparent p-4 backdrop-blur-xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex rounded-full border border-white/10 bg-black/40 p-1 text-xs">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => vf.setPreviewTab(t.id)}
              className={`pressable rounded-full px-4 py-1.5 font-semibold transition ${vf.previewTab === t.id ? "bg-white text-black" : "text-slate-400 hover:text-white"}`}>
              {t.label}
            </button>
          ))}
        </div>
        {/* Before / After */}
        <div className="flex items-center gap-2 text-[11px] text-slate-400">
          <span className={vf.beforeAfter < 50 ? "font-bold text-white" : ""}>Before</span>
          <input type="range" min={0} max={100} value={vf.beforeAfter} onChange={(e) => {
            vf.setBeforeAfter(Number(e.target.value));
            vf.setPreviewTab(Number(e.target.value) >= 50 ? "aimix" : "original");
          }} className="vf-slider w-28" aria-label="Before after" />
          <span className={vf.beforeAfter >= 50 ? "font-bold text-cyan-300" : ""}>After</span>
        </div>
      </div>

      <div className="mt-3 rounded-xl border border-white/10 bg-black/40 p-3">
        <Waveform peaks={shown} progress={progress} height={84} onSeek={(t) => {
          const el = audioRef.current;
          if (el && dur) { el.currentTime = t * dur; setCur(t * dur); }
        }} />
        <div className="mt-1 flex justify-between font-mono text-[11px] text-slate-500">
          <span>{fmtTime(cur)}</span>
          <span>{vf.previewTab === "aimix" ? "AI MIX · preview simulation" : vf.previewTab.toUpperCase()}</span>
          <span>{fmtTime(dur)}</span>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button onClick={() => vf.setPlaying(!vf.isPlaying)} disabled={!src}
          className="pressable grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-cyan-400 to-violet-500 text-black shadow-[0_0_24px_rgba(34,211,238,0.35)] disabled:opacity-30">
          {vf.isPlaying ? <Pause className="h-5 w-5" /> : <Play className="ml-0.5 h-5 w-5" />}
        </button>
        <button onClick={() => vf.setLoop(!vf.loop)} title="Loop section"
          className={`pressable flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold ${vf.loop ? "border-cyan-300/40 bg-cyan-300/10 text-cyan-200" : "border-white/10 text-slate-400 hover:text-white"}`}>
          <Repeat className="h-3.5 w-3.5" /> Loop
        </button>
        <div className="flex min-w-[160px] flex-1 items-center gap-2">
          <Volume2 className="h-4 w-4 text-slate-400" />
          <Slider value={vf.volume} onChange={vf.setVolume} label="Volume" />
          <span className="w-8 font-mono text-[11px] text-slate-400">{vf.volume}</span>
        </div>
        <button onClick={() => {
          vf.setPreviewTab("original"); vf.setBeforeAfter(0);
          setTimeout(() => { vf.setPreviewTab("aimix"); vf.setBeforeAfter(100); }, 1600);
        }} className="pressable rounded-xl border border-white/15 bg-white/5 px-3.5 py-2 text-xs font-semibold text-white hover:bg-white/10">
          A/B compare
        </button>
      </div>

      {vf.previewTab === "aimix" && (
        <p className="mt-2.5 flex items-start gap-1.5 rounded-xl border border-cyan-300/15 bg-cyan-300/[0.05] px-3 py-2 text-[11px] leading-relaxed text-cyan-100/80">
          {rendering
            ? <Loader2 className="mt-0.5 h-3.5 w-3.5 shrink-0 animate-spin" />
            : <FlaskConical className="mt-0.5 h-3.5 w-3.5 shrink-0" />}
          {rendering
            ? "Rendering your AI preview through the chain — one moment…"
            : renderError
              ? `Preview render hiccup: ${renderError} Playing the dry vocal instead.`
              : mix
                ? `Now playing the PROCESSED preview (“${mix.chain.eq.toneProfile} · ${mix.chain.reverb.type} · ${mix.chain.delay.timeNote}”). Tweaking any knob re-renders this audition. In-browser simulation — backend DSP prints the release render.`
                : "Upload files + create your vocal to unlock the AI mix audition."}
        </p>
      )}
      {!src && <p className="mt-2 text-center text-xs text-slate-600">Upload audio to enable playback.</p>}
      <audio
        ref={audioRef}
        src={src ?? undefined}
        loop={vf.loop}
        onTimeUpdate={(e) => setCur(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDur(e.currentTarget.duration || 0)}
        onEnded={() => vf.setPlaying(false)}
        onPlay={() => vf.setPlaying(true)}
        onPause={() => { if (vf.isPlaying) vf.setPlaying(false); }}
      />
    </div>
  );
}
