// Real-to-Fiction Legend — tests. All identities below are invented test
// identities; no real person, place, or organization is referenced.

import { describe, expect, it } from "vitest";
import {
  addCharacter, addDraft, addMemory, addScene, briefingPack, createProject,
  exportPayload, parseImport, sanitizeProject, updateCharacter, type StoryProjectV1,
} from "./story.engine";
import {
  addMapping, addMappingChange, addNameSuggestion, addSource, aiSafeSourceContext,
  AI_BOUNDARY_NOTICE, ATTORNEY_LINE, createVault, deleteSource, exportVaultPayload,
  identityProtectionReport, IDENTITY_RISK_CHECKLIST, LEAKAGE_DISCLAIMER,
  leakageWarnings, linkMemoryToSource, markVaultExported, nameTooSimilar,
  parseVaultImport, redactRealNames, reviewMapping, sanitizeVault, searchVault,
  setMappingFiction, setSourceArchived, setSuggestionStatus, sourceIdFor,
  unlinkMemoryFromSource, updateMapping, updateSource, VAULT_EXPORT_FILENAME_PREFIX,
  VAULT_EXPORT_FORMAT, VAULT_EXPORT_NOTICE, VAULT_PRIVACY_EXPLANATION,
  type SourceVaultV1,
} from "./vault.engine";
import { hashLockCode } from "./vault.store";

// Invented test identities.
const REAL_NAME = "Harold Pretendman";
const REAL_PLACE = "Mirthville";
const REAL_ORG = "Fictional Grain Co-op";

function projectWithCharacter(): { project: StoryProjectV1; characterId: string } {
  let p = createProject("Test Novel", "A premise.");
  const made = addCharacter(p, "Silas Vane");
  p = made.project;
  return { project: p, characterId: made.record!.id };
}

function vaultWithPerson(): { vault: SourceVaultV1; sourceId: string } {
  const v = createVault("proj-1");
  const made = addSource(v, "person", REAL_NAME);
  return { vault: made.vault, sourceId: made.source!.id };
}

describe("private source IDs", () => {
  it("assigns stable sequential IDs never derived from the real name", () => {
    let v = createVault("p");
    const a = addSource(v, "person", REAL_NAME);
    v = a.vault;
    const b = addSource(v, "person", "Someone Else Invented");
    v = b.vault;
    const c = addSource(v, "place", REAL_PLACE);
    expect(a.source!.id).toBe("REAL-PERSON-001");
    expect(b.source!.id).toBe("REAL-PERSON-002");
    expect(c.source!.id).toBe("REAL-PLACE-001");
    expect(a.source!.id.toLowerCase()).not.toContain("harold");
    expect(a.source!.id.toLowerCase()).not.toContain("pretendman");
  });

  it("covers every source kind with its own ID series", () => {
    expect(sourceIdFor("org", 3)).toBe("REAL-ORG-003");
    expect(sourceIdFor("event", 1)).toBe("REAL-EVENT-001");
    expect(sourceIdFor("relationship", 12)).toBe("REAL-RELATIONSHIP-012");
    expect(sourceIdFor("experience", 1)).toBe("REAL-EXPERIENCE-001");
  });

  it("rejects an empty real name", () => {
    const v = createVault("p");
    expect(addSource(v, "person", "   ").source).toBeNull();
  });
});

describe("many-to-many mapping", () => {
  it("maps several sources into one composite and one source into several mappings", () => {
    let v = createVault("p");
    const s1 = addSource(v, "person", REAL_NAME); v = s1.vault;
    const s2 = addSource(v, "person", "Second Invented Person"); v = s2.vault;
    const composite = addMapping(v, [s1.source!.id, s2.source!.id], { workingLabel: "Composite uncle" });
    v = composite.vault;
    const second = addMapping(v, [s1.source!.id], { workingLabel: "Background cameo" });
    v = second.vault;
    expect(composite.mapping!.sourceIds).toHaveLength(2);
    expect(v.mappings.filter((m) => m.sourceIds.includes(s1.source!.id))).toHaveLength(2);
    expect(composite.mapping!.id).toBe("MAP-001");
    expect(second.mapping!.id).toBe("MAP-002");
  });

  it("refuses a mapping with no valid sources and never silently drops the last source", () => {
    const { vault, sourceId } = vaultWithPerson();
    expect(addMapping(vault, ["nonsense"]).mapping).toBeNull();
    const made = addMapping(vault, [sourceId]);
    const edited = updateMapping(made.vault, made.mapping!.id, { sourceIds: [] });
    expect(edited.mappings[0].sourceIds).toEqual([sourceId]);
  });
});

