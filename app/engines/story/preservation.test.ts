// @vitest-environment jsdom
//
// Revisions, backups, restore-as-copy, vault crypto, and the IndexedDB
// storage layer (fake-indexeddb). All identities are invented test data.

import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import {
  addChapter, addDraft, addMemory, addScene, createProject, exportPayload,
  placeSceneInChapter, type StoryProject,
} from "./story.engine";
import { addSource, createVault, type SourceVaultV1 } from "./vault.engine";
import {
  AUTOSAVE_KEEP, compareRevisions, makeRevision, planRestore, prunableAutosaves,
  type RevisionRecord,
} from "./revisions";
import {
  asRestoredCopy, exportOwnerBackup, OWNER_BACKUP_FILENAME_PREFIX, parseOwnerBackup,
} from "./backup";
import { decryptJson, encryptJson, isEncryptedEnvelope } from "./vault.crypto";
import {
  _resetStorageForTests, cachedActiveProject, cachedRevisions, cachedVault,
  enableVaultEncryption, initStorage, lockVault, persistProject, persistRevision,
  persistVault, unlockVault, vaultEncryptionState,
} from "./db";

function proseProject(title = "Preserve Me"): StoryProject {
  let p = createProject(title);
  const ch = addChapter(p, "One");
  p = ch.project;
  const sc = addScene(p, "Scene A");
  p = sc.project;
  p = addDraft(p, sc.record!.id, "First words of the story.");
  p = placeSceneInChapter(p, ch.record!.id, sc.record!.id);
  return p;
}

function vaultFor(p: StoryProject): SourceVaultV1 {
  let v = createVault(p.id);
  v = addSource(v, "person", "Test Realname").vault;
  return v;
}

// ---------------------------------------------------------------------------

describe("revisions", () => {
  it("autosave pruning never touches saves, checkpoints, or protected revisions", () => {
    const p = proseProject();
    const revs: RevisionRecord[] = [];
    for (let i = 0; i < AUTOSAVE_KEEP + 5; i++) {
      const r = makeRevision(p, "autosave");
      r.createdAt = new Date(2026, 0, 1, 0, i).toISOString();
      revs.push(r);
    }
    const save = makeRevision(p, "save");
    save.createdAt = new Date(2026, 0, 1, 0, 0, 1).toISOString(); // older than most autosaves
    const checkpoint = makeRevision(p, "checkpoint", "Owner read-through");
    checkpoint.createdAt = save.createdAt;
    revs.push(save, checkpoint);

    const prunable = prunableAutosaves(revs);
    expect(prunable).toHaveLength(5);
    expect(prunable.every((r) => r.kind === "autosave")).toBe(true);
    expect(prunable.some((r) => r.id === save.id || r.id === checkpoint.id)).toBe(false);
  });

  it("checkpoints are protected by construction", () => {
    expect(makeRevision(proseProject(), "checkpoint", "x").protected).toBe(true);
    expect(makeRevision(proseProject(), "autosave").protected).toBe(false);
  });

  it("restore parks the current state first — both branches survive", () => {
    const older = proseProject();
    const rev = makeRevision(older, "save");
    const newer = addMemory(older, "A newer memory typed after that save.").project;
    const plan = planRestore(newer, rev)!;
    expect(plan.park.kind).toBe("checkpoint");
    expect(plan.park.protected).toBe(true);
    expect(plan.park.snapshot.memories).toHaveLength(1); // the newer branch, parked
    expect(plan.restored.memories).toHaveLength(0); // the older state, restored
    expect(plan.restored.id).toBe(newer.id);
  });

  it("refuses to restore a revision from a different project", () => {
    const a = proseProject("A");
    const b = proseProject("B");
    expect(planRestore(a, makeRevision(b, "save"))).toBeNull();
  });

  it("compares revisions by counts and scene drafts", () => {
    const p1 = proseProject();
    const p2 = addDraft(p1, p1.scenes[0].id, "Second revision, rather longer than the first one was.");
    const lines = compareRevisions(makeRevision(p1, "save"), makeRevision(p2, "save"));
    expect(lines.some((l) => l.includes("Scene A") && l.includes("1 → 2"))).toBe(true);
  });
});

// ---------------------------------------------------------------------------

describe("dual backups", () => {
  it("the creative export contains no vault and no real names", () => {
    const p = proseProject();
    const v = vaultFor(p);
    const creative = exportPayload(p);
    expect(creative).not.toContain("Test Realname");
    expect(creative).not.toContain(v.sources[0].id);
  });

  it("the owner backup contains both, is marked, and round-trips", () => {
    const p = proseProject();
    const v = vaultFor(p);
    const raw = exportOwnerBackup(p, v);
    expect(raw).toContain("HIGHLY SENSITIVE");
    expect(raw).toContain("Test Realname");
    expect(OWNER_BACKUP_FILENAME_PREFIX.startsWith("PRIVATE")).toBe(true);
    const parsed = parseOwnerBackup(raw);
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.project.id).toBe(p.id);
      expect(parsed.vault!.sources[0].realName).toBe("Test Realname");
    }
  });

  it("rejects invalid and corrupt files", () => {
    expect(parseOwnerBackup("not json").ok).toBe(false);
    expect(parseOwnerBackup(JSON.stringify({ format: "something-else" })).ok).toBe(false);
    expect(parseOwnerBackup(JSON.stringify({ format: "sitr-complete-owner-backup", project: { junk: true } })).ok).toBe(false);
  });

  it("restore-as-copy remaps a colliding id and carries the vault along", () => {
    const p = proseProject();
    const v = vaultFor(p);
    const copy = asRestoredCopy(p, v, [p.id]);
    expect(copy.remapped).toBe(true);
    expect(copy.project.id).not.toBe(p.id);
    expect(copy.project.title).toContain("(restored)");
    expect(copy.vault!.projectId).toBe(copy.project.id);
    const noClash = asRestoredCopy(p, v, ["other-id"]);
    expect(noClash.remapped).toBe(false);
    expect(noClash.project.id).toBe(p.id);
  });
});

