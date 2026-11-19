"use client";

// The examples, findable: type your kind of work or pick a group, and the
// closest examples come first. Every card shows a small sketch of the site.
// What a visitor types stays in this component's state: never stored, sent,
// counted or put in a URL.

import Link from "next/link";
import { useDeferredValue, useId, useMemo, useState } from "react";
import MiniSite, { type MiniData } from "./MiniSite";
import { findExamples } from "./finder";

export interface CardData {
  slug: string;
  name: string;
  group: string;
  blurb: string;
  keywords: string[];
  mini: MiniData;
}

function Card({ c, main }: { c: CardData; main: "start" | "view" }) {
  const startHref = `/start/edit?example=${c.slug}`;
  const viewHref = `/examples/${c.slug}`;
  const lower = c.name.toLowerCase();
  return (
    <li className="xc-card">
      <Link className="xc-mini" href={viewHref} tabIndex={-1} aria-hidden="true">
        <MiniSite m={c.mini} />
      </Link>
      <strong>{c.name}</strong>
      <span>{c.blurb}</span>
      <span className="xc-go">
        {main === "start" ? (
          <>
            <Link className="btn btn-gold btn-small" href={startHref} aria-label={`Start from the ${lower} example`}>Start from this</Link>
            <Link className="text-link" href={viewHref} aria-label={`See the ${lower} example`}>See it first</Link>
          </>
        ) : (
          <>
            <Link className="btn btn-ghost btn-small" href={viewHref} aria-label={`See the ${lower} example`}>See the example</Link>
            <Link className="text-link" href={startHref} aria-label={`Start from the ${lower} example`}>Start from this</Link>
          </>
        )}
      </span>
    </li>
  );
}

function Grouped({ cards, groups, main }: { cards: CardData[]; groups: string[]; main: "start" | "view" }) {
  return (
    <div className="xc-groups">
      {groups.map((g) => {
        const list = cards.filter((c) => c.group === g);
        if (!list.length) return null;
        const id = `g-${g.replace(/\W+/g, "-")}`;
        return (
          <section key={g} className="xc-group" aria-labelledby={id}>
            <h2 id={id}>{g}</h2>
            <ul className="xc-grid">{list.map((c) => <Card key={c.slug} c={c} main={main} />)}</ul>
          </section>
        );
      })}
    </div>
  );
}

export default function ExampleFinder({ cards, groups, main }: { cards: CardData[]; groups: string[]; main: "start" | "view" }) {
  const id = useId();
  const [q, setQ] = useState("");
  const [group, setGroup] = useState("");
  const query = useDeferredValue(q);
  const searching = query.trim().length > 0;
  const found = useMemo(() => findExamples(cards, query, group), [cards, query, group]);
  const noMatch = searching && found.length === 0;
  const shownGroups = group ? [group] : groups;

  let status = "";
  if (noMatch) status = "Nothing matches that yet. Start from the closest kind of work below: every word, color and section can change.";
  else if (searching) status = found.length === 1 ? "1 example is close to that." : `${found.length} examples are close to that, closest first.`;
  else if (group) status = `${found.length} ${found.length === 1 ? "example" : "examples"} in ${group}.`;

  return (
    <div className="xf">
      <div className="xf-bar" role="search">
        <label className="xf-label" htmlFor={id}>What kind of work do you do?</label>
        <div className="xf-field">
          <input
            id={id}
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="e.g. dog grooming, cakes, a club"
            autoComplete="off"
            enterKeyHint="search"
            spellCheck={false}
          />
          {q ? <button type="button" className="xf-clear" onClick={() => setQ("")}>Clear</button> : null}
        </div>
        <div className="xf-chips" role="group" aria-label="Show examples for">
          <button type="button" aria-pressed={!group} onClick={() => setGroup("")}>All</button>
          {groups.map((g) => (
            <button key={g} type="button" aria-pressed={group === g} onClick={() => setGroup(group === g ? "" : g)}>{g}</button>
          ))}
        </div>
      </div>
      <p className="xf-status" role="status">{status}</p>
      {searching && !noMatch ? (
        <ul className="xc-grid xf-found">{found.map((c) => <Card key={c.slug} c={c} main={main} />)}</ul>
      ) : (
        <Grouped cards={noMatch && group ? cards.filter((c) => c.group === group) : cards} groups={shownGroups} main={main} />
      )}
    </div>
  );
}
