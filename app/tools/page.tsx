// FREE TOOLS — every small, single-job tool on the site, in the order of the
// loop (start → build → try and share). Each row is a real page that works
// today with no account. Names and sentences come from the site registry so
// this list and /everything can't drift apart.

import type { Metadata } from "next";
import Link from "next/link";
import { Band, Masthead, Row, Rows } from "../site/ui";
import { pageAt } from "../site/registry";

export const metadata: Metadata = {
  title: "Free tools",
  description:
    "Small free tools for turning an idea into something useful: cut it to a first version, plan a build session, test it with a real person, and check it before you share. No account.",
};

type ToolRow = { href: string; registryPath?: string; name?: string; what?: string };

const STAGES: { title: string; note: string; tools: ToolRow[] }[] = [
  {
    title: "Start",
    note: "When you have an idea and aren't sure what the first step is.",
    tools: [
      { href: "/create", registryPath: "/create", name: "The idea box" },
      { href: "/tools/first-version" },
    ],
  },
  {
    title: "Build",
    note: "When you're ready to make the first version.",
    tools: [
      { href: "/build" },
      { href: "/five-hour-sprint-tool", name: "Five Hour Sprint planner" },
      {
        href: "/products/ready-to-build#computer-check",
        registryPath: "/products/ready-to-build",
        name: "Computer check",
        what: "Find out, one question at a time, whether the computer you have is ready to build with.",
      },
      { href: "/build-machine" },
    ],
  },
  {
    title: "Try it and share it",
    note: "When it works for you and it's time to show someone.",
    tools: [{ href: "/tools/try-it" }, { href: "/tools/launch-checklist" }],
  },
];

function resolve(t: ToolRow) {
  const page = pageAt(t.registryPath ?? t.href);
  return { href: t.href, name: t.name ?? page?.name ?? t.href, what: t.what ?? page?.what ?? "" };
}

export default function ToolsPage() {
  return (
    <main>
      <div className="page" style={{ maxWidth: 820 }}>
        <Masthead
          kicker="Free tools"
          title="Small tools that each do one job."
          lead="Everything here is free, needs no account, and keeps your work in this browser. Pick the one that matches where you are."
        />
        {STAGES.map((stage) => (
          <Band key={stage.title} title={stage.title} note={stage.note}>
            <Rows>
              {stage.tools.map((t) => {
                const r = resolve(t);
                return <Row key={r.href} name={r.name} what={r.what} href={r.href} />;
              })}
            </Rows>
          </Band>
        ))}
        <p className="tiny" style={{ marginTop: 34 }}>
          Need more than a small tool? <Link href="/engines">The engines</Link> go deeper on one kind of
          work. Want a person instead? <Link href="/about#weekend-consulting">Ask about weekend help</Link>.
        </p>
      </div>
    </main>
  );
}
