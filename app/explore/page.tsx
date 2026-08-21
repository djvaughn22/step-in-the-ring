// EXPLORE — proof, not marketing.
//
// Every card on this page points at something a visitor can open right now.
// That is the whole test: if you can't click it and use it, it doesn't belong
// here. No testimonials, no logos, no counts, no "trusted by".
//
// Products come from app/site/registry.ts. Individual builds come from
// app/live/live-products.json, which is appended by the Game Engine's publish
// route — so this page grows when something actually ships.

import type { Metadata } from "next";
import Link from "next/link";
import { ECOSYSTEM } from "../site/registry";
import { Sheet, PageHead, Section, DirectoryCard, DirectoryGrid } from "../site/ui";
import liveProducts from "../live/live-products.json";

export const metadata: Metadata = {
  title: "Explore",
  description:
    "Real products and real builds that came out of Step In The Ring. Every one of them opens.",
};

type LiveProduct = {
  id: string;
  name: string;
  emoji: string;
  url: string;
  blurb: string;
  pushedAt: string;
};

export default function ExplorePage() {
  const builds = (liveProducts as LiveProduct[]).slice(0, 6);

  return (
    <Sheet wide>
      <PageHead
        kicker="Explore"
        title="Things that got made"
        lead="Every one of these started as a rough idea in a box like the one on the front page. They're all open — go look."
      />

      <Section
        title="Products"
        lead="Full sites, each one for a different kind of person."
      >
        <DirectoryGrid>
          {ECOSYSTEM.filter((p) => p.liveUrl).map((p) => (
            <DirectoryCard
              key={p.name}
              emoji={p.emoji}
              name={p.name}
              what={p.what}
              note={`For ${p.who} · ${p.real}`}
              href={p.liveUrl!}
              external
            />
          ))}
        </DirectoryGrid>
      </Section>

      <Section
        title="Recently pushed live"
        lead="Individual builds that went idea → tested on a laptop → live on the internet."
      >
        <DirectoryGrid>
          {builds.map((b) => (
            <DirectoryCard
              key={b.id}
              emoji={b.emoji}
              name={b.name}
              what={b.blurb}
              note={`Pushed ${b.pushedAt}`}
              href={b.url}
              external
            />
          ))}
        </DirectoryGrid>
        <p className="dir-note">
          <Link href="/live" style={{ color: "var(--gold)", fontWeight: 800 }}>
            See all of them →
          </Link>
        </p>
      </Section>

      <Section title="Your turn">
        <p className="sec-lead">
          None of these were obvious at the start. Say what you want to make and
          find out what it actually is.
        </p>
        <Link href="/" className="btn btn-gold">
          Start a build
        </Link>
      </Section>
    </Sheet>
  );
}
