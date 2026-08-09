"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import LegacyWork from "../vnext/LegacyWork";
import type { Capability } from "../vnext/capabilities";
import { ACTIVATION_LABEL } from "../engines/engines";

const STATUS_CLASS: Record<string, string> = {
  working: "status-working",
  beta: "status-beta",
  "owner-only": "status-owner-only",
  "setup-ready": "status-beta",
  building: "status-building",
  planned: "status-planned",
  unavailable: "status-planned",
};

export default function LibraryClient({ capabilities }: { capabilities: Capability[] }) {
  const [filter, setFilter] = useState("");

  const { ready, ownerOnly, rest } = useMemo(() => {
    const q = filter.trim().toLowerCase();
    const match = (c: Capability) =>
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.what.toLowerCase().includes(q) ||
      c.needs.some((n) => n.includes(q));
    const shown = capabilities.filter(match);
    return {
      ready: shown.filter((c) => !c.ownerOnly && (c.activation === "working" || c.activation === "beta")),
      ownerOnly: shown.filter((c) => c.ownerOnly),
      rest: shown.filter((c) => !c.ownerOnly && c.activation !== "working" && c.activation !== "beta"),
    };
  }, [capabilities, filter]);

  const card = (c: Capability) => (
    <a key={c.id} href={c.href} className={`engine-card${c.ownerOnly ? " engine-card-quiet" : ""}`}>
      <div className="engine-foot">
        {/* An owner-only surface reads "Owner only" even when the work behind
            it is finished — "Works" next to something a visitor cannot open
            is the dishonest half of the truth. */}
        <span className={`status-pill ${c.ownerOnly ? "status-owner-only" : STATUS_CLASS[c.activation] ?? "status-planned"}`}>
          {c.ownerOnly ? ACTIVATION_LABEL["owner-only"] : ACTIVATION_LABEL[c.activation]}
        </span>
      </div>
      <span className="engine-name">
        <span aria-hidden="true">{c.emoji}</span> {c.name}
      </span>
      <span className="engine-line">{c.what}</span>
    </a>
  );

  return (
    <main>
      <div className="page">
        <section className="hero hero-compact" style={{ textAlign: "left" }}>
          <span className="kicker">Step In The Ring</span>
          <h1 style={{ fontSize: "clamp(28px, 6vw, 44px)" }}>Your work</h1>
          <p className="hero-sub" style={{ margin: "10px 0 0", maxWidth: 560 }}>
            Everything this place can do, and everything you saved here before. You never
            have to start from this list — but nothing is hidden from you either.
          </p>
        </section>

        <LegacyWork />

        <section className="home-section">
          <span className="kicker">What it can do</span>
          <label className="sr-only" htmlFor="library-filter">Filter capabilities</label>
          <input
            id="library-filter"
            type="search"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Search — song, game, design, fix…"
            style={{ marginBottom: 14 }}
          />
          {ready.length > 0 ? (
            <div className="engine-grid">{ready.map(card)}</div>
          ) : (
            <p className="section-lead">Nothing matches that word. Clear the search to see everything.</p>
          )}
        </section>

        {rest.length > 0 && (
          <section className="home-section">
            <span className="kicker">Being built</span>
            <div className="engine-grid">{rest.map(card)}</div>
          </section>
        )}

        {ownerOnly.length > 0 && (
          <section className="home-section">
            <span className="kicker">Owner only</span>
            <p className="section-lead">
              These run on the owner&apos;s machine. They&apos;re listed so the record is honest,
              not because you can use them yet.
            </p>
            <div className="engine-grid">{ownerOnly.map(card)}</div>
          </section>
        )}

        <div className="divider" />
        <p className="tiny" style={{ textAlign: "center" }}>
          <Link href="/" style={{ color: "var(--gold)", fontWeight: 800, textDecoration: "none" }}>
            Start something new →
          </Link>
          {" · "}
          <a href="/builds" style={{ color: "var(--muted)", fontWeight: 800, textDecoration: "none" }}>Your builds</a>
        </p>
      </div>
    </main>
  );
}
