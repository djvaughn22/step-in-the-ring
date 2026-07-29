// Model v2: series board, constitutions, research ladder, immutable editions,
// audio fields, craft warnings, and the v1 → v2 migration. All identities are
// invented test data.

import { describe, expect, it } from "vitest";
import {
  addBook, addChapter, addCharacter, addDraft, addResearchClaim, addRule, addScene,
  amendRule, chaptersInBook, craftWarnings, createEdition, createProject,
  manuscriptMarkdown, moveBook, placeSceneInChapter, projectWordCount, sanitizeProject,
  setResearchStatus, updateBook, updateChapter, updateCharacter, updateResearchClaim,
  wordCountOf, type StoryProject,
} from "./story.engine";

function projectWithProse(): StoryProject {
  let p = createProject("Test Saga");
  const ch = addChapter(p, "Opening");
  p = ch.project;
  const sc = addScene(p, "The porch");
  p = sc.project;
  p = addDraft(p, sc.record!.id, "One two three four five.");
  p = placeSceneInChapter(p, ch.record!.id, sc.record!.id);
  return p;
}

describe("v1 → v2 migration", () => {
  it("migrates a version-1 project, defaulting every new section", () => {
    const v1 = {
      version: 1, id: "p1", title: "Old", premise: "", createdAt: "", updatedAt: "", lastExportAt: "",
      memories: [], characters: [{ id: "c1", name: "Ann", description: "", realBasis: "", createdAt: "" }],
      relationships: [], storylines: [], scenes: [],
      chapters: [{ id: "ch1", workingTitle: "One", purpose: "", viewpointCharacterId: "c1", storylineIds: [], sceneIds: [], status: "drafting", createdAt: "" }],
      notes: [],
    };
    const p = sanitizeProject(v1)!;
    expect(p.version).toBe(2);
    expect(p.books).toEqual([]);
    expect(p.constitution).toEqual([]);
    expect(p.spiritual).toEqual([]);
    expect(p.research).toEqual([]);
    expect(p.editions).toEqual([]);
    expect(p.chapters[0].bookId).toBe("");
    expect(p.chapters[0].reviewState).toBe("none");
    expect(p.chapters[0].audio).toEqual({ pronunciationNotes: "", narratorNotes: "", reviewed: false });
    expect(p.characters[0].classification).toBe("human");
    expect(p.characters[0].pronunciation).toBe("");
  });

  it("round-trips v2 data through sanitize without loss", () => {
    let p = createProject("Round trip");
    p = addBook(p, "Book One").project;
    p = addRule(p, "spiritual", "Limits of angels", "Angels are not superheroes.", "interpretation").project;
    p = addResearchClaim(p, "solar routes", "Narrow routes could carry light vehicles.").project;
    p = createEdition(projectWithProse(), "First Edition").project.editions.length
      ? p : p; // (edition round-trip covered below)
    const again = sanitizeProject(JSON.parse(JSON.stringify(p)))!;
    expect(again.books.map((b) => b.workingTitle)).toEqual(["Book One"]);
    expect(again.spiritual[0].classification).toBe("interpretation");
    expect(again.research[0].status).toBe("raw-idea");
  });

  it("drops a chapter's bookId when the book doesn't exist", () => {
    let p = createProject("x");
    p = addChapter(p, "One").project;
    const raw = JSON.parse(JSON.stringify(p));
    raw.chapters[0].bookId = "no-such-book";
    expect(sanitizeProject(raw)!.chapters[0].bookId).toBe("");
  });
});

describe("series board", () => {
  it("adds, edits, reorders books and counts chapters", () => {
    let p = createProject("Saga");
    p = addBook(p, "Alpha").project;
    p = addBook(p, "Beta").project;
    const [a, b] = p.books;
    p = updateBook(p, a.id, { faithQuestion: "What does trust cost?" });
    p = moveBook(p, b.id, -1);
    expect(p.books.map((x) => x.workingTitle)).toEqual(["Beta", "Alpha"]);
    p = addChapter(p, "C1").project;
    p = updateChapter(p, p.chapters[0].id, { bookId: a.id });
    expect(chaptersInBook(p, a.id)).toHaveLength(1);
    expect(p.books.find((x) => x.id === a.id)!.faithQuestion).toContain("trust");
  });
});

