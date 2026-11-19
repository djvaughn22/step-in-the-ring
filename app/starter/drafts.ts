// Several drafts per browser (2026-11-18). Before this, starting a second
// example replaced the first. Now each example someone tries keeps its own
// draft, and they choose which one to keep working on.
//
// Storage: one localStorage key holding every draft. The older single-draft
// key (DRAFT_KEY) is read once and moved in, never lost: the old draft is held
// in memory until the new store is safely written.
//
// Nothing here is sent anywhere. Photos live inside the drafts as data: URLs,
// so the browser's storage limit is the real cap; MAX_DRAFTS keeps it sane.

import { DRAFT_KEY, draftFromExample, parseDraft } from "./draft";
import { exampleBySlug } from "./examples";
import type { SiteDraft } from "./types";

export const DRAFTS_KEY = "sitr-site-drafts-v1";
export const MAX_DRAFTS = 8;

export interface DraftEntry {
  id: string;
  /** Last change, ms since epoch. */
  updated: number;
  draft: SiteDraft;
}

export interface DraftStore {
  v: 1;
  /** The draft the editor opens. Empty when there are none. */
  active: string;
  drafts: DraftEntry[];
}

export const EMPTY_STORE: DraftStore = { v: 1, active: "", drafts: [] };

export function newDraftId(now: number = Date.now()): string {
  return `d${now.toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

/** Read a stored value without trusting it: malformed drafts are dropped, never crash the page. */
export function parseStore(raw: unknown): DraftStore | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Partial<DraftStore>;
  if (r.v !== 1 || !Array.isArray(r.drafts)) return null;
  const drafts: DraftEntry[] = [];
  const seen = new Set<string>();
  for (const e of r.drafts as Partial<DraftEntry>[]) {
    if (!e || typeof e.id !== "string" || !e.id || seen.has(e.id)) continue;
    const draft = parseDraft(e.draft);
    if (!draft) continue;
    seen.add(e.id);
    drafts.push({ id: e.id, updated: typeof e.updated === "number" ? e.updated : 0, draft });
  }
  const active = typeof r.active === "string" && seen.has(r.active) ? r.active : mostRecent(drafts)?.id ?? "";
  return { v: 1, active, drafts };
}

export function mostRecent(drafts: DraftEntry[]): DraftEntry | undefined {
  return [...drafts].sort((a, b) => b.updated - a.updated)[0];
}

export function activeEntry(store: DraftStore): DraftEntry | undefined {
  return store.drafts.find((e) => e.id === store.active);
}

/** Newest first, for lists. */
export function byRecent(store: DraftStore): DraftEntry[] {
  return [...store.drafts].sort((a, b) => b.updated - a.updated);
}

export function addDraft(store: DraftStore, draft: SiteDraft, now: number = Date.now(), id: string = newDraftId(now)): DraftStore {
  return { v: 1, active: id, drafts: [...store.drafts, { id, updated: now, draft }] };
}

export function updateActive(store: DraftStore, draft: SiteDraft, now: number = Date.now()): DraftStore {
  if (!activeEntry(store)) return store;
  return { ...store, drafts: store.drafts.map((e) => (e.id === store.active ? { ...e, draft, updated: now } : e)) };
}

export function setActive(store: DraftStore, id: string): DraftStore {
  return store.drafts.some((e) => e.id === id) ? { ...store, active: id } : store;
}

export function removeDraft(store: DraftStore, id: string): DraftStore {
  const drafts = store.drafts.filter((e) => e.id !== id);
  const active = store.active === id ? mostRecent(drafts)?.id ?? "" : store.active;
  return { v: 1, active, drafts };
}

/** True when nobody has changed this draft since it was made from its example. */
export function isUntouched(d: SiteDraft): boolean {
  const ex = exampleBySlug(d.example);
  return !!ex && JSON.stringify(draftFromExample(ex)) === JSON.stringify(d);
}

/**
 * Open an example: reuse an untouched draft of the same example if there is
 * one (clicking "Start from this" twice shouldn't make two), otherwise add a
 * new draft. Returns null when the browser already holds MAX_DRAFTS.
 */
export function openExample(store: DraftStore, slug: string, now: number = Date.now()): DraftStore | null {
  const ex = exampleBySlug(slug);
  if (!ex) return store;
  const same = byRecent(store).find((e) => e.draft.example === slug && isUntouched(e.draft));
  if (same) return { ...setActive(store, same.id), drafts: store.drafts.map((e) => (e.id === same.id ? { ...e, updated: now } : e)) };
  if (store.drafts.length >= MAX_DRAFTS) return null;
  return addDraft(store, draftFromExample(ex), now);
}

/** What a draft is called in lists: the name they typed, else the example's kind. */
export function draftLabel(d: SiteDraft): string {
  const name = d.details.name.trim();
  if (name) return name;
  return exampleBySlug(d.example)?.name ?? "Untitled draft";
}

type Store = Pick<Storage, "getItem" | "setItem" | "removeItem">;

/**
 * Read every draft in this browser. The first time, the single draft from
 * the older key is moved in. Never throws.
 */
export function loadStore(storage: Store, now: number = Date.now()): DraftStore {
  try {
    const parsed = parseStore(JSON.parse(storage.getItem(DRAFTS_KEY) ?? "null"));
    if (parsed) return parsed;
    const legacy = parseDraft(JSON.parse(storage.getItem(DRAFT_KEY) ?? "null"));
    if (!legacy) return EMPTY_STORE;
    const store = addDraft(EMPTY_STORE, legacy, now);
    // Move it: drop the old copy first so a photo-heavy draft isn't stored
    // twice, then write the new one. If that write fails, put the old one back.
    storage.removeItem(DRAFT_KEY);
    if (saveStore(storage, store) !== "ok") {
      try { storage.setItem(DRAFT_KEY, JSON.stringify(legacy)); } catch { /* still held in memory below */ }
    }
    return store;
  } catch {
    return EMPTY_STORE;
  }
}

/** Write every draft. "full" when the browser is out of room. */
export function saveStore(storage: Store, store: DraftStore): "ok" | "full" {
  try {
    storage.setItem(DRAFTS_KEY, JSON.stringify(store));
    return "ok";
  } catch {
    return "full";
  }
}
