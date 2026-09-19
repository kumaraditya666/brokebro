"use client";
import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Download, Share2, Upload } from "lucide-react";
import CursorGlow from "@/components/roasted/CursorGlow";
import Navbar from "@/components/roasted/Navbar";
import Footer from "@/components/roasted/Footer";
import { generateGroupWrapped } from "@/lib/roasted/engine";
import { wrappedAI } from "@/lib/roasted/ai";
import { downloadText, shareOrCopy } from "@/lib/roasted/utils";
import type { WrappedStats } from "@/lib/roasted/types";

const SAMPLE = `Rahul: bhai kal se pakka gym 💪
Priya: 😂😂😂 seen
Aman: bhai trust me plan set hai
Rahul: biryani party kab?
Sneha: 5 min mein aa rahi ⏰
Aman: match dekh liya? six!
Rahul: bhai ek kaam tha...
Priya: maggi bana lo 2 baje 🍜
Aman: bhai 😭😭 kal exam hai
Sneha: chai break? 🍵
Rahul: proxy laga dena 🙋`;

export default function WrappedClient() {
  const [text, setText] = useState("");
  const [stats, setStats] = useState<WrappedStats | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const run = async (input: string) => {
    setBusy(true);
    try {
      const res = await wrappedAI(input || SAMPLE);
      setStats((res as { stats: WrappedStats }).stats ?? generateGroupWrapped(input || SAMPLE));
    } finally {
      setTimeout(() => setBusy(false), 600);
    }
  };

  const onFile = (f: File | undefined) => {
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      const t = String(reader.result ?? "").slice(0, 100000);
      setText(t);
      run(t);
    };
    reader.readAsText(f);
  };

  return (
    <main className="relative min-h-screen bg-ink">
      <CursorGlow />
      <Navbar />
      <div className="relative z-10 mx-auto max-w-5xl px-4 pt-24 sm:px-6">
        <p className="text-xs font-black tracking-[0.25em] text-amber-300">FRIEND GROUP WRAPPED 🎁</p>
        <h1 className="font-display mt-2 text-3xl font-black sm:text-6xl">
          YOUR DESI GROUP <span className="fire-text">WRAPPED 🇮🇳</span>
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-white/60">
          Upload your group chat export (.txt) ya paste karo. Stats tumhare actual data se calculate hote hain — playful only, facts nahi. 😂
        </p>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="glass rounded-3xl p-5">
            <div
              onClick={() => fileRef.current?.click()}
              className="cursor-pointer rounded-2xl border-2 border-dashed border-white/15 bg-black/40 p-6 text-center transition hover:border-orange-400"
            >
              <Upload className="mx-auto h-7 w-7 text-orange-400" />
              <p className="mt-2 font-bold">Upload chat export (.txt)</p>
              <p className="text-xs text-white/50">WhatsApp → Settings → Chats → Export</p>
              <input ref={fileRef} type="file" accept=".txt,text/plain" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, 100000))}
              rows={9}
              placeholder={SAMPLE}
              className="mt-3 w-full rounded-2xl border border-white/12 bg-black/50 p-3.5 font-mono text-xs outline-none placeholder:text-white/25 focus:border-orange-400"
            />
            <div className="mt-3 flex gap-2">
              <button onClick={() => run(text)} disabled={busy} className="pressable flex-1 rounded-full bg-gradient-to-r from-amber-400 via-orange-500 to-pink-600 py-3 font-black text-black shadow-glow disabled:opacity-60">
                {busy ? "Wrapping... 🎁" : "GENERATE WRAPPED 🎁"}
              </button>
              <button onClick={() => { setText(SAMPLE); run(SAMPLE); }} className="pressable rounded-full border border-white/15 px-5 py-3 text-sm font-bold">
                Demo
              </button>
            </div>
          </div>

          <div>
            {busy ? (
              <div className="grid gap-3">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="rounded-2xl border border-white/10 p-5"><div className="shimmer h-5 w-2/3 rounded" /><div className="shimmer mt-2 h-4 w-full rounded" /></div>
                ))}
              </div>
            ) : stats ? (
              <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="overflow-hidden rounded-3xl border border-orange-500/30 bg-gradient-to-b from-orange-950/50 via-black to-pink-950/30">
                <div className="border-b border-white/10 px-6 py-4 text-center">
                  <p className="text-[11px] font-black tracking-[0.25em] text-amber-300">ROASTED 🇮🇳 • GROUP WRAPPED</p>
                  <p className="font-display mt-1 text-4xl font-black">{stats.totalMessages.toLocaleString("en-IN")}</p>
                  <p className="text-xs text-white/55">messages • dosti unlimited</p>
                </div>
                <div className="grid grid-cols-2 gap-3 p-5">
                  {[
                    [`🔥 ${stats.bhaiCount}`, '"bhai" count'],
                    [`😂 ${stats.cryCount}`, '"😭 / lol" moments'],
                    [`🍕 ${stats.foodCount}`, "food discussions"],
                    [`📱 ${stats.midnightCount}`, "after-midnight msgs"],
                  ].map(([n, l]) => (
                    <div key={l as string} className="rounded-2xl border border-white/10 bg-black/50 p-4 text-center">
                      <p className="font-display text-2xl font-black">{n}</p>
                      <p className="text-xs text-white/55">{l}</p>
                    </div>
                  ))}
                </div>
                <div className="mx-5 rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 text-center">
                  <p className="text-[11px] font-black tracking-widest text-amber-300">🏆 GROUP AWARD</p>
                  <p className="font-desi mt-1 text-xl font-black">{stats.headline}</p>
                  {stats.awards.map((a) => (
                    <p key={a.title} className="mt-1 text-xs text-white/65">{a.emoji} {a.title} — <b>{a.winner}</b></p>
                  ))}
                </div>
                <div className="flex gap-2 p-5">
                  <button
                    onClick={() => downloadText("group-wrapped.txt", `YOUR DESI GROUP WRAPPED 🇮🇳\n${stats.totalMessages} messages\n🔥 ${stats.bhaiCount} bhai\n😂 ${stats.cryCount}\n🍕 ${stats.foodCount} food\n📱 ${stats.midnightCount} midnight\n🏆 ${stats.headline}`)}
                    className="pressable flex flex-1 items-center justify-center gap-1 rounded-full border border-white/15 py-2.5 text-sm font-bold"
                  >
                    <Download className="h-4 w-4" /> Download
                  </button>
                  <button
                    onClick={async () => {
                      await shareOrCopy(`YOUR DESI GROUP WRAPPED 🇮🇳\n${stats.totalMessages} messages, 🔥${stats.bhaiCount} bhai, 🍕${stats.foodCount} food talks\n🏆 ${stats.headline}\n— via ROASTED INDIA`);
                      alert("Copied! Group mein bhej de 😂");
                    }}
                    className="pressable flex flex-1 items-center justify-center gap-1 rounded-full bg-white py-2.5 text-sm font-black text-black"
                  >
                    <Share2 className="h-4 w-4" /> Share
                  </button>
                </div>
              </motion.div>
            ) : (
              <div className="grid h-full place-items-center rounded-3xl border border-dashed border-white/15 p-10 text-center text-white/50">
                <p>👈 Chat daalo, Wrapped pao 🎁<br /><span className="text-xs">Top words, bhai-counts, awards — sab live calculate hoga.</span></p>
              </div>
            )}
          </div>
        </div>
        <div className="h-12" />
      </div>
      <Footer />
    </main>
  );
}
