# Overnight product pass, 2026-11-18

SHIPPED to production as c4dcff7 (three commits on top of 606c5bc), Vercel
success, checked live on stepinthering.com. Rollback tag:
`live-before-overnight-20261118` (= 606c5bc). Resume from "Next steps" below;
do not restart the audit.

## What the audit found (first-time visitor, 375px phone)

- Website starter works end to end (choose, edit, preview, download).
- `/start` is 22 tall cards in one column on a phone (about 5,000px of
  scrolling) with no way to search by kind of work. Cards show three colour
  bars, not what the site looks like.
- The editor opens with the example's made-up name, (555) phone, example.com
  email and example booking link filled in. Nothing warns before download if
  they are still there, so a real owner can publish fake contact details.
- One draft per browser: trying a second example means replacing the first.
- After download there is no next step beyond optional paid help.
- Launch engine treats a local business website like an app launch ("10 people
  try it", "add a sign-up form", "first real users") and shows developer
  workflow (build cycles, push request) because it is flagged technical.
- Grow and Sell defaults are app/product shaped; local service businesses get
  software advice.
- Engines are not in the menu at all; the home page links them in one line.
- All 22 examples are service businesses; nothing for makers, creative
  freelancers, clubs or a family event, though `/start` tells hobby and club
  sites to "pick the closest one".

## Patterns borrowed (not copied)

- Category-first start: say your kind of work, see the closest examples.
- Template pickers with category filters and real thumbnails.
- A before/after-publish checklist next to the publish button.
- Local business launch basics: the same name, phone and hours on the site
  and the business listing; the site link in the listing and social bios.

## Plan and status

| # | Work | Status |
|---|---|---|
| 1 | `/start` finder (type your kind of work, group chips) + site sketches on cards | done |
| 2 | New examples: makers, creative freelancers, groups, one family event (29 total) | done |
| 3 | Editor: Check tab, example values marked (tap selects), step 3 | done |
| 4 | Several drafts per browser, with migration from the single draft | done |
| 5 | After download: launch handoff; README before/after publishing | done |
| 6 | Launch/Grow/Sell: local business paths; real-world kits hide build steps | done |
| 7 | Home: more-to-make doors; Engines in the More menu | done |
| 8 | Make with AI: business-site ideas are offered the starter | done |
| 9 | Tests (1,672), lint, typecheck, build, browser checks, deploy | done |

## Assumptions

- Prices stay off the home page and the starter until there is a draft
  (owner rule, Nov 12). Services keeps its existing provisional prices; no new
  offers.
- New examples follow the same rules as the 22: fictional, 555-01xx numbers,
  example.com, no credentials, reviews, prices or guarantees.
- The site still runs no AI.

## Key files

- Finder: `app/starter/finder.ts`, `ExampleFinder.tsx`, `ExampleCards.tsx`, `MiniSite.tsx`
- Drafts: `app/starter/drafts.ts` (key `sitr-site-drafts-v1`; moves the old
  `sitr-site-draft-v1` in once), `ContinueDraft.tsx`
- Check: `app/starter/check.ts` (fix vs look), README in `zip.ts`
- Editor: `app/starter/StarterEditor.tsx` (Check tab, drafts panel, launch handoff
  via `sitr-engine-seed`, never the URL)
- Engines: `app/engines/artifacts/market.ts` (`isLocal`, `localLaunch`, local grow
  plays, service pricing), `realWorld` on `EngineArtifact`, `tech` in
  `EngineSystem.tsx` CycleView
- Make with AI: `app/starter/fit.ts` + one card in `app/vnext/SteppedIn.tsx`
- Tests: `app/starter/drafts.test.ts` (finder, drafts, check, fit),
  `app/starter/starter.test.ts`, `app/engines/artifacts/artifacts.test.ts`

## Rollback note

Rolling back past this work hides drafts that were moved to the new storage key
until it is deployed again (the old code only reads `sitr-site-draft-v1`). The
drafts stay in the browser; nothing is deleted.

## Next steps

1. Owner review on the live site: the finder, the Check tab, drafts, the new
   examples (especially the family reunion and the club), the local launch kit.
2. Real photos for the examples (licensed or the owner's own) remain the
   biggest visual gap; the sketches and shaded photo spots are honest stand-ins.
3. Multi-page sites only if publish-help requests ask for them.
4. Measure time to a first useful draft before making any time claim.
