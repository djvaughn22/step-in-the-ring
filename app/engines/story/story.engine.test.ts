// Story Partner — the laws that must not regress:
// original memory text is permanently preserved, nothing pasted back becomes
// canon automatically, scene drafts are append-only, and reordering never
// duplicates or loses records.

import { describe, expect, it } from "vitest";
import {
  addChapter, addCharacter, addDraft, addMemory, addNote, addRelationship,
  addScene, addStoryline, amendMemory, applyPasteBack, briefingPack,
  BRIEFING_WARNING, countRecords, createProject, currentDraft, exportPayload,
  exportReminder, gatherFocus, labelFor, markExported, moveChapter,
  moveSceneInChapter, parseImport, placeSceneInChapter, promoteNote,
  removeSceneFromChapter, sanitizeProject, setNoteStatus, toggleMemoryLink,
  updateChapter, updateRelationship,
  type LinkRef, type StoryProjectV1,
} from "./story.engine";

/** Build the project from DJ's owner flow: memory + 2 characters + relationship + storyline. */
function seeded() {
  let p = createProject("The Long Weave");
  const mem = addMemory(p, "Dad met Mom at the bowling alley on a Tuesday.", { era: "before I was born" });
  p = mem.project;
  const memory = mem.memory!;
  const c1 = addCharacter(p, "Ray");
  p = c1.project;
  const c2 = addCharacter(p, "June");
  p = c2.project;
  const rel = addRelationship(p, "Ray and June", [c1.record!.id, c2.record!.id]);
  p = rel.project;
  const line = addStoryline(p, "How they met");
  p = line.project;
  return { p, memory, ray: c1.record!, june: c2.record!, rel: rel.record!, line: line.record! };
}

describe("creation and linking", () => {
  it("creates an empty project with a version marker", () => {
    const p = createProject("  My Novel  ");
    expect(p.version).toBe(3);
    expect(p.title).toBe("My Novel");
    expect(countRecords(p)).toBe(0);
  });

  it("a memory can attach to zero, one, or many records — no forced primary", () => {
    const { p, memory, ray, june, rel, line } = seeded();
    // zero links at capture
    expect(p.memories[0].links).toHaveLength(0);
    // attach to two characters, a relationship, and a storyline
    let next = toggleMemoryLink(p, memory.id, { kind: "character", id: ray.id });
    next = toggleMemoryLink(next, memory.id, { kind: "character", id: june.id });
    next = toggleMemoryLink(next, memory.id, { kind: "relationship", id: rel.id });
    next = toggleMemoryLink(next, memory.id, { kind: "storyline", id: line.id });
    expect(next.memories[0].links).toHaveLength(4);
    // it shows up in every linked room
    for (const ref of next.memories[0].links) {
      expect(gatherFocus(next, ref).memories.map((m) => m.id)).toContain(memory.id);
    }
    // toggle off removes exactly one link
    const off = toggleMemoryLink(next, memory.id, { kind: "character", id: ray.id });
    expect(off.memories[0].links).toHaveLength(3);
    // duplicate links are impossible
    const dup = amendMemory(next, memory.id, {
      links: [
        { kind: "character", id: ray.id },
        { kind: "character", id: ray.id },
      ],
    });
    expect(dup.memories[0].links).toHaveLength(1);
  });

  it("relationships are first-class: participants, title, description, own room", () => {
    const { p, ray, june, rel } = seeded();
    expect(p.relationships[0].participantIds).toEqual([ray.id, june.id]);
    const next = updateRelationship(p, rel.id, { description: "Thirty years, one argument." });
    expect(next.relationships[0].description).toBe("Thirty years, one argument.");
    // participants are validated against real characters
    const bad = updateRelationship(next, rel.id, { participantIds: [ray.id, "ghost"] });
    expect(bad.relationships[0].participantIds).toEqual([ray.id]);
    expect(labelFor(next, { kind: "relationship", id: rel.id })).toBe("Ray and June");
  });
});

