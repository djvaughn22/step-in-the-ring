// The ways to make something real here (owner direction, Nov 25 2026):
// do it yourself, do it with us, or have us build it. One list, so the
// products page, the product pages, the home doors and the tests agree.
//
// Honest status, always: nothing on this list is for sale until the owner
// opens sales, and no page shows a price (app/lib/publicPriceGuard.test.ts).
// Nov 26-27 2026 (owner): the public pages list only what's usable now
// (publicPaths below); the planned paid products stay here as the record.
// "Have us build it" follows the paid-help switch (app/site/paidHelp.ts).
//
// Every product someone would pay for says six things plainly (owner, Nov 25):
// who it's for, what they can do with it, what they get, what they need,
// how long it takes, and whether more help is available.
import { PAID_HELP_OPEN } from "../site/paidHelp";

export type Availability = "free" | "coming" | "concept" | "testers" | "open" | "paused";

export const AVAILABILITY_LABEL: Record<Availability, string> = {
  free: "Free now",
  coming: "Not on sale yet",
  concept: "In the works",
  testers: "Invited testers only",
  open: "Taking requests",
  paused: "Paused for now",
};

export type CatalogDetail = {
  forWho: string;
  accomplish: string;
  receive: string;
  need: string;
  time: string;
  help: string;
};

export const DETAIL_LABELS: Record<keyof CatalogDetail, string> = {
  forWho: "Who it's for",
  accomplish: "What you can do with it",
  receive: "What you get",
  need: "What you need",
  time: "Time and effort",
  help: "More help",
};

export type CatalogItem = {
  title: string;
  /** One plain sentence: what you end up with. */
  line: string;
  /** A real page on this site, or nothing. */
  href?: string;
  availability: Availability;
  /** Required for anything someone would pay for. */
  detail?: CatalogDetail;
};

export type MakePath = {
  id: "yourself" | "with-us" | "build-it";
  title: string;
  line: string;
  items: CatalogItem[];
};

const NO_PERSONAL_HELP = "Not right now. Questions about the guide go to ask@openmirrorllc.com.";

export const OLD_LAPTOP: CatalogItem = {
  title: "Old Laptop to Build Machine",
  line: "Turn a suitable older computer into a machine for making websites and apps, then put a first project online.",
  availability: "coming",
  detail: {
    forWho: "Anyone with an older laptop or desktop they'd like to put to work: families, students, people on a budget.",
    accomplish: "A clean, supported system with real building tools, and a first project online with a link you can share.",
    receive: "An illustrated guide (PDF and web), a readiness worksheet and checklist, three reference cards, a careful setup script and a check script, and a finished first project.",
    need: "A 64-bit Intel or AMD computer that powers on, a USB stick, an internet connection, and a backup of your files. No experience needed.",
    time: "Plan on a weekend: a few hours to check, back up and install, then an evening for your first project. Older machines can take longer.",
    help: NO_PERSONAL_HELP,
  },
};

export const GAME_PLAN: CatalogItem = {
  title: "Start Your Own Business Game Plan",
  line: "Go from an idea to a small, organized business: your customer, your offer, a name, the official filings and a first month.",
  availability: "coming",
  detail: {
    forWho: "Someone in the US with an idea for a small or side business, starting on evenings and weekends.",
    accomplish: "A clear offer, a name you've checked, the filings you chose, simple records, a first budget, a one-page website and a weekly routine.",
    receive: "A 19-page printable workbook with a worksheet for every step, your one-page Game Plan, an official-sources sheet and a first-30-days plan.",
    need: "A pen, a printer or PDF reader, and an hour or two a week. No business experience needed.",
    time: "About 30 days at one small task a day. State filings take as long as your state takes.",
    help: "It's a do-it-yourself workbook, not legal, tax or accounting advice. For that, ask a professional in your state.",
  },
};

