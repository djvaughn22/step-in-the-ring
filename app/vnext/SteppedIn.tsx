"use client";

// ─────────────────────────────────────────────────────────────────────────────
// YOUR WORKSPACE — the moment after somebody says what they want to make.
//
// This is the most important screen in Step In The Ring. A person has just
// typed a sentence; within one screen they should be holding the words to give
// an AI, know where to paste them, and know how to keep going when it answers.
//
// What it must never do:
//   - claim work is happening that isn't. Nothing here is "generating", and
//     there is no AI on this page. Everything was written from their own words,
//     instantly, by rules (app/create/ai-messages.ts, app/vnext/shape.ts).
//   - rewrite what they said. Their sentence is shown back, unedited.
//   - ask for an account before it has given them anything.
//   - lead with a guess. The reading is rules, and rules misread everyday ideas
//     (a spreadsheet read as music, a slideshow asked what it does "the first
//     time someone uses it"), so what the rules think lives one click away in
//     the whole plan, not in front of the message.
//
// The one question, when there is one, is asked HERE and inline — answering it
// goes straight into the message above it.
// ─────────────────────────────────────────────────────────────────────────────

import { FormEvent, useEffect, useRef, useState } from "react";
import type { CreationType } from "../creation/types";
import { FirstMessage, WhenItAnswers } from "../create/WorkWithAI";
import type { Purpose } from "../create/ai-messages";
import type { BuildShaping } from "./shape";

export interface SteppedInProps {
  /** Their own words, exactly as typed. */
  intent: string;
  shaping: BuildShaping;
  /** What to paste into an AI. Written from their words, in their voice. */
  firstMessage: string;
  creationType: CreationType;
  /** Making something, asking for help, or fixing something. */
  purpose: Purpose;
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
  /** Where their work is kept. A real href, so it behaves like a link. */
  keepHref: string;
  /** Put the idea in flight for a "what can help" engine before it navigates
   *  there — the same reason onKeep exists for Builds. Without this, an
   *  engine door opens to a blank intake and the person retypes what they
   *  already said one screen ago. */
  onOpenHelp: (engineId: string) => void;
}

const WHAT_THIS_IS: Record<Purpose, string> = {
  make: "What you want to make",
  help: "What you need help with",
  fix: "What you want to fix",
};

/** Their words as a heading: whole when short, the opening when not. */
function headingFrom(intent: string): string {
  const said = intent.replace(/\s+/g, " ").trim();
  return said.length > 160 ? `${said.slice(0, 157).trimEnd()}…` : said;
}

export default function SteppedIn({
  intent,
  shaping,
  firstMessage,
  creationType,
  purpose,
  onAnswer,
  onSkip,
  onChangeWords,
  onSeeWholePlan,
  onKeep,
  keepHref,
  onOpenHelp,
}: SteppedInProps) {
  const [draft, setDraft] = useState("");
  const q = shaping.question;
  // The button they pressed just left the page. Keyboard and screen reader
  // users go to the top of the new screen, not back to the top of the site.
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => heading.current?.focus({ preventScroll: true }), []);

  function submitAnswer(e: FormEvent) {
    e.preventDefault();
    if (!q || !draft.trim()) return;
    onAnswer(q.key, draft.trim());
    setDraft("");
  }

  return (
    <div className="step-enter">
      <div className="topbar">
        <span className="topbar-title">Your workspace</span>
        <button type="button" className="btn btn-ghost btn-small" onClick={onChangeWords}>
          Change what I said
        </button>
      </div>

      <div className="stack">
        {/* THEIR WORDS — the heading is what they said, not what we read. */}
        <div className="card card-gold">
          <div className="plan-label">{WHAT_THIS_IS[purpose]}</div>
          <h1 className="work-idea" ref={heading} tabIndex={-1}>{headingFrom(intent)}</h1>
          <p className="work-small" style={{ marginBottom: 0 }}>
            Saved in this browser, under <a href={keepHref} onClick={onKeep}>Your work</a>, so
            you can leave and come back. Nothing you typed has been sent anywhere.
          </p>
        </div>

        <FirstMessage message={firstMessage} type={creationType} />

        {/* ONE QUESTION — right under the message it changes, and optional. */}
        {q && (
          <form className="card stack" onSubmit={submitAnswer}>
            <div>
              <label className="field-question" htmlFor="stepped-question" style={{ display: "block" }}>
                {q.question}
              </label>
              <p className="field-help" id="stepped-question-help" style={{ marginBottom: 0 }}>
                {q.help} Optional. It goes into your first message.
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
                Add it
              </button>
              <button type="button" className="btn btn-ghost btn-small" onClick={() => onSkip(q.key)}>
                Skip
              </button>
            </div>
          </form>
        )}

        <WhenItAnswers type={creationType} purpose={purpose} />

        {/* MORE HELP — everything the planner read, one click away. */}
        <div className="card">
          <h2 className="work-title">Want more than a message?</h2>
          <p className="work-note">
            The whole plan has what the first version could do, the tools it needs, and a longer
            brief.
          </p>
          <div className="actions">
            <button type="button" className="btn btn-ghost btn-small" onClick={onSeeWholePlan}>
              See the whole plan
            </button>
          </div>
          {shaping.helps.length > 0 && (
            <>
              <p className="work-note" style={{ marginTop: 16 }}>Guided tools that may fit:</p>
              <div className="chip-row">
                {shaping.helps.map((h) => (
                  <a key={h.id} className="chip" href={h.href} onClick={() => onOpenHelp(h.id)}>
                    <span aria-hidden="true">{h.emoji}</span> {h.name}
                  </a>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
