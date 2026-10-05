// ─────────────────────────────────────────────────────────────────────────────
// Accounts — the public page at /membership (the path is kept so old links,
// the account redirect and middleware keep working).
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
  title: "Accounts",
  description:
    "Everything in Step In The Ring is free to use with no account. An optional account only syncs your saved builds between devices.",
};

const FREE_ALWAYS = [
  "Every engine in the Engine Room, run end to end, with no sign-in",
  "The free tools: the Five Hour Sprint planner, first-version cutter, try-it script, one-line explainer and launch checklist",
  "The Build Machine guide and the Ready to Build computer check",
  "Starting an idea here, or carrying one in from iDontCry",
  "Work saves to this browser as you go — it's there when you come back on this device",
];

const ACCOUNT_ADDS = [
  "Your saved builds and projects follow you to another device or browser",
  "One-click, always-asked-first import of work you already made in this browser",
  "Export or delete your own projects, or the whole account, whenever you choose",
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
        kicker="Optional"
        title="Accounts"
        lead="You do not need an account to use Step In The Ring. Every tool here is free and open right now, and your work saves to this browser as you go. An account does one thing: it makes your saved builds follow you to another device. Your ideas, projects, and output remain yours either way."
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
        <p style={{ fontSize: 14, margin: "12px 0 0" }}>
          <Link href="/tools" style={{ color: "var(--gold)", fontWeight: 800, textDecoration: "none" }}>See every free tool →</Link>
        </p>
      </Section>

      <Section
        title="What an account adds"
        lead="Accounts are invite-only while we test them. They cost nothing."
      >
        <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
          {ACCOUNT_ADDS.map((x) => (
            <li key={x} style={{ fontSize: 14, lineHeight: 1.6, color: "var(--muted)", margin: "0 0 8px", paddingLeft: 18, position: "relative" }}>
              <span aria-hidden="true" style={{ position: "absolute", left: 0, color: "var(--gold)" }}>★</span>
              {x}
            </li>
          ))}
        </ul>
      </Section>

      <div style={{ marginTop: 46 }}>
        <MembershipClient
          configured={configured}
          signedIn={Boolean(member)}
          memberAccess={Boolean(member?.access.memberAccess)}
          membershipStatus={member?.access.status ?? null}
          activeUntil={member?.access.activeUntil ?? null}
          prefillEngine={prefillEngine}
          prefillIdea={prefillIdea}
          source={source}
          enginesHref={enginesHref}
        />
      </div>

      <Section title="What an account stores">
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