describe("raw memory protection", () => {
  it("amendMemory cannot change the original text — only notes, era, links", () => {
    const { p, memory } = seeded();
    const before = p.memories[0].original;
    let next = amendMemory(p, memory.id, { workingNotes: "Might move this to a diner.", era: "1970s" });
    next = amendMemory(next, memory.id, { workingNotes: "" });
    expect(next.memories[0].original).toBe(before);
    expect(next.memories[0].era).toBe("1970s");
  });

  it("original survives every other operation on the project", () => {
    const { p, memory, ray, rel } = seeded();
    const before = p.memories[0].original;
    let next = toggleMemoryLink(p, memory.id, { kind: "character", id: ray.id });
    next = addNote(next, "fact", "The alley is fictionalized as a diner.", [{ kind: "relationship", id: rel.id }]).project;
    const scene = addScene(next, "The Tuesday", [{ kind: "relationship", id: rel.id }]);
    next = addDraft(scene.project, scene.record!.id, "He noticed her shoes first.");
    expect(next.memories.find((m) => m.id === memory.id)!.original).toBe(before);
  });

  it("working notes live separately and are labeled as interpretation in the briefing pack", () => {
    const { p, memory, rel } = seeded();
    let next = toggleMemoryLink(p, memory.id, { kind: "relationship", id: rel.id });
    next = amendMemory(next, memory.id, { workingNotes: "Compress the timeline." });
    const pack = briefingPack(next, { kind: "relationship", id: rel.id }, "task");
    expect(pack).toContain("[VERBATIM — do not alter]");
    expect(pack).toContain("Dad met Mom at the bowling alley on a Tuesday.");
    expect(pack).toContain("interpretation, not source");
    expect(pack).toContain("Compress the timeline.");
  });
});

describe("scene drafts — append-only revision history", () => {
  it("a second revision never loses the first", () => {
    const { p, rel } = seeded();
    const made = addScene(p, "The Tuesday", [{ kind: "relationship", id: rel.id }]);
    let next = addDraft(made.project, made.record!.id, "Draft one.", "first pass");
    next = addDraft(next, made.record!.id, "Draft two, tighter.", "cut the opening");
    const scene = next.scenes[0];
    expect(scene.drafts).toHaveLength(2);
    expect(scene.drafts[0].text).toBe("Draft one.");
    expect(scene.drafts[0].note).toBe("first pass");
    expect(currentDraft(scene)!.text).toBe("Draft two, tighter.");
  });

  it("empty draft text is refused, not saved as a blank revision", () => {
    const { p, rel } = seeded();
    const made = addScene(p, "The Tuesday", [{ kind: "relationship", id: rel.id }]);
    const next = addDraft(made.project, made.record!.id, "   ");
    expect(next.scenes[0].drafts).toHaveLength(0);
  });
});

