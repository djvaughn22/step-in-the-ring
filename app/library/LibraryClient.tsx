"use client";

// The Library, rendered. Server-owned rows arrive as props; the only thing
// this component does on its own is LOOK — never write — at pre-account work
// sitting in this browser, and drop a starting point into the create flow.

import Link from "next/link";
import LegacyWork from "../vnext/LegacyWork";
import { STARTING_POINTS } from "../create/starting-points";

export interface SavedItem {
  id: string;
  title: string;
  /** The engine that made it, in words a person recognises. */
  madeWith: string;
  emoji: string;
  href: string;
  updatedAt: string;
}

/** "3 days ago" beats an ISO string when the question is "is this recent". */
function when(iso: string): string {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return "";
  const days = Math.floor((Date.now() - then) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return months === 1 ? "a month ago" : `${months} months ago`;
}

export default function LibraryClient({
  saved,
  signedIn,
  storeConfigured,
  listFailed,
}: {
  saved: SavedItem[];
  signedIn: boolean;
  storeConfigured: boolean;
  listFailed: boolean;
}) {
  return (
    <main>
      <div className="page">
        <header className="mast">
          <span className="kicker">Library</span>
          <h1 className="mast-title">Your library</h1>
          <p className="mast-lead">
            Things you made or saved that you can use again. Whatever you are
            still actively making lives on{" "}
            <Link href="/builds" className="more">Builds</Link>.
          </p>
          <hr className="rule mast-rule" />
        </header>

        {listFailed && (
          <section className="band">
            <div className="card">
              <h3>Your saved work didn&apos;t load</h3>
              <p>
                Something went wrong reading your account. This is not the same
                as having nothing saved, and nothing was lost. Reload in a
                moment.
              </p>
            </div>
          </section>
        )}

        <section className="band">
          <div className="band-head">
            <h2 className="band-title">Saved work</h2>
            <p className="band-note">
              {signedIn
                ? "Everything an engine made for you, kept on your account."
                : "Sign in and everything an engine makes for you is kept here, on any device."}
            </p>
          </div>

          {saved.length > 0 ? (
            <div className="rows">
              {saved.map((s) => (
                <a key={s.id} className="row" href={s.href}>
                  <span className="row-name">
                    <span aria-hidden="true">{s.emoji}</span> {s.title}
                  </span>
                  <span className="row-side">
                    <span className="row-path">{s.madeWith}</span>
                    <span aria-hidden="true" style={{ color: "var(--accent)", fontWeight: 900 }}>
                      →
                    </span>
                  </span>
                  <p className="row-what">Last touched {when(s.updatedAt)}.</p>
                </a>
              ))}
            </div>
          ) : (
            <div className="empty">
              <h2>{signedIn ? "Nothing saved yet" : "Nothing saved on an account yet"}</h2>
              <p>
                {signedIn
                  ? "Run an engine and what it makes for you turns up here."
                  : storeConfigured
                    ? "Work saved in this browser is still below. Signing in is what makes it follow you to another device."
                    : "Accounts are not switched on for this site yet. Work saved in this browser is still below."}
              </p>
              <div className="actions" style={{ justifyContent: "center" }}>
                <Link className="btn btn-gold" href="/engines">Open the engines</Link>
                {!signedIn && storeConfigured && (
                  <a className="btn btn-ghost" href="/members/login?returnTo=%2Flibrary">Sign in</a>
                )}
              </div>
            </div>
          )}
        </section>

        {/* Everything from before accounts existed. Read-only, and it renders
            its own heading so the whole section is absent when there is
            nothing rather than being an empty box. */}
        <LegacyWork
          heading="Saved in this browser"
          note="Work kept on this device from before accounts existed. Nothing was moved or changed — these open exactly where they always did."
        />

        <section className="band">
          <div className="band-head">
            <h2 className="band-title">Starting points</h2>
            <p className="band-note">
              Ways to begin that you can run again any time. Each one opens the
              create flow with the sentence half written.
            </p>
          </div>
          <div className="sp-grid">
            {STARTING_POINTS.map((sp) => (
              <Link
                key={sp.label}
                className="sp"
                href={`/create?stem=${encodeURIComponent(sp.stem)}#idea-description`}
              >
                <span className="sp-mark" aria-hidden="true">{sp.emoji}</span>
                <span className="sp-body">
                  <span className="sp-label">{sp.label}</span>
                  <span className="sp-what">{sp.what}</span>
                </span>
              </Link>
            ))}
          </div>
        </section>

        <div className="divider" />
        <p className="tiny" style={{ textAlign: "center" }}>
          Looking for the tools themselves?{" "}
          <Link href="/engines" className="more">They are on Engines</Link>.
        </p>
      </div>
    </main>
  );
}
