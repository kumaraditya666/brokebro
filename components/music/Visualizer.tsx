// BROKE MUSIC — audio visualizer (Web Audio Analyser → Canvas).
// Modes: minimal (hidden), wave, spectrum, orbital. Falls back to an idle
// sine animation before the AudioContext exists (pre-gesture).
"use client";

import { useEffect, useRef } from "react";
import type { VisualMode } from "@/types/music";
import { getAnalyser } from "@/lib/music/audioEngine";
import { usePlayer } from "./PlayerProvider";

export function Visualizer({ mode, height = 64 }: { mode: VisualMode; height?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const { isPlaying } = usePlayer();

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || mode === "minimal") return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const fit = () => {
      const r = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.floor(r.width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
    };
    fit();
    window.addEventListener("resize", fit);

    const draw = () => {
      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);
      const an = getAnalyser();
      if (mode === "wave") {
        let data: Uint8Array<ArrayBuffer> | null = null;
        try {
          if (an) {
            data = new Uint8Array(an.fftSize);
            an.getByteTimeDomainData(data);
          }
        } catch {
          data = null;
        }
        ctx.lineWidth = 2 * dpr;
        const grad = ctx.createLinearGradient(0, 0, W, 0);
        grad.addColorStop(0, "#bef264");
        grad.addColorStop(0.5, "#34d399");
        grad.addColorStop(1, "#a78bfa");
        ctx.strokeStyle = grad;
        ctx.beginPath();
        const N = data?.length ?? 128;
        for (let x = 0; x < W; x += 3 * dpr) {
          const i = Math.floor((x / W) * N);
          let v: number;
          if (data) v = (data[i] - 128) / 128;
          else v = Math.sin(x / 24 + Date.now() / 500) * (isPlaying ? 0.5 : 0.12);
          const y = H / 2 + v * H * 0.42;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      } else if (mode === "spectrum") {
        let data: Uint8Array<ArrayBuffer> | null = null;
        try {
          if (an) {
            data = new Uint8Array(an.frequencyBinCount);
            an.getByteFrequencyData(data);
          }
        } catch {
          data = null;
        }
        const bars = 48;
        const bw = W / bars;
        for (let i = 0; i < bars; i++) {
          let v: number;
          if (data) v = data[Math.floor((i / bars) * data.length * 0.75)] / 255;
          else {
            v = isPlaying
              ? 0.25 + 0.35 * Math.abs(Math.sin(Date.now() / 400 + i * 0.55))
              : 0.06;
          }
          const bh = Math.max(2 * dpr, v * H * 0.94);
          const x = i * bw + bw * 0.22;
          const grad = ctx.createLinearGradient(0, H, 0, H - bh);
          grad.addColorStop(0, "rgba(190,242,100,0.25)");
          grad.addColorStop(0.6, "rgba(190,242,100,0.9)");
          grad.addColorStop(1, "rgba(167,139,250,0.95)");
          ctx.fillStyle = grad;
          const r = Math.min(bw * 0.28, 6 * dpr);
          const y = H - bh;
          ctx.beginPath();
          if (typeof ctx.roundRect === "function") {
            ctx.roundRect(x, y, bw * 0.56, bh, r);
          } else {
            ctx.rect(x, y, bw * 0.56, bh);
          }
          ctx.fill();
        }
      } else if (mode === "orbital") {
        // circular readout — also used behind artwork in the full player
        let data: Uint8Array<ArrayBuffer> | null = null;
        try {
          if (an) {
            data = new Uint8Array(an.frequencyBinCount);
            an.getByteFrequencyData(data);
          }
        } catch {
          data = null;
        }
        const cx = W / 2;
        const cy = H / 2;
        const R = Math.min(W, H) / 2 - 6 * dpr;
        const bars = 64;
        for (let i = 0; i < bars; i++) {
          const a = (i / bars) * Math.PI * 2 - Math.PI / 2;
          let v: number;
          if (data) v = data[Math.floor((i / bars) * data.length * 0.7)] / 255;
          else v = isPlaying ? 0.3 + 0.3 * Math.abs(Math.sin(Date.now() / 450 + i * 0.4)) : 0.08;
          const len = 2 * dpr + v * H * 0.28;
          ctx.strokeStyle = i % 2 ? "rgba(190,242,100,0.85)" : "rgba(167,139,250,0.85)";
          ctx.lineWidth = 2.4 * dpr;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R);
          ctx.lineTo(cx + Math.cos(a) * (R + len), cy + Math.sin(a) * (R + len));
          ctx.stroke();
        }
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", fit);
    };
  }, [mode, height, isPlaying]);

  if (mode === "minimal") return null;
  return (
    <canvas
      ref={ref}
      style={{ height }}
      className="w-full"
      aria-hidden
      role="presentation"
    />
  );
}
