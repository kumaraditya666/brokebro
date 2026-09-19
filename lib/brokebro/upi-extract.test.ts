import { describe, expect, it } from "vitest";
import {
  ExtractionSchema,
  cleanHistoryMerchant,
  demoExtraction,
  findDuplicate,
  isHistoryScreen,
  parseUpiHistoryText,
  parseUpiText,
  requiresUserConfirmation,
} from "./upi-extract";

const SAMPLE = `Google Pay
Paid ₹249 to Zomato
19 Sep 2026, 7:32 PM
UPI Transaction ID: 418273649102
Payment successful`;

describe("upi screenshot extraction", () => {
  it("extracts a valid transaction", () => {
    const r = parseUpiText(SAMPLE, "test");
    expect(r.amount).toBe(249);
    expect(r.merchant).toBe("Zomato");
    expect(r.date).toBe("2026-09-19");
    expect(r.time).toMatch(/7:32/);
    expect(r.transactionId).toBe("418273649102");
    expect(r.status).toBe("Successful");
    expect(r.paymentApp).toBe("Google Pay");
    expect(r.paymentMethod).toBe("UPI");
    expect(r.txnType).toBe("Expense");
    expect(r.suggestedCategory).toBe("Food");
    expect(ExtractionSchema.safeParse(r).success).toBe(true);
  });

  it("missing amount => null, never guessed", () => {
    const r = parseUpiText("Paid to Zomato\n19 Sep 2026\nSuccessful");
    expect(r.amount).toBeNull();
    expect(r.confidence.amount).toBe("missing");
  });

  it("missing merchant => null (Unknown in UI)", () => {
    const r = parseUpiText("Paid ₹500\n19 Sep 2026\nUTR 123456789012");
    expect(r.merchant).toBeNull();
    expect(r.amount).toBe(500);
  });

  it("detects refunds and income", () => {
    expect(parseUpiText("Refund of ₹300 to source").txnType).toBe("Refund");
    expect(parseUpiText("Refund of ₹300 to source").refundDetected).toBe(true);
    expect(parseUpiText("Received ₹2000 from Rahul").txnType).toBe("Income");
  });

  it("detects duplicates: strong on txn id, weak on amount+date+merchant", () => {
    const existing = [
      { id: "a", amount: 249, date: "2026-09-19T10:00:00Z", note: "Zomato dinner", category: "Food", transactionId: "418273649102" },
    ];
    const strong = findDuplicate({ amount: 999, date: "2026-01-01", merchant: "Other", transactionId: "418273649102" }, existing);
    expect(strong.duplicate?.id).toBe("a");
    expect(strong.strong).toBe(true);
    const weak = findDuplicate({ amount: 249, date: "2026-09-19", merchant: "Zomato", transactionId: null }, existing);
    expect(weak.duplicate?.id).toBe("a");
    expect(weak.strong).toBe(false);
    const none = findDuplicate({ amount: 100, date: "2026-09-19", merchant: "Uber", transactionId: null }, existing);
    expect(none.duplicate).toBeNull();
  });

  it("malformed AI output fails Zod validation", () => {
    expect(ExtractionSchema.safeParse({ amount: "lots", merchant: 42 }).success).toBe(false);
  });

  it("failed OCR text yields Unknowns, not inventions", () => {
    const r = parseUpiText("blurry pixels no data here");
    expect(r.amount).toBeNull();
    expect(r.merchant).toBeNull();
    expect(r.status).toBe("Unknown");
  });

  it("screenshots NEVER auto-save: confirmation gate is pinned", () => {
    // The import pipeline has no code path that writes to the store/API
    // without an explicit user press of "Add Expense". This pins the gate helper.
    expect(requiresUserConfirmation()).toBe(true);
  });

  it("demo extraction is labeled as mock", () => {
    expect(demoExtraction().engine).toBe("demo-mock-v1");
  });

  it("ignores summary headers like Total Spent", () => {
    const r = parseUpiText("September 2026\nTotal Spent ₹6,537.45\nPaid ₹20 to R S Foods\n19 Sep 2026\nSuccessful");
    expect(r.amount).toBe(20);
  });

  it("finds merchant on the line above 'Paid on DATE' (Paytm receipt layout)", () => {
    const r = parseUpiText("R S Foods and Caterers\nPaid on 17 Sep, 01:55 PM\n- ₹20\nSuccessful", "test");
    expect(r.merchant).toBe("R S Foods And Caterers");
    expect(r.amount).toBe(20);
  });

  it("infers current year for dateless dates instead of giving up", () => {
    const r = parseUpiText("Paid ₹20\nPaid on 17 Sep, 01:55 PM", "test");
    expect(r.date).toBe(`${new Date().getFullYear()}-09-17`);
    expect(r.confidence.date).toBe("low");
  });
});

