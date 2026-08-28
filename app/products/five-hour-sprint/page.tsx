// ─────────────────────────────────────────────────────────────────────────────
// The Five Hour Sprint — the paid service. The owner personally finishes one
// real deliverable with a customer inside one focused five-hour window.
//
// This is NOT the same thing as /five-hour-sprint-tool, the free self-serve
// planner anyone can use without an account or a conversation with the
// owner. That tool stays linked from here as the free way to try the method
// yourself; this page sells the owner's own time.
//
// Honest-state rule (mirrors membership/page.tsx): there is no live checkout.
// The one action on this page is "Apply for a Sprint", which submits a real
// lead the owner reviews by hand — never a payment.
// ─────────────────────────────────────────────────────────────────────────────

import type { Metadata } from "next";
import Link from "next/link";
import { ECOSYSTEM } from "../../site/registry";
import { Sheet, Masthead, Band, Tiles, Tile } from "../../site/ui";

export const metadata: Metadata = {
  title: "Five Hour Sprint",
  description:
    "Finish one valuable piece of work in one focused five-hour window. Leave with it built, tested, documented, and ready to use.",
};

const WHO_FOR = [
  "A small business owner with one project that keeps sliding to next week.",
  "A founder who knows exactly what they need built but not how to get it built.",
  "A team with a real deadline and one blocker standing in front of it.",
];

const CAN_FINISH = [
  "A working piece of software: a tool, a page, an automation, a fix to something broken.",
  "A first real version of a product idea, running and usable, not a mockup.",
  "One clearly-scoped improvement to something that already exists.",
];

const INCLUDED = [
  "A short intake conversation before the window opens, to lock the one deliverable and what done means.",
  "Five focused hours of the owner's own work, start to finish, on that one deliverable.",
  "Testing before it's called finished — the checks run, the thing is used, not just written.",
  "Plain documentation of what was built and how to use it.",
  "A short written record of the result at the end of the window.",
];

const EXCLUDED = [
  "Ongoing maintenance or support after the window ends.",
  "Open-ended scope — the deliverable is fixed before the clock starts.",
  "Design or product decisions that need a stakeholder meeting mid-sprint.",
  "Anything that cannot realistically finish in five hours — that gets scoped down first, honestly, before you book.",
];

const CUSTOMER_BRINGS = [
  "One deliverable, described as clearly as you can manage — the intake call sharpens it, it doesn't invent it.",
  "Access to whatever the work needs: an account, a repository, a document, a person to ask.",
  "Five hours of availability for questions, even if you are not watching the whole time.",
];

const HOW_IT_WORKS = [
  ["01", "Apply", "Say what you want finished and what success looks like. No payment yet."],
  ["02", "Intake", "A short call locks the one deliverable, what done means, and the exact window."],
  ["03", "The five hours", "The owner works the window start to finish. You get a mid-point check-in."],
  ["04", "Verify", "The result is tested and used, not just handed over. You get the record of what happened."],
];

const RECEIVE = [
  "The deliverable itself, built and working.",
  "Documentation of what it is and how to use it.",
  "A written record of what was tested and what the result was.",
  "A clear list of what is NOT included, so there is no ambiguity about scope.",
];

const TIERS = [
  {
    name: "Founding",
    price: "$1,500",
    note: "Limited early slots — the first ten, at the founding rate.",
    detail: "One five-hour Sprint, one deliverable, the full process above.",
  },
  {
    name: "Standard",
    price: "$2,500",
    note: "The regular rate once founding slots are gone.",
    detail: "One five-hour Sprint, one deliverable, the full process above.",
  },
  {
    name: "Team",
    price: "$5,000",
    note: "For a team deliverable with more moving parts.",
    detail: "One five-hour Sprint scoped for a team's deliverable, with a team on the intake call.",
  },
];

