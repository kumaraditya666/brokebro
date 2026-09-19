"use client";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Flame, Copy, Share2 } from "lucide-react";
import CursorGlow from "@/components/roasted/CursorGlow";
import Navbar from "@/components/roasted/Navbar";
import Footer from "@/components/roasted/Footer";
import ShareCard from "@/components/roasted/ShareCard";
import { DEMO_ROASTS } from "@/lib/roasted/data";
import { buildShareText } from "@/lib/roasted/engine";
import { shareOrCopy } from "@/lib/roasted/utils";

export default function RoastIdClient() {
  const { id } = useParams() as { id: string };
  const q = useSearchParams();
  const text = q.get("t") || DEMO_ROASTS[id.length % DEMO_ROASTS.length];
  return (
    <main className="relative min-h-screen bg-ink">
      <CursorGlow />
      <Navbar />
      <div className="relative z-10 mx-auto max-w-2xl px-4 pt-28 sm:px-6">
        <p className="text-center text-xs font-black tracking-[0.25em] text-orange-400">YOU GOT ROASTED 💀 #{String(id).slice(0, 8)}</p>
        <h1 className="font-display mt-2 text-center text-3xl font-black sm:text-5xl">
          Bhai, evidence <span className="fire-text">mil gaya 😂</span>
        </h1>
        <div className="glass glow-border mt-8 rounded-3xl p-6 text-center sm:p-8">
          <Flame className="mx-auto h-10 w-10 text-orange-500" />
          <p className="font-desi mt-4 text-2xl font-black leading-snug text-orange-50 sm:text-3xl">“{text}”</p>
          <p className="mt-2 text-xs text-white/45">Dosti gayi, meme bach gaya • ROASTED INDIA 🇮🇳</p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <button
              onClick={async () => {
                await shareOrCopy(buildShareText(text));
                alert("Copied! 📋");
              }}
              className="pressable flex items-center gap-1 rounded-full border border-white/15 px-4 py-2.5 text-sm font-bold"
            >
              <Copy className="h-4 w-4" /> Copy
            </button>
            <button
              onClick={async () => {
                await shareOrCopy(buildShareText(text));
                alert("Share sheet khul gaya 📱");
              }}
              className="pressable flex items-center gap-1 rounded-full border border-white/15 px-4 py-2.5 text-sm font-bold"
            >
              <Share2 className="h-4 w-4" /> Share
            </button>
            <Link href="/studio" className="pressable rounded-full bg-gradient-to-r from-amber-400 via-orange-500 to-pink-600 px-6 py-2.5 text-sm font-black text-black shadow-glow">
              ROAST THEM BACK 🔥
            </Link>
          </div>
        </div>
        <div className="mt-4">
          <ShareCard text={text} tag="FRIEND ROAST" />
        </div>
        <div className="mt-6 rounded-3xl border border-white/10 bg-white/[0.03] p-6 text-center">
          <p className="font-display text-2xl font-black">Think you can survive one?</p>
          <Link href="/studio" className="pressable mt-3 inline-block rounded-full bg-white px-8 py-3.5 font-black text-black">
            ROAST ME 🔥
          </Link>
          <p className="mt-2 text-xs text-white/40">No auto-spam. Tu chahe tabhi roast banega. 💛</p>
        </div>
        <div className="h-12" />
      </div>
      <Footer />
    </main>
  );
}
