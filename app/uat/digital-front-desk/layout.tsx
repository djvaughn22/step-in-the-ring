// Digital Front Desk UAT — shared gate for every route under this folder.
//
// This checks ONLY the feature flag, so it can 404 the whole tree before any
// child even renders. It deliberately does NOT check the owner session —
// that check belongs in each page.tsx (see app/owner/members/page.tsx for
// the existing pattern), both because app/site/registry.test.ts verifies
// owner-only pages by reading each page's own source for `isOwnerAuthed`,
// and because a layout-level redirect() would need next/navigation's
// redirect to run before metadata resolves, which is more fragile than
// letting each page redirect itself the same way the rest of the private
// site already does.
//
// Flag: DIGITAL_FRONT_DESK_UAT_ENABLED — server-only, no NEXT_PUBLIC_
// prefix. Unset or not exactly "true" and every route below 404s, matching
// how the rest of this repo's optional features fail closed.

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import styles from "./front-desk.module.css";
import { dfdUatEnabled } from "./lib/flag";

export const metadata: Metadata = {
  title: { default: "Digital Front Desk", template: "%s | Digital Front Desk" },
  robots: { index: false, follow: false, nocache: true },
};

export default function DigitalFrontDeskLayout({ children }: { children: React.ReactNode }) {
  if (!dfdUatEnabled()) notFound();
  return <div className={styles.scope}>{children}</div>;
}
