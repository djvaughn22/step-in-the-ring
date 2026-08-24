import type { Metadata } from "next";
import Link from "next/link";
import Playbook from "./Playbook";

// The whole road, idea → real thing, on one linkable page.
//
// ONE model, not three. This page used to run a five-step loop, then a
// separate seven-step "longer version" of the same loop, then a third
// technical playbook underneath — three descriptions of one product, each
// a little different, and the middle one still described sending work to
// Open Mirror to push live as if that were the normal finish line. It
// isn't: Create → Engines → Builds → Library is the whole loop for anyone,
// software or not. The technical playbook stays, because a real deploy
// workflow is genuinely useful to people building software — but it is
// clearly labeled as that, not as the definition of Step In The Ring.

export const metadata: Metadata = {
  title: "How It Works",
  description:
    "Say a rough idea, shape it, make it real, try it, and keep going. No account needed — sign in only if you want a Build to follow you to another device.",
};

const LOOP = [
  {
    n: "01",
    title: "Say it",
    body: "In your own words. No form to fill in — messy is fine.",
  },
  {
    n: "02",
    title: "Shape it",
    body: "See what it really is before any plan shows up. You only get asked something if it would actually change what gets built.",
  },
  {
    n: "03",
    title: "Make it",
    body: "Turn it into something real — open an Engine if a focused tool helps, or take it to the AI already in your corner, like ChatGPT or Claude.",
  },
  {
    n: "04",
    title: "Try it",
    body: "Use the real thing yourself. If it doesn't work for you, it isn't done.",
  },
  {
    n: "05",
    title: "Go again",
    body: "Continue the Build, save something useful to your Library, or start the next one.",
  },
];

const NAV_CONCEPTS = [
  { name: "Create", body: "Where ideas begin. Say what you want to make." },
  { name: "Engines", body: "Focused tools for when one part of the work needs real help." },
  { name: "Builds", body: "Things you're actively making. Come back and continue." },
  { name: "Library", body: "Things you saved and may want again." },
];

export default function HowPage() {
  return (
    <main>
      <div className="page">
        <header className="mast">
          <span className="kicker">How it works</span>
          <h1 className="mast-title">One loop, five steps</h1>
          <p className="mast-lead">
            The same five steps whether you&apos;re making an app, a song, a
            game or a plan. No account needed — sign in only if you want a
            Build to follow you to another device.
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
            <h2 className="band-title">Where each step happens</h2>
            <p className="band-note">Four places, always the same four.</p>
          </div>
          <div className="bench-cols">
            {NAV_CONCEPTS.map((c) => (
              <div key={c.name} className="bench-col">
                <h3>{c.name}</h3>
                <p style={{ fontSize: 14, lineHeight: 1.55, color: "var(--text)", margin: 0 }}>{c.body}</p>
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
            <Link href="/explore" className="more">
              See real things that got made this way →
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
