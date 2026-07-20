// The Etsy listing — everything the owner needs at the Etsy New Listing
// screen, prepared here first so Etsy is the destination, not the workspace.
//
// Every field is deterministic and honest: suggestions come only from what
// the creator actually said (their idea, product type, audience). Nothing
// invents materials, production claims, or marketing language.

import type { EtsyCreativePackageV1 } from "../../creation/etsy-package";

export const ETSY_NEW_LISTING_URL = "https://www.etsy.com/your/shops/me/tools/listings/create";

/** Etsy's published listing rules. */
export const TITLE_MAX = 140;
export const TAG_MAX_COUNT = 13;
export const TAG_MAX_LEN = 20;

export type WhoMade = "" | "I did" | "A member of my shop" | "Another company or person";
export type WhenMade = "" | "Made to order" | "2020s" | "Before 2020";

export interface EtsyListingState {
  title: string;
  description: string;
  tags: string[];
  category: string;
  price: string; // Kept as text — it's the owner's number, edited in place.
  digitalOrPhysical: "digital" | "physical" | "undecided";
  whoMade: WhoMade;
  whenMade: WhenMade;
  isSupply: boolean;
  productionPartner: boolean;
  personalization: boolean;
  personalizationNote: string;
  quantity: string;
  materials: string;
  dimensionsNote: string;
  digitalFileNote: string;
  shippingNote: string;
  approvedAt?: string;
  packDownloadedAt?: string;
}

const CATEGORY_BY_TYPE: Array<[string, string]> = [
  ["printable", "Digital Prints"],
  ["digital", "Digital Prints"],
  ["sticker", "Stickers, Labels & Tags > Stickers"],
  ["shirt", "Clothing > Shirts & Tees"],
  ["mug", "Home & Living > Kitchen & Dining > Drinkware > Mugs"],
  ["card", "Paper & Party Supplies > Greeting Cards"],
  ["journal", "Books, Movies & Music > Books > Blank Books > Journals & Notebooks"],
  ["tote", "Bags & Purses > Totes"],
  ["print", "Art & Collectibles > Prints"],
];

const PRICE_BY_TYPE: Array<[string, string]> = [
  ["printable", "4.99"],
  ["digital", "4.99"],
  ["sticker", "3.99"],
  ["shirt", "19.99"],
  ["mug", "14.99"],
  ["card", "4.99"],
  ["journal", "12.99"],
];

function byType<T>(table: Array<[string, T]>, productType: string, fallback: T): T {
  const lower = productType.toLowerCase();
  for (const [key, value] of table) {
    if (lower.includes(key)) return value;
  }
  return fallback;
}

/** Suggested tags from the creator's own words. ≤13 tags, ≤20 chars each. */
export function suggestTags(pkg: EtsyCreativePackageV1): string[] {
  const tags: string[] = [];
  const push = (t: string) => {
    const clean = t.toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim().slice(0, TAG_MAX_LEN).trim();
    if (clean.length >= 3 && !tags.includes(clean) && tags.length < TAG_MAX_COUNT) tags.push(clean);
  };

  const type = pkg.product.type.toLowerCase();
  if (type.includes("sticker")) ["sticker", "vinyl sticker", "laptop sticker"].forEach(push);
  if (type.includes("printable") || type.includes("digital")) ["printable", "digital download", "instant download"].forEach(push);
  if (type.includes("shirt")) ["t shirt", "graphic tee"].forEach(push);
  if (type.includes("mug")) ["mug", "coffee mug"].forEach(push);
  if (type.includes("card")) ["greeting card"].forEach(push);
  if (type.includes("journal")) ["journal", "notebook"].forEach(push);

  if (pkg.idea.audience) push(pkg.idea.audience);
  if (pkg.idea.occasion) push(pkg.idea.occasion);

  // Meaningful words from the subject line, longest first.
  const stop = new Set(["the", "and", "for", "with", "who", "that", "this", "every", "a", "an", "of", "his", "her", "their", "your", "him", "them", "is", "on", "in", "to"]);
  const words = pkg.idea.subject.toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/)
    .filter((w) => w.length >= 3 && !stop.has(w));
  words.slice(0, 4).forEach(push);
  if (words.length >= 2) push(`${words[0]} ${words[1]}`);

  push("gift");
  return tags;
}

