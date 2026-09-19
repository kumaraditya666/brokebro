/**
 * FRONTEND — preview DSP + WAV encoding.
 *
 * Honest labeling: this is a lightweight IN-BROWSER preview simulation
 * (EQ, compression, saturation, generated-impulse reverb, tempo delay,
 * stereo widening) so users can AUDITION the direction of the AI mix.
 * Release-grade rendering (pitch correction, studio DSP, loudness
 * normalization) runs on the backend DSP workers.
 *
 * What this file does NOT do: pitch correction / autotune. True retuning
 * needs a DSP worker (RubberBand/World-class). The preview moves every
 * other parameter so Before/After is clearly audible.
 */
import type { MixChain } from "@/types/vocalforge";

/** Encode mono or stereo float samples as 16-bit PCM WAV. */
export function encodeWav(samples: Float32Array[] | Float32Array, sampleRate: number): Blob {
  const chans = Array.isArray(samples) ? samples : [samples];
  const n = chans[0].length;
  const numCh = chans.length;
  const dataBytes = n * numCh * 2;
  const buffer = new ArrayBuffer(44 + dataBytes);
  const v = new DataView(buffer);
  const wstr = (o: number, s: string) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  wstr(0, "RIFF"); v.setUint32(4, 36 + dataBytes, true); wstr(8, "WAVE");
  wstr(12, "fmt "); v.setUint32(16, 16, true); v.setUint16(20, 1, true);
  v.setUint16(22, numCh, true); v.setUint32(24, sampleRate, true);
  v.setUint32(28, sampleRate * numCh * 2, true); v.setUint16(32, numCh * 2, true); v.setUint16(34, 16, true);
  wstr(36, "data"); v.setUint32(40, dataBytes, true);
  let o = 44;
  for (let i = 0; i < n; i++) {
    for (let c = 0; c < numCh; c++) {
      const s = Math.max(-1, Math.min(1, chans[c][i] || 0));
      v.setInt16(o, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      o += 2;
    }
  }
  return new Blob([buffer], { type: "audio/wav" });
}

/** Back-compat mono wrapper. */
export function encodeWavPCM16(samples: Float32Array, sampleRate: number): Blob {
  return encodeWav([samples], sampleRate);
}

function dbToGain(db: number) {
  return Math.pow(10, db / 20);
}

/** Generate a stereo reverb impulse (decaying noise) for the convolver. */
function makeImpulse(ctx: OfflineAudioContext, decaySec: number, sr: number): AudioBuffer {
  const len = Math.max(sr * 0.3, Math.min(sr * 4, Math.floor(sr * decaySec)));
  const ir = ctx.createBuffer(2, len, sr);
  for (let c = 0; c < 2; c++) {
    const d = ir.getChannelData(c);
    for (let i = 0; i < len; i++) {
      const t = i / len;
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, 2.2) * 0.6;
    }
  }
  return ir;
}

/** Soft-clip saturation curve scaled by amount 0..100. */
function driveCurve(amount: number): Float32Array<ArrayBuffer> {
  const k = 1 + (amount / 100) * 24;
  const n = 256;
  const curve = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * 2 - 1;
    curve[i] = Math.tanh(k * x) / Math.tanh(k);
  }
  return curve;
}

/**
 * Render an audible simulated "processed" version of a vocal file.
 * seconds=0 → whole file (capped at 150s for browser safety).
 */
