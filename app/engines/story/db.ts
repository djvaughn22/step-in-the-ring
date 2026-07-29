// Local-first storage for the Author's Room.
//
// Architecture: IndexedDB is the durable store (no 5 MB ceiling, structured
// records, survives refresh and browser restart). An in-memory cache is
// hydrated once at startup so the UI keeps its simple synchronous reads.
// localStorage is kept as a best-effort mirror of projects and vaults — it's
// where pre-IndexedDB data lives, so it doubles as the migration source and
// as a fallback when IndexedDB is unavailable.
//
// Nothing here talks to the network. Ever.

import { sanitizeProject, type StoryProject } from "./story.engine";
import { sanitizeVault, type SourceVaultV1 } from "./vault.engine";
import { prunableAutosaves, type RevisionRecord } from "./revisions";
import { decryptJson, encryptJson, isEncryptedEnvelope, type EncryptedEnvelope } from "./vault.crypto";

/** How a vault sits in durable storage: plain, or sealed under a passphrase. */
interface StoredVault {
  projectId: string;
  encrypted?: EncryptedEnvelope;
  vault?: SourceVaultV1;
}

const DB_NAME = "sitr-story-partner";
const DB_VERSION = 1;
const LEGACY_PROJECTS_KEY = "sitr-story-partner-v1";
const LEGACY_VAULT_KEY = "sitr-source-vault-v1";

export type StorageHealth = "indexeddb" | "localstorage-only" | "memory-only";

interface Cache {
  ready: boolean;
  health: StorageHealth;
  projects: StoryProject[];
  /** Decrypted (or never-encrypted) vaults, readable by the UI. */
  vaults: SourceVaultV1[];
  /** Encrypted vaults still sealed — unreadable until unlockVault(). */
  sealed: Map<string, EncryptedEnvelope>;
  /** Passphrases for vaults unlocked THIS page load — memory only, never stored. */
  vaultKeys: Map<string, string>;
  revisions: RevisionRecord[];
}

const cache: Cache = {
  ready: false, health: "memory-only", projects: [], vaults: [],
  sealed: new Map(), vaultKeys: new Map(), revisions: [],
};

let dbPromise: Promise<IDBDatabase | null> | null = null;
let openedDb: IDBDatabase | null = null;

function openDb(): Promise<IDBDatabase | null> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve) => {
    if (typeof indexedDB === "undefined") {
      resolve(null);
      return;
    }
    try {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains("projects")) db.createObjectStore("projects", { keyPath: "id" });
        if (!db.objectStoreNames.contains("vaults")) db.createObjectStore("vaults", { keyPath: "projectId" });
        if (!db.objectStoreNames.contains("revisions")) {
          const store = db.createObjectStore("revisions", { keyPath: "id" });
          store.createIndex("projectId", "projectId", { unique: false });
        }
        if (!db.objectStoreNames.contains("meta")) db.createObjectStore("meta");
      };
      req.onsuccess = () => { openedDb = req.result; resolve(req.result); };
      req.onerror = () => resolve(null);
      req.onblocked = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
  return dbPromise;
}

function idbGetAll<T>(db: IDBDatabase, store: string): Promise<T[]> {
  return new Promise((resolve) => {
    try {
      const req = db.transaction(store, "readonly").objectStore(store).getAll();
      req.onsuccess = () => resolve((req.result as T[]) ?? []);
      req.onerror = () => resolve([]);
    } catch {
      resolve([]);
    }
  });
}

function idbPut(db: IDBDatabase, store: string, value: unknown): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(store, "readwrite");
      tx.objectStore(store).put(value);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
      tx.onabort = () => resolve(false);
    } catch {
      resolve(false);
    }
  });
}

function idbDelete(db: IDBDatabase, store: string, key: IDBValidKey): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(store, "readwrite");
      tx.objectStore(store).delete(key);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
      tx.onabort = () => resolve(false);
    } catch {
      resolve(false);
    }
  });
}

// ---------------------------------------------------------------------------
// Legacy localStorage parsing (also the mirror format)
// ---------------------------------------------------------------------------

function legacyProjects(): StoryProject[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LEGACY_PROJECTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { projects?: unknown[] };
    return (Array.isArray(parsed?.projects) ? parsed.projects : [])
      .map(sanitizeProject)
      .filter((p): p is StoryProject => !!p);
  } catch {
    return [];
  }
}

function legacyVaults(): SourceVaultV1[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LEGACY_VAULT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { vaults?: unknown[] };
    return (Array.isArray(parsed?.vaults) ? parsed.vaults : [])
      .map(sanitizeVault)
      .filter((v): v is SourceVaultV1 => !!v);
  } catch {
    return [];
  }
}

