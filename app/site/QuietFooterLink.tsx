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
// 2026-11-03 (owner brief, footer cleanup): About and Contact left this row —
// the family footer directly below carries both, so they showed twice.
//
// 2026-11-10 (Build it with us): Services, Our work and Request a project
// joined the row, and the independence notice sits at the bottom of it.
//
// Deliberately NOT added to app/OpenMirrorFooter.tsx: that file is the
// canonical, family-wide shared footer (synced from the Open Mirror hub
// repo to every satellite site) and carries the owner's locked exact-three-
// line standard. This is a separate, SITR-only line that sits above it.
// ─────────────────────────────────────────────────────────────────────────────

import Link from "next/link";
import RingMark from "./RingMark";
import TesterFeedback from "./TesterFeedback";
import { INDEPENDENCE_NOTICE } from "../services/offers";

export default function QuietFooterLink() {
  return (
    <div className="site-quiet-footer">
      <Link href="/" className="footer-brand"><RingMark />Step In The Ring</Link>
      <nav aria-label="Step In The Ring footer"><Link href="/create">Create</Link><Link href="/services">Services</Link><Link href="/request">Request a project</Link><Link href="/how">How it works</Link><Link href="/tools">Tools</Link><Link href="/engines">Engines</Link><Link href="/library">Your work</Link><Link href="/builds">Made here</Link><Link href="/products/ready-to-build">Ready to Build</Link><Link href="/whats-built">What works today</Link></nav>
      <p>
        <Link href="/everything">Everything on this site</Link> · <Link href="/members/login">Tester sign-in</Link>
      </p>
      <p className="site-quiet-footer-beta">
        Open beta. Keep a copy of anything important. Something off, or something you loved?
      </p>
      <TesterFeedback title="Send feedback, no account needed" />
      {/* Owner brief, 2026-11-10: word for word, on every page. */}
      <p className="site-quiet-footer-independence">{INDEPENDENCE_NOTICE}</p>
    </div>
  );
}
