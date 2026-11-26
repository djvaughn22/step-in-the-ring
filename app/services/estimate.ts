// The scope estimate behind "Have us build it" (owner direction, Nov 25 2026).
//
// HOURS ONLY. No dollar amount is ever computed or shown here: there are no
// public prices until the owner approves them. The owner turns hours into a
// written quote privately, outside this public repository. Every number
// below is a starting assumption from
// the Nov 10 private plan's delivery hours, meant to be tuned after real
// projects. Change MODEL, not the page.

export type Design = "example" | "adjusted" | "custom";
export type Content = "ready" | "some-help" | "write-it";
export type Testing = "standard" | "extended";
export type Publishing = "none" | "connect" | "full";
export type Maintenance = "none" | "basic" | "with-changes";

export const FEATURES = {
  "contact-form": "A contact form",
  gallery: "A photo gallery",
  "menu-or-prices": "A menu or price list",
  "booking-link": "A link to your booking tool",
  "events-calendar": "An events calendar",
  blog: "News or a blog you can update",
  "online-store": "Selling online (a store)",
  "member-login": "Member logins or private pages",
} as const;
export type FeatureId = keyof typeof FEATURES;

export const INTEGRATIONS = {
  "google-business": "Your Google business profile",
  "email-list": "An email newsletter sign-up",
  "booking-tool": "Online booking (connected, not just a link)",
  payments: "Taking payments",
  analytics: "Visitor counts (analytics)",
  "social-feeds": "Showing your social posts",
} as const;
export type IntegrationId = keyof typeof INTEGRATIONS;

export type ScopeInput = {
  pages: number;
  design: Design;
  content: Content;
  features: FeatureId[];
  integrations: IntegrationId[];
  testing: Testing;
  revisions: 1 | 2 | 3;
  publishing: Publishing;
  maintenance: Maintenance;
};

type Range = { low: number; high: number };

/** Hours. Tune after real projects; the page reads everything from here. */
export const MODEL = {
  base: { low: 6, high: 8 } as Range, // setup, the first page, phone and computer checks, handover notes
  perExtraPage: { low: 1.5, high: 2.5 } as Range,
  design: { example: { low: 0, high: 0 }, adjusted: { low: 2, high: 4 }, custom: { low: 6, high: 12 } } as Record<Design, Range>,
  contentPerPage: { ready: { low: 0, high: 0 }, "some-help": { low: 0.5, high: 1 }, "write-it": { low: 1, high: 2 } } as Record<Content, Range>,
  features: {
    "contact-form": { low: 1, high: 2 },
    gallery: { low: 1, high: 2 },
    "menu-or-prices": { low: 1, high: 2 },
    "booking-link": { low: 0.5, high: 1 },
    "events-calendar": { low: 2, high: 4 },
    blog: { low: 3, high: 6 },
    "online-store": { low: 10, high: 20 },
    "member-login": { low: 12, high: 24 },
  } as Record<FeatureId, Range>,
  integrations: {
    "google-business": { low: 0.5, high: 1 },
    "email-list": { low: 1, high: 2 },
    "booking-tool": { low: 1, high: 3 },
    payments: { low: 3, high: 6 },
    analytics: { low: 0.5, high: 1 },
    "social-feeds": { low: 1, high: 2 },
  } as Record<IntegrationId, Range>,
  extendedTesting: { low: 2, high: 4 } as Range, // accessibility pass, more devices, slow connections
  perExtraRevision: { low: 1.5, high: 3 } as Range,
  publishing: { none: { low: 0, high: 0 }, connect: { low: 1, high: 2 }, full: { low: 2, high: 4 } } as Record<Publishing, Range>,
  monthly: { none: { low: 0, high: 0 }, basic: { low: 0.5, high: 1 }, "with-changes": { low: 1.5, high: 2 } } as Record<Maintenance, Range>,
  /** These need a conversation before anyone can say how big they are. */
  needsConversation: ["online-store", "member-login", "payments"] as string[],
  sizes: { small: 16, medium: 32, large: 70 },
};

export type EstimateLine = { label: string; low: number; high: number };
export type Estimate = {
  lines: EstimateLine[];
  low: number;
  high: number;
  monthly: Range;
  size: "Small" | "Medium" | "Large" | "Needs a conversation";
  conversationFor: string[];
};

const round = (n: number) => Math.round(n * 2) / 2;

export function estimate(input: ScopeInput): Estimate {
  const pages = Math.max(1, Math.min(30, Math.round(input.pages || 1)));
  const lines: EstimateLine[] = [];
  const add = (label: string, r: Range, times = 1) => {
    if (r.high * times > 0) lines.push({ label, low: round(r.low * times), high: round(r.high * times) });
  };
  add("Setup, the first page, checks on phones and computers", MODEL.base);
  if (pages > 1) add(`${pages - 1} more ${pages === 2 ? "page" : "pages"}`, MODEL.perExtraPage, pages - 1);
  add(input.design === "custom" ? "A custom design" : "Adjusting the example's look", MODEL.design[input.design]);
  add(input.content === "write-it" ? "Writing the words" : "Help with the words", MODEL.contentPerPage[input.content], pages);
  for (const f of input.features) add(FEATURES[f], MODEL.features[f]);
  for (const i of input.integrations) add(INTEGRATIONS[i], MODEL.integrations[i]);
  if (input.testing === "extended") add("Extra testing (accessibility, more devices)", MODEL.extendedTesting);
  if (input.revisions > 1) add(`${input.revisions - 1} more ${input.revisions === 2 ? "round" : "rounds"} of changes`, MODEL.perExtraRevision, input.revisions - 1);
  add(input.publishing === "full" ? "Putting it online for you" : "Help connecting your web address and hosting", MODEL.publishing[input.publishing]);

  const low = round(lines.reduce((s, l) => s + l.low, 0));
  const high = round(lines.reduce((s, l) => s + l.high, 0));
  const conversationFor = [...input.features, ...input.integrations]
    .filter((id) => MODEL.needsConversation.includes(id))
    .map((id) => (FEATURES as Record<string, string>)[id] ?? (INTEGRATIONS as Record<string, string>)[id]);
  const size: Estimate["size"] = conversationFor.length || high > MODEL.sizes.large
    ? "Needs a conversation"
    : high <= MODEL.sizes.small ? "Small" : high <= MODEL.sizes.medium ? "Medium" : "Large";
  return { lines, low, high, monthly: MODEL.monthly[input.maintenance], size, conversationFor };
}

/** A plain-text summary a visitor can copy. Hours only, never money. */
export function summaryText(input: ScopeInput, est: Estimate): string {
  const out = [
    "Website scope summary (Step In The Ring)",
    `Pages: ${input.pages}`,
    ...est.lines.map((l) => `- ${l.label}: about ${l.low}-${l.high} hours`),
    `Estimated work: about ${est.low}-${est.high} hours (${est.size.toLowerCase()})`,
  ];
  if (est.monthly.high > 0) out.push(`Upkeep: about ${est.monthly.low}-${est.monthly.high} hours a month`);
  if (est.conversationFor.length) out.push(`Needs a conversation first: ${est.conversationFor.join(", ")}`);
  out.push("This is an estimate of effort, not a price. A written quote comes after a conversation.");
  return out.join("\n");
}

export const DEFAULT_SCOPE: ScopeInput = {
  pages: 1,
  design: "adjusted",
  content: "ready",
  features: ["contact-form"],
  integrations: [],
  testing: "standard",
  revisions: 2,
  publishing: "connect",
  maintenance: "none",
};
