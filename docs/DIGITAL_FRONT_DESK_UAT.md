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
/uat/digital-front-desk              Overview and links to the rest              — public
/uat/digital-front-desk/request      Customer intake form → confirmation         — public
/uat/digital-front-desk/onboarding   Onboarding/configuration preview            — owner-only
/uat/digital-front-desk/desk         Owner dashboard: requests by status         — owner-only
/uat/digital-front-desk/admin        Seed / reset / export, mocked-vs-real list  — owner-only
```

See "Access control" below for exactly what "public" and "owner-only" mean
here and how each is enforced.

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

## Access control

A Digital Front Desk that required a customer to sign in before submitting a
request would defeat its own purpose. The access model is split accordingly:

| Route | Access |
|---|---|
| `/uat/digital-front-desk` (overview) | **Public** — feature flag only |
| `/uat/digital-front-desk/request` (customer intake + confirmation) | **Public** — feature flag only |
| `POST /api/uat/digital-front-desk/requests` (submit a request) | **Public** — feature flag only |
| `GET /api/uat/digital-front-desk/requests` (the full queue) | **Owner-only** |
| `/uat/digital-front-desk/desk` + `PATCH .../requests/[id]` (status, assignment, notes, next action) | **Owner-only** |
| `/uat/digital-front-desk/onboarding` + its API | **Owner-only** |
| `/uat/digital-front-desk/admin` + its API | **Owner-only** |

"Public" here means gated by the feature flag alone (`dfdFlagGate()` in
`lib/apiGate.ts`) — never search-indexed, never linked from public
navigation, but reachable by anyone who has the URL, the way a real customer
reaches an intake form. It never means "authenticated with anything weaker";
there is no auth of any kind on these routes, by design, matching how a
production version would work.

"Owner-only" means the same signed cookie (`sitr-author-session`) used by
`/owner`, `/author`, and every other private room in this repo
(`app/owner/session.ts`, `app/owner/gate.ts`, `app/author/auth.ts`). Each
owner-only page checks `isOwnerAuthed()` itself and redirects a logged-out
visitor to `/owner?to=<page>`; each owner-only API route checks
`isOwnerRequest(req)` via `dfdOwnerGate()` and answers a generic `404`
otherwise — no distinct "wrong password" signal that would confirm the
route exists. `lib/apiGate.ts` deliberately exposes two differently-named
functions (`dfdFlagGate` vs. `dfdOwnerGate`) rather than one gate with a
boolean parameter, so a route picking the wrong one is a visible, named
mistake in a diff rather than a flipped default.

Two source-level test suites hold this split in place:
`app/uat/digital-front-desk/access-model.test.ts` asserts the public pages
and the intake API never reference the owner gate, and the owner-only
surfaces always do; `app/api/uat/digital-front-desk/digital-front-desk-access.test.ts`
exercises the real route handlers end to end (submit with no cookie, confirm
it's owner-visible, confirm every mutating/listing route 404s without a
cookie and succeeds with one).

Nothing here is guarded against spam or abuse beyond ordinary input
validation — there is no rate limiting on the public intake endpoint. That
is an accepted gap for this UAT, not an oversight; see "Not built yet"
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
- Public intake with no auth of any kind, and a real owner-session gate on
  every operational page and API route (see the access table above)
- The feature flag, `noindex`, and exclusion from public navigation

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
| Customer intake | Open (no auth of any kind) | Open (no auth of any kind) — same as iDontCry here |
| Owner/admin access | Deliberately open too — privacy came from the flag + `noindex` + no nav link only | **Real owner session required** — this is the actual difference |
| Persistence | Browser `localStorage` | Server-side, in-memory (see limits above) |
| Business templates | Two (one unused, to prove configurability) | One; the onboarding preview covers that job |
| Registered as pages | No site-wide page registry exists there | Every route is listed in `app/site/registry.ts` with the matching `access` value (`"public"` or `"owner"`), so a test (`registry.test.ts`) fails if any Digital Front Desk page is ever left unprotected, mislabeled, or orphaned |

An earlier pass of this port gated the ENTIRE feature — including customer
intake — behind the owner session, reasoning that this was still a private
walkthrough rather than a live product. That was corrected: a Digital Front
Desk that makes a customer sign in to submit a request isn't demonstrating
the product it claims to be. The split above is final for this UAT. If
either half ever needs to move (say, intake gets a CAPTCHA or rate limit
before going fully live), the registry's `access` value, the page's own
gate, and the API route's gate all need to change together — see
`registry.test.ts`'s "registry agrees with the real enforcement" tests and
`access-model.test.ts`, both of which fail loudly if any of the three drift
apart.

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

- [ ] `/uat/digital-front-desk` and `/uat/digital-front-desk/request` 404 with the flag unset
- [ ] With the flag set, a **logged-out** visitor can open the intake form and submit a valid request
- [ ] That visitor sees the confirmation page with a confirmation number — with no login at any point
- [ ] Intake form validates and rejects an incomplete submission with visible errors
- [ ] The submitted request is **not** visible to a logged-out visitor anywhere (no public listing/lookup route exists)
- [ ] After owner login, the same request appears on the owner's desk
- [ ] A logged-out visitor hitting `/uat/digital-front-desk/desk` or `/admin` is redirected to `/owner`, never shown the content
- [ ] `GET`/`PATCH` on the requests API, and both onboarding and admin APIs, 404 with no owner cookie
- [ ] Status, assignment, notes, and next-action changes persist and show on the timeline
- [ ] A completed/paid request offers the simulated review-request action
- [ ] Admin seed/reset/export work, and the stats tiles reflect the change
- [ ] With the flag off, **every** route 404s regardless of owner login — including the public intake POST
- [ ] Every route is `noindex, nofollow` and absent from the public nav bar and the Everything directory's public bands
- [ ] Public Step In The Ring pages are unchanged
