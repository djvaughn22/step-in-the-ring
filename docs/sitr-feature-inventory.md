# Step In The Ring — feature inventory (Sprint 1 reconciliation)

Built 2026-08-29 by walking the actual registry, routes, tests, persistence
keys and owner tools in the repo — not copied from the product-reset brief's
inventory tables, which were written from a screenshot and prior production
history and are corrected against real code below. Doors are marked with one
of: **Public**, **Account** (signed-in member), **Owner**, **Legacy**,
**Hidden**, **Future**.

Companion doc: [`docs/ENGINE-STATUS.md`](ENGINE-STATUS.md) has per-engine
*operational* status (working / beta / owner-only / building / planned),
last verified 2026-07-15 — treat that date as stale and re-verify before
relying on it for anything beyond this reconciliation.

## What this sprint actually changed

- Removed the "Choose your way in" opportunity panel (Start free / Five Hour
  Sprint $1,500 / Team Sprint $5,000) from the Home hero — [`app/create/RingApp.tsx`](../app/create/RingApp.tsx).
  Replaced with a real, live "Made in The Ring" proof panel (three tiles
  pulled from `ECOSYSTEM`, same data the lower `/explore`-linked proof band
  used — that redundant lower band was removed since proof now lives in the
  hero).
- Removed "Five Hour Sprint" from the sitewide `SECONDARY` nav row —
  [`app/site/RingHeader.tsx`](../app/site/RingHeader.tsx). The paid sales
  page (`/products/five-hour-sprint`) and its `/apply` flow are untouched
  and still reachable by direct URL — this sprint removes *promotion*, not
  the routes themselves.
- Deleted the `.opp-*` / `.opportunity-panel` CSS and the `create/RingApp.tsx`
  allowlist entry in [`app/lib/publicPriceGuard.test.ts`](../app/lib/publicPriceGuard.test.ts)
  — the Home hero no longer needs a carve-out to show `$1,500` / `$5,000`
  because it no longer shows any price.
- Replaced the test suite that *locked the sales wall in place*
  (`RingApp.test.ts`'s "the opportunity panel" describe block, added
  2026-08-27) with one that locks its absence, plus a new nav-level guard in
  `RingHeader.test.ts`.
- `ContinueStrip` / `KeepGoingCard` ([`app/vnext/ContinueStrip.tsx`](../app/vnext/ContinueStrip.tsx))
  needed no change — it already implements the brief's returning-visitor
  requirement exactly: a generic "Continue your latest build" + "Your
  builds" offer that never prints a Build's title, stage, or next-move text.
  It does not yet offer a third "Open your library" link; that's a small
  P1 addition, not a regression.

## Site registry — every page (`app/site/registry.ts`)

This file is the single source of truth the nav, `/everything`, and a
filesystem-walking test all read from — a page missing here is a page the
product doesn't know it has. `access` is a product statement; real
enforcement is `middleware.ts` (member) + each owner page's own server
check.

| Path | Name | Access | Group | In primary nav? | Notes |
| --- | --- | --- | --- | --- | --- |
| `/` | Home | Public | create | wordmark, not a nav item | Hero rebuilt this sprint |
| `/create` | Create | Public | create | ✅ | |
| `/engines` | Engines | Public | engines | ✅ | |
| `/engines/room` | The Engine Room | Public | engines | — | `noindex` |
| `/five-hour-sprint-tool` | Five Hour Sprint (free planner) | Public | engines | — | The **free** method/tool — distinct from the paid page below |
| `/build-machine` | Build Machine | Public | engines | — | |
| `/build` | Your first build, step by step | Public | engines | — | Six-round beginner walkthrough; **not** the Build Engine (see ENGINE-STATUS.md) |
| `/builds` | Builds | Public | builds | ✅ | |
| `/library` | Library | Public | library | ✅ | |
| `/how` | How it works | Public | learn | secondary | |
| `/about` | About | Public | learn | — | |
| `/products/five-hour-sprint` | The Five Hour Sprint (paid service) | Public | learn | **removed from secondary this sprint** | Real, owner-approved prices live only here now |
| `/products/five-hour-sprint/apply` | Apply for a Sprint | Public | learn | — | `noindex` |
| `/explore` | Explore | Public | proof | — | Overlaps `/live` (see contradictions) |
| `/live` | Things made here | Public | proof | — | Overlaps `/explore` (see contradictions) |
| `/everything` | Everything | Public | proof | secondary | Full route directory — brief flags removing from primary nav; it's already secondary-only, not primary |
| `/shop` | Shop | Public | proof | — | `noindex`; no real products listed |
| `/account` | Account | **Account** | account | secondary | |
| `/membership` | Membership | Public | account | — | Explains beta membership; unpromoted |
| `/members/login` | Sign in | Public | account | — | |
| `/members/signup` | Create an account | Public | account | — | |
| `/preview` | Preview access | Public | account | — | `noindex`; shared passcode door |
| `/owner` | Owner entrance | **Owner** | owner | — | |
| `/owner/members` | Members | **Owner** | owner | — | |
| `/owner/feedback` | Feedback | **Owner** | owner | — | |
| `/owner/tester-codes` | Tester codes | **Owner** | owner | — | |
| `/owner/sprint-applications` | Sprint applications | **Owner** | owner | — | |
| `/author` | Author's Room | **Owner** | owner | — | Local-only writing workspace |
| `/projects` | Project OS | **Owner** | owner | — | The ledger above a Build, not a second Builds list |

