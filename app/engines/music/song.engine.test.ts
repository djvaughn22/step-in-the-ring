/**
 * Song project model tests — proven against the owner's real first song.
 *
 * The raw source below is the owner's exact text, used verbatim as the test
 * fixture on purpose: preserving it byte-for-byte (misspellings, punctuation,
 * "1!!", "!~!!" and all) IS the product requirement. Do not "fix" it.
 */
import { describe, expect, it } from "vitest";
import {
  MPC_SONG_CHECKLIST, GENERIC_SONG_CHECKLIST, PLAYABLE_AUDIO_TYPES, PROJECT_PROOF_TYPES,
  addHookCandidate, addProof, addSection, canDeclareVersionOne, checklistFor,
  createSongProject, declareVersionOne, defaultBoundaries, duplicateSection,
  makeWorkingCopy, milestones, moveSection, nextAction, parseSongProject,
  preserveOriginalSource, resumeSummary, songUid, stageOf, updateSection,
  updateWorkingCopy, visibleGuidance,
  type SongProjectV1,
} from "./song.engine";

const OWNER_SOURCE = `porch light song,...in the winter the power went out on our street, and it took what seemed like forever but after a week the lights came back and after waiting and walking home in the dark, leave the light on! Leave the light on! and i kept it on and stayed close to home and forevermore no matter how late i get back i can see it!1!! we can see it!~!! i may run late, i may get lost, i may miss the last bus but im coming home!
these are the lyrics to the melody in my first song. i will come up with notes in my app`;

/** The owner's actual arrival state: words + melody in head, MPK Mini + MPC Beats. */
function ownerProject(): SongProjectV1 {
  const p = createSongProject({
    workingTitle: "porch light — porch light",
    startingState: ["lyrics", "melody-in-head"],
    equipment: ["Akai MPK Mini"],
    software: "mpc-beats",
  });
  return preserveOriginalSource(p, OWNER_SOURCE);
}

/** Walks the owner project all the way to Version One evidence. */
function completedProject(): SongProjectV1 {
  let p = ownerProject();
  p = { ...p, melodyState: "in-voice-memo", voiceMemo: { status: "captured", reference: "porch-light-full-idea.m4a", strongestParts: "the leave the light on part" } };
  p = {
    ...p,
    notesWork: {
      appUsed: "phone piano app",
      entries: [{ id: songUid(), section: "leave the light on hook", notes: "G G A G E", rhythm: "", confidence: "close", addedAt: new Date().toISOString() }],
      transferredToDaw: true,
      reference: "",
    },
  };
  p = addProof(p, "mpc-beats-project", "Porch Light.xpj");
  p = { ...p, scratchVocal: "recorded", playsEndToEnd: true, placeholdersNote: "bridge hummed" };
  p = addSection(p, "chorus", "leave the light on! Leave the light on!");
  p = addProof(p, "wav", "porch-light-v1.wav");
  return p;
}

// ---------------------------------------------------------------------------
// 1–2. Source preservation
// ---------------------------------------------------------------------------

