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
        <header className="mast">
          <span className="kicker">Library</span>
          <h1 className="mast-title">Things you can use</h1>
          <p className="mast-lead">
            Every tool in here, with an honest label on each one. You never have
            to start from this list, but nothing is hidden from you either.
          </p>
          <hr className="rule mast-rule" />
        </header>

        <section className="band">
          <div className="band-head">
            <h2 className="band-title">Ready to use</h2>
            <p className="band-note">
              Open any of these directly, or just say what you want to make and
              the right one gets suggested.
            </p>
          </div>
          <label className="sr-only" htmlFor="library-filter">Filter tools</label>
          <input
            id="library-filter"
            className="lib-search"
            type="search"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Search: song, game, design, fix"
          />
          {ready.length > 0 ? (
            <div className="engine-grid">{ready.map(card)}</div>
          ) : (
            <p className="band-note">Nothing matches that word. Clear the search to see everything.</p>
          )}
        </section>

        {rest.length > 0 && (
          <section className="band">
            <div className="band-head">
              <h2 className="band-title">Still being built</h2>
            </div>
            <div className="engine-grid">{rest.map(card)}</div>
          </section>
        )}

        {ownerOnly.length > 0 && (
          <section className="band">
            <div className="band-head">
              <h2 className="band-title">Owner only</h2>
              <p className="band-note">
                These run on the owner&apos;s machine. Listed so the record is
                honest, not because you can use them yet.
              </p>
            </div>
            <div className="engine-grid">{ownerOnly.map(card)}</div>
          </section>
        )}

        <section className="band">
          <div className="band-head">
            <h2 className="band-title">Saved here before</h2>
            <p className="band-note">
              Work that lives in this browser from before builds existed. Nothing
              was thrown away.
            </p>
          </div>
          <LegacyWork />
        </section>

        <section className="closing">
          <p>Know what you want to make?</p>
          <Link href="/" className="btn btn-gold btn-big">Start something</Link>
        </section>
      </div>
    </main>
  );
}
