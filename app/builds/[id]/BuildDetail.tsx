"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { capabilitiesForIntent, type Capability } from "../../vnext/capabilities";
import { seedEngineFromBuild } from "../../vnext/engine-handoff";
import {
  BUILD_STAGES, BUILD_STAGE_LABEL, BUILD_STAGE_LINE, isSafeRef,
  type BuildRecordV1, type BuildStage,
} from "../../vnext/build";
import type { BuildAction } from "../../vnext/actions";

/** What the Ring says at each threshold. Used once each, never sprinkled. */
const THRESHOLD: Record<BuildStage, string> = {
  bring: "You stepped in.",
  shape: "Now it has edges.",
  build: "It's taking shape.",
  live: "It's live.",
  grow: "Keep going.",
};

export default function BuildDetail({
  build: initial,
  canEdit,
}: {
  build: BuildRecordV1;
  canEdit: boolean;
}) {
  const [build, setBuild] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextAction, setNextAction] = useState("");
  const [note, setNote] = useState("");
  const [artifactLabel, setArtifactLabel] = useState("");
  const [artifactRef, setArtifactRef] = useState("");

  const helps = useMemo(() => capabilitiesForIntent(build.intent, 4), [build.intent]);
  const stageIndex = BUILD_STAGES.indexOf(build.stage);

  async function send(action: BuildAction): Promise<boolean> {
    if (busy || !canEdit) return false;
    setBusy(true);
    setError(null);
    let ok = false;
    try {
      const res = await fetch(`/api/builds/${build.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = (await res.json()) as { ok?: boolean; build?: BuildRecordV1; error?: string };
      if (!res.ok || !data.ok || !data.build) {
        setError(data.error ?? "That didn't save.");
      } else {
        setBuild(data.build);
        ok = true;
      }
    } catch {
      setError("That didn't save. Check your connection and try again.");
    }
    setBusy(false);
    return ok;
  }

  /**
   * Opening a capability is a real event on the Build, so it has to be
   * recorded BEFORE the browser leaves. Firing the request and letting the
   * navigation cancel it mid-flight is how history quietly goes missing.
   */
  async function openCapability(e: React.MouseEvent<HTMLAnchorElement>, capability: Capability) {
    // Let the person's own intent win: a new tab, or no ability to record.
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) {
      seedEngineFromBuild(build, capability);
      return;
    }
    e.preventDefault();
    seedEngineFromBuild(build, capability);
    if (canEdit) await send({ type: "use-capability", capabilityId: capability.id });
    window.location.assign(capability.href);
  }

  return (
    <main>
      <div className="page">
        {/* THE WORKBENCH. What it is, then the one move to make — the
            strongest thing on the page. Everything else is reference
            material grouped under a plain label and sits below it. */}
        <header className="bench-top">
          <div>
            <span className="kicker">What you&apos;re making</span>
            <h1 className="bench-name">{build.title}</h1>
            <p className="bench-read">{build.reading ?? build.intent}</p>
          </div>
          <Link className="btn btn-ghost" href="/builds">
            ← All builds
          </Link>
        </header>

        <div style={{ marginTop: 26 }}>
          <div className="track" role="img" aria-label={`Stage: ${BUILD_STAGE_LABEL[build.stage]}`}>
            {BUILD_STAGES.map((s, i) => (
              <span
                key={s}
                className={`track-seg${i < stageIndex ? " done" : i === stageIndex ? " now" : ""}`}
              />
            ))}
          </div>
          <div className="track-labels" aria-hidden="true">
            {BUILD_STAGES.map((s, i) => (
              <span key={s} className={i === stageIndex ? "now" : undefined}>
                {BUILD_STAGE_LABEL[s]}
              </span>
            ))}
          </div>
        </div>

        {/* THE HERO. What to do next, and the box to change it, in the same
            slab — so acting on it is not a scroll away from reading it. */}
        <div className="move">
          <span className="move-l">The next move</span>
          <p>{build.currentAction ?? "Decide the one next thing and write it down."}</p>
          {canEdit && (
            <form
              className="move-edit"
              onSubmit={(e) => {
                e.preventDefault();
                const said = nextAction.trim();
                // Clear only the box that was submitted — a stage change
                // must never wipe something half-typed somewhere else.
                if (said) void send({ type: "set-action", currentAction: said }).then((ok) => ok && setNextAction(""));
              }}
            >
              <label className="sr-only" htmlFor="next-move">Change the next move</label>
              <input
                id="next-move"
                value={nextAction}
                onChange={(e) => setNextAction(e.target.value)}
                placeholder="Change the next move…"
              />
              <button type="submit" className="btn btn-ghost btn-small" disabled={busy || !nextAction.trim()}>
                Save
              </button>
            </form>
          )}
        </div>

        {/* THE ACTIONS. Use an engine, or move the stage — verbs, not
            reference material, so they sit apart from the sections below. */}
        {(helps.length > 0 || canEdit) && (
          <div className="build-actions">
            {helps.length > 0 && (
              <div>
                <span className="build-actions-l">Use an engine</span>
                <div className="chip-row">
                  {helps.map((c) => (
                    <a key={c.id} className="chip" href={c.href} onClick={(e) => void openCapability(e, c)}>
                      <span aria-hidden="true">{c.emoji}</span> {c.name}
                    </a>
                  ))}
                </div>
              </div>
            )}
            {canEdit && (
              <div>
                <span className="build-actions-l">Where it actually is</span>
                <div className="chip-row">
                  {BUILD_STAGES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      className="chip"
                      disabled={busy || s === build.stage}
                      onClick={() => void send({ type: "advance", stage: s })}
                    >
                      {BUILD_STAGE_LABEL[s]}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="card" role="alert" style={{ marginTop: 16 }}>
            <p style={{ color: "var(--text)", fontWeight: 700, margin: 0 }}>{error}</p>
          </div>
        )}

        {/* An older Build predates the reading. Offer to catch it up — and
            only offer it when there is genuinely something to gain. */}
        {canEdit && !build.reading && (
          <div className="card" style={{ marginTop: 16 }}>
            <div className="plan-label">This build started before we could read it</div>
            <p style={{ fontSize: 14.5, color: "var(--text)", lineHeight: 1.6, margin: "0 0 12px" }}>
              Step In The Ring can now read what you wrote and work out what it is, what
              version one does, and the next move. Nothing you&apos;ve written or changed
              gets touched — this only fills in what&apos;s blank.
            </p>
            <div className="actions">
              <button
                type="button"
                className="btn btn-gold btn-small"
                disabled={busy}
                onClick={() => void send({ type: "reshape" })}
              >
                {busy ? "Reading…" : "Read my words again"}
              </button>
            </div>
          </div>
        )}

        {/* PLAN — what this is and what version one does. Only the fields
            that actually have data appear; the section itself is absent if
            none of them do. */}
        {(build.audience || build.goal || (build.versionOne && build.versionOne.length > 0)) && (
          <section className="bsec">
            <h2 className="bsec-t">Plan</h2>
            <div className="card">
              <p className="field-help" style={{ marginTop: 0 }}>
                {THRESHOLD[build.stage]} {BUILD_STAGE_LINE[build.stage]}
              </p>
              {build.audience && (
                <p className="field-help" style={{ marginTop: 6 }}>
                  <b style={{ color: "var(--text)" }}>Who it&apos;s for:</b> {build.audience}
                </p>
              )}
              {build.goal && (
                <p className="field-help" style={{ marginTop: 6, marginBottom: 0 }}>
                  <b style={{ color: "var(--text)" }}>Real means:</b> {build.goal}
                </p>
              )}
              {build.versionOne && build.versionOne.length > 0 && (
                <>
                  <p className="field-help" style={{ marginTop: 14, marginBottom: 6 }}>
                    <b style={{ color: "var(--text)" }}>Version one:</b> the shortest honest
                    route to something real — not the whole thing you eventually want.
                  </p>
                  <ul className="plan-list">
                    {build.versionOne.map((v, n) => (
                      <li key={n}>{v}</li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </section>
        )}

        {/* MADE — the point of the whole thing. A Build that can't hold what
            it produced is a to-do list. */}
        <section className="bsec">
          <h2 className="bsec-t">Made</h2>
          <div className="card">
            {build.artifacts.length > 0 ? (
              <ul className="plan-list">
                {build.artifacts.map((a) => (
                  <li key={a.id}>
                    {isSafeRef(a.ref) ? (
                      <a
                        href={a.ref}
                        target={a.ref.startsWith("/") ? undefined : "_blank"}
                        rel="noopener noreferrer"
                        style={{ color: "var(--gold)", fontWeight: 700, textDecoration: "none" }}
                      >
                        {a.label} →
                      </a>
                    ) : (
                      a.label
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="field-help" style={{ marginTop: 0 }}>
                Nothing yet. When something real exists — a page, a file, a draft, a link —
                put it here so the build knows what it has.
              </p>
            )}
            {canEdit && (
              <form
                className="stack"
                style={{ marginTop: 14 }}
                onSubmit={(e) => {
                  e.preventDefault();
                  const label = artifactLabel.trim();
                  const ref = artifactRef.trim();
                  if (!label || !ref) return;
                  if (!isSafeRef(ref)) {
                    setError("Give it a web link (https://…) or a page on this site (/…).");
                    return;
                  }
                  void send({ type: "add-artifact", label, ref }).then(() => {
                    setArtifactLabel("");
                    setArtifactRef("");
                  });
                }}
              >
                <div className="row2">
                  <div>
                    <label className="sr-only" htmlFor="artifact-label">What is it?</label>
                    <input
                      id="artifact-label"
                      value={artifactLabel}
                      onChange={(e) => setArtifactLabel(e.target.value)}
                      placeholder="What is it? e.g. The first draft"
                    />
                  </div>
                  <div>
                    <label className="sr-only" htmlFor="artifact-ref">Where is it?</label>
                    <input
                      id="artifact-ref"
                      value={artifactRef}
                      onChange={(e) => setArtifactRef(e.target.value)}
                      placeholder="https://… or /a-page-here"
                    />
                  </div>
                </div>
                <div className="actions">
                  <button
                    type="submit"
                    className="btn btn-ghost btn-small"
                    disabled={busy || !artifactLabel.trim() || !artifactRef.trim()}
                  >
                    Add it
                  </button>
                </div>
              </form>
            )}
          </div>
        </section>

        {/* HISTORY — closed by default. This is the log, not the point of
            the page; a build detail that leads with a scrolling transcript
            reads as a chat, not a workbench. */}
        <section className="bsec">
          <details className="card">
            <summary className="bsec-t" style={{ cursor: "pointer", display: "inline-block" }}>
              History{build.history.length > 0 ? ` (${build.history.length})` : ""}
            </summary>
            <ul className="plan-list" style={{ marginTop: 14 }}>
              {[...build.history].reverse().map((h, i) => (
                <li key={`${h.at}-${i}`}>
                  {h.note}
                  {h.stage && <span className="tag">{BUILD_STAGE_LABEL[h.stage]}</span>}
                </li>
              ))}
            </ul>
            {canEdit && (
              <form
                className="stack"
                style={{ marginTop: 14 }}
                onSubmit={(e) => {
                  e.preventDefault();
                  const said = note.trim();
                  if (said) void send({ type: "note", note: said }).then((ok) => ok && setNote(""));
                }}
              >
                <label className="sr-only" htmlFor="build-note">Write down what happened</label>
                <input
                  id="build-note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="What happened? e.g. Talked to three dog owners"
                />
                <div className="actions">
                  <button type="submit" className="btn btn-ghost btn-small" disabled={busy || !note.trim()}>
                    Write it down
                  </button>
                </div>
              </form>
            )}
          </details>
          {/* Their words, kept whole and always reachable. The reading at
              the top is a reading — this is the thing it was read from. */}
          <details className="card" style={{ marginTop: 10 }}>
            <summary className="plan-label" style={{ marginBottom: 0, cursor: "pointer" }}>
              What you actually said
            </summary>
            <p style={{ fontSize: 14.5, color: "var(--text)", lineHeight: 1.6, margin: "10px 0 0" }}>
              {build.intent}
            </p>
          </details>
        </section>

        {!canEdit && (
          <p className="tiny" style={{ marginTop: 20 }}>
            Your build is safe and readable. Changing it needs live access on your account.{" "}
            <a href="/membership" style={{ color: "var(--gold)", fontWeight: 800, textDecoration: "none" }}>
              See what that means →
            </a>
          </p>
        )}
      </div>
    </main>
  );
}
