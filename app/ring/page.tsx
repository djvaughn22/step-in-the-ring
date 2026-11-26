import type { Metadata } from "next";
import Link from "next/link";
import { PoseFigure } from "./engine/PoseFigure";
import { LATER_AREAS, RINGS } from "./rings";
import "./ring.css";

// Creative Ring (owner direction, Nov 25 2026): watch something interesting,
// try it yourself, improve, share what you did if you want to. No accounts,
// no posting, nothing uploaded. The first ring is the Heisman.
export const metadata: Metadata = {
  title: "Creative Ring",
  description: "Watch something interesting, try it yourself, get better at it and share what you did if you want to. The first ring: the Heisman, on both sides.",
  alternates: { canonical: "/ring" },
};

export default function RingIndex() {
  return (
    <main className="rg-page">
      <header className="rg-head">
        <span className="kicker">Creative Ring</span>
        <h1>Watch it. Try it. Get better. Share it.</h1>
        <p>Short challenges you can try right now with a phone. Your tries stay on your device, and sharing is always your choice.</p>
        <ol className="rg-loop" aria-label="How a ring works">
          <li><span>1</span>Watch</li><li><span>2</span>Understand</li><li><span>3</span>Try</li><li><span>4</span>Record, if you like</li><li><span>5</span>Repeat</li><li><span>6</span>See your progress</li><li><span>7</span>Share, if you want</li>
        </ol>
      </header>
      <ul className="rg-cards rg">
        {RINGS.map((r) => (
          <li key={r.id}>
            <Link className="rg-card" href={`/ring/${r.id}`}>
              <span className="rg-area">{r.area} · {r.minutes}</span>
              <PoseFigure challenge={r.challenge} version="standing" side="left" motion="hold" label={`${r.title}: the pose`} />
              <h2>{r.title}</h2>
              <p>{r.line}</p>
              <span className="text-link">Step in&nbsp;→</span>
            </Link>
          </li>
        ))}
      </ul>
      <h2 style={{ fontSize: 20, marginTop: 10 }}>Rings for later</h2>
      <p className="rg-note">Ideas only, nothing built yet:</p>
      <ul className="rg-later">{LATER_AREAS.map((a) => <li key={a}>{a}</li>)}</ul>
      <p className="rg-note">Kids: try these with a grown-up nearby. Nothing here asks for a name, an account or a photo.</p>
    </main>
  );
}
