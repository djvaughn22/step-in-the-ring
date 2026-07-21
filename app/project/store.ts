// Project persistence — local-first, versioned, safe-parsed.
//
// Same architecture as every other store in this repo (planner plans,
// creation records, engine projects): localStorage, a versioned envelope,
// and strict parsing where anything malformed is skipped, never allowed to
// crash the workspace. Adequate for the first private version; a server
// store can replace this behind the same six functions.

import { parseProjectRecord, type ProjectRecordV1 } from "./model";

const KEY = "sitr-projects-v1";
const LIMIT = 40;

interface Envelope {
  version: 1;
  projects: ProjectRecordV1[];
}

const isBrowser = () => typeof window !== "undefined";

function readAll(): ProjectRecordV1[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    const list = parsed && typeof parsed === "object" && Array.isArray((parsed as Envelope).projects)
      ? (parsed as Envelope).projects
      : [];
    return (list as unknown[])
      .map(parseProjectRecord)
      .filter((p): p is ProjectRecordV1 => p !== null);
  } catch {
    return [];
  }
}

function writeAll(projects: ProjectRecordV1[]): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(
      KEY,
      JSON.stringify({ version: 1, projects: projects.slice(0, LIMIT) } satisfies Envelope),
    );
  } catch {}
}

export function loadAllProjects(): ProjectRecordV1[] {
  return readAll().sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
}

export function getProjectById(id: string): ProjectRecordV1 | null {
  return readAll().find((p) => p.projectId === id) ?? null;
}

/** Insert or replace by id. Returns the fresh full list. */
export function saveProjectRecord(p: ProjectRecordV1): ProjectRecordV1[] {
  const rest = readAll().filter((x) => x.projectId !== p.projectId);
  const next = [p, ...rest];
  writeAll(next);
  return next.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
}

export function deleteProjectRecord(id: string): ProjectRecordV1[] {
  const next = readAll().filter((p) => p.projectId !== id);
  writeAll(next);
  return next.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
}
