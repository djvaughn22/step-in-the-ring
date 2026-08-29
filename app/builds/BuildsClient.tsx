"use client";

// The Your Builds surface. Everything server-owned arrives as props. This
// component creates a Build through the existing member projects API,
// deletes one through the same account's DELETE route, LOOKS — never writes
// — at pre-vNext work in this browser (LegacyWork, untouched), and owns one
// more piece of browser-local state: the single current-creation slot
// (`sitr-creation-current-v1`), which it can show and precisely delete —
// never a blind clear of that or any other local key.

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import CreationEntry from "../vnext/CreationEntry";
import LegacyWork from "../vnext/LegacyWork";
import { capabilitiesForIntent, displayName } from "../vnext/capabilities";
import {
  BUILD_STAGE_LABEL, BUILD_STAGE_LINE, BUILD_STAGES, type BuildRecordV1,
} from "../vnext/build";
import { clearDraft, loadDraft } from "../vnext/draft";
import { deleteCurrentCreationIfMatches, loadCurrentCreation, viewOf } from "../creation/record";
import type { CreationRecordV1 } from "../creation/types";
import { shapingFromView } from "../vnext/shape";
import { DeleteBuildControl } from "./DeleteBuildControl";

/* Where this build actually is. A filled track says it at a glance; the old
   row of pills made every stage look equally true. */
function StageTrack({ stage }: { stage: BuildRecordV1["stage"] }) {
  const at = BUILD_STAGES.indexOf(stage);
  return (
    <>
      <div className="track" role="img" aria-label={`Stage: ${BUILD_STAGE_LABEL[stage]}`}>
        {BUILD_STAGES.map((s, i) => (
          <span key={s} className={`track-seg${i < at ? " done" : i === at ? " now" : ""}`} />
        ))}
      </div>
      <div className="track-labels" aria-hidden="true">
        {BUILD_STAGES.map((s, i) => (
          <span key={s} className={i === at ? "now" : undefined}>
            {BUILD_STAGE_LABEL[s]}
          </span>
        ))}
      </div>
    </>
  );
}

function BuildCard({
  build,
  canDelete,
  onDeleted,
}: {
  build: BuildRecordV1;
  canDelete: boolean;
  /** Called after a confirmed server-side delete succeeds — id only, never the title/summary. */
  onDeleted: (id: string, intent: string) => void;
}) {
  const suggested = useMemo(() => capabilitiesForIntent(build.intent, 3), [build.intent]);
  return (
    <article className="buildcard">
      <span className="bc-stage">{BUILD_STAGE_LINE[build.stage]}</span>
      <h2 className="bc-name">
        <Link href={`/builds/${build.id}`}>{build.title}</Link>
      </h2>
      <p className="bc-read">{build.reading ?? build.intent}</p>

      <StageTrack stage={build.stage} />

      {build.currentAction && (
        <div className="bc-now">
          <span className="bc-now-l">Next move</span>
          <p>{build.currentAction}</p>
        </div>
      )}

      {suggested.length > 0 && (
        <>
          {/* Never a bare row of names. A person looking at their own build
              needs to know why these three are here before they click one. */}
          <span className="bc-help-l">Engines that fit this</span>
          <div className="bc-help">
            {suggested.map((c) => (
              <a key={c.id} href={c.href}>
                <span aria-hidden="true">{c.emoji}</span> {displayName(c)}
              </a>
            ))}
          </div>
        </>
      )}

      {build.artifacts.length > 0 && (
        <ul className="plan-list" style={{ marginBottom: 16 }}>
          {build.artifacts.map((a) => (
            <li key={a.id}>{a.label}</li>
          ))}
        </ul>
      )}

      {/* One obvious action per card. Continuing is what this page is for —
          delete sits quietly beside it, closed until asked for. */}
      <div className="bc-foot">
        <Link className="btn btn-gold" href={`/builds/${build.id}`}>
          Continue
        </Link>
        {canDelete && (
          <DeleteBuildControl
            onConfirm={async () => {
              try {
                const res = await fetch(`/api/members/projects/${build.id}`, { method: "DELETE" });
                const data = (await res.json()) as { ok?: boolean };
                if (!res.ok || !data.ok) return false;
                onDeleted(build.id, build.intent);
                return true;
              } catch {
                return false;
              }
            }}
          />
        )}
      </div>
    </article>
  );
}

/**
 * The one browser-local creation — `sitr-creation-current-v1` — shown and
 * made deletable in its own right. Distinct section from the account list
 * on purpose: it is not the same storage, and deleting it never touches an
 * account Build (or vice versa; see the reconciliation in BuildsClient).
 */
