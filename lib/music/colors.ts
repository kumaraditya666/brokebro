// Artwork → dynamic accent colors. CORS-safe: falls back to a hash gradient.

const cache = new Map<string, [string, string, string]>();

function hashHue(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h % 360;
}

export function fallbackColors(seed: string): [string, string, string] {
  const h = hashHue(seed || "broke");
  return [`hsl(${h} 85% 60%)`, `hsl(${(h + 50) % 360} 80% 55%)`, `hsl(${(h + 110) % 360} 75% 45%)`];
}

function rgb(c: [number, number, number]): string {
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}

export async function extractArtworkColors(url?: string, seed = ""): Promise<[string, string, string]> {
  if (!url) return fallbackColors(seed);
  const hit = cache.get(url);
  if (hit) return hit;
  const fb = fallbackColors(url + seed);
  try {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.decoding = "async";
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("img"));
      img.src = url;
      setTimeout(() => reject(new Error("timeout")), 4000);
    });
    const canvas = document.createElement("canvas");
    canvas.width = 48;
    canvas.height = 48;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return fb;
    ctx.drawImage(img, 0, 0, 48, 48);
    const d = ctx.getImageData(0, 0, 48, 48).data;
    // sample 3 zones: top-left, center, bottom-right for a lively gradient
    const zones: [number, number, number][] = [
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
    ];
    const counts = [0, 0, 0];
    for (let y = 0; y < 48; y++) {
      for (let x = 0; x < 48; x++) {
        const i = (y * 48 + x) * 4;
        const a = d[i + 3];
        if (a < 128) continue;
        const z = x + y < 48 ? 0 : x > 30 && y > 30 ? 2 : 1;
        zones[z][0] += d[i];
        zones[z][1] += d[i + 1];
        zones[z][2] += d[i + 2];
        counts[z]++;
      }
    }
    const out = zones.map((z, i) => {
      if (!counts[i]) return null;
      const c: [number, number, number] = [
        Math.round(z[0] / counts[i]),
        Math.round(z[1] / counts[i]),
        Math.round(z[2] / counts[i]),
      ];
      // boost saturation a touch so the glow feels alive
      return rgb(c);
    });
    const res: [string, string, string] = [(out[0] ?? fb[0]) as string, (out[1] ?? fb[1]) as string, (out[2] ?? fb[2]) as string];
    cache.set(url, res);
    return res;
  } catch {
    cache.set(url, fb);
    return fb;
  }
}

export function gradientCss(colors: [string, string, string], alpha = 0.55): string {
  return `radial-gradient(900px 500px at 15% 10%, ${colors[0]}33, transparent 60%), radial-gradient(800px 500px at 85% 20%, ${colors[1]}2e, transparent 60%), radial-gradient(700px 600px at 50% 100%, ${colors[2]}26, transparent 65%)`;
}
