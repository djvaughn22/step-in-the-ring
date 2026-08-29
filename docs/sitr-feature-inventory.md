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