describe("constitutions", () => {
  it("amending keeps the previous text, reason, and date in history", () => {
    let p = createProject("x");
    p = addRule(p, "constitution", "Point of view", "Third person, one POV per chapter.").project;
    const id = p.constitution[0].id;
    p = amendRule(p, "constitution", id, "Third person limited, one POV per chapter, no head-hopping.", "tightened after read-through");
    const r = p.constitution[0];
    expect(r.text).toContain("no head-hopping");
    expect(r.history).toHaveLength(1);
    expect(r.history[0].previousText).toBe("Third person, one POV per chapter.");
    expect(r.history[0].reason).toBe("tightened after read-through");
  });

  it("spiritual rules always carry a truth label, defaulting to open-question", () => {
    let p = createProject("x");
    p = addRule(p, "spiritual", "Prayer", "Prayer is never a mechanical spell.").project;
    expect(p.spiritual[0].classification).toBe("open-question");
    p = addRule(p, "spiritual", "Scripture", "Scripture remains authoritative.", "scripture").project;
    expect(p.spiritual[1].classification).toBe("scripture");
    expect(p.constitution).toHaveLength(0); // never leaks into the series constitution
  });
});

describe("research ledger", () => {
  it("records every status move and never quietly verifies", () => {
    let p = createProject("x");
    p = addResearchClaim(p, "battery weight", "Lightweight cells could halve vehicle mass.").project;
    const id = p.research[0].id;
    expect(p.research[0].status).toBe("raw-idea");
    p = setResearchStatus(p, id, "research-question");
    p = setResearchStatus(p, id, "preliminary-finding");
    expect(p.research[0].history.map((h) => `${h.from}>${h.to}`)).toEqual([
      "research-question>preliminary-finding",
      "raw-idea>research-question",
    ]);
    p = updateResearchClaim(p, id, { sources: "journal note, 2026-07" });
    expect(p.research[0].sources).toContain("2026-07");
  });
});

describe("manuscript + editions", () => {
  it("compiles chapters and current drafts in order", () => {
    const p = projectWithProse();
    const md = manuscriptMarkdown(p);
    expect(md).toContain("# Test Saga");
    expect(md).toContain("## Chapter 1 — Opening");
    expect(md).toContain("One two three four five.");
    expect(projectWordCount(p)).toBe(5);
    expect(wordCountOf("a  b\nc")).toBe(3);
  });

  it("audio compile adds narrator orientation blocks", () => {
    let p = projectWithProse();
    p = updateChapter(p, p.chapters[0].id, { audio: { pronunciationNotes: "KAY-leb", narratorNotes: "slow open", reviewed: false } });
    const md = manuscriptMarkdown(p, { audio: true });
    expect(md).toContain("[NARRATOR — not part of the text]");
    expect(md).toContain("KAY-leb");
  });

  it("a frozen edition is immutable — later edits never touch it", () => {
    let p = projectWithProse();
    const made = createEdition(p, "First Edition", { sourceNote: "test" });
    p = made.project;
    const frozen = made.edition!;
    expect(frozen.wordCount).toBeGreaterThan(0);
    // keep writing after publication
    p = addDraft(p, p.scenes[0].id, "A completely rewritten scene with many more words than before.");
    expect(p.editions[0].manuscript).toBe(frozen.manuscript);
    // survives sanitize round-trip byte-for-byte
    const again = sanitizeProject(JSON.parse(JSON.stringify(p)))!;
    expect(again.editions[0].manuscript).toBe(frozen.manuscript);
    expect(again.editions[0].publishedAt).toBe(frozen.publishedAt);
  });
});

describe("craft warnings", () => {
  it("flags a missing viewpoint and empty drafted chapters, never rewriting", () => {
    let p = createProject("x");
    p = addChapter(p, "One").project;
    p = updateChapter(p, p.chapters[0].id, { status: "drafted" });
    const warnings = craftWarnings(p);
    expect(warnings.some((w) => w.text.includes("no viewpoint"))).toBe(true);
    expect(warnings.some((w) => w.text.includes("contains no scenes"))).toBe(true);
  });

  it("flags similar-sounding character names for the audiobook", () => {
    let p = createProject("x");
    p = addCharacter(p, "Marlena").project;
    p = addCharacter(p, "Marlene").project;
    p = addCharacter(p, "Tobias").project;
    const warnings = craftWarnings(p);
    expect(warnings.some((w) => w.text.includes("Marlena") && w.text.includes("Marlene"))).toBe(true);
    expect(warnings.some((w) => w.text.includes("Tobias"))).toBe(false);
  });
});

describe("character audio fields", () => {
  it("stores classification, pronunciation, and voice notes", () => {
    let p = createProject("x");
    p = addCharacter(p, "Sariel").project;
    p = updateCharacter(p, p.characters[0].id, { classification: "angel", pronunciation: "SAH-ree-el", voiceNotes: "measured" });
    const again = sanitizeProject(JSON.parse(JSON.stringify(p)))!;
    expect(again.characters[0].classification).toBe("angel");
    expect(again.characters[0].pronunciation).toBe("SAH-ree-el");
  });
});
