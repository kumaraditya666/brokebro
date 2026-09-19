import { NextResponse } from "next/server";
import { mockVocalAnalysis } from "@/server/vocalforge/audioAnalysis";

const MAX_MB = 150;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, size, durationSec } = body as { name: string; size: number; durationSec: number };
    if (!name || typeof size !== "number" || typeof durationSec !== "number") {
      return NextResponse.json({ error: "Vocal analysis needs { name, size, durationSec }." }, { status: 400 });
    }
    if (size > MAX_MB * 1024 * 1024) {
      return NextResponse.json({ error: `Vocal exceeds the ${MAX_MB} MB prototype limit.` }, { status: 413 });
    }
    const analysis = mockVocalAnalysis(String(name), size, durationSec);
    return NextResponse.json({ analysis, engine: "mock-backend-v1" });
  } catch {
    return NextResponse.json({ error: "Could not analyze the vocal. Try a clean WAV/MP3/M4A recording." }, { status: 500 });
  }
}