describe("rename-safe fictional links", () => {
  it("keeps the mapping intact when the fictional character is renamed", () => {
    const { project, characterId } = projectWithCharacter();
    const vwp = vaultWithPerson();
    let vault = vwp.vault;
    const sourceId = vwp.sourceId;
    const made = addMapping(vault, [sourceId], { fiction: { kind: "character", id: characterId } });
    vault = made.vault;
    const renamed = updateCharacter(project, characterId, { name: "Bartholomew Quill" });
    const m = vault.mappings[0];
    expect(m.fiction).toEqual({ kind: "character", id: characterId });
    expect(renamed.characters[0].name).toBe("Bartholomew Quill");
    // The link is by stable id — nothing in the vault had to change.
  });

  it("records the previous fictional name when the owner remaps", () => {
    const { project, characterId } = projectWithCharacter();
    const vwp = vaultWithPerson();
    let vault = vwp.vault;
    const sourceId = vwp.sourceId;
    const made = addMapping(vault, [sourceId], { fiction: { kind: "character", id: characterId } });
    vault = made.vault;
    vault = setMappingFiction(vault, made.mapping!.id, null, project);
    expect(vault.mappings[0].previousFictionalNames).toContain("Silas Vane");
    expect(vault.mappings[0].fiction).toBeNull();
  });
});

describe("memory workflow — identify and classify without touching the capture", () => {
  it("links a story memory to a source with a classification, replaceable and removable", () => {
    let p = createProject("T");
    const mem = addMemory(p, "An invented childhood memory for testing.");
    p = mem.project;
    const vwp = vaultWithPerson();
    let vault = vwp.vault;
    const sourceId = vwp.sourceId;
    vault = linkMemoryToSource(vault, sourceId, mem.memory!.id, "possible");
    expect(vault.sources[0].memoryLinks).toEqual([{ memoryId: mem.memory!.id, classification: "possible" }]);
    vault = linkMemoryToSource(vault, sourceId, mem.memory!.id, "confirmed");
    expect(vault.sources[0].memoryLinks).toEqual([{ memoryId: mem.memory!.id, classification: "confirmed" }]);
    vault = unlinkMemoryFromSource(vault, sourceId, mem.memory!.id);
    expect(vault.sources[0].memoryLinks).toEqual([]);
    // The raw capture itself was never touched.
    expect(p.memories[0].original).toBe("An invented childhood memory for testing.");
  });
});

describe("suggested names stay unapproved and assign nothing", () => {
  it("defaults to proposed; approving records a verdict but renames nothing", () => {
    const { project, characterId } = projectWithCharacter();
    const vwp = vaultWithPerson();
    let vault = vwp.vault;
    const sourceId = vwp.sourceId;
    const made = addMapping(vault, [sourceId], { fiction: { kind: "character", id: characterId } });
    vault = made.vault;
    vault = addNameSuggestion(vault, made.mapping!.id, "Cornelius Drift", "clear in audio");
    expect(vault.mappings[0].nameSuggestions[0].status).toBe("proposed");
    vault = setSuggestionStatus(vault, made.mapping!.id, vault.mappings[0].nameSuggestions[0].id, "approved");
    expect(vault.mappings[0].nameSuggestions[0].status).toBe("approved");
    // Nothing renamed anywhere: character keeps its name, workingLabel untouched.
    expect(project.characters[0].name).toBe("Silas Vane");
    expect(vault.mappings[0].workingLabel).toBe("");
  });
});

