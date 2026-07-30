# The Shared Owner Boundary

One owner session protects every private Step In The Ring surface. This
extends the Author's Room authentication (see `AUTHOR-ROOM-PRIVATE.md`, which
remains the deep reference for the auth primitives and threat model).

## What is public / what is private

| Surface | Access |
| --- | --- |
| `/` (planner), `/about`, `/how`, `/live`, `/shop`, `/build` | Public |
| `/owner` | Public login shell; hub content requires the owner session |
| `/author`, `/engines`, `/projects` | Owner-only, checked server-side |
| `/api/author/login`, `/api/author/logout` | Public endpoints, generic replies |
| `/api/engines/games/publish` | Owner-only, session checked before body parsing |

## How it works

- **One session.** `app/author/auth.ts` is the single primitive layer:
  `STORY_OWNER_PASSWORD` env var, timing-safe verify, HMAC-signed session in
  the `sitr-author-session` cookie (HttpOnly, Secure in production,
  SameSite=Strict, path `/`, 30 days). Logging in at `/owner` or `/author` is
  the same session; one logout ends access everywhere. Rotating the password
  invalidates every outstanding session — rotation is an env-var change plus
  redeploy, no source change.
- **Shared checks.** `app/owner/gate.ts` (pure, tested) +
  `app/owner/session.ts` (`isOwnerAuthed()` for pages, `isOwnerRequest(req)`
  for API routes). Private pages are `force-dynamic`, check the session on the
  server before rendering any private UI, and redirect logged-out visitors to
  `/owner?to=<destination>`.
- **Return-to.** `safeReturnTo` allows only same-site paths under
  `/owner|/author|/engines|/projects` (query preserved, so engine handoffs
  survive the login detour); everything else falls back to `/owner`. The login
  page cannot be used as an open redirect.
- **Caching/indexing.** Every private route sends `Cache-Control: no-store,
  private` and `X-Robots-Tag: noindex, nofollow` (next.config.ts), sets robots
  noindex metadata, and is disallowed in robots.txt. There is no sitemap.
- **Build scan.** `scripts/scan-public-bundles.mjs` runs on every build
  (postbuild, locally and on Vercel) and fails the build if secret env-var
  names, auth HMAC salts, live secret values, or the removed access-gate
  markers appear in public client bundles.

## What changed away

The old client-side Engine Room "courtesy gate" (`AccessGate.tsx` /
`access.ts`) shipped its access codes in the public JavaScript bundle and is
deleted. A source-hygiene test pins that it stays deleted and that no
`"use client"` file imports the server auth modules.

## Honest residual exposure

- **Engine client code ships publicly.** The engines are local-first by
  design: intake questions, package templates, scoring rules, and studio
  logic execute in the browser, so that JavaScript exists in public
  `/_next/static` chunks even though the pages that use it are gated. The
  owner gate protects the workspaces, saved data, and the publish pipeline —
  it does not make shipped algorithm code secret. Anything that must become
  genuinely secret has to move behind a server endpoint in a future pass.
- **The vault export filename prefix** (`PRIVATE-SOURCE-IDENTITY-VAULT`)
  appears in a client chunk because backups are generated in the browser.
  It is a constant, not data.
- **The owner's private data never touches this server.** Manuscripts,
  memories, source identities, and vaults stay in the owner's browser
  (IndexedDB / encrypted vault). This security pass did not add any upload
  path, deliberately.
- **Password strength is the env var's job.** The code accepts any password
  of 4+ characters; a short numeric password remains weak regardless of this
  architecture. Use a long unique passphrase.
