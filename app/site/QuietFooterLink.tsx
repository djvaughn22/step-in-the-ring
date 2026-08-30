// ─────────────────────────────────────────────────────────────────────────────
// THE QUIET FOOTER LINE.
//
// 2026-08-30 nav simplification: "Everything" (the full site directory) was
// removed from the primary header chrome — it was a fifth, unrelated idea
// competing with the two things people actually reach for occasionally (How,
// Account). The route is real and untouched; this is its one remaining
// promotion, sitewide, below the fold, for transparency and compatibility
// with anything that used to expect it in the nav.
//
// 2026-08-30 lower-page cleanup: the open-beta safety line and the feedback
// link used to live in a "closing" section at the bottom of Home only,
// alongside a second, duplicate "Start something" button. That whole
// section is gone (see RingApp.tsx) — the safety line belongs on every
// page, not just Home, so it moved here instead of being Home's problem to
// repeat.
//
// Deliberately NOT added to app/OpenMirrorFooter.tsx: that file is the
// canonical, family-wide shared footer (synced from the Open Mirror hub
// repo to every satellite site) and carries the owner's locked exact-three-
// line standard. This is a separate, SITR-only line that sits above it.
// ─────────────────────────────────────────────────────────────────────────────

import Link from "next/link";

export default function QuietFooterLink() {
  return (
    <div className="site-quiet-footer">
      <p>
        <Link href="/everything">Everything on this site</Link>
      </p>
      <p className="site-quiet-footer-beta">
        Open beta. Keep a copy of anything important.{" "}
        <Link href="/account#feedback">Send feedback</Link>.
      </p>
    </div>
  );
}
