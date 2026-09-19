import { analyzeChat, generateDesiMeme, generateGroupWrapped, generateRoast, generateRoastVariations } from "./engine";
import type { Language, RoastRequest, RoastStyle } from "./types";

// Clean AI service abstraction. Client calls these; they try the
// server API first (where a real model key would live in env only),
// and fall back to the on-device mock engine so demo always works.
// No API keys are ever referenced in frontend code.

async function post<T>(path: string, body: unknown, fallback: () => T): Promise<T> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 6000);
    const res = await fetch(path, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    clearTimeout(t);
    if (!res.ok) throw new Error("api");
    return (await res.json()) as T;
  } catch {
    return fallback();
  }
}

export async function generateRoastAI(req: RoastRequest) {
  return post("/api/roast", req, () => ({
    variations: generateRoastVariations(req, 3),
    primary: generateRoast(req),
  }));
}

export async function generateMemeAI(situation: string, language: Language) {
  return post("/api/meme", { situation, language }, () => ({
    meme: generateDesiMeme(situation, language),
  }));
}

export async function analyzeChatAI(text: string) {
  return post("/api/chat", { text }, () => ({ awards: analyzeChat(text) }));
}

export async function wrappedAI(text: string) {
  return post("/api/wrapped", { text }, () => ({ stats: generateGroupWrapped(text) }));
}

export type { RoastRequest, RoastStyle, Language };
