// The ways to make something real here (owner direction, Nov 25 2026):
// do it yourself, do it with us, or have us build it. One list, so the
// products page, the home doors and the tests agree.
//
// Honest status, always: nothing on this list is for sale until the owner
// opens sales, and no page shows a price (app/lib/publicPriceGuard.test.ts).
// "Have us build it" follows the paid-help switch (app/site/paidHelp.ts):
// while it is off, the path says so and links nowhere.
import { PAID_HELP_OPEN } from "../site/paidHelp";

export type Availability = "free" | "coming" | "open" | "paused";

export const AVAILABILITY_LABEL: Record<Availability, string> = {
  free: "Free now",
  coming: "Not on sale yet",
  open: "Taking requests",
  paused: "Paused for now",
};

export type CatalogItem = {
  title: string;
  /** One plain sentence: what you end up with. */
  line: string;
  /** A real page on this site, or nothing. */
  href?: string;
  availability: Availability;
};

export type MakePath = {
  id: "yourself" | "with-us" | "build-it";
  title: string;
  line: string;
  items: CatalogItem[];
};

export const PATHS: MakePath[] = [
  {
    id: "yourself",
    title: "Do it yourself",
    line: "Step-by-step guides and plans you keep. Work through them at your own pace.",
    items: [
      {
        title: "Old Laptop to Build Machine",
        line: "Turn a suitable older computer into a machine for making websites and apps, then put a first project online.",
        href: "/products/old-laptop-to-build-machine",
        availability: "coming",
      },
      {
        title: "Start Your Own Business Game Plan",
        line: "Go from an idea to a small, organized business: your customer, your offer, a name, the official filings and a first month.",
        href: "/products/start-your-own-business",
        availability: "coming",
      },
      {
        title: "Ready to Build",
        line: "Check the computer you have, set it up and make a first simple project live.",
        href: "/products/ready-to-build",
        availability: "free",
      },
      {
        title: "Five Hour Sprint",
        line: "Plan one focused build session, keep track of it and report what got done.",
        href: "/five-hour-sprint-tool",
        availability: "free",
      },
    ],
  },
  {
    id: "with-us",
    title: "Do it with us",
    line: "Our tools, your idea. Work with the AI app you already use until it's right.",
    items: [
      {
        title: "Website starter",
        line: "Pick an example close to your business, make it yours and download the files.",
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
    ],
  },
  {
    id: "build-it",
    title: "Have us build it",
    line: "Websites and web apps made for you, with a written quote before any work.",
    items: [
      PAID_HELP_OPEN
        ? {
            title: "Websites and web apps",
            line: "Tell us what you need. Every project starts with a written quote.",
            href: "/services",
            availability: "open",
          }
        : {
            title: "Websites and web apps",
            line: "We aren't taking new projects right now. The free tools above are open.",
            availability: "paused",
          },
    ],
  },
];

/** Where "tell me when it's ready" goes: plain email, nothing stored. */
export const READY_EMAIL = "ask@openmirrorllc.com";

export function readyMailto(product: string): string {
  return `mailto:${READY_EMAIL}?subject=${encodeURIComponent(`Tell me when ${product} is ready`)}`;
}
