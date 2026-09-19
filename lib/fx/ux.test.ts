import { describe, expect, it } from "vitest";
import { phaseForProgress, explodeForPhase } from "@/lib/fx/journey";
import { stepCursor } from "@/components/fx/cursor";

describe("scroll journey math", () => {
  it("maps progress to four world states", () => {
    expect(phaseForProgress(0)).toBe(0);
    expect(phaseForProgress(0.29)).toBe(0);
    expect(phaseForProgress(0.3)).toBe(1);
    expect(phaseForProgress(0.54)).toBe(1);
    expect(phaseForProgress(0.55)).toBe(2);
    expect(phaseForProgress(0.79)).toBe(2);
    expect(phaseForProgress(0.8)).toBe(3);
    expect(phaseForProgress(1)).toBe(3);
  });
  it("explodes only mid-journey, bounded 0..1", () => {
    expect(explodeForPhase(0)).toBe(0);
    expect(explodeForPhase(3)).toBe(0);
    const e = explodeForPhase(1);
    expect(e).toBeGreaterThan(0);
    expect(e).toBeLessThanOrEqual(1);
    expect(explodeForPhase(2)).toBe(1);
  });
});

describe("cursor rig math", () => {
  it("converges toward the target without snapping", () => {
    const start = { x: 0, y: 0, vx: 0, vy: 0, speed: 0, down: false, inside: true };
    const s1 = stepCursor(start, { x: 1, y: 0 }, 0.016);
    expect(s1.x).toBeGreaterThan(0);
    expect(s1.x).toBeLessThan(1); // damped, not snapped
    let s = s1;
    for (let i = 0; i < 200; i++) s = stepCursor(s, { x: 1, y: 0 }, 0.016);
    expect(s.x).toBeCloseTo(1, 2);
    expect(Math.abs(s.vx)).toBeLessThan(0.05); // settles
  });
  it("tracks velocity from motion", () => {
    const a = { x: 0, y: 0, vx: 0, vy: 0, speed: 0, down: false, inside: true };
    const b = stepCursor(a, { x: 0.5, y: 0 }, 0.016);
    expect(b.speed).toBeGreaterThan(0);
  });
});