describe("separation from the story project and its exports", () => {
  it("story export contains no vault data even when a vault exists", () => {
    const { project } = projectWithCharacter();
    vaultWithPerson(); // exists independently — not connected to the export path at all
    const out = exportPayload(project);
    expect(out).not.toContain(REAL_NAME);
    expect(out).not.toContain("Harold");
    expect(out).not.toContain("REAL-PERSON-001");
  });

  it("a tampered story export smuggling vault data is stripped by sanitize", () => {
    const { project } = projectWithCharacter();
    const tampered = { ...project, vault: { sources: [{ realName: REAL_NAME }] } };
    const clean = sanitizeProject(tampered);
    expect(clean).not.toBeNull();
    expect(JSON.stringify(clean)).not.toContain(REAL_NAME);
    expect("vault" in (clean as unknown as Record<string, unknown>)).toBe(false);
  });

  it("story import rejects a vault file and vault import rejects a story file", () => {
    const { project } = projectWithCharacter();
    const { vault } = vaultWithPerson();
    expect(parseImport(exportVaultPayload(vault)).ok).toBe(false);
    expect(parseVaultImport(exportPayload(project)).ok).toBe(false);
  });
});

describe("AI boundary", () => {
  it("redacts full names and name words with source IDs, word-boundary safe", () => {
    const { vault } = vaultWithPerson();
    const text = `Harold Pretendman laughed. Harold left. The herald sounded. HAROLD shouted.`;
    const out = redactRealNames(text, vault.sources);
    expect(out).not.toMatch(/harold/i);
    expect(out).not.toContain("Pretendman");
    expect(out).toContain("[REAL-PERSON-001]");
    expect(out).toContain("herald"); // word boundary respected — no over-reach into other words
  });

  it("briefing packs can be redacted so real names never leave as-is", () => {
    const pwc = projectWithCharacter();
    let project = pwc.project;
    const characterId = pwc.characterId;
    const mem = addMemory(project, `${REAL_NAME} taught me to fish at ${REAL_PLACE}.`, {
      links: [{ kind: "character", id: characterId }],
    });
    project = mem.project;
    const { vault } = vaultWithPerson();
    const pack = briefingPack(project, { kind: "character", id: characterId }, "Ask five questions.");
    const redacted = redactRealNames(pack, vault.sources);
    expect(pack).toContain(REAL_NAME); // raw pack carries the verbatim memory by design
    expect(redacted).not.toContain(REAL_NAME);
    expect(redacted).toContain("[REAL-PERSON-001]");
  });

  it("aiSafeSourceContext sends IDs and decisions — never real names or private-only fields", () => {
    const { project, characterId } = projectWithCharacter();
    const vwp = vaultWithPerson();
    let vault = vwp.vault;
    const sourceId = vwp.sourceId;
    vault = updateSource(vault, sourceId, {
      neverPublish: "An invented secret that must never be published.",
      mustAlter: "Job title",
    });
    const made = addMapping(vault, [sourceId], { fiction: { kind: "character", id: characterId } });
    vault = made.vault;
    vault = updateMapping(vault, made.mapping!.id, {
      inspiredBy: `The way ${REAL_NAME} told stories`,
      mustStayPrivate: "The invented private thing.",
    });
    vault = addMappingChange(vault, made.mapping!.id, "Moved the city", "protects location privacy");
    const out = aiSafeSourceContext(vault, [made.mapping!.id], project);
    expect(out).toContain(AI_BOUNDARY_NOTICE);
    expect(out).toContain(sourceId);
    expect(out).toContain("Silas Vane");
    expect(out).toContain("Moved the city");
    expect(out).not.toContain(REAL_NAME);
    expect(out).not.toContain("never be published");
    expect(out).not.toContain("The invented private thing");
  });
});