/** Initial listing from an approved package. Every field stays editable. */
export function prefillListing(pkg: EtsyCreativePackageV1): EtsyListingState {
  const isDigital = pkg.product.digitalOrPhysical === "digital";
  const title = [pkg.idea.name, pkg.product.type && !pkg.idea.name.toLowerCase().includes(pkg.product.type.toLowerCase()) ? pkg.product.type : ""]
    .filter(Boolean).join(" — ").slice(0, TITLE_MAX);

  const lines = [
    pkg.idea.subject,
    "",
    pkg.idea.designText ? `The design reads: "${pkg.idea.designText}"` : "",
    pkg.idea.audience || pkg.idea.occasion
      ? `Made for ${[pkg.idea.audience, pkg.idea.occasion].filter(Boolean).join(" — ")}.`
      : "",
    "",
    isDigital
      ? `WHAT YOU GET\nOne ${pkg.artwork.mimeType === "image/png" ? "PNG" : "JPG"} file, ${pkg.artwork.width} × ${pkg.artwork.height} pixels. This is a digital download — no physical item ships.`
      : "",
  ].filter((l, i, arr) => l !== "" || arr[i - 1] !== "");

  return {
    title,
    description: lines.join("\n").trim(),
    tags: suggestTags(pkg),
    category: byType(CATEGORY_BY_TYPE, pkg.product.type, "Art & Collectibles"),
    price: byType(PRICE_BY_TYPE, pkg.product.type, "9.99"),
    digitalOrPhysical: pkg.product.digitalOrPhysical,
    whoMade: "",
    whenMade: "",
    isSupply: false,
    productionPartner: false,
    personalization: false,
    personalizationNote: "",
    quantity: isDigital ? "999" : "",
    materials: "",
    dimensionsNote: "",
    digitalFileNote: isDigital
      ? `1 ${pkg.artwork.mimeType === "image/png" ? "PNG" : "JPG"}, ${pkg.artwork.width}×${pkg.artwork.height}px`
      : "",
    shippingNote: "",
  };
}

/** What still blocks approval (errors) and what deserves a look (warnings). */
export function validateListing(s: EtsyListingState): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!s.title.trim()) errors.push("The listing needs a title.");
  if (s.title.length > TITLE_MAX) errors.push(`The title is over Etsy's ${TITLE_MAX}-character limit.`);
  if (!s.description.trim()) errors.push("The listing needs a description.");
  if (s.tags.length === 0) errors.push("Add at least one tag.");
  if (s.tags.some((t) => t.length > TAG_MAX_LEN)) errors.push(`Every tag must be ${TAG_MAX_LEN} characters or fewer.`);
  if (s.tags.length > TAG_MAX_COUNT) errors.push(`Etsy allows at most ${TAG_MAX_COUNT} tags.`);
  const price = Number(s.price);
  if (!Number.isFinite(price) || price <= 0) errors.push("Set a price above zero.");
  if (s.digitalOrPhysical === "undecided") errors.push("Decide: digital download or physical product.");
  if (!s.whoMade) errors.push("Etsy asks who made it.");
  if (!s.whenMade) errors.push("Etsy asks when it was made.");

  if (s.digitalOrPhysical === "physical") {
    if (!s.quantity.trim() || !Number.isFinite(Number(s.quantity)) || Number(s.quantity) < 1) {
      errors.push("Set the quantity you can actually fulfil.");
    }
    if (!s.materials.trim()) warnings.push("Materials are empty — Etsy shows them for physical products. Only list materials you'll really use.");
    warnings.push("Physical product: you'll set up shipping (weight, size, price) on Etsy — have those numbers ready.");
  }
  if (s.digitalOrPhysical === "digital" && !s.digitalFileNote.trim()) {
    warnings.push("Say what file the buyer gets.");
  }
  if (s.productionPartner) {
    warnings.push("Production partner: Etsy requires declaring the partner in Shop Manager before publishing.");
  }
  if (s.personalization && !s.personalizationNote.trim()) {
    warnings.push("Personalization is on — write the instructions buyers will see.");
  }
  return { errors, warnings };
}

