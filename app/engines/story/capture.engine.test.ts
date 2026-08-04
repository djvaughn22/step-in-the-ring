import { beforeEach, describe, expect, it } from "vitest";
import {
  addApprovedSceneToManuscript, addSpokenSource, addTypedSource, awaitingReview,
  buildManuscriptExport, continueTarget, findSource, manuscriptLeakScan, updateSourceIn,
} from "./capture.engine";
import {
  addAuthorDirection, addAuthorIngredient, addSourceVersion, answerQuestion,
  attachProposedDirections, attachProposedIngredients, currentSourceText,
  editDirection, editIngredient, nextQuestion, proposeDirections,
  proposeIngredients, QUESTION_BANK, rejectAllProposedDirections, savedForLater,
  sanitizeSource, setDirectionState, setIngredientState, setManualTranscript,
  sourceIdFor, sourceStage, updateSourceMeta,
  type SourceMaterial,
} from "./source.engine";
import { createProject, exportPayload, parseImport, sanitizeProject, type StoryProject } from "./story.engine";
import {
  addMapping, addSource as addVaultSource, createVault,
  linkSourceMaterialToMapping, sanitizeVault, unlinkSourceMaterialFromMapping,
} from "./vault.engine";

const MEMORY_TEXT =
  "My grandfather never talked about the war, but that day on the porch he told me everything. " +
  "I was afraid to move. He wanted me to understand something he couldn't say to my mother. " +
  "After that, everything changed between us. I still wonder why he chose me.";

function projectWith(text = MEMORY_TEXT): { project: StoryProject; source: SourceMaterial } {
  const p = createProject("Test Saga", "A test premise");
  const made = addTypedSource(p, text, { title: "The porch" });
  return { project: made.project, source: made.source! };
}

// ---------------------------------------------------------------------------
// Stable SM ids (capture law 1)
// ---------------------------------------------------------------------------

describe("stable source ids", () => {
  it("allocates sequential SM-#### ids from the project counter", () => {
    let p = createProject("T");
    const a = addTypedSource(p, "first");
    p = a.project;
    const b = addTypedSource(p, "second");
    p = b.project;
    expect(a.source!.id).toBe("SM-0001");
    expect(b.source!.id).toBe("SM-0002");
    expect(p.sourceCounter).toBe(2);
  });

  it("ids contain no content and survive sanitize unchanged", () => {
    const { project } = projectWith();
    const clean = sanitizeProject(JSON.parse(JSON.stringify(project)))!;
    expect(clean.sources[0].id).toBe("SM-0001");
    expect(clean.sources[0].id).not.toContain("porch");
  });

  it("recomputes the counter from stored ids so new ids never collide", () => {
    const { project } = projectWith();
    const stored = JSON.parse(JSON.stringify(project));
    stored.sourceCounter = 0; // corrupted counter
    const clean = sanitizeProject(stored)!;
    expect(clean.sourceCounter).toBe(1);
    const next = addTypedSource(clean, "another");
    expect(next.source!.id).toBe("SM-0002");
  });

  it("sourceIdFor pads to four digits", () => {
    expect(sourceIdFor(7)).toBe("SM-0007");
    expect(sourceIdFor(12345)).toBe("SM-12345");
  });
});

// ---------------------------------------------------------------------------
// Typed path — the exact original is write-once
// ---------------------------------------------------------------------------

