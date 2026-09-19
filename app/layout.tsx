import type { Metadata, Viewport } from "next";
import "./globals.css";

import { Analytics } from "@vercel/analytics/next"
import { SplashKiller } from "@/components/brokebro/SplashKiller";
import { PlayerProvider } from "@/components/music/PlayerProvider";
import { MusicShell } from "@/components/music/MusicShell";

export const metadata: Metadata = {
  title: "BROKE MUSIC — Your music. One player. Zero bullshit.",
  description: "Ad-free universal music player: licensed catalogs, Creative Commons, your local files, playlists, offline shell. Music without the clutter.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/favicon.svg",
    apple: "/icons/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "BROKE MUSIC",
  },
  formatDetection: { telephone: false },
  openGraph: {
    title: "BROKE MUSIC",
    description: "Your music. One player. Zero bullshit.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover", // enables safe-area env() on notched phones
  themeColor: "#050505",
};

// Runs before paint: applies saved theme (no light-flash) — no PII, no tracking.
const THEME_BOOT = `(function(){try{var t=JSON.parse(localStorage.getItem('brokebro-v1')||'{}');var m=(t&&t.state&&t.state.prefs&&t.state.prefs.theme)||'system';var light=m==='light'||(m==='system'&&window.matchMedia('(prefers-color-scheme: light)').matches);if(light)document.documentElement.classList.add('theme-light');}catch(e){}})();`;

// Theme boot must stay (pre-paint, no flash). The splash node itself is removed
// by React AFTER hydration (see PwaBoot) — timer-based removal races hydration
// and crashes it, so there is deliberately no timer here.

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=Baloo+2:wght@500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap"
          rel="stylesheet"
        />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT }} />
      </head>
      <body className="grain min-h-screen bg-ink font-body antialiased">
        <div id="boot-splash" aria-hidden>
          <div className="boot-logo">B</div>
        </div>
        <SplashKiller />
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-xl focus:bg-lime-300 focus:px-4 focus:py-2 focus:font-bold focus:text-black">
          Skip to content
        </a>
        <PlayerProvider>
          <MusicShell>
            <div id="main">{children}</div>
          </MusicShell>
        </PlayerProvider>
      </body>
      <Analytics />
    </html>
  );
}
