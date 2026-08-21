// The Shop is a shared preview: real work, nothing listed yet, not ready to
// publish. The check runs HERE on the server before any shop UI is imported,
// so an unauthorized response never contains the page. Same shape every
// preview page uses — see app/preview/previewAuth.ts.

import type { Metadata } from "next";
import ShopPreview from "./ShopPreview";
import PreviewGate from "../preview/PreviewGate";
import { isPreviewAuthorized } from "../preview/previewAuth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Shop",
  description: "Original products made in the Step In The Ring Design Shop, sold on Etsy.",
  // Nothing is listed yet — keep the page out of search until it is.
  robots: { index: false, follow: false },
};

export default async function ShopPage() {
  if (!(await isPreviewAuthorized())) {
    return (
      <PreviewGate
        title="The Shop isn't open yet"
        what="It's being built. If someone gave you a passcode, this opens it."
        returnTo="/shop"
      />
    );
  }
  return <ShopPreview />;
}