export default function FiveHourSprintPage() {
  const proof = ECOSYSTEM.filter((p) => p.featured && p.liveUrl).slice(0, 4);

  return (
    <Sheet>
      <Masthead
        kicker="The paid Step In The Ring service"
        title="Five Hour Sprint"
        lead="Finish one valuable piece of work in one focused five-hour window. Leave with it built, tested, documented, and ready to use."
      >
        <div className="actions" style={{ marginTop: 22 }}>
          <Link href="/products/five-hour-sprint/apply" className="btn btn-gold btn-big">
            Apply for a Sprint
          </Link>
          <Link href="/five-hour-sprint-tool" className="btn btn-ghost">
            Or plan your own sprint free
          </Link>
        </div>
      </Masthead>

      <Band title="Who this is for">
        <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
          {WHO_FOR.map((x) => (
            <li key={x} style={{ fontSize: 14, lineHeight: 1.6, color: "var(--muted)", margin: "0 0 8px" }}>
              {x}
            </li>
          ))}
        </ul>
      </Band>

      <Band title="What can get finished">
        <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
          {CAN_FINISH.map((x) => (
            <li key={x} style={{ fontSize: 14, lineHeight: 1.6, color: "var(--muted)", margin: "0 0 8px", paddingLeft: 18, position: "relative" }}>
              <span style={{ position: "absolute", left: 0, color: "#34D399" }}>✓</span>
              {x}
            </li>
          ))}
        </ul>
      </Band>

      <Band title="What's included">
        <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
          {INCLUDED.map((x) => (
            <li key={x} style={{ fontSize: 14, lineHeight: 1.6, color: "var(--muted)", margin: "0 0 8px", paddingLeft: 18, position: "relative" }}>
              <span style={{ position: "absolute", left: 0, color: "#34D399" }}>✓</span>
              {x}
            </li>
          ))}
        </ul>
      </Band>

      <Band title="What's excluded">
        <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
          {EXCLUDED.map((x) => (
            <li key={x} style={{ fontSize: 14, lineHeight: 1.6, color: "var(--muted)", margin: "0 0 8px", paddingLeft: 18, position: "relative" }}>
              <span style={{ position: "absolute", left: 0, color: "var(--muted)" }}>·</span>
              {x}
            </li>
          ))}
        </ul>
      </Band>

      <Band title="What you bring">
        <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
          {CUSTOMER_BRINGS.map((x) => (
            <li key={x} style={{ fontSize: 14, lineHeight: 1.6, color: "var(--muted)", margin: "0 0 8px" }}>
              {x}
            </li>
          ))}
        </ul>
      </Band>

      <Band title="How the five hours work">
        <div className="stack">
          {HOW_IT_WORKS.map(([n, t, d]) => (
            <div key={n} className="card">
              <span className="kicker">{n}</span>
              <h3 style={{ margin: "4px 0" }}>{t}</h3>
              <p style={{ fontSize: 14, color: "var(--muted)", margin: 0 }}>{d}</p>
            </div>
          ))}
        </div>
      </Band>

      <Band title="What you receive">
        <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
          {RECEIVE.map((x) => (
            <li key={x} style={{ fontSize: 14, lineHeight: 1.6, color: "var(--muted)", margin: "0 0 8px", paddingLeft: 18, position: "relative" }}>
              <span style={{ position: "absolute", left: 0, color: "var(--gold)" }}>★</span>
              {x}
            </li>
          ))}
        </ul>
      </Band>

      {proof.length > 0 && (
        <Band
          title="Real proof"
          note="Products built through Step In The Ring's own method. They are live — open one."
        >
          <Tiles>
            {proof.map((p) => (
              <Tile key={p.name} p={p} />
            ))}
          </Tiles>
        </Band>
      )}

      <Band title="Founding, Standard, and Team" note="One price, decided up front. No hidden add-ons.">
        <div className="stack">
          {TIERS.map((t) => (
            <div key={t.name} className="card card-gold">
              <span className="kicker">{t.name}</span>
              <h3 style={{ margin: "4px 0" }}>{t.price}</h3>
              <p style={{ fontSize: 14, color: "var(--muted)", margin: "0 0 4px" }}>{t.detail}</p>
              <p style={{ fontSize: 13, color: "var(--muted)", margin: 0 }}>{t.note}</p>
            </div>
          ))}
        </div>
      </Band>

      <section className="closing">
        <p>One application. No payment today.</p>
        <Link href="/products/five-hour-sprint/apply" className="btn btn-gold btn-big">
          Apply for a Sprint
        </Link>
      </section>
    </Sheet>
  );
}
