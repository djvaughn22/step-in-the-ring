// Source Identity Vault persistence — structurally separate from the story
// project store. Its own localStorage key, its own envelope, never touched by
// story.store.ts. The envelope carries a `cipher` field reserved for a later
// real-encryption pass; "none" is the honest current value — browser storage
// alone is NOT encryption (see VAULT_PRIVACY_EXPLANATION in vault.engine.ts).
//
// The vault lock below is a courtesy gate for shared devices: a SHA-256 hash
// of an owner-chosen code, checked client-side, unlocked per browser session.
// It deters casual access. It is not a security boundary, and the honest copy
// in the UI says so.

import { type SourceVaultV1 } from "./vault.engine";
import { cachedVault, persistVault } from "./db";

const LOCK_KEY = "sitr-source-vault-lock-v1";
const UNLOCK_SESSION_KEY = "sitr-source-vault-unlocked-v1";

export function loadVault(projectId: string): SourceVaultV1 | null {
  return cachedVault(projectId);
}

/** Persists to IndexedDB + mirror. Resolves false when nothing durable took the write. */
export function saveVault(vault: SourceVaultV1): Promise<boolean> {
  return persistVault(vault);
}

// ---------------------------------------------------------------------------
// Vault lock — courtesy gate, per session
// ---------------------------------------------------------------------------

/** Pure and testable: SHA-256 hex of the trimmed code with a fixed app salt. */
export async function hashLockCode(code: string): Promise<string> {
  const data = new TextEncoder().encode(`sitr-vault:${code.trim()}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function hasLock(): boolean {
  if (typeof window === "undefined") return false;
  return !!window.localStorage.getItem(LOCK_KEY);
}

export async function setLock(code: string): Promise<boolean> {
  if (typeof window === "undefined" || !code.trim()) return false;
  try {
    window.localStorage.setItem(LOCK_KEY, await hashLockCode(code));
    window.sessionStorage.setItem(UNLOCK_SESSION_KEY, "1");
    return true;
  } catch {
    return false;
  }
}

export async function unlockWithCode(code: string): Promise<boolean> {
  if (typeof window === "undefined") return false;
  const stored = window.localStorage.getItem(LOCK_KEY);
  if (!stored) return false;
  const ok = stored === (await hashLockCode(code));
  if (ok) {
    try {
      window.sessionStorage.setItem(UNLOCK_SESSION_KEY, "1");
    } catch {
      // session storage blocked — still unlocked for this render pass
    }
  }
  return ok;
}

export function isUnlocked(): boolean {
  if (typeof window === "undefined") return false;
  if (!hasLock()) return false; // no lock set yet — the UI forces setting one first
  return window.sessionStorage.getItem(UNLOCK_SESSION_KEY) === "1";
}

export function lockNow(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(UNLOCK_SESSION_KEY);
}

/**
 * Removes the lock (NOT the data) after the owner types the exact phrase.
 * Honest limit: because this is client-side, anyone at this device could do
 * the same — which is exactly why the lock is a courtesy, not security.
 */
export const LOCK_RESET_PHRASE = "RESET VAULT LOCK";

export function resetLock(typedPhrase: string): boolean {
  if (typeof window === "undefined") return false;
  if (typedPhrase.trim() !== LOCK_RESET_PHRASE) return false;
  window.localStorage.removeItem(LOCK_KEY);
  window.sessionStorage.removeItem(UNLOCK_SESSION_KEY);
  return true;
}
