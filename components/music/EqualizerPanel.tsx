// BROKE MUSIC — client-side equalizer (Web Audio biquads). Presets + custom.
"use client";

import type { CSSProperties } from "react";
import { EQ_FREQS, EQ_PRESETS } from "@/types/music";
import { applyEq } from "@/lib/music/audioEngine";
import { useMusicLibrary } from "@/store/useMusicLibrary";

export function EqualizerPanel() {
  const eq = useMusicLibrary((s) => s.settings.eq);
  const updateSettings = useMusicLibrary((s) => s.updateSettings);

  const setBand = (i: number, v: number) => {
    const bands = [...eq.bands];
    bands[i] = v;
    updateSettings({ eq: { preset: "Custom", bands } });
    applyEq(bands);
  };

  const setPreset = (name: string) => {
    const bands = [...(EQ_PRESETS[name] ?? EQ_PRESETS.Flat)];
    updateSettings({ eq: { preset: name, bands } });
    applyEq(bands);
  };

  return (
    <div className="rounded-3xl border border-white/8 bg-white/[0.02] p-5">
      <div className="mb-4 flex flex-wrap gap-2">
        {Object.keys(EQ_PRESETS).map((name) => (
          <button
            key={name}
            onClick={() => setPreset(name)}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-bold transition active:scale-95 ${
              eq.preset === name
                ? "border-lime-300/50 bg-lime-300/15 text-lime-200"
                : "border-white/10 bg-white/5 text-white/55 hover:text-white"
            }`}
          >
            {name}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-6 gap-2 sm:gap-3">
        {EQ_FREQS.map((f, i) => (
          <div key={f} className="flex flex-col items-center gap-2">
            <span className="text-[11px] font-bold text-lime-200">{eq.bands[i] > 0 ? `+${eq.bands[i]}` : eq.bands[i]}dB</span>
            <input
              type="range"
              min={-10}
              max={10}
              step={1}
              value={eq.bands[i]}
              onChange={(e) => setBand(i, Number(e.target.value))}
              aria-label={`${f} Hz band`}
              className="broke-eq h-32 w-8 cursor-pointer appearance-none rounded-full bg-white/8"
              style={{ writingMode: "vertical-lr", direction: "rtl" } as CSSProperties}
            />
            <span className="text-[10px] font-bold text-white/40">{f >= 1000 ? `${f / 1000}k` : f}</span>
          </div>
        ))}
      </div>
      <p className="mt-4 text-[11px] leading-relaxed text-white/35">
        Client-side processing only — these filters shape sound on your device. Nothing is uploaded or “enhanced” on a server.
      </p>
    </div>
  );
}
