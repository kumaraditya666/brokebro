// BROKE MUSIC — settings: playback, appearance, audio, privacy, cloud, about.
"use client";

import { useState, type ReactNode } from "react";
import { Cloud, Info, Palette, Play, ShieldCheck, SlidersHorizontal, Trash2, Volume2 } from "lucide-react";
import type { ThemeMode, VisualMode } from "@/types/music";
import { cloudEnabled, getCloudClient } from "@/lib/music/cloud";
import { jamendoEnabled } from "@/lib/music/providers";
import { useMusicLibrary } from "@/store/useMusicLibrary";
import { EqualizerPanel } from "@/components/music/EqualizerPanel";
import { PageHeader, SectionTitle } from "@/components/music/ui";

function Row({ label, sub, control }: { label: string; sub?: string; control: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/5 bg-white/[0.02] px-4 py-3.5">
      <div>
        <p className="text-sm font-bold text-white">{label}</p>
        {sub && <p className="mt-0.5 text-xs text-white/45">{sub}</p>}
      </div>
      {control}
    </div>
  );
}

function Toggle({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      role="switch"
      aria-checked={on}
      aria-label={label}
      className={`relative h-7 w-12 shrink-0 rounded-full transition ${on ? "bg-lime-300" : "bg-white/12"}`}
    >
      <span className={`absolute top-1 h-5 w-5 rounded-full bg-black transition-all ${on ? "left-6" : "left-1 bg-white"}`} />
    </button>
  );
}

