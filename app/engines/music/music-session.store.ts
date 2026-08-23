/**
 * Music session persistence — one active session, local-first, safe-parsed.
 *
 * Unlike song.store.ts (a list of full song projects), a music session is a
 * single working scratchpad: what you're making right now, right now's step.
 * Starting something new replaces it — that's the "reset" the owner asked for.
 */

import { parseSession, type MusicSessionV1 } from "./music-session.engine";

const KEY = "sitr-music-session-v1";

export function loadSession(): MusicSessionV1 | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    return parseSession(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function saveSession(session: MusicSessionV1): MusicSessionV1 {
  const updated = { ...session, updatedAt: new Date().toISOString() };
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(updated));
    } catch {
      /* storage full or blocked — the in-memory copy still works this session */
    }
  }
  return updated;
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
}
