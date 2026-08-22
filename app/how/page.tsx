import type { Metadata } from "next";
import Link from "next/link";
import Playbook from "./Playbook";

// The whole road, idea → live, on one linkable page.

export const metadata: Metadata = {
  title: "How It Works",
  description:
    "The whole road: say a rough idea in your own words, get a plan for version one and a builder prompt, build it with free tools, test it locally, send it to Open Mirror to push — and it lands on the Live page.",
};

/** The whole thing in five moves. Everything below is the same road, slower.
    This is the same strip the homepage shows, so the product explains itself
    the same way in both places. */
const LOOP = [
  { n: "01", title: "Say it", body: "In your own words. No form to fill in." },
  { n: "02", title: "Shape it", body: "See what it really is before any plan shows up." },
  { n: "03", title: "Make it", body: "The smallest version that actually works." },
  { n: "04", title: "Try it", body: "Use it yourself. If it does not work for you it is not done." },
  { n: "05", title: "Go again", body: "Fix it, grow it, or start the next one." },
];

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
    body: "Your plan becomes a real execution brief — scope, assets, what to preserve, what to skip, how to test it. Paste it into the building tool you already trust. You review and approve what it builds.",
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
        <header className="mast">
          <span className="kicker">How it works</span>
          <h1 className="mast-title">Five moves</h1>
          <p className="mast-lead">
            The same five, whether it is an app, a song or a practice plan. No
            account, no cost, and what you type stays on your device.
          </p>
          <hr className="rule mast-rule" />
        </header>

        <section className="band" style={{ paddingTop: 34 }}>
          <div className="loop">
            {LOOP.map((s) => (
              <div key={s.n} className="loop-step">
                <span className="loop-n">{s.n}</span>
                <h3 className="loop-t">{s.title}</h3>
                <p className="loop-d">{s.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="band">
          <div className="band-head">
            <h2 className="band-title">The longer version</h2>
            <p className="band-note">Same road, one step at a time.</p>
          </div>
          <div className="bench-cols">
            {STEPS.map((s) => (
              <div key={s.n} className="bench-col">
                <h3>{s.n}</h3>
                <p style={{ fontSize: 16, fontWeight: 900, color: "var(--text)", letterSpacing: "-0.02em", margin: "0 0 8px" }}>
                  {s.title}
                </p>
                <p style={{ fontSize: 13.5, lineHeight: 1.55 }}>{s.body}</p>
              </div>
            ))}
          </div>
        </section>

        <Playbook />

        <section className="home-section" style={{ textAlign: "center" }}>
          <div className="actions center">
            <Link href="/create" className="btn btn-gold btn-big">Start something</Link>
          </div>
          <p style={{ fontSize: 14, marginTop: 16 }}>
            <Link href="/live" className="more">
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
