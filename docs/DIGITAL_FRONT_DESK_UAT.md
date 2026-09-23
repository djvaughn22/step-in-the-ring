# Digital Front Desk — UAT (Step In The Ring)

Ported from the iDontCry repository's Digital Front Desk UAT and rebuilt
natively for this repo's architecture. If you're comparing the two: the
product idea, data model, and workflows are the same; the security model,
persistence, and file layout are not — see "How this differs from the
iDontCry version" below.

**Core promise:** Every request reaches the right person, every handoff has
an owner, and nothing important quietly disappears.

This is not a chatbot, a website builder, or a speculative mockup. It
demonstrates a complete operational workflow — intake, assignment, status,
notes, next action, simulated customer contact, completion, and a review
request — for a small business, built from real front-desk and operations
experience.

## Route structure

All routes live under `/uat/digital-front-desk` and are excluded from
public navigation:

```
/uat/digital-front-desk              Overview and links to the rest              — public, always
/uat/digital-front-desk/request      Customer intake form → confirmation         — public, always
/uat/digital-front-desk/onboarding   Onboarding/configuration preview            — owner-only by design; TEMPORARILY OPEN
/uat/digital-front-desk/desk         Owner dashboard: requests by status         — owner-only by design; TEMPORARILY OPEN
/uat/digital-front-desk/admin        Seed / reset / export, mocked-vs-real list  — owner-only by design; TEMPORARILY OPEN
```

See "Open UAT mode" and "Access control" below for exactly what each of
those means and how it's enforced.

Every page and API route carries `robots: noindex, nofollow`.

## Feature flag

**`DIGITAL_FRONT_DESK_UAT_ENABLED`** — server-only, no `NEXT_PUBLIC_` prefix.
Checked in `app/uat/digital-front-desk/layout.tsx` (pages) and
`app/uat/digital-front-desk/lib/apiGate.ts` (API routes). Anything less than
exactly `"true"` and the entire tree 404s — pages via `notFound()`, API
routes via a `404` JSON response, matching how the rest of this repo fails
closed on an unset flag.

Set it in `.env.local` for local development:

```
DIGITAL_FRONT_DESK_UAT_ENABLED=true
```

## Open UAT mode — read this first

**Current state: ON.** `DFD_OPEN_UAT_MODE` in
`app/uat/digital-front-desk/lib/openMode.ts` is `true`. While it is, the
owner-only surfaces below (desk, onboarding, admin — pages **and** their API
routes) are reachable by anyone with the URL, no sign-in at all. This is a
deliberate, reviewed decision for an early UAT/showing-around period, not a
permanent change of the security model, and it is scoped to Digital Front
Desk only — `/owner`, `/author`, `/projects`, `/engines/room`, and every
other private room in this repo are completely unaffected.

**What stays true regardless of this toggle:**
- `DIGITAL_FRONT_DESK_UAT_ENABLED` is still the master kill switch. Off, and
  every DFD route 404s — open mode or not.
- `isOwnerAuthed()` / `isOwnerRequest()` and `dfdOwnerGate()` are all still
  present, correct, and called. Open mode short-circuits them; it does not
  delete or bypass their implementation. Each owner-only page still contains
  the exact `if (!DFD_OPEN_UAT_MODE && !(await isOwnerAuthed())) redirect(...)`
  shape, and `dfdOwnerGate(req, openMode)` still runs the real
  `isOwnerRequest()` check whenever `openMode` is `false` — proven directly
  by `app/api/uat/digital-front-desk/digital-front-desk-access.test.ts`'s
  "the underlying owner check is intact" suite, which calls the gate with
  `openMode: false` and confirms it still denies a missing/tampered cookie
  and admits a valid one.
- Every noindex tag, the absence from public navigation, and every
  demo-only/temporary-storage disclosure stay exactly as described below.

**What is different while this is on, stated plainly:**
- Anyone who finds the URL can read, assign, change the status of, and add
  notes to every request in the demo store. There is no privacy boundary
  between different visitors' requests.
- Anyone who finds the URL can seed, export, or wipe the entire demo store
  from Admin.
- The registry (`app/site/registry.ts`) reports `access: "public"` for
  desk/onboarding/admin while this is on — keyed off the same
  `DFD_OPEN_UAT_MODE` constant, so the public-facing description can never
  silently drift from what the code actually enforces in either direction.

**To restore the owner gate:** flip `DFD_OPEN_UAT_MODE` to `false` in
`app/uat/digital-front-desk/lib/openMode.ts` and redeploy. That is the ONE
controlled change — every page, every API route, and the registry's public
description of them all flip back together, because they all read the same
constant. No other file needs to change.

## Access control

Independent of open-UAT mode, the code draws a permanent, two-tier
distinction — this is what open mode temporarily suspends for one tier:

| Route | Design intent | Right now |
|---|---|---|
| `/uat/digital-front-desk` (overview) | **Public, always** — feature flag only | Public |
| `/uat/digital-front-desk/request` (customer intake + confirmation) | **Public, always** — feature flag only | Public |
| `POST /api/uat/digital-front-desk/requests` (submit a request) | **Public, always** — feature flag only | Public |
| `GET /api/uat/digital-front-desk/requests` (the full queue) | **Owner-only** | Open (see above) |
| `/uat/digital-front-desk/desk` + `PATCH .../requests/[id]` | **Owner-only** | Open (see above) |
| `/uat/digital-front-desk/onboarding` + its API | **Owner-only** | Open (see above) |
| `/uat/digital-front-desk/admin` + its API | **Owner-only** | Open (see above) |

A Digital Front Desk that required a customer to sign in before submitting a
request would defeat its own purpose — that top tier is public in every
configuration, forever, and always has been. "Public" here means gated by
the feature flag alone (`dfdFlagGate()` in `lib/apiGate.ts`); it never means
"authenticated with anything weaker" — there is no auth of any kind on these
routes, by design, matching how a production version would work.

"Owner-only" (by design) means the same signed cookie (`sitr-author-session`)
used by `/owner`, `/author`, and every other private room in this repo
(`app/owner/session.ts`, `app/owner/gate.ts`, `app/author/auth.ts`). Normally,
each such page checks `isOwnerAuthed()` and redirects a logged-out visitor to
`/owner?to=<page>`; each such API route checks `isOwnerRequest(req)` via
`dfdOwnerGate()` and answers a generic `404` otherwise — no distinct "wrong
password" signal that would confirm the route exists. `lib/apiGate.ts`
deliberately exposes two differently-named functions (`dfdFlagGate` vs.
`dfdOwnerGate`) rather than one gate with a boolean parameter, so a route
picking the wrong one is a visible, named mistake in a diff rather than a
flipped default.

Three source-level/functional test suites hold all of this in place:
`app/uat/digital-front-desk/access-model.test.ts` (the public pages never
reference the owner gate; the owner-only pages still carry the real
`isOwnerAuthed`-and-redirect shape in source, guarded by
`DFD_OPEN_UAT_MODE`); `app/api/uat/digital-front-desk/digital-front-desk-access.test.ts`
(the real route handlers, both the current open behavior AND the underlying
gate logic exercised directly with `openMode: false`); and `registry.test.ts`
(the registry's public `access` value agrees with each page's own
enforcement).

Nothing here is guarded against spam or abuse beyond ordinary input
validation — there is no rate limiting on the public intake endpoint, and
while open mode is on, no rate limiting on Admin's seed/reset/export either.
That is an accepted gap for this UAT, not an oversight; see "Not built yet"
below.

## Data model

Types live in `app/uat/digital-front-desk/lib/types.ts`. Summary:

- **`CustomerRequest`** — the core record: contact info, service/area,
  description, urgency, status (`PipelineStage`), assignment, next action +
  due date, internal notes, an append-only `events` audit trail, and a
  human-readable confirmation number (`DFD-XXXXXX-XXXXXX`).
- **`PipelineStage`** — `new → contacted → quoted → scheduled → in_progress
  → completed → paid`.
- **`FrontDeskEvent`** — a typed union covering every action the dashboard
  can take (assign, status change, next-action set, note added, simulated
  customer update, simulated review request, completed). Nothing is ever
  removed from a request's `events` array.
- **`OnboardingApplication`** — the lead captured by the onboarding preview.

The one fictional demo business, "ClearPath Property Services," lives in
`app/uat/digital-front-desk/lib/business.ts`. (The iDontCry version shipped
a second, unused "Build Machine" template purely to prove the model was
configurable — dropped here; the onboarding preview already demonstrates
that a different business's plan/name/email can be captured, without
carrying a second unused shape through every function.)

## Persistence

**A server-side, in-memory store** (`app/uat/digital-front-desk/lib/store.ts`),
not a database.

This is a deliberate improvement over the iDontCry version's `localStorage`:
localStorage is per-browser, so "submit a request on your phone, see it land
on the owner's dashboard on your laptop" — the actual handoff this product
demonstrates — could never be shown there. A shared server-side store can
show that, even though it is not durable.

**Honest limit, stated plainly:** this store is a module-level `Map`. It
resets whenever the server process restarts, and on a serverless deployment
different requests can land on different warm instances that never share
memory — so what the dashboard shows can vary between requests in
production. It is not, and must never be described as, real persistence.

Moving to durable storage later means swapping this module for one backed by
`app/members/store.ts`'s `MemberStore` (Postgres via `DATABASE_URL`) — the
same seam that file already documents for member data — without changing
any route or component.

## What's implemented vs. mocked

The same list appears in the Admin panel itself, so it's never more than one
click from view.

**Real:**
- Intake validation (every rule has a matching visible error — see
  `validateIntake` in `lib/domain.ts`)
- Server-side request storage, readable from any device during the session
- Status changes, assignment, internal notes, next-action + due date
- The append-only audit timeline
- Public intake with no auth of any kind — permanent, by design
- The feature flag, `noindex`, and exclusion from public navigation

