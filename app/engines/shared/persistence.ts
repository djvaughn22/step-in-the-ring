/**
 * Creation Engine Persistence Layer
 *
 * Local-first storage for all creation projects.
 * Versioned, safe-parsed, engine-agnostic.
 */

import type { CreationProject, CreationVersion } from "./creation-engine.types";

const STORAGE_KEY = "creation-engine-projects-v1";
const VERSION = 1;

export interface PersistenceStore {
  version: number;
  projects: CreationProject[];
}

// ============================================================================
// CORE FUNCTIONS
// ============================================================================

export function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function now(): string {
  return new Date().toISOString();
}

function safeParse(raw: string | null): PersistenceStore {
  if (!raw) return { version: VERSION, projects: [] };
  try {
    const parsed = JSON.parse(raw) as Partial<PersistenceStore>;
    if (!parsed || !Array.isArray(parsed.projects)) {
      return { version: VERSION, projects: [] };
    }

    const projects = parsed.projects.filter(
      (x) => x && typeof x.id === "string" && typeof x.engineId === "string" && Array.isArray(x.versions),
    ) as CreationProject[];

    return { version: VERSION, projects };
  } catch {
    return { version: VERSION, projects: [] };
  }
}

// ============================================================================
// LOAD & SAVE
// ============================================================================

export function loadProjects(): CreationProject[] {
  if (typeof window === "undefined") return [];
  return safeParse(window.localStorage.getItem(STORAGE_KEY)).projects;
}

export function saveProjects(projects: CreationProject[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: VERSION, projects }));
  } catch {
    console.warn("Failed to save projects to localStorage");
  }
}

// ============================================================================
// PROJECT CRUD
// ============================================================================

export function createProject(
  engineId: string,
  name: string,
  answers: Record<string, string> = {},
): CreationProject {
  const id = uid();
  const versionId = uid();
  const now_str = now();

  const project: CreationProject = {
    id,
    engineId,
    name,
    answers,
    status: "spark",
    stage: "Spark",
    depth: "full",
    destination: "self",
    directions: [],
    assets: [],
    exports: [],
    versions: [
      {
        id: versionId,
        label: "Initial",
        status: "spark",
        createdAt: now_str,
      },
    ],
    currentVersionId: versionId,
    createdAt: now_str,
    updatedAt: now_str,
    tags: [],
  };

  return project;
}

export function getProject(id: string): CreationProject | null {
  const projects = loadProjects();
  return projects.find((p) => p.id === id) || null;
}

export function updateProject(project: CreationProject): void {
  const projects = loadProjects();
  const index = projects.findIndex((p) => p.id === project.id);

  const updated = { ...project, updatedAt: now() };

  if (index >= 0) {
    projects[index] = updated;
  } else {
    projects.push(updated);
  }

  saveProjects(projects);
}

export function deleteProject(id: string): void {
  let projects = loadProjects();
  projects = projects.filter((p) => p.id !== id);
  saveProjects(projects);
}

export function archiveProject(id: string): void {
  const project = getProject(id);
  if (project) {
    project.archived = true;
    project.status = "archived";
    updateProject(project);
  }
}

export function duplicateProject(id: string): CreationProject | null {
  const original = getProject(id);
  if (!original) return null;

  const copy = createProject(original.engineId, `${original.name} (Copy)`, original.answers);
  copy.description = original.description;
  copy.stage = original.stage;
  copy.depth = original.depth;
  copy.destination = original.destination;
  copy.tags = [...(original.tags || [])];

  updateProject(copy);
  return copy;
}

// ============================================================================
// VERSIONING
// ============================================================================

export function saveVersion(projectId: string, label: string, description?: string): void {
  const project = getProject(projectId);
  if (!project) return;

  const version: CreationVersion = {
    id: uid(),
    label,
    description,
    status: project.status,
    buildContent: project.buildContent,
    createdAt: now(),
    savedBy: "user", // Future: could track who saved it.
  };

  project.versions.push(version);
  project.currentVersionId = version.id;

  updateProject(project);
}

export function restoreVersion(projectId: string, versionId: string): void {
  const project = getProject(projectId);
  if (!project) return;

  const version = project.versions.find((v) => v.id === versionId);
  if (!version) return;

  project.status = version.status;
  project.buildContent = version.buildContent;
  project.currentVersionId = versionId;

  updateProject(project);
}

// ============================================================================
// EXPORT / IMPORT
// ============================================================================

export function exportProject(projectId: string): string {
  const project = getProject(projectId);
  if (!project) return "";
  return JSON.stringify(project, null, 2);
}

export function importProject(jsonString: string): CreationProject | null {
  try {
    const data = JSON.parse(jsonString);
    if (!data.id || !data.engineId) return null;
    return data as CreationProject;
  } catch {
    return null;
  }
}

// ============================================================================
// QUERIES
// ============================================================================

export function getProjectsByEngine(engineId: string): CreationProject[] {
  return loadProjects().filter((p) => p.engineId === engineId && !p.archived);
}

export function getProjectsByStatus(status: string): CreationProject[] {
  return loadProjects().filter((p) => p.status === status && !p.archived);
}

export function searchProjects(query: string): CreationProject[] {
  const lower = query.toLowerCase();
  return loadProjects().filter(
    (p) =>
      !p.archived &&
      (p.name.toLowerCase().includes(lower) || p.description?.toLowerCase().includes(lower) || p.tags?.some((t) => t.toLowerCase().includes(lower))),
  );
}
