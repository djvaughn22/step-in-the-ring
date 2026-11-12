// ─────────────────────────────────────────────────────────────────────────────
// OPTIONAL HELP: the services, in one place.
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

export type OfferId = "publish" | "finish" | "business" | "custom";

export interface Offer {
  id: OfferId;
  name: string;
  /** Shown as is. "Starting at" lives in the string so nobody drops it. */
  price: string;
  /** One sentence: who it's for. */
  forWho: string;
  includes: string[];
  /** Where the package stops, so nobody has to guess. */
  boundary: string;
  /** The honest timing line. Never a guarantee. */
  timing: string;
  flagship?: boolean;
}

// 2026-11-11 (owner brief): the website starter leads, and these are the
// optional help around it, $250 to $2,500 and up by scope. Introductory; the
// written quote is the final word. Earlier ids (review, starter) can still
// appear on old requests; labelFor() shows the raw id for those.
/** The whole range, said once. */
export const PRICE_RANGE = "from $250 to $2,500 and up by scope";

export const OFFERS: Offer[] = [
  {
    id: "publish",
    name: "Publish help",
    price: "$250",
    forWho: "You made a draft with the website starter and want it online.",
    includes: [
      "A check of your site on a phone and a computer",
      "Set up with the hosting company you choose, in your name",
      "Your domain connected, so your address shows your site",
      "Call, text, email and booking buttons tested",
      "A short note on how to update it later",
    ],
    boundary: "Puts your site online as you made it. Changes to the wording or layout are Finish my draft.",
    timing: "Usually within 5 business days after your domain and hosting accounts are ready.",
  },
  {
    id: "finish",
    name: "Finish my draft",
    price: "Starting at $600",
    forWho: "You made a one-page draft in the website starter and want it polished before it goes live.",
    includes: [
      "Your wording tidied and tightened, working from what you wrote",
      "Your photos sized and placed",
      "Colors, fonts and section order adjusted within the starter's layout",
      "Two rounds of changes",
      "Publish help included",
    ],
    boundary: "Works from the one page you made. Writing it from scratch, adding pages or a different structure is a Small business site.",
    timing: "Usually 5 to 10 business days after we have your text and photos.",
  },
  {
    id: "business",
    name: "Small business site",
    price: "Starting at $1,200",
    forWho: "You don't have a draft, or you need more than one page.",
    includes: [
      "Starts with a conversation, no draft needed",
      "Up to 5 pages, planned and laid out for your business",
      "Wording written with you, from your answers",
      "Call, email or a contact form, and basic search setup",
      "Two rounds of changes, and publish help included",
    ],
    boundary: "Pages that show information and help people reach you. Online booking, payments or logins are custom work.",
    timing: "Usually 10 to 15 business days after we have your text and photos.",
  },
  {
    id: "custom",
    name: "Custom site or web app",
    price: "$2,500 and up",
    forWho: "It needs to do more: bookings, payments, a member area, or a tool.",
    includes: [
      "A conversation first, then a written estimate",
      "A plan in milestones, with a preview at each one",
      "Testing on real phones and computers",
      "Help launching, and a handoff you can keep",
    ],
    boundary: "Scope, price and schedule are set in writing before any work starts.",
    timing: "Timing is set in the written estimate, after we understand the work.",
  },
];

/** Finish my draft or Small business site? Said side by side, plainly. */
export const FINISH_VS_BUSINESS: { label: string; finish: string; business: string }[] = [
  { label: "You start with", finish: "A one-page draft you made in the website starter", business: "A conversation. No draft needed" },
  { label: "Pages", finish: "The one page you made", business: "Up to 5 pages" },
  { label: "Wording", finish: "Yours. We tidy and tighten it", business: "Written with you, from your answers" },
  { label: "Design", finish: "The starter layout you chose, adjusted", business: "Laid out for your business" },
  { label: "Changes", finish: "Two rounds", business: "Two rounds" },
];

/** What no package includes. Plain and complete. */
export const NOT_INCLUDED = [
  "Hosting. We don't host websites. Your site lives with the hosting company you choose.",
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
  { id: "publish-draft", label: "Publish a draft I made here" },
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
