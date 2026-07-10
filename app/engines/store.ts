// Local-first project memory. "Saved on this device." Versioned + safe-parsed.
import type { BuildStage, Depth, Destination } from "./engines";

export interface ExecutionPackage {
  createdAt: string;
  depth: Depth;
  destination: Destination;
  // Rendered sections (Markdown-ish plain text).
  understanding: string;
  direction: string;
  objective: string;
  inScope: string[];
  outOfScope: string[];
  design?: string;
  architecture: string;
  sequence: string;
  mainPrompt: string; // the primary Claude Code / tool prompt
  verify: string;
  returnTemplate: string;
  nextCycleNote: string;
}

export type CycleStatus = "drafted" | "sent" | "returned" | "reviewed";
export type NextPath = "fix" | "refine" | "expand" | "launch";

export interface ReturnReport {
  raw: string; // pasted results / return template contents
  completed?: boolean;
  worked?: string;
  broke?: string;
  deferred?: string;
  reviewedAt: string;
  recommendation?: NextPath;
  reviewNotes?: string;
}

export interface Cycle {
  id: string;
  index: number;
  objective: string;
  stage: BuildStage;
  destination: Destination;
  depth: Depth;
  pkg: ExecutionPackage;
  status: CycleStatus;
  ret?: ReturnReport;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  engineId: string;
  stage: BuildStage;
  answers: Record<string, string>;
  cycles: Cycle[];
  archived?: boolean;
  createdAt: string;
  updatedAt: string;
}

const KEY = "sitr-engine-projects-v1";
const VERSION = 1;

export const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
const now = () => new Date().toISOString();

interface Store {
  version: number;
  projects: Project[];
}

function safeParse(raw: string | null): Store {
  if (!raw) return { version: VERSION, projects: [] };
  try {
    const p = JSON.parse(raw) as Partial<Store>;
    if (!p || !Array.isArray(p.projects)) return { version: VERSION, projects: [] };
    const projects = p.projects.filter(
      (x) => x && typeof x.id === "string" && typeof x.name === "string" && Array.isArray(x.cycles),
    ) as Project[];
    return { version: VERSION, projects };
  } catch {
    return { version: VERSION, projects: [] };
  }
}

export function loadProjects(): Project[] {
  if (typeof window === "undefined") return [];
  return safeParse(window.localStorage.getItem(KEY)).projects;
}

export function saveProjects(projects: Project[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify({ version: VERSION, projects }));
  } catch {
    /* ignore */
  }
}

export function upsertProject(project: Project): Project[] {
  const projects = loadProjects();
  const i = projects.findIndex((p) => p.id === project.id);
  const next = { ...project, updatedAt: now() };
  if (i >= 0) projects[i] = next;
  else projects.unshift(next);
  saveProjects(projects);
  return projects;
}

export function deleteProject(id: string): Project[] {
  const projects = loadProjects().filter((p) => p.id !== id);
  saveProjects(projects);
  return projects;
}

export function duplicateProject(id: string): Project[] {
  const projects = loadProjects();
  const src = projects.find((p) => p.id === id);
  if (!src) return projects;
  const copy: Project = { ...structuredClone(src), id: uid(), name: `${src.name} (copy)`, createdAt: now(), updatedAt: now() };
  projects.unshift(copy);
  saveProjects(projects);
  return projects;
}

export function newProject(name: string, engineId: string, stage: BuildStage, answers: Record<string, string>): Project {
  return { id: uid(), name: name.trim() || "Untitled project", engineId, stage, answers, cycles: [], createdAt: now(), updatedAt: now() };
}

export function exportProject(project: Project): string {
  return JSON.stringify({ kind: "sitr-project", version: VERSION, project }, null, 2);
}

export function importProject(json: string): Project | null {
  try {
    const parsed = JSON.parse(json);
    const p = parsed?.project ?? parsed;
    if (p && typeof p.id === "string" && Array.isArray(p.cycles)) {
      return { ...p, id: uid(), name: `${p.name} (imported)`, createdAt: now(), updatedAt: now() } as Project;
    }
  } catch {
    /* ignore */
  }
  return null;
}
