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
import { Sheet, PageHead, Section } from "../site/ui";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Membership",
  description:
    "Step In The Ring Membership — open beta, price TBD. Take an idea from iDontCry or anywhere else and turn it into a real first build, with saved projects and guided engines.",
};

const FREE_ALWAYS = [
  "iDontCry — the family playground stays free, no account needed",
  "The Engine Room: every engine below, run end to end, no sign-in",
  "The Five Hour Sprint tool and the Build Machine — no account needed",
  "Your Build Machine or any computer — the local software never needs a subscription, and cancellation never disables a computer",
  "Starting an idea here and carrying it in with you",
  "Work saves to this browser as you go — it's there when you come back on this device",
];

const MEMBERSHIP_UNLOCKS = [
  "Your saved builds and projects follow you to another device or browser",
  "One-click, always-asked-first import of work you already made in this browser",
  "A place to reopen and export your own projects from any signed-in browser",
  "Deleting your own account or projects whenever you choose",
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
  const enginesHref = enginesQs.size ? `/engines/room?${enginesQs}` : "/engines/room";

  return (
    <Sheet>
      <PageHead
        kicker="Optional"
        title={MEMBERSHIP_PRODUCT_NAME}
        lead="You do not need an account to use Step In The Ring — the Engine Room, every engine, and the Five Hour Sprint tool are open right now, and your work saves to this browser as you go. An account is for one thing: making your saved builds follow you to another device. Your ideas, projects, and output remain yours either way."
      >
        {!billingLive && (
          <div style={{ border: "1px solid var(--gold-glow)", borderRadius: 14, padding: "14px 16px", marginTop: 20 }}>
            <p style={{ fontSize: 13, fontWeight: 800, color: "var(--gold)", margin: 0, lineHeight: 1.6 }}>
              Billing is not live yet — nothing on this page can be purchased
              today. When it opens, the exact terms below are what
              you&apos;ll see at checkout — nothing hidden.
            </p>
          </div>
        )}

        <p style={{ fontSize: 14, fontWeight: 800, margin: "20px 0 4px", color: "var(--muted)" }}>
          Future price: {MEMBERSHIP_PRICE_LABEL}
        </p>
        <p style={{ fontSize: 13, color: "var(--muted)", margin: 0 }}>
          Monthly recurring billing, once billing opens. Cancel any time from
          the billing portal — paid access runs to the end of the period you
          already paid for.
        </p>
      </PageHead>

      <Section title="What stays free">
        <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
          {FREE_ALWAYS.map((x) => (
            <li key={x} style={{ fontSize: 14, lineHeight: 1.6, color: "var(--muted)", margin: "0 0 8px", paddingLeft: 18, position: "relative" }}>
              <span style={{ position: "absolute", left: 0, color: "#34D399" }}>✓</span>
              {x}
            </li>
          ))}
        </ul>
      </Section>

      <Section title="What an account adds">
        <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
          {MEMBERSHIP_UNLOCKS.map((x) => (
            <li key={x} style={{ fontSize: 14, lineHeight: 1.6, color: "var(--muted)", margin: "0 0 8px", paddingLeft: 18, position: "relative" }}>
              <span style={{ position: "absolute", left: 0, color: "var(--gold)" }}>★</span>
              {x}
            </li>
          ))}
        </ul>
      </Section>

      <Section
        title="The engines, honestly labeled"
        lead="Status labels come from the engine registry itself. A few engines are owner-only workshop tools and are not part of membership."
      >
        <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
          {matrix.map((r) => (
            <li
              key={r.id}
              style={{ display: "flex", justifyContent: "space-between", gap: 12, border: "1px solid rgba(148,163,184,0.2)", borderRadius: 12, padding: "10px 14px", marginBottom: 8 }}
            >
              <span style={{ fontSize: 14, fontWeight: 800, color: "var(--text)" }}>{r.name}</span>
              <span style={{ fontSize: 12, fontWeight: 800, color: r.activation === "working" ? "#34D399" : "var(--gold)" }}>
                {ACTIVATION_LABEL[r.activation]}
              </span>
            </li>
          ))}
        </ul>
      </Section>

      <div style={{ marginTop: 46 }}>
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
      </div>

      <Section title="The fine print, plainly">
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
            <li key={x} style={{ fontSize: 13, lineHeight: 1.6, color: "var(--muted)", margin: "0 0 10px", paddingLeft: 16, position: "relative" }}>
              <span style={{ position: "absolute", left: 0 }}>·</span>
              {x}
            </li>
          ))}
        </ul>
      </Section>
    </Sheet>
  );
}
