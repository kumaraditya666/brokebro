import { NextResponse } from "next/server";
import { generateMixInstructions } from "@/server/vocalforge/aiMixService";

/**
 * POST /api/mix/generate — AIService.generateMixInstructions()
 * Body: { beat, vocal, reference|null, prompt, referenceInfluence }
 * The LLM + DSP solver will live here. Frontend never implements this.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { beat, vocal, prompt, referenceInfluence } = body;
    if (!beat || !vocal) {
      return NextResponse.json(
        { error: "Upload both a beat and a vocal before creating your mix." },
        { status: 422 }
      );
    }
    const mix = generateMixInstructions({
      beat,
      vocal,
      reference: body.reference ?? null,
      prompt: String(prompt ?? ""),
      referenceInfluence: Number(referenceInfluence ?? 50),
    });
    return NextResponse.json({ mix });
  } catch {
    return NextResponse.json(
      { error: "The AI mix failed to build. Your files are safe — try again." },
      { status: 500 }
    );
  }
}
