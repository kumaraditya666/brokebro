import { NextResponse } from "next/server";
import { generateGroupWrapped } from "@/lib/roasted/engine";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const stats = generateGroupWrapped(String(body.text ?? "bhai ".repeat(50)));
    return NextResponse.json({ stats });
  } catch {
    return NextResponse.json({ error: "Wrapped phas gaya 😅" }, { status: 500 });
  }
}
