// Music session persistence: local-first, one active session, safe-parsed —
// same shape of guarantee as song.store.ts, proven the same way.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { advance, startSession } from "./music-session.engine";

function makeStorage() {
  const store = new Map<string, string>();
  return {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear(),
  };
}

beforeEach(() => {
  vi.stubGlobal("window", { localStorage: makeStorage() });
});
afterEach(() => {
  vi.unstubAllGlobals();
});

describe("music session persistence", () => {
  it("saves and reloads a session, surviving a simulated reload", async () => {
    const { loadSession, saveSession } = await import("./music-session.store");
    expect(loadSession()).toBeNull();

    const s = startSession("a laid-back reggae beat", "bandlab");
    saveSession(s);

    const reloaded = loadSession();
    expect(reloaded?.id).toBe(s.id);
    expect(reloaded?.goal).toBe("a laid-back reggae beat");
    expect(reloaded?.tool).toBe("bandlab");
  });

  it("persists progress across saves", async () => {
    const { loadSession, saveSession } = await import("./music-session.store");
    let s = startSession("something fun", "unsure");
    saveSession(s);
    s = advance(s, "Done, moving on");
    saveSession(s);

    const reloaded = loadSession();
    expect(reloaded?.stepIndex).toBe(1);
    expect(reloaded?.log[0].note).toBe("Done, moving on");
  });

  it("reset (clearSession) removes the active session", async () => {
    const { clearSession, loadSession, saveSession } = await import("./music-session.store");
    saveSession(startSession("a simple piano idea", "garageband"));
    expect(loadSession()).not.toBeNull();

    clearSession();
    expect(loadSession()).toBeNull();
  });

  it("survives corrupted storage safely", async () => {
    window.localStorage.setItem("sitr-music-session-v1", "{not json");
    const { loadSession } = await import("./music-session.store");
    expect(loadSession()).toBeNull();
  });
});
