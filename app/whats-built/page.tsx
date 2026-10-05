// ─────────────────────────────────────────────────────────────────────────────
// WHAT'S BUILT — the honest status page a first-time visitor can read in a
// minute: what works today, what works but is still being improved, what sits
// behind a door, and what is not open yet.
//
// Rules:
//   - Engine rows are DERIVED from the public engine catalog (enginesByGroup),
//     so this page can't promote something the Engines page doesn't offer, and
//     a status change in app/engines/engines.ts shows up here on its own.
//   - Hand-written rows only describe pages that exist in the site registry
//     (whats-built.test.ts checks every internal link).
//   - Nothing for sale, no prices, no internal plans or private goals. If it
//     can't be opened today, it says so and has no button.
// ─────────────────────────────────────────────────────────────────────────────

import type { Metadata } from "next";
import Link from "next/link";
import { Sheet, Masthead, Band } from "../site/ui";
import { displayName, enginesByGroup, type Capability } from "../vnext/capabilities";
import TesterFeedback from "../site/TesterFeedback";

export const metadata: Metadata = {
  title: "What's built",
  description:
    "What works on Step In The Ring today, what is in beta, what is private, and what is still being built.",
};

type Status = "works" | "beta" | "private" | "planned";

const STATUS: Record<Status, { label: string; cls: string }> = {
  works: { label: "Works today", cls: "status-working" },
  beta: { label: "Beta", cls: "status-beta" },
  private: { label: "Private", cls: "status-owner-only" },
  planned: { label: "Not open yet", cls: "status-planned" },
};

interface Item {
  name: string;
  what: string;
  status: Status;
  /** Only when there is something a visitor can actually open. */
  href?: string;
}

// Engines from the catalog, split by what they really do for a visitor today.
// Surfaces (Build Machine, first build, Sprint planner) are listed by hand
// below with the tools, so only real engines come through here.
const catalog: Capability[] = enginesByGroup()
  .flatMap((g) => g.items)
  .filter((c) => c.kind === "engine");

const engineItem = (c: Capability, status: Status): Item => ({
  name: displayName(c),
  what: c.what,
  status,
  href: status === "private" ? undefined : c.href,
});

const WORKS: Item[] = [
  {
    name: "The idea box",
    what: "Say what you want to make in your own words. You get back what it is, the smallest version that would work, and a first move.",
    status: "works",
    href: "/create",
  },
  {
    name: "Free tools",
    what: "First version cutter, try-it script, one-line explainer and launch checklist. A few minutes each.",
    status: "works",
    href: "/tools",
  },
  {
    name: "Five Hour Sprint planner",
    what: "Plan one five-hour work session, track it, and write down what came out of it.",
    status: "works",
    href: "/five-hour-sprint-tool",
  },
  {
    name: "Your first build, step by step",
    what: "Six short rounds for a first web app, from idea to your own domain.",
    status: "works",
    href: "/build",
  },
  {
    name: "Ready to Build and the computer check",
    what: "A free guide for the computer you already have: check it, back it up, set it up, and launch a first project.",
    status: "works",
    href: "/products/ready-to-build",
  },
  {
    name: "Build Machine",
    what: "Find out if a computer is a good candidate, then set it up step by step.",
    status: "works",
    href: "/build-machine",
  },
  ...catalog.filter((c) => !c.ownerOnly && c.activation === "working").map((c) => engineItem(c, "works")),
  {
    name: "Your work",
    what: "Everything you started here, in one place, kept in this browser.",
    status: "works",
    href: "/library",
  },
  {
    name: "Owner’s Builds",
    what: "The live websites, tools and games made this way. Open any of them.",
    status: "works",
    href: "/builds",
  },
];

const BETA: Item[] = catalog
  .filter((c) => !c.ownerOnly && c.activation !== "working")
  .map((c) => engineItem(c, "beta"));

const PRIVATE: Item[] = [
  {
    name: "Tester accounts",
    what: "A few invited testers have accounts so their builds follow them between devices. There is no sign-up, and nobody else needs one.",
    status: "private",
    href: "/membership",
  },
  ...catalog.filter((c) => c.ownerOnly).map((c) => engineItem(c, "private")),
];

const NOT_YET: Item[] = [
  {
    name: "Posting straight to Etsy",
    what: "The Design Shop writes the listing for you to paste in. It does not post to Etsy itself.",
    status: "planned",
  },
  {
    name: "Publishing your own game",
    what: "Anyone can shape a game idea in the Game Engine. Publishing a playable game to OpenDoku only works for the owner for now.",
    status: "planned",
  },
];

function StatusRow({ item }: { item: Item }) {
  const s = STATUS[item.status];
  const inner = (
    <>
      <span className="row-name">{item.name}</span>
      <span className="row-side">
        <span className={`status-pill ${s.cls}`}>{s.label}</span>
        {item.href ? (
          <span aria-hidden="true" style={{ color: "var(--gold)", fontWeight: 900 }}>
            →
          </span>
        ) : null}
      </span>
      <p className="row-what">{item.what}</p>
    </>
  );
  return item.href ? (
    <Link className="row" href={item.href}>
      {inner}
    </Link>
  ) : (
    <div className="row row-static">{inner}</div>
  );
}

function List({ items }: { items: Item[] }) {
  return (
    <div className="rows">
      {items.map((i) => (
        <StatusRow key={i.name} item={i} />
      ))}
    </div>
  );
}

export default function WhatsBuiltPage() {
  return (
    <Sheet>
      <Masthead
        kicker="Open beta"
        title="What’s built, and what isn’t yet"
        lead="Everything here is free while it’s being tested. This page says plainly what you can use today, what is still being made, and how to tell us what you find."
      />

      <Band id="help-test" title="You’re early. Help test it." note="Ten minutes is plenty. Try any of these, then tell us what happened.">
        <ol className="test-runs">
          <li>
            <strong>Bring a real idea.</strong> Type something you actually want to make into{" "}
            <Link href="/create">the idea box</Link>. Does the first move make sense?
          </li>
          <li>
            <strong>Cut it down.</strong> Run the same idea through the{" "}
            <Link href="/tools/first-version">first version cutter</Link>. Is what’s left small enough to finish?
          </li>
          <li>
            <strong>Try one beta engine.</strong> Open one from the list below that fits what you’re making. Is what
            you get back something you’d actually use?
          </li>
        </ol>
        <p className="band-note">
          <a href="#tell-us">Tell us what happened ↓</a>
        </p>
      </Band>

      <Band
        id="works"
        title="Works today"
        note="Open it and finish it now. No account, and your work saves to this browser."
      >
        <List items={WORKS} />
      </Band>

      <Band
        id="beta"
        title="Beta: works, still being improved"
        note="Each one gives you a real result you can copy or download. Expect some rough edges."
      >
        <List items={BETA} />
      </Band>

      <Band id="private" title="Private or invite-only" note="Listed so nothing is hidden. These don't have an open door.">
        <List items={PRIVATE} />
      </Band>

      <Band id="not-yet" title="Still being built" note="Not open yet, so there is nothing to click.">
        <List items={NOT_YET} />
      </Band>

      <section className="band" id="tell-us">
        <TesterFeedback open title="Tell us what happened" />
        <p className="band-note" style={{ marginTop: 14 }}>
          Rather email? <a href="mailto:ask@openmirrorllc.com?subject=Step%20In%20The%20Ring%20feedback">ask@openmirrorllc.com</a>.
          Not sure where to begin? <Link href="/create">Say what you want to make</Link>, or{" "}
          <Link href="/tools">grab a free tool</Link>.
        </p>
      </section>
    </Sheet>
  );
}
