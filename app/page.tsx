// THE FRONT DOOR: the free website starter (owner, 2026-11-12: free first;
// paid help only later, as an option).
//
// The make-with-AI front door that used to live here moved, whole, to /make
// (app/make/page.tsx). /create is still the full-screen workbench.

import type { Metadata } from "next";
import StarterHome from "./starter/StarterHome";

const DESCRIPTION =
  "A free website builder for small businesses. Start from an example for your kind of work, make it yours, and download files you own. No coding, no account.";

export const metadata: Metadata = {
  title: { absolute: "Step In The Ring: get your business online, without the headache" },
  description: DESCRIPTION,
  openGraph: {
    title: "Get your business online. Without the headache.",
    description: DESCRIPTION,
    url: "https://stepinthering.com",
    siteName: "Step In The Ring",
    type: "website",
  },
};

export default function HomePage() {
  return <StarterHome />;
}
