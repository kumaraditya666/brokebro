"use client";
import { motion } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Copy,
  Download,
  Flame,
  ImagePlus,
  MessageSquareText,
  Pencil,
  RefreshCw,
  Share2,
  Sparkles,
  Upload,
  Wand2,
} from "lucide-react";
import CursorGlow from "./CursorGlow";
import Navbar from "./Navbar";
import Footer from "./Footer";
import ShareCard from "./ShareCard";
import { Magnetic } from "./fx";
import { SITUATIONS, STYLE_META, DEMO_ROASTS } from "@/lib/roasted/data";
import { FAMOUS_CATEGORIES, famousByCategory, famousById, punchlineForStyle, searchFamous, type FamousCategory } from "@/lib/roasted/famous";
import { generateDesiMeme, generateRoast, generateRoastVariations, analyzeChat, buildShareText } from "@/lib/roasted/engine";
import { generateMemeAI, generateRoastAI, analyzeChatAI } from "@/lib/roasted/ai";
import { pushHistory, shareOrCopy } from "@/lib/roasted/utils";
import type { ChatAward, Language, MemeResult, RoastResult, RoastStyle, RoastTarget } from "@/lib/roasted/types";

type Mode = "roast" | "meme" | "chat" | "situation";

const TARGETS: { id: RoastTarget; label: string; emoji: string }[] = [
  { id: "me", label: "Me", emoji: "🪞" },
  { id: "friend", label: "My Friend", emoji: "🧑" },
  { id: "bestfriend", label: "Best Friend", emoji: "👯" },
  { id: "group", label: "Friend Group", emoji: "👥" },
  { id: "random", label: "Random", emoji: "🎲" },
];
const LANGS: { id: Language; label: string }[] = [
  { id: "hinglish", label: "🇮🇳 Hinglish" },
  { id: "hindi", label: "🇮🇳 Hindi" },
  { id: "english", label: "🇬🇧 English" },
  { id: "auto", label: "🤖 Auto" },
];

