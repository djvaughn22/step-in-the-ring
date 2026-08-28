// ─────────────────────────────────────────────────────────────────────────────
// ENGINES — the public catalog.
//
// This page exists because the Engine Room was a locked door with a mysterious
// name on it. A stranger cannot decide whether an account is worth making
// while the only thing they know is that there is a room. So the EXPLANATION
// is public and the ROOM is not: every engine here says what it does, when to
// reach for it, and what you walk out holding. Opening one is the moment an
// account is asked for, and only then.
//
// The shelves are verbs, not architecture — see ENGINE_GROUPS in
// app/vnext/capabilities.ts. Nothing on this page is hand-listed; adding an
// engine to app/engines/engines.ts and giving it a shelf puts it here.
// ─────────────────────────────────────────────────────────────────────────────

import type { Metadata } from "next";
import Link from "next/link";
import { ACTIVATION_LABEL } from "./engines";
import { displayName, enginesByGroup, type Capability } from "../vnext/capabilities";
import { Sheet, Masthead, Band } from "../site/ui";

export const metadata: Metadata = {
  title: "Engines",
  description:
    "Focused tools for making one part of what you're building. Each one says what it does, when to use it, and what you leave with.",
};

function EngineCard({ c }: { c: Capability }) {
  const name = displayName(c);
  // An owner-only engine stays on the page — hiding it would make the catalog
  // a lie — but it does not pretend to be a door you can walk through.
  const openable = !c.ownerOnly;
  // "Works" on a card that works is noise — it's the expectation, not news.
  // A flag only earns its place when it says something other than that.
  const flag = c.ownerOnly ? ACTIVATION_LABEL["owner-only"] : c.activation !== "working" ? ACTIVATION_LABEL[c.activation] : null;
  return (
    <article className="eng">
      <header className="eng-head">
        <span className="eng-mark" aria-hidden="true">{c.emoji}</span>
        <h3 className="eng-name">{name}</h3>
        {flag && (
          <span className={`status-pill ${c.ownerOnly ? "status-owner-only" : "status-beta"}`}>
            {flag}
          </span>
        )}
      </header>

      <p className="eng-what">{c.what}</p>

      {c.useWhen && (
        <p className="eng-when">
          <span className="eng-when-k">Use this to</span>
          {c.useWhen}
        </p>
      )}

      {c.example && <p className="eng-eg">{c.example}</p>}

      <footer className="eng-foot">
        {openable ? (
          <Link href={c.href} className="btn btn-gold btn-small">
            Open
          </Link>
        ) : (
          <span className="eng-shut">Runs on the owner&apos;s machine</span>
        )}
      </footer>
    </article>
  );
}

export default function EnginesPage() {
  const shelves = enginesByGroup();

  return (
    <Sheet wide>
      <Masthead
        kicker="Engines"
        title="Focused tools"
        lead="Each one makes a part of something. Pick the one that matches what you're doing right now — or say what you want to make and the right one gets suggested."
      >
        <nav className="jump" aria-label="Jump to a shelf">
          {shelves.map((g) => (
            <a key={g.id} href={`#${g.id}`}>{g.title}</a>
          ))}
        </nav>
      </Masthead>

      {shelves.map((g) => (
        <Band key={g.id} id={g.id} title={g.title} note={g.note}>
          {/* A shelf holding one engine gets a single wide card instead of a
              lonely third of a row. */}
          <div className={g.items.length === 1 ? "eng-grid eng-grid-one" : "eng-grid"}>
            {g.items.map((c) => (
              <EngineCard key={c.id} c={c} />
            ))}
          </div>
        </Band>
      ))}

      <Band
        title="Not sure which one"
        note="You do not have to pick. Say what you want to make and the right engine is offered to you."
      >
        <div className="actions">
          <Link href="/create" className="btn btn-gold">Start with what you want to make</Link>
          <Link href="/builds" className="btn btn-ghost">Open something you started</Link>
        </div>
      </Band>

      <p className="tiny" style={{ marginTop: 34 }}>
        No account needed — open any engine and your work saves to this
        browser as you go. An account is only for making it follow you to
        another device. <Link href="/membership">What that means</Link>.
      </p>

      <p className="tiny" style={{ marginTop: 10 }}>
        Would rather the owner just finish it with you?{" "}
        <Link href="/products/five-hour-sprint">The Five Hour Sprint</Link>.
      </p>
    </Sheet>
  );
}
