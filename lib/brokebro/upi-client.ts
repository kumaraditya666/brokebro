"use client";
import { ExtractionSchema, isHistoryScreen, parseUpiHistoryText, parseUpiText, type Extraction } from "./upi-extract";

export interface ExtractOutcome {
  /** First candidate (single-receipt flow). */
  extraction: Extraction;
  /** All candidates — 1 for receipts, N for history screens. Review UI iterates this. */
  extractions: Extraction[];
  engine: string;
  demo: boolean;
  history: boolean;
}

/**
 * extractTransactionFromImage() — the single client entry point.
 * 1) POSTs to the secure server endpoint (validates file, demo mock if enabled,
 *    or {available:false} when no server OCR is configured — a normal state).
 * 2) Falls back to on-device OCR (tesseract.js, lazy-loaded, no API keys).
 *    First run needs internet to fetch the reader (~2 MB) and can take 10–30s.
 * Returns a REVIEW CANDIDATE only. Callers must show confirmation UI;
 * nothing here touches the store or database.
 */
export async function extractTransactionFromImage(file: File): Promise<ExtractOutcome> {
  const allowed = ["image/png", "image/jpeg", "image/webp"];
  if (!allowed.includes(file.type)) throw new Error("bad-type");
  if (file.size <= 0 || file.size > 10 * 1024 * 1024) throw new Error("bad-size");

  try {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/upi-extract", { method: "POST", body: form });
    const j: Record<string, unknown> = await res.json().catch(() => ({}));
    if (res.ok && j.extraction) {
      const parsed = ExtractionSchema.safeParse(j.extraction);
      if (parsed.success)
        return { extraction: parsed.data, extractions: [parsed.data], engine: String(j.engine ?? "server"), demo: !!j.demo, history: false };
      // Server returned something unexpected — fall through to on-device OCR,
      // unless it's an explicit rejection of the file itself.
    }
    if (res.status === 415) throw new Error("bad-type");
    if (res.status === 413) throw new Error("bad-size");
    if (!res.ok && j.available !== false && !j.extraction) throw new Error("server-error");
    // else: {available:false} or unparseable → on-device OCR below
  } catch (e) {
    if (e instanceof Error && ["bad-type", "bad-size", "server-error"].includes(e.message)) throw e;
    // network failure → on-device OCR below
  }

  try {
    const { createWorker } = await import("tesseract.js");
    const worker = await createWorker("eng");
    try {
      const { data } = await worker.recognize(file);
      const text = (data.text ?? "").trim();
      if (text.length < 3) throw new Error("ocr-empty");
      // History screens (Paytm Payment History etc.) yield one candidate PER ROW.
      if (isHistoryScreen(text)) {
        const rows = parseUpiHistoryText(text, "local-ocr-v1");
        if (rows.length > 0) return { extraction: rows[0], extractions: rows, engine: "local-ocr-v1", demo: false, history: true };
      }
      const single = parseUpiText(text, "local-ocr-v1");
      return { extraction: single, extractions: [single], engine: "local-ocr-v1", demo: false, history: false };
    } finally {
      await worker.terminate().catch(() => {});
    }
  } catch (e) {
    if (e instanceof Error && e.message === "ocr-empty") throw new Error("ocr-empty");
    throw new Error("ocr-failed");
  }
}
