"use client";
import { useEffect, useState } from "react";

/**
 * False during SSR + the very first client render (which must match the server
 * HTML exactly), true right after. Gate ANY browser-only first render on this
 * to make hydration mismatches impossible.
 */
export function useMounted() {
  const [m, setM] = useState(false);
  useEffect(() => {
    setM(true);
  }, []);
  return m;
}
