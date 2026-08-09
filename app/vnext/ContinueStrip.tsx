"use client";

// ─────────────────────────────────────────────────────────────────────────────
// PICK UP WHERE YOU LEFT OFF.
//
// The homepage asks everyone the same question, which is right for a stranger
// and wrong for somebody who was here yesterday. A person with a Build in
// progress who lands on a cold creation box will start a SECOND one rather
// than continue the first — the product would be quietly losing their work to
// its own front door.
//
// So: after the page is up, ask the Build API whether this browser belongs to
// somebody with builds. If it does, offer the most recent one first.
//
// Deliberately progressive enhancement, not a server session read:
//   - the homepage stays static and fast for the stranger it is written for
//   - a signed-out visitor sees nothing new and loses nothing
//   - a failure of any kind is silent. This is an offer, never a gate, and it
//     must never be able to keep somebody from the box.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import Link from "next/link";
import { BUILD_STAGE_LABEL, type BuildRecordV1 } from "./build";

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
  // last doing, and that is the only one worth putting in front of them.
  const latest = builds[0];
  const others = builds.length - 1;

  return (
    <section className="home-section step-enter" style={{ marginTop: 0, marginBottom: 34 }} aria-label="Keep going">
      <div className="card card-gold">
        <div className="plan-label">Pick up where you left off</div>
        <h2 style={{ fontSize: "clamp(19px, 4.5vw, 24px)", marginBottom: 6 }}>{latest.title}</h2>
        <div className="pill-row" style={{ marginTop: 0 }}>
          <span className="pill pill-now">{BUILD_STAGE_LABEL[latest.stage]}</span>
        </div>
        {latest.currentAction && (
          <p style={{ fontSize: 14.5, color: "var(--text)", lineHeight: 1.6, margin: "12px 0 0" }}>
            <b>Right now:</b> {latest.currentAction}
          </p>
        )}
        <div className="actions" style={{ marginTop: 14 }}>
          <Link className="btn btn-gold" href={`/builds/${latest.id}`}>
            Continue →
          </Link>
          <Link className="btn btn-ghost btn-small" href="/builds">
            {others > 0 ? `All ${builds.length} builds` : "Your builds"}
          </Link>
        </div>
      </div>
      <p className="tiny" style={{ marginTop: 10 }}>
        Or start something new below.
      </p>
    </section>
  );
}