describe("chapters — moves never duplicate or lose records", () => {
  function withChapters() {
    const base = seeded();
    let p = base.p;
    const s1 = addScene(p, "Scene A"); p = s1.project;
    const s2 = addScene(p, "Scene B"); p = s2.project;
    const ch1 = addChapter(p, "Chapter One"); p = ch1.project;
    const ch2 = addChapter(p, "Chapter Two"); p = ch2.project;
    return { ...base, p, s1: s1.record!, s2: s2.record!, ch1: ch1.record!, ch2: ch2.record! };
  }

  it("placing a scene in a second chapter moves the reference; the record survives untouched", () => {
    const { p, s1, ch1, ch2 } = withChapters();
    let next = placeSceneInChapter(p, ch1.id, s1.id);
    next = placeSceneInChapter(next, ch2.id, s1.id);
    expect(next.chapters.find((c) => c.id === ch1.id)!.sceneIds).toEqual([]);
    expect(next.chapters.find((c) => c.id === ch2.id)!.sceneIds).toEqual([s1.id]);
    expect(next.scenes.filter((s) => s.id === s1.id)).toHaveLength(1);
  });

  it("reordering scenes and chapters keeps every reference exactly once", () => {
    const { p, s1, s2, ch1, ch2 } = withChapters();
    let next = placeSceneInChapter(p, ch1.id, s1.id);
    next = placeSceneInChapter(next, ch1.id, s2.id);
    next = moveSceneInChapter(next, ch1.id, s2.id, -1);
    expect(next.chapters.find((c) => c.id === ch1.id)!.sceneIds).toEqual([s2.id, s1.id]);
    next = moveChapter(next, ch2.id, -1);
    expect(next.chapters.map((c) => c.id)).toEqual([ch2.id, ch1.id]);
    // moving past the edges is a no-op, not a corruption
    next = moveChapter(next, ch2.id, -1);
    expect(next.chapters).toHaveLength(2);
    expect(next.scenes).toHaveLength(2);
  });

  it("removing a scene from a chapter never deletes the scene record", () => {
    const { p, s1, ch1 } = withChapters();
    let next = placeSceneInChapter(p, ch1.id, s1.id);
    next = removeSceneFromChapter(next, ch1.id, s1.id);
    expect(next.chapters.find((c) => c.id === ch1.id)!.sceneIds).toEqual([]);
    expect(next.scenes.some((s) => s.id === s1.id)).toBe(true);
  });

  it("chapter fields validate against real records", () => {
    const { p, ray, line, ch1 } = withChapters();
    const next = updateChapter(p, ch1.id, { viewpointCharacterId: ray.id, storylineIds: [line.id], status: "drafting" });
    const ch = next.chapters.find((c) => c.id === ch1.id)!;
    expect(ch.viewpointCharacterId).toBe(ray.id);
    expect(ch.storylineIds).toEqual([line.id]);
  });
});

describe("briefing pack", () => {
  it("contains all nine sections in order, verbatim memories, and the no-invention warning", () => {
    const { p, memory, rel } = seeded();
    let next = toggleMemoryLink(p, memory.id, { kind: "relationship", id: rel.id });
    next = addNote(next, "fact", "They meet in 1974.", [{ kind: "relationship", id: rel.id }]).project;
    next = addNote(next, "decision", "The bowling alley becomes a diner.", [{ kind: "relationship", id: rel.id }]).project;
    next = addNote(next, "question", "Who spoke first?", [{ kind: "relationship", id: rel.id }]).project;
    const pack = briefingPack(next, { kind: "relationship", id: rel.id }, "Find the emotional stakes of this first meeting.");

    const sections = [
      "## 1. Project instructions", "## 2. Current focus", "## 3. Verbatim source memories",
      "## 4. Established fictional facts", "## 5. Approved fictionalization decisions",
      "## 6. Open questions and contradictions", "## 7. Existing scene draft",
      "## 8. Your task", "## 9. Rules for your response",
    ];
    let cursor = -1;
    for (const s of sections) {
      const at = pack.indexOf(s);
      expect(at, `missing or out of order: ${s}`).toBeGreaterThan(cursor);
      cursor = at;
    }
    expect(pack).toContain("Dad met Mom at the bowling alley on a Tuesday.");
    expect(pack).toContain("They meet in 1974.");
    expect(pack).toContain("The bowling alley becomes a diner.");
    expect(pack).toContain("Who spoke first?");
    expect(pack).toContain("Find the emotional stakes of this first meeting.");
    expect(pack).toContain(BRIEFING_WARNING);
    expect(pack).toContain("Ray and June");
  });

  it("resolved questions stay out of section 6; the current scene draft appears in section 7", () => {
    const { p, rel } = seeded();
    const ref: LinkRef = { kind: "relationship", id: rel.id };
    const q = addNote(p, "question", "Settled already.", [ref]);
    let next = setNoteStatus(q.project, q.note!.id, "resolved");
    const scene = addScene(next, "The Tuesday", [ref]);
    next = addDraft(scene.project, scene.record!.id, "He noticed her shoes first.");
    const scenePack = briefingPack(next, { kind: "scene", id: scene.record!.id }, "Revise.");
    expect(scenePack).toContain("He noticed her shoes first.");
    const relPack = briefingPack(next, ref, "Anything.");
    expect(relPack).not.toContain("Settled already.");
  });
});

