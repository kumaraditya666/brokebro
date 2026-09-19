// Safety: keep roasts savage-but-playful, never abusive.
// Blocks threats, hate, sexual content, doxxing, protected-characteristic jokes.

const BLOCKED = [
  /kill|murder|suicide|self-?harm|stab|shoot|bomb|attack\b/i,
  /hate\s+(muslim|hindu|christian|sikh|dalit|brahmin|girl|women|gay|trans)/i,
  /\b(chutiya|randi|bsdk|mc\b.*maa|behen.*chod)/i,
  /\b\d{10}\b/, // phone numbers
  /\b\d{4}\s?\d{4}\s?\d{4}\b/, // aadhaar-ish
  /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/, // emails
  /\b(address|ghar ka pata|gps location)\b.*\d+/i,
  / Minor|nangi|nude|porn|sex\b/i,
];

const PROTECTED_HINTS = [
  /caste/i, /religion/i, /muslim/i, /hindu/i, /skin\s?color/i, /fairness/i,
  /disability/i, /mental\s?illness/i, /gay/i, /trans/i,
];

export function isUnsafeInput(text: string): boolean {
  if (!text) return false;
  if (BLOCKED.some((r) => r.test(text))) return true;
  return false;
}

export function sanitizeContext(text: string): string {
  return text
    .replace(/\b\d{10}\b/g, "[number hataya]")
    .replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, "[email hataya]")
    .slice(0, 280);
}

export function deflectMessage(): string {
  return "Bhai savage kar sakte hain, harmful nahi 😂 — thoda light context de, solid roast banata hoon. 🔥";
}

export function isProtectedTargeting(text: string): boolean {
  return PROTECTED_HINTS.some((r) => r.test(text));
}
