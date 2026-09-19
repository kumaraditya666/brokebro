import { NextResponse } from "next/server";
import { mockReferenceAnalysis } from "@/server/vocalforge/audioAnalysis";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, size, durationSec } = body as { name: string; size: number; durationSec: number };
    if (!name || typeof size !== "number" || typeof durationSec !== "number") {
      return NextResponse.json({ error: "Reference analysis needs { name, size, durationSec }." }, { status: 400 });
    }
    // Production-traits only — the service never models identity.
    const analysis = mockReferenceAnalysis(String(name), size, durationSec);
    return NextResponse.json({ analysis, engine: "mock-backend-v1" });
  } catch {
    return NextResponse.json({ error: "Could not analyze the reference. You can continue without one." }, { status: 500 });
  }
}
