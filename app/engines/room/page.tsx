// THE ENGINE ROOM — where an engine actually runs.
//
// Open to anyone, no account. Work saves to this browser (see app/engines/
// store.ts — "Local-first project memory. Saved on this device."). The only
// thing the server checks is whether the visitor is the OWNER, which decides
// nothing about entry — only whether the owner-only engines are in the list.
//
// The old member-paywall here — sending an anonymous visitor to /membership
// without live paid access — is gone. Membership is now optional and about
// cross-device account sync, not about unlocking the tools — see
// app/membership/page.tsx.

import type { Metadata } from "next";
import EngineSystem from "../EngineSystem";
import { isOwnerAuthed } from "../../owner/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "The Engine Room",
  description:
    "Start creating in 1, 2, 3. Choose what to make, get the free tools, and finish a real first project.",
  robots: { index: false, follow: false, nocache: true },
};

export default async function EnginesPage() {
  // Two audiences, decided on the server:
  //   owner        → the full Engine Room, owner-only engines included
  //   everyone else → the same Engine Room, owner-only engines hidden
  if (await isOwnerAuthed()) {
    return <EngineSystem />;
  }
  return <EngineSystem memberMode />;
}