export const PATHS: MakePath[] = [
  {
    id: "yourself",
    title: "Do it yourself",
    line: "Step-by-step guides and plans you keep. Work through them at your own pace.",
    items: [
      OLD_LAPTOP,
      GAME_PLAN,
      {
        title: "Ready to Build Kit",
        line: "A printable workbook that takes the computer you already have to a first live project.",
        availability: "coming",
        detail: {
          forWho: "Someone who wants to build with the computer they already have, on Windows, Mac or Linux.",
          accomplish: "A computer set up to build websites and apps, and a first simple project online.",
          receive: "A 20-page printable workbook with checklists for Windows, Mac and Linux, and a kit page that keeps your place.",
          need: "The computer you have, an internet connection and a backup. No coding experience needed.",
          time: "A first project in a weekend is a realistic goal, not a promise.",
          help: NO_PERSONAL_HELP,
        },
      },
      {
        title: "Ready to Build guide",
        line: "Check the computer you have, set it up and make a first simple project live.",
        href: "/products/ready-to-build",
        availability: "free",
      },
      {
        title: "Five Hour Sprint planner",
        line: "Plan one focused build session, keep track of it and report what got done.",
        href: "/five-hour-sprint-tool",
        availability: "free",
      },
      {
        title: "Five Hour Sprint Playbook",
        line: "How to finish one real piece of work in one focused five-hour session.",
        availability: "concept",
        detail: {
          forWho: "People who build with AI apps and want to finish things inside a fixed amount of time.",
          accomplish: "One finished, checked piece of work from one focused session.",
          receive: "Planned: the playbook and templates that go with the free planner.",
          need: "An AI app you already use, and five uninterrupted hours.",
          time: "Five hours, by design.",
          help: "In the works. The free planner is open now.",
        },
      },
      {
        title: "Build Packs",
        line: "Small kits for one outcome each, like putting a website online with GitHub.",
        availability: "concept",
        detail: {
          forWho: "Someone who needs one specific thing done, not a whole course.",
          accomplish: "One outcome per pack.",
          receive: "Planned: a short guide, checklists and starter files for that one outcome.",
          need: "Depends on the pack. Each one will say.",
          time: "About an evening per pack.",
          help: "In the works.",
        },
      },
    ],
  },
  {
    id: "with-us",
    title: "Do it with us",
    line: "Our tools, your idea. Work with the AI app you already use until it's right.",
    items: [
      {
        title: "Website examples",
        line: "Browse 29 examples, see one on a phone, and change the words and photos to make it yours.",
        href: "/start",
        availability: "free",
      },
      {
        title: "Engines",
        line: "Guided steps that end with something you can use: a launch plan, a price to test, a plan for an event.",
        href: "/engines",
        availability: "free",
      },
      {
        title: "Make it with AI",
        line: "Say what you want to make and get a clear message to paste into your AI app.",
        href: "/make",
        availability: "free",
      },
      {
        title: "Creator Membership",
        line: "Your saved work on every device, more engines, and help from us when it opens.",
        availability: "testers",
        detail: {
          forWho: "People who come back to make more.",
          accomplish: "Keep your work in one place and pick it up anywhere.",
          receive: "Today: an account for invited testers that saves your work. Later: more tools and help.",
          need: "An email address.",
          time: "As much as you like. Nothing to finish.",
          help: "Invited testers only for now.",
        },
      },
    ],
  },
  {
    id: "build-it",
    title: "Have us build it",
    line: "Websites and web apps made for you, with a written quote before any work.",
    items: [
      {
        title: "Websites and web apps",
        line: PAID_HELP_OPEN
          ? "Tell us what you need. Every project starts with a written quote."
          : "We aren't taking new projects right now. You can still put together a scope summary.",
        availability: PAID_HELP_OPEN ? "open" : "paused",
        detail: {
          forWho: "Small businesses and people who'd rather have it built.",
          accomplish: "A website or web app made for you, tested on phones and computers, and handed over.",
          receive: "A written scope and quote first. Then the site or app, the files and the instructions to keep it.",
          need: "Your words, your photos and your decisions.",
          time: "Depends on the size of the project. The scope summary is the first step.",
          help: "This is the help. It's paused for now.",
        },
      },
    ],
  },
];

/** Where "tell me when it's ready" goes: plain email, nothing stored. */
export const READY_EMAIL = "ask@openmirrorllc.com";

export function readyMailto(product: string): string {
  return `mailto:${READY_EMAIL}?subject=${encodeURIComponent(`Tell me when ${product} is ready`)}`;
}

/**
 * What the public pages show (owner direction, Nov 26-27 2026: remove
 * premature monetization). Only things someone can use today: no
 * "not on sale yet", "in the works" or "invited testers" listings, no
 * "have us build it" path while paid help is paused, and no "tell me when
 * it's ready" sign-ups. The full list above stays as the record of the
 * planned products; paidItems() still describes them for the owner.
 */
export function publicPaths(): MakePath[] {
  return PATHS.filter((p) => p.id !== "build-it" || PAID_HELP_OPEN)
    .map((p) => ({ ...p, items: p.items.filter((i) => i.availability === "free") }))
    .filter((p) => p.items.length > 0);
}

/** Professional help, said plainly: one email (owner direction, Nov 26-27 2026). */
export const HELP_LINE = "Want help with something bigger? Email the owner for more details.";

/** Anything a person would pay for, now or later. */
export function paidItems(): CatalogItem[] {
  return PATHS.flatMap((p) => p.items).filter((i) => i.availability !== "free");
}
