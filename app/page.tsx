// THE FRONT DOOR: the free website starter (owner, 2026-11-12: free first;
// paid help only later, as an option).
//
// The make-with-AI front door that used to live here moved, whole, to /make
// (app/make/page.tsx). /create is still the full-screen workbench.

import type { Metadata } from "next";
import StarterHome from "./starter/StarterHome";

const DESCRIPTION =
  "Try a challenge, learn a skill, start a small business, or make a website from one of 29 examples. See it on a phone as you go. No coding, no account.";

export const metadata: Metadata = {
  title: { absolute: "Step In The Ring: make something real, one step at a time" },
  description: DESCRIPTION,
  openGraph: {
    title: "Make something real. One step at a time.",
    description: DESCRIPTION,
    url: "https://stepinthering.com",
    siteName: "Step In The Ring",
    type: "website",
  },
};

export default function HomePage() {
  return <StarterHome />;
}
