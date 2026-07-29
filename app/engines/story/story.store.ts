// Story Partner persistence — local-first, versioned, safe-parsed.
//
// The project lives in THIS browser on THIS device: IndexedDB is the durable
// store, localStorage remains a best-effort mirror (and the migration source
// for pre-IndexedDB projects). Nothing is intentionally sent to or stored on
// the server. See PRIVACY_EXPLANATION in story.engine.ts for the honest
// version shown to the author. Call initStorage() once before reading.

import { type StoryProject } from "./story.engine";
import {
  cachedActiveProject, cachedProjects, initStorage as initDb,
  persistProject, setActiveProject, storageHealth,
} from "./db";

export { storageHealth };
export type { StorageHealth } from "./db";

export async function initStorage(): Promise<void> {
  await initDb();
}

export function loadActiveProject(): StoryProject | null {
  return cachedActiveProject();
}

export function listProjects(): StoryProject[] {
  return cachedProjects();
}

/** Persists to IndexedDB + mirror. Resolves false when nothing durable took the write. */
export function saveActiveProject(project: StoryProject): Promise<boolean> {
  return persistProject(project, true);
}

/** Store a project WITHOUT making it the active one (restore-as-copy). */
export function saveProjectInBackground(project: StoryProject): Promise<boolean> {
  return persistProject(project, false);
}

export async function switchActiveProject(id: string): Promise<void> {
  await setActiveProject(id);
}
