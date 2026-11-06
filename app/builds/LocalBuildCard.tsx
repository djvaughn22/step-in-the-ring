"use client";

import { deleteCurrentCreationIfMatches } from "../creation/record";
import type { CreationRecordV1 } from "../creation/types";
import { DeleteBuildControl } from "./DeleteBuildControl";

/**
 * The one browser-local creation — `sitr-creation-current-v1` — shown and
 * made deletable in its own right. Distinct section from the account list
 * on purpose: it is not the same storage, and deleting it never touches an
 * account Build (or vice versa; see the reconciliation in BuildsClient).
 */
export default function LocalBuildCard({
  record,
  onDeleted,
}: {
  record: CreationRecordV1;
  onDeleted: () => void;
}) {
  // Opens the workspace from this browser's copy. Never the idea in the URL:
  // a query string reaches analytics, and we say we don't count what you type.
  const resumeHref = "/create?open=workspace";
  const said = record.originalIdea.replace(/\s+/g, " ").trim();
  return (
    <article className="buildcard">
      <span className="bc-stage">Only in this browser</span>
      {/* Their words, not a title the rules made up ("Church Something"). */}
      <h2 className="bc-name">{said.length > 140 ? `${said.slice(0, 137).trimEnd()}…` : said}</h2>
      <div className="bc-foot">
        {/* A plain link on purpose: see app/site/arrival.ts. */}
        <a className="btn btn-gold" href={resumeHref}>
          Continue
        </a>
        <DeleteBuildControl
          label="Delete this"
          onConfirm={async () => {
            const ok = deleteCurrentCreationIfMatches(record.creationId);
            if (ok) onDeleted();
            return ok;
          }}
        />
      </div>
    </article>
  );
}
