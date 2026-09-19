"use client";
import { useRef } from "react";
import type { ReactNode } from "react";
import { cursorReducedMotion } from "./cursor";

/** Magnetic wrapper: attracts toward cursor, springs back, compresses on press. */
export default function Magnetic({
  children,
  strength = 0.28,
  className,
}: {
  children: ReactNode;
  strength?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const raf = useRef(0);
  const off = useRef({ x: 0, y: 0 });
  const tgt = useRef({ x: 0, y: 0 });

  const tick = () => {
    const el = ref.current;
    if (!el) return;
    off.current.x += (tgt.current.x - off.current.x) * 0.18;
    off.current.y += (tgt.current.y - off.current.y) * 0.18;
    if (Math.abs(off.current.x) < 0.05 && Math.abs(off.current.y) < 0.05 && tgt.current.x === 0 && tgt.current.y === 0) {
      el.style.transform = "";
      return;
    }
    el.style.transform = `translate(${off.current.x.toFixed(2)}px, ${off.current.y.toFixed(2)}px)`;
    raf.current = requestAnimationFrame(tick);
  };
  const kick = () => {
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(tick);
  };

  return (
    <span
      ref={ref}
      className={className ?? "inline-block"}
      style={{ willChange: "transform" }}
      onPointerMove={(e) => {
        if (cursorReducedMotion()) return;
        const r = ref.current?.getBoundingClientRect();
        if (!r) return;
        tgt.current.x = (e.clientX - (r.left + r.width / 2)) * strength;
        tgt.current.y = (e.clientY - (r.top + r.height / 2)) * strength;
        kick();
      }}
      onPointerLeave={() => {
        tgt.current.x = 0;
        tgt.current.y = 0;
        kick();
      }}
    >
      {children}
    </span>
  );
}