export async function renderPreviewMix(
  file: File,
  chain: MixChain,
  seconds = 0
): Promise<{ wav: Blob; sampleRate: number }> {
  const Offline = window.OfflineAudioContext;
  const raw = await file.arrayBuffer();
  const Tmp = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const tmp = new Tmp();
  const decoded = await tmp.decodeAudioData(raw.slice(0)).catch(() => null);
  void tmp.close().catch(() => undefined);
  if (!decoded || !Offline) throw new Error("Preview render is not supported in this browser.");

  const sr = 44100;
  const cap = seconds > 0 ? Math.floor(sr * seconds) : sr * 150;
  const len = Math.max(sr, Math.min(decoded.length, cap));
  const ctx = new Offline(2, len, sr);

  // source (mix down to mono first for a stable center image)
  const sliced = ctx.createBuffer(1, len, sr);
  const m0 = sliced.getChannelData(0);
  const c0 = decoded.getChannelData(0);
  const hasStereo = decoded.numberOfChannels > 1;
  const c1 = hasStereo ? decoded.getChannelData(1) : null;
  for (let i = 0; i < len; i++) {
    const a = c0[i] ?? 0;
    m0[i] = c1 ? (a + (c1[i] ?? 0)) * 0.5 : a;
  }
  const src = ctx.createBufferSource();
  src.buffer = sliced;

  // --- tone: low-cut → presence → air → low-mid body ---
  const lowcut = ctx.createBiquadFilter();
  lowcut.type = "highpass"; lowcut.frequency.value = Math.min(800, Math.max(20, chain.eq.lowCutHz));
  const lowmid = ctx.createBiquadFilter();
  lowmid.type = "peaking"; lowmid.frequency.value = 300;
  lowmid.gain.value = Math.max(-6, Math.min(6, chain.eq.lowMidDb));
  const presence = ctx.createBiquadFilter();
  presence.type = "peaking"; presence.frequency.value = 4500; presence.Q.value = 0.9;
  presence.gain.value = Math.max(-8, Math.min(8, chain.eq.presenceDb + 1.5)); // +1.5 base lift so EQ moves are obvious
  const air = ctx.createBiquadFilter();
  air.type = "highshelf"; air.frequency.value = 12000;
  air.gain.value = Math.max(-8, Math.min(8, chain.eq.airDb));

  // --- saturation (audible grit/warmth) ---
  const shaper = ctx.createWaveShaper();
  shaper.curve = driveCurve(chain.saturation.amount);
  const satWet = ctx.createGain();
  satWet.gain.value = chain.saturation.mix / 100;
  const satDry = ctx.createGain();
  satDry.gain.value = 1 - chain.saturation.mix / 100;

  // --- compression + makeup ---
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = chain.compression.thresholdDb;
  comp.knee.value = 12;
  comp.ratio.value = chain.compression.ratio;
  comp.attack.value = Math.max(0.001, chain.compression.attackMs / 1000);
  comp.release.value = Math.max(0.02, chain.compression.releaseMs / 1000);
  const makeup = ctx.createGain();
  makeup.gain.value = dbToGain(chain.compression.makeupDb + chain.master.vocalLevelDb);

  // telephone character: band-limit hard (narrow radio voice)
  let chainOut: AudioNode = makeup;
  if (chain.eq.toneProfile === "Telephone") {
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass"; bp.frequency.value = 1400; bp.Q.value = 0.6;
    chainOut.connect(bp);
    chainOut = bp;
  }

  // --- stereo width: dry center + micro-delayed side copy ---
  const merger = ctx.createChannelMerger(2);
  const gL = ctx.createGain(); const gR = ctx.createGain();
  const widthT = chain.stereo.width / 100;
  const spread = ctx.createDelay(0.05);
  spread.delayTime.value = 0.004 + widthT * 0.014; // wider = bigger L/R offset
  const sideGain = ctx.createGain();
  sideGain.gain.value = 0.25 + widthT * 0.55;
  chainOut.connect(gL); gL.connect(merger, 0, 0);
  chainOut.connect(spread); spread.connect(sideGain); sideGain.connect(gR); gR.connect(merger, 0, 1);
  // keep some center in the right channel so mono doesn't collapse
  const centerR = ctx.createGain(); centerR.gain.value = 1 - widthT * 0.45;
  chainOut.connect(centerR); centerR.connect(merger, 0, 1);

  const master = ctx.createGain();
  master.gain.value = 0.9;
  merger.connect(master); master.connect(ctx.destination);

  // --- reverb send: pre-delay → convolver (REAL audible space) ---
  const verbLevel = chain.reverb.mix / 100;
  if (verbLevel > 0.005) {
    const pre = ctx.createDelay(0.3);
    pre.delayTime.value = Math.min(0.15, chain.reverb.preDelayMs / 1000);
    const conv = ctx.createConvolver();
    conv.buffer = makeImpulse(ctx, chain.reverb.decaySec, sr);
    const wet = ctx.createGain();
    wet.gain.value = verbLevel * 0.9;
    chainOut.connect(pre); pre.connect(conv); conv.connect(wet); wet.connect(master);
  }

  // --- tempo delay send with feedback ---
  const delayLevel = chain.delay.mix / 100;
  if (delayLevel > 0.005) {
    const d = ctx.createDelay(2);
    d.delayTime.value = Math.min(1.5, Math.max(0.03, chain.delay.timeMs / 1000));
    const fb = ctx.createGain();
    fb.gain.value = Math.min(0.65, chain.delay.feedback / 100);
    const wet = ctx.createGain();
    wet.gain.value = delayLevel * 0.8;
    chainOut.connect(d); d.connect(fb); fb.connect(d); d.connect(wet); wet.connect(master);
  }

  // wire the front of the chain
  src.connect(lowcut); lowcut.connect(lowmid); lowmid.connect(presence); presence.connect(air);
  air.connect(satDry); satDry.connect(comp);
  air.connect(shaper); shaper.connect(satWet); satWet.connect(comp);
  comp.connect(makeup);

  src.start(0);
  const out = await ctx.startRendering();
  return { wav: encodeWav([out.getChannelData(0), out.getChannelData(1)], sr), sampleRate: sr };
}

/** Generate a simple sine-based placeholder stem when no file exists. */
export function placeholderTone(seconds = 8, freq = 220): Blob {
  const sr = 44100;
  const n = sr * seconds;
  const data = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / sr;
    data[i] = 0.25 * Math.sin(2 * Math.PI * freq * t) * Math.exp(-t * 0.08);
  }
  return encodeWav([data], sr);
}
