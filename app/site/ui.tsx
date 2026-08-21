// ─────────────────────────────────────────────────────────────────────────────
// PAGE PRIMITIVES — the small set of shapes every page here is built from.
//
// Why: pages used to be hand-styled one at a time. Some used the CSS classes
// in globals.css, some carried inline styles with their own hardcoded colour
// fallbacks, and the two drifted until it stopped looking like one product.
// These five pieces are the whole system. Reach for them first.
//
//   <Sheet>        the page column: one width, one rhythm, one bottom margin
//   <PageHead>     kicker → title → one lead sentence
//   <Section>      a titled band inside a Sheet
//   <DirectoryCard>  one row in a directory: name, sentence, where it goes
//   <AccessPill>   what kind of door something is behind
//
// These are server components on purpose. Nothing here holds state, so nothing
// here needs to ship JavaScript.
// ─────────────────────────────────────────────────────────────────────────────

import Link from "next/link";
import type { ReactNode } from "react";
import type { Access } from "./registry";
import { ACCESS_LABEL } from "./registry";

/** The page column. `wide` is for directories; everything else reads better narrow. */
export function Sheet({
  children,
  wide = false,
}: {
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <main className="sheet-main">
      <div className={wide ? "sheet sheet-wide" : "sheet"}>{children}</div>
    </main>
  );
}

export function PageHead({
  kicker,
  title,
  lead,
  children,
}: {
  kicker?: string;
  title: string;
  lead?: string;
  children?: ReactNode;
}) {
  return (
    <header className="page-head">
      {kicker ? <p className="kicker">{kicker}</p> : null}
      <h1 className="page-title">{title}</h1>
      {lead ? <p className="page-lead">{lead}</p> : null}
      {children}
    </header>
  );
}

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
    <section className="sec">
      <h2>{title}</h2>
      {lead ? <p className="sec-lead">{lead}</p> : null}
      {children}
    </section>
  );
}

export function AccessPill({ access }: { access: Access }) {
  if (access === "public") return null;
  return (
    <span className={`access-pill access-${access}`}>{ACCESS_LABEL[access]}</span>
  );
}

/**
 * One row in a directory. External links carry a safe rel and say so; internal
 * links use the router. The whole card is the target — no hover-only actions.
 */
export function DirectoryCard({
  name,
  what,
  href,
  emoji,
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
  const inner = (
    <>
      <div className="dir-top">
        {emoji ? <span className="dir-emoji">{emoji}</span> : null}
        <span className="dir-name">{name}</span>
        {access ? <AccessPill access={access} /> : null}
        <span className="dir-go" aria-hidden="true">
          {external ? "↗" : "→"}
        </span>
      </div>
      <p className="dir-what">{what}</p>
      {note ? <p className="dir-note">{note}</p> : null}
    </>
  );

  if (external) {
    return (
      <a
        className="dir-card"
        href={href}
        target="_blank"
        rel="noopener noreferrer"
      >
        {inner}
      </a>
    );
  }
  return (
    <Link className="dir-card" href={href}>
      {inner}
    </Link>
  );
}

export function DirectoryGrid({ children }: { children: ReactNode }) {
  return <div className="dir-grid">{children}</div>;
}
