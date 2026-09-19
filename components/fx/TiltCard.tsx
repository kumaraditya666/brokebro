"use client";
import { useRef } from "react";
import type { ReactNode } from "react";
import { cursorReducedMotion } from "./cursor";

/** 3D tilt portal: perspective tilt toward cursor + moving specular glare. */
export default function TiltCard({
  children,
  className,
  max = 7,
}: {
  children: ReactNode;
  className?: string;
  max?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const glare = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={ref}
      className={className}
      style={{ perspective: "900px" }}
      onPointerMove={(e) => {
        const el = ref.current;
        if (!el || cursorReducedMotion()) return;
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = `rotateX(${(-py * max).toFixed(2)}deg) rotateY(${(px * max).toFixed(2)}deg)`;
        if (glare.current) {
          glare.current.style.opacity = "1";
          glare.current.style.background = `radial-gradient(circle at ${(px + 0.5) * 100}% ${(py + 0.5) * 100}%, rgba(34,211,238,0.14), transparent 60%)`;
        }
      }}
      onPointerLeave={() => {
        const el = ref.current;
        if (!el) return;
        el.style.transform = "";
        if (glare.current) glare.current.style.opacity = "0";
      }}
    >
      <div ref={glare} className="pointer-events-none absolute inset-0 z-10 rounded-[inherit] opacity-0 transition-opacity duration-300" />
      {children}
    </div>
  );
}
