"use client";
import { create } from "zustand";
import type {
  AudioFileMeta, AudioSlot, BeatAnalysis, MixResult, PipelineStageId,
  Project, ReferenceAnalysis, VocalAnalysis,
} from "@/types/vocalforge";
import { loadProjects, newProject, saveProjects, setActiveId, getActiveId } from "@/lib/vocalforge/projects";

export type StudioTab = "mix" | "sections" | "export" | "projects";
export type PreviewTab = "original" | "aimix" | "reference";

interface VFState {
  project: Project;
  projects: Project[];
  files: Record<AudioSlot, File | null>;
  peaks: Record<AudioSlot, number[]>;
  analyzing: Record<AudioSlot, boolean>;
  error: string | null;
  notice: string | null;
  pipelineActive: boolean;
  pipelineStage: PipelineStageId | null;
  pipelineProgress: number; // 0..100
  previewTab: PreviewTab;
  beforeAfter: number; // 0 original .. 100 processed
  isPlaying: boolean;
  loop: boolean;
  volume: number;
  selectedModule: string | null;
  studioTab: StudioTab;
  engineOnline: boolean | null;

  init: () => void;
  setError: (e: string | null) => void;
  setNotice: (n: string | null) => void;
  setFile: (slot: AudioSlot, file: File | null, meta: AudioFileMeta | null, peaks?: number[]) => void;
  setAnalysis: (slot: AudioSlot, a: BeatAnalysis | VocalAnalysis | ReferenceAnalysis | null) => void;
  setPrompt: (p: string) => void;
  setInfluence: (v: number) => void;
  setSimpleMode: (v: boolean) => void;
  setPipeline: (active: boolean, stage: PipelineStageId | null, progress: number) => void;
  setMix: (mix: MixResult | null) => void;
  patchChain: (patch: Partial<MixResult["chain"]>) => void;
  updateChainSection: (section: keyof MixResult["chain"], patch: Record<string, unknown>) => void;
  setPreviewTab: (t: PreviewTab) => void;
  setBeforeAfter: (v: number) => void;
  setPlaying: (v: boolean) => void;
  setLoop: (v: boolean) => void;
  setVolume: (v: number) => void;
  setSelectedModule: (m: string | null) => void;
  setStudioTab: (t: StudioTab) => void;
  setEngineOnline: (v: boolean) => void;
  persist: () => void;
  switchProject: (id: string) => void;
  createProject: (name?: string) => void;
  renameProject: (name: string) => void;
  logExport: (kind: string, note: string) => void;
  resetMix: () => void;
}

function syncProjectFiles(p: Project) {
  p.updatedAt = new Date().toISOString();
  return p;
}