Every one of the above has a file on disk and a registry entry that agrees
with it — [`app/site/registry.test.ts`](../app/site/registry.test.ts) walks
the filesystem and fails on drift, so this table cannot silently go stale
the way the brief's screenshot-derived one did.

## Engines (`app/engines/engines.ts`) — 15 defined

Idea, Build, Sell, Launch, Fix, Grow, Plan, Etsy, Design Shop, Game, How To
Anything, Story, Writing, Music, and an internal `vnext-build`. Five are
**featured** on Home/Create (`app/vnext/capabilities.ts` → `featuredCapabilities()`):
Idea, Build, Design Shop, Music, and the free Five Hour Sprint planner. Full
operational status per engine is in `ENGINE-STATUS.md`; the highlights
relevant to this reconciliation:

- **Etsy Engine** — real, defined, but **hidden from the picker on purpose**:
  folded into Design Shop, kept only so old saved Etsy projects still open.
  The brief's inventory calls this "stale or hidden" as if undecided — it is
  a deliberate, already-documented decision, not drift.
- **Writing Engine** — real and public (`app/engines/engines.ts` id
  `"writing"`), distinct from the owner-only Story Partner at `/author`
  (`app/vnext/capabilities.ts` has an explicit comment on why the two must
  not collapse into one). Not covered in `ENGINE-STATUS.md`'s per-engine
  table — worth a P1 pass to verify and record its actual status there.
- **Game Engine** — owner-only in production today (publish driver needs a
  local repo path); this is documented and the planner never recommends it
  to a visitor.

## Local persistence keys found (`localStorage`)

`om-theme`, `sitr-v2`, `sitr-plans-v3`, `sitr-engine-seed`,
`sitr-source-vault-v1`, `sitr-story-partner-v1`, `sitr-music-session-v1`,
`creation-engine-projects-v1`, `fhs-ledger`, `fhs-sprints`,
`crossheartpray-visual-theme` (shared-theme leak from a synced component —
worth a one-line look, not a P0 issue). No single owner audited these against
a retention story; that's real P1/P2 work (account-side export/delete
already exists per `/account`, but a full key-by-key data-retention pass has
not been done).

## Known inventory contradictions — status after checking source

| Brief's assumption | Actual state |
| --- | --- |
| Screenshot shows a paid homepage panel vs. indexed content showing product-first | **Confirmed and fixed this sprint** — HEAD was literally the commit (`9f543f3`) that added the paid panel; it's now removed. |
| Primary nav promotes Five Hour Sprint over Create/Engines/Builds/Library | **Partially inaccurate, now fully fixed** — the 4-door primary nav (`navPages()`) was never touched; only the secondary row's "Five Hour Sprint" link (pointing at the paid page) existed, and it's removed this sprint. |
| Membership lists Etsy/Writing Engine while main directory emphasizes Design Shop/Story Partner | **Not a contradiction** — Etsy is deliberately hidden-but-defined (see above); Writing is a real, distinct, public engine. No registry drift found. |
| Everything lists owner routes, adding complexity | **True but already scoped down** — `/everything` is secondary-nav only, not primary; owner routes are listed "so the directory is honest" per its own source comment, each individually gated server-side. |
| Explore and Live both prove things were made, may be duplicates | **Confirmed, unresolved** — both are live, public, `proof`-group pages with overlapping intent. Left alone this sprint (P1 simplification item, not P0). |
| `/products/five-hour-sprint`, `/five-hour-sprint-tool`, homepage Sprint promotion, and `/apply` blur free/product/service | **Homepage and nav promotion removed this sprint.** The free tool (`/five-hour-sprint-tool`) and paid page (`/products/five-hour-sprint`) remain two distinct, correctly-labeled routes; `/apply` still lives under `/products/five-hour-sprint/apply` rather than a separate Open Mirror Services surface — that move is P2 per the roadmap, not done here. |
| Shop advertises no real products | **Confirmed** — `noindex: true`, zero listings. Already excluded from nav; brief's "hide from discovery" is effectively already true. |
| Builds, Project OS, and engine output storage need one ownership model | **Not resolved** — `/builds` (public), `/projects` (owner-only "ledger above a Build"), and per-engine `localStorage` keys are three separate storage stories today. Real P1/P2 architecture work, out of scope for this sprint. |

