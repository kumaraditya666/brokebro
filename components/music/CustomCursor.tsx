// BROKE MUSIC — custom cursor: soft glowing dot + trailing blob + magnetic
// buttons + 3D tilt cards. Auto-disabled on touch, low-power, reduced-motion.
"use client";

import { useEffect } from "react";

function shouldDisable(): boolean {
  if (typeof window === "undefined") return true;
  if (window.matchMedia("(pointer: coarse)").matches) return true;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return true;
  try {
    const cores = navigator.hardwareConcurrency ?? 8;
    const mem = (navigator as unknown as { deviceMemory?: number }).deviceMemory ?? 8;
    if (cores <= 4 && mem <= 4) return true;
    if ((navigator as unknown as { connection?: { saveData?: boolean } }).connection?.saveData) return true;
  } catch {
    /* ignore */
  }
  return false;
}

export function CustomCursor() {
  useEffect(() => {
    if (shouldDisable()) return;
    const dot = document.createElement("div");
    const blob = document.createElement("div");
    dot.id = "bm-cursor-dot";
    blob.id = "bm-cursor-blob";
    document.body.appendChild(dot);
    document.body.appendChild(blob);
    document.documentElement.classList.add("bm-cursor-on");

    let mx = -100;
    let my = -100;
    let bx = -100;
    let by = -100;
    let raf = 0;
    let down = false;

    const onMove = (e: PointerEvent) => {
      mx = e.clientX;
      my = e.clientY;
      // magnetic pull on nearby [data-magnetic]
      const el = (e.target as HTMLElement | null)?.closest?.("[data-magnetic]") as HTMLElement | null;
      document.querySelectorAll("[data-magnetic].bm-mag").forEach((n) => {
        if (n !== el) (n as HTMLElement).style.transform = "";
        n.classList.remove("bm-mag");
      });
      if (el) {
        const r = el.getBoundingClientRect();
        const dx = mx - (r.left + r.width / 2);
        const dy = my - (r.top + r.height / 2);
        el.style.transform = `translate(${dx * 0.12}px, ${dy * 0.12}px) scale(1.04)`;
        el.classList.add("bm-mag");
      }
    };
    const onDown = () => {
      down = true;
      dot.style.transform = "translate(-50%,-50%) scale(0.7)";
    };
    const onUp = () => {
      down = false;
      dot.style.transform = "translate(-50%,-50%) scale(1)";
    };
    const loop = () => {
      bx += (mx - bx) * 0.16;
      by += (my - by) * 0.16;
      dot.style.left = `${mx}px`;
      dot.style.top = `${my}px`;
      blob.style.left = `${bx}px`;
      blob.style.top = `${by}px`;
      // hover grow
      const hov = document.elementFromPoint(mx, my)?.closest?.("a,button,[data-tilt]");
      dot.style.opacity = hov ? "1" : "0.85";
      blob.style.transform = `translate(-50%,-50%) scale(${hov ? 1.6 : 1})`;
      raf = requestAnimationFrame(loop);
    };
    // subtle 3D tilt for cards
    const onTilt = (e: PointerEvent) => {
      const card = (e.target as HTMLElement | null)?.closest?.("[data-tilt]") as HTMLElement | null;
      document.querySelectorAll("[data-tilt].bm-tilting").forEach((n) => {
        if (n !== card) {
          (n as HTMLElement).style.transform = "";
          n.classList.remove("bm-tilting");
        }
      });
      if (!card) return;
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = `perspective(800px) rotateY(${px * 10}deg) rotateX(${-py * 10}deg) translateZ(4px)`;
      card.classList.add("bm-tilting");
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointermove", onTilt, { passive: true });
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    raf = requestAnimationFrame(loop);
    void down;
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointermove", onTilt);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      dot.remove();
      blob.remove();
      document.documentElement.classList.remove("bm-cursor-on");
    };
  }, []);
  return null;
}