export default function MusicSettingsPage() {
  const settings = useMusicLibrary((s) => s.settings);
  const updateSettings = useMusicLibrary((s) => s.updateSettings);
  const clearHistory = useMusicLibrary((s) => s.clearHistory);
  const clearLikes = useMusicLibrary((s) => s.clearLikes);
  const clearLocalLibrary = useMusicLibrary((s) => s.clearLocalLibrary);
  const resetAll = useMusicLibrary((s) => s.resetAll);
  const [email, setEmail] = useState("");
  const [cloudMsg, setCloudMsg] = useState<string | null>(null);

  const cloud = cloudEnabled();

  const signIn = async () => {
    const c = getCloudClient();
    if (!c || !email.includes("@")) {
      setCloudMsg("Enter a valid email to get a magic link.");
      return;
    }
    const { error } = await c.auth.signInWithOtp({ email });
    setCloudMsg(error ? `Couldn’t send link: ${error.message}` : "Magic link sent — check your inbox.");
  };

  return (
    <div>
      <PageHeader kicker="Settings" title="Tune the machine" sub="Everything saves on-device instantly. No ads, no trackers, no dark patterns." />

      <SectionTitle title="Playback" sub="How sound behaves" right={<Play size={15} className="text-lime-300" />} />
      <div className="space-y-2">
        <Row label="Autoplay" sub="Start the next track automatically" control={<Toggle on={settings.autoplay} onClick={() => updateSettings({ autoplay: !settings.autoplay })} label="Autoplay" />} />
        <Row label="Gapless intent" sub="Best-effort gapless where the browser allows" control={<Toggle on={settings.gapless} onClick={() => updateSettings({ gapless: !settings.gapless })} label="Gapless" />} />
        <Row label="Crossfade (experimental)" sub="Browser-limited; simple cut-over for now" control={<Toggle on={settings.crossfade} onClick={() => updateSettings({ crossfade: !settings.crossfade })} label="Crossfade" />} />
        <Row
          label="Default volume"
          sub={`${Math.round(settings.defaultVolume * 100)}% on launch`}
          control={<span className="flex items-center gap-2"><Volume2 size={15} className="text-white/40" /><input type="range" min={0} max={1} step={0.01} value={settings.defaultVolume} onChange={(e) => updateSettings({ defaultVolume: Number(e.target.value) })} className="desi-slider w-32" aria-label="Default volume" /></span>}
        />
        <Row label="Audio quality" sub={jamendoEnabled() ? "Jamendo MP3 via official API" : "Demo MP3 · add JAMENDO key for more"} control={<span className="rounded-full bg-white/8 px-3 py-1.5 text-[11px] font-bold text-white/60">{jamendoEnabled() ? "High" : "Standard"}</span>} />
      </div>

      <SectionTitle title="Appearance" sub="AMOLED-first, artwork-alive" right={<Palette size={15} className="text-violet-300" />} />
      <div className="space-y-2">
        <Row
          label="Theme"
          sub="AMOLED black is home"
          control={
            <span className="flex gap-1.5">
              {(["amoled", "dark", "light"] as ThemeMode[]).map((t) => (
                <button key={t} onClick={() => updateSettings({ theme: t })} className={`rounded-full border px-3.5 py-1.5 text-xs font-bold capitalize ${settings.theme === t ? "border-lime-300/50 bg-lime-300/12 text-lime-200" : "border-white/10 text-white/50"}`}>{t}</button>
              ))}
            </span>
          }
        />
        <Row label="Dynamic artwork colors" sub="Tint the app from the cover" control={<Toggle on={settings.dynamicColors} onClick={() => updateSettings({ dynamicColors: !settings.dynamicColors })} label="Dynamic colors" />} />
        <Row label="Animations" sub="Particles, glows, springs" control={<Toggle on={settings.animations} onClick={() => updateSettings({ animations: !settings.animations })} label="Animations" />} />
        <Row label="Reduced motion" sub="Calm everything down" control={<Toggle on={settings.reducedMotion} onClick={() => updateSettings({ reducedMotion: !settings.reducedMotion })} label="Reduced motion" />} />
      </div>

      <SectionTitle title="Audio" sub="On-device shaping + visuals" right={<SlidersHorizontal size={15} className="text-sky-300" />} />
      <div className="mb-2 flex flex-wrap gap-1.5">
        {(["minimal", "wave", "spectrum", "orbital"] as VisualMode[]).map((v) => (
          <button key={v} onClick={() => updateSettings({ visual: v })} className={`rounded-full border px-3.5 py-1.5 text-xs font-bold capitalize ${settings.visual === v ? "border-lime-300/50 bg-lime-300/12 text-lime-200" : "border-white/10 text-white/50"}`}>{v}</button>
        ))}
      </div>
      <EqualizerPanel />

      <SectionTitle title="Privacy" sub="Your data never leaves without asking" right={<ShieldCheck size={15} className="text-emerald-300" />} />
      <div className="space-y-2">
        <Row label="Clear listening history" sub="Wipes timestamps + recent mixes" control={<button onClick={() => { if (confirm("Clear history?")) clearHistory(); }} className="rounded-xl border border-white/10 px-4 py-2 text-xs font-bold text-white/60 hover:text-red-300"><Trash2 size={13} className="mr-1 inline" />Clear</button>} />
        <Row label="Clear liked songs" sub="Un-hearts everything" control={<button onClick={() => { if (confirm("Unlike everything?")) clearLikes(); }} className="rounded-xl border border-white/10 px-4 py-2 text-xs font-bold text-white/60 hover:text-red-300">Clear</button>} />
        <Row label="Clear local library" sub="Deletes on-device blobs (disk files untouched)" control={<button onClick={() => { if (confirm("Remove all local blobs?")) void clearLocalLibrary(); }} className="rounded-xl border border-white/10 px-4 py-2 text-xs font-bold text-white/60 hover:text-red-300">Clear</button>} />
        <Row label="Reset everything" sub="Likes, playlists, history, settings" control={<button onClick={() => { if (confirm("Reset BROKE MUSIC completely?")) resetAll(); }} className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-2 text-xs font-bold text-red-300">Reset</button>} />
      </div>

      <SectionTitle title="Cloud (optional)" sub="Supabase auth + backup — off unless you opt in" right={<Cloud size={15} className="text-sky-300" />} />
      <div className="rounded-[1.4rem] border border-white/8 bg-white/[0.02] p-5">
        {!cloud ? (
          <p className="text-xs leading-relaxed text-white/50">
            Cloud sync is <b className="text-white/80">disabled</b> — no <code className="rounded bg-white/8 px-1.5 py-0.5">NEXT_PUBLIC_SUPABASE_URL</code> configured.
            Add it (see <code className="rounded bg-white/8 px-1.5 py-0.5">.env.example</code>) to unlock sign-in + playlist backup. Local-first works fully without it.
          </p>
        ) : (
          <>
            <p className="text-xs text-white/50">Sign in with a magic link to back up playlists + likes.</p>
            <div className="mt-3 flex gap-2">
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@mail.com" type="email" aria-label="Email" className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none" />
              <button onClick={signIn} className="rounded-2xl bg-white px-5 py-2.5 text-sm font-bold text-black">Send link</button>
            </div>
            {cloudMsg && <p className="mt-2 text-xs font-semibold text-lime-200">{cloudMsg}</p>}
          </>
        )}
      </div>

      <SectionTitle title="About + legal" sub="The boring-but-important part" right={<Info size={15} className="text-white/40" />} />
      <div className="rounded-[1.4rem] border border-white/8 bg-white/[0.02] p-5 text-xs leading-relaxed text-white/50">
        <p><b className="text-white">BROKE MUSIC</b> — “Your music. One player. Zero bullshit.” This site contains <b className="text-lime-200">zero advertising</b>.</p>
        <p className="mt-2">We never scrape, rip, proxy, mirror or rebroadcast YouTube, Spotify, Apple Music, JioSaavn, Gaana or any copyrighted service — no DRM bypass, no ad-stripping. Tracks play only when the source API explicitly returns a playable stream. Searchable-but-unplayable tracks show <b className="text-amber-200">“Playback unavailable here”</b> with an Open-source action where allowed. Lyrics appear only from licensed providers. Remote streams are never cached offline unless the provider permits it.</p>
        <p className="mt-2">Background playback uses the Media Session API + a persistent audio element; actual background behavior follows your browser/OS rules — we don’t overpromise. Equalizer + visualizer are 100% client-side Web Audio.</p>
      </div>
    </div>
  );
}
