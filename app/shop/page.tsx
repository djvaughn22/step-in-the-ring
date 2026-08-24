// The Shop — open to anyone. It used to sit behind the shared preview
// passcode; that door is now reserved for the one thing that actually needs
// a courtesy gate (see app/everything/page.tsx, "Somewhere else"). A
// storefront of the owner's own products is normal SITR product, not
// something that needs a passcode.

import type { Metadata } from "next";
import ShopPreview from "./ShopPreview";

export const metadata: Metadata = {
  title: "Shop",
  description: "Original products made in the Step In The Ring Design Shop, sold on Etsy.",
  // Nothing is listed yet — keep the page out of search until it is.
  robots: { index: false, follow: false },
};

export default function ShopPage() {
  return <ShopPreview />;
}
