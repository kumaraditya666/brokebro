// BROKE MUSIC — unit tests for pure helpers (no DOM, no network).
import { describe, expect, it } from "vitest";
import { formatTime, parseFileName, timeAgo } from "./format";
import { activeLyricIndex, parseLrc } from "./lyrics";
import { DEMO_CATALOG, demoByGenre, demoSearch } from "./catalog";
import { EQ_PRESETS } from "@/types/music";

describe("format", () => {
  it("formats seconds", () => {
    expect(formatTime(0)).toBe("0:00");
    expect(formatTime(65)).toBe("1:05");
    expect(formatTime(undefined)).toBe("0:00");
    expect(formatTime(NaN)).toBe("0:00");
  });
  it("parses Artist - Title filenames", () => {
    expect(parseFileName("Night Bus - Concrete Bloom.mp3")).toEqual({ artist: "Night Bus", title: "Concrete Bloom" });
    expect(parseFileName("lonely_track.flac")).toEqual({ artist: "Local files", title: "lonely track" });
  });
  it("timeAgo buckets", () => {
    expect(timeAgo(Date.now())).toBe("just now");
    expect(timeAgo(Date.now() - 5 * 60000)).toBe("5m ago");
  });
});

describe("lyrics", () => {
  it("parses LRC lines in order", () => {
    const lines = parseLrc("[00:10.00] hello\n[00:05.00] intro\n[bad] nope");
    expect(lines.map((l) => l.text)).toEqual(["intro", "hello"]);
    expect(activeLyricIndex(lines, 7)).toBe(0);
    expect(activeLyricIndex(lines, 12)).toBe(1);
    expect(activeLyricIndex([], 5)).toBe(-1);
  });
});

describe("catalog", () => {
  it("every demo track is explicitly playable with a stream", () => {
    expect(DEMO_CATALOG.length).toBeGreaterThan(10);
    for (const t of DEMO_CATALOG) {
      expect(t.playable).toBe(true);
      expect(t.streamUrl).toMatch(/^https:\/\//);
      expect(t.source).toBeTruthy();
    }
  });
  it("search is case-insensitive across fields", () => {
    expect(demoSearch("NEON").length).toBeGreaterThan(0);
    expect(demoSearch("zzz-no-match")).toEqual([]);
    expect(demoSearch("")).toEqual([]);
  });
  it("genre shelves resolve", () => {
    expect(demoByGenre("Lo-fi", 6).length).toBeGreaterThan(0);
  });
});

describe("eq presets", () => {
  it("all presets have 6 bands", () => {
    for (const bands of Object.values(EQ_PRESETS)) {
      expect(bands).toHaveLength(6);
    }
    expect(EQ_PRESETS.Flat).toEqual([0, 0, 0, 0, 0, 0]);
  });
});
