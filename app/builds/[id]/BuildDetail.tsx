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
        <div className="topbar">
          <span className="topbar-title">🏗️ Your build</span>
          <Link className="btn btn-ghost btn-small" href="/builds">All builds</Link>
        </div>

        <div className="stack">
          {/* WHAT IT IS, WHERE IT IS, WHAT'S NEXT — in that order, one card. */}
          <div className="card card-gold">
            <div className="plan-label">What you&apos;re making</div>
            <h1 style={{ fontSize: "clamp(24px, 5vw, 34px)", marginBottom: 8 }}>{build.title}</h1>
            <p style={{ fontSize: 15.5, color: "var(--text)", lineHeight: 1.6, fontWeight: 600 }}>
              {build.reading ?? build.intent}
            </p>
            {build.audience && (
              <div className="pill-row">
                <span className="pill">For {build.audience}</span>
              </div>
            )}
            <div className="pill-row">
              {BUILD_STAGES.map((s, i) => (
                <span
                  key={s}
                  className={`pill${i === stageIndex ? " pill-now" : ""}`}
                  aria-current={i === stageIndex ? "step" : undefined}
                >
                  {BUILD_STAGE_LABEL[s]}
                </span>
              ))}
            </div>
            <p className="field-help" style={{ marginTop: 10 }}>
              {THRESHOLD[build.stage]} {BUILD_STAGE_LINE[build.stage]}
            </p>
            {build.goal && (
              <p className="field-help" style={{ marginTop: 6 }}>
                <b style={{ color: "var(--text)" }}>Real means:</b> {build.goal}
              </p>
            )}
            <div className="next-action" style={{ marginTop: 14 }}>
              <span className="kicker" style={{ marginBottom: 4 }}>The next move</span>
              <p style={{ color: "var(--text)", fontWeight: 700, margin: 0 }}>
                {build.currentAction ?? "Decide the one next thing and write it down."}
              </p>
            </div>
            {canEdit && (
              <form
                className="stack"
                style={{ marginTop: 12 }}
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
                <div className="actions">
                  <button type="submit" className="btn btn-ghost btn-small" disabled={busy || !nextAction.trim()}>
                    Save the next move
                  </button>
                </div>
              </form>
            )}
          </div>

          {canEdit && (
            <div className="card">
              <div className="plan-label">Where it actually is</div>
              <p className="field-help" style={{ marginTop: 0 }}>
                Move it when the work moves — not before. Going back a step is allowed and
                gets recorded like everything else.
              </p>
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

          {error && (
            <div className="card" role="alert">
              <p style={{ color: "var(--text)", fontWeight: 700, margin: 0 }}>{error}</p>
            </div>
          )}

          {/* An older Build predates the reading. Offer to catch it up — and
              only offer it when there is genuinely something to gain. */}
          {canEdit && !build.reading && (
            <div className="card">
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

          {build.versionOne && build.versionOne.length > 0 && (
            <div className="card">
              <div className="plan-label">What version one does</div>
              <p className="field-help" style={{ marginTop: 0 }}>
                Read from your own words when you stepped in. It&apos;s the shortest honest
                route to something real — not the whole thing you eventually want.
              </p>
              <ul className="plan-list">
                {build.versionOne.map((v, n) => (
                  <li key={n}>{v}</li>
                ))}
              </ul>
            </div>
          )}

          {helps.length > 0 && (
            <div className="card">
              <div className="plan-label">What can help</div>
              <p className="field-help" style={{ marginTop: 0 }}>
                Everything Step In The Ring already knows how to do, matched to what you said.
              </p>
              <div className="chip-row">
                {helps.map((c) => (
                  <a
                    key={c.id}
                    className="chip"
                    href={c.href}
                    onClick={(e) => void openCapability(e, c)}
                  >
                    <span aria-hidden="true">{c.emoji}</span> {c.name}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* WHAT CAME OUT OF IT — the point of the whole thing. A Build that
              can't hold what it produced is a to-do list. */}
          <div className="card">
            <div className="plan-label">What came out of it</div>
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

          {/* Their words, kept whole and always reachable. The reading at the
              top is a reading — this is the thing it was read from. */}
          <details className="card">
            <summary className="plan-label" style={{ marginBottom: 0, cursor: "pointer" }}>
              What you actually said
            </summary>
            <p style={{ fontSize: 14.5, color: "var(--text)", lineHeight: 1.6, margin: "10px 0 0" }}>
              {build.intent}
            </p>
          </details>

          <div className="card">
            <div className="plan-label">What&apos;s happened</div>
            <ul className="plan-list">
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
          </div>

          {!canEdit && (
            <p className="tiny">
              Your build is safe and readable. Changing it needs live access on your account.{" "}
              <a href="/membership" style={{ color: "var(--gold)", fontWeight: 800, textDecoration: "none" }}>
                See what that means →
              </a>
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
