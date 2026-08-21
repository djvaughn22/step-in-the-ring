// THE ENGINE ROOM — where an engine actually runs.
//
// The catalog at /engines is public: a stranger has to be able to see what
// these tools are before deciding whether an account is worth making. Running
// one needs an account, and that check lives HERE, one level down, so the
// explanation and the door are not the same page.
//
// The authorization check runs HERE, on the server, before any workspace UI
// is rendered. A logged-out visitor is sent to the Owner Entrance and comes
// back to this exact URL (query string included, so planner and engine
// handoffs survive the login detour). The old client-side courtesy gate
// (AccessGate/access.ts) is gone — its codes shipped in the public bundle,
// which is not a security boundary.

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import EngineSystem from "../EngineSystem";
import { isOwnerAuthed } from "../../owner/session";
import { currentMember } from "../../members/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "The Engine Room",
  description:
    "Start creating in 1, 2, 3. Choose what to make, get the free tools, and finish a real first project.",
  robots: { index: false, follow: false, nocache: true },
};

export default async function EnginesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // Three audiences, decided on the server:
  //   owner            → the full Engine Room, owner-only engines included
  //   live member      → the Engine Room with owner-only engines hidden
  //   everyone else    → the public membership page (the free introduction)
  if (await isOwnerAuthed()) {
    return <EngineSystem />;
  }
  const member = await currentMember();
  if (member?.access.memberAccess) {
    return <EngineSystem memberMode />;
  }
  const sp = await searchParams;
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    if (typeof v === "string") qs.set(k, v);
    else if (Array.isArray(v)) for (const x of v) qs.append(k, x);
  }
  qs.set("from", "engines");
  redirect(`/membership?${qs}`);
}
