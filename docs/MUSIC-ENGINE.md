# Music Engine

Route: `/engines?engine=music` · Status: **beta** · Code: `app/engines/music/`

## Purpose

Help a creator finish a real, playable song — without the engine becoming the
musician. The engine preserves the moment the song arrived, understands what
already exists, reduces the next step to something achievable, teaches only
what is needed, keeps an honest record, and helps produce a real recording.
The writing, the melody, and the authorship stay with the creator.

## Primary experience: the Music Session

The old static "First project" nine-row checklist (create project → set tempo
→ pick a drum kit → … → export) is gone. It read as a list telling the
creator to go figure everything out "in your tool," repeated on every line,
and it never adapted to what they actually said they wanted.

The new default experience (`MusicSession.tsx`, model in
`music-session.engine.ts`, storage in `music-session.store.ts`) works the way
the owner actually works with ChatGPT and Claude:

1. **Say what you want to make** — one free-text goal ("a laid-back reggae
   beat," "a first hip-hop loop," "a song from an idea I already have") plus
   which tool you're using (BandLab, GarageBand, Ableton, FL Studio, Logic,
   Ardour, MPC, Other, or "not sure yet" — all valid).
2. **Get one next move** — a single card: "Do this next," tailored to the
   goal's detected profile (reggae / hip-hop / piano / ambient / an existing
   idea / a sensible generic default) and phrased for the actual tool chosen
   ("In BandLab, …") — never a bare, repeated "in your tool."
3. **Copy it** — one button copies a ready-to-paste instruction for an
   outside assistant (ChatGPT, Claude, notes, anywhere) built from the goal,
   tool, current step, and the last thing pasted back. No network call is
   made; nothing here is AI-generated, and nothing claims to be.
4. **Do the step, then paste back** — a "What happened?" box accepts a
   result, a problem, or nothing at all ("done" needs no essay). "I'm stuck"
   opens tool-aware recovery tips instead of forcing the step to be marked
   done.
5. **Keep going** — the session advances through Idea → Groove → Bass →
   Music → Arrange → Finish (listen, then export), shown as a compact step
   rail with the current stage highlighted — never all steps at once.

One session is active at a time; "Start something new" resets it. Progress
survives a reload via `localStorage` (`sitr-music-session-v1`).

## Second path: Bring your song to life

For a creator arriving after creation already started — words came, a melody
is forming, a project already exists — the deeper `SongStudio.tsx` /
`song.engine.ts` workspace documented below stays available and resumable
from the same screen. It predates the Music Session and keeps its own
storage, tests, and fixture untouched by this change.

## Supported starting states (Bring your song to life)

More than one may be selected: nothing yet · a general song idea · raw lyrics ·
a hook · a melody in the creator's head · a rhythm · chords · a beat · a voice
memo / recording · a partial recording · MIDI notes · a DAW project · a rough
demo. The workflow adapts: someone with lyrics and a melody is never routed
through zero-start beat instructions.

## The Bring Your Song to Life path

Stages (derived from real state, one primary next action at a time):

1. **Preserve the Spark** — paste the raw source. It is stored once, shown as
   "Original source — preserved exactly," and can never be overwritten; edits
   happen on a separate working copy. Working title, starting state, creator
   boundaries, equipment, software, session notes.
2. **Capture the Melody** — record a full voice memo (through unfinished parts,
   placeholders welcome), save the filename as a reference, mark strongest
   parts, track where the melody lives (head / memo / app / DAW / confirmed).
   Hook candidates are creator-provided phrases only — never labeled as
   engine/AI output.
3. **Find the Notes** — the creator determines notes in their own app; the
   engine records app used, note entries per section (names, MIDI numbers, or
   rough sequences), rhythm if known, confidence, and transfer-to-DAW status.
   Key / tempo / time signature support explicit unknown states and are never
   invented.
4. **Record It** — software-specific song-first checklist. MPC Beats + MPK
   Mini gets a 14-step walkthrough (blank project, simple keys instrument,
   strongest section first, save immediately, scratch vocal, playback, proof,
   export). Drums are a later production choice, never a prerequisite. BandLab
   / GarageBand / other get an equivalent generic checklist.
