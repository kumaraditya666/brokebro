import { NextResponse } from "next/server";
import { analyzeChat } from "@/lib/roasted/engine";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const text = String(body.text ?? "").slice(0, 20000);
    const awards = analyzeChat(text || "bhai kal se pakka plan trust me khana cricket");
    return NextResponse.json({ awards });
  } catch {
    return NextResponse.json({ error: "Chat samajh nahi aaya 😅" }, { status: 500 });
  }
}
