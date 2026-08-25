"use client";

// ─────────────────────────────────────────────────────────────────────────────
// YOU STEPPED IN — the moment after somebody says what they want to make.
//
// This is the most important screen in Step In The Ring. A person has just
// typed a sentence; within one screen they should feel that something real
// started, understand what it is, and know the one next thing to do.
//
// What it must never do:
//   - claim work is happening that isn't. Nothing here is "generating".
//     Everything on this screen was read from their own words, instantly, by
//     rules (app/vnext/shape.ts). It says so.
//   - rewrite what they said. Their sentence is shown back, unedited.
//   - ask for an account before it has given them anything.
//
// The one question, when there is one, is asked HERE and inline — answering it
// visibly sharpens the reading, which is the whole loop: say a thing, watch it
// get clearer, want to keep it.
// ─────────────────────────────────────────────────────────────────────────────

import { FormEvent, useState } from "react";
import type { BuildShaping } from "./shape";

export interface SteppedInProps {
  /** Their own words, exactly as typed. */
  intent: string;
  shaping: BuildShaping;
  /** Answer the one open question — the caller re-reads and re-renders. */
  onAnswer: (key: string, answer: string) => void;
  /** Take the safe default for the open question and move on. */
  onSkip: (key: string) => void;
  /** Back to the box, with their words still in it. */
  onChangeWords: () => void;
  /** The full plan, builder prompt and downloads — everything from before. */
  onSeeWholePlan: () => void;
  /** Put the idea in flight before the browser navigates. */
  onKeep: () => void;
  /** Where "keep this" goes. A real href, so it behaves like a link. */
  keepHref: string;
  /** Put the idea in flight for a "what can help" engine before it navigates
   *  there — the same reason onKeep exists for Builds. Without this, an
   *  engine door opens to a blank intake and the person retypes what they
   *  already said one screen ago. */
  onOpenHelp: (engineId: string) => void;
  /** Signed in already? Then the button says what it really does. */
  signedIn?: boolean;
}

export default function SteppedIn({
  intent,
  shaping,
  onAnswer,
  onSkip,
  onChangeWords,
  onSeeWholePlan,
  onKeep,
  keepHref,
  onOpenHelp,
  signedIn,
}: SteppedInProps) {
  const [draft, setDraft] = useState("");
  const q = shaping.question;

  function submitAnswer(e: FormEvent) {
    e.preventDefault();
    if (!q || !draft.trim()) return;
    onAnswer(q.key, draft.trim());
    setDraft("");
  }

  return (
    <div className="step-enter">
      <div className="topbar">
        <span className="topbar-title">You stepped in</span>
        <button type="button" className="btn btn-ghost btn-small" onClick={onChangeWords}>
          Change what I said
        </button>
      </div>

      <div className="stack">
        {/* WHAT IT IS — read from their words, shown back with the words. */}
        <div className="card card-gold">
          <div className="plan-label">What you&apos;re making</div>
          <h1 style={{ fontSize: "clamp(25px, 5.5vw, 36px)", marginBottom: 10 }}>{shaping.title}</h1>
          <p style={{ fontSize: 15.5, color: "var(--text)", lineHeight: 1.6, fontWeight: 600 }}>
            {shaping.reading}
          </p>
          <div className="pill-row">
            <span className="pill">{shaping.kind}</span>
            {shaping.forWhom && <span className="pill">For {shaping.forWhom}</span>}
          </div>
          <p className="field-help" style={{ marginTop: 14, marginBottom: 0 }}>
            <b style={{ color: "var(--text)" }}>Real means:</b> {shaping.realMeans}
          </p>
        </div>

        {/* RIGHT NOW — the one next thing. The reason this screen exists. */}
        <div className="next-action">
          <span className="kicker" style={{ marginBottom: 6 }}>Right now</span>
          <p style={{ fontSize: 16, color: "var(--text)", fontWeight: 700, lineHeight: 1.55, margin: 0 }}>
            {shaping.firstMove}
          </p>
        </div>

        {/* KEEP IT — asked only after something was given. */}
        <div className="card">
          <div className="plan-label">Keep going with this</div>
          <p style={{ fontSize: 14.5, color: "var(--text)", margin: "0 0 14px", lineHeight: 1.6 }}>
            {signedIn
              ? "Save it as a build and it's on your account — still here tomorrow, on any device, with the next move on it."
              : "Right now this only exists on this screen. Keep it and it's on your account — still here tomorrow, on any device, with the next move on it."}
          </p>
          <div className="actions">
            <a className="btn btn-gold" href={keepHref} onClick={onKeep}>
              Keep this build →
            </a>
            <button type="button" className="btn btn-ghost btn-small" onClick={onSeeWholePlan}>
              See the whole plan
            </button>
          </div>
        </div>

        {/* ONE QUESTION — progressive disclosure, never a form. */}
        {q && (
          <form className="card stack" onSubmit={submitAnswer}>
            <div>
              <label className="field-question" htmlFor="stepped-question" style={{ display: "block" }}>
                {q.question}
              </label>
              <p className="field-help" id="stepped-question-help" style={{ marginBottom: 0 }}>
                {q.help} Answering sharpens everything above.
              </p>
            </div>
            <input
              id="stepped-question"
              aria-describedby="stepped-question-help"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={q.placeholder}
            />
            <div className="actions">
              <button type="submit" className="btn btn-primary btn-small" disabled={!draft.trim()}>
                That&apos;s it →
              </button>
              <button type="button" className="btn btn-ghost btn-small" onClick={() => onSkip(q.key)}>
                Skip — decide for me
              </button>
            </div>
          </form>
        )}

        {/* VERSION ONE — what it does the first time it works. */}
        {shaping.versionOne.length > 0 && (
          <div className="card">
            <div className="plan-label">What version one does</div>
            <ul className="plan-list">
              {shaping.versionOne.map((v, n) => (
                <li key={n}>{v}</li>
              ))}
            </ul>
          </div>
        )}

        {/* The honest software call, when software may not be the answer. */}
        {shaping.softwareNote && (
          <div className="card">
            <div className="plan-label">Worth knowing first</div>
            <p style={{ fontSize: 14.5, color: "var(--text)", lineHeight: 1.6, margin: 0 }}>
              {shaping.softwareNote}
            </p>
          </div>
        )}

        {shaping.helps.length > 0 && (
          <div className="card">
            <div className="plan-label">What can help</div>
            <p className="field-help" style={{ marginTop: 0 }}>
              Things Step In The Ring already knows how to do, matched to what you said.
            </p>
            <div className="chip-row">
              {shaping.helps.map((h) => (
                <a key={h.id} className="chip" href={h.href} onClick={() => onOpenHelp(h.id)}>
                  <span aria-hidden="true">{h.emoji}</span> {h.name}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Their words, kept whole. Nothing above replaced them. */}
        <details className="card">
          <summary className="plan-label" style={{ marginBottom: 0, cursor: "pointer" }}>
            What you actually said
          </summary>
          <p style={{ fontSize: 14.5, color: "var(--text)", lineHeight: 1.6, margin: "10px 0 0" }}>
            {intent}
          </p>
          <p className="field-help" style={{ margin: "10px 0 0" }}>
            Everything above was read from this, here on your device, the moment you stepped
            in. Nothing was sent anywhere and nothing you wrote was changed.
          </p>
        </details>
      </div>
    </div>
  );
}