/** listing.txt — in roughly the order Etsy's New Listing screen asks. */
export function buildListingTxt(s: EtsyListingState, pkg: EtsyCreativePackageV1): string {
  const lines = [
    "ETSY LISTING — prepared in the Step In The Ring Design Shop",
    "",
    `PRODUCT TYPE\n${pkg.product.type} (${s.digitalOrPhysical})`,
    "",
    `SUGGESTED CATEGORY\n${s.category}`,
    "",
    `TITLE\n${s.title}`,
    "",
    `DESCRIPTION\n${s.description}`,
    "",
    `TAGS (${s.tags.length} of ${TAG_MAX_COUNT})\n${s.tags.join(", ")}`,
    "",
    `PRICE\n$${s.price}`,
  ];
  if (s.materials.trim()) lines.push("", `MATERIALS\n${s.materials}`);
  lines.push(
    "",
    "PRODUCTION DETAILS",
    `Who made it: ${s.whoMade || "(answer on Etsy)"}`,
    `When: ${s.whenMade || "(answer on Etsy)"}`,
    `What is it: ${s.isSupply ? "A supply or tool" : "A finished product"}`,
    `Production partner: ${s.productionPartner ? "Yes — declare the partner in Etsy Shop Manager" : "No"}`,
  );
  if (s.personalization) {
    lines.push(`Personalization: Yes — ${s.personalizationNote || "(write buyer instructions)"}`);
  }
  if (s.digitalOrPhysical === "digital") {
    lines.push("", `DIGITAL FILES\n${s.digitalFileNote || "Upload the image from the images folder."}`);
  } else {
    lines.push("", `QUANTITY\n${s.quantity || "(set on Etsy)"}`);
    if (s.dimensionsNote.trim()) lines.push("", `DIMENSIONS\n${s.dimensionsNote}`);
    lines.push("", "SHIPPING\nSet up shipping on Etsy: package weight, size, processing time, and who pays.");
  }
  return lines.join("\n") + "\n";
}

export function buildReadmeTxt(): string {
  return [
    "ETSY PACK — how to use it",
    "",
    "1. Upload the images from the images folder.",
    "2. Select the suggested category (see listing.txt).",
    "3. Paste the title.",
    "4. Paste the description.",
    "5. Add the tags.",
    "6. Confirm the price and product details.",
    "7. Save as draft on Etsy and review before publishing.",
    "",
    "Nothing is published automatically. Etsy's editor is the final word.",
  ].join("\n") + "\n";
}

/** listing.json — the same package, structured, for records and re-import. */
export function buildListingJson(s: EtsyListingState, pkg: EtsyCreativePackageV1): string {
  return JSON.stringify(
    {
      version: 1,
      preparedAt: new Date().toISOString(),
      creationId: pkg.creationId,
      product: { type: pkg.product.type, digitalOrPhysical: s.digitalOrPhysical },
      listing: {
        title: s.title,
        description: s.description,
        tags: s.tags,
        category: s.category,
        price: s.price,
        quantity: s.quantity || undefined,
        materials: s.materials || undefined,
        whoMade: s.whoMade,
        whenMade: s.whenMade,
        isSupply: s.isSupply,
        productionPartner: s.productionPartner,
        personalization: s.personalization ? s.personalizationNote : undefined,
      },
      artwork: {
        filename: pkg.artwork.filename,
        mimeType: pkg.artwork.mimeType,
        width: pkg.artwork.width,
        height: pkg.artwork.height,
      },
    },
    null,
    2,
  );
}
