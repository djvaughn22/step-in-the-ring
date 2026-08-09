"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { capabilitiesForIntent } from "../../vnext/capabilities";
import {
  BUILD_STAGES, BUILD_STAGE_LABEL, BUILD_STAGE_LINE, type BuildRecordV1, type BuildStage,
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

  const helps = useMemo(() => capabilitiesForIntent(build.intent, 4), [build.intent]);
  const stageIndex = BUILD_STAGES.indexOf(build.stage);

  async function send(action: BuildAction) {
    if (busy || !canEdit) return;
    setBusy(true);
    setError(null);
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
        setNextAction("");
      }
    } catch {
      setError("That didn't save. Check your connection and try again.");
    }
    setBusy(false);
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
                  if (nextAction.trim()) void send({ type: "set-action", currentAction: nextAction.trim() });
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
                    onClick={() => void send({ type: "use-capability", capabilityId: c.id })}
                  >
                    <span aria-hidden="true">{c.emoji}</span> {c.name}
                  </a>
                ))}
              </div>
            </div>
          )}

          {build.artifacts.length > 0 && (
            <div className="card">
              <div className="plan-label">What came out of it</div>
              <ul className="plan-list">
                {build.artifacts.map((a) => (
                  <li key={a.id}>{a.label}</li>
                ))}
              </ul>
            </div>
          )}

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