## Verification for this sprint

- `npx vitest run` — 75 files, 1065 tests, all passing.
- `npx tsc --noEmit` — clean.
- `npx eslint` — 0 errors (68 pre-existing warnings, none in touched files).
- `npx next build` + `node scripts/scan-public-bundles.mjs` — clean production
  build, no secret markers in public bundles.
- Local dev server (`sitr-sprint1-sales-wall-dev`, port auto-assigned):
  homepage text-verified desktop and mobile (375×812) — no `$` pricing, no
  "Choose your way in", "Finish it with help", or "Bring a team" anywhere on
  Home; primary nav confirmed as Create/Engines/Builds/Library +
  How/Everything/Account, no Five Hour Sprint link.

## Sprint 2 — activation: can a first sentence reach a saved, reopenable Build?

Built 2026-08-29, same walk-the-code discipline as above. Starting checkpoint
`ca81ed8` (this sprint's own Sprint 1 entry, verified as HEAD, clean, matching
`origin/main`, 75 test files / 1065 tests passing before any edit).

### The eight representative ideas, baselined then fixed

Run through the real pipeline (`interpret` → `classifyCreationType` →
`shapeIntent` → `recommendEngines`) before touching anything. Four came back
wrong in ways a fixture-specific patch would have hidden rather than fixed —
all four are general rules, not per-example branches:

| # | Idea (short) | Was | Now |
| --- | --- | --- | --- |
| 1 | baseball team site | typed **service** (bare noun "coach" tripped `SERVICE`), audience truncated to `"...coach contact i"`, engine choice `plan`/"find a paying customer" | typed **site**, audience `"...coach contact"` (whole word), routes to Build (`/build`) |
| 2 | family food-catching game | correct already | unchanged |
| 3 | website cleanup service | correct already | unchanged |
| 4 | starting-over song | correct already | unchanged |
| 5 | sellable encouragement card | correct already | unchanged |
| 6 | neighborhood fundraiser | correct engine choice; internal `buildType` mislabeled `explore` (word-count<10 heuristic, inert — `creationType` "event-plan" already drove the right recommendation) | unchanged in outcome; documented as an intentionally-untouched quirk, see Known inventory contradictions below |
| 7 | "my live website gets visitors but nobody signs up" | typed **new**, routed to `/build`'s from-scratch six-round walkthrough | typed **improve** (new `EXISTING_UNNAMED` signal for "my/our live/current/existing X" with no named destination), routes to the honest builder-prompt path instead |
| 8 | broken login | correct already | unchanged |

Table-driven coverage for all eight: [`app/creation/representative-inputs.test.ts`](../app/creation/representative-inputs.test.ts).

### Four confirmed shared activation defects, fixed

1. **Audience capture truncated mid-word.** `findStatedAudience`'s `for X`
   regex is capped at 60 characters, not 60 characters of whole words — a
   long clause cut off wherever the count ran out (`"...coach contact i"`).
   Fixed in [`app/planner/signals.ts`](../app/planner/signals.ts)
   (`audienceHead` now backs off to the last complete word only when the
   match actually hit the cap). General fix, not case-specific — any long
   `for`/`aimed at`/`so ... can` clause was affected.
2. **`SERVICE` matched the bare noun "coach", not just "coaching."** A
   baseball team site with "coach contact information" typed as a *service*
   someone was offering, which cascaded into the wrong software verdict
   ("deliver it manually to one real customer") and the wrong engine. Fixed
   in [`app/creation/classify.ts`](../app/creation/classify.ts) — `coach(ing)?`
   → `coaching`.
