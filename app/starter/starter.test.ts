// The website starter (owner brief, 2026-11-11): 22 examples on one system,
// honest sample content, one safe renderer, and a download that's really yours.
import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { EXAMPLES, EXAMPLE_GROUPS, exampleBySlug } from "./examples";
import { LAYOUTS, PALETTES, draftFromExample, inkOn, parseDraft, replaceEverywhere } from "./draft";
import { renderSite } from "./render";
import { crc32, exportEntries, makeZip, readme, zipName } from "./zip";
import { pageAt } from "../site/registry";

const OWNER_LIST = [
  "Private Pilates instructor", "Personal trainer", "Yoga instructor", "Mobile dog groomer",
  "Dog walker or pet sitter", "House cleaner", "Handyman", "House painter",
  "Lawn care and landscaping", "Mobile auto detailer", "Photographer", "Tutor",
  "Music teacher", "Hair stylist or barber", "Makeup artist", "Licensed massage therapist",
  "Mobile notary", "Home organizer", "Bookkeeper", "Virtual assistant",
  "Home bakery or small caterer", "Appliance repair service",
];

const sampleText = (slug: string) => JSON.stringify(exampleBySlug(slug)!.sample);

describe("the 22 examples", () => {
  it("are exactly the owner's list, each once", () => {
    expect(EXAMPLES.map((e) => e.name).sort()).toEqual([...OWNER_LIST].sort());
    expect(new Set(EXAMPLES.map((e) => e.slug)).size).toBe(22);
    for (const e of EXAMPLES) expect(e.slug).toMatch(/^[a-z0-9-]+$/);
  });

  it("share a few layouts and every group has at least one example", () => {
    const used = new Set(EXAMPLES.map((e) => e.layout));
    expect(used.size).toBeLessThanOrEqual(Object.keys(LAYOUTS).length);
    for (const g of EXAMPLE_GROUPS) expect(EXAMPLES.some((e) => e.group === g), g).toBe(true);
    for (const e of EXAMPLES) expect(PALETTES.some((p) => p.id === e.palette), e.slug).toBe(true);
  });

  it("are tailored, not the same page with the nouns swapped", () => {
    for (const key of ["headline", "intro", "about", "areaText", "contactText"] as const) {
      const values = EXAMPLES.map((e) => e.sample[key]);
      expect(new Set(values).size, key).toBe(22);
    }
    const serviceSets = EXAMPLES.map((e) => e.sample.services.map((s) => s.title).join("|"));
    expect(new Set(serviceSets).size).toBe(22);
    // A common question ("What should I wear?") can fit two businesses; the
    // whole set of questions never repeats.
    const faqSets = EXAMPLES.map((e) => e.sample.faq.map((f) => f.title).join("|"));
    expect(new Set(faqSets).size).toBe(22);
  });

  it("invent no credentials, reviews, guarantees, prices or customers", () => {
    for (const e of EXAMPLES) {
      const t = sampleText(e.slug);
      expect(t, e.slug).not.toMatch(/certified|insured|bonded|award|guarantee|years of experience|5-star|five-star|testimonial|reviews? from|our reviews|\brated\b|best in|#1|trusted by|\$\d/i);
      expect(t, e.slug).not.toMatch(/\b(?:I am|I'm|we are|we're|fully) licensed/i);
      expect(t, e.slug).not.toMatch(/\bfree\b/i);
      expect(e.addYourself.length, e.slug).toBeGreaterThan(0);
    }
  });

  it("use fictional contact details", () => {
    for (const e of EXAMPLES) {
      const d = draftFromExample(e);
      expect(d.details.phone, e.slug).toMatch(/^\(555\) 555-01\d\d$/);
      expect(d.details.email).toBe("hello@example.com");
      if (d.details.booking) expect(d.details.booking).toMatch(/^https:\/\/example\.com\//);
    }
  });

  it("each have a public page, built from the same renderer", () => {
    expect(existsSync("app/examples/[slug]/page.tsx")).toBe(true);
    const page = readFileSync("app/examples/[slug]/page.tsx", "utf8");
    expect(page).toContain("generateStaticParams");
    expect(page).toContain("renderSite(");
    expect(page).toContain("/start/edit?example=");
    for (const p of ["/start", "/start/edit", "/examples", "/make"]) expect(pageAt(p)?.access, p).toBe("public");
  });
});

describe("the renderer", () => {
  const base = draftFromExample(EXAMPLES[0]);

  it("renders every example as a complete page with every shown section", () => {
    for (const e of EXAMPLES) {
      const d = draftFromExample(e);
      const html = renderSite(d);
      expect(html.startsWith("<!doctype html>"), e.slug).toBe(true);
      expect(html).toContain(e.sample.headline.replace(/'/g, "&#39;"));
      for (const s of d.sections.filter((x) => x.on && x.kind !== "hero")) {
        expect(html, `${e.slug} ${s.kind}`).toContain(`id="${s.kind === "steps" ? "how" : s.kind}"`);
      }
    }
  });

  it("is a usable page on its own: skip link, labelled nav, focus styles, phone menu", () => {
    const html = renderSite(base, { mode: "export" });
    expect(html).toContain('<a class="skip" href="#main">');
    expect(html).toContain('<main id="main">');
    expect(html).toContain('<nav aria-label="Sections">');
    expect(html).toContain(":focus-visible");
    expect(html).not.toMatch(/\.top nav\{display:none/);
    for (const m of html.matchAll(/href="#([a-z]+)"/g)) expect(html, m[1]).toContain(`id="${m[1]}"`);
  });

  it("gives each layout its own character", () => {
    const classes = new Set(EXAMPLES.map((e) => renderSite(draftFromExample(e)).match(/<body class="([^"]+)"/)![1]));
    expect(classes.size).toBeGreaterThanOrEqual(10);
  });

  it("needs nothing from another server and runs no scripts", () => {
    const html = renderSite(base, { mode: "export" });
    expect(html).not.toMatch(/<script|<link|@import|src="https?:/i);
  });

  it("escapes whatever the owner types", () => {
    const d = { ...base, details: { ...base.details, name: `<script>alert("x")</script>` }, hero: { ...base.hero, headline: `"><img src=x onerror=alert(1)>` } };
    const html = renderSite(d);
    expect(html).not.toContain("<script>alert");
    expect(html).not.toContain("<img src=x");
    expect(html).toContain("&lt;script&gt;");
  });

  it("drops links that aren't real web, phone or email addresses", () => {
    const d = { ...base, details: { ...base.details, booking: "javascript:alert(1)", email: "not an email", phone: "call me" } };
    const html = renderSite(d);
    expect(html).not.toContain("javascript:");
    expect(html).not.toContain("mailto:");
    expect(html).not.toContain("tel:");
  });

  it("shows empty photo spots in the preview and leaves them out of the download", () => {
    expect(renderSite(base, { mode: "preview" })).toContain('class="hero-img ph"');
    expect(renderSite(base, { mode: "export" })).not.toContain(" ph\"");
  });

  it("hides sections the owner turned off", () => {
    const d = { ...base, sections: base.sections.map((s) => (s.kind === "faq" ? { ...s, on: false } : s)) };
    expect(renderSite(d)).not.toContain('id="faq"');
  });

  it("picks readable button text for any accent", () => {
    expect(inkOn("#FFFFFF")).toBe("#111111");
    expect(inkOn("#1F5FA8")).toBe("#ffffff");
  });
});

describe("the draft", () => {
  it("carries a new business name into the wording", () => {
    const d = draftFromExample(exampleBySlug("mobile-notary")!);
    const before = d.details.name;
    const after = replaceEverywhere({ ...d, about: { ...d.about, text: `${before} is here.` } }, before, "Riverbend Notary");
    expect(after.about.text).toBe("Riverbend Notary is here.");
  });

  it("refuses a malformed saved draft instead of crashing", () => {
    expect(parseDraft(null)).toBeNull();
    expect(parseDraft({ v: 2 })).toBeNull();
    expect(parseDraft(JSON.parse(JSON.stringify(draftFromExample(EXAMPLES[3]))))).not.toBeNull();
  });
});

describe("the download", () => {
  it("writes a real zip: index.html, photos and a README", () => {
    expect(crc32(new TextEncoder().encode("hello"))).toBe(0x3610a686);
    const d = draftFromExample(EXAMPLES[0]);
    // A 1×1 PNG stands in for a photo the owner added.
    const png = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
    const withPhoto = { ...d, photos: { ...d.photos, hero: { ...d.photos.hero, src: png } } };
    const entries = exportEntries(withPhoto);
    expect(entries.map((e) => e.path)).toEqual(["index.html", "images/hero.png", "README.txt"]);
    const html = new TextDecoder().decode(entries[0].data);
    expect(html).toContain('src="images/hero.png"');
    expect(html).not.toContain("data:image");
    const zip = makeZip(entries);
    const view = new DataView(zip.buffer);
    expect(view.getUint32(0, true)).toBe(0x04034b50);
    expect(view.getUint32(zip.length - 22, true)).toBe(0x06054b50);
    expect(view.getUint16(zip.length - 12, true)).toBe(3);
    expect(zipName(d)).toMatch(/^[a-z0-9-]+-website\.zip$/);
  });

  it("packages only the photos the page shows", () => {
    const png = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
    const d = draftFromExample(exampleBySlug("bookkeeper")!); // gallery is off by default
    d.photos.gallery[0].src = png;
    d.photos.about.src = png;
    expect(exportEntries(d).map((e) => e.path)).toEqual(["index.html", "images/about.png", "README.txt"]);
  });

  it("says plainly that we don't host it", () => {
    expect(readme(draftFromExample(EXAMPLES[0]))).toContain("does not host your website");
  });
});
