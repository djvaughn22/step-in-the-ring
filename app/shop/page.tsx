import type { Metadata } from "next";
import ShopPreview from "./ShopPreview";

export const metadata: Metadata = {
  title: "Shop",
  description: "Original products made in the Step In The Ring Design Shop, sold on Etsy.",
  // No products are listed yet — keep the page out of search until they are.
  robots: { index: false, follow: false },
};

export default function ShopPage() {
  return <ShopPreview />;
}
