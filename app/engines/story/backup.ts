// Two backup types, deliberately different:
//
// 1. Creative Project Backup — the fictional project only. The Source
//    Identity Vault is EXCLUDED by design; this is the ordinary manuscript
//    backup and the one that could someday be shared.
// 2. Complete Owner Vault Backup — everything, including the Real-to-Fiction
//    Legend. Highly sensitive. Produced only by an explicit owner action and
//    named PRIVATE-... so it can't be mistaken for the shareable kind.
//
// Restores never overwrite: an import lands as a separate copy, and an id
// collision with an existing project gets a fresh id (the vault follows).

import { sanitizeProject, uid, type StoryProject } from "./story.engine";
import { sanitizeVault, type SourceVaultV1 } from "./vault.engine";

export const OWNER_BACKUP_FORMAT = "sitr-complete-owner-backup";
export const OWNER_BACKUP_FILENAME_PREFIX = "PRIVATE-COMPLETE-OWNER-BACKUP";

export const OWNER_BACKUP_NOTICE =
  "HIGHLY SENSITIVE. This file contains the complete owner vault: the " +
  "Real-to-Fiction Legend with real names and private source records, plus " +
  "the full creative project. Store it only where you alone have access. " +
  "Never share it, never commit it, never upload it to an AI service.";

export function exportOwnerBackup(project: StoryProject, vault: SourceVaultV1 | null): string {
  return JSON.stringify(
    {
      format: OWNER_BACKUP_FORMAT,
      formatVersion: 1,
      exportedAt: new Date().toISOString(),
      notice: OWNER_BACKUP_NOTICE,
      project,
      vault,
    },
    null,
    2,
  );
}

export type OwnerBackupResult =
  | { ok: true; project: StoryProject; vault: SourceVaultV1 | null }
  | { ok: false; error: string };

export function parseOwnerBackup(raw: string): OwnerBackupResult {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return { ok: false, error: "That file isn't valid JSON." };
  }
  const d = data as Record<string, unknown>;
  if (!d || d.format !== OWNER_BACKUP_FORMAT) {
    return { ok: false, error: "That file isn't a Complete Owner Vault Backup." };
  }
  const project = sanitizeProject(d.project);
  if (!project) return { ok: false, error: "The backup doesn't contain a usable project." };
  const vault = d.vault ? sanitizeVault(d.vault) : null;
  return { ok: true, project, vault };
}

export interface RestoredCopy {
  project: StoryProject;
  vault: SourceVaultV1 | null;
  /** True when an id collision forced a fresh id. */
  remapped: boolean;
}

/**
 * Prepare an imported project (and its vault, if present) to live ALONGSIDE
 * what's already here. Existing projects are never touched.
 */
export function asRestoredCopy(
  project: StoryProject,
  vault: SourceVaultV1 | null,
  existingProjectIds: string[],
): RestoredCopy {
  if (!existingProjectIds.includes(project.id)) {
    return { project, vault, remapped: false };
  }
  const freshId = uid();
  return {
    project: { ...project, id: freshId, title: `${project.title} (restored)` },
    vault: vault ? { ...vault, projectId: freshId } : null,
    remapped: true,
  };
}
