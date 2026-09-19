"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import { Flame, Menu, X } from "lucide-react";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#070605]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-amber-400 via-orange-500 to-pink-600 shadow-glow">
            <Flame className="h-5 w-5 text-white" />
          </span>
          <span className="font-display text-lg font-bold tracking-tight">
            ROASTED <span className="fire-text">INDIA</span>
            <span className="ml-1 text-sm">🇮🇳</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-7 text-sm text-white/70 md:flex">
          <Link className="transition hover:text-white" href="/studio">Studio</Link>
          <Link className="transition hover:text-white" href="/wrapped">Group Wrapped</Link>
          <Link className="transition hover:text-white" href="/studio?mode=meme">Desi Memes</Link>
          <Link className="transition hover:text-white" href="/studio?mode=chat">Chat Roast</Link>
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/studio?demo=1"
            className="pressable rounded-full border border-white/15 px-4 py-2 text-sm text-white/80 hover:border-white/30 hover:text-white"
          >
            Try Demo
          </Link>
          <Link
            href="/studio"
            className="pressable rounded-full bg-gradient-to-r from-amber-400 via-orange-500 to-pink-600 px-5 py-2 text-sm font-bold text-black shadow-glow hover:brightness-110"
          >
            ROAST SOMEONE 🔥
          </Link>
        </div>
        <button
          className="pressable rounded-lg border border-white/10 p-2 md:hidden"
          onClick={() => setOpen(!open)}
          aria-label="menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-t border-white/10 bg-[#0c0a09] px-4 py-4 md:hidden"
        >
          <div className="grid gap-2">
            {[
              ["/studio", "🔥 Studio — Roast Someone"],
              ["/wrapped", "🎁 Group Wrapped"],
              ["/studio?mode=meme", "😂 Desi Meme Maker"],
              ["/studio?mode=chat", "💬 Chat Roast"],
              ["/studio?demo=1", "✨ Try Demo"],
            ].map(([href, label]) => (
              <Link
                key={href + label}
                href={href}
                onClick={() => setOpen(false)}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold"
              >
                {label}
              </Link>
            ))}
          </div>
        </motion.div>
      )}
    </header>
  );
}
