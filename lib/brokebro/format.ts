import { CURRENCY_SYMBOLS, type Currency } from "./types";

export function fmtMoney(amount: number, currency: Currency = "INR", opts: { decimals?: number } = {}) {
  const sym = CURRENCY_SYMBOLS[currency] ?? "₹";
  const d = opts.decimals ?? (Math.abs(amount) < 1000 && amount % 1 !== 0 ? 2 : 0);
  const n = Math.abs(amount).toLocaleString("en-IN", { maximumFractionDigits: d, minimumFractionDigits: d });
  return `${amount < 0 ? "-" : ""}${sym}${n}`;
}

export function uid(prefix = "id") {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function daysUntil(dateISO: string, now = new Date()) {
  const t = new Date(dateISO).getTime();
  if (Number.isNaN(t)) return 0;
  const diff = t - new Date(now.toDateString()).getTime();
  return Math.max(0, Math.ceil(diff / 86400000));
}

export function monthKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}
