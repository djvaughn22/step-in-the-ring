import type { Metadata } from "next";
import { LOOP_TOOLS } from "../tools/loop";
import Link from "next/link";
import Playbook from "./Playbook";
import liveProducts from "../live/live-products.json";
import { WHY_THE_NAME } from "../site/brand";

// The whole road, idea → real thing, on one linkable page.
//
// ONE model, not three. This page used to run a five-step loop, then a
// separate seven-step "longer version" of the same loop, then a third
// technical playbook underneath — three descriptions of one product, each
// a little different, and the middle one still described sending work to
// Open Mirror to push live as if that were the normal finish line. It
// isn't: say it, hand it to an AI, say what to change — that is the whole loop
// for anyone, software or not. The technical playbook stays, because a real deploy
// workflow is genuinely useful to people building software — but it is
// clearly labeled as that, not as the definition of Step In The Ring.

export const metadata: Metadata = {
  title: "How It Works",
  description:
    "Say what you want to make, paste the message we write into an AI app, and keep telling it what to change until it's right. No coding, and no account needed here.",
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
    body: "We turn it into a clear first message for an AI. You can add a detail, or cut the idea down first.",
  },
  {
    n: "03",
    title: "Make it",
    body: "Paste the message into the AI app you like. It takes a first try, and you don't write any code.",
  },
  {
    n: "04",
    title: "Try it",
    body: "Read it, play it, open it, show someone. If it doesn't work for you, it isn't done.",
  },
  {
    n: "05",
    title: "Go again",
    body: "Tell the AI what to change, and we help with the words. Keep going until it's right.",
  },
];

// What a visitor actually gets, in plain terms (owner direction 2026-10-07:
// goal, included steps, real output, time and limits, live vs beta, account).
// Keep every line true of the product as it ships: this site writes messages,
// it does not run an AI. No money talk about this site here (owner, 2026-10-17):
// say what you get, not what it costs. That the AI apps are separate services
// with their own terms is a fact a first-timer needs, so it stays.
const WHAT_YOU_GET = [
  { label: "Your goal", body: "Something you want to make: a website, a game, a story, a study guide, a work plan, a family cookbook." },
  { label: "Steps included", body: "Say it, shape it, make it, try it, go again. Tools and Engines help with single steps." },
  { label: "What you leave with", body: "A first message to give an AI, the next message each time you say what to change, and if you want it, a written plan and a longer brief." },
  { label: "Time", body: "Your first message appears as soon as you describe the idea. The rest depends on the idea and on how many changes you want." },
  { label: "Limits", body: "This site doesn't run an AI and can't see what yours makes, so you decide when it's right. AI apps are separate services with their own accounts and age rules, and most let you start without paying. Kids should do this with a parent or another adult they trust. AI can sound sure and still be wrong, so check anything that matters. Your work is kept in this browser only, so clearing site data clears it." },
  { label: "Live or beta", body: "The idea box and tools work today. Some Engines are still in beta. Here's the current list:" },
  { label: "Account", body: "None needed. Your work stays in this browser." },
];

const NAV_CONCEPTS = [
  { name: "Create", body: "Where it starts. Say what you want to make and get your first message." },
  { name: "Tools", body: "Small tools that each do one job, like cutting an idea down or checking it before you share." },
  { name: "Engines", body: "Guided help for when one kind of work needs more than a message." },
  { name: "Your work", body: "Everything you started, kept in this browser. Come back and continue." },
  { name: "Made here", body: "The showroom: real sites and games made here, to open and borrow ideas from." },
];

type LiveProduct = {
  id: string;
  name: string;
  emoji: string;
  url: string;
  blurb: string;
  pushedAt: string;
};

/** Newest first, a small number only — real proof, not a portfolio. */
const MADE_HERE = (liveProducts as LiveProduct[])
  .slice()
  .sort((a, b) => (a.pushedAt < b.pushedAt ? 1 : -1))
  .slice(0, 3);

export default function HowPage() {
  return (
    <main>
      <div className="page">
        <header className="mast">
          <span className="kicker">How it works</span>
          <h1 className="mast-title">Work with AI until it&apos;s right</h1>
          <p className="mast-lead">
            You don&apos;t need to code or know the right words. We write the
            messages, and the AI app you pick does the making. You decide when
            it&apos;s right. No account needed here: your work is kept in this
            browser, under Your work.
          </p>
          <hr className="rule mast-rule" />
        </header>

        <section className="band" style={{ paddingTop: 34 }} aria-labelledby="what-you-get">
          <div className="band-head">
            <h2 className="band-title" id="what-you-get">What you get</h2>
            <p className="band-note">The plain version, before you start.</p>
          </div>
          <dl className="card" style={{ margin: 0, display: "grid", gap: 12 }}>
            {WHAT_YOU_GET.map((w) => (
              <div key={w.label}>
                <dt className="plan-label" style={{ marginBottom: 2 }}>{w.label}</dt>
                <dd style={{ margin: 0, fontSize: 14.5, lineHeight: 1.55, color: "var(--text)" }}>
                  {w.body}
                  {w.label === "Live or beta" && <> <Link href="/whats-built" className="more">What works today →</Link></>}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="band">
          <div className="loop">
            {LOOP.map((s, i) => (
              <div key={s.n} className="loop-step">
                <span className="loop-n">{s.n}</span>
                <h3 className="loop-t">{s.title}</h3>
                <p className="loop-d">{s.body}</p>
                <Link className="loop-tool" href={LOOP_TOOLS[i].href}>{LOOP_TOOLS[i].label} →</Link>
              </div>
            ))}
          </div>
          <p className="home-name">{WHY_THE_NAME}</p>
        </section>

        <section className="band">
          <div className="band-head">
            <h2 className="band-title">Where everything lives</h2>
            <p className="band-note">The main places on this site.</p>
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

        {/* Restrained, real proof near the end of the explanation — not the
            hero, not a portfolio. Every entry here is something an Engine
            actually pushed live; app/live/live-products.json is the same
            data /live reads, not a separate claim. */}
        {MADE_HERE.length > 0 && (
          <section className="band">
            <div className="band-head">
              <h2 className="band-title">Built with Step In The Ring</h2>
              <p className="band-note">Pushed live from inside an Engine, not a mockup.</p>
            </div>
            <div className="stack">
              {MADE_HERE.map((p) => (
                <a key={p.id} href={p.url} target="_blank" rel="noopener noreferrer" className="door-card">
                  <span className="door-emoji" aria-hidden="true">{p.emoji}</span>
                  <div style={{ minWidth: 0 }}>
                    <h3>{p.name}</h3>
                    <p>{p.blurb}</p>
                  </div>
                  <span className="door-go" aria-hidden="true">→</span>
                </a>
              ))}
            </div>
            <p className="tiny" style={{ marginTop: 14 }}>
              <Link href="/live" className="more">Every push, newest first →</Link>{" "}
              <Link href="/whats-built" className="more">What works today →</Link>
            </p>
          </section>
        )}

        <section className="home-section" style={{ textAlign: "center" }}>
          <div className="actions center">
            <Link href="/create" className="btn btn-gold btn-big">Start</Link>
          </div>
        </section>

        <div className="divider" />
        <p className="tiny" style={{ textAlign: "center" }}>
          Part of Open Mirror LLC. Kids should do this with a parent or another adult they trust.
        </p>
      </div>
    </main>
  );
}
