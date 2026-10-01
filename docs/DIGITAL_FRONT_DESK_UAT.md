# Digital Front Desk — moved to iDontCry

**As of 2026-09-30 the Digital Front Desk lives in iDontCry Dream Labs**, not here.

- Canonical product: `https://idontcry.com/digital-front-desk` (repo `djvaughn22/idontcry`, `src/app/digital-front-desk`,
  `src/app/api/digital-front-desk`, `src/lib/digitalFrontDesk`). Its doc is `DIGITAL_FRONT_DESK_UAT.md` in that repo.
- Public there: the overview and the customer request form. Owner-only there: the desk, onboarding leads, admin
  (seed/export/reset) and every API behind them, behind `DFD_UAT_OWNER_SECRET`. There is no open-UAT bypass.
- In this repo: every page under `/uat/digital-front-desk` redirects (307) to the matching iDontCry page from
  `next.config.ts` (`DIGITAL_FRONT_DESK_REDIRECTS`). The `/api/uat/digital-front-desk/*` routes and the in-memory
  store are removed, so nothing on Step In The Ring stores or returns front-desk requests.
- Why it moved: the owner decided the product belongs with iDontCry's family/Dream Labs experiments. SITR's
  version (server store, owner gate, tests) was the more complete one and became the base of the iDontCry version.
- History: the full SITR implementation is in git at `84190f2` (built) and `ebb44f2` (temporary open-UAT mode,
  which left the desk, admin and request list reachable without sign-in in production).
