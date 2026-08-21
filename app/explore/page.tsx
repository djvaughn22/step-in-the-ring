// EXPLORE — proof, not marketing.
//
// One rule: every card on this page points at something a visitor can open
// right now. If you can't click it and use it, it doesn't belong here. No
// testimonials, no logos, no counts, no "trusted by".
//
// Products come from app/site/registry.ts. Individual builds come from
// app/live/live-products.json, which the Game Engine's publish route appends
// to, so this page grows when something actually ships.

import type { Metadata } from "next";
import Link from "next/link";
import { ECOSYSTEM } from "../site/registry";
import { Sheet, Masthead, Band, Tiles, Tile, accentVars } from "../site/ui";
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
  // The arcade is the fullest thing anyone can walk into, so it leads.
  const featured = ECOSYSTEM.find((p) => p.name === "iDontCry");
  const rest = ECOSYSTEM.filter((p) => p.liveUrl && p !== featured);
  const builds = (liveProducts as LiveProduct[]).slice(0, 8);

  return (
    <Sheet wide>
      <Masthead
        kicker="Explore"
        title="Things that got made"
        lead="Every one of these started as a rough idea in a box like the one on the front page. They are all open. Go look."
      />

      {featured ? (
        <section className="band">
          <a
            className="feature"
            href={featured.liveUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={accentVars(featured.accent)}
          >
            <div className="feature-body">
              <span className="kicker">Start here</span>
              <h2 className="feature-name">{featured.name}</h2>
              <p className="feature-what">{featured.what}</p>
              <p className="feature-real">{featured.real}</p>
              <span className="btn btn-gold">Open the arcade</span>
            </div>
            <div className="feature-art" aria-hidden="true">
              {featured.emoji}
            </div>
          </a>
        </section>
      ) : null}

      <Band
        title="The other products"
        note="Each one is for a different person. Nothing here is a demo."
      >
        <Tiles>
          {rest.map((p) => (
            <Tile key={p.name} p={p} />
          ))}
        </Tiles>
      </Band>

      <Band
        title="Pushed live"
        note="Individual builds that went idea, then tested on a laptop, then live on the internet."
      >
        <Tiles>
          {builds.map((b) => (
            <a
              key={b.id}
              className="tile"
              href={b.url}
              target="_blank"
              rel="noopener noreferrer"
              style={accentVars("#6FBF9B")}
            >
              <span className="tile-mark" aria-hidden="true">
                {b.emoji}
              </span>
              <h3 className="tile-name">{b.name}</h3>
              <p className="tile-what">{b.blurb}</p>
              <span className="tile-foot">
                <span className="dot" />
                {b.pushedAt}
                <span className="tile-open">Play</span>
              </span>
            </a>
          ))}
        </Tiles>
        <p style={{ marginTop: 20, fontSize: 14 }}>
          <Link href="/live" style={{ color: "var(--gold)", fontWeight: 800 }}>
            Every push, newest first
          </Link>
        </p>
      </Band>

      <section className="closing">
        <p>None of these were obvious at the start.</p>
        <Link href="/" className="btn btn-gold btn-big">
          Make something
        </Link>
      </section>
    </Sheet>
  );
}
