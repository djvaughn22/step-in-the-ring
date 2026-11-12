// Palettes, fonts, layouts, and turning an example into an editable draft.

import type { FontId, LayoutId, SectionKind, SiteDraft, StarterExample } from "./types";

export interface Palette {
  id: string;
  name: string;
  bg: string;
  surface: string;
  alt: string;
  text: string;
  muted: string;
  dark?: boolean;
}

export const PALETTES: Palette[] = [
  { id: "linen", name: "Linen", bg: "#FBF7F2", surface: "#FFFFFF", alt: "#F3ECE3", text: "#2B2420", muted: "#665A51" },
  { id: "sky", name: "Sky", bg: "#F6F9FC", surface: "#FFFFFF", alt: "#E9F0F7", text: "#14212E", muted: "#4C5D6E" },
  { id: "sage", name: "Sage", bg: "#F5F8F4", surface: "#FFFFFF", alt: "#E7EEE5", text: "#1F2A22", muted: "#526157" },
  { id: "slate", name: "Slate", bg: "#F4F5F7", surface: "#FFFFFF", alt: "#E5E8ED", text: "#1B1F27", muted: "#505866" },
  { id: "sun", name: "Sunny", bg: "#FFFBF0", surface: "#FFFFFF", alt: "#FAEFD3", text: "#2A2316", muted: "#665A42" },
  { id: "plum", name: "Plum", bg: "#F8F5FA", surface: "#FFFFFF", alt: "#EEE6F3", text: "#241B2B", muted: "#5B4E64" },
  { id: "blush", name: "Blush", bg: "#FCF6F5", surface: "#FFFFFF", alt: "#F4E5E2", text: "#2B1F1E", muted: "#6A5653" },
  { id: "night", name: "Night", bg: "#121417", surface: "#1B1E23", alt: "#23272E", text: "#F1F2F4", muted: "#AAB0B9", dark: true },
];

export function paletteById(id: string): Palette {
  return PALETTES.find((p) => p.id === id) ?? PALETTES[0];
}

export interface FontChoice {
  id: FontId;
  name: string;
  heading: string;
  body: string;
}

