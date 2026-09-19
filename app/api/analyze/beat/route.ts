import { NextResponse } from "next/server";
import { mockBeatAnalysis } from "@/server/vocalforge/audioAnalysis";

const MAX_MB = 150;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, size, durationSec } = body as { name: string; size: number; durationSec: number };
    if (!name || typeof size !== "number" || typeof durationSec !== "number") {
      return NextResponse.json({ error: "Beat analysis needs { name, size, durationSec }." }, { status: 400 });
    }
    if (size > MAX_MB * 1024 * 1024) {
      return NextResponse.json({ error: `Beat exceeds the ${MAX_MB} MB prototype limit.` }, { status: 413 });
    }
    // Real backend: decode with ffmpeg/essentia here. Mock: deterministic.
    const analysis = mockBeatAnalysis(String(name), size, durationSec);
    return NextResponse.json({ analysis, engine: "mock-backend-v1" });
  } catch {
    return NextResponse.json({ error: "Could not analyze the beat. Try a different MP3/WAV/M4A file." }, { status: 500 });
  }
}
