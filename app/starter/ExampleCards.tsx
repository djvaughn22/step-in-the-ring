import Link from "next/link";
import { EXAMPLE_GROUPS, EXAMPLES } from "./examples";
import { paletteById } from "./draft";
import type { StarterExample } from "./types";

// The 22 examples as cards, in plain groups. Used by /start (pick one to
// begin) and /examples (look around first). Same cards, different main link.

function Swatch({ ex }: { ex: StarterExample }) {
  const p = paletteById(ex.palette);
  return (
    <span className="xc-swatch" aria-hidden="true" style={{ background: p.bg }}>
      <i style={{ background: ex.accent }} />
      <i style={{ background: p.alt }} />
      <i style={{ background: p.text }} />
    </span>
  );
}

export default function ExampleCards({ main }: { main: "start" | "view" }) {
  return (
    <div className="xc-groups">
      {EXAMPLE_GROUPS.map((g) => {
        const list = EXAMPLES.filter((e) => e.group === g);
        return (
          <section key={g} className="xc-group" aria-labelledby={`g-${g.replace(/\W+/g, "-")}`}>
            <h2 id={`g-${g.replace(/\W+/g, "-")}`}>{g}</h2>
            <ul className="xc-grid">
              {list.map((ex) => (
                <li key={ex.slug} className="xc-card">
                  <Swatch ex={ex} />
                  <strong>{ex.name}</strong>
                  <span>{ex.blurb}</span>
                  <span className="xc-go">
                    {main === "start" ? (
                      <>
                        <Link className="btn btn-gold btn-small" href={`/start/edit?example=${ex.slug}`} aria-label={`Start from the ${ex.name.toLowerCase()} example`}>Start from this</Link>
                        <Link className="text-link" href={`/examples/${ex.slug}`} aria-label={`See the ${ex.name.toLowerCase()} example`}>See it first</Link>
                      </>
                    ) : (
                      <>
                        <Link className="btn btn-ghost btn-small" href={`/examples/${ex.slug}`} aria-label={`See the ${ex.name.toLowerCase()} example`}>See the example</Link>
                        <Link className="text-link" href={`/start/edit?example=${ex.slug}`} aria-label={`Start from the ${ex.name.toLowerCase()} example`}>Start from this</Link>
                      </>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
