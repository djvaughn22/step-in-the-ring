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

function statusClass(c: Capability): string {
  if (c.ownerOnly) return "status-pill status-owner-only";
  return c.activation === "working" ? "status-pill status-working" : "status-pill status-beta";
}

function EngineCard({ c }: { c: Capability }) {
  const name = displayName(c);
  // An owner-only engine stays on the page — hiding it would make the catalog
  // a lie — but it does not pretend to be a door you can walk through.
  const openable = !c.ownerOnly;
  return (
    <article className="eng">
      <header className="eng-head">
        <span className="eng-mark" aria-hidden="true">{c.emoji}</span>
        <h3 className="eng-name">{name}</h3>
        <span className={statusClass(c)}>
          {c.ownerOnly ? ACTIVATION_LABEL["owner-only"] : ACTIVATION_LABEL[c.activation]}
        </span>
      </header>

      <p className="eng-what">{c.what}</p>

      {c.useWhen && (
        <p className="eng-when">
          <span className="eng-when-k">Use it when</span>
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
        Opening an engine needs an account, because the work has to be saved
        somewhere it can come back to you. The account is free during the open
        beta. <Link href="/membership">What that means</Link>.
      </p>
    </Sheet>
  );
}
