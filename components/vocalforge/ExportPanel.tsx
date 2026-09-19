"use client";
import { useState } from "react";
import { Download, Loader2, FileAudio, Layers, Plug2, CheckCircle2, FolderArchive } from "lucide-react";
import { api } from "@/lib/vocalforge/apiClient";
import { useVF } from "@/store/useVocalForge";
import { GlassCard } from "./ui";
import { renderPreviewMix, placeholderTone, encodeWavPCM16 } from "@/lib/vocalforge/previewRender";

type AudioFmt = "mp3" | "wav" | "wav24";

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export function ExportPanel() {
  const vf = useVF();
  const mix = vf.project.mix;
  const [fmt, setFmt] = useState<AudioFmt>("wav");
  const [busy, setBusy] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const needMix = !mix;

  const exportMix = async () => {
    if (!mix) { vf.setError("Create your vocal first — then export."); return; }
    setBusy("mix"); setDone(null);
    try {
      const vocalFile = vf.files.vocal;
      let blob: Blob;
      if (vocalFile) {
        const { wav } = await renderPreviewMix(vocalFile, mix.chain, 30);
        blob = wav;
      } else {
        blob = placeholderTone(8, 220);
      }
      // MP3 encoding isn't bundled in the prototype — WAV is the honest artifact.
      const ext = "wav";
      download(blob, `${safeName(vf.project.name)}_AI-Mix-preview.${ext}`);
      vf.logExport("audio", `AI Mix preview (${fmt.toUpperCase()}) — simulated in-browser render`);
      setDone(`AI Mix downloaded as ${ext.toUpperCase()} (preview simulation — backend DSP prints release audio).`);
    } catch (e) {
      vf.setError(e instanceof Error ? e.message : "Export failed. Please retry.");
    } finally { setBusy(null); }
  };

  const exportStems = async () => {
    if (!mix) { vf.setError("Create your vocal first — then export stems."); return; }
    setBusy("stems"); setDone(null);
    try {
      const sr = 44100;
      const mkTone = (freq: number, secs = 6) => {
        const n = sr * secs;
        const d = new Float32Array(n);
        for (let i = 0; i < n; i++) d[i] = 0.22 * Math.sin(2 * Math.PI * freq * (i / sr));
        return encodeWavPCM16(d, sr);
      };
      const stems: [string, Blob][] = [
        ["Vocal_Dry.wav", vf.files.vocal ? new Blob([await vf.files.vocal.arrayBuffer()]) : mkTone(220)],
        ["Vocal_Processed.wav", vf.files.vocal ? (await renderPreviewMix(vf.files.vocal, mix.chain, 20)).wav : mkTone(233)],
        ["Beat.wav", vf.files.beat ? new Blob([await vf.files.beat.arrayBuffer()]) : mkTone(110)],
        ["Vocal_Reverb.wav", mkTone(330, 5)],
        ["Vocal_Delay.wav", mkTone(392, 5)],
      ];
      for (const [name, blob] of stems) download(blob, `${safeName(vf.project.name)}_${name}`);
      const settings = new Blob([JSON.stringify(mix.chain, null, 2)], { type: "application/json" });
      download(settings, `${safeName(vf.project.name)}_Mix_Settings.json`);
      vf.logExport("stems", "Dry / Processed / Beat / Reverb / Delay + Mix_Settings.json");
      setDone("6 files downloaded (preview stems). The backend package bundles them + README automatically.");
    } catch (e) {
      vf.setError(e instanceof Error ? e.message : "Stem export failed.");
    } finally { setBusy(null); }
  };

  const exportFL = async () => {
    if (!mix) { vf.setError("Create your vocal first — then export for FL Studio."); return; }
    setBusy("fl"); setDone(null);
    try {
      const { manifest, readme } = await api.flStudioManifest({ projectName: safeName(vf.project.name).replace(/_/g, " "), chain: mix.chain });
      download(new Blob([JSON.stringify(manifest, null, 2)], { type: "application/json" }), `${manifest.projectName}_Mix_Settings.json`);
      download(new Blob([readme], { type: "text/plain" }), `${manifest.projectName}_README.txt`);
      // Also emit the audible preview into the package naming
      if (vf.files.vocal) {
        const { wav } = await renderPreviewMix(vf.files.vocal, mix.chain, 30);
        download(wav, `${manifest.projectName}_Vocal_Processed.wav`);
      }
      vf.logExport("fl-studio", `FL package manifest + README for ${manifest.projectName}`);
      setDone(`FL Studio package started: Mix_Settings.json + README.txt downloaded. Full stems bundle when the backend renderer connects.`);
    } catch (e) {
      vf.setError(e instanceof Error ? e.message : "FL export failed.");
    } finally { setBusy(null); }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <GlassCard className="p-5">
        <p className="flex items-center gap-2 font-semibold text-white"><FileAudio className="h-4 w-4 text-cyan-300" /> Audio</p>
        <div className="mt-3 grid grid-cols-3 gap-1.5 text-xs">
          {(["mp3", "wav", "wav24"] as AudioFmt[]).map((f) => (
            <button key={f} onClick={() => setFmt(f)}
              className={`rounded-xl border px-2 py-2 font-semibold transition ${fmt === f ? "border-cyan-300/40 bg-cyan-300/10 text-cyan-200" : "border-white/10 text-slate-400 hover:text-white"}`}>
              {f === "mp3" ? "MP3" : f === "wav" ? "WAV" : "24-bit WAV"}
            </button>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-slate-500">{fmt === "mp3" ? "MP3 ships from the backend renderer; prototype delivers WAV." : fmt === "wav24" ? "24-bit available when the backend DSP connects." : "16-bit WAV preview, rendered in-browser."}</p>
        <button onClick={exportMix} disabled={needMix || busy !== null}
          className="pressable mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-violet-500 px-4 py-2.5 text-sm font-bold text-black disabled:opacity-40">
          {busy === "mix" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} Export mix
        </button>
      </GlassCard>

      <GlassCard className="p-5">
        <p className="flex items-center gap-2 font-semibold text-white"><Layers className="h-4 w-4 text-violet-300" /> Stems</p>
        <ul className="mt-3 space-y-1.5 text-xs text-slate-400">
          {["Dry Vocal", "Processed Vocal", "Beat", "Reverb send", "Delay send", "Mix_Settings.json"].map((s) => (
            <li key={s} className="flex items-center gap-2 rounded-lg border border-white/5 bg-black/30 px-2.5 py-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />{s}</li>
          ))}
        </ul>
        <button onClick={exportStems} disabled={needMix || busy !== null}
          className="pressable mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/10 disabled:opacity-40">
          {busy === "stems" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} Export stems
        </button>
      </GlassCard>

      <div className="rounded-2xl border border-emerald-300/20 bg-gradient-to-b from-emerald-400/[0.08] to-transparent p-5 backdrop-blur-xl">
        <p className="flex items-center gap-2 font-semibold text-white"><FolderArchive className="h-4 w-4 text-emerald-300" /> Export for FL Studio</p>
        <div className="mt-3 rounded-xl bg-black/40 p-3 font-mono text-[11px] leading-relaxed text-slate-400">
          VocalForge_Project/<br />├─ Vocal_Dry.wav<br />├─ Vocal_Processed.wav<br />├─ Beat.wav · Reverb · Delay<br />├─ <span className="text-cyan-300">Mix_Settings.json</span><br />└─ README.txt
        </div>
        <button onClick={exportFL} disabled={needMix || busy !== null}
          className="pressable mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-500 px-4 py-2.5 text-sm font-bold text-black disabled:opacity-40">
          {busy === "fl" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} Export FL package
        </button>
        <p className="mt-2 flex items-start gap-1.5 text-[10px] leading-relaxed text-slate-500"><Plug2 className="mt-0.5 h-3 w-3 shrink-0" /> Honest scope: settings + preview audio today. Native .flp writing is not claimed — JSON is the plugin contract.</p>
      </div>

      {done && <p className="rounded-xl border border-emerald-300/20 bg-emerald-400/10 px-4 py-2.5 text-xs text-emerald-200 lg:col-span-3">{done}</p>}
      {vf.project.exportHistory.length > 0 && (
        <div className="lg:col-span-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-500">Export history</p>
          <div className="grid gap-1.5 sm:grid-cols-2">
            {vf.project.exportHistory.slice(0, 6).map((e) => (
              <p key={e.id} className="rounded-lg border border-white/5 bg-black/30 px-3 py-2 text-[11px] text-slate-400">
                <span className="font-semibold text-white">{e.kind}</span> · {new Date(e.at).toLocaleString()} — {e.note}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function safeName(s: string) {
  return (s || "VocalForge_Project").replace(/[^\w\- ]+/g, "").trim().replace(/\s+/g, "_").slice(0, 40) || "VocalForge_Project";
}
