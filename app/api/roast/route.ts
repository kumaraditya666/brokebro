import { NextResponse } from "next/server";
import { generateRoast, generateRoastVariations } from "@/lib/roasted/engine";

// POST /api/roast { style, language, target, context, name, hasImage }
// NOTE: a real LLM key would be read here via process.env only — never sent to client.
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const style = body.style ?? "desi";
    const language = body.language ?? "hinglish";
    const target = body.target ?? "friend";
    const context = String(body.context ?? "").slice(0, 500);
    const name = String(body.name ?? "").slice(0, 40);
    // Simulated latency for realistic loading states
    await new Promise((r) => setTimeout(r, 500));
    const primary = generateRoast({ style, language, target, context, name, hasImage: !!body.hasImage });
    const variations = generateRoastVariations({ style, language, target, context, name }, 3);
    return NextResponse.json({ primary, variations });
  } catch {
    return NextResponse.json({ error: "Roast machine thak gaya 😅" }, { status: 500 });
  }
}
