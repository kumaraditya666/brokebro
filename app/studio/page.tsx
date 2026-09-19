import type { Metadata } from "next";
import { Suspense } from "react";
import StudioClient from "@/components/roasted/StudioClient";

export const metadata: Metadata = {
  title: "Studio — ROASTED INDIA 🇮🇳",
  description: "Upload photo, chat or situation. Pick Hinglish style. Generate desi roast or meme.",
};

export default function StudioRoute() {
  return (
    <Suspense fallback={<div className="grid min-h-screen place-items-center bg-ink text-white/60">Loading studio... 🔥</div>}>
      <StudioClient />
    </Suspense>
  );
}
