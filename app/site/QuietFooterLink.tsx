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
// 2026-11-10 (Build it with us): Services and Request a project joined.
//
// 2026-11-10 later (owner: "fix wonky disclaimer and footer"): the full
// independence notice moved to About's Disclaimer section. This footer keeps
// a one-line independent-project note and a link to it. Links sit in three
// labelled groups, and the block lines up with the page instead of floating
// as a centred stack.
//
// Deliberately NOT added to app/OpenMirrorFooter.tsx: that file is the
// canonical, family-wide shared footer (synced from the Open Mirror hub
// repo to every satellite site) and carries the owner's locked exact-three-
// line standard. This is a separate, SITR-only line that sits above it.
// ─────────────────────────────────────────────────────────────────────────────

import Link from "next/link";
import RingMark from "./RingMark";
import TesterFeedback from "./TesterFeedback";

const GROUPS: { label: string; links: [string, string][] }[] = [
  { label: "Build it with us", links: [["/services", "Services"], ["/request", "Request a project"], ["/builds", "Made here"]] },
  { label: "Build it yourself", links: [["/create", "Create"], ["/how", "How it works"], ["/tools", "Tools"], ["/engines", "Engines"], ["/products/ready-to-build", "Ready to Build"]] },
  { label: "This site", links: [["/library", "Your work"], ["/whats-built", "What works today"], ["/everything", "Everything on this site"], ["/members/login", "Tester sign-in"]] },
];

export default function QuietFooterLink() {
  return (
    <div className="site-quiet-footer">
      <div className="sqf-in">
        <div className="sqf-about">
          <Link href="/" className="footer-brand"><RingMark />Step In The Ring</Link>
          <p className="sqf-note">
            An independent Open Mirror LLC project, run separately from the owner&apos;s employment and not
            affiliated with or endorsed by any employer.{" "}
            <Link href="/about#disclaimer" className="sqf-note-link">Read the disclaimer</Link>
          </p>
        </div>
        <nav className="sqf-groups" aria-label="Step In The Ring footer">
          {GROUPS.map((g) => (
            <div className="sqf-group" key={g.label}>
              <p className="sqf-label">{g.label}</p>
              <ul>
                {g.links.map(([href, label]) => (
                  <li key={href}><Link href={href}>{label}</Link></li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
        <div className="sqf-beta">
          <p className="site-quiet-footer-beta">
            Open beta. Keep a copy of anything important. Something off, or something you loved?
          </p>
          <TesterFeedback title="Send feedback, no account needed" />
        </div>
      </div>
    </div>
  );
}
