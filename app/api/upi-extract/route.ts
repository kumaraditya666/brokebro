import { NextResponse } from "next/server";
import { demoExtraction } from "@/lib/brokebro/upi-extract";

const ALLOWED = new Set(["image/png", "image/jpeg", "image/webp"]);
const MAX_BYTES = 10 * 1024 * 1024;

/**
 * POST /api/upi-extract — multipart { file }.
 * Validates the upload, then:
 *  - demo mode (ALLOW_DEMO_OCR=true): returns a CLEARLY LABELED mock extraction for UI testing.
 *  - otherwise: 503 OCR_UNAVAILABLE — the client falls back to on-device OCR (tesseract.js, no keys).
 * NEVER writes a transaction. Only returns a candidate for user review.
 * Never logs image contents or payment data.
 */
export async function POST(req: Request) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid upload" }, { status: 400 });
  }
  const file = form.get("file");
  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: "No file attached" }, { status: 400 });
  }
  const mime = file.type;
  if (!ALLOWED.has(mime)) {
    return NextResponse.json({ error: "Unsupported file type. Use PNG, JPG or WEBP." }, { status: 415 });
  }
  if (file.size <= 0 || file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File too large. Max 10 MB." }, { status: 413 });
  }

  // Server-side vision/OCR provider would plug in here (keys stay server-side).
  // Until one is configured, be honest: demo mock only when explicitly enabled.
  if (process.env.ALLOW_DEMO_OCR === "true" || process.env.ENABLE_DEMO_OCR === "true") {
    return NextResponse.json({ extraction: demoExtraction(), engine: "demo-mock-v1", demo: true });
  }

  // NOTE: 200 (not 503) on purpose — "no server OCR" is a normal state, not an
  // error. The client silently falls back to on-device reading. A 5xx here only
  // shows up as scary red noise in the browser console even though it's handled.
  return NextResponse.json({
    available: false,
    message: "Server OCR is not configured. The app will try on-device reading instead.",
  });
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    usage: "POST multipart {file: png|jpg|webp ≤10MB} → {extraction} candidate for review. Never auto-saves.",
    demo: process.env.ALLOW_DEMO_OCR === "true" || process.env.ENABLE_DEMO_OCR === "true",
  });
}
