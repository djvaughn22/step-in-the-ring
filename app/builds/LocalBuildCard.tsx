"use client";

import { useMemo } from "react";
import Link from "next/link";
import { deleteCurrentCreationIfMatches, viewOf } from "../creation/record";
import type { CreationRecordV1 } from "../creation/types";
import { shapingFromView } from "../vnext/shape";
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
  const shaping = useMemo(() => shapingFromView(viewOf(record)), [record]);
  const resumeHref = `/create?idea=${encodeURIComponent(record.originalIdea.slice(0, 600))}`;
  return (
    <article className="buildcard">
      <span className="bc-stage">Only in this browser</span>
      <h2 className="bc-name">{shaping.title}</h2>
      <p className="bc-read">{shaping.reading}</p>
      <div className="bc-foot">
        <Link className="btn btn-gold" href={resumeHref}>
          Continue
        </Link>
        <DeleteBuildControl
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
