"use client";

// ─────────────────────────────────────────────────────────────────────────────
// KEEP GOING.
//
// The homepage asks everyone the same question, which is right for a stranger
// and wrong for somebody who was here yesterday. A person with a Build in
// progress who lands on a cold creation box will start a SECOND one rather
// than continue the first — the product would be quietly losing their work to
// its own front door.
//
// So: after the page is up, ask the Build API whether this browser belongs to
// somebody with builds. If it does, offer to continue the most recent one —
// but the front door never prints the Build's title, stage, or next-move
// text. Home is the product's front door: safe to open in a meeting, show
// someone, or screenshot. Specific project detail belongs on /builds or
// inside the Build itself, after the person chooses to continue.
//
// Deliberately progressive enhancement, not a server session read:
//   - the homepage stays static and fast for the stranger it is written for
//   - a signed-out visitor sees nothing new and loses nothing
//   - a failure of any kind is silent. This is an offer, never a gate, and it
//     must never be able to keep somebody from the box.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import Link from "next/link";
import type { BuildRecordV1 } from "./build";

/** The card itself, kept separate from data-fetching so it's directly
 *  testable: given a Build, it never renders its title or status. */
export function KeepGoingCard({ latest }: { latest: BuildRecordV1 }) {
  return (
    <div className="continue-strip">
      <p className="continue-strip-text">Continue your latest build.</p>
      <div className="continue-strip-actions">
        <Link className="btn btn-gold btn-small" href={`/builds/${latest.id}`}>
          Continue →
        </Link>
        <Link className="btn btn-ghost btn-small" href="/builds">
          Your builds
        </Link>
      </div>
    </div>
  );
}

export default function ContinueStrip() {
  const [builds, setBuilds] = useState<BuildRecordV1[] | null>(null);

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const res = await fetch("/api/builds", { headers: { accept: "application/json" } });
        // 401 is the ordinary answer for most visitors. It is not an error.
        if (!res.ok) return;
        const data = (await res.json()) as { ok?: boolean; builds?: BuildRecordV1[] };
        if (live && data.ok && Array.isArray(data.builds) && data.builds.length) {
          setBuilds(data.builds);
        }
      } catch {
        // Offline, blocked, or no account. The box below works regardless.
      }
    })();
    return () => {
      live = false;
    };
  }, []);

  if (!builds || builds.length === 0) return null;

  // Newest first is already the API's order — the top one is what they were
  // last doing, and that is the only one worth offering to continue.
  return (
    <section className="band band-tight continue-strip-section" aria-label="Keep going">
      <KeepGoingCard latest={builds[0]} />
    </section>
  );
}
