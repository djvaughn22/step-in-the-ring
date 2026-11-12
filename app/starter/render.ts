// ─────────────────────────────────────────────────────────────────────────────
// THE ONE RENDERER. A draft in, one standalone HTML file out.
//
// The example pages, the editor preview and the download all call this. The
// output needs nothing from any other server: system fonts, inline CSS, no
// scripts, no trackers. Everything the owner typed is escaped.
//
// Modes:
//   preview — empty photo spots show what belongs there (editor, examples)
//   export  — empty photo spots are left out; photos point at images/…
// ─────────────────────────────────────────────────────────────────────────────

import { fontById, inkOn, paletteById } from "./draft";
import type { Item, Photo, SectionKind, SiteDraft } from "./types";

export type RenderMode = "preview" | "export";

export function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

/** Only real web links, so a pasted javascript: address can't ride along. */
export function safeUrl(url: string): string {
  const u = url.trim();
  return /^https?:\/\/[^\s<>"']+$/i.test(u) ? u : "";
}

export function telHref(phone: string): string {
  const digits = phone.replace(/[^\d+]/g, "");
  return digits.length >= 7 ? digits : "";
}

export function safeEmail(email: string): string {
  const e = email.trim();
  return /^[^\s@<>"']+@[^\s@<>"']+\.[^\s@<>"']+$/.test(e) ? e : "";
}

function validHex(c: string, fallback: string): string {
  return /^#[0-9a-f]{6}$/i.test(c.trim()) ? c.trim() : fallback;
}

export interface RenderOptions {
  mode: RenderMode;
  /** export: where each photo was written in the .zip, keyed by photo id. */
  imagePaths?: Record<string, string>;
}

/** Stable ids for every photo spot: hero, about, gallery-0, gallery-1, … */
export function photoSpots(d: SiteDraft): { id: string; photo: Photo }[] {
  return [
    { id: "hero", photo: d.photos.hero },
    { id: "about", photo: d.photos.about },
    ...d.photos.gallery.map((photo, i) => ({ id: `gallery-${i}`, photo })),
  ];
}

/** Corners follow the font: sharper for the serif sets, rounder for Friendly. */
const RADIUS: Record<string, string> = { elegant: "2px", classic: "4px", clean: "6px", modern: "10px", friendly: "18px" };

const NAV_LABEL: Partial<Record<SectionKind, string>> = {
  services: "Services",
  gallery: "Work",
  about: "About",
  faq: "Questions",
  contact: "Contact",
};

export function renderSite(d: SiteDraft, opts: RenderOptions = { mode: "preview" }): string {
  const pal = paletteById(d.look.palette);
  const font = fontById(d.look.font);
  const accent = validHex(d.look.accent, "#2B6CB0");
  const ink = inkOn(accent);
  const name = d.details.name.trim() || "Your business";
  const on = d.sections.filter((s) => s.on).map((s) => s.kind);

  const img = (id: string, p: Photo, cls: string): string => {
    if (p.src) {
      const src = opts.mode === "export" ? opts.imagePaths?.[id] ?? "" : p.src;
      if (src && (opts.mode === "export" || /^data:image\/(png|jpe?g|webp|gif);base64,/.test(src))) {
        const lazy = id === "hero" ? "" : ' loading="lazy"';
        return `<img class="${cls}" src="${esc(src)}" alt="${esc(p.caption)}" decoding="async"${lazy}>`;
      }
    }
    if (opts.mode === "export") return "";
    return `<div class="${cls} ph" role="img" aria-label="Photo spot"><span>Photo: ${esc(p.caption)}</span></div>`;
  };

  const items = (xs: Item[], cls: string) =>
    xs.filter((x) => x.title.trim() || x.text.trim()).map((x) => `<li class="${cls}"><h3>${esc(x.title)}</h3><p>${esc(x.text)}</p></li>`).join("");

  const phone = telHref(d.details.phone);
  const email = safeEmail(d.details.email);
  const booking = safeUrl(d.details.booking);
  const ctaHref = booking || "#contact";
  // A booking page is somebody else's site: open it in a new tab.
  const ext = booking ? ' target="_blank" rel="noopener"' : "";

  const section: Record<SectionKind, () => string> = {
    hero: () => {
      const style = d.look.heroStyle;
      const photo = img("hero", d.photos.hero, "hero-img");
      const hasPhoto = photo !== "";
      const text = `<div class="hero-text"><p class="eyebrow">${esc(d.details.tagline)}</p><h1>${esc(d.hero.headline)}</h1><p class="lead">${esc(d.hero.intro)}</p><p class="actions"><a class="btn" href="${esc(ctaHref)}"${ext}>${esc(d.hero.cta || "Get in touch")}</a>${phone ? `<a class="btn btn-line" href="tel:${esc(phone)}">Call ${esc(d.details.phone)}</a>` : ""}</p></div>`;
      if (style === "banner") return `<section class="hero hero-banner${hasPhoto ? "" : " no-photo"}" id="top">${photo}<div class="wrap">${text}</div></section>`;
      if (style === "split" && hasPhoto) return `<section class="hero hero-split" id="top"><div class="wrap">${text}${photo}</div></section>`;
      return `<section class="hero hero-plain" id="top"><div class="wrap">${text}</div></section>`;
    },
    services: () => `<section id="services"><div class="wrap"><h2>${esc(d.services.title)}</h2>${d.services.intro.trim() ? `<p class="intro">${esc(d.services.intro)}</p>` : ""}<ul class="cards">${items(d.services.items, "card")}</ul></div></section>`,
    steps: () => `<section id="how" class="alt"><div class="wrap"><h2>${esc(d.steps.title)}</h2><ol class="steps">${items(d.steps.items, "step")}</ol></div></section>`,
    about: () => {
      const photo = img("about", d.photos.about, "about-img");
      return `<section id="about"><div class="wrap${photo ? " about" : ""}"><div><h2>${esc(d.about.title)}</h2><p class="body">${esc(d.about.text)}</p></div>${photo}</div></section>`;
    },
    gallery: () => {
      const tiles = d.photos.gallery.map((p, i) => img(`gallery-${i}`, p, "tile")).filter(Boolean);
      if (!tiles.length) return "";
      return `<section id="gallery"><div class="wrap"><h2>${esc(d.gallery.title)}</h2><div class="gallery">${tiles.join("")}</div></div></section>`;
    },
    area: () => `<section id="area" class="alt"><div class="wrap area"><div><h2>${esc(d.area.title)}</h2><p class="body">${esc(d.area.text)}</p></div>${d.details.hours.trim() ? `<p class="hours"><strong>Hours</strong><br>${esc(d.details.hours)}</p>` : ""}</div></section>`,
    faq: () => `<section id="faq"><div class="wrap narrow"><h2>${esc(d.faq.title)}</h2>${d.faq.items.filter((x) => x.title.trim()).map((x) => `<details><summary>${esc(x.title)}</summary><p>${esc(x.text)}</p></details>`).join("")}</div></section>`,
    contact: () => {
      const ways = [
        booking ? `<a class="btn" href="${esc(booking)}"${ext}>${esc(d.hero.cta || "Book online")}</a>` : "",
        phone ? `<a class="btn ${booking ? "btn-line" : ""}" href="tel:${esc(phone)}">Call ${esc(d.details.phone)}</a>` : "",
        phone ? `<a class="btn btn-line" href="sms:${esc(phone)}">Send a text</a>` : "",
        email ? `<a class="btn btn-line" href="mailto:${esc(email)}">Email ${esc(email)}</a>` : "",
      ].filter(Boolean);
      return `<section id="contact" class="contact"><div class="wrap narrow"><h2>${esc(d.contact.title)}</h2><p class="body">${esc(d.contact.text)}</p><p class="actions center">${ways.join("")}</p>${d.details.area.trim() ? `<p class="small">${esc(d.details.area)}</p>` : ""}</div></section>`;
    },
  };

  const nav = on
    .filter((k) => NAV_LABEL[k] && k !== "contact")
    .map((k) => {
      // Use the owner's own heading when it's short enough for a menu.
      const own = ({ services: d.services.title, gallery: d.gallery.title, about: d.about.title, faq: d.faq.title } as Partial<Record<SectionKind, string>>)[k]?.trim() ?? "";
      const label = own && own.length <= 16 ? own : NAV_LABEL[k]!;
      return `<a href="#${k === "steps" ? "how" : k}">${esc(label)}</a>`;
    })
    .join("");

  const body = on.map((k) => section[k]()).join("\n");
  const year = new Date().getFullYear();

  const css = `
:root{--r:${RADIUS[font.id] ?? "10px"};--bg:${pal.bg};--surface:${pal.surface};--alt:${pal.alt};--text:${pal.text};--muted:${pal.muted};--accent:${accent};--ink:${ink};--line:${pal.dark ? "rgba(255,255,255,.14)" : "rgba(0,0,0,.12)"};--hf:${font.heading};--bf:${font.body}}
*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--bg);color:var(--text);font-family:var(--bf);font-size:17px;line-height:1.6;-webkit-text-size-adjust:100%}
img{max-width:100%;display:block}a{color:inherit}
h1,h2,h3{font-family:var(--hf);line-height:1.2;margin:0 0 .5em}h1{font-size:clamp(2rem,5vw,3.1rem);letter-spacing:-.01em}h2{font-size:clamp(1.5rem,3.4vw,2.1rem)}h3{font-size:1.1rem}
.wrap{max-width:1080px;margin:0 auto;padding:0 20px}.narrow{max-width:760px}
.top{position:sticky;top:0;z-index:5;background:var(--surface);border-bottom:1px solid var(--line)}
.top .wrap{display:flex;align-items:center;gap:20px;min-height:64px}
.brand{font-family:var(--hf);font-weight:700;font-size:1.15rem;text-decoration:none;margin-right:auto}
.top nav{display:flex;gap:18px;font-size:.95rem}.top nav a{text-decoration:none;color:var(--muted)}.top nav a:hover{color:var(--text)}
.btn{display:inline-block;background:var(--accent);color:var(--ink);text-decoration:none;font-weight:600;padding:12px 20px;border-radius:var(--r);border:2px solid var(--accent);line-height:1.2}
.btn:hover{opacity:.9}.btn-line{background:transparent;color:var(--text);border-color:var(--line)}
.top .btn{padding:9px 14px;font-size:.92rem}
section{padding:64px 0}.alt{background:var(--alt)}
.hero{padding:72px 0}.eyebrow{text-transform:uppercase;letter-spacing:.08em;font-size:.8rem;color:var(--muted);margin:0 0 12px;font-weight:600}
.lead{font-size:1.15rem;color:var(--muted);max-width:36em}.actions{display:flex;flex-wrap:wrap;gap:12px;margin:24px 0 0}.center{justify-content:center}
.hero-split .wrap{display:grid;grid-template-columns:1.1fr 1fr;gap:48px;align-items:center}
.hero-img{width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:var(--r)}
.hero-banner{position:relative;color:#fff;min-height:440px;display:flex;align-items:center;background:#1d2228;overflow:hidden}
.hero-banner .hero-img{position:absolute;inset:0;height:100%;aspect-ratio:auto;border-radius:0}
.hero-banner .hero-img.ph{border:0}
.hero-banner::after{content:"";position:absolute;inset:0;background:rgba(10,12,16,.55)}
.hero-banner .wrap{position:relative;z-index:1;width:100%}.hero-banner .lead,.hero-banner .eyebrow{color:rgba(255,255,255,.88)}
.hero-banner .btn-line{color:#fff;border-color:rgba(255,255,255,.6)}
.hero-banner.no-photo{background:var(--accent);color:var(--ink);min-height:0}.hero-banner.no-photo::after{display:none}
.hero-banner.no-photo .lead,.hero-banner.no-photo .eyebrow{color:var(--ink);opacity:.85}.hero-banner.no-photo .btn{background:var(--ink);color:var(--accent);border-color:var(--ink)}
.hero-banner.no-photo .btn-line{background:transparent;color:var(--ink);border-color:var(--ink)}
.hero-plain{background:var(--alt);text-align:center}.hero-plain .lead{margin:0 auto}.hero-plain .actions{justify-content:center}
.intro{color:var(--muted);max-width:40em;margin:0 0 28px}
.cards{list-style:none;padding:0;margin:0;display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:16px}
.card{background:var(--surface);border:1px solid var(--line);border-top:4px solid var(--accent);border-radius:var(--r);padding:22px}.card p{margin:0;color:var(--muted)}
.steps{list-style:none;padding:0;margin:0;display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:24px;counter-reset:s}
.step{counter-increment:s;padding-top:52px;position:relative}.step::before{content:counter(s);position:absolute;top:0;left:0;width:38px;height:38px;border-radius:50%;background:var(--accent);color:var(--ink);display:grid;place-items:center;font-weight:700}
.step p{margin:0;color:var(--muted)}
.about{display:grid;grid-template-columns:1.2fr 1fr;gap:48px;align-items:center}.body{max-width:40em}
.about-img{width:100%;aspect-ratio:1/1;object-fit:cover;border-radius:var(--r)}
.gallery{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px}.tile{width:100%;aspect-ratio:1/1;object-fit:cover;border-radius:var(--r)}
.area{display:flex;flex-wrap:wrap;gap:32px;justify-content:space-between;align-items:flex-start}.hours{background:var(--surface);border:1px solid var(--line);border-radius:10px;padding:18px 22px;margin:0;min-width:220px}
details{border-bottom:1px solid var(--line);padding:14px 0}summary{cursor:pointer;font-weight:600;font-family:var(--hf)}details p{margin:10px 0 0;color:var(--muted)}
.contact{text-align:center}.contact .body{margin:0 auto}.small{font-size:.9rem;color:var(--muted);margin-top:20px}
.ph{background:color-mix(in srgb,var(--accent) 16%,var(--alt));display:grid;place-items:center;text-align:center;padding:16px;color:var(--muted);font-size:.85rem;font-style:italic}.ph span::before{content:"";display:block;width:34px;height:26px;margin:0 auto 10px;border:2px solid currentColor;border-radius:6px;opacity:.55}
.hero-banner .ph{background:color-mix(in srgb,var(--accent) 35%,#20252c);color:rgba(255,255,255,.75)}.hero-banner .ph span{position:absolute;bottom:16px;right:20px;z-index:2}.hero-banner .ph span::before{display:none}
footer{border-top:1px solid var(--line);padding:28px 0;color:var(--muted);font-size:.9rem}
a:focus-visible,summary:focus-visible{outline:3px solid var(--accent);outline-offset:3px}
.skip{position:absolute;left:-9999px;top:8px;z-index:10;background:var(--surface);color:var(--text);padding:10px 14px;border-radius:var(--r)}.skip:focus{left:12px}
section{scroll-margin-top:72px}
/* Layout character: the same sections, set differently for each kind of business. */
.l-onsite .cards{grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:0 28px}
.l-onsite .card{background:none;border:0;border-left:4px solid var(--accent);border-radius:0;padding:6px 0 6px 18px;margin:0 0 22px}
.l-remote .cards{grid-template-columns:1fr;gap:0;max-width:820px}
.l-remote .card{display:grid;grid-template-columns:minmax(180px,1fr) 2fr;gap:20px;background:none;border:0;border-bottom:1px solid var(--line);border-radius:0;padding:20px 0}.l-remote .card h3{margin:0}
.l-orders #services h2,.l-orders #services .intro{text-align:center;margin-left:auto;margin-right:auto}
.l-orders .cards{grid-template-columns:1fr;max-width:720px;margin:0 auto;gap:0}
.l-orders .card{background:none;border:0;border-bottom:2px dotted var(--line);border-radius:0;padding:18px 0;text-align:center}
.l-portfolio .gallery{grid-template-columns:repeat(3,1fr)}.l-portfolio .gallery>:first-child{grid-column:span 2;grid-row:span 2}
.l-portfolio h2,.l-portfolio .hero h1{letter-spacing:-.02em}
.l-appointment .steps .step::before{border-radius:var(--r)}
.f-elegant h2,.f-classic h2{font-weight:500}.f-elegant .eyebrow,.f-classic .eyebrow{letter-spacing:.16em}
.f-friendly h1,.f-friendly h2{font-weight:800}
@media (max-width:760px){body{font-size:16px}section{padding:44px 0}.hero{padding:48px 0}
.top .wrap{flex-wrap:wrap;gap:10px 16px;padding-top:10px;padding-bottom:10px}.top nav{order:3;width:100%;overflow-x:auto;gap:18px;padding-bottom:4px;white-space:nowrap}.top nav a{display:inline-block;padding:6px 0}
.l-remote .card{grid-template-columns:1fr;gap:6px}.l-portfolio .gallery{grid-template-columns:1fr 1fr}.hero-split .wrap,.about{grid-template-columns:1fr;gap:28px}.hero-banner{min-height:380px}.btn{width:100%;text-align:center}.top .btn{width:auto}.gallery{grid-template-columns:1fr 1fr}}
`.trim();

  const description = d.hero.intro.trim() || d.details.tagline.trim();

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="${pal.dark ? "dark" : "light"}">
<title>${esc(name)}${d.details.tagline.trim() ? ` | ${esc(d.details.tagline)}` : ""}</title>
<meta name="description" content="${esc(description)}">
<style>${css}</style>
</head>
<body class="l-${d.layout} f-${font.id}">
<a class="skip" href="#main">Skip to content</a>
<header class="top"><div class="wrap"><a class="brand" href="#top">${esc(name)}</a><nav aria-label="Sections">${nav}</nav><a class="btn" href="${esc(ctaHref)}"${ext}>${esc(d.hero.cta || "Get in touch")}</a></div></header>
<main id="main">
${body}
</main>
<footer><div class="wrap">&copy; ${year} ${esc(name)}${d.details.area.trim() ? ` · ${esc(d.details.area)}` : ""}</div></footer>
</body>
</html>
`;
}
