// ─────────────────────────────────────────────────────────────────────────────
// PAGE PRIMITIVES — the shapes every page here is built from.
//
//   <Sheet>        the page column. `wide` uses the full stage.
//   <Masthead>     big title, one line under it, rule beneath
//   <Band>         a titled section with a rule and an optional note
//   <Rows>/<Row>   a list of places you can go: name, sentence, door, route
//   <Tile>         a product, keeping its own colour
//   <AccessPill>   what kind of door something is behind
//
// PageHead/Section/DirectoryCard/DirectoryGrid are kept as aliases so the
// content pages that already use them pick up the new look for free.
//
// Server components: nothing here holds state, so nothing ships JavaScript.
// ─────────────────────────────────────────────────────────────────────────────

import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import type { Access, EcosystemProject } from "./registry";
import { ACCESS_LABEL } from "./registry";

/** The page column. Directories and proof pages want `wide`. */
export function Sheet({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  return (
    <main>
      <div className="page" style={wide ? undefined : { maxWidth: 760 }}>
        {children}
      </div>
    </main>
  );
}

/** Big title, one sentence, rule. The top of every page that isn't the home. */
export function Masthead({
  kicker,
  title,
  lead,
  children,
}: {
  kicker?: string;
  title: ReactNode;
  lead?: string;
  children?: ReactNode;
}) {
  return (
    <header className="mast">
      {kicker ? <span className="kicker">{kicker}</span> : null}
      <h1 className="mast-title">{title}</h1>
      {lead ? <p className="mast-lead">{lead}</p> : null}
      {children}
      <hr className="rule mast-rule" />
    </header>
  );
}

/** A titled section. */
export function Band({
  id,
  title,
  note,
  children,
}: {
  id?: string;
  title: string;
  note?: string;
  children: ReactNode;
}) {
  return (
    <section className="band" id={id}>
      <div className="band-head">
        <h2 className="band-title">{title}</h2>
        {note ? <p className="band-note">{note}</p> : null}
      </div>
      {children}
    </section>
  );
}

/** Links across the top of a long directory. */
export function Jump({ items }: { items: { label: string; href: string }[] }) {
  return (
    <nav className="jump" aria-label="Jump to a section">
      {items.map((i) => (
        <a key={i.href} href={i.href}>
          {i.label}
        </a>
      ))}
    </nav>
  );
}

export function AccessPill({ access }: { access: Access }) {
  if (access === "public") return null;
  return <span className={`access-pill access-${access}`}>{ACCESS_LABEL[access]}</span>;
}

export function Rows({ children }: { children: ReactNode }) {
  return <div className="rows">{children}</div>;
}

/** One place you can go. The whole row is the target. */
export function Row({
  name,
  what,
  href,
  access,
  path,
  external = false,
}: {
  name: string;
  what: string;
  href: string;
  access?: Access;
  /** Shown small and mono on the right. Secondary by design. */
  path?: string;
  external?: boolean;
}) {
  const inner = (
    <>
      <span className="row-name">{name}</span>
      <span className="row-side">
        {access ? <AccessPill access={access} /> : null}
        {path ? <span className="row-path">{path}</span> : null}
        <span aria-hidden="true" style={{ color: "var(--gold)", fontWeight: 900 }}>
          {external ? "↗" : "→"}
        </span>
      </span>
      <p className="row-what">{what}</p>
    </>
  );
  if (external) {
    return (
      <a className="row" href={href} target="_blank" rel="noopener noreferrer">
        {inner}
      </a>
    );
  }
  return (
    <Link className="row" href={href}>
      {inner}
    </Link>
  );
}

/** Product colour as CSS custom properties, so a wall of tiles isn't grey. */
export function accentVars(accent: string): CSSProperties {
  return { "--tile-accent": accent, "--tile-soft": `${accent}1A` } as CSSProperties;
}

export function Tiles({ children }: { children: ReactNode }) {
  return <div className="tiles">{children}</div>;
}

/** A product, with its own identity. */
export function Tile({ p }: { p: EcosystemProject }) {
  const body = (
    <>
      <span className="tile-mark" aria-hidden="true">
        {p.emoji}
      </span>
      <h3 className="tile-name">{p.name}</h3>
      <p className="tile-what">{p.what}</p>
      <span className="tile-foot">
        <span className={p.status === "live" ? "dot" : "dot dot-building"} />
        {p.status === "live" ? "Live" : "Building"}
        <span className="tile-open">Open</span>
      </span>
    </>
  );
  if (!p.liveUrl) {
    return (
      <div className="tile" style={accentVars(p.accent)}>
        {body}
      </div>
    );
  }
  return (
    <a
      className="tile"
      href={p.liveUrl}
      target="_blank"
      rel="noopener noreferrer"
      style={accentVars(p.accent)}
    >
      {body}
    </a>
  );
}

// ── Kept names, new look ────────────────────────────────────────────────────
export const PageHead = Masthead;
export function Section({
  title,
  lead,
  children,
}: {
  title: string;
  lead?: string;
  children: ReactNode;
}) {
  return (
    <Band title={title} note={lead}>
      {children}
    </Band>
  );
}
export function DirectoryGrid({ children }: { children: ReactNode }) {
  return <div className="rows">{children}</div>;
}
export function DirectoryCard({
  name,
  what,
  href,
  access,
  note,
  external = false,
}: {
  name: string;
  what: string;
  href: string;
  emoji?: string;
  access?: Access;
  note?: string;
  external?: boolean;
}) {
  return (
    <Row
      name={name}
      what={note ? `${what} ${note}` : what}
      href={href}
      access={access}
      external={external}
    />
  );
}
