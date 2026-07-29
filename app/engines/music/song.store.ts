/**
 * Song project persistence — local-first, versioned, safe-parsed.
 *
 * Projects live in THIS browser via localStorage under one versioned key.
 * Every read runs through parseSongProject, so a record written by an older
 * build (or a partially damaged one) is repaired field-by-field instead of
 * thrown away. Writes are non-destructive upserts; nothing here replaces the
 * whole store wholesale except with the parsed contents it just read.
 */

import { parseSongProject, type SongProjectV1 } from "./song.engine";

const KEY = "sitr-music-songs-v1";

export function loadSongs(): SongProjectV1[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr.flatMap((v) => {
      const p = parseSongProject(v);
      return p ? [p] : [];
    });
  } catch {
    return [];
  }
}

/** Upserts one project and returns the new list (newest first). */
export function saveSong(project: SongProjectV1): SongProjectV1[] {
  const updated = { ...project, updatedAt: new Date().toISOString() };
  const rest = loadSongs().filter((p) => p.id !== project.id);
  const next = [updated, ...rest];
  persist(next);
  return next;
}

export function deleteSong(id: string): SongProjectV1[] {
  const next = loadSongs().filter((p) => p.id !== id);
  persist(next);
  return next;
}

function persist(list: SongProjectV1[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* storage full or blocked — the in-memory copy still works this session */
  }
}
