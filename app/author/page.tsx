// The Author's Room — owner-only entry to Story Partner.
//
// The authorization check runs HERE, on the server, before any private UI is
// rendered. An unauthorized visitor receives only the login shell: no project
// data, no titles, no counts. (The manuscript itself never touches this
// server at all — it lives in the owner's browser — but the working room is
// still gated so the tooling, private prompts, and vault UI stay unlisted.)

import type { Metadata } from "next";
import { cookies } from "next/headers";
import { ownerPassword, SESSION_COOKIE, sessionSecret, verifySessionToken } from "./auth";
import AuthorLogin from "./AuthorLogin";
import AuthorRoom from "./AuthorRoom";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Author's Room",
  robots: { index: false, follow: false, nocache: true },
};

export default async function AuthorPage() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  const authed = verifySessionToken(token, sessionSecret());

  if (!authed) return <AuthorLogin configured={!!ownerPassword()} />;
  return <AuthorRoom />;
}
