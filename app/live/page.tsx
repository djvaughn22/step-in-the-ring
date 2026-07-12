import type { Metadata } from "next";
import Link from "next/link";
import products from "./live-products.json";

// Live from the Ring — every product that went idea → local test → push.
// Adding a product = one entry in live-products.json (the Game Engine's
// publish route appends automatically; everything else is a one-line edit).

export const metadata: Metadata = {
  title: "Live Products — Step In The Ring",
  description:
    "Everything that stepped into the ring and made it out alive: tested locally, pushed live by Open Mirror. Real products from the seven questions.",
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
        <section className="hero" style={{ paddingBottom: 8 }}>
          <span className="kicker">Step In The Ring</span>
          <h1 style={{ fontSize: "clamp(32px, 7vw, 54px)" }}>
            Live <span style={{ color: "var(--gold)" }}>Products</span>
          </h1>
          <p className="hero-sub">
            Everything here started as a rough idea, answered the seven questions,
            got tested locally, and was pushed live. Real products, playable now.
          </p>
        </section>

        <section className="home-section" style={{ marginTop: 28 }}>
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
            Your build lands here the same way: answer the seven questions, build it,
            test it locally, send it to Open Mirror to push.
          </p>
          <Link href="/" className="btn btn-gold">🥊 Step in — start your plan</Link>
        </section>

        <div className="divider" />
        <p className="tiny" style={{ textAlign: "center" }}>
          Part of Open Mirror LLC. Kids should build with a parent or trusted adult.
        </p>
      </div>
    </main>
  );
}
