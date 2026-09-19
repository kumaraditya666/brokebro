const KEY = "roasted_india_history_v1";
const SAVED = "roasted_india_saved_v1";

export interface HistoryItem {
  id: string;
  kind: "roast" | "meme";
  text: string;
  meta: string;
  at: number;
}

export function getHistory(): HistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function pushHistory(item: HistoryItem) {
  if (typeof window === "undefined") return;
  try {
    const h = getHistory();
    h.unshift(item);
    localStorage.setItem(KEY, JSON.stringify(h.slice(0, 50)));
    window.dispatchEvent(new Event("roasted-history"));
  } catch {}
}

export function downloadText(filename: string, text: string) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export async function shareOrCopy(text: string): Promise<"shared" | "copied"> {
  if (navigator.share) {
    try {
      await navigator.share({ text, title: "ROASTED INDIA 🇮🇳" });
      return "shared";
    } catch {
      // fall through to copy
    }
  }
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
  }
  return "copied";
}

export function downloadCard(canvas: HTMLCanvasElement, name = "roasted-india.png") {
  const a = document.createElement("a");
  a.href = canvas.toDataURL("image/png");
  a.download = name;
  a.click();
}