export const useVF = create<VFState>((set, get) => ({
  project: newProject("Midnight Confessions"),
  projects: [],
  files: { beat: null, vocal: null, reference: null },
  peaks: { beat: [], vocal: [], reference: [] },
  analyzing: { beat: false, vocal: false, reference: false },
  error: null, notice: null,
  pipelineActive: false, pipelineStage: null, pipelineProgress: 0,
  previewTab: "aimix", beforeAfter: 100,
  isPlaying: false, loop: false, volume: 80,
  selectedModule: "pitchCorrection",
  studioTab: "mix",
  engineOnline: null,

  init: () => {
    const list = loadProjects();
    const activeId = getActiveId();
    const found = activeId ? list.find((p) => p.id === activeId) : undefined;
    if (found) set({ project: found, projects: list.length ? list : [found] });
    else if (list.length) set({ project: list[0], projects: list });
    else {
      const p = newProject("Midnight Confessions");
      p.prompt = "Make my vocal dark and emotional, strong autotune, clean and upfront in the verse, wider in the chorus, with atmospheric reverb and a short delay.";
      set({ project: p, projects: [p] });
      saveProjects([p]); setActiveId(p.id);
    }
    fetch("/api/health").then((r) => set({ engineOnline: r.ok })).catch(() => set({ engineOnline: false }));
  },

  setError: (error) => set({ error }),
  setNotice: (notice) => set({ notice }),
  setFile: (slot, file, meta, peaks) => {
    const { project } = get();
    const next = { ...project };
    if (slot === "beat") next.beat = meta;
    if (slot === "vocal") next.vocal = meta;
    if (slot === "reference") next.reference = meta;
    syncProjectFiles(next);
    set({
      project: next,
      files: { ...get().files, [slot]: file },
      peaks: peaks ? { ...get().peaks, [slot]: peaks } : get().peaks,
    });
    get().persist();
  },
  setAnalysis: (slot, a) => {
    const { project } = get();
    const next = { ...project };
    if (slot === "beat") next.beatAnalysis = a as BeatAnalysis;
    if (slot === "vocal") next.vocalAnalysis = a as VocalAnalysis;
    if (slot === "reference") next.referenceAnalysis = a as ReferenceAnalysis;
    syncProjectFiles(next);
    set({ project: next, analyzing: { ...get().analyzing, [slot]: false } });
    get().persist();
  },
  setPrompt: (prompt) => { set({ project: { ...get().project, prompt, updatedAt: new Date().toISOString() } }); get().persist(); },
  setInfluence: (referenceInfluence) => { set({ project: { ...get().project, referenceInfluence } }); get().persist(); },
  setSimpleMode: (simpleMode) => set({ project: { ...get().project, simpleMode } }),
  setPipeline: (pipelineActive, pipelineStage, pipelineProgress) => set({ pipelineActive, pipelineStage, pipelineProgress }),
  setMix: (mix) => { set({ project: { ...get().project, mix, updatedAt: new Date().toISOString() } }); get().persist(); },
  patchChain: (patch) => {
    const { project } = get();
    if (!project.mix) return;
    set({ project: { ...project, mix: { ...project.mix, chain: { ...project.mix.chain, ...patch } } } });
    get().persist();
  },
  updateChainSection: (section, patch) => {
    const { project } = get();
    if (!project.mix) return;
    const cur = (project.mix.chain[section] ?? {}) as Record<string, unknown>;
    const updated = { ...project.mix.chain, [section]: { ...cur, ...patch } };
    set({ project: { ...project, mix: { ...project.mix, chain: updated } } });
    get().persist();
  },
  setPreviewTab: (previewTab) => set({ previewTab }),
  setBeforeAfter: (beforeAfter) => set({ beforeAfter }),
  setPlaying: (isPlaying) => set({ isPlaying }),
  setLoop: (loop) => set({ loop }),
  setVolume: (volume) => set({ volume }),
  setSelectedModule: (selectedModule) => set({ selectedModule }),
  setStudioTab: (studioTab) => set({ studioTab }),
  setEngineOnline: (engineOnline) => set({ engineOnline }),
  persist: () => {
    const { project, projects } = get();
    const idx = projects.findIndex((p) => p.id === project.id);
    const next = idx >= 0 ? projects.map((p) => (p.id === project.id ? project : p)) : [project, ...projects];
    set({ projects: next });
    saveProjects(next); setActiveId(project.id);
  },
  switchProject: (id) => {
    const p = get().projects.find((x) => x.id === id);
    if (!p) return;
    set({
      project: p, previewTab: "aimix", beforeAfter: 100,
      files: { beat: null, vocal: null, reference: null },
      peaks: { beat: p.beatAnalysis?.waveformPeaks ?? [], vocal: p.vocalAnalysis?.waveformPeaks ?? [], reference: [] },
    });
    setActiveId(id);
  },
  createProject: (name) => {
    const p = newProject(name);
    const next = [p, ...get().projects].slice(0, 30);
    set({ project: p, projects: next, files: { beat: null, vocal: null, reference: null }, peaks: { beat: [], vocal: [], reference: [] } });
    saveProjects(next); setActiveId(p.id);
  },
  renameProject: (name) => { set({ project: { ...get().project, name } }); get().persist(); },
  logExport: (kind, note) => {
    const { project } = get();
    const entry = { id: `exp_${Date.now().toString(36)}`, kind, at: new Date().toISOString(), note };
    set({ project: { ...project, exportHistory: [entry, ...project.exportHistory].slice(0, 30) } });
    get().persist();
  },
  resetMix: () => set({ project: { ...get().project, mix: null } }),
}));
