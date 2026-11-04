# Ready to Build

Public landing page: `/products/ready-to-build`. Discovery: homepage product
section, Library, and the registry-backed Everything directory. Existing
creation flows and shared family chrome stay intact.

## Release state

The page is the open guide, plus the Ready to Build Kit offer once the owner
opens sales. While `SITR_KIT_SALES` is anything but `open`, the page shows no
price, no buy button and no kit questions — exactly the guide.

## The Ready to Build Kit (one-time purchase)

**What the buyer gets**

1. The workbook: a 20-page printable PDF (`KIT_CONTENTS` in `app/kit/kit.ts`
   lists every section and must match the file).
2. Their kit page, `/kit`: download the newest version any time, the six steps
   with links to the matching pages here, ticks saved in the browser, and
   their personal kit link.
3. Updates to the kit, at no extra cost.

"Access to the site" means that kit page. Every tool and guide on the site
stays open to everyone; buying the kit locks or unlocks nothing else.

**How it works** (no account, nothing stored by the site)

- Buy button = plain form POST to `/api/kit/checkout` → Stripe Checkout in
  `payment` mode, card only, one line item, no promotion codes. Checkout
  refuses to start if the Stripe price is recurring, inactive, not USD, or not
  exactly `KIT_PRICE_CENTS`, or if no kit file is uploaded.
- Stripe returns the buyer to `/kit/open?session_id=…`. That route asks Stripe
  whether the session was paid for this product (metadata `product`) and not
  refunded or disputed, then sets the `sitr-kit` cookie (HttpOnly, path `/kit`,
  one year) and lands on `/kit`. The same URL is the buyer's kit link for any
  device.
- `/kit` and `/kit/download` re-check with Stripe on every visit, so a refund
  closes access immediately. The PDF streams from Postgres (`sitr_kit_files`,
  `migrations/005_kit_files.sql`), never from Git or `/public`.
- Lost link: the buyer emails ask@openmirrorllc.com from the address they paid
  with. Find the payment in the Stripe Dashboard, copy its Checkout Session id
  (`cs_live_…`), and send `https://stepinthering.com/kit/open?session_id=<id>`.
- No webhook is needed: nothing is stored, so there is nothing to fulfil
  later. An emailed kit link (receipt with link, self-serve "find my kit")
  would need a webhook plus a sender on a Step In The Ring domain; it is the
  natural next step, not built.

**Owner setup before opening sales** (in this order)

1. Read the workbook (`private/ready-to-build-kit/`, git-ignored) and approve
   it, the price (`KIT_PRICE_CENTS`) and the refund window
   (`KIT_REFUND_DAYS`).
2. Upload the PDF: `vercel env pull .env.production.local --environment=production`,
   then `node --env-file=.env.production.local scripts/upload-kit-file.mjs
   private/ready-to-build-kit/Ready-to-Build-Kit-v1.0.pdf 1.0`. Delete
   `.env.production.local` afterwards.
3. Stripe: a Product "Ready to Build Kit" with a one-time USD Price equal to
   `KIT_PRICE_CENTS`. Turn on email receipts for successful payments. Decide
   how sales tax and VAT will be handled (Stripe Tax, or limit where you sell).
4. Vercel env (Production): `STRIPE_SECRET_KEY`, `STRIPE_KIT_PRICE_ID`
   (`MEMBER_APP_URL` already exists). Test with test-mode keys on a Preview
   deployment first: buy with card 4242 4242 4242 4242, download, open the kit
   link in another browser, refund in the Dashboard, confirm `/kit` closes.
5. Switch to live keys, set `SITR_KIT_SALES=open`, redeploy, and buy once for
   real (then refund it) before telling anyone.

To close sales again, remove `SITR_KIT_SALES` and redeploy. Existing buyers
keep their kit as long as `STRIPE_SECRET_KEY` stays set.

**Updating the kit**: edit `private/ready-to-build-kit/kit.html`, run its
`build-pdf.sh <version>`, upload with the script above, and update
`KIT_PAGE_COUNT`/`KIT_CONTENTS` if they changed. The newest upload is what
every buyer downloads.

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

## Owner’s Builds showroom

The public `/builds` route now leads with the Owner’s Builds showroom and keeps
the existing signed-in personal workspace below it. The showroom registry is
`app/builds/owner-builds.ts`; every entry has a verified live or internal
destination, category, lesson, and status. Featured cards, category filters,
and the Ready to Build / creation CTAs are rendered by
`OwnerBuildsShowroom.tsx`. No sibling repository was edited.
