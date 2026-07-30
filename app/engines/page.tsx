// The Engine Room — owner-only since the shared owner gate landed.
//
// The authorization check runs HERE, on the server, before any workspace UI
// is rendered. A logged-out visitor is sent to the Owner Entrance and comes
// back to this exact URL (query string included, so planner and engine
// handoffs survive the login detour). The old client-side courtesy gate
// (AccessGate/access.ts) is gone — its codes shipped in the public bundle,
// which is not a security boundary.

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import EngineSystem from "./EngineSystem";
import { isOwnerAuthed } from "../owner/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Engine Room",
  description:
    "Start creating in 1, 2, 3. Choose what to make, get the free tools, and finish a real first project.",
  robots: { index: false, follow: false, nocache: true },
};

export default async function EnginesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (!(await isOwnerAuthed())) {
    const sp = await searchParams;
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(sp)) {
      if (typeof v === "string") qs.set(k, v);
      else if (Array.isArray(v)) for (const x of v) qs.append(k, x);
    }
    const dest = qs.size ? `/engines?${qs}` : "/engines";
    redirect(`/owner?to=${encodeURIComponent(dest)}`);
  }
  return <EngineSystem />;
}