describe("typed path preservation", () => {
  it("preserves the submitted text exactly, including whitespace", () => {
    const raw = "  line one\n\n  line two — exactly as typed  ";
    const { source } = projectWith(raw);
    expect(source.original).toBe(raw);
  });

  it("editing creates a new version and never changes the original", () => {
    const { project, source } = projectWith();
    const next = updateSourceIn(project, source.id, (s) => addSourceVersion(s, "A cleaned-up retelling.", "tightened"));
    const after = findSource(next, source.id)!;
    expect(after.original).toBe(MEMORY_TEXT);
    expect(after.versions).toHaveLength(1);
    expect(after.versions[0].text).toBe("A cleaned-up retelling.");
    expect(currentSourceText(after)).toBe("A cleaned-up retelling.");
    // and again — append-only
    const third = updateSourceIn(next, source.id, (s) => addSourceVersion(s, "Third pass."));
    expect(findSource(third, source.id)!.versions).toHaveLength(2);
    expect(findSource(third, source.id)!.versions[0].text).toBe("A cleaned-up retelling.");
  });

  it("an unfinished entry saves as a draft and can be finished later", () => {
    const p = createProject("T");
    const made = addTypedSource(p, "half a thought", { draft: true });
    expect(made.source!.draft).toBe(true);
    expect(sourceStage(made.source!)).toBe("draft");
    const finished = updateSourceIn(made.project, made.source!.id, (s) => updateSourceMeta(s, { draft: false }));
    expect(sourceStage(findSource(finished, made.source!.id)!)).toBe("captured");
  });

  it("a pasted source is labeled pasted but follows the same law", () => {
    const p = createProject("T");
    const made = addTypedSource(p, "old journal entry", { pasted: true });
    expect(made.source!.kind).toBe("pasted");
    expect(made.source!.original).toBe("old journal entry");
  });

  it("rejects empty input", () => {
    const p = createProject("T");
    expect(addTypedSource(p, "   ").source).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Spoken path — audio metadata + transcript recovery
// ---------------------------------------------------------------------------

describe("spoken path preservation", () => {
  it("keeps the live transcript as the write-once original", () => {
    const p = createProject("T");
    const made = addSpokenSource(p, {
      audioId: "aud-1", audioMimeType: "audio/webm", audioDurationMs: 4200,
      transcript: "word for word what was said", transcriptSupported: true,
    });
    expect(made.source.original).toBe("word for word what was said");
    expect(made.source.transcriptStatus).toBe("live");
    expect(made.source.audioId).toBe("aud-1");
  });

  it("failed transcription leaves the source recoverable via a manual transcript — once", () => {
    const p = createProject("T");
    const made = addSpokenSource(p, { transcript: null, transcriptSupported: true, audioId: "aud-2" });
    expect(made.source.original).toBe("");
    expect(made.source.transcriptStatus).toBe("failed");
    expect(sourceStage(made.source)).toBe("awaiting-transcript");

    const typed = setManualTranscript(made.source, "typed word for word");
    expect(typed.original).toBe("typed word for word");
    expect(typed.transcriptStatus).toBe("manual");

    // Once set, the original is permanent — a second manual transcript is refused.
    const again = setManualTranscript(typed, "attempt to overwrite");
    expect(again.original).toBe("typed word for word");
  });

  it("correcting the transcript appends a version; the raw transcript never changes", () => {
    const p = createProject("T");
    const made = addSpokenSource(p, { transcript: "the raw transcript with mispellings", transcriptSupported: true });
    const corrected = addSourceVersion(made.source, "the raw transcript with misspellings", "");
    expect(corrected.original).toBe("the raw transcript with mispellings");
    expect(corrected.versions[0].note).toBe("Corrected transcript");
    expect(currentSourceText(corrected)).toContain("misspellings");
  });

  it("unsupported transcription is labeled honestly", () => {
    const p = createProject("T");
    const made = addSpokenSource(p, { transcript: null, transcriptSupported: false });
    expect(made.source.transcriptStatus).toBe("unsupported");
  });
});

// ---------------------------------------------------------------------------
// One question at a time
// ---------------------------------------------------------------------------

describe("guided questions", () => {
  it("responds to the material — people + conflict pulls relational questions forward", () => {
    const { source } = projectWith(); // grandfather, mother, afraid, never, changed
    const q = nextQuestion(source)!;
    expect(["q-unsaid", "q-lose", "q-emotion", "q-change"]).toContain(q.id);
  });

  it("never repeats an answered or skipped question, and exhausts to null", () => {
    let { source } = projectWith();
    const seen = new Set<string>();
    for (let i = 0; i < QUESTION_BANK.length; i++) {
      const q = nextQuestion(source)!;
      expect(seen.has(q.id)).toBe(false);
      seen.add(q.id);
      source = answerQuestion(source, q, i % 2 === 0 ? "an answer" : "", i % 2 === 0 ? "answered" : "skipped");
    }
    expect(nextQuestion(source)).toBeNull();
  });

  it("records answer, skip, and save-for-later; saved-for-later can still be answered", () => {
    let { source } = projectWith();
    const q = nextQuestion(source)!;
    source = answerQuestion(source, q, "", "saved-for-later");
    expect(savedForLater(source).map((x) => x.id)).toContain(q.id);
    source = answerQuestion(source, q, "a real answer now");
    expect(source.answers.find((a) => a.questionId === q.id)!.status).toBe("answered");
    expect(savedForLater(source)).toHaveLength(0);
  });

  it("an empty 'answer' is recorded as a skip, not a fake answer", () => {
    let { source } = projectWith();
    const q = nextQuestion(source)!;
    source = answerQuestion(source, q, "   ");
    expect(source.answers[0].status).toBe("skipped");
  });
});

// ---------------------------------------------------------------------------
// Proposed ingredients — the author-approval contract
// ---------------------------------------------------------------------------

describe("story ingredients", () => {
  it("proposes several labeled suggestions from meaty material", () => {
    const { source } = projectWith();
    const proposals = proposeIngredients(source);
    expect(proposals.length).toBeGreaterThanOrEqual(4);
    for (const ing of proposals) {
      expect(ing.state).toBe("proposed");
      expect(ing.origin).toBe("story-partner");
      expect(ing.proposedText).toBe(ing.text);
    }
  });

  it("uses the author's answers as first-class material", () => {
    let { source } = projectWith();
    const q = QUESTION_BANK.find((x) => x.id === "q-emotion")!;
    source = answerQuestion(source, q, "Grief that never got permission to be spoken");
    const proposals = proposeIngredients(source);
    const emotional = proposals.find((i) => i.kind === "emotional-truth")!;
    expect(emotional.text).toContain("Grief that never got permission");
  });

  it("approve / reject / undecided are explicit author actions", () => {
    let { source } = projectWith();
    source = attachProposedIngredients(source);
    const id = source.ingredients[0].id;
    source = setIngredientState(source, id, "author-approved");
    expect(source.ingredients[0].state).toBe("author-approved");
    source = setIngredientState(source, id, "rejected");
    expect(source.ingredients[0].state).toBe("rejected");
    source = setIngredientState(source, id, "undecided");
    expect(source.ingredients[0].state).toBe("undecided");
  });

  it("editing keeps the verbatim proposal and records the edit", () => {
    let { source } = projectWith();
    source = attachProposedIngredients(source);
    const ing = source.ingredients[0];
    source = editIngredient(source, ing.id, "The author's own phrasing.");
    const after = source.ingredients[0];
    expect(after.text).toBe("The author's own phrasing.");
    expect(after.proposedText).toBe(ing.proposedText);
    expect(after.state).toBe("author-edited");
  });

  it("the author's own ingredient is approved from the start", () => {
    let { source } = projectWith();
    source = addAuthorIngredient(source, "theme", "What silence costs three generations");
    const own = source.ingredients.find((i) => i.origin === "author")!;
    expect(own.state).toBe("author-approved");
    expect(own.proposedText).toBe("");
  });

  it("suggesting again never replaces or edits existing ingredients", () => {
    let { source } = projectWith();
    source = attachProposedIngredients(source);
    const before = source.ingredients.map((i) => i.id);
    source = attachProposedIngredients(source);
    for (const id of before) expect(source.ingredients.some((i) => i.id === id)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Real-to-Fiction Bridge — many-to-many, private
// ---------------------------------------------------------------------------

describe("real-to-fiction bridge", () => {
  it("links source material to a vault mapping — both directions recorded", () => {
    const { project, source } = projectWith();
    let vault = createVault(project.id);
    const added = addVaultSource(vault, "person", "Gerald Hobbs");
    vault = added.vault;
    const mapped = addMapping(vault, [added.source!.id], { workingLabel: "the grandfather figure", sourceMaterialIds: [source.id] });
    vault = mapped.vault;
    expect(mapped.mapping!.sourceMaterialIds).toEqual(["SM-0001"]);

    const withLink = updateSourceIn(project, source.id, (s) => ({ ...s, mappingIds: [...s.mappingIds, mapped.mapping!.id] }));
    expect(findSource(withLink, source.id)!.mappingIds).toContain("MAP-001");
  });

  it("supports many-to-many: several sources → one mapping, one source → several mappings", () => {
    const p = createProject("T");
    const a = addTypedSource(p, "memory one");
    const b = addTypedSource(a.project, "memory two");
    let vault = createVault(b.project.id);
    const real = addVaultSource(vault, "person", "Someone Real");
    vault = real.vault;
    const m1 = addMapping(vault, [real.source!.id], { sourceMaterialIds: [a.source!.id, b.source!.id] });
    vault = m1.vault;
    const m2 = addMapping(vault, [real.source!.id], { sourceMaterialIds: [a.source!.id] });
    vault = m2.vault;
    expect(m1.mapping!.sourceMaterialIds).toHaveLength(2);
    const feeding = vault.mappings.filter((m) => m.sourceMaterialIds.includes(a.source!.id));
    expect(feeding).toHaveLength(2);
  });

  it("link/unlink helpers validate SM ids and never duplicate", () => {
    let vault = createVault("p1");
    const real = addVaultSource(vault, "person", "Someone");
    vault = real.vault;
    const m = addMapping(vault, [real.source!.id], {});
    vault = m.vault;
    vault = linkSourceMaterialToMapping(vault, m.mapping!.id, "SM-0001");
    vault = linkSourceMaterialToMapping(vault, m.mapping!.id, "SM-0001");
    vault = linkSourceMaterialToMapping(vault, m.mapping!.id, "not-an-sm-id");
    expect(vault.mappings[0].sourceMaterialIds).toEqual(["SM-0001"]);
    vault = unlinkSourceMaterialFromMapping(vault, m.mapping!.id, "SM-0001");
    expect(vault.mappings[0].sourceMaterialIds).toEqual([]);
  });

  it("sourceMaterialIds survive sanitizeVault round trips", () => {
    let vault = createVault("p1");
    const real = addVaultSource(vault, "person", "Someone");
    vault = real.vault;
    vault = addMapping(vault, [real.source!.id], { sourceMaterialIds: ["SM-0003"] }).vault;
    const clean = sanitizeVault(JSON.parse(JSON.stringify(vault)))!;
    expect(clean.mappings[0].sourceMaterialIds).toEqual(["SM-0003"]);
  });
});

// ---------------------------------------------------------------------------
// Three scene directions — genuinely different
// ---------------------------------------------------------------------------

describe("scene directions", () => {
  it("proposes exactly three, structurally different from each other", () => {
    const { source } = projectWith();
    const trio = proposeDirections(source, "Elder Marsh");
    expect(trio).toHaveLength(3);
    for (let i = 0; i < 3; i++) {
      for (let j = i + 1; j < 3; j++) {
        expect(trio[i].approach).not.toBe(trio[j].approach);
        expect(trio[i].whatHappens).not.toBe(trio[j].whatHappens);
        expect(trio[i].whoseScene).not.toBe(trio[j].whoseScene);
      }
    }
    for (const d of trio) {
      expect(d.state).toBe("proposed");
      expect(d.origin).toBe("story-partner");
      // every direction explains itself completely
      expect(d.whatHappens.length).toBeGreaterThan(20);
      expect(d.want).not.toBe("");
      expect(d.obstacle).not.toBe("");
      expect(d.change).not.toBe("");
      expect(d.serves).not.toBe("");
    }
  });

  it("approved ingredients feed the directions", () => {
    let { source } = projectWith();
    source = addAuthorIngredient(source, "desire", "To be trusted with the family's hardest truth");
    const trio = proposeDirections(source, "");
    expect(trio.some((d) => d.want.includes("trusted with the family"))).toBe(true);
  });

  it("a second round proposes three DIFFERENT axes", () => {
    let { source } = projectWith();
    source = attachProposedDirections(source, "");
    const firstRound = source.directions.map((d) => d.approach);
    source = attachProposedDirections(source, "");
    const secondRound = source.directions.slice(3).map((d) => d.approach);
    for (const a of secondRound) expect(firstRound).not.toContain(a);
  });

  it("reject-all clears only open suggestions; edit and approve are explicit", () => {
    let { source } = projectWith();
    source = attachProposedDirections(source, "");
    const keepId = source.directions[0].id;
    source = setDirectionState(source, keepId, "author-approved");
    source = rejectAllProposedDirections(source);
    expect(source.directions.find((d) => d.id === keepId)!.state).toBe("author-approved");
    expect(source.directions.filter((d) => d.state === "rejected")).toHaveLength(2);
  });

  it("editing a direction records author ownership without auto-approving", () => {
    let { source } = projectWith();
    source = attachProposedDirections(source, "");
    const id = source.directions[0].id;
    source = editDirection(source, id, { whatHappens: "The author's own version of events." });
    const d = source.directions.find((x) => x.id === id)!;
    expect(d.whatHappens).toBe("The author's own version of events.");
    expect(d.state).toBe("author-edited");
  });

  it("the author's own direction is theirs from the first word", () => {
    let { source } = projectWith();
    source = addAuthorDirection(source, { whatHappens: "My scene, my way.", whoseScene: "The narrator" });
    const own = source.directions.find((d) => d.origin === "author")!;
    expect(own.state).toBe("author-approved");
    expect(own.approach).toBe("The author's own direction");
  });
});

// ---------------------------------------------------------------------------
// The manuscript gate (capture law 2)
// ---------------------------------------------------------------------------

describe("manuscript approval enforcement", () => {
  function readyProject() {
    const made = projectWith();
    const source = made.source;
    let project = made.project;
    project = updateSourceIn(project, source.id, (s) => attachProposedDirections(s, ""));
    source = findSource(project, source.id)!;
    return { project, sourceId: source.id, directionId: source.directions[0].id };
  }

  it("refuses a direction that is merely proposed", () => {
    const { project, sourceId, directionId } = readyProject();
    const r = addApprovedSceneToManuscript(project, sourceId, directionId, "Some scene text.");
    expect(r.sceneId).toBe("");
    expect(r.created).toBe(false);
    expect(r.project.scenes).toHaveLength(0);
  });

  it("refuses an author-edited (but unapproved) direction", () => {
    const ready = readyProject();
    const { sourceId, directionId } = ready;
    let project = ready.project;
    project = updateSourceIn(project, sourceId, (s) => editDirection(s, directionId, { whatHappens: "Edited." }));
    const r = addApprovedSceneToManuscript(project, sourceId, directionId, "Scene text.");
    expect(r.sceneId).toBe("");
  });

  it("an approved direction with author text enters the manuscript, in a chapter", () => {
    const ready = readyProject();
    const { sourceId, directionId } = ready;
    let project = ready.project;
    project = updateSourceIn(project, sourceId, (s) => setDirectionState(s, directionId, "author-approved"));
    const r = addApprovedSceneToManuscript(project, sourceId, directionId, "The porch scene, fictionalized.", { sceneTitle: "The long silence" });
    expect(r.created).toBe(true);
    expect(r.project.scenes).toHaveLength(1);
    expect(r.project.scenes[0].drafts[0].text).toBe("The porch scene, fictionalized.");
    expect(r.project.scenes[0].drafts[0].note).toBe("Approved by Author");
    expect(r.project.chapters).toHaveLength(1);
    expect(r.project.chapters[0].sceneIds).toContain(r.sceneId);
    expect(findSource(r.project, sourceId)!.directions.find((d) => d.id === directionId)!.sceneId).toBe(r.sceneId);
  });

  it("is idempotent — a repeated approval never duplicates the scene", () => {
    const ready = readyProject();
    const { sourceId, directionId } = ready;
    let project = ready.project;
    project = updateSourceIn(project, sourceId, (s) => setDirectionState(s, directionId, "author-approved"));
    const first = addApprovedSceneToManuscript(project, sourceId, directionId, "Scene text.");
    const second = addApprovedSceneToManuscript(first.project, sourceId, directionId, "Scene text again!");
    expect(second.created).toBe(false);
    expect(second.sceneId).toBe(first.sceneId);
    expect(second.project.scenes).toHaveLength(1);
    expect(second.project.chapters[0].sceneIds).toHaveLength(1);
  });

  it("refuses empty scene text", () => {
    const ready = readyProject();
    const { sourceId, directionId } = ready;
    let project = ready.project;
    project = updateSourceIn(project, sourceId, (s) => setDirectionState(s, directionId, "author-approved"));
    const r = addApprovedSceneToManuscript(project, sourceId, directionId, "   ");
    expect(r.sceneId).toBe("");
  });

  it("a direction already in the manuscript cannot be quietly un-approved", () => {
    const ready = readyProject();
    const { sourceId, directionId } = ready;
    let project = ready.project;
    project = updateSourceIn(project, sourceId, (s) => setDirectionState(s, directionId, "author-approved"));
    const r = addApprovedSceneToManuscript(project, sourceId, directionId, "Scene text.");
    const after = updateSourceIn(r.project, sourceId, (s) => setDirectionState(s, directionId, "rejected"));
    expect(findSource(after, sourceId)!.directions.find((d) => d.id === directionId)!.state).toBe("author-approved");
  });
});

// ---------------------------------------------------------------------------
// Migration — v2 data comes forward, nothing lost
// ---------------------------------------------------------------------------

describe("v2 → v3 migration", () => {
  it("a v2-shaped project (no sources) migrates cleanly", () => {
    const v2 = {
      version: 2, id: "old-1", title: "Old Novel", premise: "p",
      createdAt: "2026-01-01", updatedAt: "2026-01-02", lastExportAt: "",
      memories: [{ id: "m1", original: "an old memory", capturedAt: "", era: "", workingNotes: "", links: [] }],
      characters: [], relationships: [], storylines: [], scenes: [], chapters: [],
      notes: [], books: [], constitution: [], spiritual: [], research: [], editions: [],
    };
    const clean = sanitizeProject(v2)!;
    expect(clean.version).toBe(3);
    expect(clean.sources).toEqual([]);
    expect(clean.sourceCounter).toBe(0);
    expect(clean.memories[0].original).toBe("an old memory");
  });

  it("a v3 project round-trips through the sanitizer without loss", () => {
    const made = projectWith();
    const source = made.source;
    let project = made.project;
    project = updateSourceIn(project, source.id, (s) => {
      let next = attachProposedIngredients(s);
      next = answerQuestion(next, QUESTION_BANK[0], "because it mattered");
      next = addSourceVersion(next, "edited text");
      return attachProposedDirections(next, "The Elder");
    });
    const clean = sanitizeProject(JSON.parse(JSON.stringify(project)))!;
    const s = clean.sources[0];
    expect(s.original).toBe(MEMORY_TEXT);
    expect(s.versions).toHaveLength(1);
    expect(s.answers).toHaveLength(1);
    expect(s.ingredients.length).toBeGreaterThan(0);
    expect(s.directions).toHaveLength(3);
    expect(s.history.length).toBeGreaterThan(0);
  });

  it("a dangling direction sceneId is cleared so the step re-opens", () => {
    const made = projectWith();
    const source = made.source;
    let project = made.project;
    project = updateSourceIn(project, source.id, (s) => attachProposedDirections(s, ""));
    const raw = JSON.parse(JSON.stringify(project));
    raw.sources[0].directions[0].sceneId = "scene-that-does-not-exist";
    const clean = sanitizeProject(raw)!;
    expect(clean.sources[0].directions[0].sceneId).toBe("");
  });

  it("sanitizeSource rejects garbage without throwing", () => {
    expect(sanitizeSource(null)).toBeNull();
    expect(sanitizeSource({ id: "not-an-sm-id", kind: "typed" })).toBeNull();
    expect(sanitizeSource({ id: "SM-0001", kind: "carrier-pigeon" })).toBeNull();
  });

  it("creative export/import round-trips sources and lineage", () => {
    const made = projectWith();
    const source = made.source;
    let project = made.project;
    project = updateSourceIn(project, source.id, (s) => ({ ...s, mappingIds: ["MAP-001"] }));
    const parsed = parseImport(exportPayload(project));
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.project.sources[0].id).toBe("SM-0001");
      expect(parsed.project.sources[0].mappingIds).toEqual(["MAP-001"]);
    }
  });
});

// ---------------------------------------------------------------------------
// Manuscript export privacy
// ---------------------------------------------------------------------------

describe("manuscript export privacy", () => {
  function fullFlow() {
    const made = projectWith();
    const source = made.source;
    let project = made.project;
    let vault = createVault(project.id);
    const real = addVaultSource(vault, "person", "Gerald Hobbs");
    vault = real.vault;
    vault = { ...vault, sources: vault.sources.map((s) => ({ ...s, neverPublish: "the medal in the cedar box" })) };
    const mapped = addMapping(vault, [real.source!.id], { workingLabel: "Elder Marsh", sourceMaterialIds: [source.id] });
    vault = mapped.vault;
    project = updateSourceIn(project, source.id, (s) => {
      let next = { ...s, mappingIds: [mapped.mapping!.id] };
      next = attachProposedDirections(next, "Elder Marsh");
      return setDirectionState(next, next.directions[0].id, "author-approved");
    });
    const dirId = findSource(project, source.id)!.directions[0].id;
    const r = addApprovedSceneToManuscript(
      project, source.id, dirId,
      "Elder Marsh sat in the fading light and finally spoke of the years he had buried.",
    );
    return { project: r.project, vault, sourceId: source.id };
  }

  it("a clean manuscript passes the scan and contains no private material", () => {
    const { project, vault } = fullFlow();
    const result = buildManuscriptExport(project, vault);
    expect(result.safe).toBe(true);
    expect(result.markdown).toContain("Elder Marsh sat in the fading light");
    expect(result.markdown).not.toContain("SM-0001");
    expect(result.markdown).not.toContain("MAP-001");
    expect(result.markdown).not.toContain("REAL-PERSON-001");
    expect(result.markdown).not.toContain("Gerald Hobbs");
    expect(result.markdown).not.toContain("grandfather never talked about the war");
    expect(result.markdown).not.toContain("Suggested by Story Partner");
  });

  it("catches a real name from the legend", () => {
    const { project, vault, sourceId } = fullFlow();
    const dirty = { ...project, scenes: project.scenes.map((s) => ({ ...s, drafts: [...s.drafts, { id: "x", text: "Then Gerald Hobbs walked in.", note: "", savedAt: "" }] })) };
    const result = buildManuscriptExport(dirty, vault);
    expect(result.safe).toBe(false);
    expect(result.findings.some((f) => f.kind === "real-identity")).toBe(true);
    expect(sourceId).toBe("SM-0001");
  });

  it("catches private ids, never-publish details, and verbatim source text", () => {
    const { project, vault } = fullFlow();
    const leakText =
      "As noted in SM-0001, my grandfather never talked about the war, but that day on the porch he told me everything. " +
      "He kept the medal in the cedar box.";
    const findings = manuscriptLeakScan(leakText, project, vault);
    expect(findings.some((f) => f.kind === "private-id")).toBe(true);
    expect(findings.some((f) => f.kind === "source-text")).toBe(true);
    expect(findings.some((f) => f.kind === "never-publish")).toBe(true);
  });

  it("the manuscript compile never includes answers, rejected directions, or ingredients", () => {
    const made = projectWith();
    const source = made.source;
    let project = made.project;
    project = updateSourceIn(project, source.id, (s) => {
      let next = answerQuestion(s, QUESTION_BANK[0], "a deeply private answer about my family");
      next = attachProposedIngredients(next);
      next = attachProposedDirections(next, "");
      return rejectAllProposedDirections(next);
    });
    const result = buildManuscriptExport(project, null);
    expect(result.markdown).not.toContain("a deeply private answer");
    expect(result.markdown).not.toContain("Inside the moment");
    expect(result.markdown).not.toContain("emotional truth");
  });
});

// ---------------------------------------------------------------------------
// Home helpers
// ---------------------------------------------------------------------------

describe("home helpers", () => {
  it("awaitingReview surfaces drafts, missing transcripts, and open proposals", () => {
    let p = createProject("T");
    p = addTypedSource(p, "unfinished", { draft: true }).project;
    p = addSpokenSource(p, { transcript: null, transcriptSupported: true }).project;
    const t = addTypedSource(p, MEMORY_TEXT);
    p = updateSourceIn(t.project, t.source!.id, (s) => attachProposedIngredients(s));
    const review = awaitingReview(p);
    expect(review.some((r) => r.what === "draft")).toBe(true);
    expect(review.some((r) => r.what === "transcript")).toBe(true);
    expect(review.some((r) => r.what === "ingredients" && r.count > 0)).toBe(true);
  });

  it("continueTarget picks the most recent unfinished source", () => {
    const { project, source } = projectWith();
    expect(continueTarget(project)!.id).toBe(source.id);
    expect(continueTarget(createProject("empty"))).toBeNull();
  });
});