**Temporarily open, not removed:**
- The owner-session gate on the desk, onboarding, and admin — see "Open UAT
  mode" above. The gate's code is real and tested; it's switched off by one
  named constant for this early UAT period.

**Mocked:**
- Customer email/SMS updates and review requests: logging a
  `customer_update_sent` / `review_requested` event — no message is
  actually sent. Every label calling these out says "simulated."
- Scheduling: a plain date field, not a calendar integration.

**Not built yet:**
- A real database (see persistence limits above)
- Rate limiting or spam protection on the public intake endpoint
- Payments
- File/photo uploads
- Multi-business or multi-team support
- A full onboarding flow — the onboarding page is a lead-capture preview
  only; it does not provision an account or a live business configuration

## How this differs from the iDontCry version

| | iDontCry | Step In The Ring |
|---|---|---|
| Customer intake | Open (no auth of any kind) | Open (no auth of any kind) — same as iDontCry here, permanently |
| Owner/admin access, by design | Deliberately open too — privacy came from the flag + `noindex` + no nav link only | **Real owner session required** by design — but see "Open UAT mode" above: temporarily suspended |
| Persistence | Browser `localStorage` | Server-side, in-memory (see limits above) |
| Business templates | Two (one unused, to prove configurability) | One; the onboarding preview covers that job |
| Registered as pages | No site-wide page registry exists there | Every route is listed in `app/site/registry.ts` with the matching `access` value (`"public"` or `"owner"`, live-updated by `DFD_OPEN_UAT_MODE`), so a test (`registry.test.ts`) fails if any Digital Front Desk page is ever left unprotected, mislabeled, or orphaned |

This access model has gone through three passes, in this order — worth
knowing if you're reading old commits or old versions of this doc:
1. Gate the ENTIRE feature, including customer intake, behind the owner
   session — reasoning it was still a private walkthrough. Corrected: a
   Digital Front Desk that makes a customer sign in to submit a request
   isn't demonstrating the product it claims to be.
2. Split it: intake public, everything operational (desk/onboarding/admin)
   owner-only — the permanent design intent described in "Access control"
   above.
3. **Current:** keep that same permanent design in the code, but add
   `DFD_OPEN_UAT_MODE` to temporarily suspend the owner-only half for an
   early showing-around period, restorable with one constant flip — see
   "Open UAT mode" above.

If the *permanent* design itself ever needs to change (say, intake gets a
CAPTCHA or rate limit before going fully live), the registry's `access`
value, the page's own gate, and the API route's gate all need to change
together — see `registry.test.ts`'s "registry agrees with the real
enforcement" tests and `access-model.test.ts`, both of which fail loudly if
any of the three drift apart.

## Testing

```
npm test              # unit tests, including:
                       #   app/uat/digital-front-desk/lib/domain.test.ts
                       #   app/uat/digital-front-desk/access-model.test.ts
                       #   app/api/uat/digital-front-desk/digital-front-desk-access.test.ts
npm run typecheck
npm run lint
npm run build          # also runs scripts/scan-public-bundles.mjs (postbuild)
```

## Verification checklist

With `DFD_OPEN_UAT_MODE = true` (current state):

- [ ] `/uat/digital-front-desk` and `/uat/digital-front-desk/request` 404 with the flag unset
- [ ] With the flag set, a **logged-out** visitor can open the intake form and submit a valid request
- [ ] That visitor sees the confirmation page with a confirmation number — with no login at any point
- [ ] Intake form validates and rejects an incomplete submission with visible errors
- [ ] A logged-out visitor can open `/desk`, `/onboarding`, and `/admin` directly — each shows the open-UAT banner
- [ ] The submitted request appears on the desk with no login required
- [ ] Status, assignment, notes, and next-action changes work with no login required
- [ ] Admin seed/reset/export work with no login required, and the stats tiles reflect the change
- [ ] `GET`/`PATCH` on the requests API, and both onboarding and admin APIs, succeed with no owner cookie
- [ ] With the flag off, **every** route still 404s regardless — including the public intake POST and every open-mode route
- [ ] Every route is `noindex, nofollow` and absent from the public nav bar and the Everything directory's public bands
- [ ] Public Step In The Ring pages are unchanged

To confirm the gate is really just switched off, not gone (no production
password needed for this — it's a source-level/unit check):

- [ ] `access-model.test.ts` passes — the owner-checking shape is still present in each owner-only page's source
- [ ] `digital-front-desk-access.test.ts`'s "the underlying owner check is intact" suite passes — `dfdOwnerGate(req, false)` still denies a missing/tampered cookie and admits a valid one

After flipping `DFD_OPEN_UAT_MODE` back to `false` (restoring the gate),
re-run this checklist expecting the pre-open-mode behavior: logged-out
visitors redirected/404'd on desk/onboarding/admin, and only a real owner
session getting through.
