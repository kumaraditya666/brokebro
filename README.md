# VocalForge AI — AI mixing for your voice

> **Your Voice. Your Sound. AI Mixed.**
> Upload your vocal, beat and a reference track. Tell VocalForge how you want it to sound — AI builds the mix.

**Prototype status:** the full product flow (landing → studio → uploads → prompt → pipeline → chain → preview → export → FL Studio package) is functional. All AI/audio results currently come from a **clearly-labeled mock backend** (`engine: "mock-backend-v1"`). Simulated outputs are labeled in the UI. No fake processing is ever presented as real.

---

## 1. How to run

```bash
npm install
npm run dev      # http://localhost:3000  (landing at /, studio at /studio)
npm run build    # production build
npm run start    # serve production build
npm test         # vitest
```

Check backend health: `GET /api/health` → `{ ok, engine: "mock-backend-v1", routes: [...] }`.

## 2. Environment variables

No keys are needed for the prototype. When you connect real services, put secrets **server-side only**:

| Var | Used in | Purpose |
|---|---|---|
| `LLM_API_KEY` | `server/vocalforge/*` (future) | LLM for prompt interpretation |
| `AUDIO_WORKER_URL` | `server/vocalforge/*` (future) | DSP / stem-separation worker |
| `STORAGE_BUCKET` | API routes (future) | File storage (S3/GCS) |
| `DATABASE_URL` | `lib/vocalforge/projects.ts` replacement | Real project persistence |

Never import these into `@/lib` or `@/components` (client bundle). The frontend only calls `/api/*` via `lib/vocalforge/apiClient.ts`.

## 3. Architecture (backend owns AI + audio — by design)

```
Browser (React, Next.js App Router)
  components/vocalforge/*   pure presentation (no AI, no DSP decisions)
  lib/vocalforge/apiClient  thin fetch wrapper → /api/*
  lib/vocalforge/audioFile  validation, duration probe, waveform peaks (display only)
  lib/vocalforge/previewRender  LABELED in-browser preview simulation (audition only)
  store/useVocalForge.ts    zustand UI state + localStorage project cache
        │  JSON over HTTP (metadata only — files stay local until storage is wired)
        ▼
Next.js API routes (the backend)
  app/api/analyze/beat|vocal|reference   → server/vocalforge/audioAnalysis.ts
  app/api/mix/generate                   → server/vocalforge/aiMixService.ts  (AIService.generateMixInstructions)
  app/api/export/fl-studio               → server/vocalforge/exportService.ts
  server/vocalforge/promptInterpreter.ts rule-based baseline → swap for LLM
```

**Contract types** shared by both sides: `types/vocalforge.ts` (`BeatAnalysis`, `VocalAnalysis`, `ReferenceAnalysis`, `MixInstruction`, `MixChain`, `ExportJob`-equivalent history, `Project`, `FlStudioPackageManifest`).

Why this split matters: real autotune, reference DSP, stem separation and the FL Studio plugin all land server-side. The UI, the export package, and the future plugin all consume the same `MixChain` JSON — so swapping mocks for real workers requires **zero UI changes**.

## 4. Mock AI service (what's fake, what's real)

| Area | Today (mock-backend-v1) | Real replacement |
|---|---|---|
| Beat/vocal/reference analysis | Deterministic seeded values in `server/vocalforge/audioAnalysis.ts` | Essentia/aubio (BPM/key), PYIN/CREPE (pitch), ebur128 (loudness), segmentation model (sections) |
| Prompt → params | Weighted keyword families in `server/vocalforge/promptInterpreter.ts` — generic (not a fixed example list), unknown words ignored gracefully | LLM call with JSON-schema response matching `MixInstruction`; keep function signature |
| Mix decisions | Rule-based blend in `server/vocalforge/aiMixService.ts` (prompt dominates at 0% influence, reference traits pull at 100%) | LLM + DSP preset solver; keep `MixResult` schema identical |
| Audio preview | WebAudio filter/delay approximation, **labeled "preview simulation"** | Streamed backend render (FFmpeg + pitch/DSP chain) |
| Exports | Client-side WAV/JSON downloads + backend manifest | Backend render jobs (WAV/MP3/stems/ZIP) |

To replace a mock: edit the corresponding file in `server/vocalforge/` only. Do not move logic into components.

## 5. Connecting real audio processing

Planned DSP stack (all server-side): **FFmpeg** (decode/encode/loudness), pitch detection → correction (e.g. WORLD/RubberBand-class worker), EQ/compressor/limiter, algorithmic reverb/delay, saturation, stereo toolkit, loudness normalization, stem separation (Demucs-class service). Suggested shape:

- `POST /api/jobs/render` → enqueue `{ mixId, chain, assets }` → worker (BullMQ/Cloud Run/Modal) → webhook/poll → `GET /api/jobs/:id` → signed URLs.
- Keep `MixChain` as the single source of truth: web UI, render worker, and FL plugin all read the same JSON.

## 6. FL Studio export architecture

`POST /api/export/fl-studio` (`server/vocalforge/exportService.ts`) returns a `FlStudioPackageManifest`:

```
VocalForge_Project/
  Vocal_Dry.wav  Vocal_Processed.wav  Beat.wav
  Vocal_Reverb.wav  Vocal_Delay.wav
  Mix_Settings.json   ← the MixChain as data (integration contract)
  README.txt          ← mixer routing steps generated from the chain
```

We deliberately do **not** claim native `.flp` generation. The JSON preset is the contract the coming plugin consumes.

**Future FL plugin** (`pluginBridge.status: "coming-soon"`): sends a vocal clip to `POST /api/mix/generate`, receives the same `MixChain` JSON the web studio uses, instantiates native FL mixer FX. Endpoint shape is already plugin-compatible.

## 7. Frontend map

- `/` → `components/vocalforge/LandingPage.tsx` (hero, how-it-works, chain showcase, reference, FL workflow, before/after, features, FAQ, CTA)
- `/studio` → `components/vocalforge/StudioPage.tsx` (left: `UploadCard` ×3 + influence · center: `PromptBox` + `MixPreview` + tabs[`ChainView` | `SectionAutomation` | `ExportPanel` | `ProjectsPanel`] · right: `ReferenceMatch` + summary · bottom transport)
- Shared: `components/vocalforge/ui.tsx` (`Waveform` canvas, `MiniMeters`, `Slider`, `GlassCard`)
- Errors: friendly messages only (e.g. unreliable-key guidance); file validation blocks bad formats/sizes; backend failures keep local files playable. No stack traces in UI.

## 8. Security / performance notes

- Files validated by extension **and** size (150 MB cap); duration probed with timeout; peaks downsampled to ≤96 buckets off the critical path.
- Filenames/MIME never trusted for processing decisions.
- No API keys in client code; large decode/render work belongs in backend workers with progress polling.
