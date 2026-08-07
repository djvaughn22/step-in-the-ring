// ─────────────────────────────────────────────────────────────────────────────
// Step In The Ring Membership — the public membership page and the free
// introduction to the Engine Room.
//
// Honest-state rules (test-locked):
//   - Public price is TBD during the open beta (2026-08-06 beta reset). One
//     plan. No annual, no lifetime, no tiers, no trials, no crossed-out
//     prices, no countdowns, no fake counts.
//   - While billing is not live this page says PRIVATE BETA plainly and the
//     join button becomes "billing not live yet".
//   - What stays free stays listed: iDontCry, this introduction, the local
//     Build Machine software. Cancellation never disables a computer.
//   - Owner-only engines are not shown as membership value.
// ─────────────────────────────────────────────────────────────────────────────

import type { Metadata } from "next";
import { engineMatrix, MEMBERSHIP_PRICE_LABEL, MEMBERSHIP_PRODUCT_NAME } from "../members/entitlement";
import { currentMember } from "../members/session";
import { memberStoreConfigured } from "../members/store";
import { readStripeConfig, stripeConfigured } from "../members/stripeCore";
import { ACTIVATION_LABEL } from "../engines/engines";
import MembershipClient from "./MembershipClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Membership",
  description:
    "Step In The Ring Membership — open beta, price TBD. Take an idea from iDontCry or anywhere else and turn it into a real first build, with saved projects and guided engines.",
};

const FREE_ALWAYS = [
  "iDontCry — the family playground stays free, no account needed",
  "This page: seeing every engine and what it does",
  "Starting an idea here and carrying it in with you",
  "Your Build Machine or any computer — the local software never needs a subscription, and cancellation never disables a computer",
  "Your account, and exporting or deleting your own projects — even after a membership ends",
];

const MEMBERSHIP_UNLOCKS = [
  "The Engine Room: the guided engines below, run end to end",
  "Saving projects to your account — including one-click, always-asked-first import of work saved in this browser",
  "Reopening and exporting saved projects from your account, in any signed-in browser",
  "Structured, guided iteration toward a real first working version — an MVP1, not a promised business",
  "Deleting your own projects whenever you choose",
];

