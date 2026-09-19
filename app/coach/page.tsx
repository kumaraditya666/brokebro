"use client";
import { useState } from "react";
import { Send, Sparkles } from "lucide-react";
import { AppShell } from "@/components/brokebro/AppShell";
import { Card, PageHeader, Badge } from "@/components/brokebro/ui";
import { currentMonthTxns, useBroke } from "@/lib/brokebro/store";
import { calculateBalance } from "@/lib/brokebro/calc";
import { monthKey } from "@/lib/brokebro/format";
import { COACH_SUGGESTIONS, coachAnswer } from "@/lib/brokebro/coach";

interface Msg { role: "user" | "coach"; text: string; }

export default function CoachPage() {
  const txns = useBroke((s) => s.transactions);
  const profile = useBroke((s) => s.profile);
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: "coach", text: `Hey ${profile.name || "bestie"} 👋 I'm your Money Coach. I read ONLY your logged data — no finance-bro advice, no stock tips. Ask me where your money went.` },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  const month = currentMonthTxns(txns, monthKey(new Date("2026-09-19")));
  const scope = month.length ? month : txns;
  const { balance } = calculateBalance(scope);

  const ask = async (q: string) => {
    const question = q.trim();
    if (!question || busy) return;
    setMsgs((m) => [...m, { role: "user", text: question }]);
    setInput("");
    setBusy(true);
    // Try server route first (works when AI key configured), fall back to local engine.
    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, txns: scope.slice(0, 80), balance, nextIncomeDate: profile.nextIncomeDate }),
      });
      if (res.ok) {
        const j = await res.json();
        if (j?.answer) {
          setMsgs((m) => [...m, { role: "coach", text: j.answer }]);
          setBusy(false);
          return;
        }
      }
    } catch { /* local fallback */ }
    await new Promise((r) => setTimeout(r, 500));
    setMsgs((m) => [...m, { role: "coach", text: coachAnswer(question, scope, balance, profile.nextIncomeDate || "2026-10-05") }]);
    setBusy(false);
  };

  return (
    <AppShell>
      <PageHeader kicker="AI · local-first" title="Money Coach" sub="Explains YOUR spending with YOUR numbers. Shows assumptions. Never pretends to be a financial professional." />
      <div className="mx-auto max-w-2xl">
        <Card className="min-h-[50vh]">
          <div className="space-y-3" aria-live="polite">
            {msgs.map((m, i) => (
              <div key={i} className={`max-w-[92%] whitespace-pre-line rounded-2xl px-4 py-3 text-sm leading-relaxed ${m.role === "user" ? "ml-auto rounded-br-md bg-lime-300/15 border border-lime-300/20" : "rounded-bl-md border border-white/10 bg-white/5 text-white/85"}`}>
                {m.role === "coach" && <p className="mb-1 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-lime-300/80"><Sparkles size={11} /> Coach</p>}
                {m.text}
              </div>
            ))}
            {busy && (
              <div className="flex gap-1.5 rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 w-fit" aria-label="Coach is typing">
                {[0, 1, 2].map((d) => <span key={d} className="typing-dot h-2 w-2 rounded-full bg-lime-300" style={{ animationDelay: `${d * 0.15}s` }} />)}
              </div>
            )}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {COACH_SUGGESTIONS.slice(0, 4).map((s) => (
              <button key={s} onClick={() => ask(s)} className="rounded-full border border-white/12 bg-white/5 px-3 py-1.5 text-xs text-white/65 hover:border-lime-300/40 hover:text-white">{s}</button>
            ))}
          </div>
          <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); ask(input); }}>
            <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask: Can I afford ₹700?" className="w-full rounded-2xl border border-white/12 bg-black/40 px-4 py-3 text-sm outline-none placeholder:text-white/30 focus:border-lime-300/60" aria-label="Ask money coach" />
            <button type="submit" className="grid h-[46px] w-[52px] shrink-0 place-items-center rounded-2xl bg-gradient-to-r from-lime-300 to-emerald-300 text-black transition hover:-translate-y-0.5" aria-label="Send"><Send size={17} /></button>
          </form>
          <p className="mt-2 text-[11px] text-white/35">Educational tool. Not investment / loan / tax advice. If Supabase + LLM key absent, runs on-device with your data. 🔒</p>
        </Card>
      </div>
    </AppShell>
  );
}
