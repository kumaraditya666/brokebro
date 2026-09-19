import { Suspense } from "react";
import RoastIdClient from "@/components/roasted/RoastIdClient";

export async function generateMetadata() {
  return {
    title: "You got roasted — ROASTED INDIA 🇮🇳",
    description: "Bhai, evidence mil gaya 😂 Think you can survive one?",
  };
}

export default function RoastIdRoute() {
  return (
    <Suspense fallback={<div className="grid min-h-screen place-items-center bg-ink text-white/60">Loading roast... 🔥</div>}>
      <RoastIdClient />
    </Suspense>
  );
}