describe("paste-back — never canon by default", () => {
  it("each classification lands as the right record type", () => {
    const { p, rel } = seeded();
    const ref: LinkRef = { kind: "relationship", id: rel.id };

    let r = applyPasteBack(p, ref, "possibility", "Maybe June was there with someone else.");
    expect(r.project.notes[0].kind).toBe("possibility");

    r = applyPasteBack(r.project, ref, "question", "What was Ray running from?");
    expect(r.project.notes[0].kind).toBe("question");

    r = applyPasteBack(r.project, ref, "decision", "June arrives with a date; he leaves alone.");
    expect(r.project.notes[0].kind).toBe("decision");

    r = applyPasteBack(r.project, ref, "scene-draft", "The lanes hummed.", { sceneTitle: "The Tuesday" });
    expect(r.project.scenes).toHaveLength(1);
    expect(r.project.scenes[0].drafts).toHaveLength(1);

    r = applyPasteBack(r.project, ref, "scene-revision", "The lanes hummed louder.", { sceneId: r.project.scenes[0].id });
    expect(r.project.scenes[0].drafts).toHaveLength(2);
    expect(r.project.scenes[0].drafts[0].text).toBe("The lanes hummed.");

    r = applyPasteBack(r.project, ref, "memory", "I remember the smell of the shoe spray.");
    expect(r.project.memories[0].original).toBe("I remember the smell of the shoe spray.");
    expect(r.project.memories[0].links).toEqual([ref]);
  });

  it("a proposed fictional detail is not canon until explicitly promoted", () => {
    const { p, rel } = seeded();
    const ref: LinkRef = { kind: "relationship", id: rel.id };
    const r = applyPasteBack(p, ref, "possibility", "Ray lies about his job.");
    const focus = gatherFocus(r.project, ref);
    expect(focus.notes.possibility).toHaveLength(1);
    expect(focus.notes.fact).toHaveLength(0);
    expect(focus.notes.decision).toHaveLength(0);
    // pinned in the briefing pack too: not listed under established facts
    const pack = briefingPack(r.project, ref, "task");
    const factsAt = pack.indexOf("## 4.");
    const decisionsAt = pack.indexOf("## 5.");
    const openAt = pack.indexOf("## 6.");
    expect(pack.slice(factsAt, openAt)).not.toContain("Ray lies about his job.");
    expect(pack.slice(factsAt, decisionsAt)).toContain("None yet.");
    // explicit promotion is what makes it canon
    const promoted = promoteNote(r.project, r.project.notes[0].id, "decision");
    expect(gatherFocus(promoted, ref).notes.decision).toHaveLength(1);
  });

  it("a scene revision against a missing scene saves nothing rather than guessing", () => {
    const { p, rel } = seeded();
    const r = applyPasteBack(p, { kind: "relationship", id: rel.id }, "scene-revision", "text", { sceneId: "ghost" });
    expect(r.saved).toBe("");
    expect(r.project).toBe(p);
  });
});

