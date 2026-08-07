// The Author's Room — member access via Story Partner entry.
//
// Authorization check:
// 1. Member session (via middleware → /members/login) — approved members enter
// 2. OR legacy owner password (backward compat, same as owner session)
//
// An unauthorized visitor is redirected to login by middleware before reaching this page.

import type { Metadata } from "next";
import { cookies } from "next/headers";
import { ownerPassword, SESSION_COOKIE, sessionSecret, verifySessionToken } from "./auth";
import { verifyMemberSession } from "../members/session-verify";
import AuthorLogin from "./AuthorLogin";
import AuthorRoom from "./AuthorRoom";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Author's Room",
  robots: { index: false, follow: false, nocache: true },
};

export default async function AuthorPage() {
  // Check member session first (primary, no second password needed)
  const memberSession = await verifyMemberSession();
  if (memberSession) {
    return <AuthorRoom />;
  }

  // Fallback to legacy owner password (backward compat during migration)
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  const ownerAuthed = verifySessionToken(token, sessionSecret());

  if (!ownerAuthed) return <AuthorLogin configured={!!ownerPassword()} />;
  return <AuthorRoom />;
}
