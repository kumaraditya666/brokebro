"use client";
import { motion, useMotionValue, useTransform } from "framer-motion";
import Link from "next/link";
import { useEffect, useState, type MouseEvent } from "react";
import {
  ArrowRight,
  Camera,
  Copy,
  Flame,
  MessageCircle,
  Share2,
  Sparkles,
  Upload,
  Wand2,
} from "lucide-react";
import { CHARACTERS, EVERGREEN_TRENDS, MEME_TEMPLATES, SITUATIONS, STYLE_META, TRENDING_ROASTS } from "@/lib/roasted/data";
import { FAMOUS_LINES } from "@/lib/roasted/famous";
import { generateRoast, generateDesiMeme } from "@/lib/roasted/engine";
import { shareOrCopy } from "@/lib/roasted/utils";
import { Magnetic, Tilt } from "./fx";

const FLOATERS = [
  { t: "Bhai 5 min mein aaya ⏰", sub: "2 hours later...", rot: "-6deg", x: "4%", y: "18%", d: "0s", c: "from-amber-400 to-orange-600" },
  { t: "Kal se pakka 📚", sub: "since 2019", rot: "5deg", x: "82%", y: "14%", d: "1.2s", c: "from-pink-500 to-rose-600" },
  { t: "Sharma ji ka beta 🏆", sub: "final boss", rot: "-4deg", x: "6%", y: "62%", d: "0.6s", c: "from-emerald-400 to-green-600" },
  { t: "Meter se chalo 🛺", sub: "rare footage", rot: "6deg", x: "80%", y: "60%", d: "1.8s", c: "from-violet-500 to-indigo-600" },
  { t: "Fridge check #7 🧊", sub: "same dal", rot: "3deg", x: "46%", y: "8%", d: "2.2s", c: "from-cyan-400 to-blue-600" },
];

