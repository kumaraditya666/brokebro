import type { Metadata } from "next";
import "./globals.css";

import { Analytics } from "@vercel/analytics/next"

export const metadata: Metadata = {
  title: "BrokeBro — Know where your money disappears",
  description: "Your money. Your chaos. Finally organized. Student budgeting, splits, quests, Money Wrapped & AI Money Coach.",
  icons: { icon: "/favicon.svg" },
  openGraph: {
    title: "BrokeBro",
    description: "The finance app college students actually WANT to open.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=Baloo+2:wght@500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap"
          rel="stylesheet"
        />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      </head>
      <body className="grain min-h-screen bg-ink font-body antialiased">
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-xl focus:bg-lime-300 focus:px-4 focus:py-2 focus:font-bold focus:text-black">
          Skip to content
        </a>
        <div id="main">{children}</div>
      </body>
      <Analytics />
    </html>
  );
}