export default function StudioClient() {
  const params = useSearchParams();
  const [mode, setMode] = useState<Mode>("roast");
  const [style, setStyle] = useState<RoastStyle>("desi");
  const [lang, setLang] = useState<Language>("hinglish");
  const [target, setTarget] = useState<RoastTarget>("friend");
  const [name, setName] = useState("");
  const [context, setContext] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [imageName, setImageName] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [roasts, setRoasts] = useState<RoastResult[]>([]);
  const [activeRoast, setActiveRoast] = useState(0);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState("");
  const [meme, setMeme] = useState<MemeResult | null>(null);
  const [memeTop, setMemeTop] = useState("Friend says:");
  const [memeBottom, setMemeBottom] = useState("'5 min mein aa raha hoon' — 2 hours later");
  const [memeSize, setMemeSize] = useState(26);
  const [memeAlign, setMemeAlign] = useState<"center" | "left">("center");
  const [memeFont, setMemeFont] = useState<"desi" | "display" | "mono">("desi");
  const [famousCat, setFamousCat] = useState<FamousCategory | "all">("all");
  const [famousQuery, setFamousQuery] = useState("");
  const [situation, setSituation] = useState("exams");
  const [chatText, setChatText] = useState("");
  const [awards, setAwards] = useState<ChatAward[]>([]);
  const [toast, setToast] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const m = params.get("mode");
    if (m === "meme" || m === "chat" || m === "situation" || m === "roast") setMode(m);
    const s = params.get("style");
    if (s && STYLE_META[s]) setStyle(s as RoastStyle);
    const q = params.get("q");
    if (q) setContext(q);
    const sit = params.get("situation");
    if (sit) {
      setSituation(sit);
      setMode("meme");
    }
    const lineId = params.get("line");
    if (lineId) {
      const fl = famousById(lineId);
      if (fl) {
        setMemeTop(`— ${fl.source}`);
        setMemeBottom(fl.text);
        setMode("meme");
      }
    }
    if (params.get("demo") === "1") {
      setContext("He says he'll start studying tomorrow every single day.");
      setTimeout(() => doRoast(true), 400);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toastIt = (t: string) => {
    setToast(t);
    setTimeout(() => setToast(""), 2200);
  };

  const onFiles = (files: FileList | null, kind = "photo") => {
    if (!files?.length) return;
    const f = files[0];
    if (!/image\/(jpeg|png|webp)/.test(f.type) && !f.type.startsWith("image/")) {
      toastIt("Sirf JPG / PNG / WEBP 😅");
      return;
    }
    if (f.size > 8 * 1024 * 1024) {
      toastIt("8MB se chhoti file daal bhai 📦");
      return;
    }
    const url = URL.createObjectURL(f);
    setImage(url);
    setImageName(f.name);
    if (kind === "chat") {
      setMode("chat");
      toastIt("Chat mil gaya! Neeche paste bhi kar sakte ho 💬");
    } else {
      toastIt("Evidence mil gaya 👀🔥");
    }
  };

  const doRoast = async (isDemo = false) => {
    setBusy(true);
    setEditing(false);
    try {
      const req = {
        style,
        language: lang,
        target,
        context: context || (isDemo ? "says kal se gym, never goes" : "typical desi friend, always late, full confidence"),
        name,
        hasImage: !!image,
      };
      const res = await generateRoastAI(req);
      const vars = (res as { variations?: RoastResult[] }).variations ?? generateRoastVariations(req, 3);
      setRoasts(vars);
      setActiveRoast(0);
      setEditText(vars[0]?.text ?? "");
      setMode("roast");
      vars.slice(0, 1).forEach((v) =>
        pushHistory({ id: v.id, kind: "roast", text: v.text, meta: `${v.style} • ${v.language}`, at: Date.now() })
      );
    } finally {
      setTimeout(() => setBusy(false), 650);
    }
  };

  const doMeme = async () => {
    setBusy(true);
    try {
      const res = await generateMemeAI(situation, lang);
      const m = (res as { meme: MemeResult }).meme ?? generateDesiMeme(situation, lang);
      setMeme(m);
      setMemeTop(m.top);
      setMemeBottom(m.bottom);
      pushHistory({ id: m.id, kind: "meme", text: `${m.top} ${m.bottom}`, meta: m.template, at: Date.now() });
    } finally {
      setTimeout(() => setBusy(false), 550);
    }
  };

  const doChat = async () => {
    setBusy(true);
    try {
      const res = await analyzeChatAI(chatText || "Rahul: bhai kal se pakka gym\nPriya: 😂😂 seen\nAman: trust me plan set hai\nRahul: biryani party?");
      setAwards((res as { awards: ChatAward[] }).awards ?? analyzeChat(chatText));
    } finally {
      setTimeout(() => setBusy(false), 550);
    }
  };

  const doSituation = async () => {
    setBusy(true);
    try {
      const m = generateDesiMeme(situation, lang);
      setMeme(m);
      setMemeTop(m.top);
      setMemeBottom(m.bottom);
      setMode("situation");
    } finally {
      setTimeout(() => setBusy(false), 550);
    }
  };

  const current = roasts[activeRoast];

  return (
    <main className="relative min-h-screen bg-ink">
      <CursorGlow />
      <Navbar />
      <div className="relative z-10 mx-auto max-w-[1400px] px-3 pt-20 sm:px-6 sm:pt-24">
        {/* header + mode tabs */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black tracking-[0.25em] text-orange-400">ROAST STUDIO 🔥</p>
            <h1 className="font-display text-3xl font-black tracking-tight sm:text-5xl">
              Drop evidence. <span className="fire-text">Get roasted.</span>
            </h1>
            <p className="mt-1 text-sm text-white/55">No login needed. Guest → Generate → Share on WhatsApp.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["roast", "🔥 Roast"],
                ["meme", "😂 Meme"],
                ["chat", "💬 Chat"],
                ["situation", "🎭 Situation"],
              ] as [Mode, string][]
            ).map(([m, label]) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`pressable rounded-full px-4 py-2.5 text-sm font-black transition ${
                  mode === m
                    ? "bg-gradient-to-r from-amber-400 via-orange-500 to-pink-600 text-black shadow-glow"
                    : "border border-white/12 bg-white/5 text-white/70 hover:border-white/30"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[320px_1fr_320px]">
          {/* LEFT */}
          <section className="glass rounded-3xl p-4 sm:p-5">
            <p className="text-[11px] font-black tracking-[0.2em] text-white/50">1 • EVIDENCE 👀</p>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                onFiles(e.dataTransfer.files);
              }}
              onClick={() => fileRef.current?.click()}
              className={`mt-3 cursor-pointer rounded-2xl border-2 border-dashed p-5 text-center transition ${
                dragOver ? "border-orange-400 bg-orange-500/10" : "border-white/15 bg-black/40 hover:border-orange-500/50"
              }`}
            >
              {image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={image} alt="evidence" className="mx-auto max-h-44 rounded-xl object-cover" />
              ) : (
                <>
                  <Upload className="mx-auto h-8 w-8 text-orange-400" />
                  <p className="font-desi mt-2 font-bold">Drop the evidence here 👀</p>
                  <p className="text-xs text-white/50">JPG • PNG • WEBP • screenshots</p>
                </>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/*"
                className="hidden"
                onChange={(e) => onFiles(e.target.files)}
              />
            </div>
            {image && (
              <p className="mt-2 truncate text-xs text-white/50">
                📎 {imageName} • <button className="underline hover:text-white" onClick={() => setImage(null)}>remove</button>
              </p>
            )}
            <div className="mt-3 grid grid-cols-3 gap-2">
              {[
                ["Upload Photo", "photo", <ImagePlus key="p" className="h-3.5 w-3.5" />],
                ["Screenshot", "shot", <Copy key="s" className="h-3.5 w-3.5" />],
                ["Upload Chat", "chat", <MessageSquareText key="c" className="h-3.5 w-3.5" />],
              ].map(([label, kind, icon]) => (
                <button
                  key={label as string}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (fileRef.current) {
                      fileRef.current.click();
                    }
                    if (kind === "chat") setMode("chat");
                  }}
                  className="pressable flex items-center justify-center gap-1 rounded-xl border border-white/12 bg-white/5 px-1 py-2.5 text-[11px] font-black hover:border-orange-400"
                >
                  {icon}
                  {label as string}
                </button>
              ))}
            </div>

            <p className="mt-5 text-[11px] font-black tracking-[0.2em] text-white/50">2 • WHO&apos;S GETTING ROASTED?</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {TARGETS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTarget(t.id)}
                  className={`pressable rounded-full px-3 py-2 text-xs font-bold ${
                    target === t.id ? "bg-white text-black" : "border border-white/12 bg-white/5 text-white/70"
                  }`}
                >
                  {t.emoji} {t.label}
                </button>
              ))}
            </div>
            <input
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 40))}
              placeholder="Name (optional) — e.g. Aman"
              className="mt-3 w-full rounded-xl border border-white/12 bg-black/50 px-3.5 py-2.5 text-sm outline-none placeholder:text-white/30 focus:border-orange-400"
            />
            <p className="mt-4 text-[11px] font-black tracking-[0.2em] text-white/50">3 • CONTEXT</p>
            <textarea
              value={context}
              onChange={(e) => setContext(e.target.value.slice(0, 280))}
              placeholder="Tell us something about this person... e.g. He says he'll start studying tomorrow every single day."
              rows={4}
              className="mt-2 w-full resize-none rounded-xl border border-white/12 bg-black/50 px-3.5 py-2.5 text-sm outline-none placeholder:text-white/30 focus:border-orange-400"
            />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {["Always late ⏰", "Kal se gym 💪", "Proxy king 🙋", "Biren... I mean Biryani 🍛"].map((chip) => (
                <button
                  key={chip}
                  onClick={() => setContext(chip)}
                  className="pressable rounded-full bg-white/8 px-2.5 py-1 text-[11px] text-white/60 hover:text-white"
                >
                  {chip}
                </button>
              ))}
            </div>
          </section>

          {/* CENTER */}
          <section className="min-h-[560px] rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent p-4 sm:p-6">
            {mode === "roast" && (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-black tracking-[0.2em] text-white/50">YOUR DESI ROAST 🔥</p>
                  <button
                    onClick={() => doRoast()}
                    disabled={busy}
                    className="pressable flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-400 via-orange-500 to-pink-600 px-5 py-2.5 text-sm font-black text-black shadow-glow disabled:opacity-60"
                  >
                    {busy ? "Roasting..." : (<><Wand2 className="h-4 w-4" /> Generate 🔥</>)}
                  </button>
                </div>
                {busy ? (
                  <div className="mt-4 grid gap-3">
                    {[0, 1].map((i) => (
                      <div key={i} className="rounded-2xl border border-white/10 p-5">
                        <div className="shimmer h-4 w-2/3 rounded" />
                        <div className="shimmer mt-2 h-4 w-full rounded" />
                        <div className="shimmer mt-2 h-4 w-1/2 rounded" />
                      </div>
                    ))}
                    <p className="text-center text-xs text-white/40">AI soch raha hai... evidence strong hai 👀</p>
                  </div>
                ) : current ? (
                  <div className="pop-in mt-4">
                    <div className="glow-border rounded-3xl bg-black/60 p-5 sm:p-7">
                      {editing ? (
                        <textarea
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          rows={4}
                          className="w-full rounded-xl border border-orange-500/40 bg-black p-3 font-desi text-lg font-bold outline-none"
                        />
                      ) : (
                        <p className="font-desi roast-card-text text-2xl font-black leading-snug text-orange-50 sm:text-3xl">
                          “{current.text}”
                        </p>
                      )}
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] font-bold text-white/50">
                        <span className="rounded-full bg-white/8 px-2.5 py-1">🎭 {current.character}</span>
                        <span className="rounded-full bg-white/8 px-2.5 py-1">{STYLE_META[current.style]?.emoji} {STYLE_META[current.style]?.label}</span>
                        <span className="rounded-full bg-white/8 px-2.5 py-1">{current.language}</span>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button onClick={() => doRoast()} className="pressable flex items-center gap-1 rounded-full bg-white px-4 py-2 text-xs font-black text-black">
                          <RefreshCw className="h-3.5 w-3.5" /> Roast Again 🔥
                        </button>
                        <button
                          onClick={() => {
                            if (editing) {
                              setRoasts((r) => r.map((x, i) => (i === activeRoast ? { ...x, text: editText } : x)));
                              setEditing(false);
                            } else {
                              setEditText(current.text);
                              setEditing(true);
                            }
                          }}
                          className="pressable flex items-center gap-1 rounded-full border border-white/15 px-4 py-2 text-xs font-bold"
                        >
                          <Pencil className="h-3.5 w-3.5" /> {editing ? "Save" : "Edit"}
                        </button>
                        <button
                          onClick={async () => {
                            await shareOrCopy(buildShareText(editing ? editText : current.text));
                            toastIt("Copied! 📋");
                          }}
                          className="pressable flex items-center gap-1 rounded-full border border-white/15 px-4 py-2 text-xs font-bold"
                        >
                          <Copy className="h-3.5 w-3.5" /> Copy
                        </button>
                        <button
                          onClick={async () => {
                            await shareOrCopy(buildShareText(editing ? editText : current.text));
                            toastIt("Share sheet khul gaya! 📱");
                          }}
                          className="pressable flex items-center gap-1 rounded-full border border-orange-500/40 bg-orange-500/10 px-4 py-2 text-xs font-bold"
                        >
                          <Share2 className="h-3.5 w-3.5" /> Share ↗
                        </button>
                        <button
                          onClick={() => {
                            const p = punchlineForStyle(style, current.text);
                            const add = `\n\n${p.emoji} "${p.text}" — ${p.source}`;
                            if (editing) {
                              setEditText(editText + add);
                            } else {
                              setRoasts((rs) => rs.map((x, i) => (i === activeRoast ? { ...x, text: x.text + add } : x)));
                              setEditText(current.text + add);
                            }
                            toastIt("Legendary line added! ⭐");
                          }}
                          className="pressable flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-400/10 px-4 py-2 text-xs font-bold"
                        >
                          <Sparkles className="h-3.5 w-3.5" /> Famous punchline ⭐
                        </button>
                      </div>
                    </div>
                    {roasts.length > 1 && (
                      <div className="mt-3 grid gap-2">
                        <p className="text-[11px] font-black tracking-widest text-white/40">MORE VARIATIONS 👇</p>
                        {roasts.map((r, i) => (
                          <button
                            key={r.id}
                            onClick={() => {
                              setActiveRoast(i);
                              setEditText(r.text);
                              setEditing(false);
                            }}
                            className={`pressable rounded-2xl border p-3.5 text-left text-sm font-bold transition ${
                              i === activeRoast ? "border-orange-500/60 bg-orange-500/10" : "border-white/10 bg-black/40 hover:border-white/25"
                            }`}
                          >
                            {r.text}
                          </button>
                        ))}
                      </div>
                    )}
                    <div className="mt-4">
                      <ShareCard text={editing ? editText : current.text} tag={`${STYLE_META[current.style]?.label ?? "DESI"} ROAST`} />
                    </div>
                    <a href={`/roast/${current.id}?t=${encodeURIComponent(editing ? editText : current.text)}`} className="pressable mt-3 block rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-center text-sm font-bold text-white/70 hover:text-white">
                      Think you can survive one? <span className="text-orange-400">ROAST ME 🔥 →</span>
                    </a>
                  </div>
                ) : (
                  <div className="mt-4 rounded-3xl border border-dashed border-white/15 p-8 text-center">
                    <Flame className="mx-auto h-10 w-10 text-orange-500" />
                    <p className="font-desi mt-3 text-xl font-bold">Ready jab tu ready 🔥</p>
                    <p className="mx-auto mt-1 max-w-sm text-sm text-white/50">Context likh, style pick kar, Generate daba. Pehli roast free, dosti priceless.</p>
                    <div className="mx-auto mt-4 grid max-w-md gap-2 text-left">
                      {DEMO_ROASTS.slice(0, 3).map((d) => (
                        <button key={d} onClick={() => { setContext(d); toastIt("Vibe set! Generate daba 🔥"); }} className="pressable rounded-xl border border-white/10 bg-black/40 p-3 text-xs font-bold text-white/70 hover:border-orange-400">
                          ✨ {d}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {mode === "meme" && (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-black tracking-[0.2em] text-white/50">DESI MEME MAKER 😂</p>
                  <button onClick={doMeme} disabled={busy} className="pressable rounded-full bg-gradient-to-r from-amber-400 via-orange-500 to-pink-600 px-5 py-2.5 text-sm font-black text-black shadow-glow disabled:opacity-60">
                    {busy ? "Cooking..." : "MAKE MEME 😂"}
                  </button>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div className="overflow-hidden rounded-3xl border border-white/12 bg-black">
                    <div className="bg-gradient-to-r from-amber-500/25 to-pink-500/25 px-4 py-2 text-center text-[11px] font-black tracking-widest text-amber-200">
                      {meme?.template?.toUpperCase() ?? "ORIGINAL TEMPLATE"} • LIVE PREVIEW
                    </div>
                    <div className="p-5 text-center" style={{ textAlign: memeAlign }}>
                      <p className={`${memeFont === "mono" ? "font-mono" : memeFont === "display" ? "font-display" : "font-desi"} font-black uppercase tracking-wide`} style={{ fontSize: Math.max(memeSize - 8, 14) }}>{memeTop}</p>
                      {image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={image} alt="meme" className="mx-auto my-4 max-h-64 rounded-2xl object-cover" />
                      ) : (
                        <div className="mx-auto my-4 grid h-28 w-28 place-items-center rounded-3xl bg-gradient-to-br from-amber-400 via-orange-500 to-pink-600 text-6xl shadow-glow">😂</div>
                      )}
                      <p className={`${memeFont === "mono" ? "font-mono" : memeFont === "display" ? "font-display" : "font-desi"} font-black leading-tight text-orange-50`} style={{ fontSize: memeSize }}>{memeBottom}</p>
                      <p className="mt-2 text-xs text-white/45">ROASTED INDIA 🇮🇳 • Dosti gayi, meme bach gaya</p>
                    </div>
                  </div>
                  <div className="grid content-start gap-3">
                    <label className="text-xs font-black text-white/60">TOP TEXT
                      <input value={memeTop} onChange={(e) => setMemeTop(e.target.value)} className="mt-1 w-full rounded-xl border border-white/12 bg-black/50 px-3 py-2.5 text-sm outline-none focus:border-orange-400" />
                    </label>
                    <label className="text-xs font-black text-white/60">BOTTOM TEXT
                      <textarea value={memeBottom} onChange={(e) => setMemeBottom(e.target.value)} rows={3} className="mt-1 w-full rounded-xl border border-white/12 bg-black/50 px-3 py-2.5 text-sm outline-none focus:border-orange-400" />
                    </label>
                    <label className="text-xs font-black text-white/60">SIZE: {memeSize}px
                      <input type="range" min={16} max={40} value={memeSize} onChange={(e) => setMemeSize(Number(e.target.value))} className="desi-slider mt-2 w-full" />
                    </label>
                    <div className="flex gap-2">
                      {(["center", "left"] as const).map((a) => (
                        <button key={a} onClick={() => setMemeAlign(a)} className={`pressable flex-1 rounded-xl border py-2 text-xs font-black ${memeAlign === a ? "border-orange-400 bg-orange-500/15" : "border-white/12"}`}>{a.toUpperCase()}</button>
                      ))}
                    </div>
                    <div>
                      <p className="text-xs font-black text-white/60">FONT</p>
                      <div className="mt-1 flex gap-2">
                        {(["desi", "display", "mono"] as const).map((f) => (
                          <button key={f} onClick={() => setMemeFont(f)} className={`pressable flex-1 rounded-xl border py-2 text-xs font-black capitalize ${memeFont === f ? "border-orange-400 bg-orange-500/15" : "border-white/12"}`}>{f}</button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-black text-white/60">TEMPLATE</p>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {["POV Fridge Check", '"5 Min Mein Aaya"', '"Kal Se Pakka"', "Proxy Legend", "Chai Break", "Wedding Buffet"].map((t) => (
                          <button key={t} onClick={() => setMemeTop(t)} className="pressable rounded-full bg-white/8 px-2.5 py-1 text-[11px] text-white/60 hover:text-white">{t}</button>
                        ))}
                      </div>
                    </div>
                    {meme && (
                      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-xs">
                        <p><b>Hinglish:</b> {meme.hinglish}</p>
                        <p className="mt-1"><b>Hindi:</b> {meme.hindi}</p>
                        <p className="mt-1"><b>English:</b> {meme.english}</p>
                      </div>
                    )}
                    <button onClick={async () => { await shareOrCopy(`${memeTop}\n${memeBottom}\n\n— via ROASTED INDIA 🇮🇳`); toastIt("Meme copied! 📋"); }} className="pressable flex items-center justify-center gap-1 rounded-full border border-white/15 py-2.5 text-sm font-bold">
                      <Download className="h-4 w-4" /> Copy / Download caption
                    </button>
                  </div>
                </div>
                <div className="mt-4 rounded-3xl border border-amber-400/25 bg-gradient-to-b from-amber-950/30 to-transparent p-4 sm:p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-[11px] font-black tracking-[0.2em] text-amber-300">⭐ FAMOUS LINES — TAP TO USE IN MEME</p>
                    <input
                      value={famousQuery}
                      onChange={(e) => setFamousQuery(e.target.value)}
                      placeholder="Search — e.g. Sholay, CID, Binod..."
                      className="w-full rounded-xl border border-white/12 bg-black/50 px-3 py-2 text-xs outline-none placeholder:text-white/30 focus:border-amber-400 sm:w-56"
                    />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {FAMOUS_CATEGORIES.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => setFamousCat(c.id)}
                        className={`pressable rounded-full px-3 py-1.5 text-[11px] font-black ${famousCat === c.id ? "bg-amber-400 text-black" : "border border-white/12 bg-white/5 text-white/65"}`}
                      >
                        {c.emoji} {c.label}
                      </button>
                    ))}
                  </div>
                  <div className="mt-3 grid max-h-72 gap-2 overflow-y-auto pr-1">
                    {(famousQuery.trim() ? searchFamous(famousQuery) : famousByCategory(famousCat)).slice(0, 30).map((fl) => (
                      <button
                        key={fl.id}
                        onClick={() => {
                          setMemeTop(`— ${fl.source}`);
                          setMemeBottom(fl.text);
                          toastIt("Legendary line set! ⭐");
                        }}
                        className="pressable rounded-2xl border border-white/10 bg-black/50 p-3 text-left transition hover:border-amber-400/60 hover:bg-amber-500/10"
                      >
                        <p className="font-desi text-sm font-bold text-orange-50">{fl.emoji} “{fl.text}”</p>
                        <p className="mt-1 text-[11px] text-white/50">{fl.source} • {fl.vibe}</p>
                      </button>
                    ))}
                  </div>
                  <p className="mt-2 text-[11px] text-white/35">Short iconic lines quoted with source — full credit to the original creators. 🎬</p>
                </div>
              </>
            )}

            {mode === "chat" && (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-black tracking-[0.2em] text-white/50">GROUP CHAT ROAST 💬</p>
                  <button onClick={doChat} disabled={busy} className="pressable rounded-full bg-gradient-to-r from-amber-400 via-orange-500 to-pink-600 px-5 py-2.5 text-sm font-black text-black shadow-glow disabled:opacity-60">
                    {busy ? "Padh raha..." : "ROAST THE CHAT 💀"}
                  </button>
                </div>
                <textarea
                  value={chatText}
                  onChange={(e) => setChatText(e.target.value.slice(0, 20000))}
                  rows={7}
                  placeholder={"Paste WhatsApp chat here (names only, no numbers)...\n\nRahul: bhai kal se pakka gym\nPriya: 😂😂\nAman: trust me plan set hai"}
                  className="mt-4 w-full rounded-2xl border border-white/12 bg-black/50 p-4 font-mono text-xs leading-relaxed outline-none placeholder:text-white/30 focus:border-orange-400"
                />
                <p className="mt-2 text-[11px] text-white/40">⚠️ Sirf wahi paste karo jo share karne ki permission hai. Numbers/emails auto-ignore hote hain. Results obviously humorous hain, facts nahi. 😂</p>
                {awards.length > 0 && (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {awards.map((a) => (
                      <motion.div key={a.title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-white/10 bg-black/50 p-4">
                        <p className="text-2xl">{a.emoji}</p>
                        <p className="mt-1 text-sm font-black">{a.title}</p>
                        <p className="text-xs text-white/55">{a.desc}</p>
                        <p className="mt-2 inline-block rounded-full bg-orange-500/15 px-2.5 py-1 text-[11px] font-black text-orange-300">🏅 {a.winner}</p>
                      </motion.div>
                    ))}
                  </div>
                )}
              </>
            )}

            {mode === "situation" && (
              <>
                <p className="text-[11px] font-black tracking-[0.2em] text-white/50">WHAT&apos;S THE SITUATION? 🎭</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {SITUATIONS.map((s) => (
                    <button key={s.id} onClick={() => setSituation(s.id)} className={`pressable rounded-full px-3.5 py-2 text-xs font-bold ${situation === s.id ? "bg-white text-black" : "border border-white/12 bg-white/5 text-white/70"}`}>
                      {s.emoji} {s.label}
                    </button>
                  ))}
                </div>
                <button onClick={doSituation} disabled={busy} className="pressable mt-4 flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-400 via-orange-500 to-pink-600 px-6 py-3 font-black text-black shadow-glow disabled:opacity-60">
                  <Sparkles className="h-4 w-4" /> {busy ? "Soch raha..." : `GENERATE ${SITUATIONS.find((s) => s.id === situation)?.label.toUpperCase()} MEME`}
                </button>
                {meme && (
                  <div className="pop-in mt-4 rounded-3xl border border-white/10 bg-black/50 p-5">
                    <p className="font-display text-sm font-black uppercase text-white/80">{meme.top}</p>
                    <p className="font-desi mt-1 text-2xl font-black text-orange-50">{meme.bottom}</p>
                    <p className="mt-2 text-sm text-white/60">{meme.caption}</p>
                    <ShareCard text={`${meme.top} ${meme.bottom}`} tag="SITUATION MEME" />
                  </div>
                )}
              </>
            )}
          </section>

          {/* RIGHT */}
          <aside className="glass rounded-3xl p-4 sm:p-5">
            <p className="text-[11px] font-black tracking-[0.2em] text-white/50">STYLE CONTROLS 🎛️</p>
            <p className="mt-3 text-xs font-black text-white/60">LANGUAGE</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {LANGS.map((l) => (
                <button key={l.id} onClick={() => setLang(l.id)} className={`pressable rounded-xl border px-2 py-2.5 text-xs font-black ${lang === l.id ? "border-orange-400 bg-orange-500/15 text-orange-200" : "border-white/12 bg-white/5 text-white/65"}`}>
                  {l.label}
                </button>
              ))}
            </div>
            <p className="mt-4 text-xs font-black text-white/60">ROAST STYLE</p>
            <div className="mt-2 grid gap-2">
              {Object.entries(STYLE_META).map(([id, m]) => (
                <button
                  key={id}
                  onClick={() => setStyle(id as RoastStyle)}
                  className={`pressable flex items-center gap-3 rounded-2xl border p-2.5 text-left transition ${
                    style === id ? "border-orange-400 bg-orange-500/12" : "border-white/10 bg-black/40 hover:border-white/25"
                  }`}
                >
                  <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${m.gradient} text-lg`}>{m.emoji}</span>
                  <span>
                    <span className="block text-xs font-black">{m.label}</span>
                    <span className="block text-[11px] text-white/50">{m.desc}</span>
                  </span>
                </button>
              ))}
            </div>
            <div className="mt-4 rounded-2xl border border-white/10 bg-black/40 p-3.5 text-[11px] leading-relaxed text-white/55">
              💛 <b className="text-white/80">House rules:</b> savage ok, harmful nahi. Hate, threats, numbers ya personal info pe roast nahi banega — <i>“Bhai savage kar sakte hain, harmful nahi 😂”</i>
            </div>
            <Magnetic>
              <button onClick={() => (mode === "meme" ? doMeme() : mode === "chat" ? doChat() : mode === "situation" ? doSituation() : doRoast())} disabled={busy} className="pressable mt-4 w-full rounded-2xl bg-gradient-to-r from-amber-400 via-orange-500 to-pink-600 py-3.5 font-black text-black shadow-glow disabled:opacity-60">
                {busy ? "COOKING... 🔥" : "GENERATE 🔥"}
              </button>
            </Magnetic>
          </aside>
        </div>

        <div className="h-10" />
      </div>
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-[70] -translate-x-1/2 rounded-full border border-orange-500/40 bg-black/90 px-5 py-2.5 text-sm font-bold shadow-glow">
          {toast}
        </div>
      )}
      <Footer />
    </main>
  );
}