function Hero() {
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.3);
  const rx = useTransform(my, [0, 1], [6, -6]);
  const ry = useTransform(mx, [0, 1], [-8, 8]);
  const onMove = (e: MouseEvent) => {
    mx.set(e.clientX / window.innerWidth);
    my.set(e.clientY / window.innerHeight);
  };
  const [demo, setDemo] = useState("Bhai tera 'kal se padhunga' itna consistent hai ki calendar bhi confuse ho gaya. 📅💀");
  useEffect(() => {
    const samples = [
      "Bhai tera 'kal se padhunga' itna consistent hai ki calendar bhi confuse ho gaya. 📅💀",
      "Tu '5 min mein aa raha' bol ke time-travel kar leta hai kya? ⏰👻",
      "Tera WiFi se zyada unstable tera 'kal se pakka' hai. 📶😭",
    ];
    let i = 0;
    const id = setInterval(() => {
      i = (i + 1) % samples.length;
      setDemo(samples[i]);
    }, 3400);
    return () => clearInterval(id);
  }, []);

  return (
    <section onMouseMove={onMove} className="relative z-10 overflow-hidden pt-28 sm:pt-32">
      <div className="dot-grid pointer-events-none absolute inset-0 opacity-60" />
      <div className="pointer-events-none absolute -top-24 left-1/2 h-96 w-[60rem] -translate-x-1/2 rounded-full bg-orange-600/20 blur-[120px]" />
      {/* floating meme cards */}
      {FLOATERS.map((f) => (
        <motion.div
          key={f.t}
          style={{ left: f.x, top: f.y, ["--rot" as string]: f.rot, x: ry, y: rx }}
          className="floaty absolute z-0 hidden w-52 lg:block"
        >
          <div
            style={{ animationDelay: f.d }}
            className={`floaty rounded-2xl border border-white/15 bg-gradient-to-br ${f.c} p-[1px] shadow-card`}
          >
            <div className="rounded-2xl bg-black/85 p-3 backdrop-blur">
              <p className="font-desi text-sm font-bold text-white">{f.t}</p>
              <p className="text-xs text-white/55">{f.sub}</p>
            </div>
          </div>
        </motion.div>
      ))}

      <div className="relative mx-auto max-w-6xl px-4 text-center sm:px-6">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-1.5 text-xs font-bold text-orange-200">
          <Sparkles className="h-3.5 w-3.5" /> DESI FRIENDS • DESI ROASTS • HINGLISH FIRST
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="font-display mx-auto mt-5 max-w-5xl text-[2.6rem] font-black leading-[0.95] tracking-tight sm:text-7xl md:text-8xl"
        >
          INDIA&apos;S FRIENDS
          <br />
          ARE ABOUT TO GET
          <br />
          <span className="fire-text">ROASTED. 🇮🇳</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16 }}
          className="mx-auto mt-5 max-w-2xl text-base text-white/65 sm:text-lg"
        >
          Upload your friend&apos;s photo, chat or situation and let AI turn it into a desi roast or meme.
          <span className="text-white/90"> Bhai, evidence mil gaya. 😂</span>
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22 }}
          className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <Magnetic>
            <Link
              href="/studio"
              className="pressable flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-400 via-orange-500 to-pink-600 px-8 py-4 text-base font-black text-black shadow-glow hover:brightness-110"
            >
              <Flame className="h-5 w-5" /> ROAST SOMEONE 🔥
            </Link>
          </Magnetic>
          <Magnetic>
            <Link
              href="/studio?mode=meme"
              className="pressable flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-8 py-4 text-base font-bold text-white backdrop-blur hover:border-white/30"
            >
              MAKE A DESI MEME 😂
            </Link>
          </Magnetic>
          <Magnetic>
            <Link href="/studio?demo=1" className="pressable rounded-full px-6 py-4 text-sm font-bold text-white/60 underline-offset-4 hover:text-white hover:underline">
              TRY DEMO →
            </Link>
          </Magnetic>
        </motion.div>

        {/* live demo strip */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass glow-border mx-auto mt-10 max-w-2xl rounded-3xl p-5 text-left sm:p-6"
        >
          <div className="flex items-center gap-2">
            <span className="flex gap-1.5">
              <i className="h-2.5 w-2.5 rounded-full bg-red-400" />
              <i className="h-2.5 w-2.5 rounded-full bg-amber-400" />
              <i className="h-2.5 w-2.5 rounded-full bg-green-400" />
            </span>
            <p className="ml-2 text-[11px] font-black tracking-[0.2em] text-white/50">LIVE DESI ROAST 🔥</p>
            <span className="ml-auto flex gap-1">
              <span className="typing-dot h-1.5 w-1.5 rounded-full bg-orange-400" />
              <span className="typing-dot h-1.5 w-1.5 rounded-full bg-orange-400" style={{ animationDelay: "0.15s" }} />
              <span className="typing-dot h-1.5 w-1.5 rounded-full bg-orange-400" style={{ animationDelay: "0.3s" }} />
            </span>
          </div>
          <p key={demo} className="font-desi pop-in mt-3 min-h-14 text-xl font-bold leading-snug text-orange-50 sm:text-2xl">
            “{demo}”
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/studio" className="pressable rounded-full bg-white px-4 py-2 text-xs font-black text-black">Roast my friend →</Link>
            <button
              onClick={async () => {
                await shareOrCopy(demo + "\n\n— via ROASTED INDIA 🇮🇳");
                alert("Copied! WhatsApp pe bhej de 😂");
              }}
              className="pressable flex items-center gap-1 rounded-full border border-white/15 px-4 py-2 text-xs font-bold"
            >
              <Copy className="h-3.5 w-3.5" /> Copy
            </button>
          </div>
        </motion.div>

        <div className="mx-auto mt-8 grid max-w-3xl grid-cols-3 gap-3 text-center">
          {[
            ["2.1L+", "roasts served"],
            ["9", "desi styles"],
            ["100%", "Hinglish first"],
          ].map(([n, l]) => (
            <div key={l} className="rounded-2xl border border-white/10 bg-white/[0.03] px-2 py-3">
              <p className="font-display text-xl font-black text-white sm:text-2xl">{n}</p>
              <p className="text-[11px] text-white/50">{l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ticker */}
      <div className="relative mt-12 overflow-hidden border-y border-white/10 bg-black/50 py-3">
        <div className="marquee-track flex w-max gap-8 whitespace-nowrap text-sm font-bold text-white/70">
          {Array.from({ length: 2 }).flatMap((_, k) =>
            [
              "🔥 Bhai trust me", "⏰ 5 min = 2 hours", "📚 Kal se pakka", "🏏 Sofa selector",
              "🍜 2 AM Maggi club", "🛺 Meter se chalo", "🏆 Sharma ji ka beta", "💒 Buffet wars",
            ].map((t, i) => (
              <span key={`${k}-${i}`} className="flex items-center gap-8">
                <span>{t}</span>
                <span className="text-orange-500">✦</span>
              </span>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

function Trending() {
  return (
    <section className="relative z-10 mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-black tracking-[0.25em] text-orange-400">TRENDING DESI ROASTS 🔥</p>
          <h2 className="font-display mt-2 text-3xl font-black tracking-tight sm:text-5xl">
            Straight from the <span className="fire-text">group chat</span>
          </h2>
        </div>
        <Link href="/studio" className="pressable flex items-center gap-1 rounded-full border border-white/15 px-4 py-2 text-sm font-bold hover:border-orange-400">
          Roast your friend <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {TRENDING_ROASTS.map((r, i) => (
          <Tilt key={i}>
            <div className="group h-full rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-transparent p-5 transition hover:border-orange-500/40">
              <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-bold text-amber-300">{r.tag}</span>
              <p className="font-desi mt-3 min-h-20 text-[1.05rem] font-bold leading-snug text-orange-50">“{r.text}”</p>
              <div className="mt-4 flex gap-2 opacity-80 transition group-hover:opacity-100">
                <Link href={`/studio?q=${encodeURIComponent(r.text)}`} className="pressable flex-1 rounded-full bg-white/10 py-2 text-center text-xs font-black hover:bg-white hover:text-black">
                  USE THIS VIBE 🔥
                </Link>
                <button
                  onClick={async () => {
                    await shareOrCopy(r.text + "\n\n— via ROASTED INDIA 🇮🇳");
                    alert("Copied! 📋");
                  }}
                  className="pressable rounded-full border border-white/15 p-2"
                  aria-label="copy"
                >
                  <Share2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </Tilt>
        ))}
      </div>
    </section>
  );
}

function Modes() {
  return (
    <section className="relative z-10 border-y border-white/10 bg-white/[0.02] py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <p className="text-xs font-black tracking-[0.25em] text-pink-400">MEME MODES 😂</p>
        <h2 className="font-display mt-2 max-w-2xl text-3xl font-black tracking-tight sm:text-5xl">
          Pick your <span className="tricolor-text">poison</span>
        </h2>
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-9">
          {Object.entries(STYLE_META).map(([id, m]) => (
            <Link key={id} href={`/studio?style=${id}`} className="pressable group rounded-3xl border border-white/10 bg-black/50 p-4 text-center transition hover:-translate-y-1 hover:border-orange-500/50">
              <span className={`mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br ${m.gradient} text-2xl shadow-card transition group-hover:scale-110`}>
                {m.emoji}
              </span>
              <p className="mt-2 text-sm font-black">{m.label}</p>
              <p className="mt-0.5 hidden text-[11px] leading-tight text-white/50 lg:block">{m.desc}</p>
            </Link>
          ))}
        </div>
        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {[
            { icon: <Upload className="h-5 w-5" />, t: "Drop the evidence 👀", d: "Photo, screenshot, chat — JPG, PNG, WEBP. Drag & drop." },
            { icon: <Wand2 className="h-5 w-5" />, t: "Choose style + language", d: "Hinglish, Hindi, English ya Auto. 9 desi styles." },
            { icon: <MessageCircle className="h-5 w-5" />, t: "Share on WhatsApp", d: "Beautiful vertical cards. Download, copy, roast back." },
          ].map((s, i) => (
            <div key={i} className="glass rounded-3xl p-5">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-amber-400 to-pink-600 text-black">{s.icon}</span>
              <p className="mt-3 font-black">{`0${i + 1} — ${s.t}`}</p>
              <p className="mt-1 text-sm text-white/60">{s.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Characters() {
  return (
    <section className="relative z-10 mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <p className="text-xs font-black tracking-[0.25em] text-amber-300">ORIGINAL DESI UNIVERSE ✨</p>
      <h2 className="font-display mt-2 text-3xl font-black sm:text-5xl">Meet the <span className="fire-text">roast characters</span></h2>
      <p className="mt-2 max-w-2xl text-sm text-white/60">Our own IP — no copied movie screenshots. Every roast gets a character + visual identity.</p>
      <div className="no-scrollbar mt-8 flex gap-3 overflow-x-auto pb-2">
        {CHARACTERS.map((c) => (
          <div key={c.id} className="w-44 shrink-0 rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.07] to-transparent p-4 text-center transition hover:border-white/25">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl text-3xl" style={{ background: `${c.color}22`, border: `1px solid ${c.color}55` }}>
              {c.emoji}
            </span>
            <p className="mt-2 text-sm font-black">{c.name}</p>
            <p className="mt-1 text-xs italic text-white/55">“{c.line}”</p>
          </div>
        ))}
      </div>

      <div className="mt-10 grid gap-4 lg:grid-cols-2">
        <div className="glass rounded-3xl p-6">
          <p className="text-xs font-black tracking-widest text-white/50">DESI SITUATIONS • WHAT&apos;S THE SCENE?</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {SITUATIONS.map((s) => (
              <Link key={s.id} href={`/studio?mode=meme&situation=${s.id}`} className="pressable rounded-full border border-white/12 bg-white/5 px-3.5 py-2 text-xs font-bold hover:border-orange-400 hover:bg-orange-500/10">
                {s.emoji} {s.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="glass rounded-3xl p-6">
          <p className="text-xs font-black tracking-widest text-white/50">ORIGINAL MEME TEMPLATES • NO COPYRIGHT SCENES</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {MEME_TEMPLATES.slice(0, 6).map((t) => (
              <Link key={t.id} href="/studio?mode=meme" className="pressable flex items-center gap-3 rounded-2xl border border-white/10 bg-black/40 p-3 hover:border-pink-500/40">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/8 text-xl">{t.emoji}</span>
                <span>
                  <span className="block text-sm font-black">{t.name}</span>
                  <span className="block text-xs text-white/50">{t.desc}</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { n: "01", t: "Upload", d: "Selfie, group photo, Insta screenshot ya WhatsApp chat. Drop the evidence here 👀", icon: <Camera className="h-5 w-5" /> },
    { n: "02", t: "Choose Style", d: "Desi, Bhai Mode, Savage, Cricket, Bollywood, Parents... + Hinglish/Hindi/English", icon: <Wand2 className="h-5 w-5" /> },
    { n: "03", t: "Generate", d: "AI writes original Hinglish roasts, memes, awards. Roast Again for variations.", icon: <Flame className="h-5 w-5" /> },
    { n: "04", t: "Share", d: "Vertical WhatsApp-ready cards. Download, copy, share — recipient can Roast Back 🔥", icon: <Share2 className="h-5 w-5" /> },
  ];
  return (
    <section className="relative z-10 border-y border-white/10 bg-gradient-to-b from-orange-950/20 to-transparent py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <h2 className="font-display text-center text-3xl font-black sm:text-5xl">HOW IT <span className="fire-text">WORKS</span></h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s) => (
            <Tilt key={s.n}>
              <div className="h-full rounded-3xl border border-white/10 bg-black/60 p-6">
                <div className="flex items-center justify-between">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-pink-600 text-black">{s.icon}</span>
                  <span className="font-display text-4xl font-black text-white/10">{s.n}</span>
                </div>
                <p className="mt-4 text-lg font-black">{s.t}</p>
                <p className="mt-1 text-sm leading-relaxed text-white/60">{s.d}</p>
              </div>
            </Tilt>
          ))}
        </div>
        <div className="mt-10 text-center">
          <Magnetic>
            <Link href="/studio" className="pressable inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 font-black text-black hover:brightness-110">
              Start roasting — no login needed <ArrowRight className="h-5 w-5" />
            </Link>
          </Magnetic>
          <p className="mt-3 text-xs text-white/45">Guest → Generate → Share. Login only for saving & history.</p>
        </div>
      </div>
    </section>
  );
}

function Evergreen() {
  const [meme, setMeme] = useState(() => generateDesiMeme("friendship", "hinglish"));
  return (
    <section className="relative z-10 mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <p className="text-xs font-black tracking-[0.25em] text-green-400">EVERGREEN IN INDIA 🇮🇳</p>
          <h2 className="font-display mt-2 text-3xl font-black sm:text-4xl">Always funny, never “yesterday&apos;s trend”</h2>
          <p className="mt-2 text-sm text-white/55">We don&apos;t fake live trends. These desi formats work every festival, match & exam season.</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {EVERGREEN_TRENDS.map((t) => (
              <div key={t.title} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/8 text-xl">{t.emoji}</span>
                <span>
                  <span className="block text-sm font-black">{t.title}</span>
                  <span className="block text-xs text-white/50">{t.desc}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="glass glow-border rounded-3xl p-6">
          <div className="flex items-center justify-between">
            <p className="text-xs font-black tracking-widest text-white/50">DESI MEME MAKER • LIVE PREVIEW 😂</p>
            <button
              onClick={() => setMeme(generateDesiMeme(meme.situation, "hinglish"))}
              className="pressable rounded-full border border-white/15 px-3 py-1.5 text-xs font-bold hover:border-orange-400"
            >
              Shuffle 🔀
            </button>
          </div>
          <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-black">
            <div className="bg-gradient-to-r from-amber-500/20 via-orange-500/10 to-pink-500/20 px-4 py-2 text-center text-xs font-black tracking-widest text-amber-200">
              {meme.template.toUpperCase()} • {meme.situation.toUpperCase()}
            </div>
            <div className="px-5 py-6 text-center">
              <p className="font-display text-lg font-black uppercase tracking-wide text-white">{meme.top}</p>
              <div className="mx-auto my-4 grid h-24 w-24 place-items-center rounded-3xl bg-gradient-to-br from-amber-400 via-orange-500 to-pink-600 text-5xl shadow-glow">
                😂
              </div>
              <p className="font-desi text-2xl font-black leading-tight text-orange-50">{meme.bottom}</p>
              <p className="mx-auto mt-3 max-w-sm text-sm text-white/60">{meme.caption}</p>
            </div>
          </div>
          <Link href="/studio?mode=meme" className="pressable mt-4 block rounded-full bg-gradient-to-r from-amber-400 via-orange-500 to-pink-600 py-3 text-center font-black text-black">
            MAKE THIS MEME 😂
          </Link>
        </div>
      </div>
    </section>
  );
}

function LegendaryLines() {
  const picks = [
    "bw-hera-tez", "bw-sholay-kitne", "bw-oso", "tv-cid-daya", "ws-binod",
    "yt-carry-kaise", "cr-dhoni", "bw-deewar-maa", "ws-scam", "vr-sabar",
    "bw-pushpa", "yt-rasode", "dd-5min", "bw-wanted", "ws-banrakas",
  ]
    .map((id) => FAMOUS_LINES.find((l) => l.id === id))
    .filter((l): l is NonNullable<typeof l> => !!l);
  return (
    <section className="relative z-10 border-y border-white/10 bg-white/[0.02] py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-black tracking-[0.25em] text-amber-300">LEGENDARY LINES 🎬</p>
            <h2 className="font-display mt-2 text-3xl font-black tracking-tight sm:text-5xl">
              Real famous dialogues, <span className="fire-text">ready to meme</span>
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-white/55">
              Sholay se Panchayat tak — iconic one-liners with source credit. Tap any line to use it in your meme.
            </p>
          </div>
          <Link href="/studio?mode=meme" className="pressable flex items-center gap-1 rounded-full border border-white/15 px-4 py-2 text-sm font-bold hover:border-amber-400">
            Open meme maker <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
      <div className="no-scrollbar mt-8 flex gap-3 overflow-x-auto px-4 pb-2 sm:px-6">
        {picks.map((fl) => (
          <Link
            key={fl.id}
            href={`/studio?mode=meme&line=${fl.id}`}
            className="pressable w-64 shrink-0 rounded-3xl border border-white/10 bg-black/60 p-5 transition hover:-translate-y-1 hover:border-amber-400/50"
          >
            <p className="text-3xl">{fl.emoji}</p>
            <p className="font-desi mt-2 min-h-16 text-lg font-bold leading-snug text-orange-50">“{fl.text}”</p>
            <p className="mt-2 inline-block rounded-full bg-amber-400/15 px-2.5 py-1 text-[11px] font-black text-amber-300">{fl.source}</p>
            <p className="mt-1.5 text-xs text-white/45">{fl.vibe}</p>
            <p className="mt-3 text-xs font-black text-orange-400">USE THIS LINE →</p>
          </Link>
        ))}
      </div>
      <p className="mx-auto mt-4 max-w-7xl px-4 text-[11px] text-white/35 sm:px-6">
        Short iconic lines quoted with source — full credit to the original creators. 🎬
      </p>
    </section>
  );
}

function DemoCTA() {
  const [out, setOut] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const runDemo = () => {
    setBusy(true);
    setTimeout(() => {
      const r = generateRoast({ style: "bhai", language: "hinglish", target: "friend", context: "says kal se gym, never goes" });
      setOut([r.text, ...(out.slice(0, 2))]);
      setBusy(false);
    }, 700);
  };
  return (
    <section className="relative z-10 mx-auto max-w-5xl px-4 pb-20 sm:px-6">
      <div className="relative overflow-hidden rounded-[2rem] border border-orange-500/25 bg-gradient-to-br from-orange-950/60 via-black to-pink-950/40 p-8 text-center sm:p-12">
        <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-orange-600/25 blur-[80px]" />
        <div className="pointer-events-none absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-pink-600/25 blur-[80px]" />
        <h2 className="font-display relative text-3xl font-black sm:text-5xl">Think you can <span className="fire-text">survive one?</span></h2>
        <p className="relative mx-auto mt-3 max-w-xl text-white/65">One click. Zero login. Full dosti-danger. Try the desi demo right here 👇</p>
        <div className="relative mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            onClick={runDemo}
            disabled={busy}
            className="pressable rounded-full bg-gradient-to-r from-amber-400 via-orange-500 to-pink-600 px-8 py-4 font-black text-black shadow-glow disabled:opacity-60"
          >
            {busy ? "Roasting... 🔥" : "TRY DESI DEMO ✨"}
          </button>
          <Link href="/studio?demo=1" className="pressable rounded-full border border-white/20 px-8 py-4 font-bold hover:border-white/40">
            Open full studio →
          </Link>
        </div>
        {out.length > 0 && (
          <div className="relative mx-auto mt-6 grid max-w-2xl gap-3 text-left">
            {out.map((t, i) => (
              <motion.div key={`${i}-${t}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-white/10 bg-black/60 p-4">
                <p className="font-desi font-bold text-orange-50">“{t}”</p>
              </motion.div>
            ))}
          </div>
        )}
        <p className="relative mt-5 text-xs text-white/40">Playful only. No hate, no personal data, no spam — recipient roasts back only if they want. 💛</p>
      </div>
    </section>
  );
}

export default function LandingClient() {
  return (
    <>
      <Hero />
      <Trending />
      <LegendaryLines />
      <Modes />
      <Characters />
      <HowItWorks />
      <Evergreen />
      <DemoCTA />
    </>
  );
}