describe("export / import", () => {
  function fullProject(): StoryProjectV1 {
    const { p, memory, ray, rel, line } = seeded();
    let next = toggleMemoryLink(p, memory.id, { kind: "character", id: ray.id });
    next = toggleMemoryLink(next, memory.id, { kind: "relationship", id: rel.id });
    next = toggleMemoryLink(next, memory.id, { kind: "storyline", id: line.id });
    next = addNote(next, "decision", "Alley becomes a diner.", [{ kind: "relationship", id: rel.id }]).project;
    const scene = addScene(next, "The Tuesday", [{ kind: "relationship", id: rel.id }]);
    next = addDraft(scene.project, scene.record!.id, "Draft one.");
    next = addDraft(next, scene.record!.id, "Draft two.");
    const ch = addChapter(next, "Chapter One");
    next = placeSceneInChapter(ch.project, ch.record!.id, scene.record!.id);
    return next;
  }

  it("round-trips the whole project with nothing duplicated or lost", () => {
    const p = fullProject();
    const result = parseImport(exportPayload(p));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const q = result.project;
    expect(q.memories).toEqual(p.memories);
    expect(q.characters).toEqual(p.characters);
    expect(q.relationships).toEqual(p.relationships);
    expect(q.storylines).toEqual(p.storylines);
    expect(q.scenes).toEqual(p.scenes);
    expect(q.chapters).toEqual(p.chapters);
    expect(q.notes).toEqual(p.notes);
    expect(countRecords(q)).toBe(countRecords(p));
  });

  it("rejects garbage, wrong formats, and empty shells with a plain error", () => {
    expect(parseImport("not json").ok).toBe(false);
    expect(parseImport("{}").ok).toBe(false);
    expect(parseImport(JSON.stringify({ format: "something-else", project: {} })).ok).toBe(false);
    expect(parseImport(JSON.stringify({ format: "story-partner-export", project: { nope: true } })).ok).toBe(false);
  });

  it("sanitize drops corrupt records, duplicate ids, and dangling references — never throws", () => {
    const p = fullProject();
    const raw = JSON.parse(JSON.stringify(p)) as Record<string, unknown>;
    (raw.memories as unknown[]).push({ id: p.memories[0].id, original: "duplicate id" }); // dup id
    (raw.memories as unknown[]).push({ original: 42 }); // corrupt
    (raw.chapters as { sceneIds: string[] }[])[0].sceneIds.push("ghost-scene"); // dangling ref
    (raw.notes as unknown[]).push({ id: "n-bad", kind: "sonnet", text: "wrong kind" }); // invalid kind
    const clean = sanitizeProject(raw)!;
    expect(clean.memories).toHaveLength(p.memories.length);
    expect(clean.chapters[0].sceneIds).toEqual(p.chapters[0].sceneIds);
    expect(clean.notes).toHaveLength(p.notes.length);
  });

  it("a scene id claimed by two chapters keeps only its first placement after sanitize", () => {
    const p = fullProject();
    const raw = JSON.parse(JSON.stringify(p)) as { chapters: { sceneIds: string[] }[] };
    raw.chapters.push({ ...raw.chapters[0], id: "ch-2", workingTitle: "Chapter Two" } as never);
    const clean = sanitizeProject(raw)!;
    const placements = clean.chapters.flatMap((c) => c.sceneIds);
    expect(new Set(placements).size).toBe(placements.length);
  });
});

describe("export reminder", () => {
  it("stays quiet on small projects, warns once real work is unexported", () => {
    let p = createProject("Novel");
    expect(exportReminder(p)).toBeNull();
    for (let i = 0; i < 8; i++) p = addMemory(p, `memory ${i}`).project;
    expect(exportReminder(p)).toContain("never been exported");
    p = markExported(p);
    expect(exportReminder(p)).toBeNull();
    // new work strictly after the export, checked a few days later → gentle warning
    const exportedAt = new Date(p.lastExportAt).getTime();
    const hourOn = new Date(exportedAt + 60 * 60 * 1000).toISOString();
    const fourDaysOn = new Date(exportedAt + 4 * 24 * 60 * 60 * 1000).toISOString();
    p = { ...addMemory(p, "one more").project, updatedAt: hourOn };
    expect(exportReminder(p, fourDaysOn)).toContain("since your last export");
    // a fresh export after the change → quiet again
    expect(exportReminder({ ...p, lastExportAt: fourDaysOn }, fourDaysOn)).toBeNull();
  });

  it("markExported does not count as a content change", () => {
    let p = createProject("Novel");
    p = addMemory(p, "m").project;
    const updatedAt = p.updatedAt;
    p = markExported(p);
    expect(p.updatedAt).toBe(updatedAt);
    expect(p.lastExportAt).not.toBe("");
  });
});
