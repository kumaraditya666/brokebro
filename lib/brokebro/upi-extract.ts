import { z } from "zod";
import { suggestCategory } from "./categorize";

/** Structured extraction result. Every field is user-editable; missing => null ("Unknown"/"Not detected"). */
export const ExtractionSchema = z.object({
  amount: z.number().positive().nullable(),
  currency: z.string().default("INR"),
  merchant: z.string().nullable(),
  date: z.string().nullable(), // ISO yyyy-mm-dd or null
  time: z.string().nullable(), // "7:32 PM" style or null
  transactionId: z.string().nullable(),
  upiId: z.string().nullable(),
  status: z.enum(["Successful", "Pending", "Failed", "Unknown"]).default("Unknown"),
  paymentApp: z.string().nullable(),
  paymentMethod: z.enum(["UPI", "Card", "Cash", "Bank transfer", "Wallet", "Unknown"]).default("Unknown"),
  txnType: z.enum(["Expense", "Income", "Refund", "Unknown"]).default("Unknown"),
  suggestedCategory: z.string().default("Other"),
  /** ₹→"3" auto-fix (see fixRupeeThree): corrected value + original digits. */
  amountFixed: z.boolean().default(false),
  rawAmount: z.number().nullable().default(null),
  confidence: z.object({
    amount: z.enum(["high", "low", "missing"]),
    merchant: z.enum(["high", "low", "missing"]),
    date: z.enum(["high", "low", "missing"]),
    transactionId: z.enum(["high", "low", "missing"]),
  }),
  refundDetected: z.boolean().default(false),
  rawText: z.string().default(""),
  engine: z.string().default("unknown"),
});

export type Extraction = z.infer<typeof ExtractionSchema>;

const APP_KEYS: Array<[string, string[]]> = [
  ["Google Pay", ["google pay", "gpay"]],
  ["PhonePe", ["phonepe", "phone pe"]],
  ["Paytm", ["paytm"]],
  ["BHIM", ["bhim"]],
];

const STATUS_OK = ["successful", "success", "completed", "paid successfully", "payment successful", "debited"];
const STATUS_PENDING = ["pending", "processing", "in progress"];
const STATUS_FAILED = ["failed", "failure", "declined", "cancelled", "canceled"];

/** Lines like "Total Spent" are summaries — never a transaction amount. */
const SUMMARY_LINE = /total spent|opening balance|closing balance|total paid|grand total/i;

const MONTHS: Record<string, string> = {
  jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
  jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12",
};

const FULL_MONTHS = "january|february|march|april|may|june|july|august|september|october|november|december";

/** Category chips printed on history rows (Food, Travel, Money Transfer …). */
const CHIP_CATS: Array<[RegExp, string]> = [
  [/\bfood\b/i, "Food"],
  [/\btravel\b|metro|flight/i, "Travel"],
  [/money transfer/i, "Other"],
  [/\bshopping\b/i, "Shopping"],
  [/entertainment|movie/i, "Entertainment"],
  [/bill|recharge|electricity/i, "Bills"],
  [/health|medical/i, "Health"],
  [/education|fees|course/i, "Education"],
];

