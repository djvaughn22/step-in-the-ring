// The project cards, used by Made here (every group) and the home page (the
// featured few). Every card has the same parts in the same order, and the
// Visit link sits at the bottom of every card in a row.

import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { isExternal, workByGroup, type WorkItem } from "./work";

function Go({ href, className, children }: { href: string; className?: string; children: ReactNode }) {
  return isExternal(href) ? (
    <a className={className} href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  ) : (
    <Link className={className} href={href}>
      {children}
    </Link>
  );
}

function visitLabel(item: WorkItem): string {
  return isExternal(item.href) ? `Visit ${item.name}` : `Open ${item.name}`;
}

export function WorkCard({ item, compact = false }: { item: WorkItem; compact?: boolean }) {
  return (
    <article className="pf-card" style={{ "--pf-accent": item.accent } as CSSProperties}>
      <div className="pf-top">
        <span className="pf-icon" aria-hidden="true">{item.emoji}</span>
        <span className="pf-tag">{item.tag}</span>
      </div>
      <h3>{item.name}</h3>
      <p className="pf-what">{item.what}</p>
      {compact ? null : <p className="pf-shows"><span>What it shows:</span> {item.shows}</p>}
      {!compact && item.links?.length ? (
        <ul className="pf-links" aria-label={`Inside ${item.name}`}>
          {item.links.map((l) => (
            <li key={l.href}>
              <Go href={l.href}>{l.label}</Go>
            </li>
          ))}
        </ul>
      ) : null}
      <Go className="pf-visit" href={item.href}>
        {visitLabel(item)} <span aria-hidden="true">{isExternal(item.href) ? "↗" : "→"}</span>
      </Go>
    </article>
  );
}

export function WorkGrid({ items, compact = false }: { items: WorkItem[]; compact?: boolean }) {
  return (
    <div className={compact || items.length === 4 ? "pf-grid pf-grid-4" : "pf-grid"}>
      {items.map((item) => (
        <WorkCard key={item.name} item={item} compact={compact} />
      ))}
    </div>
  );
}

export default function Portfolio() {
  return (
    <div className="pf">
      {workByGroup().map(({ group, items }) => (
        <section key={group.id} className="pf-group" aria-labelledby={`pf-${group.id}`}>
          <div className="pf-group-head">
            <h2 id={`pf-${group.id}`}>{group.title}</h2>
            <p>{group.note}</p>
          </div>
          <WorkGrid items={items} />
        </section>
      ))}
    </div>
  );
}
