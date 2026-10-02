// ─────────────────────────────────────────────────────────────────────────────
// About-page destination registry — the quiet business layer.
//
// Everything the lower portion of an About page may point to is DATA here.
// A destination has a kind, a label, and a confirmed live href; pages render
// cards from these configs and never scatter URLs through their markup.
//
// To add a destination later (a store, a listing, a download, a service),
// add ONE entry with `enabled: true` — after the destination is confirmed
// live. Nothing renders until both are true. Never add a guessed URL, a
// placeholder store, or an owner-only Store Engine address here.
// ─────────────────────────────────────────────────────────────────────────────

export type DestinationKind =
  | "project"
  | "resource"
  | "service"
  | "consulting"
  | "contact"
  | "store"
  | "merch"
  | "digital-product"
  | "etsy"
  | "amazon"
  | "download"
  | "subscription"
  | "share"
  | "other";

export type ProjectDestination = {
  label: string;
  href: string;
  kind: DestinationKind;
  description?: string;
  /** external links open in a new tab with safe rel attributes */
  external?: boolean;
  /** default true — set false to keep a prepared destination unrendered */
  enabled?: boolean;
  status?: "available" | "preparing" | "limited" | "unavailable";
};

/** Only labelled, linked, deliberately enabled destinations ever render. */
export function liveDestinations(
  list: ProjectDestination[]
): ProjectDestination[] {
  return list.filter(
    (d) =>
      d.enabled !== false &&
      d.label.trim().length > 0 &&
      d.href.trim().length > 0
  );
}

export type ShareContent = {
  /** the visible action label */
  label: string;
  title: string;
  text: string;
  url: string;
};

export type DestinationCardContent = {
  eyebrow?: string;
  heading: string;
  body: string[];
  closing?: string;
  /** kept visually secondary; "owner", never a personal name */
  attribution?: string;
  /** one small decorative emoji, hidden from assistive technology */
  emblem?: string;
  destinations: ProjectDestination[];
  share?: ShareContent;
};

// ─────────────────────────────────────────────────────────────────────────────
// The build-with card — StepInTheRing is where ideas become first builds, so
// this is the one satellite that carries the quiet consulting path. The
// primary consulting page stays on Open Mirror's Contact; this only points
// there. Calm language only: no urgency, no prices, no promised acceptance.
// ─────────────────────────────────────────────────────────────────────────────

// Say-less (owner, 2026-07-20): one plain fact, one email action. No pitch.
// The one consulting path on the site (Oct 1 2026, owner direction): weekend
// help, asked for by email. No prices, packages, scopes, forms or promises of
// availability — those stay private. A person reads the email and replies.
export const WEEKEND_CONSULTING_HREF =
  "mailto:ask@openmirrorllc.com?subject=Weekend%20consulting%20question";

export const BUILD_WITH_CARD: DestinationCardContent = {
  heading: "Want a hand on the weekend?",
  body: [
    "I do a little consulting on weekends, helping people turn an idea into something that works. If you'd like to ask, send a short email about what you're working on. No forms and no pressure. If it's a fit and there's time, we'll talk.",
  ],
  destinations: [
    {
      label: "Ask about weekend consulting",
      href: WEEKEND_CONSULTING_HREF,
      kind: "consulting",
      enabled: true,
      status: "available",
    },
  ],
};
