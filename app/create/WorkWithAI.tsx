"use client";

// ─────────────────────────────────────────────────────────────────────────────
// WORKING WITH THE AI — the part of the workspace that keeps the home page's
// promise. The first message to paste, the apps to paste it into, and then the
// loop: say what's off, get the next message, paste it into the same chat.
//
// Nothing here talks to an AI. It only hands the person words (ai-messages.ts),
// so what they type stays on this device until they paste it somewhere
// themselves. Analytics get the move and the kind of thing, never the words.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import Link from "next/link";
import type { CreationType } from "../creation/types";
import { track } from "../lib/analytics";
import CopyButton from "./CopyButton";
import { AI_APPS, MOVES, exampleFor, nextMessage, type MoveId, type Purpose } from "./ai-messages";

export function FirstMessage({ message, type }: { message: string; type: CreationType }) {
  return (
    <section className="card work-card" aria-labelledby="first-message">
      <div className="work-head">
        <div>
          <h2 className="work-title" id="first-message">Your first message</h2>
          <p className="work-note">Copy it, open an AI app, and paste it in.</p>
        </div>
        <CopyButton
          text={message}
          label="Copy message"
          big
          onCopied={() => track("first_message_copied", { type })}
        />
      </div>

      <p className="ai-message">{message}</p>

      <div className="ai-apps">
        <span className="ai-apps-label">Open an AI app:</span>
        {AI_APPS.map((app) => (
          <a
            key={app.name}
            className="chip"
            href={app.href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => track("ai_app_opened", { app: app.name })}
          >
            {app.name}<span aria-hidden="true">&nbsp;↗</span>
          </a>
        ))}
      </div>
      <p className="work-small">
        Any AI chat app works, and most let you start without paying. They&apos;re separate
        from this site, with their own accounts and age rules, and some are 18 and up. Kids
        should do this with a parent or another adult they trust. What you paste goes to
        that app, so leave out passwords and account numbers.
      </p>
    </section>
  );
}

const WHEN_IT_ANSWERS: Record<Purpose, string> = {
  make: "Look at what it made, and try it if you can. Then say what to change, as many times as you like. Paste each message into the same chat, so the AI remembers what it made.",
  help: "Read what it says. If something doesn't fit or doesn't make sense, say so, as many times as you like. Paste each message into the same chat, so the AI remembers what it said.",
  fix: "Do what it asks, and see what happens. Then tell it, as many times as you like. Paste each message into the same chat, so the AI remembers what it tried.",
};

/** "It's right" says the plain thing for what they came to do. */
const DONE_LABEL: Record<Purpose, string> = { make: "It's right", help: "That helps", fix: "It's fixed" };

export function WhenItAnswers({ type, purpose }: { type: CreationType; purpose: Purpose }) {
  const [moveId, setMoveId] = useState<MoveId>("change");
  const [words, setWords] = useState("");
  const move = MOVES.find((m) => m.id === moveId) ?? MOVES[0];
  const next = nextMessage(moveId, words, purpose);

  return (
    <section className="card work-card" aria-labelledby="when-it-answers">
      <h2 className="work-title" id="when-it-answers">When it answers</h2>
      <p className="work-note">{WHEN_IT_ANSWERS[purpose]}</p>

      <div className="move-row" role="group" aria-label="What do you want to tell the AI?">
        {MOVES.map((m) => (
          <button
            key={m.id}
            type="button"
            className="move"
            aria-pressed={m.id === moveId}
            onClick={() => setMoveId(m.id)}
          >
            {m.id === "done" ? DONE_LABEL[purpose] : m.label}
          </button>
        ))}
      </div>

      {move.ask && (
        <div className="move-words">
          <label htmlFor="next-words">{move.ask}</label>
          <textarea
            id="next-words"
            rows={2}
            value={words}
            onChange={(e) => setWords(e.target.value)}
            placeholder={exampleFor(move, type)}
          />
        </div>
      )}

      {next && (
        <div className="next-message">
          <div className="work-head">
            <h3 className="work-title work-title-small">Your next message</h3>
            <CopyButton
              text={next}
              label="Copy message"
              big
              onCopied={() => track("next_message_copied", { move: moveId })}
            />
          </div>
          <p className="ai-message">{next}</p>
        </div>
      )}

      {moveId === "done" && purpose === "make" && (
        <p className="work-small">
          Showing it to someone? The <Link href="/tools/try-it">try-it script</Link> helps you
          hear what they really think. Sharing a link? Run the{" "}
          <Link href="/tools/launch-checklist">launch checklist</Link> first.
        </p>
      )}

      <p className="work-small">
        AI can sound sure and still be wrong. Check anything that matters, like dates,
        medicine, money or the law.
      </p>
    </section>
  );
}
