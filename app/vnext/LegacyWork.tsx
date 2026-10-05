"use client";

// The compatibility bridge, rendered. Shows what a person made here before
// vNext and hands them the surface that already opens it.
//
// This component only reads (app/vnext/legacy.ts is read-only by law). It
// never migrates, never normalizes, and never offers to "clean up" anything.

import { useEffect, useState } from "react";
import { findLegacyWork, type LegacyFinding } from "./legacy";

export default function LegacyWork({
  heading = "Your earlier work",
  note = "Saved in this browser from before. Nothing was moved or changed — these open exactly where they always did.",
  empty = null,
  skip = [],
}: {
  /** Storage keys this page already shows in its own way. */
  skip?: string[];
  heading?: string;
  /** Shown instead, once storage has been read and nothing was found. */
  empty?: React.ReactNode;
  /** The line under the heading. Both live in here, not in the parent, so the
   *  whole section disappears when there is nothing — a heading with an empty
   *  space under it reads like something failed to load. */
  note?: string;
}) {
  const [found, setFound] = useState<LegacyFinding[] | null>(null);

  useEffect(() => {
    // Browser storage can only be read after mount — same pattern the planner
    // uses to load saved plans.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFound(findLegacyWork().filter((f) => !skip.includes(f.key)));
    // skip is a literal list at each call site
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (found === null) return null;
  if (found.length === 0) return <>{empty}</>;

  return (
    <section className="band" aria-label={heading}>
      <div className="band-head">
        <h2 className="band-title">{heading}</h2>
        <p className="band-note">{note}</p>
      </div>
      <div className="ex-grid">
        {found.map((f) => (
          <a key={f.key} className="ex-card" href={f.href}>
            <span className="ex-name">
              <span aria-hidden="true">{f.emoji}</span> {f.label}
            </span>
            {f.title && <span className="ex-title">“{f.title}”</span>}
            <span className="ex-who">
              {f.count === null
                ? "Saved here — open it to pick up where you left off"
                : f.title
                  ? `${f.count} saved · latest shown`
                  : `${f.count} saved`}
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}
