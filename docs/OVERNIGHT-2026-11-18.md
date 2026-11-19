# Overnight product pass, 2026-11-18 (checkpoint)

Branch: `overnight-2026-11-18` (from main 606c5bc). Production is untouched until
the branch is verified and merged. If this session stops early, resume from
"Next steps" below; do not restart the audit.

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
| 1 | `/start` finder (type your kind of work, group chips) + mini site previews on cards | in progress |
| 2 | New examples: makers, creative freelancers, groups, one family event | pending |
| 3 | Editor: "Check before you download" list, example-value flags, step 3 | pending |
| 4 | Several drafts per browser, with migration from the single draft | pending |
| 5 | After download: launch handoff, publish guide in README | pending |
| 6 | Launch/Grow/Sell: local business paths; Launch not "technical" | pending |
| 7 | Home: more-to-make doors; Engines in the More menu | pending |
| 8 | Tests, lint, typecheck, build, browser checks, deploy | pending |

## Assumptions

- Prices stay off the home page and the starter until there is a draft
  (owner rule, Nov 12). Services keeps its existing provisional prices; no new
  offers.
- New examples follow the same rules as the 22: fictional, 555-01xx numbers,
  example.com, no credentials, reviews, prices or guarantees.
- The site still runs no AI.

## Next steps

(updated as work lands)
