// ─────────────────────────────────────────────────────────────────────────────
// THE WEBSITE STARTER: the shapes everything else shares.
//
// One draft shape, eight section kinds, five layouts. The 22 examples are data
// in examples.ts; the example pages, the editor preview and the download all
// run through the one renderer in render.ts. Never fork a second renderer.
// ─────────────────────────────────────────────────────────────────────────────

export type SectionKind = "hero" | "services" | "steps" | "about" | "gallery" | "area" | "faq" | "contact";

export const SECTION_LABEL: Record<SectionKind, string> = {
  hero: "Top of the page",
  services: "What you offer",
  steps: "How it works",
  about: "About you",
  gallery: "Photos of your work",
  area: "Where you work",
  faq: "Questions",
  contact: "Contact",
};

export type LayoutId = "appointment" | "onsite" | "portfolio" | "remote" | "orders";
export type FontId = "modern" | "classic" | "friendly" | "clean" | "elegant";
export type HeroStyle = "split" | "banner" | "plain";

export interface Item {
  title: string;
  text: string;
}

export interface Photo {
  /** What a good photo here shows. Shown in the empty spot. */
  caption: string;
  /** A data: URL the owner added in the editor. Never a remote address. */
  src?: string;
}

export interface Details {
  name: string;
  tagline: string;
  area: string;
  phone: string;
  email: string;
  /** An online booking or scheduling link the owner already has. Optional. */
  booking: string;
  hours: string;
}

export interface SiteDraft {
  v: 1;
  example: string;
  layout: LayoutId;
  details: Details;
  hero: { headline: string; intro: string; cta: string };
  services: { title: string; intro: string; items: Item[] };
  steps: { title: string; items: Item[] };
  about: { title: string; text: string };
  gallery: { title: string };
  area: { title: string; text: string };
  faq: { title: string; items: Item[] };
  contact: { title: string; text: string };
  photos: { hero: Photo; about: Photo; gallery: Photo[] };
  look: { palette: string; accent: string; font: FontId; heroStyle: HeroStyle };
  /** Order on the page, and whether each one shows. */
  sections: { kind: SectionKind; on: boolean }[];
}

export type ExampleGroup =
  | "Fitness and wellness"
  | "Pets"
  | "Home, yard and car"
  | "Lessons"
  | "Hair and beauty"
  | "Photos and events"
  | "Office and paperwork"
  | "Food";

/** One business example. Data only: no markup, no code paths of its own. */
export interface StarterExample {
  slug: string;
  /** The business type, as a person would say it. */
  name: string;
  group: ExampleGroup;
  /** One line for the chooser card. */
  blurb: string;
  /** A short paragraph for the example page: who this starting point fits. */
  fits: string;
  layout: LayoutId;
  /** Show the photo gallery section by default. */
  gallery?: boolean;
  palette: string;
  accent: string;
  font: FontId;
  heroStyle: HeroStyle;
  /** Things only the owner can add. Shown on the example page and the editor. */
  addYourself: string[];
  sample: {
    name: string;
    tagline: string;
    area: string;
    hours: string;
    booking?: boolean;
    headline: string;
    intro: string;
    cta: string;
    servicesTitle: string;
    servicesIntro: string;
    services: Item[];
    stepsTitle: string;
    steps: Item[];
    aboutTitle: string;
    about: string;
    areaTitle: string;
    areaText: string;
    faq: Item[];
    contactText: string;
    photos: { hero: string; about: string; gallery?: string[] };
  };
}
