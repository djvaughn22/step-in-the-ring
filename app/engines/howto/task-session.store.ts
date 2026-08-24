/**
 * Task session persistence — one active session, local-first, safe-parsed.
 * Same shape of guarantee as music-session.store.ts.
 */

import { parseTaskSession, type TaskSessionV1 } from "./task-session.engine";

const KEY = "sitr-howto-task-session-v1";

export function loadTaskSession(): TaskSessionV1 | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    return parseTaskSession(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function saveTaskSession(session: TaskSessionV1): TaskSessionV1 {
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

export function clearTaskSession(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
}
