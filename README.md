# step-in-the-ring

Turn any idea into a real first plan — with AI as your corner. Free to start.

**Live:** https://stepinthering.com
**Part of:** [Open Mirror LLC](https://openmirrorllc.com)

## Local dev
```bash
npm install
npm run dev
```

## Deploy
Push to `main` — Vercel auto-deploys production.

## Repo map

- **Production:** https://stepinthering.com — branch `main`, auto-deploys on push (Vercel).
- **Framework:** Next.js 16.2.9 (App Router). Build: `npm run build`. Tests: `npm test`.
- **Routes (checked 2026-09-30 against `app/**/page.tsx`):**
  - Public: `/`, `/build`, `/build-machine`, `/builds` (+ `/[id]`), `/create`, `/explore`, `/library`, `/engines`, `/how`, `/about`, `/shop`, `/five-hour-sprint-tool`, `/products/five-hour-sprint` (+ `/apply`), `/products/ready-to-build`, `/membership`, `/live`, `/preview`, `/everything`.
  - Members (session cookie, `middleware.ts`): `/members/login`, `/members/signup`, `/account`, `/projects`, `/api/members/*`.
  - Owner (`app/owner/gate.ts` `PROTECTED_PREFIXES`, `STORY_OWNER_PASSWORD` session): `/owner/*`, `/author`, `/engines/room`, `/api/owner/*`.
  - Digital Front Desk: **moved to iDontCry on 2026-09-30** (canonical: `https://idontcry.com/digital-front-desk`, repo `/home/dj/idontcry`). This repo's pages, API routes and in-memory store are removed; `next.config.ts` `DIGITAL_FRONT_DESK_REDIRECTS` sends every old `/uat/digital-front-desk/*` page there (307). **Production still runs the old open-UAT build (`ebb44f2`, owner tools open) until this change is deployed** — see the hub `docs/PORTFOLIO_INDEX.md` "Production actions". The env var `DIGITAL_FRONT_DESK_UAT_ENABLED` is no longer read here and can be removed from Vercel after deploy.
- **Family chrome:** `OpenMirrorNav.tsx` / `OpenMirrorFooter.tsx` / `OpenMirrorTheme.tsx` are synced copies — canonical source is the hub repo `packages/openmirror-ui/` + `scripts/sync-ui.sh`. Never edit the local copies. **Exception, unresolved:** this repo's `OpenMirrorTheme.tsx` is AHEAD of the hub (commits `6fd706c`, `964a2fc`: mobile dark-init fix and a Dark/Light/System control). Running the hub's `sync-ui.sh` would revert it, so upstream it into the hub first.
- **Theme:** family ☀️/🌙 toggle; `om-theme` localStorage key; light mode remaps family hexes (see hub `docs/OPEN_MIRROR_PATTERNS.md`).
- **Persistence (localStorage):** `sitr-v2`, `sitr-build-seed`, `sitr-engine-access-v1`, `sitr-game-world-v1`, `creation-engine-projects-v1`
- **Env vars (names only):** `ETSY_SHOP_ID`, `OPENDOKU_REPO_PATH`
- **External services:** Game Engine publishes to the opendoku repo (`OPENDOKU_REPO_PATH`)
- **Protected:** creation/momentum identity ("AI in your corner"), the three haikus on the result page (verbatim, locked), Engine Room lives here — not on the hub.
- **Portfolio map (all repos, domains, owner tools):** `/home/dj/OpenMirror/open-mirror/docs/PORTFOLIO_INDEX.md`.
- **Make changes in:** `app/page.tsx` (steps/examples), `app/engines/` (engine registry).
