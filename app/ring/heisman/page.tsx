import type { Metadata } from "next";
import Link from "next/link";
import RingChallenge from "../RingChallenge";
import { HEISMAN } from "../engine/heisman";
import "../ring.css";

// The first Creative Ring: the Heisman (working name until the owner approves
// one), with the original two-sides mechanics from iDontCry.
export const metadata: Metadata = {
  title: "The Heisman | Creative Ring",
  description: HEISMAN.lede,
  alternates: { canonical: "/ring/heisman" },
};

export default function HeismanRing() {
  return (
    <main className="rg-page">
      <Link className="breadcrumb" href="/ring">← Creative Ring</Link>
      <header className="rg-head">
        <span className="kicker">Creative Ring · Movement</span>
        <h1>{HEISMAN.title}</h1>
        <p>{HEISMAN.lede}</p>
      </header>
      <RingChallenge challenge={HEISMAN} />
    </main>
  );
}
