/** Pure scroll-journey math (no DOM/React — unit tested). */

export function phaseForProgress(p: number): 0 | 1 | 2 | 3 {
  if (p < 0.3) return 0;
  if (p < 0.55) return 1;
  if (p < 0.8) return 2;
  return 3;
}

/** Assembly separation amount for a journey phase (0 = assembled). */
export function explodeForPhase(phase: number): number {
  if (phase >= 1 && phase < 3) return Math.min(1, (phase - 0.6) * 1.4);
  return 0;
}
