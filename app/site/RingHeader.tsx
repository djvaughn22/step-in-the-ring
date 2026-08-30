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
//
// Four doors on the left are the product: Create, Engines, Builds, Library.
// The quieter set on the right is everything a person needs occasionally.
//
// 2026-08-30 nav simplification: "Everything" used to ride along here in
// every page's bar and mobile sheet — a fifth, unrelated idea (a full site
// directory) competing for space with the two things people actually reach
// for occasionally (how this works, their account). The directory route
// itself is untouched and still real; it's just no longer promoted in the
// primary chrome. It stays reachable from the quiet site-wide footer line
// (see app/site/QuietFooterLink.tsx) for transparency and compatibility.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { navPages } from "./registry";
import OpenMirrorThemeToggle, { AppearanceMenu } from "../OpenMirrorTheme";

// The four doors in .ring-nav are the product. These two are the things a
// person needs occasionally and should not have to hunt for: what this is,
// and their own account. Kept visually quieter on purpose — they are not
// part of the making loop.
const SECONDARY = [
  { name: "How", href: "/how" },
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
          {/* The family light/dark toggle. On phone, .ring-bar-end's LINKS
              hide (see globals.css) but the container and this button stay
              — the toggle used to vanish along with the whole group,
              leaving no way to change appearance on mobile at all. It also
              injects the theme's init script, which is what stops the page
              flashing light before a saved choice (or the dark default) is
              applied. */}
          <OpenMirrorThemeToggle />
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
        {/* The clearly-labeled Dark/Light/System control — the bare sun/moon
            icon up in the bar is reachable but not obvious on its own. */}
        <AppearanceMenu />
      </div>
    </header>
  );
}
