// A small, true-to-colour sketch of an example's top of page: its name, its
// headline in its own font, its colours and its main button. Shown on the
// example cards so a visitor can picture the site before opening it. Purely
// decorative (aria-hidden): the card says the same thing in words.

import { fontById, inkOn, paletteById } from "./draft";
import { RADIUS } from "./render";
import type { HeroStyle, StarterExample } from "./types";

export interface MiniData {
  site: string;
  tagline: string;
  headline: string;
  cta: string;
  bg: string;
  surface: string;
  alt: string;
  text: string;
  muted: string;
  accent: string;
  ink: string;
  heading: string;
  radius: string;
  hero: HeroStyle;
}

export function miniData(ex: StarterExample): MiniData {
  const p = paletteById(ex.palette);
  return {
    site: ex.sample.name,
    tagline: ex.sample.tagline,
    headline: ex.sample.headline,
    cta: ex.sample.cta,
    bg: p.bg,
    surface: p.surface,
    alt: p.alt,
    text: p.text,
    muted: p.muted,
    accent: ex.accent,
    ink: inkOn(ex.accent),
    heading: fontById(ex.font).heading,
    radius: RADIUS[ex.font] ?? "10px",
    hero: ex.heroStyle,
  };
}

export default function MiniSite({ m }: { m: MiniData }) {
  const vars = {
    "--m-bg": m.bg,
    "--m-surface": m.surface,
    "--m-alt": m.alt,
    "--m-text": m.text,
    "--m-muted": m.muted,
    "--m-accent": m.accent,
    "--m-ink": m.ink,
    "--m-hf": m.heading,
    "--m-r": m.radius,
  } as React.CSSProperties;
  return (
    <span className={`mini mini-${m.hero}`} style={vars} aria-hidden="true">
      <span className="mini-top">
        <b>{m.site}</b>
        <i />
      </span>
      <span className="mini-hero">
        <span className="mini-words">
          <span className="mini-eyebrow">{m.tagline}</span>
          <span className="mini-h">{m.headline}</span>
          <span className="mini-cta">{m.cta}</span>
        </span>
        {m.hero === "split" ? <span className="mini-photo" /> : null}
      </span>
    </span>
  );
}
