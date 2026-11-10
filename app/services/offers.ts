// ─────────────────────────────────────────────────────────────────────────────
// BUILD IT WITH US: the services, in one place.
//
// Owner brief, 2026-11-10: Step In The Ring has two offers. Build it yourself
// (the workspace, tools and engines, no charge, unchanged) and Build it with
// us (paid websites and web apps, operated by Open Mirror LLC). This file is
// the ONLY place a service price lives, so the home page, /services, /request
// and the inquiry email can't disagree. publicPriceGuard.test.ts allowlists
// this file and nothing else for prices.
//
// Rules:
//   - Introductory prices. Every project gets a written quote before any work
//     or payment. Nothing here is an order, and nothing is charged on the site.
//   - No unlimited anything: revisions, pages, support or uptime.
//   - Care plans are described, not sold: no subscription exists.
//   - No invented clients, testimonials or numbers.
// ─────────────────────────────────────────────────────────────────────────────

export type OfferId = "review" | "starter" | "business" | "custom";

export interface Offer {
  id: OfferId;
  name: string;
  /** Shown as is. "Starting at" lives in the string so nobody drops it. */
  price: string;
  /** One sentence: who it's for. */
  forWho: string;
  includes: string[];
  /** The honest timing line. Never a guarantee. */
  timing: string;
  flagship?: boolean;
}

export const OFFERS: Offer[] = [
  {
    id: "review",
    name: "Website Review",
    price: "$149",
    forWho: "You have a website and want to know what to fix first.",
    includes: [
      "Up to 10 pages, checked on a phone and a computer",
      "Navigation, mobile layout, basic speed and accessibility notes",
      "Whether your pages lead people to call, book or buy",
      "A written, prioritized list of improvements",
      "One round of follow-up questions by email",
    ],
    timing: "Usually within 5 business days.",
  },
  {
    id: "starter",
    name: "Starter Website",
    price: "$499",
    forWho: "A clean, simple site for one person or a small organization.",
    includes: [
      "Up to 3 pages that work well on phones",
      "A contact form or easy call and email links",
      "Basic search setup: titles, descriptions, sitemap",
      "One round of changes",
      "Simple launch or handoff instructions",
    ],
    timing: "Usually 5 to 7 business days after we have your text and photos.",
  },
  {
    id: "business",
    name: "Business Website",
    price: "$999",
    forWho: "A professional site for a business that wants to be found and contacted.",
    includes: [
      "Up to 6 pages, styled to your brand",
      "Works well on phones and computers",
      "Contact form and basic search setup",
      "Two rounds of changes",
      "Testing and help getting it live",
    ],
    timing: "Usually 7 to 14 business days after we have your text and photos.",
    flagship: true,
  },
  {
    id: "custom",
    name: "Custom Website or Web App",
    price: "Starting at $2,499",
    forWho: "Something that needs more: a tool, a workflow, an integration.",
    includes: [
      "A conversation first, then a written estimate",
      "A plan in milestones, with a preview at each one",
      "Testing on real phones and computers",
      "Help launching, and a handoff you can keep",
    ],
    timing: "Timing is set in the written estimate, after we understand the work.",
  },
];

/** What no package includes. Plain and complete. */
export const NOT_INCLUDED = [
  "Domain, hosting, email and other paid services. You pay them directly, in your own name.",
  "Writing large amounts of new text, professional photos or a logo.",
  "Online payments, bookings, logins or member areas, unless quoted as custom work.",
  "Complex integrations with other systems, unless quoted as custom work.",
  "Ongoing support after launch, unless you choose a care plan.",
];

export interface CarePlan {
  name: string;
  price: string;
  includes: string;
}

/** Shown as "available after launch, by conversation". No subscription exists. */
export const CARE_PLANS: CarePlan[] = [
  {
    name: "Basic Care",
    price: "$49 a month",
    includes: "A monthly check that the site loads and the form works, routine updates, and a short note on what we found.",
  },
  {
    name: "Business Care",
    price: "$99 a month",
    includes: "Basic Care, plus up to one hour of text and photo changes each month.",
  },
  {
    name: "Growth Care",
    price: "$199 a month",
    includes: "Basic Care, plus up to three hours of agreed improvements and a monthly review.",
  },
];

export const CARE_TERMS =
  "Replies within 2 business days. No 24/7 support and no uptime guarantee: your hosting company runs the servers. Unused hours don't roll over. Work outside the plan is quoted first. Month to month, with 30 days' notice to cancel.";

// ── The request form's choices. Values are stable ids; labels are words. ──

export const PROJECT_TYPES = [
  { id: "new-site", label: "A new website" },
  { id: "redo-site", label: "Redo or improve my website" },
  { id: "review", label: "A review of my website" },
  { id: "web-app", label: "A web app or tool" },
  { id: "not-sure", label: "Not sure yet" },
] as const;

export const SERVICE_CHOICES = [
  ...OFFERS.map((o) => ({ id: o.id, label: `${o.name} (${o.price})` })),
  { id: "care", label: "A care plan for a site you already have" },
  { id: "not-sure", label: "Not sure, help me choose" },
] as const;

export const TIMELINES = [
  { id: "soon", label: "In the next few weeks" },
  { id: "1-3-months", label: "In 1 to 3 months" },
  { id: "flexible", label: "Flexible" },
  { id: "exploring", label: "Just exploring" },
] as const;

export const BUDGETS = [
  { id: "", label: "Prefer not to say" },
  { id: "under-500", label: "Under $500" },
  { id: "500-1000", label: "$500 to $1,000" },
  { id: "1000-2500", label: "$1,000 to $2,500" },
  { id: "2500-plus", label: "$2,500 or more" },
] as const;

export type ProjectTypeId = (typeof PROJECT_TYPES)[number]["id"];
export type ServiceChoiceId = (typeof SERVICE_CHOICES)[number]["id"];
export type TimelineId = (typeof TIMELINES)[number]["id"];
export type BudgetId = (typeof BUDGETS)[number]["id"];

export function labelFor(list: readonly { id: string; label: string }[], id: string): string {
  return list.find((x) => x.id === id)?.label ?? id;
}

/**
 * Required word-for-word by the owner (2026-11-10). Shown in the footer, on
 * About and on /services. Names no employer, on purpose.
 */
export const INDEPENDENCE_NOTICE =
  "Step In The Ring is independently owned and operated by Open Mirror LLC. All services are provided outside other employment, using independent resources, and are not affiliated with or endorsed by any employer. We do not undertake projects that conflict with existing employment obligations.";
