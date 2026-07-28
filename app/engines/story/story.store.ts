// Story Partner persistence — local-first, versioned, safe-parsed.
//
// The project lives in localStorage in THIS browser on THIS device. It is not
// intentionally sent to or stored on the server. See PRIVACY_EXPLANATION in
// story.engine.ts for the honest version shown to the author.

import { sanitizeProject, type StoryProjectV1 } from "./story.engine";

const STORAGE_KEY = "sitr-story-partner-v1";
const VERSION = 1;

interface StoryStore {
  version: number;
  projects: StoryProjectV1[];
}

function safeParse(raw: string | null): StoryStore {
  if (!raw) return { version: VERSION, projects: [] };
  try {
    const parsed = JSON.parse(raw) as Partial<StoryStore>;
    const projects = Array.isArray(parsed?.projects)
      ? parsed.projects.map(sanitizeProject).filter((p): p is StoryProjectV1 => !!p)
      : [];
    return { version: VERSION, projects };
  } catch {
    return { version: VERSION, projects: [] };
  }
}

export function loadActiveProject(): StoryProjectV1 | null {
  if (typeof window === "undefined") return null;
  const store = safeParse(window.localStorage.getItem(STORAGE_KEY));
  return store.projects[0] ?? null;
}

export function saveActiveProject(project: StoryProjectV1): boolean {
  if (typeof window === "undefined") return false;
  const store = safeParse(window.localStorage.getItem(STORAGE_KEY));
  const rest = store.projects.filter((p) => p.id !== project.id);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: VERSION, projects: [project, ...rest] }));
    return true;
  } catch {
    return false; // storage full or blocked — caller shows the honest message
  }
}
