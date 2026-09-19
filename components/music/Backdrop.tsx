// BROKE MUSIC — ambient backdrop: dynamic artwork gradient + floating
// particles (canvas) + film-grain (CSS). Cheap by default, honors
// reduced-motion / animations-off.
"use client";

import { useEffect, useRef } from "react";
import { gradientCss } from "@/lib/music/colors";
import { useMusicLibrary } from "@/store/useMusicLibrary";
import { usePlayer } from "./PlayerProvider";

export function Backdrop({ colors }: { colors: [string, string, string] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animations = useMusicLibrary((s) => s.settings.animations);
  const reduced = useMusicLibrary((s) => s.settings.reducedMotion);
  const { currentTrack } = usePlayer();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !animations || reduced) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    let w = 0;
    let h = 0;
    const resize = () => {
      w = canvas.width = Math.floor(window.innerWidth / 2);
      h = canvas.height = Math.floor(window.innerHeight / 2);
    };
    resize();
    window.addEventListener("resize", resize);
    const N = 42;
    const ps = Array.from({ length: N }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: 0.6 + Math.random() * 2.2,
      vx: (Math.random() - 0.5) * 0.0006,
      vy: -0.0002 - Math.random() * 0.0006,
      a: 0.12 + Math.random() * 0.4,
      hue: Math.random(),
    }));
    const tick = () => {
      ctx.clearRect(0, 0, w, h);
      for (const p of ps) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.y < -0.02) {
          p.y = 1.02;
          p.x = Math.random();
        }
        if (p.x < -0.02) p.x = 1.02;
        if (p.x > 1.02) p.x = -0.02;
        const tw = 0.6 + 0.4 * Math.sin(Date.now() / 900 + p.hue * 9);
        ctx.beginPath();
        ctx.arc(p.x * w, p.y * h, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.hue > 0.5 ? `rgba(190,242,100,${(p.a * tw).toFixed(3)})` : `rgba(167,139,250,${(p.a * tw).toFixed(3)})`;
        ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [animations, reduced, currentTrack?.id]);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#050505]">
      <div
        className="absolute inset-0 transition-[background] duration-1000"
        style={{ background: gradientCss(colors) }}
      />
      <div
        className="absolute -left-40 top-[-20%] h-[60vmax] w-[60vmax] rounded-full opacity-25 blur-[120px]"
        style={{ background: colors[0] }}
      />
      <div
        className="absolute -right-40 bottom-[-25%] h-[55vmax] w-[55vmax] rounded-full opacity-20 blur-[130px]"
        style={{ background: colors[1] }}
      />
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full opacity-70" />
      <div className="dot-grid absolute inset-0 opacity-[0.15]" />
    </div>
  );
}
