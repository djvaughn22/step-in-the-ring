"use client";

// The compatibility bridge, rendered. Shows what a person made here before
// vNext and hands them the surface that already opens it.
//
// This component only reads (app/vnext/legacy.ts is read-only by law). It
// never migrates, never normalizes, and never offers to "clean up" anything.

import { useEffect, useState } from "react";
import { findLegacyWork, type LegacyFinding } from "./legacy";

export default function LegacyWork({ heading = "Your earlier work" }: { heading?: string }) {
  const [found, setFound] = useState<LegacyFinding[] | null>(null);

  useEffect(() => {
    // Browser storage can only be read after mount — same pattern the planner
    // uses to load saved plans.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFound(findLegacyWork());
  }, []);

  if (found === null || found.length === 0) return null;

  return (
    <section className="home-section" aria-label={heading}>
      <span className="kicker">{heading}</span>
      <p className="section-lead">
        Saved in this browser from before. Nothing was moved or changed — these open
        exactly where they always did.
      </p>
      <div className="ex-grid">
        {found.map((f) => (
          <a key={f.key} className="ex-card" href={f.href}>
            <span className="ex-name">
              <span aria-hidden="true">{f.emoji}</span> {f.label}
            </span>
            <span className="ex-who">
              {f.count === null
                ? "Saved here — open it to pick up where you left off"
                : `${f.count} saved`}
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}