5. **Shape Without Taking Over** — sections (intro/verse/chorus/…/fragment/
   custom) can be added, reordered, repeated, duplicated, removed. Moving words
   never rewrites them; the source is untouched. Concrete production questions
   (where does it open up, where's the emotional peak) — no generic criticism,
   no forced verse-chorus structure.
6. **Version One** — proof artifacts plus the explicit creator decision.

## Creator-control principles

Boundaries are project-level rules that gate what the UI offers (via
`visibleGuidance()`), not decorative text. Defaults: preserve original words,
NO lyric writing, NO melody replacement, preserve testimony/theological
meaning, ask before wording suggestions; production/arrangement/theory/chord
guidance welcome. "Authorship stays with the creator" is hard-coded true —
even a tampered stored record parses back to true.

## Proof and honesty

Proof types: voice memo, MPC Beats/BandLab/GarageBand/other DAW project, WAV,
MP3, M4A, MIDI, project folder, screenshot, file reference, export note, local
path. The browser cannot open files saved by other apps, so every proof is
`verification: "creator-confirmed"` — the engine never claims it opened,
analyzed, or validated a local file, and no fake audio analysis exists.

## Version One definition

Declarable only when ALL of: original source preserved · melody captured ·
notes documented · a real music-software project proof · a scratch/first
vocal · plays beginning to end (placeholders allowed but identified) · a
playable audio proof (WAV/MP3/M4A) · "what worked" + "next improvement"
recorded · the creator explicitly presses "This is Version One — my call."
A lyric sheet, generated plan, viewed checklist, or chosen title never
completes a song. Version One is a rough playable version — not a
professional mix or master.

## Milestones (honest names)

Spark preserved → Melody captured → Notes partly identified → Melody recorded
→ First playable proof → Full rough draft → Version One exported → Version One
declared by creator. All derived from real state in `milestones()`.

## Storage and migration

`localStorage` key `sitr-music-songs-v1`; every read passes through
`parseSongProject()`, which repairs missing fields with safe defaults instead
of discarding records. Writes are non-destructive upserts. The Music Session
uses its own separate key (`sitr-music-session-v1`, one active session,
safe-parsed via `parseSession()`) and does not touch this store.

## Owner-test scenario

The engine was proven with the owner's real first song ("New Life — Born
Again": raw lyrics + melody in head, Akai MPK Mini, MPC Beats). The exact raw
source lives verbatim in `song.engine.test.ts` as the preservation fixture.
No owner project data is seeded into the public UI — every visitor starts
with an empty workspace.

## Honest limitations

- The engine cannot hear, record, or analyze audio. Melody, notes, and
  performances come from the creator and their tools.
- File existence is creator-confirmed, not machine-verified.
- The exported audio comes out of the music software, not out of this page.

## Manual production verification checklist

1. `/engines` → Music Engine card → Start.
2. Front door shows "What do you want to make?" + tool picker + Start making —
   no nine-row checklist, no "in your tool" repetition.
3. Bring your song to life is now resume-only from the UI: an existing
   project under "Song projects in progress" → Resume → workspace opens with
   its preserved state (lyrics, melody, equipment, software all intact).
4. Paste source → "Preserve exactly" → text is byte-identical, dashed-border
   permanent block; working copy is separate.
5. Boundaries default correctly; no lyric-generation action exists anywhere.
6. Next action reads "Record the melody before changing it"; after marking
   the memo captured it advances to note identification.
7. Add a note entry, leave key/tempo unknown → still valid.
8. Record panel shows the 14-step MPC checklist, no drum requirement.
9. Version One stays locked until project + audio proof + vocal + end-to-end
   playback exist; unlocks only with reflections; declaring is explicit.
10. Reload → project resumes at the same stage with the same next action.
11. Mobile portrait (390px): chips wrap, forms usable, no horizontal scroll.
12. Music Session: enter a goal + tool → Start making → one "Do this next"
    card (not a list) → Copy places tool/goal-specific text on the clipboard
    → paste-back + "Keep going" advances the step rail → reload resumes the
    same step → "Start something new" clears it.
