# Step In The Ring vNext — Session 2 handoff

Overnight run, 2026-08-08 → 09. Autonomous. Everything below is on `main`,
pushed, and deployed to production.

**Rollback point: `pre-vnext-2026-08-08` (unchanged), or `8974822` for
"Session 1 as DJ tested it".**

---

## The one thing that changed

Pressing **STEP IN** used to hand you a plan document, with the Build — the
object the whole product is built around — as a link near the bottom of it. The
first minute was reading, not making.

Now stepping in lands on the moment itself: **what you're making, what "real"
means, and the one next move**, read from your own words the instant you said
them. Then "Keep this build" carries those words through sign-in and into the
workspace without you retyping anything.

All of it is deterministic. There is no model call anywhere in this work and no
new cost of any kind — it is the reading engine the repo already had
(`planner/interpret` → `creation/record`), pointed at the Build for the first
time.

---

## Commits

| Commit | What |
|---|---|
| `c06d300` | Stepping in starts a build, and the build already knows what it is |
| `fb3ca2e` | Prove the Build API's boundaries with real sessions, not mocked auth |
| `3b7bceb` | The build workspace can hold what came out of it |
| `739537a` | Let an older build catch up, without touching a word of it |
| `e7154a3` | The homepage knows you were here yesterday |
| `c09935a` | Mobile tap targets, and a build you can log progress on |
| `7247608` | Know a repair from a sentence about repairs |
| `2b81d48` | A build's words travel into the capability it opens |
| `a4a7ea9` | Never hand somebody's builds to a cache |

---

## What changed in the experience

- **Homepage → STEP IN → the step-in moment** (`app/vnext/SteppedIn.tsx`). Title,
  one-sentence reading, kind + audience pills, what "real" means, **Right now**,
  then Keep / See the whole plan, the one question inline, version one, the
  honest software call, what can help, and their own words kept whole.
- **The one question is answered in place.** Answering visibly sharpens the card
  above it — no page move. The old `clarify` screen did the same job across a
  navigation and is gone; nothing else about the planner moved.
- **Everything from before is one tap away** behind *See the whole plan*: the full
  plan, the builder prompt, the brief and record downloads, Make it a project,
  the engine handoff. Untouched.
- **Keep this build** → words ride sessionStorage through sign-in → `/builds`
  shows *"This is what you said. Keep it?"* → one tap → straight into the
  workspace (not a list).
- **Your Builds**: leads with the reading, one obvious **Continue →** per card.
- **The workspace** answers what / where / now / next / what came out of it /
  what happened — and now holds artifacts and takes notes.
- **Opening a capability carries the Build's words into it.** Same
  `sitr-engine-seed` handoff the planner has always used — no second
  convention — so the engine opens with the name and the idea already filled in
  instead of an empty form.
- **The homepage offers your most recent build first** if you have one, so a
  returning visitor continues instead of accidentally starting a second build.
- **"Read my words again"** catches a Session 1 Build up to today's reading.

## What changed in data / domain / API

- `BuildRecordV1` gained **`reading?`** and **`versionOne?`**. Both optional.
  Every Session 1 Build parses and renders exactly as it did — covered by test.
- **`GET`/`POST /api/builds`** (new). Creating takes **only** `intent` (+ optional
  `answers`); title, reading, version one and first move are derived server-side.
  A client that posts `stage: "live"` and a flattering history gets a Build at
  `bring` with one honest event on it.
- **`reshape` action** (new): re-reads the stored intent. Strictly additive,
  idempotent, never replaces anything a person wrote.
- **`isSafeRef`** in `app/vnext/build.ts`, enforced in `parseAction` *and* at
  render. An artifact ref becomes an href, so `javascript:`, `data:` and
  protocol-relative `//host` are refused server-side and printed as plain text.
- **`app/vnext/draft.ts`** (new): sessionStorage only, bounded, never called saved.
- **Both build routes answer `private, no-store`** and declare themselves
  dynamic. They were going out under Next's default `public, max-age=0,
  must-revalidate` — a cookie-authenticated JSON body with `public` on it.
- No migration. No schema change. Nothing was deleted.

## Gates

826 tests / 49 files · typecheck clean · lint 0 errors (67 pre-existing warnings)
· production build clean · `scan-public-bundles` clean.

Baseline at session start was 746 tests. **+80**, all on this work.

## Production verified

Deployed and checked on `https://stepinthering.com` at 375×812:

- homepage renders, hero + box + STEP IN all in the first screenful
- signed-out step-in produces a real reading (checked with two different ideas)
- the inline question loop works live: answering "Who is it for?" added the
  audience pill and retired the question
- "Keep this build" writes the draft and lands on `/builds` with the exact words
  shown back, honestly labelled as not yet saved
- the repair rules are right on live traffic: "teach people how to fix a bike
  tire" is read as a guide, a broken church site is read as a repair
- `/library` renders, filters, no horizontal scroll
- `GET /api/builds` answers 401 to a stranger, under `private, no-store`
- 1280×900 desktop: no overflow, 720px measure, heading scales to 36px
- every preserved route resolves (`/`, `/builds`, `/library`, `/live`, `/how`,
  `/build`, `/build-machine`, `/about`, `/shop`, `/membership` → 200; the gated
  ones → 307 to sign-in, as before)
- no console errors, no horizontal scroll anywhere checked

## Blocked — needs a human

- **The signed-in half has never run against a real database.** No local Postgres,
  and signing in as the owner is not something an agent should do. Mitigated as
  far as it can be: both `/builds` and `/builds/[id]` are now *rendered* in tests
  through every state, and the Build API is exercised through **real sessions**
  (not mocked auth) against `MemoryMemberStore`.
  **DJ, the one gate:** sign in on a phone → step in from the homepage → *Keep
  this build* → open it → move a stage → add a note → reload.
- **Existing Builds show "Read my words again"** — worth pressing once on the
  Build you tested in Session 1, to see it fill in.

## Known risk

- `POST /api/builds` replaces `BuildsClient`'s old call to
  `/api/members/projects`. Same store, same ownership rules, same engine id, but
  it is a new path and the first real-account create runs through it.
- The homepage now makes one `GET /api/builds` call after mount. It is silent on
  any failure and `/` is still statically rendered, but it is a new request on
  the landing page.

## Next three, highest leverage

1. **Artifacts that arrive on their own.** An engine that finishes something should
   attach it to the Build that asked for it. The seam is in
   (`add-artifact`, `isSafeRef`, the list) — nothing writes to it but a person.
2. **Rename and delete a Build from the UI.** The member API already supports
   both, and a workspace you cannot tidy gets abandoned.
3. **Turn a legacy object into a Build.** The bridge still only displays. A saved
   plan already holds everything a Build needs; the conversion just has to be
   non-destructive, and the `reshape` action is the pattern for that.