/** Parse visible OCR text into a structured extraction. Never invents: absent => null. */
export function parseUpiText(raw: string, engine = "local-ocr-v1"): Extraction {
  const text = raw.replace(/\r/g, "\n");
  const low = text.toLowerCase();

  // ---- amount: prefer ₹-prefixed numbers, else largest plausible near pay keywords.
  // Amounts on summary lines ("Total Spent ₹6,537.45") are never transactions.
  const lineOf = (idx: number) => text.slice(0, idx).split("\n").length - 1;
  const lines = text.split("\n");
  let amount: number | null = null;
  let amountConf: "high" | "low" | "missing" = "missing";
  const rsMatches = [...text.matchAll(/(?:₹|rs\.?|inr)\s?([\d,]+(?:\.\d{1,2})?)/gi)];
  if (rsMatches.length > 0) {
    const vals = rsMatches
      .filter((m) => !SUMMARY_LINE.test(lines[lineOf(m.index ?? 0)] ?? ""))
      .map((m) => Number(m[1].replace(/,/g, "")))
      .filter((n) => Number.isFinite(n) && n > 0);
    if (vals.length > 0) {
      amount = Math.max(...vals);
      amountConf = "high";
    }
  }
  if (amount == null) {
    // OCR often misreads ₹ as % ("Paid -%250", "Paid %250 to Zomato").
    const pct = text.match(/(?:^|[^\d\w])(?:-\s?%\s?([\d,]+(?:\.\d{1,2})?)|(?:paid|sent|amount)\s+%\s?([\d,]+(?:\.\d{1,2})?))(?!\s*:)/i);
    if (pct) {
      const n = Number(((pct[1] ?? pct[2]) as string).replace(/,/g, ""));
      if (Number.isFinite(n) && n > 0 && n < 10000000) {
        amount = n;
        amountConf = "low";
      }
    }
  }
  let amountFixed = false;
  let rawAmount: number | null = null;
  if (amount == null) {
    // Fallback: number near a payment keyword — but NEVER a date fragment
    // ("19 Sep", "19/09") or a year. Date parts are not money.
    const re = /(paid|received|refund|amount|total)([^\d₹]{0,20})([\d,]+(?:\.\d{1,2})?)/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(low)) != null) {
      const after = low.slice(m.index + m[0].length, m.index + m[0].length + 8);
      if (/^\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|\/|-)/i.test(after)) continue;
      const digits = m[3].replace(/,/g, "");
      const n = Number(digits);
      if (Number.isFinite(n) && n > 0 && n < 10000000) {
        // Same ₹→3 guard as history rows: bare "-3XX" after a pay verb.
        if (!/[₹%]/.test(m[0]) && /(?:^|[^\d])-\s?$/.test(m[2]) && !/,/.test(m[3])) {
          const fix = fixRupeeThree(digits);
          if (fix.fixed) {
            amount = fix.value;
            rawAmount = n;
            amountFixed = true;
            amountConf = "low";
            break;
          }
        }
        amount = n;
        amountConf = "low";
        break;
      }
    }
  }

  // ---- merchant: "Paid ₹X to NAME" / "Received ... from NAME" / "To NAME"
  let merchant: string | null = null;
  let merchantConf: "high" | "low" | "missing" = "missing";
  const paidTo = text.match(/(?:paid|sent|transferred)[^\n]{0,40}?\bto\s+([A-Za-z0-9&.'\- ]{2,40})/i);
  const recvFrom = text.match(/(?:received|got)[^\n]{0,40}?\bfrom\s+([A-Za-z0-9&.'\- ]{2,40})/i);
  const toLine = !paidTo && !recvFrom ? text.match(/^\s*(?:to|merchant|payee|paid to)\s*[:\-]?\s*([A-Za-z0-9&.'\- ]{2,40})/im) : null;
  const rawMerchant = (paidTo?.[1] ?? recvFrom?.[1] ?? toLine?.[1] ?? "").trim().replace(/\s{2,}.*$/, "").trim();
  if (rawMerchant && !/^\d+$/.test(rawMerchant)) {
    merchant = titleCase(rawMerchant.slice(0, 40));
    merchantConf = paidTo || recvFrom ? "high" : "low";
  }
  // Fallback for receipt layouts like "R S Foods and Caterers\nPaid on 17 Sep, 01:55 PM"
  // (verb + date, merchant on the line above, no "to"). Never invents: needs a real name line.
  if (!merchant) {
    const onMatch = text.match(/(paid|sent|received)\s+on\s+\d{1,2}\s+[a-z]{3,9}/i);
    if (onMatch) {
      const before = text.slice(0, onMatch.index).split("\n").map((l) => l.trim()).filter(Boolean);
      const candidate = before[before.length - 1] ?? "";
      if (
        /^[A-Za-z][A-Za-z0-9&.'\- ]{1,40}$/.test(candidate) &&
        !/payment history|total spent|september|october|january|february|march|april|june|july|august|november|december/i.test(candidate) &&
        !/₹|\d{4,}/.test(candidate)
      ) {
        merchant = titleCase(candidate);
        merchantConf = "low";
      }
    }
  }

  // ---- date: 19 Sep 2026 / 19-09-2026 / 19/09/26 (year optional → assume current year, low conf)
  let date: string | null = null;
  let dateConf: "high" | "low" | "missing" = "missing";
  const months = MONTHS;
  // (the (?!\s*:) guard stops "17 Sep, 01:55 PM" from reading the hour "01" as year 2001)
  const dmy = text.match(/(\d{1,2})\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\s*,?\s*(\d{2,4})(?!\s*:)/i);
  const numd = !dmy ? text.match(/(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/) : null;
  if (dmy) {
    const y = dmy[3].length === 2 ? `20${dmy[3]}` : dmy[3];
    const m = months[dmy[2].slice(0, 3).toLowerCase()];
    date = `${y}-${m}-${dmy[1].padStart(2, "0")}`;
    dateConf = "high";
  } else if (numd) {
    let [d, m, y] = [numd[1], numd[2], numd[3]];
    if (y.length === 2) y = `20${y}`;
    if (Number(d) <= 31 && Number(m) <= 12) {
      date = `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
      dateConf = "low"; // dd/mm vs mm/dd ambiguity
    }
  }
  if (!date) {
    // Dateless year ("17 Sep, 01:55 PM" on history rows) → assume current year, low confidence.
    // Digits followed by ":" are a time ("01:55"), not a year — don't let them block the match.
    const noYear = text.match(/(\d{1,2})\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\b(?!\s*,?\s*\d{2,4}(?!\s*:))/i);
    if (noYear) {
      const m = months[noYear[2].slice(0, 3).toLowerCase()];
      date = `${new Date().getFullYear()}-${m}-${noYear[1].padStart(2, "0")}`;
      dateConf = "low";
    }
  }

  // ---- time: 7:32 PM
  const tm = text.match(/(\d{1,2}:\d{2}(?::\d{2})?\s?(?:am|pm)?)/i);
  const time = tm ? tm[1].toUpperCase().replace(/\s+/g, " ") : null;

  // ---- transaction / UTR id
  let transactionId: string | null = null;
  let txnConf: "high" | "low" | "missing" = "missing";
  const utr = text.match(/(?:utr|utrn|transaction id|txn id|upi transaction id|ref(?:erence)?(?: id| no| number)?|order id)\s*[:#\-]?\s*([A-Za-z0-9]{6,30})/i);
  if (utr && !/^(id|no|number)$/i.test(utr[1])) {
    transactionId = utr[1].trim();
    txnConf = "high";
  }

  // ---- UPI id
  const upi = text.match(/([a-zA-Z0-9._-]{2,40}@[a-zA-Z]{2,20})/);
  const upiId = upi ? upi[1] : null;

  // ---- status
  let status: Extraction["status"] = "Unknown";
  if (STATUS_OK.some((k) => low.includes(k))) status = "Successful";
  else if (STATUS_PENDING.some((k) => low.includes(k))) status = "Pending";
  else if (STATUS_FAILED.some((k) => low.includes(k))) status = "Failed";

  // ---- app
  let paymentApp: string | null = null;
  for (const [app, keys] of APP_KEYS) {
    if (keys.some((k) => low.includes(k))) {
      paymentApp = app;
      break;
    }
  }

  // ---- type: refund > received/income > paid/expense
  const isRefund = /refund/i.test(text);
  let txnType: Extraction["txnType"] = "Unknown";
  if (isRefund) txnType = "Refund";
  else if (/(received|credited|money received|cashback)/i.test(text)) txnType = "Income";
  else if (/(paid|sent|debited|transferred|payment)/i.test(text)) txnType = "Expense";

  const paymentMethod: Extraction["paymentMethod"] = /upi/i.test(text) || paymentApp ? "UPI" : "Unknown";
  const suggestedCategory = merchant ? suggestCategory(`${amount ?? ""} ${merchant}`).category : "Other";

  const result = {
    amount,
    amountFixed,
    rawAmount,
    currency: /usd|\$/i.test(text) && !/₹/.test(text) ? "USD" : "INR",
    merchant,
    date,
    time,
    transactionId,
    upiId,
    status,
    paymentApp,
    paymentMethod,
    txnType,
    suggestedCategory,
    confidence: { amount: amountConf, merchant: merchantConf, date: dateConf, transactionId: txnConf },
    refundDetected: isRefund,
    rawText: raw.slice(0, 2000),
    engine,
  };
  return ExtractionSchema.parse(result);
}

/**
 * History-screen support (e.g. Paytm "Payment History": a list of rows, not one receipt).
 * Detects the layout and parses EVERY row into its own review candidate.
 * The statement header year ("September 2026") is used when rows carry no year.
 */
export function isHistoryScreen(raw: string): boolean {
  if (/(payment history|transaction history|total spent|mini statement|passbook)/i.test(raw)) return true;
  const rows = raw.match(/(paid|sent|received)\s+on\s+\d{1,2}\s+[a-z]{3,9}/gi);
  return (rows?.length ?? 0) >= 2;
}

/**
 * Clean a history merchant line from real OCR output. Handles:
 * - trailing amounts in any misread form: " -320", " -%15", " - ₹20"
 * - avatar/initial prefixes: "VH Vicky Haldar", "KK Kiran Kumari"
 * - OCR artifacts: "Fo] RS Foods", "& RS Foods", "a Delhi Metro"
 * Returns null when the line isn't a merchant (chips, headers, summaries).
 */
export function cleanHistoryMerchant(line: string): string | null {
  let s = line.trim().replace(/\s+/g, " ");
  // Strip trailing amount (₹ often misread as % / 3 or dropped: "-320", "-%15", "- ₹20").
  s = s.replace(/\s*-?\s?[%₹]?\s?[\d,]+(?:\.\d{1,2})?\s*$/, "");
  // Strip leading avatar junk (max 3 tokens). A 2-letter all-caps token is only
  // junk when it spells the initials of the name behind it ("VH Vicky Haldar",
  // "KK Kiran Kumari") — otherwise it's real ("RS Foods" = merged "R S").
  for (let i = 0; i < 3; i++) {
    const m = s.match(/^([^\s]{1,4})\s+(.+)$/);
    if (!m) break;
    const tok = m[1];
    const words = m[2].split(/\s+/);
    const isInitialsOfName =
      /^[A-Z]{2}$/.test(tok) &&
      words.length >= 2 &&
      words[0][0]?.toUpperCase() === tok[0] &&
      words[1][0]?.toUpperCase() === tok[1];
    const junk =
      /[\]@&>()»|]/.test(tok) ||
      /^[a-z]$/.test(tok) ||
      (tok.length <= 4 && /\d/.test(tok)) ||
      isInitialsOfName;
    if (!junk) break;
    s = m[2];
  }
  s = s.trim().replace(/\s+/g, " ");
  if (s.length < 2) return null;
  if (SUMMARY_LINE.test(s) || /payment history/i.test(s)) return null;
  if (/^(food|money transfer|travel|to|from|paid|sent|received)$/i.test(s)) return null;
  if (!/[A-Za-z]{2,}/.test(s)) return null;
  return titleCase(s.slice(0, 42));
}

/** Amount token in OCR-soup: "-320", "-%15", "- ₹20", "₹250". Bare digits need a debit dash. Times ("01:55") never match via the colon guard. */
const HISTORY_AMT = /-\s?[%₹]?\s?([\d,]+(?:\.\d{1,2})?)(?!\s*:)|[%₹]\s?([\d,]+(?:\.\d{1,2})?)(?!\s*:)/;

/**
 * Tesseract reads the small ₹ glyph as "3": true ₹20 arrives as "-320".
 * Discriminator: genuine ₹300+ renders WITH its symbol ("- ₹320", still
 * carrying %/₹ or a comma), while a bare dash + exactly 3 digits starting
 * with 3 and no symbol/comma is overwhelmingly ₹XX with ₹→3.
 * ALWAYS flagged (fixed:true + raw) so review UI shows it and one tap reverts.
 * Residual risk: a genuine ₹3XX whose symbol vanished completely looks identical
 * — the visible flag + revert exists precisely for that case.
 */
export function fixRupeeThree(digitsNoComma: string): { value: number; fixed: boolean } {
  if (/^3\d{2}$/.test(digitsNoComma)) {
    return { value: Number(digitsNoComma.slice(1)), fixed: true };
  }
  return { value: Number(digitsNoComma), fixed: false };
}

function historyAmount(text: string): { value: number; symbol: boolean; fixed: boolean; raw: number | null } | null {
  const m = text.match(HISTORY_AMT);
  if (!m) return null;
  const rawDigits = (m[1] ?? m[2]).replace(/,/g, "");
  const n = Number(rawDigits);
  if (!Number.isFinite(n) || n <= 0) return null;
  const symbol = /[%₹]/.test(m[0]);
  if (m[2] !== undefined || symbol || /,/.test(m[1] ?? "")) {
    // Symbol (or Indian comma grouping) survived → trust the digits.
    return { value: n, symbol, fixed: false, raw: null };
  }
  // Bare dash amount: check for ₹→3, else low-confidence transcription.
  const fix = fixRupeeThree(rawDigits);
  return { value: fix.value, symbol: false, fixed: fix.fixed, raw: fix.fixed ? n : null };
}

export function parseUpiHistoryText(raw: string, engine = "local-ocr-v1", fallbackYear?: number): Extraction[] {
  const text = raw.replace(/\r/g, "\n");
  const lines = text.split("\n").map((l) => l.trim());
  const year =
    fallbackYear ??
    Number(text.match(new RegExp(`(${FULL_MONTHS})\\s+(20\\d{2})`, "i"))?.[2] ?? new Date().getFullYear());

  let paymentApp: string | null = null;
  for (const [app, keys] of APP_KEYS) {
    if (keys.some((k) => text.toLowerCase().includes(k))) {
      paymentApp = app;
      break;
    }
  }

  // Line-based: anchor on "Paid|Sent|Received on 17 Sep, 01:55 PM" lines, because
  // OCR scrambles column order (amount often lands on the merchant line, chips
  // below the date line). Merchant = nearest name-like line above.
  const dateRe = /(Paid|Sent|Received)\s+on\s+(\d{1,2})\s+([A-Za-z]{3,9}),?\s+(\d{1,2}:\d{2}\s?(?:AM|PM)?)/i;
  const out: Extraction[] = [];

  lines.forEach((line, idx) => {
    const d = line.match(dateRe);
    if (!d || out.length >= 25) return;
    const [, verb, day, monRaw, timeRaw] = d;
    const mon = MONTHS[monRaw.slice(0, 3).toLowerCase()];
    if (!mon) return;

    // Merchant: scan up to 3 lines above, skipping blanks/chips/other date lines.
    let merchant: string | null = null;
    for (let k = idx - 1; k >= Math.max(0, idx - 3); k--) {
      const cand = lines[k];
      if (!cand || dateRe.test(cand)) break;
      if (/^[@&a-zA-Z]{1,3}\s?(food|money transfer|travel)$/i.test(cand)) continue;
      merchant = cleanHistoryMerchant(cand);
      if (merchant) break;
    }

    // Amount: merchant-line trailing > date-line remainder > next 2 lines.
    const merchLine = idx > 0 ? lines[idx - 1] : "";
    const afterTime = line.slice((d.index ?? 0) + d[0].length);
    const ahead = lines.slice(idx + 1, idx + 3).join(" ");
    const amt = historyAmount(merchLine) ?? historyAmount(afterTime) ?? historyAmount(ahead);
    if (amt == null) return;
    const { value: amount, symbol: amountSymbol, fixed: amountFixed, raw: rawAmount } = amt;

    const window = [...lines.slice(Math.max(0, idx - 1), idx + 3)].join(" ");
    let chipCat: string | null = null;
    for (const [re, cat] of CHIP_CATS) {
      if (re.test(window)) {
        chipCat = cat;
        break;
      }
    }
    const suggested = chipCat ?? (merchant ? suggestCategory(merchant).category : "Other");

    out.push(
      ExtractionSchema.parse({
        amount,
        amountFixed,
        rawAmount,
        currency: "INR",
        merchant,
        date: `${year}-${mon}-${day.padStart(2, "0")}`,
        time: timeRaw.toUpperCase().replace(/\s+/g, " "),
        transactionId: null,
        upiId: null,
        status: "Successful",
        paymentApp,
        paymentMethod: "UPI",
        txnType: verb.toLowerCase() === "received" ? "Income" : "Expense",
        suggestedCategory: suggested,
        confidence: { amount: amountFixed || !amountSymbol ? "low" : "high", merchant: merchant ? "high" : "missing", date: "low", transactionId: "missing" },
        refundDetected: false,
        rawText: `${merchLine} | ${line}`.slice(0, 300),
        engine,
      })
    );
  });
  return out;
}

/** Demo extraction for ENABLE_DEMO_OCR mode. Clearly labeled, never used silently. */
export function demoExtraction(): Extraction {
  return ExtractionSchema.parse({
    amount: 249,
    currency: "INR",
    merchant: "Zomato",
    date: "2026-09-19",
    time: "7:32 PM",
    transactionId: "DEMO12345678",
    upiId: "zomato@upi",
    status: "Successful",
    paymentApp: "Google Pay",
    paymentMethod: "UPI",
    txnType: "Expense",
    suggestedCategory: "Food",
    confidence: { amount: "high", merchant: "high", date: "high", transactionId: "low" },
    refundDetected: false,
    rawText: "[demo] Paid ₹249 to Zomato on 19 Sep 2026, 7:32 PM. UPI Transaction ID: DEMO12345678",
    engine: "demo-mock-v1",
  });
}

export interface ExistingRef {
  id: string;
  amount: number;
  date: string; // ISO
  note: string;
  category: string;
  transactionId?: string | null;
}

/** Duplicate check: strong signal on transactionId match; otherwise amount+date+merchant. Pure — never writes. */
export function findDuplicate(
  ext: { amount: number | null; date: string | null; merchant: string | null; transactionId: string | null },
  existing: ExistingRef[]
): { duplicate: ExistingRef | null; strong: boolean } {
  if (ext.transactionId) {
    const hit = existing.find((e) => e.transactionId && e.transactionId.toLowerCase() === ext.transactionId!.toLowerCase());
    if (hit) return { duplicate: hit, strong: true };
  }
  if (ext.amount != null && ext.date) {
    const day = ext.date.slice(0, 10);
    const merch = (ext.merchant ?? "").toLowerCase();
    const hit = existing.find((e) => {
      if (Math.abs(e.amount - ext.amount!) > 0.5) return false;
      if (e.date.slice(0, 10) !== day) return false;
      if (merch && !`${e.note} ${e.category}`.toLowerCase().includes(merch)) return false;
      return true;
    });
    if (hit) return { duplicate: hit, strong: false };
  }
  return { duplicate: null, strong: false };
}

/** Review gate — screenshots must NEVER auto-save. This helper exists so tests can pin the invariant. */
export function requiresUserConfirmation(): true {
  return true;
}

function titleCase(s: string) {
  return s
    .split(/\s+/)
    .map((w) => {
      if (/^[A-Z0-9]{2,3}$/.test(w)) return w; // initials: RS, UPI
      if (/^['-]|['-]$/.test(w)) return w;
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    })
    .join(" ");
}
