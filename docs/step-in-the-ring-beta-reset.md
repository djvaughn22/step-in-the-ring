# Step In The Ring — Beta Reset (Session 1)

Operational log for the controlled five-hour reset. Keep this file current — update it at the start/end of each session rather than writing a new one.

Baseline: branch `main`, clean tree, HEAD `2ee5d362e7c644ea6c5a90604a21b3fa4667906e` (rollback point for this session).

## Route inventory (actual, from `app/**/page.tsx`)

| Route | Purpose |
|---|---|
| `/` | Free idea planner (landing → clarify → result → saved). No login required. |
| `/engines` | Engine Room. Server-gated: owner → full; live member → member mode; everyone else → `redirect(/membership)`. |
| `/membership` | Public membership/private-beta page: free idea capture, sign up/sign in, tester-code redemption, dormant Stripe checkout. |
| `/products/five-hour-sprint` | Marketing/detail page for the Five Hour Sprint tool. |
| `/five-hour-sprint-tool` | The tool itself (gated — check access model, not re-audited deeply this session). |
| `/account` | Signed-in account/projects management. |
| `/projects` | Project workspace (`ProjectsWorkspace.tsx`). |
| `/build` | "Never built a web app? Start here" onboarding, own layout. |
| `/how` | How it works. |
| `/live` | Live products / proof gallery. |
| `/about` | About page — carries required footer anchors (`#contact`, `#disclaimer`). Not touched (family standard). |
| `/shop` | Present — not deeply audited this session. |
| `/author` | Story Partner owner-auth surface — not touched. |
| `/owner`, `/owner/tester-codes` | Owner-only console. |
| `app/api/**` | API routes backing the above (members, checkout, etc.). |

Non-route lib modules (no `page.tsx`, logic only): `app/members/*`, `app/creation/*`, `app/planner/*`, `app/project/*`.

## Engine inventory (`app/engines/engines.ts`)

| id | name | activation |
|---|---|---|
| idea | Idea Engine | working |
| build | Build Engine | beta |
| sell | Sell Engine | beta |
| launch | Launch Engine | beta |
| fix | Fix Engine | beta |
| grow | Grow Engine | beta |
| plan | Plan Engine | beta |
| etsy | Etsy Engine | beta |
| design-shop | Design Shop Engine | working |
| game | Game Engine | owner-only |
| howto | How to Anything Engine | beta |
| story | Story Partner | owner-only |
| music | Music Engine | beta |

`EngineCard` (`app/engines/EngineSystem.tsx`) already renders: emoji, status pill (`ACTIVATION_LABEL`), name, one-line tagline, "You finish with" output line, and a Start/Resume action. This is close to the target engine-entry pattern already — no rebuild needed, only status-pill/label consistency.

## Current customer journey (before this session)

1. Homepage: free-text idea box, "Read my idea →" (no login). Good.
2. Result screen offers "Continue in <Engine>" → routes to `/engines?engine=...`.
3. Homepage also has a direct "Or open the Engine Room" door card claiming **"Open to everyone."**
4. Reality: `/engines` is server-gated. A non-member hitting it (from either path) is redirected to `/membership` — sign up or redeem a tester code. This contradicts the "open to everyone" claim.
5. `/membership` page headline is framed as a **paid membership product** ($7.77/mo shown prominently, "Membership" as the H1) with private-beta framing secondary, even though billing is not live and the only real path in today is a tester code.
6. No sitewide "Beta" status indicator outside individual engine cards and the membership page.

## Critical problems found

1. **Messaging/reality mismatch**: homepage says the Engine Room is "Open to everyone"; the actual route gates to a signup/tester-code wall. (Fixed this session — copy corrected, gate behavior preserved.)
2. **Customer-visible price**: `$7.77 per month` rendered on `/membership` (headline price line, metadata description, and a dormant "Join — $7.77/month" checkout button) and referenced in `MEMBERSHIP_PRICE_LABEL`. Violates locked rule 1/2. (Fixed — now `TBD`.)
3. **Membership-first framing**: the gate gateway gate page leads with a paid-product identity rather than a beta-testing identity, working against "let people test the beta without being pushed into purchasing." (Softened this session: kicker/heading reordering, price → TBD, no new gating logic touched.)
4. **Third-party cost figures**: `app/creation/profile.ts` shows a domain-registrar cost estimate (`~$10–15/year`) in generated build guidance surfaced on the homepage result view. Not Step In The Ring's own price, but still a customer-visible dollar figure. Genericized this session to remove the literal amount.
5. No sitewide "Beta" badge in the nav/header — status is only visible on the membership page and individual engine cards.

## Corrected customer journey (target, matches locked doc)

1. Understand the promise — homepage hero states the primary promise + "Open beta" status plainly.
2. Choose what to make — starters/examples grid (already present, kept).
3. Understand what the engine produces — engine cards' "You finish with" line (already present).
4. Start the beta — primary CTA language changed to beta-oriented action (see below).
5. Build with a clear current step/next action — planner clarify→result flow and engine intake stages (already present, not rebuilt this session).
6. Save/continue/export/share — build-pack download, "Make it a project", account projects (already present).
7. Give structured tester feedback — **no dedicated feedback surface found this session**; deferred (see below).

