import { describe, expect, it } from "vitest";
import { pendingCount } from "./pwa";
import { shouldShowInstall } from "./pwa-gate";
import { fixRupeeThree } from "./upi-extract";

describe("pwa helpers", () => {
  it("pendingCount = rows with local (non-UUID) ids = outbox depth", () => {
    expect(
      pendingCount(
        [{ id: "txn_abc" }, { id: "123e4567-e89b-12d3-a456-426614174000" }],
        [{ id: "bud_x" }],
        []
      )
    ).toBe(2);
    expect(pendingCount([], [], [])).toBe(0);
  });

  it("fixRupeeThree only fires on bare -3XX (dash, no symbol/comma)", () => {
    expect(fixRupeeThree("320")).toEqual({ value: 20, fixed: true });
    expect(fixRupeeThree("315")).toEqual({ value: 15, fixed: true });
    expect(fixRupeeThree("3200")).toEqual({ value: 3200, fixed: false }); // 4-digit: unknowable
    expect(fixRupeeThree("250")).toEqual({ value: 250, fixed: false }); // no leading 3
    expect(fixRupeeThree("99")).toEqual({ value: 99, fixed: false });
  });

  it("install prompt gating: engaged, not installed, not recently dismissed", () => {
    const base = { standalone: false, dismissedAt: null, visits: 5, txns: 0, promptable: true };
    expect(shouldShowInstall(base)).toBe(true);
    expect(shouldShowInstall({ ...base, standalone: true })).toBe(false);
    expect(shouldShowInstall({ ...base, visits: 0, txns: 0 })).toBe(false); // lurker
    expect(shouldShowInstall({ ...base, visits: 0, txns: 4 })).toBe(true); // power logger
    expect(shouldShowInstall({ ...base, dismissedAt: Date.now() })).toBe(false); // snoozed 30d
    expect(shouldShowInstall({ ...base, dismissedAt: Date.now() - 31 * 864e5 })).toBe(true);
    expect(shouldShowInstall({ ...base, promptable: false, ios: false })).toBe(false);
    expect(shouldShowInstall({ ...base, promptable: false, ios: true })).toBe(true); // iOS guide
  });
});
