import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Five Hour Sprint",
  description: "Plan with ChatGPT, use Claude for focused implementation, and finish a verified deliverable on a modest AI budget.",
};

const PARTS = [
  ["01", "Plan before the window opens", "Choose one deliverable, define what done means, and prepare the exact implementation packet."],
  ["02", "Use Claude for the deep build", "Spend the limited coding window implementing—not rediscovering the project or rewriting the plan."],
  ["03", "Verify before calling it finished", "Review the diff, run the checks, test production, and record the real result."],
];

export default function FiveHourSprintPage() {
  return (
    <main>
      <div className="page">
        <section className="hero" style={{ paddingBottom: 8 }}>
          <span className="kicker">A Step In The Ring product</span>
          <h1>Five Hour <span style={{ color: "var(--gold)" }}>Sprint</span></h1>
          <p className="hero-sub">
            Plan with ChatGPT. Use Claude for the hard build. Verify everything.
            Finish something real without paying for the biggest AI plans.
          </p>
        </section>

        <section className="home-section">
          <div className="stack">
            {PARTS.map(([n, title, body]) => (
              <div key={n} className="card">
                <span className="kicker">{n}</span>
                <h3>{title}</h3>
                <p style={{ fontSize: 14 }}>{body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="home-section" style={{ textAlign: "center" }}>
          <div className="actions center">
            <Link href="/membership?source=five-hour-sprint" className="btn btn-gold btn-big">
              See Step In The Ring membership
            </Link>
            <Link href="/" className="btn btn-ghost">Start with an idea</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
