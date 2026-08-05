// ─────────────────────────────────────────────────────────────────────────────
// Account-linked project persistence — the first real membership value.
//
// Scope (deliberately the smallest useful group): a project has an identity,
// title, engine, JSON content, owner, and timestamps. Members can save,
// reopen, update, export, and delete. Import from the browser-local Engine
// Room store is USER-TRIGGERED — nothing is uploaded silently.
//
// Authorization rules (test-locked):
//   - The acting user id comes from the verified server session — NEVER
//     from the request body or query string.
//   - Every read, update, export, and delete verifies ownership on the
//     server. A mismatch is a 404 (existence is not confirmed to strangers).
//   - Creating/updating projects requires live member access (member,
//     tester, canceled-but-active, or owner). Reading, exporting, and
//     deleting existing projects stays available to the account even after
//     paid access ends — cancellation never takes a customer's work hostage.
// ─────────────────────────────────────────────────────────────────────────────

import { randomUUID } from "node:crypto";
import { getEngine } from "../engines/engines";
import type { MemberStore, ProjectRecord } from "./store";
import type { ResolvedAccess } from "./entitlement";

export const MAX_TITLE_LENGTH = 160;
export const MAX_CONTENT_BYTES = 256 * 1024; // 256 KB of JSON per project
export const MAX_PROJECTS_PER_USER = 200;

export type ProjectResult<T> = { ok: true; value: T } | { ok: false; error: string; status: number };

function sanitizeTitle(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const title = raw.replace(/[\u0000-\u001f<>]/g, " ").replace(/\s+/g, " ").trim();
  if (!title || title.length > MAX_TITLE_LENGTH) return null;
  return title;
}

function validContent(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  if (Buffer.byteLength(raw, "utf8") > MAX_CONTENT_BYTES) return null;
  try {
    JSON.parse(raw);
  } catch {
    return null;
  }
  return raw;
}

export async function createProject(
  store: MemberStore,
  actingUserId: string,
  access: ResolvedAccess,
  input: { title: unknown; engineId: unknown; content: unknown },
  now: Date = new Date(),
): Promise<ProjectResult<ProjectRecord>> {
  if (!access.memberAccess) {
    return { ok: false, error: "Saving projects needs an active membership.", status: 403 };
  }
  const title = sanitizeTitle(input.title);
  if (!title) return { ok: false, error: "A project title is required.", status: 422 };
  const engineId = typeof input.engineId === "string" && getEngine(input.engineId) ? input.engineId : null;
  if (!engineId) return { ok: false, error: "Unknown engine.", status: 422 };
  const content = validContent(input.content);
  if (content === null) return { ok: false, error: "Project content must be valid JSON under 256 KB.", status: 422 };

  const existing = await store.listProjects(actingUserId);
  if (existing.length >= MAX_PROJECTS_PER_USER) {
    return { ok: false, error: "Project limit reached for this account.", status: 409 };
  }

  const record: ProjectRecord = {
    id: randomUUID(),
    userId: actingUserId,
    title,
    engineId,
    content,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
  await store.createProject(record);
  return { ok: true, value: record };
}

/** Ownership gate shared by every per-project operation. */
async function ownedProject(
  store: MemberStore,
  actingUserId: string,
  projectId: string,
): Promise<ProjectRecord | null> {
  const project = await store.getProject(projectId);
  if (!project || project.userId !== actingUserId) return null;
  return project;
}

export async function readProject(
  store: MemberStore,
  actingUserId: string,
  projectId: string,
): Promise<ProjectResult<ProjectRecord>> {
  const project = await ownedProject(store, actingUserId, projectId);
  if (!project) return { ok: false, error: "Project not found.", status: 404 };
  return { ok: true, value: project };
}

export async function listOwnProjects(
  store: MemberStore,
  actingUserId: string,
): Promise<ProjectRecord[]> {
  return store.listProjects(actingUserId);
}

export async function updateProject(
  store: MemberStore,
  actingUserId: string,
  access: ResolvedAccess,
  projectId: string,
  input: { title?: unknown; content?: unknown },
  now: Date = new Date(),
): Promise<ProjectResult<ProjectRecord>> {
  if (!access.memberAccess) {
    return { ok: false, error: "Updating projects needs an active membership.", status: 403 };
  }
  const project = await ownedProject(store, actingUserId, projectId);
  if (!project) return { ok: false, error: "Project not found.", status: 404 };

  let title = project.title;
  if (input.title !== undefined) {
    const t = sanitizeTitle(input.title);
    if (!t) return { ok: false, error: "That title is not valid.", status: 422 };
    title = t;
  }
  let content = project.content;
  if (input.content !== undefined) {
    const c = validContent(input.content);
    if (c === null) return { ok: false, error: "Project content must be valid JSON under 256 KB.", status: 422 };
    content = c;
  }
  const next = { ...project, title, content, updatedAt: now.toISOString() };
  await store.updateProject(next);
  return { ok: true, value: next };
}

/** Export stays available regardless of paid status — the work is theirs. */
export async function exportProject(
  store: MemberStore,
  actingUserId: string,
  projectId: string,
): Promise<ProjectResult<{ filename: string; json: string }>> {
  const project = await ownedProject(store, actingUserId, projectId);
  if (!project) return { ok: false, error: "Project not found.", status: 404 };
  const json = JSON.stringify(
    {
      exportedFrom: "Step In The Ring",
      exportedAt: new Date().toISOString(),
      project: {
        id: project.id,
        title: project.title,
        engineId: project.engineId,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        content: JSON.parse(project.content),
      },
    },
    null,
    2,
  );
  const safeName = project.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "project";
  return { ok: true, value: { filename: `sitr-${safeName}.json`, json } };
}

export async function deleteOwnProject(
  store: MemberStore,
  actingUserId: string,
  projectId: string,
): Promise<ProjectResult<true>> {
  const project = await ownedProject(store, actingUserId, projectId);
  if (!project) return { ok: false, error: "Project not found.", status: 404 };
  await store.deleteProject(projectId);
  return { ok: true, value: true };
}

/**
 * User-triggered import of browser-local Engine Room projects. The browser
 * sends what the USER chose to import; each item is validated like any
 * create. Nothing is read from local storage silently.
 */
export async function importLocalProjects(
  store: MemberStore,
  actingUserId: string,
  access: ResolvedAccess,
  items: unknown,
  now: Date = new Date(),
): Promise<ProjectResult<{ imported: number; skipped: number }>> {
  if (!access.memberAccess) {
    return { ok: false, error: "Importing projects needs an active membership.", status: 403 };
  }
  if (!Array.isArray(items) || items.length === 0 || items.length > 50) {
    return { ok: false, error: "Choose between 1 and 50 projects to import.", status: 422 };
  }
  let imported = 0;
  let skipped = 0;
  for (const raw of items) {
    const item = (typeof raw === "object" && raw !== null ? raw : {}) as Record<string, unknown>;
    const result = await createProject(
      store,
      actingUserId,
      access,
      {
        title: item.title ?? item.name,
        engineId: typeof item.engineId === "string" ? item.engineId : "idea",
        content: typeof item.content === "string" ? item.content : JSON.stringify(item),
      },
      now,
    );
    if (result.ok) imported++;
    else skipped++;
  }
  return { ok: true, value: { imported, skipped } };
}