const HISTORY_SAMPLE = `Payment History
September 2026 Total Spent ₹6,537.45
R S Foods and Caterers
Paid on 17 Sep, 01:55 PM Food
- ₹20 From
Mr VINOD KUMAR
Sent on 17 Sep, 10:07 AM Money Transfer
- ₹15 From
Vicky Haldar
Sent on 17 Sep, 09:05 AM Money Transfer
- ₹20 From
R S Foods Caterers
Paid on 16 Sep, 01:20 PM Food
- ₹40 From
Brewtique Solutions
Paid on 16 Sep, 12:10 PM Food
- ₹120 From
Kiran Kumari
Sent on 16 Sep, 09:54 AM Money Transfer
- ₹15 From
Delhi Metro Rail Corp Ltd
Paid on 16 Sep, 09:00 AM Travel
- ₹200 From
paytm Powered by UPI`;

/** Verbatim OCR output from a real Paytm history screenshot (tesseract, 83% conf).
 *  Note the damage: ₹ misread as % or dropped ("-%15", "-320"), avatar junk
 *  prefixes ("Fo]", "VH", "&", "KK", "a"). The parser must survive all of it. */
const REAL_OCR = `& Payment History Q
September 2026 Beso) ob >
Fo] RS Foods and Caterers -320
Paid on 17 Sep, 01:55 PM From @
@ Food
Mr VINOD KUMAR -%15
Sent on 17 Sep, 10:07 AM From @
U8 Money Transfer
VH Vicky Haldar -%20
Sent on 17 Sep, 09:05 AM From @
LE Money Transfer
& RS Foods Caterers -340
Paid on 16 Sep, 01:20 PM From @
@ Food
& Brewtique Solutions -%120
Paid on 16 Sep, 12:10 PM From @
@ Food
KK Kiran Kumari -315
Sent on 16 Sep, 09:54 AM From @
LE Money Transfer
a Delhi Metro Rail Corp Ltd -%200
Paid on 16 Sep, 09:00 AM From @
J Travel
paytm | x LIP»`;