## Proposed information architecture

No route invention. Existing structure is sound: `/` (free entry) → `/engines` (gated workspace) → `/account` + `/projects` (persistence). The fix is messaging/labeling consistency, not new routes:
- Homepage hero: promise + "Open beta" status + single primary action.
- Homepage Engine Room door card: honest copy (no "open to everyone" overstatement).
- `/membership`: reorder so beta participation (tester code / free idea capture) reads as primary, paid membership as secondary/future, price shown as `TBD`.
- Nav label for Engine Room carries a beta cue.

## Shared component opportunities

- `EngineCard` in `EngineSystem.tsx` already implements the target engine-entry pattern (status pill, outcome line, start/resume). Reused as-is.
- `OpenMirrorNav.tsx` / `OpenMirrorFooter.tsx` are canonical shared components synced from the hub repo via `sync-ui.sh` — left structurally untouched this session (per family standard); only the per-site `links` array passed from `app/layout.tsx` was edited.

## Pricing surfaces found

- `app/members/entitlement.ts` — `MEMBERSHIP_PRICE_LABEL` (was `"$7.77 per month"`, now `"TBD"`); `MEMBERSHIP_PRICE_CENTS = 777` left untouched (server-side dormant Stripe config, never rendered to a visitor).
- `app/membership/page.tsx` — headline price line + metadata description.
- `app/membership/MembershipClient.tsx` — dormant `"Join — $7.77 per month"` button, only rendered when `billingLive` is true (currently false; Stripe not configured — DJ owes Stripe test keys per prior session memory).
- `app/creation/profile.ts` — two domain-registrar cost mentions (`~$10–15/year`), genericized.
- No other customer-visible dollar amounts found in `app/**/*.tsx` outside test files, SQL placeholders (`$1, $2...`), and regex replacement strings (`$1`).

## Beta surfaces found

- `/membership` already says "Private beta" and explains tester-code access — kept, reframed.
- `EngineSystem.tsx` status pills already show "Beta" per engine — kept as-is.
- `app/account/AccountClient.tsx` mentions "private beta" for billing — kept.
- No sitewide beta badge existed in the header/nav before this session.
- **No structured tester-feedback surface found** (no feedback form, no feedback route, no feedback API). This is the one journey step (#7, "give structured tester feedback") with zero current implementation — flagged as the top deferred item.

## Work completed this session

- Full route + engine inventory (this doc).
- Pricing: `MEMBERSHIP_PRICE_LABEL` → `TBD`; membership page metadata description no longer states a price; dormant checkout button now reads `Join — TBD`; domain-cost figures genericized in `creation/profile.ts`; `membership.test.ts` price assertion updated.
- Regression guard: new test scanning customer-facing `app/**/*.tsx` (excluding tests/fixtures) for literal `$<digits>` price patterns.
- Homepage: corrected "Open to everyone" claim on the Engine Room door card; added Beta status to hero.
- Nav: Engine Room label carries a beta cue via `app/layout.tsx` links array (no shared-component edit).
- `/membership`: reordered so beta/tester-code participation reads first, price shown as TBD, "Membership" framing kept but secondary.

## Work explicitly deferred

Ranked by severity:
1. **Structured tester feedback surface** (journey step 7) — nothing exists. Needs its own design pass (route or in-app widget, storage decision) — out of scope for a shared-foundation session.
2. **Engine-by-engine internals** — individual engine studios (Story, Game, Music, etc.) not touched; only the shared card wrapper was reviewed.
3. **`/shop`, `/products`, `/five-hour-sprint-tool`, `/build`, `/how`, `/live`, `/account`, `/projects`** — not deep-audited for messaging/UX issues beyond the sitewide dollar-amount sweep; only confirmed no stray dollar amounts.
4. **Visual/UI consistency pass** (buttons, cards, forms, empty/loading/error states) — explicitly out of scope per stop conditions; homepage/engines/membership only verified functionally + at a glance.
5. **`/membership` full redesign** — deeper reframing (e.g., splitting into a dedicated `/beta` explainer vs. a pure future-pricing page) was considered but not done; today's fix is the safe, minimal correction within the existing test-locked structure.

## Exact next-session starting point

1. Read this file first.
2. `git log --oneline -3` to confirm the commit from this session landed as `feat: establish Step In The Ring beta foundation`.
3. Priority: design and build the structured tester-feedback surface (deferred item #1) — decide route vs. widget, storage (reuse `app/members/store.ts` patterns), and where it's linked from (account page, engine completion, membership page).
4. Then proceed engine-by-engine (Story Partner, Game Engine remain owner-only by design — confirm that's still intentional before changing).
5. Do not reopen the pricing/beta-foundation work unless a new dollar amount or misleading CTA is found by the regression test or a fresh audit.
