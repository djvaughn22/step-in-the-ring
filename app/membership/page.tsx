// ─────────────────────────────────────────────────────────────────────────────
// Accounts — the public page at /membership (the path is kept so old links,
// the account redirect and middleware keep working).
//
// No sign-up (Oct 4 2026, owner direction): this page tells a visitor they
// don't need an account, and lets an invited tester sign in. There is no
// account-creation form here or anywhere public.
//
// Usefulness-first (Oct 1 2026, owner direction): nothing is sold here. This
// page never shows a price, billing terms, a checkout button or "membership"
// sales copy. It says what is free (everything), what an optional account
// adds (sync between devices), and that accounts are invite-only while they
// are tested. The dormant Stripe plumbing in app/members/ is untouched and
// has no way in from this page.
// ─────────────────────────────────────────────────────────────────────────────

import type { Metadata } from "next";
import Link from "next/link";
import { currentMember } from "../members/session";
import { memberStoreConfigured } from "../members/store";
import MembershipClient from "./MembershipClient";
import { Sheet, PageHead, Section } from "../site/ui";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "No account needed",
  description:
    "Everything in Step In The Ring is free to use with no account. Your work is kept in your browser.",
};

const FREE_ALWAYS = [
  "Every engine in the Engine Room, run end to end, with no sign-in",
  "The free tools: the Five Hour Sprint planner, first-version cutter, try-it script, one-line explainer and launch checklist",
  "The Build Machine guide and the Ready to Build computer check",
  "Starting an idea here, or carrying one in from iDontCry",
  "Work saves to this browser as you go — it's there when you come back on this device",
];


export default async function MembershipPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const configured = memberStoreConfigured();
  const member = await currentMember();
  const prefillEngine = typeof sp.engine === "string" ? sp.engine : null;
  const prefillIdea = typeof sp.idea === "string" ? sp.idea.slice(0, 500) : null;
  const source = typeof sp.source === "string" ? sp.source.slice(0, 40) : null;
  // A handoff that bounced here keeps its payload — the person continues
  // into the exact engine they were headed for, creation record included.
  const enginesQs = new URLSearchParams();
  if (prefillEngine) enginesQs.set("engine", prefillEngine);
  if (typeof sp.cr === "string") enginesQs.set("cr", sp.cr);
  const enginesHref = enginesQs.size ? `/engines/room?${enginesQs}` : "/engines/room";

  return (
    <Sheet>
      <PageHead
        kicker="Accounts"
        title="No account needed"
        lead="Everything on Step In The Ring is free and open right now. Your work is kept in this browser as you go, and it's all in Your work when you come back. Your ideas, projects, and output remain yours."
      />

      <Section title="Free, no account needed">
        <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
          {FREE_ALWAYS.map((x) => (
            <li key={x} style={{ fontSize: 14, lineHeight: 1.6, color: "var(--muted)", margin: "0 0 8px", paddingLeft: 18, position: "relative" }}>
              <span aria-hidden="true" style={{ position: "absolute", left: 0, color: "#34D399" }}>✓</span>
              {x}
            </li>
          ))}
        </ul>
        <div className="actions" style={{ marginTop: 14 }}>
          {prefillEngine ? (
            <Link className="btn btn-gold" href={enginesHref}>Continue to the engine →</Link>
          ) : (
            <Link className="btn btn-gold" href="/create">Start something</Link>
          )}
          <Link className="btn btn-ghost" href="/library">Your work</Link>
        </div>
      </Section>

      <Section
        title="Invited testers"
        lead="A few invited testers have accounts so their builds follow them between devices. They cost nothing, and there's no sign-up."
      >
        {member ? (
          <MembershipClient
            configured={configured}
            signedIn
            memberAccess={Boolean(member.access.memberAccess)}
            membershipStatus={member.access.status ?? null}
            activeUntil={member.access.activeUntil ?? null}
            prefillEngine={prefillEngine}
            prefillIdea={prefillIdea}
            source={source}
            enginesHref={enginesHref}
          />
        ) : (
          <p style={{ fontSize: 14, margin: 0 }}>
            <Link href="/members/login?returnTo=%2Faccount" style={{ color: "var(--gold)", fontWeight: 800, textDecoration: "none" }}>
              Tester sign-in →
            </Link>
          </p>
        )}
      </Section>

      <Section title="What a tester account stores">
        <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
          {[
            "Your email, a password hash, your access status, and the projects you choose to save. Nothing else.",
            "Export and deletion are self-serve from your account page.",
            "You own your original ideas, project content, and resulting output. Open Mirror owns its software, brands, and engine logic.",
            "Outside services you choose to use (GitHub, AI assistants, hosting) are separate, with their own terms.",
          ].map((x) => (
            <li key={x} style={{ fontSize: 13, lineHeight: 1.6, color: "var(--muted)", margin: "0 0 10px", paddingLeft: 16, position: "relative" }}>
              <span aria-hidden="true" style={{ position: "absolute", left: 0 }}>·</span>
              {x}
            </li>
          ))}
        </ul>
      </Section>
    </Sheet>
  );
}
