"use client";
import { useState } from "react";
import { FolderOpen, Plus, Trash2, Clock, FileMusic, Plug2 } from "lucide-react";
import { useVF } from "@/store/useVocalForge";
import { GlassCard } from "./ui";

export function ProjectsPanel() {
  const vf = useVF();
  const [name, setName] = useState("");
  const templates = [
    { t: "Dark Emotional + Hard Tune", p: "Make my vocal dark and emotional, strong autotune, clean and upfront in the verse, wider in the chorus, with atmospheric reverb and a short delay." },
    { t: "Bright Radio Pop", p: "Bright radio vocal, natural autotune, punchy and upfront with tight dry verse and wide glossy chorus." },
    { t: "Lo-fi Phone Verse", p: "Phone-style narrow verse with grit, then open into a dreamy wide chorus with long reverb." },
    { t: "Dry Intimate Ballad", p: "Clean intimate dry vocal, soft transparent tune, subtle plate and a touch of slap delay." },
  ];
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <div>
        <div className="mb-3 flex items-center gap-2">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="New project name…"
            className="flex-1 rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-cyan-300/40 focus:outline-none" />
          <button onClick={() => { vf.createProject(name || undefined); setName(""); }} className="pressable flex items-center gap-1.5 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black"><Plus className="h-4 w-4" /> New</button>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {vf.projects.map((p) => {
            const active = p.id === vf.project.id;
            return (
              <button key={p.id} onClick={() => vf.switchProject(p.id)}
                className={`rounded-2xl border p-4 text-left transition ${active ? "border-cyan-300/40 bg-cyan-300/[0.06]" : "border-white/10 bg-white/[0.03] hover:border-white/20"}`}>
                <p className="flex items-center gap-2 font-semibold text-white"><FolderOpen className={`h-4 w-4 ${active ? "text-cyan-300" : "text-slate-500"}`} />{p.name}</p>
                <p className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500"><Clock className="h-3 w-3" />{new Date(p.updatedAt).toLocaleString()} · {p.mix ? "mixed ✓" : "no mix yet"} · {p.exportHistory.length} exports</p>
                <p className="mt-1.5 line-clamp-2 text-[11px] text-slate-500">{p.prompt || "No description yet."}</p>
              </button>
            );
          })}
        </div>
        {vf.projects.length === 0 && <p className="text-sm text-slate-500">No projects yet.</p>}
      </div>
      <div className="space-y-4">
        <GlassCard className="p-4">
          <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-white"><FileMusic className="h-4 w-4 text-cyan-300" /> Templates</p>
          {templates.map((t) => (
            <button key={t.t} onClick={() => { vf.setPrompt(t.p); vf.setStudioTab("mix"); vf.setNotice(`Template loaded: ${t.t}`); }}
              className="mb-1.5 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-left text-xs text-slate-300 transition hover:border-cyan-300/30 hover:text-white">
              <span className="font-semibold">{t.t}</span>
              <span className="mt-0.5 line-clamp-1 block text-slate-500">{t.p}</span>
            </button>
          ))}
        </GlassCard>
        <GlassCard className="p-4">
          <p className="mb-1 flex items-center gap-2 text-sm font-semibold text-white"><Plug2 className="h-4 w-4 text-emerald-300" /> FL Studio Plugin — Coming Soon</p>
          <p className="text-xs leading-relaxed text-slate-400">Send a clip from FL Studio → same <span className="font-mono text-cyan-300">POST /api/mix/generate</span> → chain loads as native mixer FX. Web exports already use this contract.</p>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500"><Trash2 className="h-3 w-3" /> Reference library + cloud sync arrive with backend storage.</div>
        </GlassCard>
      </div>
    </div>
  );
}