export default async function MembershipPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const configured = memberStoreConfigured();
  const billingLive = stripeConfigured(readStripeConfig());
  const member = await currentMember();
  const matrix = engineMatrix().filter((r) => r.access === "member");
  const prefillEngine = typeof sp.engine === "string" ? sp.engine : null;
  const prefillIdea = typeof sp.idea === "string" ? sp.idea.slice(0, 500) : null;
  const source = typeof sp.source === "string" ? sp.source.slice(0, 40) : null;
  // A handoff that bounced here off the /engines gate keeps its payload —
  // once access exists, the person continues into the exact engine they
  // were headed for, creation record included.
  const enginesQs = new URLSearchParams();
  if (prefillEngine) enginesQs.set("engine", prefillEngine);
  if (typeof sp.cr === "string") enginesQs.set("cr", sp.cr);
  const enginesHref = enginesQs.size ? `/engines?${enginesQs}` : "/engines";

  return (
    <main style={{ minHeight: "100vh" }}>
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "40px 20px 80px" }}>
        <span className="kicker">Private beta</span>
        <h1 style={{ fontSize: 28, fontWeight: 900, margin: "6px 0 8px", color: "var(--ink, #e8edf5)" }}>
          {MEMBERSHIP_PRODUCT_NAME}
        </h1>
        <p style={{ fontSize: 15, lineHeight: 1.65, color: "var(--muted, #94a3b8)", margin: "0 0 20px" }}>
          Take any idea — even one you dreamed up on iDontCry — and turn it
          into a real first build. Membership is the working side of Step In
          The Ring: guided engines, saved projects, and structured iteration
          toward a real first working version. Your ideas, projects, and
          output remain yours.
        </p>

        {!billingLive && (
          <div style={{ border: "1px solid rgba(245,158,11,0.4)", borderRadius: 14, padding: "14px 16px", marginBottom: 20 }}>
            <p style={{ fontSize: 13, fontWeight: 800, color: "var(--gold, #f59e0b)", margin: 0, lineHeight: 1.6 }}>
              Billing is not live yet. Membership is in private beta: invited
              testers use owner-issued codes, and nothing can be purchased on
              this page today. When billing opens, the exact terms below are
              what you&apos;ll see at checkout — nothing hidden.
            </p>
          </div>
        )}

        <p style={{ fontSize: 14, fontWeight: 800, margin: "0 0 4px", color: "var(--muted, #94a3b8)" }}>
          Future price: {MEMBERSHIP_PRICE_LABEL}
        </p>
        <p style={{ fontSize: 13, color: "var(--muted, #94a3b8)", margin: "0 0 28px" }}>
          Monthly recurring billing, once billing opens. Cancel any time from
          the billing portal — paid access runs to the end of the period you
          already paid for.
        </p>

        <h2 style={{ fontSize: 16, fontWeight: 900, margin: "0 0 10px", color: "var(--ink, #e8edf5)" }}>
          What stays free
        </h2>
        <ul style={{ margin: "0 0 24px", padding: 0, listStyle: "none" }}>
          {FREE_ALWAYS.map((x) => (
            <li key={x} style={{ fontSize: 14, lineHeight: 1.6, color: "var(--muted, #94a3b8)", margin: "0 0 8px", paddingLeft: 18, position: "relative" }}>
              <span style={{ position: "absolute", left: 0, color: "#34D399" }}>✓</span>
              {x}
            </li>
          ))}
        </ul>

        <h2 style={{ fontSize: 16, fontWeight: 900, margin: "0 0 10px", color: "var(--ink, #e8edf5)" }}>
          What membership unlocks
        </h2>
        <ul style={{ margin: "0 0 24px", padding: 0, listStyle: "none" }}>
          {MEMBERSHIP_UNLOCKS.map((x) => (
            <li key={x} style={{ fontSize: 14, lineHeight: 1.6, color: "var(--muted, #94a3b8)", margin: "0 0 8px", paddingLeft: 18, position: "relative" }}>
              <span style={{ position: "absolute", left: 0, color: "var(--gold, #f59e0b)" }}>★</span>
              {x}
            </li>
          ))}
        </ul>

        <h2 style={{ fontSize: 16, fontWeight: 900, margin: "0 0 10px", color: "var(--ink, #e8edf5)" }}>
          The engines, honestly labeled
        </h2>
        <p style={{ fontSize: 13, color: "var(--muted, #94a3b8)", margin: "0 0 12px", lineHeight: 1.6 }}>
          Status labels come from the engine registry itself. A few engines
          are owner-only workshop tools and are not part of membership.
        </p>
        <ul style={{ margin: "0 0 28px", padding: 0, listStyle: "none" }}>
          {matrix.map((r) => (
            <li
              key={r.id}
              style={{ display: "flex", justifyContent: "space-between", gap: 12, border: "1px solid rgba(148,163,184,0.2)", borderRadius: 12, padding: "10px 14px", marginBottom: 8 }}
            >
              <span style={{ fontSize: 14, fontWeight: 800, color: "var(--ink, #e8edf5)" }}>{r.name}</span>
              <span style={{ fontSize: 12, fontWeight: 800, color: r.activation === "working" ? "#34D399" : "var(--gold, #f59e0b)" }}>
                {ACTIVATION_LABEL[r.activation]}
              </span>
            </li>
          ))}
        </ul>

        <MembershipClient
          configured={configured}
          billingLive={billingLive}
          signedIn={Boolean(member)}
          memberAccess={Boolean(member?.access.memberAccess)}
          membershipStatus={member?.access.status ?? null}
          activeUntil={member?.access.activeUntil ?? null}
          prefillEngine={prefillEngine}
          prefillIdea={prefillIdea}
          source={source}
          enginesHref={enginesHref}
        />

        <h2 style={{ fontSize: 16, fontWeight: 900, margin: "28px 0 10px", color: "var(--ink, #e8edf5)" }}>
          The fine print, plainly
        </h2>
        <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
          {[
            "Cancel any time in the billing portal. Paid access continues through the period you already paid for, then paid features close. Nothing else changes.",
            "After cancellation your account, iDontCry, your computer, and its local software all keep working. A Build Machine is never disabled by a membership decision.",
            "Your projects are not deleted when a membership ends — you can still export or delete them yourself. Long-term retention limits will be published before they ever apply.",
            "Build Machine hardware is a separate purchase and never includes a membership unless its listing expressly says so.",
            "Third-party accounts and subscriptions (GitHub, AI assistants, hosting) are separate services with their own terms.",
            "You own your original ideas, project content, and resulting output. Open Mirror owns its software, platform, brands, and engine logic.",
            "Stored account data: your email, password hash, membership status, and the projects you choose to save. Export and deletion are self-serve; deletion requests are honored under the published retention policy.",
          ].map((x) => (
            <li key={x} style={{ fontSize: 13, lineHeight: 1.6, color: "var(--muted, #94a3b8)", margin: "0 0 10px", paddingLeft: 16, position: "relative" }}>
              <span style={{ position: "absolute", left: 0 }}>·</span>
              {x}
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
