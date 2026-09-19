import Link from "next/link";

export default function Footer() {
  return (
    <footer className="relative z-10 border-t border-white/10 bg-black/60">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-2">
          <p className="font-display text-2xl font-black">ROASTED <span className="fire-text">INDIA</span> 🇮🇳</p>
          <p className="mt-2 max-w-sm text-sm text-white/60">
            Desi friends. Desi roasts. Dosti gayi, meme bach gaya. 😂 Savage-but-playful only — harmful nahi.
          </p>
          <p className="mt-3 text-xs text-white/40">
            Original captions & characters. No scraped movie screenshots — upload your own or use our original templates.
          </p>
        </div>
        <div>
          <p className="text-xs font-black tracking-widest text-white/50">CREATE</p>
          <div className="mt-3 grid gap-2 text-sm text-white/70">
            <Link href="/studio" className="hover:text-white">🔥 Roast Studio</Link>
            <Link href="/studio?mode=meme" className="hover:text-white">😂 Desi Meme Maker</Link>
            <Link href="/studio?mode=chat" className="hover:text-white">💬 Chat Roast</Link>
            <Link href="/wrapped" className="hover:text-white">🎁 Group Wrapped</Link>
          </div>
        </div>
        <div>
          <p className="text-xs font-black tracking-widest text-white/50">HOUSE RULES</p>
          <div className="mt-3 grid gap-2 text-sm text-white/60">
            <span>💛 Friends first, feelings safe</span>
            <span>🚫 No hate, threats, doxxing</span>
            <span>📱 Ask before posting faces</span>
            <span>😂 Savage ok, harmful nahi</span>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-white/40">
        Made with 🔥 in India • Bhai, evidence mil gaya • © 2026 ROASTED INDIA
      </div>
    </footer>
  );
}
