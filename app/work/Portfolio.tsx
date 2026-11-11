// Our work as big showcase tiles (owner, Nov 10). Made here shows all of it;
// the home page shows the featured few with <WorkTiles>.
//
// Spotlight tiles carry their own small links (games, sports pages), so the
// main link is a button-like link inside them. Grid tiles have nothing inside,
// so the whole tile is one link: a big, easy target on a phone.

import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { ONSITE_WORK, SPOTLIGHT_WORK, TILE_WORK, isExternal, type WorkItem } from "./work";

function Go({ href, className, children, label }: { href: string; className?: string; children: ReactNode; label?: string }) {
  return isExternal(href) ? (
    <a className={className} href={href} target="_blank" rel="noopener noreferrer" aria-label={label}>
      {children}
    </a>
  ) : (
    <Link className={className} href={href} aria-label={label}>
      {children}
    </Link>
  );
}

const accent = (item: WorkItem) => ({ "--pf-accent": item.accent }) as CSSProperties;
const arrow = (href: string) => (isExternal(href) ? "↗" : "→");

function Spotlight({ item }: { item: WorkItem }) {
  const verb = item.tag === "Games" ? "Play" : "Open";
  return (
    <article className="pf-spot" style={accent(item)}>
      <div className="pf-spot-head">
        <span className="pf-emoji" aria-hidden="true">{item.emoji}</span>
        <span className="pf-tag">{item.tag}</span>
      </div>
      <h2>{item.name}</h2>
      <p>{item.line}</p>
      {item.links?.length ? (
        <ul className="pf-chips" aria-label={`Inside ${item.name}`}>
          {item.links.map((l) => (
            <li key={l.href}>
              <Go href={l.href}>{l.label}</Go>
            </li>
          ))}
        </ul>
      ) : null}
      <Go className="pf-spot-go" href={item.href}>
        {verb} {item.name.replace(/^iDontCry /, "the ")} <span aria-hidden="true">{arrow(item.href)}</span>
      </Go>
    </article>
  );
}

export function WorkTile({ item }: { item: WorkItem }) {
  return (
    <Go className="pf-tile" href={item.href}>
      <span className="pf-tile-band" style={accent(item)} aria-hidden="true">
        <span className="pf-emoji">{item.emoji}</span>
        <span className="pf-tag">{item.tag}</span>
      </span>
      <strong>{item.name}</strong>
      <span className="pf-line">{item.line}</span>
      <span className="pf-visit">
        Visit <span aria-hidden="true">{arrow(item.href)}</span>
      </span>
    </Go>
  );
}

export function WorkTiles({ items }: { items: WorkItem[] }) {
  return (
    <div className="pf-tiles">
      {items.map((item) => (
        <WorkTile key={item.name} item={item} />
      ))}
    </div>
  );
}

export default function Portfolio() {
  return (
    <div className="pf">
      <div className="pf-spots">
        {SPOTLIGHT_WORK.map((item) => (
          <Spotlight key={item.name} item={item} />
        ))}
      </div>
      <WorkTiles items={TILE_WORK} />
      <p className="pf-onsite">
        <span>Also on this site:</span>{" "}
        {ONSITE_WORK.map((item, i) => (
          <span key={item.name}>
            {i > 0 ? " · " : null}
            <Link href={item.href}>{item.name}</Link>, {item.line.charAt(0).toLowerCase() + item.line.slice(1, -1)}
          </span>
        ))}
        .
      </p>
    </div>
  );
}
