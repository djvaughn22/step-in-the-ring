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
