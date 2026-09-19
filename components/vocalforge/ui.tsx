"use client";
import { useEffect, useRef } from "react";

/** Lightweight canvas waveform. Efficient: draws precomputed peaks only. */
export function Waveform({
  peaks, progress = 0, height = 64, active = true, onSeek,
}: {
  peaks: number[]; progress?: number; height?: number; active?: boolean; onSeek?: (t: number) => void;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = canvas.clientWidth * dpr;
    const h = height * dpr;
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, w, h);
    const n = peaks.length || 64;
    const bw = w / n;
    for (let i = 0; i < n; i++) {
      const v = peaks[i] ?? 0.2;
      const played = i / n <= progress;
      const bh = Math.max(2 * dpr, v * (h * 0.92));
      const x = i * bw + bw * 0.2;
      const y = (h - bh) / 2;
      const g = ctx.createLinearGradient(0, y, 0, y + bh);
      if (played) { g.addColorStop(0, "#22d3ee"); g.addColorStop(1, "#a78bfa"); }
      else if (!active) { g.addColorStop(0, "rgba(148,163,184,0.35)"); g.addColorStop(1, "rgba(148,163,184,0.2)"); }
      else { g.addColorStop(0, "rgba(34,211,238,0.55)"); g.addColorStop(1, "rgba(167,139,250,0.45)"); }
      ctx.fillStyle = g;
      const rw = Math.max(1.5 * dpr, bw * 0.6);
      roundRect(ctx, x, y, rw, bh, rw / 2);
      ctx.fill();
    }
    // playhead
    const px = progress * w;
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.fillRect(px - dpr, 0, 2 * dpr, h);
  }, [peaks, progress, height, active]);

  return (
    <canvas
      ref={ref}
      style={{ height }}
      className="w-full cursor-pointer"
      onClick={(e) => {
        if (!onSeek) return;
        const r = (e.target as HTMLCanvasElement).getBoundingClientRect();
        onSeek(Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)));
      }}
    />
  );
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Animated audio meter bars (pure CSS, cheap). */
export function MiniMeters({ playing }: { playing: boolean }) {
  const bars = [0.5, 0.9, 0.65, 1, 0.4, 0.75, 0.55, 0.85, 0.45, 0.7, 0.6, 0.95];
  return (
    <div className="flex h-5 items-end gap-[3px]" aria-hidden>
      {bars.map((h, i) => (
        <span
          key={i}
          className="w-[3px] rounded-full bg-gradient-to-t from-cyan-400 to-violet-400"
          style={{
            height: `${Math.round(h * 20)}px`,
            opacity: playing ? 1 : 0.35,
            animation: playing ? `vf-meter 0.9s ease-in-out ${i * 0.07}s infinite alternate` : undefined,
          }}
        />
      ))}
    </div>
  );
}

export function Slider({
  value, min = 0, max = 100, step = 1, onChange, label,
}: {
  value: number; min?: number; max?: number; step?: number;
  onChange: (v: number) => void; label?: string;
}) {
  return (
    <input
      aria-label={label ?? "slider"}
      type="range" min={min} max={max} step={step} value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="vf-slider w-full"
    />
  );
}

export function GlassCard({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={`rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl shadow-[0_8px_40px_rgba(0,0,0,0.35)] ${className}`}>
      {children}
    </div>
  );
}
