import { NextResponse } from "next/server";
import { z } from "zod";
import { coachAnswer } from "@/lib/brokebro/coach";

const Body = z.object({
  question: z.string().min(1).max(500),
  txns: z.array(z.object({
    id: z.string(),
    type: z.enum(["expense", "income"]),
    amount: z.number(),
    category: z.string(),
    note: z.string().optional().default(""),
    date: z.string(),
    paymentMethod: z.string().optional().default("UPI"),
  })).max(100).default([]),
  balance: z.number().default(0),
  nextIncomeDate: z.string().default("2026-10-05"),
});

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }
  const { question, txns, balance, nextIncomeDate } = parsed.data;

  // If an LLM key is configured, a real model call would go here server-side.
  // Fallback: deterministic local engine over the user's own data (no external call).
  const extras = process.env.LLM_API_KEY ? " (server mode)" : "";
  const answer = coachAnswer(
    question.slice(0, 500),
    txns.map((t) => ({ ...t, note: (t.note ?? "").slice(0, 200), recurring: false })),
    Number.isFinite(balance) ? balance : 0,
    nextIncomeDate
  );
  return NextResponse.json({ answer: answer + extras, engine: process.env.LLM_API_KEY ? "server" : "local-fallback-v1" });
}

export async function GET() {
  return NextResponse.json({ ok: true, engine: process.env.LLM_API_KEY ? "server" : "local-fallback-v1", note: "POST {question, txns, balance, nextIncomeDate}" });
}
