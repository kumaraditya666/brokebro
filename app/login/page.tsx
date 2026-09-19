"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, Btn, Field, inputCls } from "@/components/brokebro/ui";
import { useBroke } from "@/lib/brokebro/store";
import { supabaseOrNull } from "@/lib/brokebro/supabase";

export default function LoginPage() {
  const router = useRouter();
  const setProfile = useBroke((s) => s.setProfile);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [mode, setMode] = useState<"in" | "up">("up");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    const sb = supabaseOrNull();
    if (sb) {
      try {
        if (mode === "up") {
          const { error } = await sb.auth.signUp({
            email,
            password,
            options: { data: { name: name.trim() || "Friend" } },
          });
          if (error) throw error;
          if (name.trim()) setProfile({ name: name.trim(), onboarded: false });
          setMsg("Account created — you're signed in. Syncing is now ON (cloud saves across devices).");
          router.push("/onboarding");
        } else {
          const { error } = await sb.auth.signInWithPassword({ email, password });
          if (error) throw error;
          setMsg("Welcome back — pulling your cloud data…");
          router.push("/dashboard"); // CloudSync pulls on auth state change
        }
      } catch (err: unknown) {
        setMsg(err instanceof Error ? err.message : "Auth failed — try guest mode.");
      } finally {
        setBusy(false);
      }
      return;
    }
    // Local mode (no Supabase env): guest profile, on-device only
    if (name.trim()) setProfile({ name: name.trim(), onboarded: false });
    router.push("/onboarding");
  };

  const google = async () => {
    const sb = supabaseOrNull();
    if (!sb) {
      setMsg("Google login needs Supabase env vars. Continue as guest for now — everything works locally. 👇");
      return;
    }
    await sb.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/dashboard` } });
  };

  return (
    <div className="grid min-h-screen place-items-center bg-ink px-4 py-10 text-white">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-6 flex items-center justify-center gap-2">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-lime-300 to-emerald-400 text-xl font-black text-black">B</span>
          <span className="font-display text-xl font-extrabold">BrokeBro</span>
        </Link>
        <Card glow>
          <h1 className="font-display text-2xl font-extrabold">{mode === "up" ? "Join BrokeBro 🎉" : "Welcome back 👋"}</h1>
          <p className="mt-1 text-sm text-white/55">Student budgeting that doesn't feel like homework.</p>
          <div className="mt-4 grid grid-cols-2 gap-2 rounded-2xl bg-white/5 p-1 text-sm font-bold">
            {(["up", "in"] as const).map((m) => (
              <button key={m} onClick={() => setMode(m)} className={`rounded-xl py-2.5 transition ${mode === m ? "bg-lime-300 text-black" : "text-white/55"}`}>{m === "up" ? "Sign up" : "Log in"}</button>
            ))}
          </div>
          <form onSubmit={submit} className="mt-4 space-y-3.5">
            {mode === "up" && <Field label="Name"><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Aditya" className={inputCls} /></Field>}
            <Field label="Email"><input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="you@college.edu" className={inputCls} required /></Field>
            <Field label="Password" hint="Min 6 characters. Stored hashed by Supabase — never visible to anyone."><input value={password} onChange={(e) => setPassword(e.target.value)} type="password" minLength={6} placeholder="••••••••" className={inputCls} required /></Field>
            <Btn type="submit" className="w-full" disabled={busy}>{busy ? "Working…" : mode === "up" ? "Create account" : "Log in"}</Btn>
          </form>
          <button onClick={google} className="mt-2.5 w-full rounded-2xl border border-white/15 py-3 text-sm font-bold transition hover:bg-white/5">Continue with Google</button>
          {msg && <p className="mt-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs text-white/70">{msg}</p>}
          <button onClick={() => router.push("/onboarding")} className="mt-3 w-full text-center text-sm font-bold text-lime-200 hover:underline">Continue as guest → (no signup needed)</button>
          <p className="mt-3 text-center text-[11px] text-white/35">Signed in = data syncs across devices. Guest = this device only. 🔒</p>
        </Card>
      </div>
    </div>
  );
}
