import { NextResponse } from "next/server";
import { generateDesiMeme } from "@/lib/roasted/engine";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    await new Promise((r) => setTimeout(r, 400));
    const meme = generateDesiMeme(String(body.situation ?? "friendship"), body.language ?? "hinglish");
    return NextResponse.json({ meme });
  } catch {
    return NextResponse.json({ error: "Meme machine busy 😅" }, { status: 500 });
  }
}
