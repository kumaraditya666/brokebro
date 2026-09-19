"use client";

/**
 * Cursor rig: the cursor as a damped physical source (position, velocity,
 * speed) shared without React re-renders. Consumers read it inside rAF
 * handlers or mutate DOM/three objects directly. Testable pure step math.
 */

export interface CursorVec {
  x: number; // -1..1 NDC-ish
  y: number;
  vx: number;
  vy: number;
  speed: number; // px/s smoothed
  down: boolean;
  inside: boolean;
}

export function stepCursor(
  prev: CursorVec,
  target: { x: number; y: number },
  dt: number,
  lambda = 10
): CursorVec {
  const k = 1 - Math.exp(-lambda * Math.min(dt, 0.05));
  const x = prev.x + (target.x - prev.x) * k;
  const y = prev.y + (target.y - prev.y) * k;
  const ivx = dt > 0 ? (x - prev.x) / dt : 0;
  const ivy = dt > 0 ? (y - prev.y) / dt : 0;
  const vk = 1 - Math.exp(-8 * Math.min(dt, 0.05));
  const vx = prev.vx + (ivx - prev.vx) * vk;
  const vy = prev.vy + (ivy - prev.vy) * vk;
  return { ...prev, x, y, vx, vy, speed: Math.hypot(vx, vy) };
}

const state: CursorVec = { x: 0, y: 0, vx: 0, vy: 0, speed: 0, down: false, inside: false };
const target = { x: 0, y: 0 };
let last = 0;
let running = false;

function loop(t: number) {
  if (!running) return;
  const dt = last ? (t - last) / 1000 : 0.016;
  last = t;
  const next = stepCursor(state, target, dt);
  state.x = next.x;
  state.y = next.y;
  state.vx = next.vx;
  state.vy = next.vy;
  state.speed = next.speed;
  requestAnimationFrame(loop);
}

/** Attach global listeners once (client only). Safe to call repeatedly. */
export function initCursor(): void {
  if (typeof window === "undefined" || running) return;
  running = true;
  window.addEventListener(
    "pointermove",
    (e) => {
      target.x = (e.clientX / window.innerWidth - 0.5) * 2;
      target.y = -((e.clientY / window.innerHeight - 0.5) * 2);
      state.inside = true;
    },
    { passive: true }
  );
  window.addEventListener("pointerdown", () => {
    state.down = true;
  });
  window.addEventListener("pointerup", () => {
    state.down = false;
  });
  document.documentElement.addEventListener("pointerleave", () => {
    state.inside = false;
  });
  requestAnimationFrame(loop);
}

/** Live damped cursor state (mutated in place — never triggers renders). */
export function readCursor(): CursorVec {
  return state;
}

export function cursorReducedMotion(): boolean {
  if (typeof window === "undefined") return true;
  return (
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ||
    window.matchMedia?.("(pointer: coarse)").matches
  );
}
