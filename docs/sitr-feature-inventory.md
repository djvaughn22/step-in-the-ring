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

## Sprint 2 privacy correction — separate emergency task, 2026-08-29

Not activation-audit work. A real Build carrying the owner's own private
personal story — a title and a musical idea, neither invented by this
product, both typed by the owner at some earlier point — was found
unscrubbed in a test fixture (`app/vnext/ContinueStrip.test.ts`, added
2026-08-22 alongside the returning-user fix that same fixture regression-
tests) and reported as present on the production Builds page. The private
wording itself is deliberately not reproduced here — see `CLAUDE.md`'s
"Personal data is not product test data" section for the permanent rule
this incident produced.

**What this session could verify and fix:**
- The exact wording was found in exactly one place in the repository: the
  `ContinueStrip.test.ts` fixture above. Not in Sprint 2's own commit
  (`a340611` touches none of `ContinueStrip.tsx`/`.test.ts` or `app/builds`),
  not in any other test, fixture, doc, or screenshot. Scrubbed — the fixture
  now uses fully fictional content while keeping the exact same regression
  coverage (the strip must never print a Build's title/stage/next-move text).
- Analytics/logging: confirmed clean by reading every `track()` call site
  and the analytics wrapper itself — none pass `intent`/`raw`/`summary`/
  `title`/`record`, only structural metadata (event name, engine id, type,
  count). No server-side code in the builds/creation path calls
  `console.*` at all. Locked by `app/lib/analytics.test.ts`.
- No supported way existed to delete a single Build — the only delete path
  (`POST /api/members/delete-request`) wipes the entire account. Added
  "Delete this build" to `app/builds/[id]/BuildDetail.tsx`, wired to the
  already-existing, already-tested, ownership-scoped
  `DELETE /api/members/projects/[id]` route (previously exposed nowhere in
  the UI). Two taps required, closed by default, removes only the one row.

**What this session could not verify or act on:** the actual production
database row. This sandboxed environment has no `DATABASE_URL` and no
signed-in session on `stepinthering.com` — there is no path from here to
query, confirm, or delete a specific production Build. **The owner needs to
sign in at stepinthering.com and use the new "Delete this build" button
themselves** once this correction deploys. Browser-local storage on the
sandbox's own browser tab was checked and contains no trace of the incident
(only theme keys). Application/deployment logs on Vercel were not
accessible from this session to check or clear.

**Standing fictional example set** — for any future Sprint 2 (or other
activation-audit) work in this repo, examples must come only from this list,
never from the owner's own biography, conversation memory, or private
projects:
- A public park volunteer schedule website
- A phone puzzle game where colored tiles rotate
- A fictional mobile car-wash booking service
- A song about a train moving through summer rain
- A printable mountain-trail poster
- A community book-swap event plan
- A fictional coffee-shop website that gets visits but no newsletter signups
- A demo inventory app whose login broke after an update

Running these through the pipeline during this correction (diagnostic only,
not acted on — activation-audit work is explicitly paused) surfaced two
possible classification quirks worth a look *whenever Sprint 2 resumes*, not
now: "a community book-swap event plan" reads as `story` (the bare noun
"book" hitting the same class of false-positive as the "coach"/`SERVICE` fix
earlier in this sprint), and "no newsletter signups" on a coffee-shop
website reads as `content` (`CONTENT_STRONG` matching the bare word
"newsletter" regardless of context). Neither was investigated further or
fixed here.

**New/changed test coverage:** `app/lib/analytics.test.ts` (new),
`app/creation/privacy-guardrail.test.ts` (new — neutral inputs never gain
invented sensitive terms; explicit user-supplied sensitive content is kept
verbatim and not embellished; demo/example content stays clean; the
incident's exact title-phrase is absent repo-wide), `app/builds/builds-
client-render.test.ts` (delete button gating), `app/api/builds/builds-api.
test.ts` (real-session HTTP coverage of the delete route: owner can delete
their own, a stranger cannot, no session is refused), `app/vnext/
ContinueStrip.test.ts` (fixture scrubbed to fictional content, same
assertions).

## Overnight visual/navigation rescue — 2026-08-30

Starting checkpoint `4e67bf6` (this repo's own prior entry above, verified
HEAD, clean, matching `origin/main`, 1192 tests passing before any edit).
Owner rejected `4e67bf6`'s Home hero on sight: functionally correct, visually
wrong — a tall right-side tower of mostly empty product boxes reaching well
below the creation box, oversized cards showing little but an icon and a
name, large dead space on the left, a duplicate "Start creating" button
directly under the box's own "Start," a bulky returning-user panel, and a
redundant "See what else got made" link after the products were already
shown.

### Checkpoint A — `1400e6b` — Home hero visual hierarchy

- The right-side proof panel now holds exactly the three featured products
  (CrossHeartPray, TheDJCares, iDontCry, in that order) as compact
  horizontal `.proof-row` cards — icon, name, one-line description, a Live
  status dot, and an open cue (↗), sized to content (roughly 80–110px tall),
  no fixed tall tiles, no sticky positioning. The column now ends well above
  the creation box's bottom edge instead of towering past it.
- Every other real, live product (OpenDoku, WatchedNotWatched,
  DontCloneMeTom, PleaseBeReady, Open Mirror) moved out of the hero into its
  own full-width "More made here" band immediately below the hero, in a
  responsive 1/2/3-column grid (`app/globals.css` `.more-products`) — one
  proof list total, not a hero copy plus a lower-page copy.
- The duplicate "Start creating" anchor button (and its adjacent beta-copy
  paragraph) is gone from the hero. The creation box's own "Start" submit
  button is the one dominant creation action above the fold.
- The bulky card-styled "Keep going" panel is now one compact, full-width
  `.continue-strip` (`app/vnext/ContinueStrip.tsx`) — identical private,
  generic copy ("Continue your latest build." / "Continue" / "Your
  builds"), never a Build's title/stage/next-move text — moved out of the
  hero into its own section, rendered only when work exists.
- Found and fixed a real mobile horizontal-overflow bug the new proof
  cards' one-line (`white-space: nowrap` + ellipsis) description exposed: a
  pre-existing bare `1fr` on the mobile `.stage` grid override has a
  content-based automatic minimum, so the untruncated description text
  forced the whole page wider than a phone viewport. Fixed with
  `minmax(0, 1fr)` (both `.stage`'s mobile override and `.more-products`)
  plus `min-width: 0` down the flex chain; regression-tested in
  `RingApp.test.ts`.

### Checkpoint B — `e552f07` — navigation simplification

- Removed "Everything" (the full site directory) from the header's
  secondary row (`app/site/RingHeader.tsx`) on every page — desktop bar and
  mobile sheet alike. Primary nav is unchanged: Create, Engines, Builds,
  Library (`navPages()`, untouched). Secondary is now How + the appearance
  control + Account.
- `/everything` itself is untouched, still a real route with its own page —
  only removed from primary/secondary chrome. It's reachable sitewide from
  one new quiet line, `app/site/QuietFooterLink.tsx`, mounted in
  `app/layout.tsx` between page content and the shared `OpenMirrorFooter`.
  That shared footer is the owner's locked, family-wide three-line
  component synced from the Open Mirror hub repo — deliberately not
  touched; the new line sits beside it, not inside it.

### Checkpoint C — lower-page cleanup and this doc update

- Audited the full Home page top-to-bottom against the intended order below
  and found one real duplicated job: a "closing" section at the very bottom
  of Home repeated the hero's "Made in The Ring" phrase behind a second,
  duplicate big gold "Start something" button, plus the open-beta safety
  line and feedback link (Home-only). Removed the section entirely — one
  dominant creation action stays the box's own "Start," full stop — and
  moved the open-beta safety line + feedback link into
  `QuietFooterLink.tsx` so every page carries it once, not just Home.
- No other duplicated sections, paid offers, or duplicate product catalogs
  were found in the remaining lower-page flow (Quick start, Tools for the
  job, the five-step loop) — each covers a distinct job with no overlap.
- Engine behavior, routes, and persistence were not touched this checkpoint
  (out of scope by the brief's own instruction).

### Accepted homepage hierarchy (current, top to bottom)

1. Creation-first hero (`.stage`) — brand, tagline, the creation box with
   its one "Start" submit, beside exactly 3 featured live products.
2. "More made here" — every other real, live product, full page width.
3. Compact returning-user strip (`.continue-strip`) — only when a Build
   exists for this browser/session; otherwise renders nothing.
4. Quick start — 4 stems that drop into the box above.
5. Tools for the job — 5 featured engines, links to `/engines` for the rest.
6. How it goes — the 5-step loop, links to `/how`.
7. Quiet sitewide footer — `/everything` link + open-beta/feedback line
   (`QuietFooterLink.tsx`), then the locked `OpenMirrorFooter`.

### Navigation (current)

- Primary (every page, desktop bar + mobile sheet): Create, Engines,
  Builds, Library.
- Secondary (desktop bar-end + mobile sheet): How, appearance
  (Dark/Light/System), Account.
- Quiet footer (every page, below the fold): Everything, open-beta +
  feedback.

### Current production checkpoint

As of this write-up: `e552f07` on `main` (Checkpoints A and B), with
Checkpoint C's lower-page cleanup and this doc update committed
immediately after — see the top of git log for the exact final SHA pushed
to `origin/main` and deployed. Starting point for this whole rescue was
`4e67bf6`.

### Verification for this sprint

- `npx vitest run` — full suite passing (1203 tests after Checkpoint C;
  1193 after Checkpoint A/B individually), zero regressions.
- `npx tsc --noEmit` — clean.
- `npx eslint` — 0 errors on every touched file.
- `npx next build` — clean production build after every checkpoint.
- Local dev server (`sitr-overnight-rescue-dev`): structural/computed-style
  verification at 1440×900, 1024×768, and 375×812 (no horizontal overflow
  at any width, confirmed via `document.documentElement.scrollWidth` ===
  `clientWidth`), dark/light theme tokens confirmed correct on the new
  proof cards and footer line, mobile menu confirmed to show exactly
  Create/Engines/Builds/Library/How/Account with 52px tap targets and no
  Everything link. Pixel screenshots could not be captured in this session
  (the Browser pane had no visible compositor surface attached — every
  `computer` screenshot call failed with "the Browser pane is not
  displayed, so the page is not compositing frames"); DOM/CSS-based
  verification was used in its place throughout, and the same computed-
  style/no-overflow checks were re-run after production deploy against
  `stepinthering.com`.

## Human-control-layer audit + first slice — 2026-08-30

Starting checkpoint `08b6a9c` (this doc's own prior entry above, verified
HEAD, clean, matching `origin/main`, 1203 tests passing before any edit).
Brief: audit every place SITR invokes AI, then ship the smallest real
vertical slice proving "SITR works without AI; AI is optional
amplification" — using the product that already exists, not a new page.

### A-F: what the audit found

- **Zero AI API calls exist anywhere in this codebase.** No
  `OPENAI_API_KEY`/`ANTHROPIC_API_KEY`/equivalent in `.env.example`, no
  `openai`/`anthropic`/`generateText`/`chat/completions` import or literal
  anywhere in `app/` or `scripts/`, and the only outbound `fetch()` to an
  external host in the entire app is Resend transactional email
  (`app/members/login-notification.ts`). Every "Engine" (Idea, Build, Sell,
  Launch, Fix, Grow, Plan, Etsy, Design Shop, Writing) generates its package
  from the user's own structured answers through deterministic classifiers
  (`app/planner/interpret.ts`, `app/creation/classify.ts`,
  `app/creation/recommend.ts`) and template functions
  (`app/creation/adapters.ts`, `app/engines/generator.ts`) — confirmed
  against `docs/ENGINE-STATUS.md`'s own per-engine notes ("No APIs.
  Deterministic output from curated templates. Works offline.").
- **The architecture already matches the brief's north star at the code
  level.** `Destination` (`app/engines/engines.ts`) — Claude Code / ChatGPT /
  Terminal / Designer / Developer / Contractor / Do it myself — is a
  deliberate, human-chosen "where does this go next" field on every generic
  engine's package, not an invisible dependency. `analyzeReturn()`
  (`app/engines/review.ts`) that recommends Fix/Refine/Expand/Launch after a
  "Return with results" is answer-driven, not a re-parse of pasted text
  through any model. Story Partner's "Suggested by Story Partner" / explicit
  5-state approval contract (`CLAUDE.md`, owner-only) is the same
  never-enters-your-work-without-your-say-so pattern, just not yet visible
  anywhere a visitor reaches.
- **The gap is not architecture — it's that none of this is ever said.** A
  repo-wide grep for "no AI" / "deterministic" / "works offline" /
  "not a chatbot" in every `.tsx` under `app/` returned nothing. A visitor
  has no way to learn, anywhere on the site, that the packages they're
  generating were never touched by a model — the exact fact this sprint's
  north star is about.
- **The concrete contradiction:** the "Send it to" picker on every generic
  engine's review screen (`EngineSystem.tsx`) listed Claude Code, ChatGPT,
  Terminal, Designer, Developer, Contractor, and "Do it myself" as one flat,
  undifferentiated list — two AI tools and five people/roles presented as
  equivalent choices, with nothing marking which is which. That is the
  opposite of "AI is a choice you make on purpose."
- Home/nav were untouched — they were the subject of last night's three
  checkpoints and are not part of this brief's evidence trail; the AI-call
  map lives entirely in the Engine Room, so that's where this slice landed.

### G-J: the slice shipped

**`DESTINATION_USES_AI`** (`app/engines/engines.ts`) — one map, alongside
`DESTINATION_LABELS`, marking exactly `claude-code` and `chatgpt` as AI
destinations and the other five as not. `EngineSystem.tsx` reads it in two
places:

1. The "Send it to" `<select>` (review step) now renders two `<optgroup>`s —
   "Uses AI" / "No AI" — built by filtering the same shared map, so a new
   destination can't silently land in the wrong group. A one-line caption
   underneath states the fact plainly: "The package above is already
   finished. Claude Code and ChatGPT use AI from here on; the rest don't."
2. The generated package's prompt (Execution tab) is captioned per
   destination: an AI destination gets "StepInTheRing wrote this from your
   answers — no AI. What comes back from &lt;X&gt; is on you to review."; a
   no-AI destination gets "StepInTheRing wrote this from your answers. No
   AI was involved." Both are true today and stay true automatically,
   because `mainPrompt` for the common case (`creationUnderstanding()` →
   `promptShell()`) is generated identically regardless of destination —
   the caption is documenting a fact already true in code, not asserting
   something new.

No new dependency, no redesign, no engine's actual output content changed.
Live-verified in the browser (Fix Engine, full 7-step intake through to a
generated cycle): the optgroup split renders correctly
(`document.querySelectorAll('#review-destination optgroup')` — "Uses AI":
Claude Code/ChatGPT, "No AI": Terminal/Designer/Developer/Contractor/Do it
myself), the review-step caption and the execution-tab caption both render
with real generated content, and 375px width shows no horizontal overflow
(`scrollWidth === clientWidth`, 375×375). Pixel screenshots were unavailable
in this session for the same compositor-surface reason logged in the
overnight-rescue entry above; DOM/JS-driven verification was used in its
place (the wizard was advanced by setting each input's native value
descriptor + dispatching `input`, then clicking the real "Continue" button —
not by faking any resulting state).

**New tests:** `app/engines/engines.test.ts` ("Destination — AI vs no-AI is
a real, exhaustive distinction" — every destination has a boolean, only
claude-code/chatgpt are AI, every named human destination is false);
`app/engines/EngineSystem.test.ts` ("Send it to — AI is a visible,
deliberate choice, not a hidden default" — the optgroups exist and read
from the shared map, the "already finished" line and both prompt-caption
strings are present in source).

### Verification for this sprint

- `npx vitest run` — 81 files, 1210 tests, all passing (baseline: 1203;
  +7 tests, zero regressions).
- `npx tsc --noEmit` — clean.
- `npx eslint .` — 0 errors (68 pre-existing warnings, same count as
  baseline, none in touched files).
- `npx next build` — clean production build.
- `node scripts/scan-public-bundles.mjs` — clean, no secret markers.
- Local dev server (ephemeral, `next dev -p 3988`, not committed to
  `.claude/launch.json`'s tracked history since that file is gitignored):
  live-verified as described above.

### Not done this sprint (candidates, not started)

- The same AI/no-AI honesty is not yet surfaced on the dedicated studios
  (Idea, Design Shop, Music, How To Anything, Game) that bypass
  `EngineSystem`'s generic review/generate flow entirely — none of them call
  AI either, but none of them say so. Worth the same treatment once a studio
  actually needs a "send it to AI" choice of its own.
- No sitewide statement of "this product doesn't call AI" exists yet (e.g.
  on `/how` or `/about`). Deliberately not added here — Home/nav copy is
  locked/test-guarded and was the subject of last night's rescue; a
  sitewide claim deserves its own owner-reviewed pass, not a rider on this
  slice.
- `/explore` vs `/live` duplication and the Builds/Library/engine-room-
  projects reconciliation (both flagged in earlier sprints above) remain
  untouched and unrelated to this brief.

## The Ring as the front-door portal — 2026-08-30

Starting checkpoint `d4e82b8` (this doc's own prior entry above, verified
HEAD, clean, matching `origin/main`, 1210 tests passing before any edit).
Brief: stop treating "no AI calls" as a brand message and instead organize
the existing product around one idea — Step In The Ring is the front door
that gets a person from "I want to do something" to a useful path, AI
included when AI actually helps. Audit first, reorganize what exists,
implement only high-confidence changes — no new dashboard, no rebuild, no
narrowing to any one audience.

### What the inventory found

Walked the real, current product end to end: `app/create/RingApp.tsx`
(Home + Create share one box, `CreationEntry`), `app/planner/interpret.ts`
→ `app/creation/{classify,recommend}.ts` (the deterministic reading of a
person's own words), the Result screen's single recommended engine door
plus its always-present takeaway prompt, `app/site/RingHeader.tsx` (nav:
Create · Engines · Builds · Library primary, How · Account secondary —
already four clean doors, no hamburger-only architecture), `app/engines/
page.tsx` + `app/vnext/capabilities.ts` (the public catalog, already
organized into verb shelves — Start/Make/Plan/Finish — not by internal
architecture, already says "or say what you want to make and the right one
gets suggested"), the `EngineSystem.tsx` generic engine flow plus five
dedicated studios (Idea, Design Shop, Music, How To Anything, Game) that
bypass it, `app/builds/` and `app/library/` (already documented as
deliberately distinct: Builds = still-making, Library = saved-and-may-want-
again, not two engine catalogs), `/explore` and `/live` (read in full this
time, not just by name — `/explore` is a curated overview that links to
`/live` for the complete list; a real parent/child relationship, not a
confusing duplicate, despite being flagged as unresolved twice before), and
`app/how/page.tsx` (already states the AI-portal idea in plain words at
step 3: "open an Engine if a focused tool helps, or take it to the AI
already in your corner, like ChatGPT or Claude").

**Headline finding: the architecture already implements the requested
diagram almost exactly.** Box → one deterministic reading → one recommended
engine door (`app/creation/recommend.ts`) → open the engine, or take the
always-present raw prompt straight to your own AI/tool/person right now →
inside an engine, `DESTINATION_USES_AI` (added last sprint) makes the AI-
vs-not choice explicit → "Return with results" keeps the record. That is
already `THE RING → WHAT DO YOU WANT TO DO? → THE RIGHT ENGINE → AI / TOOL
/ HUMAN / ME → SOMETHING REAL`, end to end, in production.

**Two genuine gaps found, both small and both fixed:**

1. The Result screen's always-present takeaway card — the moment where a
   person can skip the recommended engine and take the generated brief
   straight to their own AI, a person, or themselves — was labeled "Your
   builder prompt" with the instruction "Copy it into the building tool you
   already use, and start." The actual content (`adapterForType(view.
   creationType).prompt()`) is already correctly written per creation type
   (confirmed live: a song idea gets a "The song" / "First deliverable: one
   exported audio file" brief, not a software one) — only the static
   wrapper sentence assumed software. Fixed to: "Bring it to an AI, hand it
   to a person, or just start on it yourself." — the literal AI/tool/human/
   me idea, honest for every creation type. (`app/create/RingApp.tsx`)
2. Real proof that things get made through the Ring's actual Engines
   exists (`app/live/live-products.json` — Circuit, SlopeDoku, SurfDoku,
   MineDoku, each with a real URL and the engine that pushed it) but was
   reachable only via `/live`, itself one hop past `/explore`, itself only
   linked from the quiet sitewide footer or a text link at the bottom of
   `/how`. Nothing in the primary journey ever showed a person an actual
   example of something made this way. Added a small, restrained "Made
   through the Ring" section near the end of `/how` — 3 real entries (not
   the whole catalog), pulled directly from the same JSON `/live` and
   `/explore` already read, linking to `/live` for the rest. No invented
   accomplishments, no portfolio, not on the Home hero.

### What was deliberately left alone, and why

- **Home's hero, nav, and copy** — untouched. Three checkpoints landed
  there two nights ago and it is explicitly test-locked; nothing in this
  audit produced new evidence of a live problem there, and the brief's own
  instruction was not to redesign for the sake of redesigning.
- **The "build" naming cluster** (`Builds` nav item, `Build Engine`, "Your
  first build," `Build Machine`) — real echo in the names, but each card's
  own description already disambiguates the job clearly (confirmed by
  reading the live `/engines` page text), and there is no test, doc, or
  prior audit flagging it as an actual point of confusion. Renaming would
  touch many test-locked strings across `engines.ts`, `capabilities.ts`,
  and `docs/ENGINE-STATUS.md` for a benefit that is currently speculative —
  not done without real evidence it is a live problem.
- **`app/creation/adapters.ts`'s shared "Working method" section**
  (`doctrineLines`) still includes software-flavored lines ("do not assume
  access to any existing codebase," "Mobile-first") on every creation type
  including music and writing — noticed while live-testing the fix above.
  Real, but a different, larger fix (the doctrine list itself needs a
  per-type branch, not a wrapper-sentence change) — flagged for a future
  sprint, not fixed here to keep this one small.
- **Whether the box and its classifier can honestly carry non-creation
  requests** ("I don't understand this bill," "I have a difficult
  decision," "help me plan a vacation") — some map cleanly onto what
  already exists (a decision maps to the Idea Engine's version-scoring
  model; a vacation plan already produces `creationType: "event-plan"` and
  routes to the Plan Engine, confirmed in this doc's Sprint 2 section
  above); others (bill comprehension, "I need to learn this") do not map to
  any existing engine — `interpret.ts`/`classify.ts` is fundamentally a
  *creation* classifier ("what are you making," "the smallest version that
  would work"), not a general "what do you need" classifier. Broadening
  that is a real, larger architecture question, explicitly out of scope for
  a single sprint per this brief's own instruction not to invent new
  systems tonight. The box's wording ("What do you want to make?") was not
  changed without being able to honestly verify the pipeline behind it
  handles a wider range — changing the words without the pipeline behind
  them would be dishonest, not a simplification.
- **`recommendEngines()` vs. `capabilitiesForIntent()`** — two independent
  deterministic matchers exist (`app/creation/recommend.ts` drives the one
  Result-screen engine door; `app/vnext/capabilities.ts`'s simpler keyword
  matcher drives the "what can help" suggestions on `Builds` list/detail
  pages). Confirmed these do different jobs (one-time routing decision vs.
  ongoing suggestion sidebar) rather than being a true duplicate; left
  alone.

### Verification for this sprint

- `npx vitest run` — 81 files, 1216 tests, all passing (baseline: 1210;
  +6 tests, zero regressions).
- `npx tsc --noEmit` — clean.
- `npx eslint .` — 0 errors (68 pre-existing warnings, same count as
  baseline, none in touched files).
- `npx next build` — clean production build; `/how` still statically
  prerendered.
- `node scripts/scan-public-bundles.mjs` — clean, no secret markers.
- Local dev server (ephemeral `next dev -p 3988`): live-verified in the
  browser — `/how` renders "Made through the Ring" with three real,
  correctly-linked entries (Circuit, MineDoku, SurfDoku); a music idea run
  through Create's full flow produces a type-correct brief ("The song,"
  "First deliverable: one exported audio file") captioned with the new
  "Bring it to an AI, hand it to a person, or just start on it yourself."
  line; no horizontal overflow on `/how` or the Create result screen at
  375px, 1440px, or the default width (`scrollWidth === clientWidth` at
  each).

### Next highest-value simplification (not started)

The `doctrineLines()` "Working method" section flagged above — it is the
one remaining place a non-software creation (a song, a poem, a plan) still
receives software-specific instructions ("existing codebase," "Mobile-
first") inside its own generated brief. Real, small, and the natural
next step; not started this sprint to keep this checkpoint finished and
reviewable on its own.

## Fix the confirmed type-leak in doctrineLines() — 2026-08-30

Starting checkpoint `691c7f5` (this doc's own prior entry above, verified
HEAD, clean, matching `origin/main`, 1216 tests passing before any edit).
Scoped, single-purpose checkpoint: fix the exact bug flagged as "next
highest-value simplification" above, and nothing else.

### The type system, inspected before touching anything

Two signals already exist on every `CreationView` (`app/creation/types.ts`)
and neither was being used by the shared prompt scaffolding:

- **`CreationType`** (17 values — app/site/tool/list/game/physical-product/
  digital-product/printable/design/fashion/music/story/content/service/
  sports-plan/event-plan/unknown) — WHAT is being made.
- **`SoftwareVerdict`** (`central` / `helpful` / `optional` / `test-first`)
  — a separately-computed judgment of whether software is actually the
  deliverable, from `assessSoftware()` in `app/creation/classify.ts`. Read
  the whole switch: only `game`, `app`/`site`/`list`, and a non-caretaker
  `tool` return `"central"`. Every other type — `music`/`story`/`content`
  (`"optional"`), `printable`/`design`/`digital-product`/`physical-product`/
  `fashion`/`sports-plan`/`event-plan` (`"optional"`), `service`
  (`"test-first"`), a caretaker `tool` or `unknown` (`"helpful"`) — already
  says, in code, "software is not the point here."

**The grouping used, and why:** branch `doctrineLines()` on
`SoftwareVerdict === "central"` vs. everything else, not on `CreationType`
directly. The type system itself draws the line this way (a `tool` can be
`central` or `helpful` depending on whether it's content-driven; a
`physical-product` is `optional` even though it's a real, credible thing to
make) — using the type would require re-deriving a judgment the codebase
already makes once, correctly, in one place. No new type, no new enum, no
per-`CreationType` special-casing — just asking the existing signal before
writing repo/mobile/git language.

### The bug was in two places, not one

`doctrineLines(d)` (`app/creation/builder-defaults.ts`) was the confirmed
bug: unconditional "Mobile-first," "existing codebase," "type checking,
tests, production build," "commit"/"push," "ONE repository" — on every
prompt regardless of type. Fixed: now `doctrineLines(d, verdict)`; `verdict
!== "central"` returns a new `generalDoctrineLines(d)` — simplest approach,
no paid tools/AI services unless required, use/experience the real thing
before calling it done, stop only for destructive/hard-to-reverse choices,
an honest finishing report, the creator's own notes. Nothing about a
codebase, mobile, or git.

While live-verifying this fix in the browser (a song's generated prompt),
found the **same identical pattern one section higher**: `promptShell()`'s
unconditional "Scope and permissions" section
(`app/creation/adapters.ts`) said, for every creation with nothing to
continue, "Start clean. Nothing exists yet — do not assume access to any
codebase or prior files" — including, confirmed live, a song about missing
summer. Extracted into `scopeLines(v, d)`, same verdict branch: non-central
gets "Start fresh. Nothing about this exists yet — don't assume an earlier
version, draft, or file" (or, when continuing existing work, "This
continues something already underway... build on what's already true"
instead of "existing project... existing routes and integrations").

**Other adapter-level content inspected and left alone, correctly:**
`appCore()`'s "mobile-first web app" and `gameCore()`'s "Mobile-first:
thumb targets" are per-type `core` sections only ever reached for
`app`/`site`/`game` — all three are `"central"` in `assessSoftware()`, so
this is correct, type-appropriate content, not a leak. `fixCore()`'s "git
history before guesswork" is the Fix Engine's own scoped content — the Fix
Engine is deliberately software/technical in scope today (`technical: true`
in `app/engines/engines.ts`, per its own "the login stopped working"
framing), not a shared cross-type function; a product decision about that
engine's real-world scope, not the same code-level bug. Left both alone —
neither is "shared adapter text," the qualifier this checkpoint was scoped
to.

### The five required cases, verified

| Input | `creationType` | `verdict` | Working method / Scope |
| --- | --- | --- | --- |
| "I want to make an app that tracks my kids' chores." | `app` | `central` | Full software doctrine — codebase, mobile-first, type checking, git — unchanged. |
| "I want to write a song about missing summer when winter comes." | `music` | `optional` | General doctrine only; "Start fresh... don't assume an earlier version, draft, or file." |
| "I want to write a poem about the sea at night." | `story` | `optional` | Same as above — live-verified, zero matches for "codebase" or "mobile-first". |
| "I want to write a letter to my landlord about the broken heater." | `unknown` (`letter` isn't a STORY-signal word — not touched, see below) | `helpful` | General doctrine — the classifier wasn't broadened, but the *default* case was already non-central, so the fix still holds for the one required case the brief asked for. |
| "I need to plan a family reunion trip for next summer." | `event-plan` | `optional` | General doctrine only. |

### What was deliberately not touched

- **The classifier.** "Letter" is not in `classify.ts`'s `STORY` regex, so
  it reads as `unknown` rather than `story` — noticed, not fixed. The brief
  explicitly said not to broaden the classifier in this checkpoint; adding
  "letter" (or any other word) to a classification regex is exactly that,
  even though it would make this one case read more precisely.
- **Anything outside `app/creation/builder-defaults.ts` and
  `app/creation/adapters.ts`.** No Home changes, no new Engines, no AI
  calls, no broader "anything can enter the Ring" routing work.

### Verification for this sprint

- `npx vitest run` — 81 files, 1225 tests, all passing (baseline: 1216;
  +9 tests: 5 for the five required cases plus `doctrineLines()` branching
  directly, 2 for the Scope-and-permissions fix, 1 confirming the
  non-software working method isn't empty, 1 updating the pre-existing
  two-argument-signature call site).
- `npx tsc --noEmit` — clean.
- `npx eslint .` — 0 errors (68 pre-existing warnings, same count as
  baseline, none in touched files).
- `npx next build` — clean production build.
- `node scripts/scan-public-bundles.mjs` — clean, no secret markers.
- Local dev server (ephemeral `next dev -p 3988`): live-verified in the
  browser for the app, song, and poem cases — read `.prompt-box`'s actual
  rendered text directly (not just unit output) and confirmed zero matches
  for "codebase"/"mobile-first" on song and poem, full software doctrine
  intact on the app case. No horizontal overflow at 375px or 1440px on
  either the intake or result screens (`scrollWidth === clientWidth` at
  both).

## Broaden the front door — 2026-08-30

Starting checkpoint `ec172b1` (this doc's own prior entry above, verified
HEAD, clean, matching `origin/main`, 1225 tests passing before any edit).
Brief: run real representative inputs through the current deterministic
pipeline BEFORE editing anything, document exactly what happens, then make
the smallest principled extension that lets "almost anything" start at the
front door honestly — no LLM classifier, no new universal-agent system, no
fake capability.

### Investigation: what the pipeline actually did, before any edit

Ran all ten representative inputs through the real pipeline
(`interpret()` → `newRecord()`/`viewOf()` → `recommendEngines()` —
the exact path `app/create/RingApp.tsx` uses) and read the actual output,
not a guess:

| # | Input | `creationType` | Routed to |
| - | --- | --- | --- |
| 1 | "I want to make an app." | `tool` (central) | first-build — **works** |
| 2 | "I want to write a song." | `music` (optional) | Music Engine — **works** |
| 3 | "Write a letter to my insurance company." | `unknown` (helpful) | **Idea Engine** — "It's still an early thought — weigh a few versions and leave with one decision." A letter with a named recipient and purpose is not an early thought. |
| 4 | "Help me plan a vacation." | `unknown` (helpful) | **Idea Engine**, same wrong framing — "vacation" isn't in the `EVENT` regex (only "trip" was), so this never reached `event-plan`. |
| 5 | "My faucet is leaking." | `unknown` (helpful) | **Idea Engine**, same wrong framing. |
| 6 | "I don't understand this bill." | `unknown` (helpful) | **Idea Engine**, same wrong framing. |
| 7 | "Explain this document to me." | `unknown` (helpful) | **Idea Engine**, same wrong framing. |
| 8 | "Help me decide between these two options." | `unknown` (helpful) | **Idea Engine** — the destination was a plausible fit (Idea Engine IS a decision-scoring tool) but the reason text ("It's still an early thought") was wrong for a request that already names two clear options. |
| 9 | "Teach me how compound interest works." | `unknown` (helpful) | **Idea Engine**, same wrong framing. |
| 10 | "I have an idea but don't know where to start." | `unknown` (helpful) | Idea Engine — **correct**, this is exactly what it's for. |

**A confirmed, separate, more serious bug found during the same
investigation**, not in the original ten: `FIX_WORDS` in
`app/planner/interpret.ts` (`broken`, `stopped working`, `bug`, etc.) has
no digital-vs-physical distinction. "My toaster is broken." and "The
washing machine stopped working." both produced `buildType: "fix"` and
routed to the **software Fix Engine**, with `promptPathWhy`: *"Something
real is broken — the repair prompt below looks before it touches...
Copy it into your builder."* — a broken toaster, told to be inspected like
a codebase. ("My car won't start." didn't happen to match `FIX_WORDS`
at all, so it fell to the same wrong Idea-Engine path as #3–9 instead —
inconsistent, but not actively claiming software capability.)

### Answers to the investigation questions

- **A/C — already work well:** #1, #2, #10. Nothing here needed to change.
- **B/D — classify incorrectly / route wrong:** #3–9, plus the toaster/
  washer/car cases. All ten fall into `unknown`, and `recommend.ts` has
  exactly ONE hardcoded rule for `unknown`: send it to the Idea Engine.
  `unknown` was hiding at least four different real shapes — a vague idea
  still forming (correct for Idea Engine), a decision between named things,
  a comprehension/learning question, and real-world trouble — and treating
  all four identically was the bug.
- **E — an existing Engine that already fits, once routing improves:**
  #3 (Writing Engine — `story` already routes there, "letter" just wasn't
  in the `STORY` word list) and #4 (Plan Engine — `event-plan` already
  routes there, "vacation" just wasn't in the `EVENT` word list). Both are
  narrow vocabulary gaps in an already-correct destination, not new
  capability.
- **F — no dedicated path, but a useful portable result is still honest:**
  #5–7, #9, and the toaster/washer/car cases. None of these are a "make a
  thing" request; forcing them into the Idea Engine's "weigh a few
  versions" framing, or the Fix Engine's "your builder"/git language, was
  the dishonest part — not the absence of a bespoke tool.
- **G — the real bottleneck:** recommendation, specifically one line in
  `app/creation/recommend.ts`: `if (v.creationType === "unknown") return
  {primary: choice("idea", ...)}` — a single hardcoded destination for
  every shape of "not a concrete creation," with zero secondary dispatch.
  Terminology was a contributing factor (no vocabulary anywhere for
  comprehension/decision/learning), but the fix belongs at the routing
  layer, not a bigger classifier.
- **H — can the existing architecture generalize without a new agent
  system:** yes — confirmed by the fix actually shipped below, which adds
  one `CreationType`, reuses the existing `primary: null` / `promptPathWhy`
  mechanism already built for "fix" and "lands in something existing," and
  needed zero new Engines, zero AI calls, zero new taxonomy beyond one type.

### The distinction used, and why

Not `CreationType`'s existing axis ("what's being made") stretched to
cover "explain a bill" — that would corrupt a type system whose whole job
is "what kind of thing is being made." Not a giant intent taxonomy
(MAKE/FIX/PLAN/WRITE/LEARN/UNDERSTAND/DECIDE/START-AN-IDEA) hard-coded
wholesale — most of those already exist as real `CreationType`s
(`event-plan`, `story`→Writing, `unknown`→Idea) and didn't need touching.

The one new distinction: **is this even a "make a thing" request at all?**
Added as a single new `CreationType`, `"general-help"` — additive, in the
same family as the 16 that already exist, wired through every place
`CreationType` is exhaustively handled (`CREATION_TYPE_LABEL`,
`CREATION_TYPE_NOUN`, `assessSoftware()`, `deriveSmallestOutcome()`,
`adapterForType()`, `recommendEngines()` — TypeScript's `Record<CreationType,
...>` types caught every one of these at compile time except the two
switch-based functions, which were checked by hand and by the new test
suite). Detection lives in `app/creation/profile.ts` (`looksLikeGeneralHelp`
/ `looksLikeRealWorldTrouble`) — the same shared file `SPORTS_PLAN_WORDS`
and `looksFashion` already live in, imported by both `classify.ts` and
`interpret.ts`, so the physical-object-malfunction guard protects `FIX_WORDS`
in `interpret.ts` and the `general-help` classification in `classify.ts`
from one shared definition, not two that could drift.

**Gating, to avoid stealing legitimate matches:** every general-help check
is gated to `shape === "unknown"` — the same gate `MUSIC`/`STORY` already
use. "An app that explains my bill" keeps its `tool` shape and never
reaches the general-help check at all; only a bare "explain this bill"
does. `looksLikeRealWorldTrouble` additionally requires a `PHYSICAL_OBJECT`
word AND a malfunction word AND the ABSENCE of any digital-context word
(app/site/button/login/database/code/etc.) — so "the login button on my
app is broken" still correctly reads as a real software bug.

### Fix

**`app/creation/profile.ts`** — new `looksLikeRealWorldTrouble()` and
`looksLikeGeneralHelp()`, shared by both layers.

**`app/creation/types.ts`** — new `CreationType` value `"general-help"`
("Help figuring this out").

**`app/creation/classify.ts`** — `classifyCreationType()` gets one new
gated branch; `assessSoftware()` gets a `"general-help"` case (`verdict:
"optional"`); `CREATION_TYPE_NOUN` gets an entry ("answer");
`deriveSmallestOutcome()` gets an explicit case (previously it silently
fell to `default`, which said "one version of this exists in the world" —
wrong for a question). Two narrow vocabulary widenings found and fixed in
the same investigation: `STORY` now recognizes `letter`/`essay`; `EVENT`
now recognizes `vacation`/`holiday`.

**`app/creation/adapters.ts`** — new `generalHelpCore()` (small, honest:
what's actually being asked, what Step In The Ring was never shown, a
plain answer or next step — never a fabricated "MVP scope" or "decision
record"), registered in `adapterForType()` the same way `fashion-prompt`/
`service-prompt`/`sports-prompt` already are — a small ad-hoc prompt shape,
not a new registered Engine.

**`app/creation/recommend.ts`** — new `case "general-help"`, reusing the
exact `primary: null` / `promptPathWhy` mechanism `"fix"` and "lands in
something existing" already use. No new routing concept.

**`app/planner/interpret.ts`** — `classifyBuildType()`'s `FIX_WORDS` check
is now guarded by `!looksLikeRealWorldTrouble(text)` — this is the line
that stops a broken toaster from reaching the software Fix Engine.
`deriveCompletionAction()` gets the same `shape === "unknown" &&
looksLikeGeneralHelp(productText)` gate as `classify.ts`, so the
always-visible `plan.completionAction` line agrees with `creationType`
instead of independently saying "build version one" for a question.

### Before/after routing table (verified, not asserted)

| Input | Before | After |
| --- | --- | --- |
| "I want to make an app." | `tool`/central → first-build | unchanged |
| "I want to write a song." | `music`/optional → Music Engine | unchanged |
| "Write a letter to my insurance company." | `unknown` → Idea Engine (wrong) | `story`/optional → **Writing Engine** |
| "Help me plan a vacation." | `unknown` → Idea Engine (wrong) | `event-plan`/optional → **Plan Engine** |
| "My faucet is leaking." | `unknown` → Idea Engine (wrong) | `general-help`/optional → **honest brief, no engine, no AI required** |
| "I don't understand this bill." | `unknown` → Idea Engine (wrong) | `general-help` → honest brief |
| "Explain this document to me." | `unknown` → Idea Engine (wrong) | `general-help` → honest brief |
| "Help me decide between these two options." | `unknown` → Idea Engine (wrong reason text) | `general-help` → honest brief |
| "Teach me how compound interest works." | `unknown` → Idea Engine (wrong) | `general-help` → honest brief |
| "I have an idea but don't know where to start." | `unknown` → Idea Engine (correct) | unchanged |
| "My toaster is broken." | buildType `fix` → **software Fix Engine** (confirmed live bug) | `general-help` → honest brief |
| "The washing machine stopped working." | buildType `fix` → software Fix Engine | `general-help` → honest brief |
| "My car won't start." | `unknown` → Idea Engine (wrong) | `general-help` → honest brief |
| "The login button on my app is broken." (regression guard) | buildType `fix` → Fix Engine | unchanged — still Fix Engine |
| "My website stopped working." (regression guard) | `site`/central, buildType `fix` → Fix Engine | unchanged |

Every row above is a real assertion in
[`app/creation/general-help.test.ts`](../app/creation/general-help.test.ts),
not a claim.

### What remains unsupported, honestly

- **Learning a NEW topic** ("teach me how compound interest works") and
  **comprehension** ("explain this bill") both land in the same
  `general-help` bucket with the same honest "bring this to a person or an
  AI" framing. There is still no dedicated lesson-building or document-
  reading capability — this checkpoint makes the front door honest about
  that gap, it doesn't close it.
- **The one-follow-up question** (`app/planner/interpret.ts`'s
  `deriveQuestions`) still asks a product-shaped question — "What should it
  do the very first time someone uses it?" — for a `general-help` creation
  like a leaking faucet. Confirmed live in the browser. It's skippable
  ("Skip — decide for me") and doesn't block or mislabel anything, but it's
  a visible rough edge in a different subsystem this checkpoint didn't
  touch — see "next highest-value gap" below.
- **`deriveTools()`'s generic fallback** (`app/creation/profile.ts`) still
  says "the idea needs one more decision before tools matter" on the
  "Tools and setup" card for a `general-help` creation — cosmetically off
  (a clear question isn't "an idea needing a decision"), not false. Same
  reasoning as above: real, minor, a different function, not fixed here.
- **The `EXPLORE_WORDS`-driven "Explore an early idea" assumption label**
  still appears on a `general-help` understanding card (e.g. "My faucet is
  leaking" shows "Explore an early idea" above "Help figuring this out").
  Harmless (it's inside "Calls I made for you — open to check them," always
  labeled as a correctable assumption) but not perfectly worded.
- Comprehension/decision detection has no `hasDestination` awareness —
  gating to `shape === "unknown"` covers every case this checkpoint tested,
  but a contrived sentence naming an existing product AND using a
  comprehension word could theoretically still reach `general-help` if its
  shape also happened to read as `unknown`. Not observed in any of the 13
  tested inputs; flagged as a known limitation of the narrow, text-only
  gate, not a designed edge case.

### Verification for this sprint

- `npx vitest run` — 82 files, 1243 tests, all passing (baseline: 1225;
  +18 tests in the new `app/creation/general-help.test.ts`, all ten
  representative inputs plus the toaster/car/washing-machine and two
  genuine-software-bug regression guards).
- `npx tsc --noEmit` — clean (TypeScript's `Record<CreationType, ...>`
  exhaustiveness caught every label/noun map that needed the new type).
- `npx eslint .` — 0 errors (68 pre-existing warnings, same count as
  baseline, none in touched files).
- `npx next build` — clean production build.
- `node scripts/scan-public-bundles.mjs` — clean, no secret markers.
- Local dev server (ephemeral `next dev -p 3988`): live-verified in the
  browser for "My faucet is leaking," "I don't understand this bill,"
  "Write a letter to my insurance company," and "Help me plan a
  vacation" — each shows the correct `creationType` label, the correct
  routing (Writing/Plan Engine door, or the honest no-engine "Next step"
  card with the exact `promptPathWhy` text), and the always-present
  builder-prompt card reads correctly for each. No horizontal overflow at
  375px or 1440px on the Result screen for the general-help case
  (`scrollWidth === clientWidth` at both).

### Next highest-value gap

The one-follow-up question (`deriveQuestions` in `app/planner/interpret.ts`)
asking "What should it do the very first time someone uses it?" for a
`general-help` creation — real, visible, skippable but worth a dedicated
look next, since it's the same class of "product-shaped language for a
non-product request" this checkpoint just fixed in three other places.

## Make the follow-up question match the human's actual need — 2026-08-30

Starting checkpoint `9954a77` (this doc's own prior entry above, verified
HEAD, clean, matching `origin/main`, 1243 tests passing before any edit).
Scoped, single-purpose checkpoint: fix the exact gap flagged above, and
nothing else.

### Inspection before any edit

`deriveQuestions()` in `app/planner/interpret.ts` returns the FIRST
applicable of three questions: a `versionOne` product-behaviour question
("What should it do the very first time someone uses it?"), a `sell`-buildType
audience question ("Who would actually pay for this?"), or a general
audience question ("Who is it for?"). It already had a working precedent
for exactly this problem: `piece`/`personalPiece`/`coachPlan`/`wearable`
flags exempt a definite poem/song/story, coaching plan, or wearable design
from the `versionOne` question, because those have no "behaviours" to ask
about. The bug was that this exemption list was incomplete — `general-help`
and plain physical/design products (not wearables) were both missing from
it, and it operates on the early, coarse `Shape` (game/site/tool/list/
product/content/unknown from `app/planner/signals.ts`), not the later,
richer `CreationType` — so a fix to `CreationType`'s vocabulary (last
checkpoint's `STORY`/`EVENT` word-list additions) didn't automatically fix
this earlier layer too.

Ran the eight required inputs through the real `interpret()` call and read
`openQuestions` directly:

| # | Input | `shape` | Question before fix |
| - | --- | --- | --- |
| 1 | "I want to make an app." | `tool` | `versionOne` — correct, unchanged |
| 2 | "I want to write a song." | `content` | none — `piece` already covers this |
| 3 | "Write a letter to my insurance company." | `unknown` | `versionOne` — **wrong**; "letter" isn't in any Shape word list |
| 4 | "Help me plan a vacation." | `unknown` | `versionOne` — **wrong**; there is no "event" Shape at all |
| 5 | "My faucet is leaking." | `unknown` | `versionOne` — **wrong** |
| 6 | "I don't understand this bill." | `unknown` | `versionOne` — **wrong** |
| 7 | "Help me decide between these two options." | `unknown` | `versionOne` — **wrong** |
| 8 | "Teach me how compound interest works." | `unknown` | `versionOne` — **wrong** |

**Matrix audit, as requested** (song/poem/letter/event-plan/physical-product/
general-help): song and poem were already fine (`piece` exemption, gated on
`shape === "content"`). Letter and event-plan were NOT fine, for the reason
above. One more, not in the original audit list, surfaced from the same
matrix: **"I want to sell handmade candles"** (`shape: "product"`,
`buildType: "sell"`) also got the software `versionOne` question — a
physical/design product's version one is one finished unit, not a
first-use flow, and only the more specific `wearable` (clothing) case was
exempted, not physical/design products generally.

### The distinction used, and why

Not five new hard-coded phrase checks. Two things:

1. **Reuse, don't re-derive.** `general-help`'s detection already exists
   (`looksLikeGeneralHelp` in `app/creation/profile.ts`, from the prior
   checkpoint) — `deriveQuestions` now calls it directly
   (`a.shape === "unknown" && looksLikeGeneralHelp(a.productText)`), the
   same gate `classify.ts` uses, so the two layers can't disagree about
   what counts as general-help.
2. **The four tiny, deterministic sub-signals the brief allowed for**
   (understand/decide/learn/troubleshoot) already existed too — they're
   the four regexes `looksLikeGeneralHelp` already ORs together
   (`COMPREHENSION_WORDS`, `LEARNING_WORDS`, `DECISION_WORDS`,
   `looksLikeRealWorldTrouble`). Named and exported as one new function,
   `generalHelpKind()` → `"learn" | "decide" | "understand" | "trouble" |
   null`, in the same file. No new taxonomy — the same four words the
   existing type already distinguishes internally, just given names so
   the follow-up question can pick from four honest, hand-written
   questions (one per kind) instead of one generic stand-in.

For the letter/vacation/candle gap specifically: rather than teach
`deriveQuestions` a second, parallel vocabulary, the fix closes the gap
between the two existing classifiers so they can't drift apart again —
`EVENT_WORDS` (event/party/wedding/trip/vacation/holiday/etc.) moved from
a private constant in `classify.ts` to a shared, exported one in
`app/creation/profile.ts` (the same file `SPORTS_PLAN_WORDS` and
`looksFashion` already live in for exactly this reason), and
`app/planner/signals.ts`'s `content`-shape word list gained "letter" and
"essay" — the same two words added to `classify.ts`'s `STORY` regex last
checkpoint, now present in both places instead of one.

### Fix

**`app/creation/profile.ts`** — new `generalHelpKind()` (four-way sub-
classifier reusing the existing four regexes); `EVENT_WORDS` moved here
from `classify.ts` and exported.

**`app/creation/classify.ts`** — imports the now-shared `EVENT_WORDS`
instead of defining its own copy.

**`app/planner/signals.ts`** — the `content` Shape's word list gained
`letter`/`essay`, matching `classify.ts`'s `STORY` regex.

**`app/planner/interpret.ts`** — `deriveQuestions()`:
- New `generalHelp` flag, checked FIRST: when true and not yet answered
  (key `"detail"`), returns one of four honest, kind-specific questions
  (`GENERAL_HELP_QUESTIONS`) instead of the product-behaviour question.
  Also excluded from the `versionOne` branch itself, so once "detail" is
  answered the flow doesn't fall through and ask the software question
  anyway (a real bug caught by this checkpoint's own test suite before
  it shipped).
- New `physicalGood` flag (`shape === "product"`) and `eventPlan` flag
  (`EVENT_WORDS.test(...)`), both added to the `versionOne` exemption
  list alongside the existing `piece`/`coachPlan`/`wearable`.
- `piece` and `personalPiece`'s own word lists gained `letter`/`essay` too
  (belt-and-suspenders with the Shape fix — either one alone would have
  been enough, having both means the exemption still works if either
  layer's word list drifts again later).

### Before/after follow-up-question matrix (verified, not asserted)

| Input | Classification | Before | After | Why it fits |
| --- | --- | --- | --- | --- |
| "I want to make an app." | `tool` | `versionOne` | unchanged | Software genuinely has a first-use behaviour worth naming. |
| "I want to write a song." | `content` | none | unchanged | Already exempt — a song's version one is a draft, not a behaviour. |
| "Write a letter to my insurance company." | `content` (was `unknown`) | `versionOne` (wrong) | **none** | A letter's purpose and recipient are already the point; nothing to ask. |
| "Help me plan a vacation." | `unknown` | `versionOne` (wrong) | **"Who is it for?"** | Who's going changes the plan; what it "should do" doesn't apply. |
| "I want to sell handmade candles." | `product` | `versionOne` (wrong) | **"Who would actually pay for this?"** | A buyer, not a first-use flow, is what shapes a physical product. |
| "My faucet is leaking." | `general-help`/trouble | `versionOne` (wrong) | **"What's happening, exactly?"** | The next fact that actually helps: symptom, timing, what's been tried. |
| "I don't understand this bill." | `general-help`/understand | `versionOne` (wrong) | **"What part is confusing or concerning you?"** | Narrows a whole document to the one thing worth explaining. |
| "Help me decide between these two options." | `general-help`/decide | `versionOne` (wrong) | **"What are the options, in a sentence each?"** | Can't weigh anything without knowing what's actually being weighed. |
| "Teach me how compound interest works." | `general-help`/learn | `versionOne` (wrong) | **"What would make this click for you?"** | Asks how to teach it well, not what a "version one" of a lesson is. |

Every row is a real assertion in
[`app/planner/interpret.test.ts`](../app/planner/interpret.test.ts)'s new
"the one follow-up question fits the actual need, not just software"
block.

### Other shared-question leakage found

Only the physical/design-product gap above (`shape === "product"`, not
already covered by the more specific `wearable` case) — found via the
requested song/poem/letter/event-plan/physical-product/general-help
matrix and fixed in the same layer. No other leak found; `sports-plan`
(`coachPlan`) and `fashion` (`wearable`) were already correctly exempted
before this checkpoint.

### Verification for this sprint

- `npx vitest run` — 82 files, 1255 tests, all passing (baseline: 1243;
  +12 tests: 8 for the required inputs, 1 confirming the app/software
  question is unchanged, 2 for the "answered once, never re-asked or
  fallen-through" regression this checkpoint's own tests caught before
  shipping, 1 guarding against a literal dollar amount in any general-help
  question/placeholder — the repo's existing `publicPriceGuard.test.ts`
  caught this once already during this checkpoint, see below).
- `npx tsc --noEmit` — clean.
- `npx eslint .` — 0 errors (68 pre-existing warnings, same count as
  baseline, none in touched files).
- `npx next build` — clean production build.
- `node scripts/scan-public-bundles.mjs` — clean, no secret markers.
- **Caught by an existing guard, not this checkpoint's own tests:** the
  first draft of the "confusing bill" placeholder used a literal "$45"
  example, which `app/lib/publicPriceGuard.test.ts` (a 2026-08-06
  regression guard against any customer-visible dollar price reappearing
  while pricing is TBD) correctly flagged. Reworded to avoid a dollar
  figure entirely; a new test in `interpret.test.ts` now also checks every
  general-help question/help/placeholder string directly, so the two
  guards can't drift apart.
- Local dev server (ephemeral `next dev -p 3988`): live-verified in the
  browser for app, letter, faucet, confusing bill, and the compound-
  interest learning request — each shows the exact question text from the
  table above. No horizontal overflow at 375px or 1440px
  (`scrollWidth === clientWidth` at both).

### Stopping point

This checkpoint is complete as scoped. Not started: broadening the
classifier further, document upload, lesson systems, decision engines, or
any consulting/human-help feature — all explicitly out of scope for
tonight per the brief.

## Mom + Dad first-time journey audit — 2026-08-30

Starting checkpoint `eaa3e7f` (this doc's own prior entry above, verified
HEAD, clean, matching `origin/main`, 1255 tests passing before any edit).
Not an architecture sprint — a real first-time-user walkthrough of the
seven required journeys, in the actual browser, from Home.

### The seven journeys, walked cold from Home

| # | Input | HOME | FOLLOW-UP | RESULT (before fixes) | AI HANDOFF |
| - | --- | --- | --- | --- | --- |
| 1 | "I don't understand this bill." | One box, "What do you want to make?" | "What part is confusing or concerning you?" (correct, from a prior checkpoint) | "Before building anything, try the cheap version..." + "Keep this build" + "What can help: Five Hour Sprint, Your first build" — all wrong | "...person or AI who can really see it" — clear enough |
| 2 | "My faucet is leaking." | same | "What's happening, exactly?" (correct) | same three wrong elements as #1 | same, clear |
| 3 | "Write a letter to my insurance company." | same | none (correct — piece exemption) | "Before building anything, try the cheap version: finish the smallest complete piece..." — contradicts "not engineered" one line below | not mentioned — fine, no engine needed here anyway |
| 4 | "Help me plan a vacation." | same | "Who is it for?" (correct) | "Before building anything..." same issue as #3; "What can help: Plan Engine" — correct | not mentioned — fine |
| 5 | "Teach me how compound interest works." | same | "What would make this click for you?" (correct) | "Before building anything..."; **"What can help: How to Anything Engine"** — actively wrong direction (that engine publishes YOUR OWN proven fix; this person wants to learn, not teach) | "...person or AI who can really see it" — clear |
| 6 | "I want to make an app." | same | "What should it do the very first time someone uses it?" (correct, software) | "Get this working first..."; "What can help: Build Engine" — correct | not reached yet at this screen — fine |
| 7 | "I want to write a song." | same | none (correct) | "Before building anything, try the cheap version..." — same contradiction as #3 | not mentioned — fine |

Every RESULT-column problem above was real and reproduced live before any
edit. After the fixes below, all seven read coherently — verified live
again, same inputs, same screens.

### Findings, ranked

**P0 — none found.** Every one of the seven journeys already reaches a
usable next step; nobody hits a dead end (Section E: pass on all seven).

**P1 — four found, all fixed:**
1. `firstMoveFrom()`'s wrapper phrase "Before building anything, try the
   cheap version:" appears for EVERY non-central creation (general-help,
   song, poem, letter, plan, physical product) — the one word "building"
   is the only literally software-shaped part of an otherwise-fine
   sentence, and for general-help it directly contradicted the sentence
   one line below it ("This is a question or a real situation, not
   something to build").
2. `helpsFor()`'s "What can help" section suggested wrong-direction tools
   for general-help — not just the generic ALWAYS_HELPFUL fallback (Five
   Hour Sprint, a beginner app walkthrough) but a REAL keyword match too:
   "Teach me how compound interest works" matched the How To Anything
   Engine, which turns the OWNER'S OWN proven fix into a published
   tutorial — the opposite of wanting to learn something from it.
3. `UnderstoodCard`'s buildType pill showed "Explore an early idea" next
   to "Help figuring this out" on the Result screen — a software
   buildType assumption contradicting the creationType label right beside
   it.
4. `deriveTools()`'s generic fallback told a general-help creation "the
   idea needs one more decision before tools matter" and listed "all
   tooling until the creation has a definite form" — language for a vague
   idea still forming, wrong for an already-clear question.

**P1 — Home message, fixed (smallest copy only):** the box's example
list and three of Home's four Quick Start tiles are entirely make/build-
framed ("build a simple website," "make a family game," "write
something," "make a song"); the fourth said "Plan, fix, or build
something else" — three verbs, still all about making something. A
first-time visitor with a real question had no signal that it was
welcome, even though the pipeline now handles it excellently. Fixed by
editing that one existing tile's label and subtitle only — no new tile
(Home already deliberately trimmed to "four doors, not eight"), no layout
change.

**P1 — noted, NOT fixed (too large for this checkpoint):**
- **"Builder prompt" / "Build" terminology is genuinely pervasive** —
  it's in the SEO metadata (`app/layout.tsx`), the public `/about` page's
  own description, module names (`app/planner/builder-prompt.ts`), and a
  locked `.md`-export test assertion. Renaming the on-screen label alone
  (as tried and reverted in an earlier checkpoint's reasoning) would
  create an inconsistency with the site's own self-description elsewhere,
  not fix one. A real jargon exposure (Section A: "prompt," "builder") —
  a coordinated terminology pass across multiple pages, not a same-night
  copy patch.
- **The generated brief renders as raw markdown source** (`## Scope and
  permissions`, `## Original intent`) inside a monospace `<pre>` block —
  for a first-time user asking about a leaking faucet, this looks like a
  technical document, not help. Real (Section D: "technical language in a
  nontechnical journey"), but fixing it means either rendering markdown
  properly or restructuring how `generalHelpCore()`'s package presents
  itself — a rendering/design decision, not a copy tweak.

**P2 — noted, not fixed:** auto-generated titles read tersely ("Understand
Bill," "Write Letter," "Two Options" — articles and context dropped). This
is a consistent, intentional pattern across every creation type, not a
new confusion; the full sentence is always shown directly below it.

### What was fixed (all four P1 code fixes + the Home copy fix)

- **`app/vnext/shape.ts`** — `firstMoveFrom()`: general-help gets the
  honest test sentence directly, no wrapper at all; every other non-
  central type keeps a wrapper but with "building" removed ("Try the
  cheap version first:" instead of "Before building anything, try the
  cheap version:"). `helpsFor()`: general-help returns `[]` unconditionally
  (checked before, not just after, the keyword-match attempt) rather than
  ever surfacing a matched-but-wrong-direction or generic-but-wrong
  capability.
- **`app/creation/profile.ts`** — `deriveTools()`: new `general-help` case
  ("Nothing — the real bill, document, mechanic, or object, in front of
  the right person... No tool makes it clearer than the real thing
  would."), following the exact same per-type early-return pattern
  `sports-plan`/`story`/`content` already use.
- **`app/create/RingApp.tsx`** — `UnderstoodCard`: the buildType pill is
  hidden only when `creationType === "general-help"`; every other
  creation keeps it unchanged.
- **`app/create/starting-points.ts`** — Home's 4th Quick Start tile:
  label "Plan, fix, or build something else" → "Plan, fix, or ask
  something"; subtitle now names a real question as explicitly welcome.
  Same stem (`"I need to "`), same tile count, same layout.

### Verification for this sprint

- `npx vitest run` — 83 files, 1263 tests, all passing (baseline: 1255;
  +8 tests, +1 new file `app/create/starting-points.test.ts`; one
  pre-existing test in `app/vnext/shape.test.ts` updated to match the new,
  intentional copy rather than the old one it had locked).
- `npx tsc --noEmit` — clean.
- `npx eslint .` — 0 errors (68 pre-existing warnings, same count as
  baseline, none in touched files).
- `npx next build` — clean production build.
- `node scripts/scan-public-bundles.mjs` — clean, no secret markers.
- Local dev server (ephemeral `next dev -p 3988`): every one of the seven
  required journeys re-walked live from Home after the fixes, reading the
  actual rendered text at each screen (not just unit output) — all seven
  now read coherently end to end, matching the "after" column implied by
  the findings above. No horizontal overflow at 375px or 1440px on Home
  or the Result screen (`scrollWidth === clientWidth` at both).

### Section-by-section audit result (as requested)

- **A (jargon):** "builder prompt," "build," "Engine," "destination" all
  present and load-bearing sitewide — flagged, not removed (see P1-not-
  fixed above). No new jargon introduced by this checkpoint's fixes.
- **B (unclear buttons):** none found in the seven journeys — "Keep this
  build," "See the whole plan," "Skip — decide for me," "That's it →" all
  say what they do plainly, even where "build" itself is a loaded word.
- **C (too many choices):** none found — one box, one follow-up question
  at a time, at most ~2 "what can help" chips (now zero for general-help),
  Home's tile count unchanged at four.
- **D (trust breaks):** the four P1s above were exactly this category —
  all fixed except the two flagged-too-large items.
- **E (dead ends):** pass on all seven — every journey reaches a usable
  next step (an engine door, or an honest "bring this to a person/AI/
  yourself" brief).
- **F (font/tap/mobile):** no overflow found at 375px on Home or any
  Result screen tested; no CSS/layout was touched this checkpoint, so no
  new risk introduced.
- **G (Home message):** "What is this?" and "What do I do here?" both
  pass. "Can I bring my own problem?" failed before this checkpoint's
  smallest-copy fix to Home's 4th Quick Start tile; passes now. "Do I need
  to know AI?" passes — Home itself never mentions AI at all.

### Next highest-value usability gap

The generated brief's raw-markdown presentation (`## Scope and
permissions`, `## Original intent`, etc., inside a monospace box) is the
single most visible remaining "this looks technical" moment across every
journey, general-help included. Fixing it well means a real rendering or
restructuring decision, not a copy patch — the natural next checkpoint.