// ---------------------------------------------------------------------------

describe("vault crypto", () => {
  it("round-trips under the right passphrase", async () => {
    const env = await encryptJson("open sesame please", { secret: "Test Realname" });
    expect(isEncryptedEnvelope(env)).toBe(true);
    expect(env.data).not.toContain("Realname");
    const back = (await decryptJson("open sesame please", env)) as { secret: string };
    expect(back.secret).toBe("Test Realname");
  });

  it("fails closed on a wrong passphrase and on tampering", async () => {
    const env = await encryptJson("right-passphrase", { a: 1 });
    expect(await decryptJson("wrong-passphrase", env)).toBeNull();
    const tampered = { ...env, data: env.data.slice(0, -4) + (env.data.endsWith("AAAA") ? "BBBB" : "AAAA") };
    expect(await decryptJson("right-passphrase", tampered)).toBeNull();
  });
});

// ---------------------------------------------------------------------------

describe("IndexedDB storage layer", () => {
  beforeEach(async () => {
    _resetStorageForTests();
    await new Promise<void>((resolve) => {
      const req = indexedDB.deleteDatabase("sitr-story-partner");
      req.onsuccess = req.onerror = req.onblocked = () => resolve();
    });
    localStorage.clear();
  });

  it("reports indexeddb health and persists a project across a re-init", async () => {
    expect(await initStorage()).toBe("indexeddb");
    const p = proseProject();
    expect(await persistProject(p)).toBe(true);
    _resetStorageForTests(); // simulates a fresh page load against the same database
    await initStorage();
    expect(cachedActiveProject()?.id).toBe(p.id);
  });

  it("migrates legacy localStorage projects and vaults into IndexedDB once", async () => {
    const p = proseProject("Legacy Novel");
    const v = vaultFor(p);
    localStorage.setItem("sitr-story-partner-v1", JSON.stringify({ version: 1, projects: [p] }));
    localStorage.setItem("sitr-source-vault-v1", JSON.stringify({ version: 1, cipher: "none", vaults: [v] }));
    await initStorage();
    expect(cachedActiveProject()?.title).toBe("Legacy Novel");
    expect(cachedVault(p.id)?.sources[0].realName).toBe("Test Realname");
    // and it landed durably: a re-init with cleared localStorage still has it
    _resetStorageForTests();
    localStorage.clear();
    await initStorage();
    expect(cachedActiveProject()?.title).toBe("Legacy Novel");
  });

  it("revisions persist, and pruning runs on write", async () => {
    await initStorage();
    const p = proseProject();
    await persistProject(p);
    for (let i = 0; i < AUTOSAVE_KEEP + 3; i++) {
      const r = makeRevision(p, "autosave");
      r.createdAt = new Date(2026, 0, 1, 0, i).toISOString();
      await persistRevision(r);
    }
    await persistRevision(makeRevision(p, "checkpoint", "keep me"));
    const revs = cachedRevisions(p.id);
    expect(revs.filter((r) => r.kind === "autosave").length).toBeLessThanOrEqual(AUTOSAVE_KEEP);
    expect(revs.some((r) => r.label === "keep me")).toBe(true);
    _resetStorageForTests();
    await initStorage();
    expect(cachedRevisions(p.id).some((r) => r.label === "keep me")).toBe(true);
  });

  it("encrypted vault: seals at rest, unlocks with the passphrase, blocks plain writes while sealed", async () => {
    await initStorage();
    const p = proseProject();
    await persistProject(p);
    const v = vaultFor(p);
    await persistVault(v);
    expect(await enableVaultEncryption(p.id, "long-enough-pass")).toBe(true);
    expect(vaultEncryptionState(p.id)).toBe("unlocked");

    await lockVault(p.id);
    expect(vaultEncryptionState(p.id)).toBe("locked");
    expect(cachedVault(p.id)).toBeNull(); // sealed = unreadable
    expect(await persistVault(v)).toBe(false); // a plain write cannot clobber the sealed vault
    // nothing plaintext in the localStorage mirror
    expect(localStorage.getItem("sitr-source-vault-v1") ?? "").not.toContain("Test Realname");

    // fresh page load: still sealed, wrong passphrase fails, right one opens
    _resetStorageForTests();
    await initStorage();
    expect(vaultEncryptionState(p.id)).toBe("locked");
    expect(await unlockVault(p.id, "wrong")).toBe(false);
    expect(await unlockVault(p.id, "long-enough-pass")).toBe(true);
    expect(cachedVault(p.id)?.sources[0].realName).toBe("Test Realname");
  });
});