describe("original source preservation", () => {
  it("preserves the exact raw source, including punctuation and misspellings", () => {
    const p = ownerProject();
    expect(p.originalSource!.text).toBe(OWNER_SOURCE);
    // The characteristic artifacts survive byte-for-byte.
    expect(p.originalSource!.text).toContain("see it!1!!");
    expect(p.originalSource!.text).toContain("we can see it!~!!");
    expect(p.originalSource!.text).toContain("but im coming home!");
    expect(p.originalSource!.text).toContain("i will come up with notes in my app");
  });

  it("cannot be overwritten by preserving again", () => {
    const p = ownerProject();
    const attacked = preserveOriginalSource(p, "cleaned up lyrics");
    expect(attacked.originalSource!.text).toBe(OWNER_SOURCE);
  });

  it("editing the working copy never touches the original source", () => {
    let p = makeWorkingCopy(ownerProject());
    expect(p.workingCopy).toBe(OWNER_SOURCE);
    p = updateWorkingCopy(p, "Verse 1: Porch light, coming home...");
    expect(p.workingCopy).toBe("Verse 1: Porch light, coming home...");
    expect(p.originalSource!.text).toBe(OWNER_SOURCE);
  });

  it("preserving empty text does nothing", () => {
    const p = createSongProject({});
    expect(preserveOriginalSource(p, "").originalSource).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 3–5. Starting states and adaptive next action
// ---------------------------------------------------------------------------

describe("adaptive starting point", () => {
  it("supports starting with both lyrics and a melody", () => {
    const p = ownerProject();
    expect(p.startingState).toEqual(["lyrics", "melody-in-head"]);
    expect(p.melodyState).toBe("unknown");
  });

  it("with lyrics not yet preserved, the first action is preserving the words", () => {
    const p = createSongProject({ startingState: ["lyrics", "melody-in-head"] });
    expect(nextAction(p).stage).toBe("spark");
    expect(nextAction(p).title.toLowerCase()).toContain("preserve");
  });

  it("after preservation with a melody in the head, the next action is the voice memo — not beginner setup", () => {
    const p = { ...ownerProject(), melodyState: "in-head" as const };
    const next = nextAction(p);
    expect(next.stage).toBe("melody");
    expect(next.title).toBe("Record the melody before changing it");
  });
});

// ---------------------------------------------------------------------------
// 6–7. Boundaries actually gate behavior
// ---------------------------------------------------------------------------

describe("creator boundaries", () => {
  it("lyric writing is disabled by default and hides lyric-writing guidance", () => {
    const p = ownerProject();
    expect(p.boundaries.allowLyricWriting).toBe(false);
    expect(visibleGuidance(p).lyricWriting).toBe(false);
  });

  it("preserving theological meaning is on by default and authorship is not negotiable", () => {
    const b = defaultBoundaries();
    expect(b.preserveMeaning).toBe(true);
    expect(b.authorshipStaysWithCreator).toBe(true);
    // Even a hostile stored record cannot flip authorship.
    const parsed = parseSongProject({ id: "x", boundaries: { authorshipStaysWithCreator: false } });
    expect(parsed!.boundaries.authorshipStaysWithCreator).toBe(true);
  });

  it("ask-before-wording-suggestions hides wording suggestions until allowed", () => {
    const p = ownerProject();
    expect(visibleGuidance(p).wordingSuggestions).toBe(false);
    const open = { ...p, boundaries: { ...p.boundaries, askBeforeWordingSuggestions: false } };
    expect(visibleGuidance(open).wordingSuggestions).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 8–11. Equipment paths and software checklists
// ---------------------------------------------------------------------------

describe("equipment and software paths", () => {
  it("MPK Mini + MPC Beats uses the song-first checklist, melody before drums", () => {
    const list = checklistFor("mpc-beats");
    expect(list).toBe(MPC_SONG_CHECKLIST);
    const text = list.map((x) => `${x.label} ${x.detail ?? ""}`).join(" ").toLowerCase();
    expect(text).toContain("mpk mini");
    expect(text).toContain("blank project");
    expect(text).toContain("melody");
    // No step requires drums; the beat is explicitly a later choice.
    expect(list.some((x) => x.label.toLowerCase().includes("drum"))).toBe(false);
  });

  it("BandLab and GarageBand use the generic song checklist", () => {
    expect(checklistFor("bandlab")).toBe(GENERIC_SONG_CHECKLIST);
    expect(checklistFor("garageband")).toBe(GENERIC_SONG_CHECKLIST);
  });
});

// ---------------------------------------------------------------------------
// 12–15. Unknown musical facts are valid
// ---------------------------------------------------------------------------

describe("unknown states", () => {
  it("unknown key, tempo, and time signature are valid and never invented", () => {
    const p = ownerProject();
    expect(p.key).toEqual({ state: "unknown", value: "" });
    expect(p.tempo).toEqual({ state: "unknown", value: "" });
    expect(p.timeSignature).toEqual({ state: "unknown", value: "" });
    // Unknowns are reported honestly on resume.
    expect(resumeSummary(p).unknowns).toEqual(["key", "tempo", "time signature"]);
  });

  it("partial note entry is valid — one section is enough for the milestone", () => {
    let p = ownerProject();
    p = {
      ...p,
      notesWork: {
        ...p.notesWork,
        entries: [{ id: songUid(), section: "hook", notes: "G G A G E (rough)", rhythm: "", confidence: "guess", addedAt: new Date().toISOString() }],
      },
    };
    expect(milestones(p).find((m) => m.id === "notes-partly-identified")!.done).toBe(true);
    // Key can stay unknown while notes exist.
    expect(p.key.state).toBe("unknown");
  });

  it("a captured voice memo is an early milestone", () => {
    let p = ownerProject();
    expect(milestones(p).find((m) => m.id === "melody-captured")!.done).toBe(false);
    p = { ...p, voiceMemo: { status: "captured", reference: "memo.m4a", strongestParts: "" } };
    expect(milestones(p).find((m) => m.id === "melody-captured")!.done).toBe(true);
    // …and it moves the next action from melody capture to note identification.
    expect(nextAction(p).stage).toBe("notes");
  });
});

// ---------------------------------------------------------------------------
// 16–17. Hooks are creator-provided
// ---------------------------------------------------------------------------

describe("hook candidates", () => {
  it("hooks always carry origin creator — never labeled AI-generated", () => {
    let p = ownerProject();
    p = addHookCandidate(p, "leave the light on! Leave the light on!");
    p = addHookCandidate(p, "im coming home");
    expect(p.hookCandidates).toHaveLength(2);
    p.hookCandidates.forEach((h) => expect(h.origin).toBe("creator"));
    // A hostile stored record cannot smuggle a different origin through parse.
    const parsed = parseSongProject({
      id: "x",
      hookCandidates: [{ id: "h1", text: "Leave the light on!", origin: "ai-generated", status: "candidate" }],
    });
    expect(parsed!.hookCandidates[0].origin).toBe("creator");
  });
});

// ---------------------------------------------------------------------------
// 18–21. Honest completion
// ---------------------------------------------------------------------------

describe("Version One completion standard", () => {
  it("a lyric sheet alone does not count as a completed song", () => {
    const p = makeWorkingCopy(ownerProject());
    const check = canDeclareVersionOne(p);
    expect(check.ok).toBe(false);
    expect(check.missing.length).toBeGreaterThan(0);
    expect(declareVersionOne(p, "words are in", "everything else").versionOne).toBeNull();
  });

  it("a plan/checklist/title does not count as a completed song", () => {
    let p = ownerProject();
    p = { ...p, softwareChecklist: { m1: true, m2: true, m3: true }, workingTitle: "porch light — porch light (final)" };
    expect(canDeclareVersionOne(p).ok).toBe(false);
  });

  it("a real project proof plus playable audio is required", () => {
    const p = completedProject();
    expect(canDeclareVersionOne(p).ok).toBe(true);
    // Remove the audio proof — no longer declarable.
    const noAudio = { ...p, proofs: p.proofs.filter((x) => !(PLAYABLE_AUDIO_TYPES as string[]).includes(x.type)) };
    expect(canDeclareVersionOne(noAudio).ok).toBe(false);
    // Remove the project proof — no longer declarable.
    const noProject = { ...p, proofs: p.proofs.filter((x) => !(PROJECT_PROOF_TYPES as string[]).includes(x.type)) };
    expect(canDeclareVersionOne(noProject).ok).toBe(false);
  });

  it("even with all evidence, the creator must explicitly declare Version One", () => {
    const p = completedProject();
    expect(p.versionOne).toBeNull(); // evidence alone never flips it
    expect(declareVersionOne(p, "", "").versionOne).toBeNull(); // reflections required
    const done = declareVersionOne(p, "melody survived intact", "real bass next pass");
    expect(done.versionOne).not.toBeNull();
    expect(done.versionOne!.whatWorked).toBe("melody survived intact");
    expect(milestones(done).find((m) => m.id === "finished-by-creator")!.done).toBe(true);
    expect(nextAction(done).stage).toBe("done");
  });

  it("completion works with an MPC Beats project plus playable audio", () => {
    const p = completedProject();
    expect(p.proofs.some((x) => x.type === "mpc-beats-project")).toBe(true);
    expect(p.proofs.some((x) => x.type === "wav")).toBe(true);
    expect(canDeclareVersionOne(p).ok).toBe(true);
  });

  it("proofs are only ever creator-confirmed — local files are never reported as engine-verified", () => {
    const p = completedProject();
    p.proofs.forEach((x) => expect(x.verification).toBe("creator-confirmed"));
    const parsed = parseSongProject({
      id: "x",
      proofs: [{ id: "p1", type: "wav", reference: "song.wav", verification: "engine-verified" }],
    });
    expect(parsed!.proofs[0].verification).toBe("creator-confirmed");
  });
});

// ---------------------------------------------------------------------------
// 22–23. Persistence, migration, resume
// ---------------------------------------------------------------------------

describe("persistence and migration", () => {
  it("save and reload preserves all new fields via parse round-trip", () => {
    const p = declareVersionOne(completedProject(), "worked", "improve");
    const roundTripped = parseSongProject(JSON.parse(JSON.stringify(p)));
    expect(roundTripped).toEqual(p);
  });

  it("an older / partial record migrates safely with defaults, never destroyed", () => {
    const old = parseSongProject({ id: "legacy-1", workingTitle: "Old song", originalSource: { text: "old words" } });
    expect(old).not.toBeNull();
    expect(old!.originalSource!.text).toBe("old words");
    expect(old!.boundaries).toEqual(defaultBoundaries());
    expect(old!.key.state).toBe("unknown");
    expect(old!.proofs).toEqual([]);
    expect(old!.versionOne).toBeNull();
  });

  it("garbage input is rejected without throwing", () => {
    expect(parseSongProject(null)).toBeNull();
    expect(parseSongProject("nope")).toBeNull();
    expect(parseSongProject({})).toBeNull();
    expect(parseSongProject({ id: "" })).toBeNull();
  });

  it("resume returns to the correct next action after capture", () => {
    let p = ownerProject();
    p = { ...p, melodyState: "in-voice-memo", voiceMemo: { status: "captured", reference: "memo.m4a", strongestParts: "leave the light on" } };
    const resumed = parseSongProject(JSON.parse(JSON.stringify(p)))!;
    const r = resumeSummary(resumed);
    expect(r.title).toBe("porch light — porch light");
    expect(r.next.stage).toBe("notes");
    expect(r.next.title.toLowerCase()).toContain("notes");
    expect(stageOf(resumed)).toBe("notes");
  });
});

// ---------------------------------------------------------------------------
// 24. Arrangement never mutates the source
// ---------------------------------------------------------------------------

describe("arrangement", () => {
  it("adding, reordering, duplicating, and editing sections never mutates the original source", () => {
    let p = ownerProject();
    p = addSection(p, "chorus", "leave the light on! Leave the light on!");
    p = addSection(p, "verse", "in the winter the power went out");
    p = moveSection(p, p.sections[1].id, -1);
    p = duplicateSection(p, p.sections[0].id);
    p = updateSection(p, p.sections[0].id, { content: "edited copy", energy: "full" });
    expect(p.sections.length).toBe(3);
    expect(p.originalSource!.text).toBe(OWNER_SOURCE);
  });

  it("fragments can stay unassigned and sections reorder within bounds", () => {
    let p = ownerProject();
    p = addSection(p, "fragment", "i may run late, i may get lost");
    expect(p.sections[0].kind).toBe("fragment");
    // Moving past the edge is a no-op, not a crash.
    expect(moveSection(p, p.sections[0].id, -1).sections).toEqual(p.sections);
  });
});

describe("a brand-new song project", () => {
  it("starts at the first panel and does not jump ahead to recording", async () => {
    const { createSongProject, nextAction } = await import("./song.engine");
    const a = nextAction(createSongProject({ now: "2026-10-28T12:00:00Z" }));
    expect(a.stage).toBe("spark");
    expect(a.title).toMatch(/what you already have/i);
  });
});

describe("songToMarkdown", () => {
  it("keeps the original words byte-for-byte and adds nothing the creator didn't enter", async () => {
    const { createSongProject, preserveOriginalSource, songToMarkdown } = await import("./song.engine");
    const raw = "leave the porch light on\n  I am almost home ,, \n";
    const md = songToMarkdown(preserveOriginalSource(createSongProject({ workingTitle: "Porch light" }), raw));
    expect(md).toContain("````\n" + raw + "\n````");
    expect(md).toContain("# Porch light");
    expect(md).not.toMatch(/## Hooks|## Proof|## Version One/);
  });
});

describe("hooks", () => {
  it("ignores the same line added twice", async () => {
    const { addHookCandidate, createSongProject } = await import("./song.engine");
    const p = addHookCandidate(addHookCandidate(createSongProject({}), "Hold the line"), " hold the line ");
    expect(p.hookCandidates).toHaveLength(1);
  });
});
