import { NextResponse } from "next/server";
import { cookies } from "next/headers";

/**
 * Web Share Target receiver (manifest share_target → Gallery → Share → BrokeBro).
 * Privacy: the image lives ONLY in server memory, max 5 minutes, one-shot
 * (deleted on pickup). Never logged, never persisted, never cached.
 * Single-instance note: on multi-instance hosts the pickup may miss — the
 * client then gracefully falls back to manual file pick.
 */

interface Stash {
  buf: Buffer;
  type: string;
  name: string;
  at: number;
}

const stash = new Map<string, Stash>();
const TTL = 5 * 60 * 1000;
const ALLOWED = new Set(["image/png", "image/jpeg", "image/webp"]);
const MAX = 10 * 1024 * 1024;

function sweep() {
  const now = Date.now();
  for (const [k, v] of stash) if (now - v.at > TTL) stash.delete(k);
}

export async function POST(req: Request) {
  sweep();
  try {
    const form = await req.formData();
    const vals = form.getAll("screenshot");
    const file = vals.find((v): v is File => v instanceof File && v.size > 0) ?? null;
    if (!file || !ALLOWED.has(file.type) || file.size > MAX) {
      return NextResponse.redirect(new URL("/expenses?shared=bad", req.url), 303);
    }
    const buf = Buffer.from(await file.arrayBuffer());
    const token = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
    stash.set(token, { buf, type: file.type, name: file.name || "shared-image", at: Date.now() });
    cookies().set("bb_share", token, { maxAge: 300, sameSite: "lax", path: "/" });
    return NextResponse.redirect(new URL("/expenses?shared=1", req.url), 303);
  } catch {
    return NextResponse.redirect(new URL("/expenses?shared=bad", req.url), 303);
  }
}

/** One-shot pickup for the client (cookie token). Deletes on read. */
export async function GET(req: Request) {
  sweep();
  const token = cookies().get("bb_share")?.value ?? new URL(req.url).searchParams.get("token") ?? "";
  const hit = token ? stash.get(token) : undefined;
  if (!hit) return NextResponse.json({ error: "Nothing shared (or expired). Pick the file manually." }, { status: 404 });
  stash.delete(token);
  return new Response(new Blob([new Uint8Array(hit.buf)], { type: hit.type }), {
    headers: {
      "Content-Type": hit.type,
      "Content-Disposition": `inline; filename="${hit.name.replace(/"/g, "")}"`,
      "Cache-Control": "no-store",
    },
  });
}
