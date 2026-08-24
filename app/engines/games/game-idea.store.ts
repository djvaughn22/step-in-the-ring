/**
 * Game idea session persistence — one active session, local-first, safe-parsed.
 * Same shape of guarantee as music-session.store.ts.
 */

import { parseGameIdeaSession, type GameIdeaSessionV1 } from "./game-idea.engine";

const KEY = "sitr-game-idea-session-v1";

export function loadGameIdeaSession(): GameIdeaSessionV1 | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    return parseGameIdeaSession(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function saveGameIdeaSession(session: GameIdeaSessionV1): GameIdeaSessionV1 {
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

export function clearGameIdeaSession(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
}
