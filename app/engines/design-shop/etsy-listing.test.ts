// The listing rules are Etsy's rules: 140-char titles, 13 tags of 20 chars,
// nothing approved while required answers are missing — and the prepared
// text must contain only what the creator actually said.
import { describe, expect, it } from "vitest";
import type { EtsyCreativePackageV1 } from "../../creation/etsy-package";
import {
  buildListingTxt, buildReadmeTxt, prefillListing, suggestTags, validateListing,
  TAG_MAX_COUNT, TAG_MAX_LEN,
} from "./etsy-listing";
import { buildZip, crc32 } from "../../lib/zip";

const pkg: EtsyCreativePackageV1 = {
  version: 1,
  source: "idontcry-dream-shop",
  creationId: "dream-abc",
  createdAt: "2026-07-19T12:00:00.000Z",
  idea: {
    name: "Dog Dad Delivery Inspector",
    subject: "A proud dog inspecting a package at the front door",
    audience: "Dog lovers",
    designText: "Inspected. Approved. Licked.",
  },
  product: { type: "Sticker", digitalOrPhysical: "physical" },
  artwork: {
    primaryAssetUrl: "https://example.public.blob.vercel-storage.com/x.png",
    mimeType: "image/png",
    filename: "dog-dad-delivery-inspector.png",
    width: 1024,
    height: 1024,
  },
  approval: { approved: true, approvedAt: "2026-07-19T12:30:00.000Z" },
};

describe("prefillListing", () => {
  it("builds an editable listing from the creator's own words only", () => {
    const s = prefillListing(pkg);
    expect(s.title).toContain("Dog Dad Delivery Inspector");
    expect(s.description).toContain("A proud dog inspecting a package");
    expect(s.description).toContain('The design reads: "Inspected. Approved. Licked."');
    // No invented marketing claims.
    for (const banned of ["handmade", "premium", "professionally", "vintage", "sustainable"]) {
      expect(s.description.toLowerCase()).not.toContain(banned);
    }
    expect(s.category).toContain("Stickers");
    expect(Number(s.price)).toBeGreaterThan(0);
  });

  it("digital products get file details in the description", () => {
    const s = prefillListing({ ...pkg, product: { type: "Printable", digitalOrPhysical: "digital" } });
    expect(s.description).toContain("digital download");
    expect(s.digitalFileNote).toContain("PNG");
  });
});

describe("suggestTags", () => {
  it("obeys Etsy's tag limits", () => {
    const tags = suggestTags(pkg);
    expect(tags.length).toBeGreaterThan(3);
    expect(tags.length).toBeLessThanOrEqual(TAG_MAX_COUNT);
    for (const t of tags) {
      expect(t.length).toBeLessThanOrEqual(TAG_MAX_LEN);
      expect(t).toBe(t.toLowerCase());
    }
    expect(new Set(tags).size).toBe(tags.length);
  });
});

describe("validateListing", () => {
  it("blocks approval while required answers are missing", () => {
    const s = prefillListing(pkg);
    const { errors } = validateListing(s);
    expect(errors.some((e) => e.includes("who made"))).toBe(true);
    expect(errors.some((e) => e.includes("when"))).toBe(true);
  });

  it("passes a complete physical listing, with a shipping reminder", () => {
    const s = { ...prefillListing(pkg), whoMade: "I did" as const, whenMade: "Made to order" as const, quantity: "10" };
    const { errors, warnings } = validateListing(s);
    expect(errors).toEqual([]);
    expect(warnings.some((w) => w.includes("shipping"))).toBe(true);
  });

  it("rejects an over-limit title and a zero price", () => {
    const s = { ...prefillListing(pkg), title: "x".repeat(150), price: "0" };
    const { errors } = validateListing(s);
    expect(errors.some((e) => e.includes("140"))).toBe(true);
    expect(errors.some((e) => e.includes("price"))).toBe(true);
  });
});

describe("listing.txt + README", () => {
  it("puts information in the order the owner needs it on Etsy", () => {
    const s = { ...prefillListing(pkg), whoMade: "I did" as const, whenMade: "2020s" as const, quantity: "10" };
    const txt = buildListingTxt(s, pkg);
    const order = ["PRODUCT TYPE", "SUGGESTED CATEGORY", "TITLE", "DESCRIPTION", "TAGS", "PRICE", "PRODUCTION DETAILS", "SHIPPING"];
    let last = -1;
    for (const section of order) {
      const at = txt.indexOf(section);
      expect(at, section).toBeGreaterThan(last);
      last = at;
    }
    expect(buildReadmeTxt()).toContain("Save as draft");
  });
});

describe("zip writer", () => {
  it("crc32 matches known vectors", () => {
    const enc = new TextEncoder();
    expect(crc32(enc.encode("123456789")).toString(16)).toBe("cbf43926");
    expect(crc32(new Uint8Array(0))).toBe(0);
  });

  it("builds a well-formed stored zip", () => {
    const enc = new TextEncoder();
    const zip = buildZip([
      { name: "README.txt", data: enc.encode("hello") },
      { name: "images/01-primary.png", data: new Uint8Array([137, 80, 78, 71]) },
    ]);
    const dv = new DataView(zip.buffer);
    expect(dv.getUint32(0, true)).toBe(0x04034b50); // local header
    expect(dv.getUint32(zip.length - 22, true)).toBe(0x06054b50); // end of central dir
    expect(dv.getUint16(zip.length - 22 + 10, true)).toBe(2); // entry count
  });
});

describe("2026-10-29: the Etsy draft claims nothing it can't back", async () => {
  const { createDesignPackageTemplate, generateEtsyListingDraft, generateProductDirections } = await import("./design-shop.engine");
  const answers = { idea: "A sticker of a grumpy cat wearing a tiny crown", customer: "cat lovers", productType: "Sticker Sheet", occasion: "Valentine's Day" };
  const [dir] = await generateProductDirections(answers.idea, answers.customer, answers.productType, "", answers.occasion);
  const draft = generateEtsyListingDraft(createDesignPackageTemplate(dir, answers), answers);
  it("leaves the IP checklist unticked", () => {
    expect(draft.ipChecklist.every((l) => l.startsWith("[ ]"))).toBe(true);
  });
  it("tells buyers of a physical sticker they get a sticker, not the maker's PNG and SVG files", () => {
    expect(draft.description).not.toMatch(/PNG|SVG/);
    expect(draft.description).toMatch(/What you get:\n- Sticker Sheet/);
  });
  it("uses phrases from the idea as tags and keeps the occasion's capitals", () => {
    expect(draft.tags).toContain("grumpy cat");
    expect(draft.tags).toContain("tiny crown");
    expect(draft.tags).not.toContain("wearing");
  });
  it("the seasonal direction names the occasion as typed", async () => {
    const dirs = await generateProductDirections(answers.idea, answers.customer, answers.productType, "", answers.occasion);
    expect(dirs[3].description).toContain("made for Valentine's Day");
  });
});
