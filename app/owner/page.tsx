// The Owner Entrance — one login for every private Step In The Ring room.
//
// The authorization check runs HERE, on the server. A logged-out visitor gets
// only the login shell; a logged-in owner gets the hub, or is forwarded to
// the private destination they originally asked for (?to=…, validated by
// safeReturnTo so this page can never act as an open redirect).

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { safeReturnTo } from "./gate";
import { isOwnerAuthed, ownerConfigured } from "./session";
import OwnerLogin from "./OwnerLogin";
import OwnerHub from "./OwnerHub";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Owner Entrance",
  robots: { index: false, follow: false, nocache: true },
};

export default async function OwnerPage({ searchParams }: { searchParams: Promise<{ to?: string }> }) {
  const { to } = await searchParams;
  const returnTo = safeReturnTo(to);
  if (await isOwnerAuthed()) {
    if (returnTo !== "/owner") redirect(returnTo);
    return <OwnerHub />;
  }
  return <OwnerLogin configured={ownerConfigured()} returnTo={returnTo} />;
}