function LocalBuildCard({
  record,
  onDeleted,
}: {
  record: CreationRecordV1;
  onDeleted: () => void;
}) {
  const shaping = useMemo(() => shapingFromView(viewOf(record)), [record]);
  const resumeHref = `/create?idea=${encodeURIComponent(record.originalIdea.slice(0, 600))}`;
  return (
    <article className="buildcard">
      <span className="bc-stage">Only in this browser</span>
      <h2 className="bc-name">{shaping.title}</h2>
      <p className="bc-read">{shaping.reading}</p>
      <div className="bc-foot">
        <Link className="btn btn-gold" href={resumeHref}>
          Continue
        </Link>
        <DeleteBuildControl
          onConfirm={async () => {
            const ok = deleteCurrentCreationIfMatches(record.creationId);
            if (ok) onDeleted();
            return ok;
          }}
        />
      </div>
    </article>
  );
}

export default function BuildsClient({
  builds,
  signedIn,
  canSave,
  storeConfigured,
  email,
  initialIntent,
  listFailed,
}: {
  builds: BuildRecordV1[];
  signedIn: boolean;
  canSave: boolean;
  storeConfigured: boolean;
  email: string | null;
  /** Handed over from the landing page as ?intent=, read on the server. */
  initialIntent: string;
  /** The account list could not be read. NOT the same as having no builds. */
  listFailed: boolean;
}) {
  const [intent, setIntent] = useState(initialIntent);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** An idea that was in flight when they arrived (possibly via sign-in). */
  const [fromDraft, setFromDraft] = useState(false);
  /** Local, mutable copy of the server-provided list — deleting one updates
      this page immediately, with no reload and no refetch. */
  const [buildList, setBuildList] = useState(builds);
  const [localRecord, setLocalRecord] = useState<CreationRecordV1 | null>(null);

  /* Pick up an idea left in flight by "Keep this build". A ?intent= handed
     over from an older link still wins — it is the more explicit request. */
  useEffect(() => {
    if (initialIntent.trim()) return;
    const draft = loadDraft();
    if (!draft) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIntent(draft.intent);
    setAnswers(draft.answers);
    setFromDraft(true);
  }, [initialIntent]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setLocalRecord(loadCurrentCreation()), []);

  /** An account Build was deleted. Remove only that one card, and — if the
      one local creation is that exact same creation, their words matching
      word for word — clear it too, since it is stale now. Any other Build,
      and anything else in this browser, is untouched. */
  function handleBuildDeleted(id: string, deletedIntent: string) {
    setBuildList((cur) => cur.filter((b) => b.id !== id));
    setLocalRecord((cur) => {
      if (!cur || cur.originalIdea !== deletedIntent) return cur;
      deleteCurrentCreationIfMatches(cur.creationId);
      return null;
    });
  }

  /** An idea is waiting to be kept — from a link, or left in flight. */
  const waiting = Boolean((initialIntent.trim() || fromDraft) && intent.trim());

  async function createBuild(e: FormEvent) {
    e.preventDefault();
    const said = intent.trim();
    if (!said || busy) return;
    setBusy(true);
    setError(null);
    try {
      // Only their words go up. The title, the reading, version one and the
      // first move are all derived on the server — see app/api/builds.
      const res = await fetch("/api/builds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intent: said, answers }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; build?: BuildRecordV1 };
      if (!res.ok || !data.ok || !data.build) {
        setError(data.error ?? "That didn't save. Try again.");
        setBusy(false);
        return;
      }
      // It is real now, so the in-flight copy has no business surviving.
      clearDraft();
      // Straight into the workspace — they asked to build something, not to
      // look at a list of things they might build.
      window.location.href = `/builds/${data.build.id}`;
    } catch {
      setError("That didn't save. Check your connection and try again.");
      setBusy(false);
    }
  }

  const hasAnyBuild = buildList.length > 0 || !!localRecord;

  return (
    <main>
      <div className="page">
        <header className="mast">
          <span className="kicker">Builds</span>
          <h1 className="mast-title">
            {hasAnyBuild ? "Your builds" : "Nothing here yet"}
          </h1>
          <p className="mast-lead">
            {hasAnyBuild
              ? "The things you're actually making. Open one and pick up where you stopped."
              : "This is where the things you are making live, from the first sentence all the way to live on the internet."}
          </p>
          <hr className="rule mast-rule" />
        </header>

        {listFailed && (
          <section className="home-section">
            <div className="card">
              <h3>Your builds didn&apos;t load</h3>
              <p>
                Something went wrong reading your account — this is not the same as having
                no builds, and nothing was lost. Reload in a moment.
              </p>
            </div>
          </section>
        )}

        {localRecord && (
          <section className="buildlist" aria-label="Saved only in this browser">
            <LocalBuildCard record={localRecord} onDeleted={() => setLocalRecord(null)} />
          </section>
        )}

        {signedIn && buildList.length > 0 && (
          <section className="buildlist" aria-label="Your builds">
            {buildList.map((b) => (
              <BuildCard key={b.id} build={b} canDelete={canSave} onDeleted={handleBuildDeleted} />
            ))}
          </section>
        )}

        {signedIn && (
          <section className="home-section">
            {/* They stepped in, then signed in. Their words came with them —
                one tap finishes what they started, with nothing retyped. */}
            <div className="band-head">
              <h2 className="band-title">
                {waiting ? "Finish what you started" : buildList.length > 0 ? "Start another" : "Make something"}
              </h2>
            </div>
            <CreationEntry
              id="new-build"
              value={intent}
              onValueChange={setIntent}
              onSubmit={createBuild}
              heading={waiting ? "This is what you said. Keep it?" : "What do you want to make?"}
              help={
                waiting
                  ? "Still your words — edit them if you want, then keep it. It becomes a build on your account."
                  : "Say it however it comes out. It becomes a build you can come back to."
              }
              submitLabel={busy ? "Saving" : waiting ? "Keep this build" : "Step in"}
              disabled={busy || !canSave}
              rows={4}
              starters={waiting ? [] : undefined}
            />
            {!canSave && (
              <p className="tiny" style={{ marginTop: 8 }}>
                Saving a build needs live access on your account.{" "}
                <a href="/membership" style={{ color: "var(--gold)", fontWeight: 800, textDecoration: "none" }}>
                  See what that means →
                </a>
              </p>
            )}
            {error && (
              <p className="tiny" role="alert" style={{ marginTop: 8, color: "var(--text)", fontWeight: 700 }}>
                {error}
              </p>
            )}
          </section>
        )}

        {!signedIn && (
          <section className="home-section">
            {/* Somebody arrived here from their own idea. Their words are the
                valuable thing — show them back, carry them through the sign-in
                round trip, and never make them retype what they already said. */}
            {waiting && (
              <div className="card card-gold" style={{ marginBottom: 16 }}>
                <div className="plan-label">Ready to keep</div>
                <p style={{ fontSize: 15, color: "var(--text)", lineHeight: 1.6, margin: 0 }}>
                  {intent.trim()}
                </p>
                <p className="tiny" style={{ marginTop: 10 }}>
                  Your words come with you through signing in — you won&apos;t retype this. Until
                  it&apos;s on your account it only exists in this tab, so it isn&apos;t saved yet.
                </p>
              </div>
            )}
            <div className="empty">
              <h2>{waiting ? "Sign in and it's yours" : "What do you want to make?"}</h2>
              <p>
                {storeConfigured
                  ? "A build saved to your account lives on the server, not just in this browser, so it is still there on your phone tomorrow."
                  : "Accounts are not switched on for this site yet. Anything you have made here is still in this browser and is listed below."}
              </p>
              {storeConfigured ? (
                <div className="actions" style={{ justifyContent: "center" }}>
                  {/* The draft rides in sessionStorage, so the return trip is a
                      plain /builds: no idea-sized URL, nothing to truncate. */}
                  <a className="btn btn-gold btn-big" href="/members/login?returnTo=%2Fbuilds">
                    Sign in
                  </a>
                  <Link className="btn btn-ghost btn-big" href="/create">
                    {waiting ? "Change what I said" : "Start something"}
                  </Link>
                </div>
              ) : (
                <Link className="btn btn-gold btn-big" href="/create">
                  Start something
                </Link>
              )}
              <p className="tiny" style={{ marginTop: 16 }}>
                Or get it finished for you:{" "}
                <Link href="/products/five-hour-sprint">the Five Hour Sprint</Link>.
              </p>
            </div>
          </section>
        )}

        {/* Everything from before vNext. Read-only, always shown. */}
        <LegacyWork />

        <div className="divider" />
        <p className="tiny" style={{ textAlign: "center" }}>
          {email ? `Signed in as ${email}. ` : ""}
          Finished work you can use again is in your{" "}
          <Link href="/library" className="more">Library</Link>. The tools are on{" "}
          <Link href="/engines" className="more">Engines</Link>.
        </p>
      </div>
    </main>
  );
}
