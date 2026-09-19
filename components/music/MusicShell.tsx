// BROKE MUSIC — app shell: top nav, mobile bottom nav, global shortcuts,
// dynamic backdrop colors, cursor, drawers + players.
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Compass, Heart, Home, Keyboard, LibraryBig, ListMusic, Search, Settings2 } from "lucide-react";
import { extractArtworkColors, fallbackColors } from "@/lib/music/colors";
import { useMusicLibrary } from "@/store/useMusicLibrary";
import { Backdrop } from "./Backdrop";
import { CustomCursor } from "./CustomCursor";
import { FullPlayer } from "./FullPlayer";
import { InstallPrompt } from "./InstallPrompt";
import { MiniPlayer } from "./MiniPlayer";
import { usePlayer } from "./PlayerProvider";
import { QueueDrawer } from "./QueueDrawer";
import { ShortcutsModal } from "./ShortcutsModal";

const NAV = [
  { href: "/", label: "Home", icon: Home },
  { href: "/discover", label: "Discover", icon: Compass },
  { href: "/search", label: "Search", icon: Search },
  { href: "/library", label: "Library", icon: LibraryBig },
  { href: "/playlists", label: "Playlists", icon: ListMusic },
];

function isMusicRoute(path: string): boolean {
  return (
    path === "/" ||
    path.startsWith("/discover") ||
    path.startsWith("/search") ||
    path.startsWith("/library") ||
    path.startsWith("/playlists") ||
    path.startsWith("/liked") ||
    path.startsWith("/history") ||
    path.startsWith("/music-settings")
  );
}

export function MusicShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentTrack, setQueueOpen, setFullOpen, togglePlay, next, previous, toggleMute, seek, currentTime, duration } = usePlayer();
  const [colors, setColors] = useState<[string, string, string]>(["#bef264", "#34d399", "#8b5cf6"]);
  const [shortcuts, setShortcuts] = useState(false);
  const dynamic = useMusicLibrary((s) => s.settings.dynamicColors);
  const likesCount = useMusicLibrary((s) => Object.keys(s.likes).length);

  useEffect(() => {
    if (!currentTrack?.artwork || !dynamic) {
      if (!dynamic) setColors(fallbackColors("broke"));
      return;
    }
    extractArtworkColors(currentTrack.artwork, currentTrack.id).then(setColors);
  }, [currentTrack?.artwork, currentTrack?.id, dynamic]);

  // global keyboard shortcuts (desktop)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (document.activeElement?.tagName ?? "").toLowerCase();
      const typing = tag === "input" || tag === "textarea" || (document.activeElement as HTMLElement)?.isContentEditable;
      if (e.key === "Escape") {
        setShortcuts(false);
        setQueueOpen(false);
        setFullOpen(false);
        return;
      }
      if (typing) return;
      if (e.key === " ") {
        e.preventDefault();
        togglePlay();
      } else if (e.key === "ArrowRight") {
        if (duration - currentTime < 5) next();
        else seek(currentTime + 10);
      } else if (e.key === "ArrowLeft") {
        if (currentTime > 3) seek(currentTime - 10);
        else previous();
      } else if (e.key === "m" || e.key === "M") toggleMute();
      else if (e.key === "f" || e.key === "F") {
        if (currentTrack) setFullOpen(true);
      } else if (e.key === "q" || e.key === "Q") setQueueOpen(true);
      else if (e.key === "/") {
        e.preventDefault();
        router.push("/search");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [togglePlay, next, previous, toggleMute, seek, currentTime, duration, currentTrack, router, setQueueOpen, setFullOpen]);

  if (!isMusicRoute(pathname ?? "")) return <>{children}</>;

  return (
    <>
      <CustomCursor />
      <Backdrop colors={colors} />
      {/* top nav */}
      <header className="safe-top sticky top-0 z-[55] border-b border-white/8 bg-black/55 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-3 py-2.5 sm:gap-3 sm:px-5">
          <Link href="/" className="flex items-center gap-2.5" aria-label="BROKE MUSIC home" data-magnetic>
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-lime-300 to-emerald-400 text-base font-black text-black shadow-glow">B</span>
            <span className="leading-none">
              <span className="font-display block text-[15px] font-extrabold tracking-tight text-white">BROKE MUSIC</span>
              <span className="block text-[10px] font-semibold text-white/40">Music without the clutter.</span>
            </span>
          </Link>
          <nav aria-label="Primary" className="ml-2 hidden items-center gap-1 md:flex">
            {NAV.map((n) => {
              const active = pathname === n.href;
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  data-magnetic
                  className={`rounded-full px-4 py-2 text-[13px] font-bold transition ${
                    active ? "bg-lime-300/12 text-lime-200" : "text-white/55 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {n.label}
                </Link>
              );
            })}
          </nav>
          <div className="ml-auto flex items-center gap-1.5">
            <Link href="/liked" aria-label="Liked songs" data-magnetic className="relative grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/5 text-white/70 hover:text-pink-300">
              <Heart size={16} />
              {likesCount > 0 && (
                <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-pink-500 px-1 text-[10px] font-black text-white">
                  {likesCount > 99 ? "99+" : likesCount}
                </span>
              )}
            </Link>
            <button onClick={() => setShortcuts(true)} aria-label="Keyboard shortcuts" className="hidden h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/5 text-white/60 hover:text-white sm:grid">
              <Keyboard size={16} />
            </button>
            <Link href="/music-settings" aria-label="Settings" data-magnetic className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/5 text-white/70 hover:text-white">
              <Settings2 size={16} />
            </Link>
            <span className="ml-1 hidden h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-sm font-black text-white sm:grid" title="Guest bro (sign-in optional)">
              B
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-3 pb-48 pt-6 sm:px-5 sm:pb-44">{children}</main>

      {/* mobile bottom nav */}
      <nav aria-label="Mobile" className="safe-bottom fixed inset-x-0 bottom-0 z-[58] border-t border-white/8 bg-black/75 backdrop-blur-xl sm:hidden">
        <div className={`grid ${currentTrack ? "pt-1" : ""}`} style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
          {[
            { href: "/", label: "Home", icon: Home },
            { href: "/search", label: "Search", icon: Search },
            { href: "/library", label: "Library", icon: LibraryBig },
            { href: "/music-settings", label: "You", icon: Settings2 },
          ].map((n) => {
            const active = pathname === n.href;
            return (
              <Link key={n.href} href={n.href} className={`flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-bold ${active ? "text-lime-300" : "text-white/45"}`}>
                <n.icon size={20} />
                {n.label}
              </Link>
            );
          })}
        </div>
        {currentTrack && <div className="h-[86px]" />}
      </nav>

      <MiniPlayer />
      <FullPlayer />
      <QueueDrawer />
      <InstallPrompt />
      <ShortcutsModal open={shortcuts} onClose={() => setShortcuts(false)} />
    </>
  );
}
