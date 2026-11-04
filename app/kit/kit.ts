// ─────────────────────────────────────────────────────────────────────────────
// THE READY TO BUILD KIT — the one thing this site sells.
//
// One product, one price, paid once (test-locked in kit.test.ts):
//   - no subscription, no tiers, no add-ons, no promotion codes
//   - the tools on this site stay open to everyone; buying the kit locks or
//     unlocks nothing that was open before
//   - the PDF never lives in this repository or in /public. It is stored
//     privately (kitFile.ts) and served only after Stripe confirms the payment
//
// Sales stay closed until the owner sets SITR_KIT_SALES=open after Stripe and
// the kit file are set up (docs/ready-to-build.md has the checklist). While
// closed, the product page is the open guide and nothing mentions a price.
//
// This file is public source and ships in the bundle: no secrets, no paths.
// ─────────────────────────────────────────────────────────────────────────────

export const KIT_ID = "ready-to-build-kit";
export const KIT_NAME = "Ready to Build Kit";

/** One payment in US cents. The Stripe price must match it exactly, or
 *  checkout refuses to start (kitStripe.ts). */
export const KIT_PRICE_CENTS = 1900;
export const KIT_CURRENCY = "usd";

/** Pages in the current PDF. Update with each new version of the file. */
export const KIT_PAGE_COUNT = 20;

export const KIT_REFUND_DAYS = 30;
export const KIT_CONTACT_EMAIL = "ask@openmirrorllc.com";

export function kitPrice(): string {
  const dollars = KIT_PRICE_CENTS / 100;
  return `$${Number.isInteger(dollars) ? dollars : dollars.toFixed(2)}`;
}

/** What is inside the PDF, in order. Must match the file buyers download. */
export const KIT_CONTENTS: { title: string; what: string }[] = [
  { title: "The whole path on one page", what: "Check, protect, rebuild, prepare, build, go live, and a place to mark where you are." },
  { title: "Computer check worksheet", what: "Where to click on Windows, Mac and Linux to find your system, memory and storage, and what the numbers mean." },
  { title: "Backup checklist", what: "What to copy, where to keep it, and how to make sure the copy opens before you change anything." },
  { title: "Keep, clean up or rebuild", what: "One page to decide what to do with the old setup, including when to stop." },
  { title: "Setup checklists for Windows, Mac and Linux", what: "A code editor, Git, Node.js, a GitHub account and a coding tool you choose, each with a check that it works." },
  { title: "First-version worksheet", what: "Sort your idea into now, later and never, then fill in a one-page plan." },
  { title: "The build loop and prompts", what: "Small steps: ask, read, test, save. Plain prompts to give your coding tool, and a page for when something breaks." },
  { title: "Go-live checklist", what: "Put it online, test it on a phone, check links and privacy, keep a copy, and give people a way to reach you." },
  { title: "Show one person", what: "A short script, a message to send with your link, and space to write down what happened." },
  { title: "Progress tracker and notes", what: "Tick off each step and keep your notes in one place." },
];

/** The kit page walks the same six steps, each pointing at the matching
 *  pages on this site. Every href must be a public page (kit.test.ts). */
export const KIT_STEPS: { id: string; title: string; what: string; tools: { label: string; href: string }[] }[] = [
  {
    id: "check",
    title: "Check it",
    what: "Find out what computer you have and whether it is a good candidate.",
    tools: [{ label: "Computer check", href: "/products/ready-to-build#computer-check" }],
  },
  {
    id: "protect",
    title: "Protect it",
    what: "Back up everything that matters and make sure the copy opens.",
    tools: [{ label: "Build Machine guide: back up first", href: "/build-machine" }],
  },
  {
    id: "rebuild",
    title: "Rebuild it",
    what: "Keep it, clean it up, or install a better-supported system.",
    tools: [{ label: "Build Machine guide", href: "/build-machine" }],
  },
  {
    id: "prepare",
    title: "Prepare it",
    what: "Install the editor, Git and Node.js, and check each one works.",
    tools: [{ label: "The software playbook", href: "/how" }],
  },
  {
    id: "build",
    title: "Build it",
    what: "Cut the idea to a first version, then make it in small steps.",
    tools: [
      { label: "First version cutter", href: "/tools/first-version" },
      { label: "Your first build, step by step", href: "/build" },
    ],
  },
  {
    id: "live",
    title: "Go live",
    what: "Put it online, run the checks, and show one real person.",
    tools: [
      { label: "Launch checklist", href: "/tools/launch-checklist" },
      { label: "One-line explainer", href: "/tools/one-liner" },
      { label: "Try-it script", href: "/tools/try-it" },
    ],
  },
];