function mirrorProjects(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LEGACY_PROJECTS_KEY, JSON.stringify({ version: 1, projects: cache.projects }));
  } catch {
    // mirror is best-effort — IndexedDB already has the data
  }
}

/**
 * Mirror only vaults that are NOT under encryption — a sealed vault's
 * plaintext must never be written back to ordinary unencrypted storage.
 * (Encrypted vaults live in IndexedDB as their sealed envelopes.)
 */
function mirrorVaults(): void {
  if (typeof window === "undefined") return;
  try {
    const plain = cache.vaults.filter((v) => !cache.vaultKeys.has(v.projectId) && !cache.sealed.has(v.projectId));
    window.localStorage.setItem(LEGACY_VAULT_KEY, JSON.stringify({ version: 1, cipher: "none", vaults: plain }));
  } catch {
    // best-effort
  }
}

// ---------------------------------------------------------------------------
// Startup — hydrate cache, migrate legacy data into IndexedDB once
// ---------------------------------------------------------------------------

export async function initStorage(): Promise<StorageHealth> {
  if (cache.ready) return cache.health;

  const db = await openDb();
  const fromLocal = legacyProjects();
  const localVaults = legacyVaults();

  if (db) {
    const [projects, vaults, revisions] = await Promise.all([
      idbGetAll<unknown>(db, "projects"),
      idbGetAll<StoredVault>(db, "vaults"),
      idbGetAll<RevisionRecord>(db, "revisions"),
    ]);
    cache.projects = projects.map(sanitizeProject).filter((p): p is StoryProject => !!p);
    cache.vaults = [];
    cache.sealed = new Map();
    for (const stored of vaults) {
      if (!stored || typeof stored.projectId !== "string") continue;
      if (isEncryptedEnvelope(stored.encrypted)) {
        cache.sealed.set(stored.projectId, stored.encrypted);
        continue;
      }
      const v = sanitizeVault(stored.vault);
      if (v) cache.vaults.push(v);
    }
    cache.revisions = revisions.filter((r) => r && typeof r.id === "string" && !!sanitizeProject(r.snapshot));
    cache.health = "indexeddb";

    // One-time migration: anything in localStorage that IndexedDB doesn't have yet.
    for (const p of fromLocal) {
      if (!cache.projects.some((x) => x.id === p.id)) {
        cache.projects.push(p);
        await idbPut(db, "projects", p);
      }
    }
    for (const v of localVaults) {
      if (!cache.vaults.some((x) => x.projectId === v.projectId) && !cache.sealed.has(v.projectId)) {
        cache.vaults.push(v);
        await idbPut(db, "vaults", { projectId: v.projectId, vault: v } satisfies StoredVault);
      }
    }
  } else {
    cache.projects = fromLocal;
    cache.vaults = localVaults;
    cache.revisions = [];
    cache.health = typeof window !== "undefined" && !!window.localStorage ? "localstorage-only" : "memory-only";
  }

  cache.ready = true;
  return cache.health;
}

export function storageHealth(): StorageHealth {
  return cache.health;
}

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------

export function cachedProjects(): StoryProject[] {
  return cache.projects;
}

export function cachedActiveProject(): StoryProject | null {
  return cache.projects[0] ?? null;
}

export async function persistProject(p: StoryProject, makeActive = true): Promise<boolean> {
  const rest = cache.projects.filter((x) => x.id !== p.id);
  cache.projects = makeActive ? [p, ...rest] : [...rest, p];
  mirrorProjects();
  const db = await openDb();
  if (!db) return cache.health !== "memory-only";
  return idbPut(db, "projects", p);
}

export async function setActiveProject(id: string): Promise<void> {
  const found = cache.projects.find((p) => p.id === id);
  if (!found) return;
  cache.projects = [found, ...cache.projects.filter((p) => p.id !== id)];
  mirrorProjects();
}

// ---------------------------------------------------------------------------
// Vaults
// ---------------------------------------------------------------------------

/** Null when there is no vault — or when it exists but is still sealed. */
export function cachedVault(projectId: string): SourceVaultV1 | null {
  return cache.vaults.find((v) => v.projectId === projectId) ?? null;
}

export async function persistVault(v: SourceVaultV1): Promise<boolean> {
  // A sealed vault can only be written through unlockVault() first — a plain
  // write here would silently replace the encrypted copy.
  if (cache.sealed.has(v.projectId)) return false;
  cache.vaults = [v, ...cache.vaults.filter((x) => x.projectId !== v.projectId)];
  const passphrase = cache.vaultKeys.get(v.projectId);
  mirrorVaults();
  const db = await openDb();
  if (!db) return !passphrase && cache.health !== "memory-only";
  const stored: StoredVault = passphrase
    ? { projectId: v.projectId, encrypted: await encryptJson(passphrase, v) }
    : { projectId: v.projectId, vault: v };
  return idbPut(db, "vaults", stored);
}

