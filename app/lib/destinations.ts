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
// The Be Prepared reminder — the first configured destination card.
// The message is the owner's; keep it calm and practical. Never rewrite it
// into emergency marketing, urgency, or sales copy.
// ─────────────────────────────────────────────────────────────────────────────

export const BE_PREPARED_CARD: DestinationCardContent = {
  eyebrow: "A small reminder",
  heading: "Be prepared. Nothing dramatic.",
  body: [
    "Keep your phone charged. Know who you would call. Have a little food, water, and the basic things your household may need.",
    "You do not have to expect the worst. A few simple plans can make an ordinary hard day easier.",
  ],
  closing: "Prepared is just another word for ready to help.",
  attribution: "A note from the owner of Open Mirror LLC",
  emblem: "🎒",
  destinations: [
    {
      label: "Visit PleaseBeReady.com",
      href: "https://pleasebeready.com",
      kind: "resource",
      external: true,
      enabled: true,
      status: "available",
    },
  ],
  share: {
    label: "Share this reminder",
    title: "Be prepared. Nothing dramatic.",
    text: "Keep your phone charged, know who you would call, and keep a few basic household supplies. Prepared is just another word for ready to help.",
    url: "https://pleasebeready.com",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// The build-with card — StepInTheRing is where ideas become first builds, so
// this is the one satellite that carries the quiet consulting path. The
// primary consulting page stays on Open Mirror's Contact; this only points
// there. Calm language only: no urgency, no prices, no promised acceptance.
// ─────────────────────────────────────────────────────────────────────────────

export const BUILD_WITH_CARD: DestinationCardContent = {
  heading: "Building something of your own?",
  body: [
    "Open Mirror occasionally works with one outside project at a time. The work is small, focused, and based on fit and available time.",
    "If you have a real idea, an unfinished build, or a specific problem, you can send a short note.",
  ],
  closing: "No pitch deck required. Start with what you are trying to make.",
  destinations: [
    {
      label: "Contact Open Mirror",
      href: "https://openmirrorllc.com/contact",
      kind: "consulting",
      external: true,
      enabled: true,
      status: "available",
    },
  ],
};