3. **An unnamed-but-existing product read as `new`.** `findDestination` only
   recognizes a *named* product ("add it to X", a domain, a known product
   name); "my live website" names nothing, so it fell to `buildType: "new"`
   and got routed to the from-scratch beginner walkthrough — telling someone
   with a live site to start over. New `EXISTING_UNNAMED` signal in
   [`app/planner/interpret.ts`](../app/planner/interpret.ts) recognizes
   "my/our live/current/existing X" without inventing a destination *name*
   (the `destination` field, and every template string built on it, stays
   untouched — only the buildType classification changes).
4. **The most common Create outcome silently lost all context.** The door
   CTA used to pick between two independent engine recommenders:
   `recommendEngines()` (rich, `app/creation/recommend.ts`, drives 100% of
   what's shown) and the older `recommendEngine()` (narrower,
   `app/planner/handoff.ts`, decided *only* whether the seed was rich or
   light). They disagreed on the id for the single most common destination —
   `"first-build"` vs `"build"` — so the id-match check that picked the rich
   seed path never fired for it, and the light path's writer (`seedBuild()`,
   key `sitr-build-seed`) never ran either. `/build` (the six-round
   first-app coach) reads *only* `sitr-build-seed` — nothing else — so it
   opened completely blank. Confirmed live: before the fix, "Name your app" /
   "One sentence: what's it for?" were empty on arrival from Create for a
   brand-new site or app idea, the single most common path through this
   product. Fixed in
   [`app/create/RingApp.tsx`](../app/create/RingApp.tsx) — the door always
   calls `seedEngineWithRecord()` now (one recommender, one seed path), and
   that function writes `sitr-build-seed` directly when the target is
   `"first-build"`. `app/planner/handoff.ts`'s `recommendEngine`/`seedEngine`/
   `seedBuild` are untouched and still directly tested — just no longer
   wired into this one call site.

   A closely related fifth defect surfaced while proving #4 end-to-end: Fix
   and Plan are the only *other* generic-intake engines Create's
   `recommendEngines()` ever routes to (besides Build/Sell/Design Shop, which
   already worked), and **neither had a case in `handoffToIntake`**
   ([`app/creation/handoff.ts`](../app/creation/handoff.ts)) — both fell to
   `default`'s `{rough, idea}` keys, which match no real question on either
   engine (Fix's first field is `symptom`, Plan's is `outcome`). The full
   record made it to the engine; nothing on screen showed it. Added explicit
   `"fix"` and `"plan"` cases. **Live-verified in the browser** (not just
   unit-tested): Create → "The login on my app stopped working..." → Fix
   Engine landed on **Step 2 of 7** with Step 1's `symptom` textarea already
   holding the exact original sentence; Create → the fundraiser idea → Plan
   Engine landed on **Step 2 of 7** with `outcome` already filled the same
   way. Before the fix both opened on Step 1, blank.

