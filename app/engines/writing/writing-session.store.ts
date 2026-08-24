/**
 * Writing session persistence — one active session, local-first, safe-parsed.
 * Same shape of guarantee as music-session.store.ts / game-idea.store.ts.
 */

import { parseWritingSession, type WritingSessionV1 } from "./writing-session.engine";

const KEY = "sitr-writing-session-v1";

export function loadWritingSession(): WritingSessionV1 | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    return parseWritingSession(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function saveWritingSession(session: WritingSessionV1): WritingSessionV1 {
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

export function clearWritingSession(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
}
