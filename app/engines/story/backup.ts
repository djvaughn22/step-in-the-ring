// Two backup types, deliberately different:
//
// 1. Creative Project Backup — the fictional project only. The Source
//    Identity Vault is EXCLUDED by design; this is the ordinary manuscript
//    backup and the one that could someday be shared.
// 2. Complete Owner Vault Backup — everything, including the Real-to-Fiction
//    Legend and (formatVersion 2) the original recordings as base64. Highly
//    sensitive. Produced only by an explicit owner action and named
//    PRIVATE-... so it can't be mistaken for the shareable kind.
//
// Restores never overwrite: an import lands as a separate copy, and an id
// collision with an existing project gets a fresh id (the vault and any
// recordings follow).

import { sanitizeProject, uid, type StoryProject } from "./story.engine";
import { sanitizeVault, type SourceVaultV1 } from "./vault.engine";

export const OWNER_BACKUP_FORMAT = "sitr-complete-owner-backup";
export const OWNER_BACKUP_FILENAME_PREFIX = "PRIVATE-COMPLETE-OWNER-BACKUP";

export const OWNER_BACKUP_NOTICE =
  "HIGHLY SENSITIVE. This file contains the complete owner vault: the " +
  "Real-to-Fiction Legend with real names and private source records, the " +
  "full creative project including raw source material, and any original " +
  "recordings. Store it only where you alone have access. " +
  "Never share it, never commit it, never upload it to an AI service.";

/** A recording inside an owner backup — base64 so the file stays one JSON. */
export interface AudioBackupEntry {
  id: string;
  projectId: string;
  mimeType: string;
  durationMs: number;
  createdAt: string;
  base64: string;
}

export function exportOwnerBackup(
  project: StoryProject,
  vault: SourceVaultV1 | null,
  audio: AudioBackupEntry[] = [],
): string {
  return JSON.stringify(
    {
      format: OWNER_BACKUP_FORMAT,
      formatVersion: 2,
      exportedAt: new Date().toISOString(),
      notice: OWNER_BACKUP_NOTICE,
      project,
      vault,
      audio,
    },
    null,
    2,
  );
}

export type OwnerBackupResult =
  | { ok: true; project: StoryProject; vault: SourceVaultV1 | null; audio: AudioBackupEntry[] }
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

  // formatVersion 1 backups have no audio — that's fine, they still restore.
  const audio: AudioBackupEntry[] = [];
  for (const raw of Array.isArray(d.audio) ? d.audio : []) {
    const a = raw as Record<string, unknown>;
    if (!a || typeof a.id !== "string" || typeof a.base64 !== "string" || !a.base64) continue;
    audio.push({
      id: a.id,
      projectId: typeof a.projectId === "string" ? a.projectId : project.id,
      mimeType: typeof a.mimeType === "string" ? a.mimeType : "audio/webm",
      durationMs: typeof a.durationMs === "number" && Number.isFinite(a.durationMs) ? a.durationMs : 0,
      createdAt: typeof a.createdAt === "string" ? a.createdAt : "",
      base64: a.base64,
    });
  }
  return { ok: true, project, vault, audio };
}

export interface RestoredCopy {
  project: StoryProject;
  vault: SourceVaultV1 | null;
  audio: AudioBackupEntry[];
  /** True when an id collision forced a fresh id. */
  remapped: boolean;
}

/**
 * Prepare an imported project (and its vault and recordings, if present) to
 * live ALONGSIDE what's already here. Existing projects are never touched.
 * On a collision the project, its vault, and every recording get fresh ids —
 * and the sources' audioId references follow the recordings.
 */
export function asRestoredCopy(
  project: StoryProject,
  vault: SourceVaultV1 | null,
  existingProjectIds: string[],
  audio: AudioBackupEntry[] = [],
): RestoredCopy {
  if (!existingProjectIds.includes(project.id)) {
    return { project, vault, audio, remapped: false };
  }
  const freshId = uid();
  const audioIdMap = new Map<string, string>();
  const freshAudio = audio.map((a) => {
    const nid = uid();
    audioIdMap.set(a.id, nid);
    return { ...a, id: nid, projectId: freshId };
  });
  return {
    project: {
      ...project,
      id: freshId,
      title: `${project.title} (restored)`,
      sources: project.sources.map((s) =>
        s.audioId && audioIdMap.has(s.audioId) ? { ...s, audioId: audioIdMap.get(s.audioId)! } : s,
      ),
    },
    vault: vault ? { ...vault, projectId: freshId } : null,
    audio: freshAudio,
    remapped: true,
  };
}

// ---------------------------------------------------------------------------
// Blob ↔ base64 — for carrying recordings inside the one JSON backup file
// ---------------------------------------------------------------------------

export async function blobToBase64(blob: Blob): Promise<string> {
  const buf = new Uint8Array(await blob.arrayBuffer());
  let binary = "";
  const CHUNK = 0x8000;
  for (let i = 0; i < buf.length; i += CHUNK) {
    binary += String.fromCharCode(...buf.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}

export function base64ToBlob(base64: string, mimeType: string): Blob | null {
  try {
    const binary = atob(base64);
    const buf = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) buf[i] = binary.charCodeAt(i);
    return new Blob([buf], { type: mimeType || "audio/webm" });
  } catch {
    return null;
  }
}