Regression coverage: [`app/planner/signals.ts`](../app/planner/signals.ts)
tests are indirect (no dedicated file existed; audience behavior is covered
through `app/planner/interpret.test.ts`'s new "audience capture never
truncates mid-word" block), plus new
[`app/creation/classify.test.ts`](../app/creation/classify.test.ts), new
assertions in `app/planner/interpret.test.ts` ("an unnamed but existing
product reads as improve, not new"), new assertions in
[`app/creation/creation.test.ts`](../app/creation/creation.test.ts) ("Create
-> Fix Engine carries the report forward", "Create -> Plan Engine carries the
goal forward"), and a source-lock block in
[`app/create/RingApp.test.ts`](../app/create/RingApp.test.ts) ("RingApp
engine handoff — no retyping into /build").

### Verified persistence and exports

- **No duplicate Build creation**: `BuildsClient.tsx`'s `createBuild()`
  already guards with `if (!said || busy) return`, sets `busy` before the
  fetch, and disables the submit button (`disabled={busy || !canSave}`) —
  this was real but completely untested. Locked in
  [`app/builds/builds-client-render.test.ts`](../app/builds/builds-client-render.test.ts)
  ("createBuild cannot fire twice from one submit"). No server-side
  idempotency exists (`POST /api/builds` still unconditionally creates a
  row) — that remains a real gap, not proven to matter in practice, and is
  P1/P2 architecture work, not a confirmed defect.
- **Markdown export, JSON export, builder-prompt clipboard**: unchanged this
  sprint, exercised indirectly by `app/creation/creation.test.ts` and
  `app/creation/quality.test.ts` as before. Still true: the vNext Build
  workspace (`app/builds/[id]/BuildDetail.tsx`) has no export feature of its
  own — export only exists on the older Create/planner and engine-room
  surfaces, operating on `CreationView`, not `BuildRecordV1`. Unchanged from
  Sprint 1's finding; not touched this sprint (out of the activation-defect
  scope this brief set).
- **Refresh persistence, malformed input, empty input**: server-side already
  covered by `app/api/builds/builds-api.test.ts` (empty/oversized intent,
  non-JSON body) and `app/engines/shared/shared-engine.test.ts` ("survives
  corrupted storage safely"). Client-side empty-submit no-op
  (`RingApp.tsx`'s `handleShape`) browser-verified live: submitting blank
  leaves the landing stage untouched, no crash.
- **Build save/reopen** (`/builds`, `/api/builds`): this local environment
  has no database configured (`storeConfigured: false` — "Accounts are not
  switched on for this site yet," confirmed live), so the authenticated
  create→reopen round trip could not be browser-verified this sprint — it
  remains covered by `app/api/builds/builds-api.test.ts`'s real-session HTTP
  tests only (create, read back complete, action state machine, ownership
  isolation), which already passed both before and after every change here.

### Correction to the "one ownership model" contradiction (Sprint 1's table)

Sprint 1 flagged `/builds`, `/projects`, and per-engine `localStorage` as
"three separate storage stories" needing eventual reconciliation. Sprint 2
found the practical edge of that gap: **Create's own recommended engines
(Build/Fix/Plan/Sell/Design Shop) do not save into `BuildRecordV1` /
`/api/builds` at all** — they save into the engine room's own
`creation-engine-projects-v1` project store
([`app/engines/shared/persistence.ts`](../app/engines/shared/persistence.ts)),
a completely separate, working save/reopen mechanism with its own tests. So
"Save the work as a Build" / "Reopen it successfully," followed from Create
through an engine door, lands in the engine room's project store today, not
literally in `/builds`. This sprint's brief explicitly named the
Builds/Library reconciliation as out of scope ("Sprint 3"), so this was left
alone and only documented — worth reading first when Sprint 3 starts, since
it changes what "the Build" means depending on which door was taken.

### Remaining P0/P1 candidates for Sprint 3

- The Builds/Library/engine-room-projects reconciliation above — the
  single biggest thing standing between "the product has one honest save
  model" and today's three.
- No server-side dedup on `POST /api/builds` — real but unconfirmed as a
  live problem; the client-side guard (this sprint) covers the realistic
  double-click case.
- `handoffToIntake` (`app/creation/handoff.ts`) still has no case for
  `launch`, `grow`, or `etsy` — none of those are ever reached from Create's
  `recommendEngines()` today (confirmed by reading `recommend.ts`'s full
  switch), so this is inert, not a live defect — worth a look only if a new
  recommend.ts branch starts routing to one of them.
- `/explore` vs `/live` duplication (Sprint 1's finding) — untouched.

### Verification for this sprint

- `npx vitest run` — 77 files, 1148 tests, all passing (baseline: 75 files,
  1065 tests; +2 files / +83 tests, zero regressions).
- `npx tsc --noEmit` — clean.
- `npx eslint .` — 0 errors (68 pre-existing warnings, none in touched
  files — same count as Sprint 1's baseline).
- `npx next build` + `node scripts/scan-public-bundles.mjs` — clean
  production build, no secret markers in public bundles.
- Local dev server (`sitr-sprint2-activation-dev`, port auto-assigned):
  live-verified in the browser — creationType/audience fix for the baseball
  site case (reads "A site" / "For my son's baseball team with the schedule
  and coach contact", not "service" / truncated fragment); Build, Fix, and
  Plan Engine intake prefill (see the four-defects section above, each
  confirmed by reading the actual `<textarea>`'s `.value`, not just the
  step number); empty-input submit is a safe no-op; mobile viewport
  (375×812) has no horizontal overflow; light/dark toggle applies without
  error. The authenticated `/builds` create→reopen round trip was not
  browser-verified — see "Verified persistence and exports" above.
