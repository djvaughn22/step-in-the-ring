import type { Metadata } from "next";
import Link from "next/link";
import products from "./live-products.json";

// THINGS MADE HERE — optional proof, not a required step. Most creations
// finish as a Build or a Library item and never need this page; this is
// just evidence for anyone who wants it, that real things came out of real
// ideas. Adding a product = one entry in live-products.json (the Game
// Engine's publish route appends automatically; everything else is a
// one-line edit).

export const metadata: Metadata = {
  title: "Things Made Here",
  description:
    "Real products that started as a rough idea in Step In The Ring and are live on the internet today. Proof, not a required step.",
};

const ENGINE_LABELS: Record<string, string> = {
  game: "🎮 Game Engine",
  "design-shop": "🛒 Design Shop Engine",
  build: "🛠️ Build Engine",
  music: "🎵 Music Engine",
  idea: "💡 Idea Engine",
};

type LiveProduct = {
  id: string;
  name: string;
  emoji: string;
  url: string;
  engine: string;
  blurb: string;
  pushedAt: string;
  by?: string;
};

export default function LivePage() {
  const items = (products as LiveProduct[])
    .slice()
    .sort((a, b) => (a.pushedAt < b.pushedAt ? 1 : -1));

  return (
    <main>
      <div className="page">
        <header className="mast">
          <span className="kicker">Proof</span>
          <h1 className="mast-title">Things made here</h1>
          <p className="mast-lead">
            Every one of these started as a rough idea and is live on the
            internet today. Newest first — open one and use it. This is
            proof, not something every Build needs to reach.
          </p>
          <hr className="rule mast-rule" />
        </header>

        <section className="band" style={{ paddingTop: 34 }}>
          <div className="stack">
            {items.map((p) => (
              <a key={p.id} href={p.url} target="_blank" rel="noopener noreferrer" className="door-card">
                <span className="door-emoji">{p.emoji}</span>
                <div style={{ minWidth: 0 }}>
                  <h3>{p.name}</h3>
                  <p>{p.blurb}</p>
                  <p style={{ fontSize: 11.5, marginTop: 6, color: "var(--dim)", fontWeight: 800 }}>
                    {ENGINE_LABELS[p.engine] ?? p.engine} · pushed {p.pushedAt}
                    {p.by ? ` · by ${p.by}` : ""}
                  </p>
                </div>
                <span className="door-go">→</span>
              </a>
            ))}
          </div>
        </section>

        <section className="home-section" style={{ textAlign: "center" }}>
          <p style={{ fontSize: 14, marginBottom: 16 }}>
            Most things you make here stay a Build or a Library item and
            never need this page. If what you&apos;re making is software you
            want live on the internet, this is where it can end up.
          </p>
          <Link href="/create" className="btn btn-gold">Start something</Link>
        </section>

        <div className="divider" />
        <p className="tiny" style={{ textAlign: "center" }}>
          Part of Open Mirror LLC. Kids should build with a parent or trusted adult.
        </p>
      </div>
    </main>
  );
}