describe("vault export — explicit, named, and separate", () => {
  it("uses its own format, a PRIVATE filename prefix, and a strong calm notice", () => {
    const { vault } = vaultWithPerson();
    const payload = exportVaultPayload(markVaultExported(vault));
    const parsed = JSON.parse(payload) as Record<string, unknown>;
    expect(parsed.format).toBe(VAULT_EXPORT_FORMAT);
    expect(parsed.notice).toBe(VAULT_EXPORT_NOTICE);
    expect(VAULT_EXPORT_FILENAME_PREFIX).toBe("PRIVATE-SOURCE-IDENTITY-VAULT");
    expect(VAULT_EXPORT_NOTICE).toContain("real identities");
    expect(VAULT_EXPORT_NOTICE).toContain("creative project backup");
  });

  it("round-trips through import with mappings, history, and dangling fiction intact", () => {
    const { characterId } = projectWithCharacter();
    const vwp = vaultWithPerson();
    let vault = vwp.vault;
    const sourceId = vwp.sourceId;
    const made = addMapping(vault, [sourceId], { fiction: { kind: "character", id: characterId } });
    vault = made.vault;
    vault = addMappingChange(vault, made.mapping!.id, "Changed the decade", "hides real dates");
    const back = parseVaultImport(exportVaultPayload(vault));
    expect(back.ok).toBe(true);
    if (!back.ok) return;
    expect(back.vault.sources[0].realName).toBe(REAL_NAME);
    expect(back.vault.mappings[0].fiction).toEqual({ kind: "character", id: characterId });
    expect(back.vault.mappings[0].changes[0].what).toBe("Changed the decade");
    expect(back.vault.mappings[0].history.length).toBeGreaterThan(0);
    // Counters recomputed — the next source ID cannot collide.
    const next = addSource(back.vault, "person", "Another Invented Person");
    expect(next.source!.id).toBe("REAL-PERSON-002");
  });

  it("sanitizeVault survives junk without throwing", () => {
    expect(sanitizeVault(null)).toBeNull();
    expect(sanitizeVault("junk")).toBeNull();
    expect(sanitizeVault({ projectId: "p", sources: [{ id: 5 }, null, { id: "x", kind: "alien", realName: "Q" }], mappings: "no" })).not.toBeNull();
    const v = sanitizeVault({ projectId: "p", sources: [], mappings: [{ id: "MAP-001", sourceIds: ["gone"] }] });
    expect(v!.mappings).toHaveLength(0); // a mapping with no surviving sources is dropped
  });
});

describe("history is append-only and explanatory", () => {
  it("appends on updates, reviews, changes, and archive moves", () => {
    const vwp = vaultWithPerson();
    let vault = vwp.vault;
    const sourceId = vwp.sourceId;
    const before = vault.sources[0].history.length;
    vault = updateSource(vault, sourceId, { lifePeriod: "the 1990s" }, "Life period recorded");
    vault = setSourceArchived(vault, sourceId, true);
    vault = setSourceArchived(vault, sourceId, false);
    expect(vault.sources[0].history.length).toBe(before + 3);
    const made = addMapping(vault, [sourceId]);
    vault = made.vault;
    vault = reviewMapping(vault, made.mapping!.id, "moderate", "approved");
    const m = vault.mappings[0];
    expect(m.lastReviewedAt).not.toBe("");
    expect(m.risk).toBe("moderate");
    expect(m.history[m.history.length - 1].note).toContain("Moderate identification risk");
  });
});

describe("deletion safeguards", () => {
  it("requires the exact typed source ID and refuses while mappings reference it", () => {
    const vwp = vaultWithPerson();
    let vault = vwp.vault;
    const sourceId = vwp.sourceId;
    const made = addMapping(vault, [sourceId]);
    vault = made.vault;
    expect(deleteSource(vault, sourceId, sourceId).ok).toBe(false); // still mapped
    expect(deleteSource(vault, sourceId, "wrong").ok).toBe(false);
    // Archival is always available instead.
    vault = setSourceArchived(vault, sourceId, true);
    expect(vault.sources[0].archived).toBe(true);
    // After removing the mapping reference... (mapping keeps its last source by law,
    // so the whole mapping must be gone before the source can be deleted)
    vault = { ...vault, mappings: [] };
    const gone = deleteSource(vault, sourceId, sourceId);
    expect(gone.ok).toBe(true);
    expect(gone.vault.sources).toHaveLength(0);
  });
});

