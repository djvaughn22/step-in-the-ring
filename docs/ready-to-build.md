# Ready to Build

Public landing page: `/products/ready-to-build`. Discovery: homepage product
section, Library, and the registry-backed Everything directory. Existing
creation flows and shared family chrome stay intact.

## Release state

This is the founding-release landing experience, not the downloadable kit.
Planned contents and the one-day goal are labeled explicitly. Repairs, setup,
and more complex apps can take longer.

The existing Stripe checkout is a membership flow; there is no configured
one-time Ready to Build product. The existing signup requires a private tester
password. Neither is presented as a public product purchase or waitlist.

“Join the first build” opens a prefilled email to the existing public contact,
`ask@openmirrorllc.com`. The visitor must send it; the page does not submit,
store, or claim successful enrollment. The contact remains visible for users
without a configured mail application. The free Build Machine is also linked.

Before selling the kit:

- Finish and review the kit and its Windows, Mac, and Linux instructions.
- Confirm the release date and one-time price.
- Configure a separate product checkout and verified payment/delivery flow.
- Replace the email request with public signup only when that flow exists.

No subscription is attached to this product. Additional tools and hosting may
have separate costs. Future challenges, templates, and community are optional.

## Verification

`npm test`, `npm run lint`, `npm run typecheck`, and `npm run build` (including
the public-bundle scan). Focused tests cover route registration, metadata,
anchor destinations, early-access truthfulness, kit contents, and FAQ markup.

Browser review covers mobile, tablet, desktop, dark/light appearance, anchor
positions below the header, keyboard FAQ operation, image loading, overflow,
and discovery links. There was no existing browser test runner in this repo.

Deploy through the established workflow: commit and push `main`; Vercel
builds production. Verify the public route after the deployment completes.

## Computer-first introduction

The page now explains Check → Protect → Rebuild → Prepare → Build → Go live
before presenting a small, client-side first step. Windows, Mac, and Linux
choices reveal read-only guidance for finding system details. “I’m not sure”
provides identification clues and returns to the choices. Native buttons and
managed heading/return focus support keyboard and screen-reader use.

The continuation explains backups and explicitly says that compatibility has
not been confirmed. No hardware scan, supported-tools verdict, data storage,
or completed diagnostic is implied. The full readiness check remains future
work. The existing Build Machine link is labeled as a Linux tool because its
assessment covers a specific Linux setup, not every computer.

Repeatable browser checks live in `scripts/check-ready-to-build.mjs`. Run with
a production server on port 3001 and Playwright available, or set
`PLAYWRIGHT_MODULE` to an existing Playwright `index.mjs`. `CHROME_PATH` can
select a locally installed Chrome. `BASE_URL` selects production or another
local server; `SCREENSHOTS_DIR` selects the screenshot directory.

```sh
node scripts/check-ready-to-build.mjs
```

Checks cover 320px, 768px, and 1440px in both themes, every computer path,
keyboard activation and focus restoration, touch targets, contrast, overflow,
anchor positions, FAQ operation, and discovery links. No form is submitted.

## Real-project evidence

After the six-step explanation and computer check, before the kit contents,
`RealProjects.tsx` explains AI-assisted development versus runtime AI costs.
Four project cards use read-only source inspection and AI-co-authored Git
history; see [the evidence record](ready-to-build-project-evidence.md).

Cards explicitly preserve optional AI features, conditional providers, and
source limitations. The browser suite checks the cards in both themes at all
three widths, keyboard focus, and the four live project destinations.
