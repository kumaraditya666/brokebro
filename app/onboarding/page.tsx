"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Sparkles } from "lucide-react";
import { Card, Btn, Field, inputCls, Progress } from "@/components/brokebro/ui";
import { useBroke } from "@/lib/brokebro/store";
import type { Currency } from "@/lib/brokebro/types";

const STEPS = ["You", "Money in", "Survive till", "Goals"];

export default function OnboardingPage() {
  const router = useRouter();
  const profile = useBroke((s) => s.profile);
  const setProfile = useBroke((s) => s.setProfile);
  const loadDemo = useBroke((s) => s.loadDemo);
  const [step, setStep] = useState(0);
  const [name, setName] = useState(profile.name || "");
  const [currency, setCurrency] = useState<Currency>(profile.currency || "INR");
  const [income, setIncome] = useState(String(profile.monthlyIncome || 12000));
  const [next, setNext] = useState(profile.nextIncomeDate || "2026-10-05");
  const [goal, setGoal] = useState("");

  const nextStep = () => {
    if (step === 0) setProfile({ name: name.trim() || "Friend", currency });
    if (step === 1) setProfile({ monthlyIncome: Number(income) || 0 });
    if (step === 2) setProfile({ nextIncomeDate: next });
    if (step === 3) {
      setProfile({ savingsGoalName: goal.trim() || undefined, onboarded: true });
      router.push("/dashboard");
      return;
    }
    setStep((s) => s + 1);
  };

  return (
    <div className="grid min-h-screen place-items-center bg-ink px-4 py-10 text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(600px_circle_at_50%_0%,rgba(190,242,100,0.12),transparent_70%)]" />
      <div className="relative w-full max-w-md">
        <div className="mb-5 flex gap-1.5">
          {STEPS.map((_, i) => <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-lime-300" : "bg-white/12"}`} />)}
        </div>
        <Card glow>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-lime-300/80">Step {step + 1} of 4 · {STEPS[step]}</p>
          {step === 0 && (
            <div className="mt-2">
              <h1 className="font-display text-3xl font-extrabold">Yo. What do we call you? 👋</h1>
              <div className="mt-4 space-y-3.5">
                <Field label="Name"><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Aditya" className={inputCls} autoFocus /></Field>
                <Field label="Currency"><select value={currency} onChange={(e) => setCurrency(e.target.value as Currency)} className={inputCls}>{["INR", "USD", "EUR", "GBP", "AED", "SGD"].map((c) => <option key={c}>{c}</option>)}</select></Field>
              </div>
            </div>
          )}
          {step === 1 && (
            <div className="mt-2">
              <h1 className="font-display text-3xl font-extrabold">Money in 💰</h1>
              <p className="mt-1 text-sm text-white/55">Monthly allowance / income. Rough is fine.</p>
              <div className="mt-4"><Field label="Per month"><input value={income} onChange={(e) => setIncome(e.target.value)} inputMode="decimal" className={inputCls} /></Field></div>
            </div>
          )}
          {step === 2 && (
            <div className="mt-2">
              <h1 className="font-display text-3xl font-extrabold">Survive till 📅</h1>
              <p className="mt-1 text-sm text-white/55">Next expected income date — powers the Broke Meter + safe/day math.</p>
              <div className="mt-4"><Field label="Next income date"><input type="date" value={next} onChange={(e) => setNext(e.target.value)} className={inputCls} /></Field></div>
            </div>
          )}
          {step === 3 && (
            <div className="mt-2">
              <h1 className="font-display text-3xl font-extrabold">Dreaming of anything? 🎯</h1>
              <p className="mt-1 text-sm text-white/55">Optional savings goal. Headphones? Goa? Emergency cushion?</p>
              <div className="mt-4"><Field label="Savings goal (optional)"><input value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="Goa Trip Fund" className={inputCls} /></Field></div>
            </div>
          )}
          <Btn className="mt-6 w-full" onClick={nextStep}>Continue <ArrowRight size={16} /></Btn>
          {step === 0 && (
            <button onClick={() => { loadDemo(); router.push("/dashboard"); }} className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-white/15 py-3 text-sm font-bold hover:bg-white/5"><Sparkles size={15} /> Skip — explore with demo data</button>
          )}
        </Card>
        <p className="mt-4 text-center text-xs text-white/35">🔒 Your data stays yours. Supabase sync only if you configure keys.</p>
      </div>
    </div>
  );
}
