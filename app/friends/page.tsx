"use client";
import { useMemo, useState } from "react";
import { Plus, Copy, Check } from "lucide-react";
import { AppShell } from "@/components/brokebro/AppShell";
import { Card, Btn, PageHeader, Field, inputCls, EmptyState, Badge } from "@/components/brokebro/ui";
import { useBroke } from "@/lib/brokebro/store";
import { calculateSplitSettlement } from "@/lib/brokebro/calc";
import { fmtMoney } from "@/lib/brokebro/format";

export default function FriendsPage() {
  const groups = useBroke((s) => s.groups);
  const expenses = useBroke((s) => s.groupExpenses);
  const addGroup = useBroke((s) => s.addGroup);
  const addExp = useBroke((s) => s.addGroupExpense);
  const cur = useBroke((s) => s.profile.currency);
  const [active, setActive] = useState<string | null>(null);
  const [gname, setGname] = useState("");
  const [members, setMembers] = useState("Aditya, Rahul, Aman");
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState("");
  const [copied, setCopied] = useState(false);

  const group = groups.find((g) => g.id === active) ?? groups[0] ?? null;
  const gex = useMemo(() => (group ? expenses.filter((e) => e.groupId === group.id) : []), [expenses, group]);
  const { nets, settlements } = useMemo(
    () => (group ? calculateSplitSettlement(group.members, gex) : { nets: [], settlements: [] }),
    [group, gex]
  );
  const total = gex.reduce((a, e) => a + e.amount, 0);

  const waMessage = group
    ? `💸 ${group.name} settlement (BrokeBro)\n${settlements.map((s) => `${s.from} → ${s.to} ${fmtMoney(s.amount, cur)}`).join("\n") || "All settled! 🎉"}\nTotal spent: ${fmtMoney(total, cur)}`
    : "";

  return (
    <AppShell>
      <PageHeader kicker="Friends" title="Split without the awkwardness" sub="Hostel, Goa trip, canteen. Log once — we simplify who owes whom."
        right={null} />
      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <h3 className="font-display font-bold">New group</h3>
          <form className="mt-3 space-y-3" onSubmit={(e) => { e.preventDefault(); const ms = members.split(",").map((m) => m.trim()).filter(Boolean); if (!gname.trim() || ms.length < 2) return; addGroup(gname.trim(), ms); setGname(""); }}>
            <Field label="Group name"><input value={gname} onChange={(e) => setGname(e.target.value)} placeholder="Goa Trip" className={inputCls} /></Field>
            <Field label="Members (comma separated)" hint="Use first names. Anyone can be added — no signup needed to split."><input value={members} onChange={(e) => setMembers(e.target.value)} className={inputCls} /></Field>
            <Btn type="submit" className="w-full"><Plus size={15} /> Create group</Btn>
          </form>
          <div className="mt-4 space-y-2">
            {groups.map((g) => (
              <button key={g.id} onClick={() => setActive(g.id)} className={`w-full rounded-2xl border px-4 py-3 text-left transition ${group?.id === g.id ? "border-lime-300/40 bg-lime-300/10" : "border-white/10 bg-black/30 hover:border-white/20"}`}>
                <p className="font-bold">{g.name}</p>
                <p className="text-xs text-white/45">{g.members.join(" · ")}</p>
              </button>
            ))}
            {groups.length === 0 && <p className="text-sm text-white/50">No groups yet — create “Hostel” or “Goa Trip”.</p>}
          </div>
        </Card>

        <div className="space-y-4 lg:col-span-2">
          {!group ? (
            <EmptyState emoji="👯" title="No group selected" body="Create a group on the left — e.g. Roommates, Canteen, Cricket, College Event." />
          ) : (
            <>
              <Card>
                <div className="flex items-center justify-between">
                  <div><h3 className="font-display text-xl font-extrabold">{group.name}</h3><p className="text-xs text-white/45">{group.members.join(" · ")} · {fmtMoney(total, cur)} total</p></div>
                  <Badge tone="violet">{gex.length} expenses</Badge>
                </div>
                <form className="mt-4 grid gap-2.5 sm:grid-cols-4" onSubmit={(e) => { e.preventDefault(); const a = Number(amount); if (!desc.trim() || !a || a <= 0) return; addExp({ groupId: group.id, description: desc.trim(), amount: Math.round(a), paidBy: paidBy || group.members[0], shares: {}, date: new Date().toISOString() }); setDesc(""); setAmount(""); }}>
                  <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Dinner" className={inputCls} aria-label="Expense description" />
                  <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="₹1200" inputMode="decimal" className={inputCls} aria-label="Amount" />
                  <select value={paidBy || group.members[0]} onChange={(e) => setPaidBy(e.target.value)} className={inputCls} aria-label="Paid by">
                    {group.members.map((m) => <option key={m}>{m}</option>)}
                  </select>
                  <Btn type="submit"><Plus size={15} /> Add</Btn>
                </form>
                <div className="mt-3 space-y-2">
                  {gex.map((x) => (
                    <div key={x.id} className="flex items-center justify-between rounded-2xl border border-white/8 bg-black/30 px-4 py-2.5 text-sm">
                      <span><b>{x.description}</b> <span className="text-white/45">· {x.paidBy} paid {fmtMoney(x.amount, cur)}</span></span>
                      <span className="text-xs text-white/40">{x.date.slice(0, 10)}</span>
                    </div>
                  ))}
                  {gex.length === 0 && <p className="text-sm text-white/50">No expenses yet. E.g. Aditya paid ₹1,200, Rahul paid ₹500, Aman paid ₹0.</p>}
                </div>
              </Card>

              <Card glow>
                <h3 className="font-display font-bold">Simplified settlements</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {nets.map((n) => (
                    <span key={n.member} className={`rounded-full border px-3 py-1.5 text-xs font-bold ${n.net >= 0 ? "border-emerald-300/30 bg-emerald-300/10 text-emerald-200" : "border-pink-400/30 bg-pink-400/10 text-pink-200"}`}>
                      {n.member} {n.net >= 0 ? "gets" : "owes"} {fmtMoney(Math.abs(Math.round(n.net)), cur)}
                    </span>
                  ))}
                </div>
                <div className="mt-3 space-y-2">
                  {settlements.map((s, i) => (
                    <p key={i} className="rounded-2xl border border-white/10 bg-black/30 px-4 py-2.5 font-mono text-sm">{s.from} → {s.to} <b className="text-lime-200">{fmtMoney(s.amount, cur)}</b></p>
                  ))}
                  {settlements.length === 0 && <p className="text-sm text-white/55">All settled! 🎉 Nothing owed.</p>}
                </div>
                <button
                  onClick={() => { navigator.clipboard?.writeText(waMessage); setCopied(true); setTimeout(() => setCopied(false), 1800); }}
                  className="mt-3 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-300 to-lime-300 px-5 py-2.5 text-sm font-bold text-black transition hover:-translate-y-0.5"
                >
                  {copied ? <Check size={15} /> : <Copy size={15} />} {copied ? "Copied!" : "Copy WhatsApp message"}
                </button>
              </Card>
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}
