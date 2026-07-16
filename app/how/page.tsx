import type { Metadata } from "next";
import Link from "next/link";

// The whole road, idea → live, on one linkable page.

export const metadata: Metadata = {
  title: "How It Works",
  description:
    "The whole road: say a rough idea in your own words, get a plan for version one and a builder prompt, build it with free tools, test it locally, send it to Open Mirror to push — and it lands on the Live page.",
};

const STEPS = [
  {
    n: "01",
    title: "You walk in with a rough idea",
    body: "It doesn't have to be polished. It doesn't have to be smart yet. Just say what you want to build.",
  },
  {
    n: "02",
    title: "We read it back to you",
    body: "You see what we understood — what it is, where it belongs, who it's for — before any plan appears. If a detail is missing and it actually changes the build, you get one question. Not a form.",
  },
  {
    n: "03",
    title: "You get your plan",
    body: "What version one does, what it already has, what must not break, and what we're deliberately leaving out. Plus the calls we made for you, so you can overrule any of them.",
  },
  {
    n: "04",
    title: "You hand it to your builder",
    body: "Your plan becomes a real execution brief — scope, assets, what to preserve, what to skip, how to test it. Paste it into the AI building tool you already trust. You review and approve what it builds.",
  },
  {
    n: "05",
    title: "You test it locally",
    body: "Use the real thing yourself before anyone else does. The plan's definition of done is your checklist. If it doesn't work for you, it's not ready.",
  },
  {
    n: "06",
    title: "You send it to Open Mirror to push",
    body: "Tested and working? Send it in with your test results. Open Mirror pushes it live — a real deploy, a real address on the internet.",
  },
  {
    n: "07",
    title: "It lands on the Live page",
    body: "Every push joins the Live Products page — proof it made it out of the ring. Then you come back for the next round: fix, refine, expand, or launch.",
  },
];

export default function HowPage() {
  return (
    <main>
      <div className="page">
        <section className="hero" style={{ paddingBottom: 8 }}>
          <span className="kicker">Step In The Ring</span>
          <h1 style={{ fontSize: "clamp(32px, 7vw, 54px)" }}>
            How It <span style={{ color: "var(--gold)" }}>Works</span>
          </h1>
          <p className="hero-sub">
            The whole road, idea to live. No accounts, no cost — your plans stay
            on your device.
          </p>
        </section>

        <section className="home-section" style={{ marginTop: 28 }}>
          <div className="stack">
            {STEPS.map((s) => (
              <div key={s.n} className="card" style={{ display: "flex", gap: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 900, color: "var(--gold)", minWidth: 28, marginTop: 2 }}>
                  {s.n}
                </div>
                <div>
                  <h3 style={{ marginBottom: 8 }}>{s.title}</h3>
                  <p style={{ fontSize: 14 }}>{s.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="home-section" style={{ textAlign: "center" }}>
          <div className="actions center">
            <Link href="/" className="btn btn-gold btn-big">🥊 Shape my idea</Link>
          </div>
          <p style={{ fontSize: 14, marginTop: 16 }}>
            <Link href="/live" style={{ color: "var(--gold)", fontWeight: 800, textDecoration: "none" }}>
              See what already made it out — the Live page →
            </Link>
          </p>
        </section>

        <div className="divider" />
        <p className="tiny" style={{ textAlign: "center" }}>
          Part of Open Mirror LLC. Kids should build with a parent or trusted adult.
        </p>
      </div>
    </main>
  );
}
