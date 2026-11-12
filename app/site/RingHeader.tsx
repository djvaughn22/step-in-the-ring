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
// The doors on the left are the product and what a first-time visitor asks
// about it. The quieter link on the right is for checking what's real.
//
// 2026-08-30 nav simplification: "Everything" used to ride along here in
// every page's bar and mobile sheet — a fifth, unrelated idea (a full site
// directory) competing for space with the two things people actually reach
// for occasionally (how this works, their account). The directory route
// itself is untouched and still real; it's just no longer promoted in the
// primary chrome. It stays reachable from the quiet site-wide footer line
// (see app/site/QuietFooterLink.tsx) for transparency and compatibility.

import Link from "next/link";
import RingMark from "./RingMark";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { morePages, navPages } from "./registry";
import { BRAND_SHORT } from "./brand";
import OpenMirrorThemeToggle, { AppearanceMenu } from "../OpenMirrorTheme";

// No Account link (owner, Oct 4 2026: no sign-up); invited testers sign in
// from the footer.
const SECONDARY = [
  { name: "What works today", href: "/whats-built" },
];

export default function RingHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const primary = navPages();
  // 2026-11-11: the website starter leads; the make-with-AI workspace, how it
  // works, tools and your saved work sit one level down under "More".
  const more = morePages();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!moreOpen) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !moreRef.current?.contains(e.target as Node)) setMoreOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", close); };
  }, [moreOpen]);
  const moreActive = more.some((p) => pathname === p.path);

  return (
    <header className="ring-bar">
      <div className="ring-bar-in">
        <Link href="/" className="ring-brand">
          <RingMark />
          <span>
            Step In The Ring
            {/* Somebody who followed a link straight to a tool still learns what
                this place is. Home says it in the hero, a few inches below. */}
            {pathname !== "/" && <small className="ring-brand-sub">{BRAND_SHORT}</small>}
          </span>
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
          <div className="ring-more" ref={moreRef}>
            <button
              type="button"
              aria-expanded={moreOpen}
              aria-controls="ring-more-menu"
              aria-current={moreActive ? "page" : undefined}
              onClick={() => setMoreOpen((v) => !v)}
            >
              More <span aria-hidden="true">▾</span>
            </button>
            <div id="ring-more-menu" className={moreOpen ? "ring-more-menu open" : "ring-more-menu"}>
              {more.map((p) => (
                <Link key={p.path} href={p.path} aria-current={pathname === p.path ? "page" : undefined} onClick={() => setMoreOpen(false)}>
                  <strong>{p.name}</strong>
                  <span>{p.what}</span>
                </Link>
              ))}
            </div>
          </div>
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
        {primary.map((p) => (
          <Link key={p.path} href={p.path} aria-current={pathname === p.path ? "page" : undefined} onClick={() => setOpen(false)}>
            {p.name}
          </Link>
        ))}
        <span className="ring-sheet-label">More</span>
        {[...more.map((p) => ({ name: p.name, href: p.path })), ...SECONDARY].map((l) => (
          <Link key={l.href} href={l.href} aria-current={pathname === l.href ? "page" : undefined} onClick={() => setOpen(false)}>
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