// ---------------------------------------------------------------------------
// Vault encryption — opt-in AES-256-GCM under an owner passphrase.
// The passphrase is NOT recoverable; see vault.crypto.ts for the honest
// limits. While locked, cachedVault() returns null — the UI can't leak what
// it can't read.
// ---------------------------------------------------------------------------

export function vaultEncryptionState(projectId: string): "off" | "locked" | "unlocked" {
  if (cache.vaultKeys.has(projectId)) return "unlocked";
  if (cache.sealed.has(projectId)) return "locked";
  return "off";
}

export async function enableVaultEncryption(projectId: string, passphrase: string): Promise<boolean> {
  const v = cachedVault(projectId);
  if (!v || passphrase.length < 8 || cache.sealed.has(projectId)) return false;
  cache.vaultKeys.set(projectId, passphrase);
  const ok = await persistVault(v);
  if (!ok) {
    cache.vaultKeys.delete(projectId);
    return false;
  }
  mirrorVaults(); // drops the plaintext mirror copy now that it's sealed
  return true;
}

export async function unlockVault(projectId: string, passphrase: string): Promise<boolean> {
  const envelope = cache.sealed.get(projectId);
  if (!envelope) return false;
  const decrypted = await decryptJson(passphrase, envelope);
  const v = sanitizeVault(decrypted);
  if (!v || v.projectId !== projectId) return false;
  cache.sealed.delete(projectId);
  cache.vaultKeys.set(projectId, passphrase);
  cache.vaults = [v, ...cache.vaults.filter((x) => x.projectId !== projectId)];
  return true;
}

/** Drop the decrypted vault and its key from memory; the sealed copy stays in storage. */
export async function lockVault(projectId: string): Promise<void> {
  const passphrase = cache.vaultKeys.get(projectId);
  const v = cachedVault(projectId);
  if (!passphrase || !v) return;
  // Reseal from the current in-memory state so nothing typed since the last save is lost.
  const envelope = await encryptJson(passphrase, v);
  const db = await openDb();
  if (db) await idbPut(db, "vaults", { projectId, encrypted: envelope } satisfies StoredVault);
  cache.sealed.set(projectId, envelope);
  cache.vaultKeys.delete(projectId);
  cache.vaults = cache.vaults.filter((x) => x.projectId !== projectId);
}

/** Requires an unlocked vault. Writes it back as plaintext and forgets the key. */
export async function disableVaultEncryption(projectId: string): Promise<boolean> {
  if (!cache.vaultKeys.has(projectId)) return false;
  const v = cachedVault(projectId);
  if (!v) return false;
  cache.vaultKeys.delete(projectId);
  cache.sealed.delete(projectId);
  return persistVault(v);
}

/** Lock every unlocked vault — called when the owner leaves the room. */
export async function lockAllVaults(): Promise<void> {
  for (const projectId of [...cache.vaultKeys.keys()]) await lockVault(projectId);
}

// ---------------------------------------------------------------------------
// Revisions — autosave pruning never touches saves, checkpoints, or anything
// protected (see revisions.ts)
// ---------------------------------------------------------------------------

export function cachedRevisions(projectId: string): RevisionRecord[] {
  return cache.revisions
    .filter((r) => r.projectId === projectId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function persistRevision(rev: RevisionRecord): Promise<boolean> {
  cache.revisions = [rev, ...cache.revisions.filter((r) => r.id !== rev.id)];
  const db = await openDb();
  const ok = db ? await idbPut(db, "revisions", rev) : false;

  const prunable = prunableAutosaves(cache.revisions.filter((r) => r.projectId === rev.projectId));
  if (prunable.length > 0) {
    const dropIds = new Set(prunable.map((r) => r.id));
    cache.revisions = cache.revisions.filter((r) => !dropIds.has(r.id));
    if (db) for (const r of prunable) await idbDelete(db, "revisions", r.id);
  }
  return db ? ok : cache.health !== "memory-only";
}

export async function setRevisionProtected(id: string, on: boolean): Promise<void> {
  const rev = cache.revisions.find((r) => r.id === id);
  if (!rev) return;
  const next = { ...rev, protected: on };
  cache.revisions = cache.revisions.map((r) => (r.id === id ? next : r));
  const db = await openDb();
  if (db) await idbPut(db, "revisions", next);
}

// ---------------------------------------------------------------------------
// Test hook — never called by application code
// ---------------------------------------------------------------------------

export function _resetStorageForTests(): void {
  try {
    openedDb?.close();
  } catch {
    // already closed
  }
  openedDb = null;
  cache.ready = false;
  cache.health = "memory-only";
  cache.projects = [];
  cache.vaults = [];
  cache.sealed = new Map();
  cache.vaultKeys = new Map();
  cache.revisions = [];
  dbPromise = null;
}
