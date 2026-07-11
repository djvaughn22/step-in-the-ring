// Storefront product data — the ONLY source for what the shop page shows.
//
// Rules:
// - Only products that really exist go here. No placeholders styled as live
//   listings, no invented prices, no fake Etsy URLs.
// - A product appears publicly only with status "published" (live Etsy URL
//   required) or "coming-soon" (honestly labeled, no buy link).
// - Products come out of the Design Shop Engine: create → approve → export →
//   publish on Etsy → add the real listing URL here.
//
// This file + ShopPreview.tsx are self-contained so the same shop section can
// be dropped into the Open Mirror hub once DJ calls it polished.

export type ShopProductStatus = "published" | "coming-soon";

export interface ShopProduct {
  id: string;
  title: string;
  description: string; // Factual — what it is and who it's for.
  productType: string; // "Printable", "Card Deck", "Mug", etc.
  price?: string; // Only for published products, matching the live listing.
  etsyUrl?: string; // Real listing URL only. Required when status is "published".
  imageAlt?: string;
  imageSrc?: string; // Local /public path or real listing image.
  status: ShopProductStatus;
}

// Empty until the first real product ships from the Design Shop Engine.
export const SHOP_PRODUCTS: ShopProduct[] = [];

export const SHOP_COPY = {
  title: "The Shop",
  intro: "Original products made in the Step In The Ring Design Shop. Everything listed here is sold on Etsy.",
  emptyState: "The first products are being made in the Design Shop now. Nothing is listed yet — no fake previews, no placeholders. When a product is real, it shows up here with its Etsy link.",
};
