"use client";
import { useRouter } from "next/navigation";
import { LogOut, Trash2, Sparkles, Bell } from "lucide-react";
import { AppShell } from "@/components/brokebro/AppShell";
import { Card, Btn, PageHeader, Badge, EmptyState } from "@/components/brokebro/ui";
import { QUEST_DEFS, useBroke } from "@/lib/brokebro/store";
import { supabaseOrNull } from "@/lib/brokebro/supabase";

export default function ProfilePage() {
  const profile = useBroke((s) => s.profile);
  const xp = useBroke((s) => s.xp);
  const streak = useBroke((s) => s.streak);
  const goals = useBroke((s) => s.goals);
  const qp = useBroke((s) => s.quests);
  const notes = useBroke((s) => s.notifications);
  const markRead = useBroke((s) => s.markRead);
  const demoMode = useBroke((s) => s.demoMode);
  const loadDemo = useBroke((s) => s.loadDemo);
  const clearDemo = useBroke((s) => s.clearDemo);
  const resetAll = useBroke((s) => s.resetAll);
  const router = useRouter();
  const doneGoals = goals.filter((g) => g.saved >= g.target && g.target > 0).length;

  const logout = async () => {
    const sb = supabaseOrNull();
    if (sb) await sb.auth.signOut();
    resetAll();
    router.push("/");
  };

  return (
    <AppShell>
      <PageHeader kicker="Profile" title={profile.name ? `${profile.name}'s vault` : "Profile"} sub="XP, badges, streaks, completed goals. Balances stay private — share only vibes." />
      <div className="grid gap-4 lg:grid-cols-3">
        <Card glow>
          <div className="grid h-16 w-16 place-items-center rounded-3xl bg-gradient-to-br from-lime-300 to-emerald-400 text-2xl font-black text-black">{(profile.name || "B")[0].toUpperCase()}</div>
          <h2 className="font-display mt-3 text-2xl font-extrabold">{profile.name || "Anonymous Brokie"}</h2>
          <p className="text-sm text-white/50">{profile.currency} · ₹{profile.monthlyIncome.toLocaleString("en-IN")}/mo · next income {(profile.nextIncomeDate || "").slice(0, 10)}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge>⚡ {xp} XP</Badge><Badge tone="violet">🔥 {streak}-day streak</Badge><Badge tone="pink">🎯 {doneGoals} goals done</Badge>
            {demoMode && <Badge>DEMO DATA</Badge>}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {demoMode ? <Btn variant="outline" onClick={clearDemo}><Trash2 size={14} /> Clear demo</Btn> : <Btn variant="outline" onClick={loadDemo}><Sparkles size={14} /> Demo data</Btn>}
            <Btn variant="danger" onClick={logout}><LogOut size={14} /> Logout</Btn>
          </div>
        </Card>

        <Card>
          <h3 className="font-display font-bold">Achievements</h3>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {QUEST_DEFS.map((q) => {
              const got = qp.find((x) => x.questId === q.id)?.done;
              return <div key={q.id} className={`rounded-2xl border p-3 text-center ${got ? "border-lime-300/30 bg-lime-300/8" : "border-white/10 bg-black/30 opacity-50"}`}><div className="text-2xl">{q.badge}</div><p className="mt-1 text-[11px] font-bold">{q.title}</p></div>;
            })}
          </div>
        </Card>

        <Card>
          <h3 className="font-display flex items-center gap-2 font-bold"><Bell size={16} /> Notifications</h3>
          <div className="mt-3 space-y-2">
            {notes.slice(0, 6).map((n) => (
              <button key={n.id} onClick={() => markRead(n.id)} className={`w-full rounded-2xl border px-3.5 py-2.5 text-left text-sm ${n.read ? "border-white/8 opacity-60" : "border-lime-300/25 bg-lime-300/5"}`}>
                <p className="font-bold">{n.title}</p><p className="text-xs text-white/55">{n.body}</p>
              </button>
            ))}
            {notes.length === 0 && <p className="text-sm text-white/50">All quiet. Budget nudges, milestones & Wrapped alerts land here — no spam, promise. 🤫</p>}
          </div>
        </Card>
      </div>

      <Card className="mt-4">
        <h3 className="font-display font-bold">Privacy & safety</h3>
        <p className="mt-1 text-sm text-white/55">Financial info is private by default. Share cards never include balances or transactions unless you explicitly opt in. We never ask for bank passwords — there are no bank integrations, by design. Not investment advice, ever.</p>
      </Card>
    </AppShell>
  );
}
