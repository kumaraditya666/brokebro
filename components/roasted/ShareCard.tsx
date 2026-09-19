"use client";
import { useRef } from "react";
import { downloadCard, shareOrCopy } from "@/lib/roasted/utils";
import { Copy, Download, Share2 } from "lucide-react";

export default function ShareCard({
  text,
  tag = "DESI ROAST",
  compact = false,
}: {
  text: string;
  tag?: string;
  compact?: boolean;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  const draw = (): HTMLCanvasElement | null => {
    const canvas = ref.current;
    if (!canvas) return null;
    const W = 1080;
    const H = compact ? 1080 : 1350;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    // bg
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, "#140f0c");
    g.addColorStop(0.5, "#0a0706");
    g.addColorStop(1, "#1a0e08");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    // glow blobs
    const blob = (x: number, y: number, r: number, c: string) => {
      const rg = ctx.createRadialGradient(x, y, 0, x, y, r);
      rg.addColorStop(0, c);
      rg.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = rg;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    };
    blob(200, 220, 420, "rgba(255,107,26,0.28)");
    blob(900, 1000, 480, "rgba(255,46,147,0.20)");
    blob(880, 200, 320, "rgba(255,184,0,0.16)");
    // border
    ctx.strokeStyle = "rgba(255,107,26,0.55)";
    ctx.lineWidth = 6;
    const m = 36;
    ctx.beginPath();
    // @ts-ignore roundRect available in modern canvas
    if (ctx.roundRect) ctx.roundRect(m, m, W - m * 2, H - m * 2, 48);
    else ctx.rect(m, m, W - m * 2, H - m * 2);
    ctx.stroke();
    // header
    ctx.fillStyle = "#fff";
    ctx.font = "900 54px 'Space Grotesk', sans-serif";
    ctx.fillText("ROASTED 🇮🇳", 90, 170);
    ctx.fillStyle = "#FFB800";
    ctx.font = "700 30px sans-serif";
    ctx.fillText(tag, 90, 220);
    // body wrap
    ctx.fillStyle = "#FFF7ED";
    ctx.font = "700 62px 'Baloo 2', 'Space Grotesk', sans-serif";
    const words = text.split(" ");
    const lines: string[] = [];
    let line = "";
    const maxW = W - 180;
    words.forEach((w) => {
      const t = line ? line + " " + w : w;
      if (ctx.measureText(t).width > maxW && line) {
        lines.push(line);
        line = w;
      } else line = t;
    });
    if (line) lines.push(line);
    const sliced = lines.slice(0, 10);
    let y = 360;
    sliced.forEach((ln) => {
      ctx.fillText(ln, 90, y);
      y += 84;
    });
    // footer
    ctx.fillStyle = "rgba(255,255,255,0.65)";
    ctx.font = "600 30px sans-serif";
    ctx.fillText("Bhai, evidence mil gaya 😂 • roasted.india", 90, H - 110);
    ctx.fillStyle = "#FF6B1A";
    ctx.font = "900 34px sans-serif";
    ctx.fillText("ROAST ME 🔥", W - 330, H - 110);
    return canvas;
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/40">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
        <p className="text-xs font-bold tracking-widest text-white/60">SHARE CARD • WHATSAPP READY</p>
        <div className="flex gap-2">
          <button
            onClick={() => {
              const c = draw();
              if (c) downloadCard(c);
            }}
            className="pressable flex items-center gap-1 rounded-full border border-white/15 px-3 py-1.5 text-xs font-bold hover:border-orange-400"
          >
            <Download className="h-3.5 w-3.5" /> Download
          </button>
          <button
            onClick={async () => {
              const c = draw();
              const canFileShare =
                typeof navigator !== "undefined" &&
                "canShare" in navigator &&
                (() => {
                  try {
                    return (navigator as Navigator & { canShare?: (d?: object) => boolean }).canShare?.({
                      files: [new File(["x"], "t.png", { type: "image/png" })],
                    });
                  } catch {
                    return false;
                  }
                })();
              if (c && canFileShare) {
                try {
                  const blob = await new Promise<Blob | null>((res) => c.toBlob(res, "image/png"));
                  if (blob) {
                    await navigator.share({
                      files: [new File([blob], "roasted.png", { type: "image/png" })],
                      title: "ROASTED INDIA",
                    });
                    return;
                  }
                } catch {}
              }
              await shareOrCopy(text + "\n\n— via ROASTED INDIA 🇮🇳");
              alert("Copied! WhatsApp pe paste karke bhej de 😂");
            }}
            className="pressable flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-black hover:brightness-110"
          >
            <Share2 className="h-3.5 w-3.5" /> Share
          </button>
          <button
            onClick={async () => {
              await shareOrCopy(text);
              alert("Copied! 📋");
            }}
            className="pressable hidden rounded-full border border-white/15 px-3 py-1.5 text-xs font-bold sm:flex sm:items-center sm:gap-1"
          >
            <Copy className="h-3.5 w-3.5" /> Copy
          </button>
        </div>
      </div>
      <div className="p-4">
        <div className="rounded-xl border border-orange-500/30 bg-gradient-to-br from-orange-950/60 via-black to-pink-950/40 p-5">
          <p className="text-[11px] font-black tracking-[0.2em] text-amber-400">ROASTED 🇮🇳 • {tag}</p>
          <p className="font-desi mt-2 text-xl font-bold leading-snug text-orange-50 sm:text-2xl">“{text}”</p>
          <p className="mt-3 text-xs text-white/50">Bhai, evidence mil gaya 😂 • roasted.india</p>
        </div>
      </div>
      <canvas ref={ref} className="hidden" />
    </div>
  );
}
