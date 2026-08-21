"use client";

// The Step In The Ring header.
//
// The shared Open Mirror bar is a 680px centred column with everything behind
// a hamburger. On a laptop that hides the entire product architecture and
// makes a 1440px screen look like a phone. Step In The Ring needs its doors
// visible, so it carries its own bar, the way CrossHeartPray does. The Open
// Mirror footer is untouched and still mounts on every page.
//
// The links come from app/site/registry.ts, so this bar can never drift from
// the Everything directory.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { navPages } from "./registry";

const SECONDARY = [
  { name: "Preview", href: "/preview" },
  { name: "Account", href: "/account" },
];

export default function RingHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const primary = navPages();

  return (
    <header className="ring-bar">
      <div className="ring-bar-in">
        <Link href="/" className="ring-brand">
          <span className="ring-brand-glyph" aria-hidden="true" />
          Step In The Ring
        </Link>

        <nav className="ring-nav" aria-label="Main">
          {primary.map((p) => (
            <Link
              key={p.path}
              href={p.path}
              aria-current={pathname === p.path ? "page" : undefined}
            >
              {p.name}
            </Link>
          ))}
        </nav>

        <div className="ring-bar-end">
          {SECONDARY.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              aria-current={pathname === s.href ? "page" : undefined}
            >
              {s.name}
            </Link>
          ))}
        </div>

        <button
          type="button"
          className="ring-burger"
          aria-expanded={open}
          aria-controls="ring-sheet"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Close" : "Menu"}
        </button>
      </div>

      <div id="ring-sheet" className={open ? "ring-sheet open" : "ring-sheet"}>
        {[...primary.map((p) => ({ name: p.name, href: p.path })), ...SECONDARY].map((l) => (
          <Link key={l.href} href={l.href} onClick={() => setOpen(false)}>
            {l.name}
          </Link>
        ))}
      </div>
    </header>
  );
}