// System fonts only: the downloaded site needs nothing from anyone else's
// server, and loads fast on any phone.
export const FONTS: FontChoice[] = [
  { id: "modern", name: "Modern", heading: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif', body: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' },
  { id: "clean", name: "Clean", heading: '"Helvetica Neue", Helvetica, Arial, sans-serif', body: '"Helvetica Neue", Helvetica, Arial, sans-serif' },
  { id: "friendly", name: "Friendly", heading: '"Trebuchet MS", "Avenir Next", Avenir, sans-serif', body: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' },
  { id: "classic", name: "Classic", heading: 'Georgia, "Times New Roman", serif', body: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' },
  { id: "elegant", name: "Elegant", heading: '"Palatino Linotype", Palatino, "Book Antiqua", Georgia, serif', body: 'Georgia, "Times New Roman", serif' },
];

export function fontById(id: FontId): FontChoice {
  return FONTS.find((f) => f.id === id) ?? FONTS[0];
}

export interface Layout {
  id: LayoutId;
  name: string;
  /** Why the sections come in this order. Shown on the example pages. */
  why: string;
  order: SectionKind[];
}

export const LAYOUTS: Record<LayoutId, Layout> = {
  appointment: {
    id: "appointment",
    name: "Booked sessions",
    why: "Built for booked sessions: what a session is, how a first visit goes, and the questions new clients ask before they book.",
    order: ["hero", "services", "steps", "about", "gallery", "area", "faq", "contact"],
  },
  onsite: {
    id: "onsite",
    name: "We come to you",
    why: "Built for work done at the customer's place. Where you go comes early, because the first question is usually whether you come to them.",
    order: ["hero", "services", "area", "steps", "gallery", "about", "faq", "contact"],
  },
  portfolio: {
    id: "portfolio",
    name: "Show the work",
    why: "Built for work people judge by eye. Photos come right after the top of the page, before the list of services.",
    order: ["hero", "gallery", "services", "about", "steps", "area", "faq", "contact"],
  },
  remote: {
    id: "remote",
    name: "Work done remotely",
    why: "Built for work done remotely: what you take on, how you start, and how access and trust are handled.",
    order: ["hero", "services", "steps", "about", "faq", "area", "gallery", "contact"],
  },
  orders: {
    id: "orders",
    name: "Take orders",
    why: "Built for taking orders: the menu, photos, how to order, then pickup or delivery, in the order people need them.",
    order: ["hero", "services", "gallery", "steps", "area", "about", "faq", "contact"],
  },
};

export function draftFromExample(ex: StarterExample): SiteDraft {
  const s = ex.sample;
  // 555-0100 to 555-0199 is the range set aside for fiction.
  const n = [...ex.slug].reduce((a, c) => a + c.charCodeAt(0), 0) % 100;
  return {
    v: 1,
    example: ex.slug,
    layout: ex.layout,
    details: {
      name: s.name,
      tagline: s.tagline,
      area: s.area,
      phone: `(555) 555-01${String(n).padStart(2, "0")}`,
      email: "hello@example.com",
      booking: s.booking ? "https://example.com/book" : "",
      hours: s.hours,
    },
    hero: { headline: s.headline, intro: s.intro, cta: s.cta },
    services: { title: s.servicesTitle, intro: s.servicesIntro, items: s.services.map((i) => ({ ...i })) },
    steps: { title: s.stepsTitle, items: s.steps.map((i) => ({ ...i })) },
    about: { title: s.aboutTitle, text: s.about },
    gallery: { title: "Recent work" },
    area: { title: s.areaTitle, text: s.areaText },
    faq: { title: "Questions", items: s.faq.map((i) => ({ ...i })) },
    contact: { title: "Get in touch", text: s.contactText },
    photos: {
      hero: { caption: s.photos.hero },
      about: { caption: s.photos.about },
      gallery: (s.photos.gallery && s.photos.gallery.length ? s.photos.gallery : ["A photo of your work", "Another photo of your work", "One more photo"]).map((caption) => ({ caption })),
    },
    look: { palette: ex.palette, accent: ex.accent, font: ex.font, heroStyle: ex.heroStyle },
    sections: LAYOUTS[ex.layout].order.map((kind) => ({ kind, on: kind === "gallery" ? !!ex.gallery : true })),
  };
}

/**
 * When the owner changes their business name or area, carry the change into
 * every bit of wording that still says the old one. Words they already
 * rewrote are left as they are.
 */
export function replaceEverywhere(draft: SiteDraft, from: string, to: string): SiteDraft {
  if (!from.trim() || from === to) return draft;
  const swap = (t: string) => t.split(from).join(to);
  const items = (xs: { title: string; text: string }[]) => xs.map((x) => ({ title: swap(x.title), text: swap(x.text) }));
  return {
    ...draft,
    hero: { headline: swap(draft.hero.headline), intro: swap(draft.hero.intro), cta: draft.hero.cta },
    services: { ...draft.services, intro: swap(draft.services.intro), items: items(draft.services.items) },
    steps: { ...draft.steps, items: items(draft.steps.items) },
    about: { ...draft.about, text: swap(draft.about.text) },
    area: { ...draft.area, text: swap(draft.area.text) },
    faq: { ...draft.faq, items: items(draft.faq.items) },
    contact: { ...draft.contact, text: swap(draft.contact.text) },
  };
}

/** Black or white text, whichever reads better on this colour. */
export function inkOn(hex: string): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return "#ffffff";
  const v = parseInt(m[1], 16);
  const ch = [(v >> 16) & 255, (v >> 8) & 255, v & 255].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  const lum = 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
  return lum > 0.4 ? "#111111" : "#ffffff";
}

/** Load a saved draft without trusting it: anything malformed is ignored. */
export function parseDraft(raw: unknown): SiteDraft | null {
  if (!raw || typeof raw !== "object") return null;
  const d = raw as Partial<SiteDraft>;
  if (d.v !== 1 || typeof d.example !== "string" || !d.details || !d.hero || !Array.isArray(d.sections)) return null;
  if (!d.services || !d.steps || !d.about || !d.gallery || !d.area || !d.faq || !d.contact || !d.photos || !d.look) return null;
  return d as SiteDraft;
}

export const DRAFT_KEY = "sitr-site-draft-v1";
