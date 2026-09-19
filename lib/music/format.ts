export function formatTime(sec?: number | null): string {
  if (sec == null || !isFinite(sec) || sec < 0) return "0:00";
  const s = Math.floor(sec);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

export function greeting(name = "BRO"): string {
  const h = new Date().getHours();
  if (h < 5) return `UP LATE, ${name}`;
  if (h < 12) return `GOOD MORNING, ${name}`;
  if (h < 17) return `GOOD AFTERNOON, ${name}`;
  if (h < 22) return `GOOD EVENING, ${name}`;
  return `LATE NIGHT, ${name}`;
}

export function timeAgo(ts: number): string {
  const d = Date.now() - ts;
  const min = Math.floor(d / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString();
}

export function uid(prefix = "id"): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function parseFileName(name: string): { artist: string; title: string } {
  const base = name.replace(/\.[a-z0-9]+$/i, "").replace(/_/g, " ").trim();
  const parts = base.split(/\s+-\s+/);
  if (parts.length >= 2) return { artist: parts[0].trim() || "Unknown artist", title: parts.slice(1).join(" - ").trim() || base };
  return { artist: "Local files", title: base || "Untitled" };
}
