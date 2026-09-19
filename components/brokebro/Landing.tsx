"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Sparkles, Users, Zap, Trophy, FlaskConical, Wallet, Play } from "lucide-react";
import { BrokeMeter } from "./BrokeMeter";
import { AnimatedNumber } from "./AnimatedNumber";
import { Card, Badge } from "./ui";

const fade = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.6, ease: [0.2, 0.9, 0.25, 1] as const },
};

export function Landing() {
  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden px-4 pb-16 pt-32 sm:px-6 sm:pt-36">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 left-1/4 h-96 w-96 rounded-full bg-lime-400/12 blur-[110px]" />
          <div className="absolute right-1/5 top-40 h-80 w-80 rounded-full bg-fuchsia-500/12 blur-[110px]" />
          <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-violet-500/10 blur-[100px]" />
        </div>
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
          <div>
            <motion.div {...fade}>
              <Badge>✨ built for campus chaos</Badge>
            </motion.div>
            <motion.h1 {...fade} transition={{ ...fade.transition, delay: 0.05 }} className="font-display mt-5 text-4xl font-extrabold leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
              BrokeBro
              <span className="block bg-gradient-to-r from-lime-200 via-emerald-200 to-cyan-200 bg-clip-text text-3xl text-transparent sm:text-5xl lg:text-6xl">
                Know where your money disappears.
              </span>
            </motion.h1>
            <motion.p {...fade} transition={{ ...fade.transition, delay: 0.1 }} className="mt-5 max-w-md text-base text-white/60 sm:text-lg">
              Your money. Your chaos. Finally organized. Budgeting, splits, quests & a Money Wrapped — minus the boring bank vibes.
            </motion.p>
            <motion.div {...fade} transition={{ ...fade.transition, delay: 0.15 }} className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link href="/dashboard" className="group inline-flex min-h-[52px] items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-lime-300 to-emerald-300 px-7 py-4 font-bold text-black shadow-[0_0_35px_rgba(190,242,100,0.4)] transition hover:-translate-y-0.5">
                Start Tracking <ArrowRight size={18} className="transition group-hover:translate-x-1" />
              </Link>
              <a href="#features" className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-2xl border border-white/15 px-7 py-4 font-bold text-white transition hover:border-lime-300/40 hover:bg-white/5">
                <Play size={17} /> See How It Works
              </a>
            </motion.div>
            <motion.div {...fade} transition={{ ...fade.transition, delay: 0.2 }} className="mt-8 flex items-center gap-5 text-sm text-white/50">
              <span>🔥 <b className="text-white">4.9</b> from campus testers</span>
              <span>·</span><span>⚡ <b className="text-white">2-min</b> setup</span>
              <span>·</span><span>🔒 private by default</span>
            </motion.div>
          </div>

          {/* interactive dashboard preview */}
          <motion.div initial={{ opacity: 0, y: 40, rotate: 1 }} animate={{ opacity: 1, y: 0, rotate: 0 }} transition={{ duration: 0.8, delay: 0.15 }} className="tilt relative">
            <div className="glass glow-border rounded-[2rem] p-5 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-widest text-white/45">September survival kit</p>
                  <p className="font-display text-2xl font-extrabold">Hey Aditya 👋</p>
                </div>
                <Badge tone="violet">🔥 6-day streak</Badge>
              </div>
              <div className="mt-4"><BrokeMeter score={68} label="Getting Suspicious 💀" balance={3420} /></div>
              <div className="mt-4 grid grid-cols-3 gap-3">
                {[
                  { k: "Left", v: 3420, pre: "₹" },
                  { k: "Days to survive", v: 15, pre: "" },
                  { k: "Safe / day", v: 228, pre: "₹" },
                ].map((s) => (
                  <div key={s.k} className="rounded-2xl border border-white/10 bg-black/40 p-3.5 text-center">
                    <p className="font-display text-xl font-extrabold text-lime-200"><AnimatedNumber value={s.v} prefix={s.pre} /></p>
                    <p className="mt-0.5 text-[11px] uppercase tracking-wider text-white/45">{s.k}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-2xl border border-white/10 bg-black/40 p-4">
                <p className="text-xs font-bold uppercase tracking-widest text-white/45">Tonight</p>
                <p className="mt-1 text-sm">🍜 Food <b>₹1,820 / ₹2,500</b> <span className="text-white/40">· 72% — still breathing</span></p>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full w-[72%] rounded-full bg-gradient-to-r from-lime-300 to-amber-300" /></div>
              </div>
            </div>
            <div className="floaty absolute -left-4 top-10 hidden rounded-2xl border border-white/12 bg-black/80 px-3.5 py-2.5 text-xs font-semibold shadow-card backdrop-blur sm:block">⚡ +20 XP · 7-day log quest</div>
            <div className="floaty absolute -right-3 bottom-16 hidden rounded-2xl border border-white/12 bg-black/80 px-3.5 py-2.5 text-xs font-semibold shadow-card backdrop-blur sm:block" style={{ animationDelay: "1.4s" }}>👯 Rahul owes you ₹350</div>
          </motion.div>
        </div>

        {/* marquee */}
        <div className="relative mx-auto mt-14 max-w-6xl overflow-hidden rounded-2xl border border-white/8 bg-white/[0.02] py-3">
          <div className="marquee-track flex w-max gap-8 whitespace-nowrap px-4 text-sm font-semibold text-white/55">
            {["Broke Meter 💀", "Money Wrapped ✨", "Can I afford this? 🤔", "Money quests 🏆", "Split in seconds 👯", "What-if lab 🧪", "No shame, just signal 🌱"].concat(["Broke Meter 💀", "Money Wrapped ✨", "Can I afford this? 🤔", "Money quests 🏆", "Split in seconds 👯", "What-if lab 🧪", "No shame, just signal 🌱"]).map((t, i) => (
              <span key={i} className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-lime-300/70" />{t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* WHY */}
      <section id="features" className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <motion.div {...fade}>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-lime-300/80">Why students need this</p>
          <h2 className="font-display mt-2 max-w-2xl text-3xl font-extrabold sm:text-5xl">Adulting is hard. Your app shouldn't make it harder.</h2>
          <p className="mt-3 max-w-xl text-white/55">Allowance hits. Rent, mess bills, trips, “one coffee” that became five. BrokeBro turns the chaos into a game you can actually win.</p>
        </motion.div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: <Wallet size={20} />, t: "Expense tracking that takes 5 seconds", d: "Type “₹250 Zomato” — we guess Food, you confirm. Search, filter, recurring, done.", tone: "lime" as const },
            { icon: <Users size={20} />, t: "Friend splitting without the awkwardness", d: "Hostel, Goa trip, canteen. Minimal settlements + copy-paste WhatsApp message.", tone: "violet" as const },
            { icon: <Zap size={20} />, t: "AI Money Coach (no finance-bro energy)", d: "Ask “Can I afford ₹700?” — it shows the math from YOUR data. No stock tips, ever.", tone: "pink" as const },
            { icon: <Sparkles size={20} />, t: "Money Wrapped every month", d: "Your September Money Wrapped: story cards, top category, most expensive day. Share-safe.", tone: "violet" as const },
            { icon: <Trophy size={20} />, t: "Savings quests + XP + streaks", d: "Save ₹300 this week. Log 7 days straight. Unlock badges. Duolingo energy, money edition.", tone: "lime" as const },
            { icon: <FlaskConical size={20} />, t: "What-if simulator", d: "“What if I save ₹1,000/mo?” Watch annual savings animate. Plus income lab for side hustles.", tone: "pink" as const },
          ].map((f, i) => (
            <motion.div key={f.t} {...fade} transition={{ ...fade.transition, delay: i * 0.05 }}>
              <Card className="group h-full transition hover:-translate-y-1 hover:border-lime-300/25">
                <div className="mb-3 grid h-11 w-11 place-items-center rounded-2xl bg-lime-300/12 text-lime-200 transition group-hover:scale-110">{f.icon}</div>
                <h3 className="font-display text-lg font-bold">{f.t}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-white/55">{f.d}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* COACH + WRAPPED band */}
      <section id="coach" className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="grid gap-4 lg:grid-cols-2">
          <motion.div {...fade}>
            <Card glow className="h-full">
              <Badge tone="pink">AI Money Coach</Badge>
              <h3 className="font-display mt-3 text-2xl font-extrabold">“I have ₹3,000 left and 12 days.”</h3>
              <div className="mt-4 space-y-2.5">
                <div className="ml-auto w-fit max-w-[90%] rounded-2xl rounded-br-md bg-lime-300/15 px-4 py-2.5 text-sm">Where did most of my money go? 👀</div>
                <div className="w-fit max-w-[95%] rounded-2xl rounded-bl-md border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white/80">Food — ₹1,820 of ₹5,906 total (31%). Next: Shopping ₹1,419. Want a 7-day quest to trim it 10%?</div>
              </div>
              <Link href="/coach" className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-lime-200 hover:underline">Try the coach <ArrowRight size={15} /></Link>
            </Card>
          </motion.div>
          <motion.div {...fade} transition={{ ...fade.transition, delay: 0.08 }} id="wrapped">
            <Card className="h-full bg-gradient-to-br from-violet-600/25 via-fuchsia-600/15 to-transparent">
              <Badge tone="violet">Money Wrapped</Badge>
              <h3 className="font-display mt-3 text-2xl font-extrabold">Your September, in stories ✨</h3>
              <p className="mt-2 text-sm text-white/60">“₹15,300 moved through your wallet.” Then animated cards: top category, spiciest day, savings glow-up, month-over-month.</p>
              <div className="mt-4 flex gap-2">
                {["💸 ₹5.9k spent", "🍜 Food era", "🔥 6-day streak"].map((c) => (
                  <span key={c} className="rounded-full border border-white/15 bg-black/40 px-3 py-1.5 text-xs font-semibold">{c}</span>
                ))}
              </div>
              <Link href="/wrapped" className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-violet-200 hover:underline">See a sample Wrapped <ArrowRight size={15} /></Link>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section id="quests" className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <motion.div {...fade} className="glass glow-border relative overflow-hidden rounded-[2rem] p-8 text-center sm:p-14">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(600px_circle_at_50%_-10%,rgba(190,242,100,0.18),transparent_70%)]" />
          <h2 className="font-display relative text-3xl font-extrabold sm:text-5xl">Your wallet is fighting for its life.<br /><span className="bg-gradient-to-r from-lime-200 to-emerald-200 bg-clip-text text-transparent">Give it a coach, not a lecture.</span></h2>
          <p className="relative mx-auto mt-4 max-w-md text-white/60">Free to start. Demo data included so it never looks empty. Clear it whenever.</p>
          <div className="relative mt-7 flex flex-wrap justify-center gap-3">
            <Link href="/dashboard" className="rounded-2xl bg-gradient-to-r from-lime-300 to-emerald-300 px-8 py-4 font-bold text-black shadow-[0_0_35px_rgba(190,242,100,0.4)] transition hover:-translate-y-0.5">Start Tracking — it's free</Link>
            <Link href="/wrapped" className="rounded-2xl border border-white/15 px-8 py-4 font-bold transition hover:bg-white/5">Peek at Wrapped</Link>
          </div>
        </motion.div>
        <footer className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-white/8 pt-6 text-xs text-white/40">
          <span className="font-display font-bold text-white/60">BrokeBro — the finance app students actually open.</span>
          <span>Education & organization tool. Not investment advice. Never store bank passwords here. 🔒</span>
        </footer>
      </section>
    </div>
  );
}
