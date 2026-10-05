"use client";

// YOUR WORK (2026-10-04, was "Library"). Everything a person started here,
// in one place, separate from the Owner's Builds showroom. It lives in this
// browser — there is no sign-up. An invited tester who is signed in also sees
// what is on their account.
//
// This component only LOOKS at browser storage (LegacyWork is read-only);
// the one thing it can change is the single kept idea, through the same
// precise delete Builds always used.

import Link from "next/link";
import { useEffect, useState } from "react";
import LegacyWork from "../vnext/LegacyWork";
import LocalBuildCard from "../builds/LocalBuildCard";
import { loadCurrentCreation } from "../creation/record";
import type { CreationRecordV1 } from "../creation/types";

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
  listFailed,
}: {
  saved: SavedItem[];
  signedIn: boolean;
  /** Kept for callers; accounts are never offered here. */
  storeConfigured?: boolean;
  listFailed: boolean;
}) {
  const [idea, setIdea] = useState<CreationRecordV1 | null | undefined>(undefined);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- browser storage is only readable after mount
  useEffect(() => setIdea(loadCurrentCreation()), []);

  const nothingYet = (
    <section className="band">
      <div className="empty">
        <h2>Nothing here yet</h2>
        <p>
          Start with an idea or a free tool. Whatever you make shows up here,
          kept in this browser. No account needed.
        </p>
        <div className="actions" style={{ justifyContent: "center" }}>
          <Link className="btn btn-gold" href="/create">Start with an idea</Link>
          <Link className="btn btn-ghost" href="/tools">Open the free tools</Link>
        </div>
      </div>
    </section>
  );

  return (
    <main>
      <div className="page">
        <header className="mast">
          <span className="kicker">Your work</span>
          <h1 className="mast-title">Your work</h1>
          <p className="mast-lead">
            Everything you started here, in one place. It&apos;s kept in this
            browser, so it&apos;s here when you come back on this device. No
            account needed.
          </p>
          <hr className="rule mast-rule" />
        </header>

        {idea && (
          <section className="band" id="your-idea">
            <div className="band-head">
              <h2 className="band-title">Your idea</h2>
              <p className="band-note">The last idea you kept from the idea box. Continue it, or delete it.</p>
            </div>
            <div className="buildlist">
              <LocalBuildCard record={idea} onDeleted={() => setIdea(null)} />
            </div>
          </section>
        )}

        <LegacyWork
          heading="Tools and engines you've used"
          note="Open one to pick up where you left off."
          skip={["sitr-creation-current-v1", "sitr-builder-defaults-v1"]}
          empty={idea === null && !signedIn ? nothingYet : null}
        />

        {signedIn && (
          <section className="band">
            <div className="band-head">
              <h2 className="band-title">On your tester account</h2>
              <p className="band-note">
                What an engine made for you while signed in.{" "}
                <Link href="/builds#your-builds" className="more">Your account builds →</Link>
              </p>
            </div>

            {listFailed ? (
              <div className="card">
                <h3>Your saved work didn&apos;t load</h3>
                <p>
                  Something went wrong reading your account. This is not the same
                  as having nothing saved, and nothing was lost. Reload in a
                  moment.
                </p>
              </div>
            ) : saved.length > 0 ? (
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
              <p className="band-note">Nothing saved yet. Run an engine and what it makes turns up here.</p>
            )}
          </section>
        )}

        <div className="divider" />
        <p className="tiny" style={{ textAlign: "center" }}>
          Starting something new? <Link href="/create" className="more">Say what you want to make</Link>, or{" "}
          <Link href="/tools" className="more">grab a free tool</Link>.
        </p>
      </div>
    </main>
  );
}
