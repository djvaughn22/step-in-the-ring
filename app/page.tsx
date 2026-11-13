// THE FRONT DOOR: website help for small businesses, with the free website
// starter one click away (overnight brief, 2026-11-12; starter since 2026-11-11).
//
// The make-with-AI front door that used to live here moved, whole, to /make
// (app/make/page.tsx). /create is still the full-screen workbench.

import type { Metadata } from "next";
import StarterHome from "./starter/StarterHome";
import { PRICE_RANGE } from "./services/offers";

const DESCRIPTION =
  `Websites for solo owners and small businesses, ${PRICE_RANGE}, with a written quote first. Or make your own with the website starter, no account.`;

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
