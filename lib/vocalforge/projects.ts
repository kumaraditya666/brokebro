/**
 * FRONTEND — project persistence (localStorage prototype).
 * Swap with real DB calls later; the Project type already matches the
 * future backend schema (beat/vocal/reference + prompt + mix + exports).
 */
import type { Project } from "@/types/vocalforge";

const KEY = "vocalforge.projects.v1";
const ACTIVE_KEY = "vocalforge.activeProject.v1";

function uid(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function newProject(name?: string): Project {
  const now = new Date().toISOString();
  return {
    id: uid("proj"),
    name: name || `Untitled Mix ${new Date().toLocaleDateString()}`,
    createdAt: now, updatedAt: now,
    beat: null, vocal: null, reference: null,
    prompt: "",
    referenceInfluence: 55,
    simpleMode: true,
    beatAnalysis: null, vocalAnalysis: null, referenceAnalysis: null,
    mix: null,
    exportHistory: [],
  };
}

export function loadProjects(): Project[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as Project[];
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}

export function saveProjects(list: Project[]) {
  try { localStorage.setItem(KEY, JSON.stringify(list.slice(0, 30))); } catch { /* quota */ }
}

export function getActiveId(): string | null {
  try { return localStorage.getItem(ACTIVE_KEY); } catch { return null; }
}

export function setActiveId(id: string) {
  try { localStorage.setItem(ACTIVE_KEY, id); } catch { /* noop */ }
}

export { uid };
