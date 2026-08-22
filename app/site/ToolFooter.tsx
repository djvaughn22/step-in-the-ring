// ─────────────────────────────────────────────────────────────────────────────
// THE END OF A TOOL.
//
// Every creation surface here used to stop dead. You finished a sprint plan, a
// build-machine setup, a walkthrough, an engine package — and the page simply
// ended. Whatever you had just made was real, and the product had nothing to
// say about what to do with it.
//
// So one strip, at the bottom of all of them, always answering the same three
// things: where the rest of the tools are, how this becomes something you keep
// working on, and where the things you keep already live.
//
// It never claims to have saved anything. Where a surface has its own save,
// that save is above this strip and this strip does not duplicate it.
// ─────────────────────────────────────────────────────────────────────────────

import Link from "next/link";

export default function ToolFooter({
  /** One line naming what the person is holding, if the surface knows. */
  made,
}: {
  made?: string;
}) {
  return (
    <section className="toolfoot" aria-label="What next">
      <div>
        <span className="toolfoot-l">What now</span>
        <p className="toolfoot-p">
          {made
            ? `${made} Turn it into a build and it has a home, a next move, and somewhere to come back to.`
            : "Turn what you just did into a build and it has a home, a next move, and somewhere to come back to."}
        </p>
      </div>
      <div className="actions">
        <Link className="btn btn-gold btn-small" href="/create">
          Start a build from this
        </Link>
        <Link className="btn btn-ghost btn-small" href="/builds">
          Your builds
        </Link>
        <Link className="btn btn-ghost btn-small" href="/engines">
          All engines
        </Link>
      </div>
    </section>
  );
}
