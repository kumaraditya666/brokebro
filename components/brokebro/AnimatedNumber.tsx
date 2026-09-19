"use client";
import { useEffect, useRef, useState } from "react";

export function AnimatedNumber({ value, prefix = "", duration = 900 }: { value: number; prefix?: string; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const raf = useRef<number>(0);
  const from = useRef(0);
  useEffect(() => {
    const start = performance.now();
    const to = value;
    const f = from.current;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplay(to);
      from.current = to;
      return;
    }
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(f + (to - f) * eased);
      if (p < 1) raf.current = requestAnimationFrame(tick);
      else from.current = to;
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [value, duration]);
  const rounded = Math.abs(display) < 1000 && display % 1 !== 0 ? display.toFixed(2) : Math.round(display).toLocaleString("en-IN");
  return <span>{prefix}{rounded}</span>;
}