describe("identity-leakage review", () => {
  it("flags a real name in fiction-bound text but not in raw memories", () => {
    let { project } = projectWithCharacter();
    const mem = addMemory(project, `A memory mentioning ${REAL_NAME} on purpose.`);
    project = mem.project;
    const sceneMade = addScene(project, "The dock");
    project = addDraft(sceneMade.project, sceneMade.record!.id, `${REAL_NAME} stood at the rail.`);
    const { vault } = vaultWithPerson();
    const warnings = leakageWarnings(vault, project);
    expect(warnings.some((w) => w.message.includes('scene "The dock" draft 1'))).toBe(true);
    expect(warnings.some((w) => w.message.includes("memory"))).toBe(false);
  });

  it("flags fictional names too similar to the real name, and honest-labels only", () => {
    expect(nameTooSimilar("Harold Pretendman", "Harry Prender")).toBe(false);
    expect(nameTooSimilar("Harold Pretendman", "Harold Quill")).toBe(true);
    expect(nameTooSimilar("Harold Pretendman", "Pretendworth Lane")).toBe(true); // 4+ char prefix
    expect(nameTooSimilar("Harold Pretendman", "Silas Vane")).toBe(false);
    expect(LEAKAGE_DISCLAIMER).toContain("No automated check can guarantee anonymity");
  });

  it("questions an approved mapping with zero recorded changes on a sensitive source", () => {
    const { project, characterId } = projectWithCharacter();
    const vwp = vaultWithPerson();
    let vault = vwp.vault;
    const sourceId = vwp.sourceId;
    vault = updateSource(vault, sourceId, { sensitivity: "highly-sensitive" });
    const made = addMapping(vault, [sourceId], { fiction: { kind: "character", id: characterId } });
    vault = reviewMapping(made.vault, made.mapping!.id, "low", "approved");
    const warnings = leakageWarnings(vault, project);
    expect(warnings.some((w) => w.message.includes("zero deliberate changes"))).toBe(true);
  });
});

describe("identity protection report", () => {
  it("is owner-only in tone, lists gaps, and never claims a guarantee", () => {
    const { project } = projectWithCharacter();
    const { vault, sourceId } = vaultWithPerson();
    const report = identityProtectionReport(vault, project);
    expect(report).toContain("PRIVATE");
    expect(report).toContain(`Sources with NO mapping yet: ${sourceId}`);
    expect(report).toContain(LEAKAGE_DISCLAIMER);
    expect(report).toContain(ATTORNEY_LINE);
    expect(report).toContain("never rewrites the manuscript");
    for (const item of IDENTITY_RISK_CHECKLIST) expect(report).toContain(item);
  });
});

describe("private search", () => {
  it("finds sources by real name and mappings by fictional name — vault-side only", () => {
    const { project, characterId } = projectWithCharacter();
    const vwp = vaultWithPerson();
    let vault = vwp.vault;
    const sourceId = vwp.sourceId;
    const made = addMapping(vault, [sourceId], { fiction: { kind: "character", id: characterId } });
    vault = made.vault;
    expect(searchVault(vault, project, "pretendman")[0].id).toBe(sourceId);
    expect(searchVault(vault, project, "silas").some((h) => h.kind === "mapping")).toBe(true);
    expect(searchVault(vault, project, "")).toEqual([]);
    // The ordinary story workspace has no real-name search: the story project
    // simply never holds the real name unless the owner types it there.
    expect(JSON.stringify(project)).not.toContain(REAL_NAME);
  });
});

describe("vault lock", () => {
  it("hashes match only for the right code", async () => {
    const right = await hashLockCode("open sesame invented");
    expect(await hashLockCode("open sesame invented")).toBe(right);
    expect(await hashLockCode("wrong code")).not.toBe(right);
    expect(right).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe("honest storage copy", () => {
  it("says plainly that browser storage is not encryption and the lock is not security", () => {
    expect(VAULT_PRIVACY_EXPLANATION).toContain("NOT encryption");
    expect(VAULT_PRIVACY_EXPLANATION).toContain("not a security boundary");
    expect(VAULT_PRIVACY_EXPLANATION).toContain("separate from");
  });

  it("real names appear nowhere in generated identifiers or org names in this suite", () => {
    // Meta-guard: the invented names used here are clearly fictional markers.
    expect(REAL_NAME).toContain("Pretend");
    expect(REAL_PLACE).toContain("Mirth");
    expect(REAL_ORG).toContain("Fictional");
  });
});
