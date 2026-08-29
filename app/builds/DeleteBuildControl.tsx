"use client";

import { useState } from "react";

/**
 * A quiet, closed-by-default delete control for one Build card.
 *
 * Two real taps: the first opens a plain inline confirmation, the second
 * confirms. Both are native <button>s, so keyboard (Tab + Enter/Space) and
 * touch work the same way a mouse click does — nothing here is a div with
 * an onClick pretending to be a button.
 *
 * The confirmation text is fixed and generic on purpose — this component
 * never receives a title or summary, so there is nothing sensitive it
 * could repeat even by mistake.
 */
export function DeleteBuildControl({ onConfirm }: { onConfirm: () => Promise<boolean> }) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(false);

  if (!confirming) {
    return (
      <button
        type="button"
        className="btn btn-ghost btn-small bc-delete-open"
        onClick={() => setConfirming(true)}
      >
        Delete this build
      </button>
    );
  }

  return (
    <span className="bc-delete-confirm" role="group" aria-label="Confirm delete">
      <span className="tiny">Delete this? It can&apos;t be undone.</span>
      <button
        type="button"
        className="btn btn-ghost btn-small"
        disabled={deleting}
        onClick={async () => {
          setDeleting(true);
          setError(false);
          const ok = await onConfirm();
          if (!ok) {
            setDeleting(false);
            setError(true);
          }
          // On success the parent removes this card; nothing left to reset here.
        }}
      >
        {deleting ? "Deleting…" : "Yes, delete"}
      </button>
      <button
        type="button"
        className="btn btn-ghost btn-small"
        disabled={deleting}
        onClick={() => {
          setConfirming(false);
          setError(false);
        }}
      >
        Cancel
      </button>
      {error && (
        <span className="tiny" role="alert">
          That didn&apos;t delete. Try again.
        </span>
      )}
    </span>
  );
}
