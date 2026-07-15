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
- **Routes:** `/` , `/build`, `/engines`, `/how`, `/live`, `/shop`
- **Family chrome:** `OpenMirrorNav.tsx` / `OpenMirrorFooter.tsx` / `OpenMirrorTheme.tsx` are synced copies — canonical source is the hub repo `packages/openmirror-ui/` + `scripts/sync-ui.sh`. Never edit the local copies.
- **Theme:** family ☀️/🌙 toggle; `om-theme` localStorage key; light mode remaps family hexes (see hub `docs/OPEN_MIRROR_PATTERNS.md`).
- **Persistence (localStorage):** `sitr-v2`, `sitr-build-seed`, `sitr-engine-access-v1`, `sitr-game-world-v1`, `creation-engine-projects-v1`
- **Env vars (names only):** `ETSY_SHOP_ID`, `OPENDOKU_REPO_PATH`
- **External services:** Game Engine publishes to the opendoku repo (`OPENDOKU_REPO_PATH`)
- **Protected:** creation/momentum identity ("AI in your corner"), the three haikus on the result page (verbatim, locked), Engine Room lives here — not on the hub.
- **Make changes in:** `app/page.tsx` (steps/examples), `app/engines/` (engine registry).