describe("real-world OCR damage", () => {
  it("parses all 7 rows from genuine tesseract output (year from header)", () => {
    expect(isHistoryScreen(REAL_OCR)).toBe(true);
    const rows = parseUpiHistoryText(REAL_OCR, "test"); // no year arg → "September 2026" header
    // ₹→3 auto-fix: rows reading "-320"/"-340"/"-315" become ₹20/₹40/₹15,
    // flagged (amountFixed + rawAmount) so review shows the correction + revert.
    expect(rows.map((r) => [r.merchant, r.amount])).toEqual([
      ["RS Foods And Caterers", 20],
      ["Mr Vinod Kumar", 15],
      ["Vicky Haldar", 20],
      ["RS Foods Caterers", 40],
      ["Brewtique Solutions", 120],
      ["Kiran Kumari", 15],
      ["Delhi Metro Rail Corp Ltd", 200],
    ]);
    expect(rows.map((r) => r.amountFixed)).toEqual([true, false, false, true, false, true, false]);
    expect(rows.map((r) => r.rawAmount)).toEqual([320, null, null, 340, null, 315, null]);
    expect(rows[0].date).toBe("2026-09-17");
    expect(rows[6].date).toBe("2026-09-16");
    expect(rows[0].confidence.amount).toBe("low"); // corrected, not certain
    expect(rows[1].confidence.amount).toBe("high"); // "-%15", % survived
    expect(rows[0].suggestedCategory).toBe("Food");
    expect(rows[6].suggestedCategory).toBe("Travel");
    expect(rows.every((r) => ExtractionSchema.safeParse(r).success)).toBe(true);
  });

  it("never strips a genuine symbol-carrying ₹3xx amount", () => {
    const rows = parseUpiHistoryText("Canteen\nPaid on 17 Sep, 01:55 PM\n- ₹320\nSuccessful", "test", 2026);
    expect(rows[0].amount).toBe(320);
    expect(rows[0].amountFixed).toBe(false);
    // 4-digit bare amounts are left alone (₹3,150 vs ₹150 is unknowable) — low conf.
    const big = parseUpiHistoryText("Canteen\nPaid on 17 Sep, 01:55 PM\n-3200\nSuccessful", "test", 2026);
    expect(big[0].amount).toBe(3200);
    expect(big[0].amountFixed).toBe(false);
  });

  it("single parser fixes bare -3XX after pay verbs, flagged", () => {
    const r = parseUpiText("Paid -320 to Canteen\n19 Sep 2026\nSuccessful", "test");
    expect(r.amount).toBe(20);
    expect(r.amountFixed).toBe(true);
    expect(r.rawAmount).toBe(320);
    const genuine = parseUpiText("Paid ₹350 to Canteen\n19 Sep 2026\nSuccessful", "test");
    expect(genuine.amount).toBe(350);
    expect(genuine.amountFixed).toBe(false);
  });

  it("cleans avatar junk but keeps real initials", () => {
    expect(cleanHistoryMerchant("Fo] RS Foods and Caterers -320")).toBe("RS Foods And Caterers");
    expect(cleanHistoryMerchant("VH Vicky Haldar -%20")).toBe("Vicky Haldar");
    expect(cleanHistoryMerchant("KK Kiran Kumari -315")).toBe("Kiran Kumari");
    expect(cleanHistoryMerchant("& RS Foods Caterers -340")).toBe("RS Foods Caterers");
    expect(cleanHistoryMerchant("a Delhi Metro Rail Corp Ltd -%200")).toBe("Delhi Metro Rail Corp Ltd");
    expect(cleanHistoryMerchant("R S Foods and Caterers -320")).toBe("R S Foods And Caterers");
    expect(cleanHistoryMerchant("Mr VINOD KUMAR -%15")).toBe("Mr Vinod Kumar");
    expect(cleanHistoryMerchant("@ Food")).toBeNull();
    expect(cleanHistoryMerchant("September 2026 Total Spent")).toBeNull();
  });

  it("single parser tolerates % misread as ₹", () => {
    expect(parseUpiText("Paid %250 to Zomato\n19 Sep 2026\nSuccessful", "test").amount).toBe(250);
  });
});

describe("upi history screens", () => {
  it("detects history layout", () => {
    expect(isHistoryScreen(HISTORY_SAMPLE)).toBe(true);
    expect(isHistoryScreen(SAMPLE)).toBe(false);
  });

  it("parses every row, uses header year, skips the Total Spent header", () => {
    const rows = parseUpiHistoryText(HISTORY_SAMPLE, "test", 2026);
    expect(rows.map((r) => [r.merchant, r.amount])).toEqual([
      ["R S Foods And Caterers", 20],
      ["Mr Vinod Kumar", 15],
      ["Vicky Haldar", 20],
      ["R S Foods Caterers", 40],
      ["Brewtique Solutions", 120],
      ["Kiran Kumari", 15],
      ["Delhi Metro Rail Corp Ltd", 200],
    ]);
    expect(rows[0].date).toBe("2026-09-17");
    expect(rows[0].time).toMatch(/01:55/);
    expect(rows[0].suggestedCategory).toBe("Food");
    expect(rows[6].suggestedCategory).toBe("Travel");
    expect(rows.every((r) => r.txnType === "Expense")).toBe(true);
    expect(rows.every((r) => r.paymentApp === "Paytm")).toBe(true);
    // The ₹6,537.45 summary must not leak into any row.
    expect(rows.every((r) => r.amount !== 6537.45)).toBe(true);
    expect(rows.every((r) => ExtractionSchema.safeParse(r).success)).toBe(true);
  });
});
