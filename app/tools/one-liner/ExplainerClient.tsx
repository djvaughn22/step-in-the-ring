"use client";

import { useState } from "react";
import { copyText, useSavedState } from "../useSavedState";
import {
  DESCRIPTION_LIMIT,
  EMPTY_EXPLAINER,
  TITLE_LIMIT,
  explain,
  explainerText,
  isReady,
  lengthNotes,
  parseExplainerInput,
  type ExplainerInput,
} from "./explainer";

const FIELDS: { key: keyof ExplainerInput; label: string; placeholder: string; optional?: boolean }[] = [
  { key: "what", label: "What is it?", placeholder: "e.g. a plant swap page" },
  { key: "who", label: "Who is it for?", placeholder: "e.g. our garden club", optional: true },
  { key: "helps", label: "What does it help them do?", placeholder: "e.g. trade cuttings without a group chat" },
  { key: "name", label: "Does it have a name?", placeholder: "e.g. Cutting Corner", optional: true },
];

export default function ExplainerClient() {
  const [input, setInput] = useSavedState<ExplainerInput>("sitr-tool-one-liner", EMPTY_EXPLAINER, parseExplainerInput);
  const [copied, setCopied] = useState<string | null>(null);
  const ready = isReady(input);
  const e = explain(input);
  const notes = ready ? lengthNotes(e) : [];

  async function copy(text: string) {
    setCopied((await copyText(text)) ? "Copied." : "Copy didn't work. Select the text instead.");
  }

  return (
    <div className="ft-tool">
      <section className="ft-step" aria-labelledby="one-1">
        <h2 id="one-1"><span className="ft-num">1</span>Say it plainly</h2>
        <p className="ft-help">Short answers in your own words. Skip the adjectives; they get added back in your head anyway.</p>
        {FIELDS.map((f) => (
          <div key={f.key}>
            <label className="ft-label" htmlFor={`one-${f.key}`}>
              {f.label} {f.optional ? <span className="ft-optional">(optional)</span> : null}
            </label>
            <input
              id={`one-${f.key}`}
              className="ft-input"
              maxLength={160}
              value={input[f.key]}
              placeholder={f.placeholder}
              onChange={(ev) => setInput((s) => ({ ...s, [f.key]: ev.target.value }))}
            />
          </div>
        ))}
      </section>

      <section className="ft-step" aria-labelledby="one-2" aria-live="polite">
        <h2 id="one-2"><span className="ft-num">2</span>The words people see first</h2>
        {!ready ? (
          <p className="ft-help">Fill in what it is and what it helps people do, and the words appear here.</p>
        ) : (
          <>
            <dl className="ft-results">
              <div>
                <dt>Page title <span className="ft-count">{e.title.length}/{TITLE_LIMIT}</span></dt>
                <dd>{e.title}</dd>
              </div>
              <div>
                <dt>One-line description <span className="ft-count">{e.description.length}/{DESCRIPTION_LIMIT}</span></dt>
                <dd>{e.description}</dd>
              </div>
              <div>
                <dt>Message to send with the link</dt>
                <dd>{e.share}</dd>
              </div>
            </dl>
            {notes.length > 0 && (
              <ul className="ft-advice">
                {notes.map((n) => (
                  <li key={n.field}>
                    The {n.field} is {n.length} characters. Past about {n.limit}, search results and link previews usually cut it
                    off. Try shorter words in the boxes above.
                  </li>
                ))}
              </ul>
            )}
            <p className="ft-help" style={{ marginTop: 14 }}>
              These are a starting point. Read them out loud and change anything that doesn&apos;t sound like you.
            </p>
            <div className="ft-actions">
              <button type="button" className="btn btn-gold" onClick={() => copy(explainerText(input))}>Copy all three</button>
              <button type="button" className="ft-link" onClick={() => copy(e.share)}>Copy just the message</button>
              <button type="button" className="ft-link" onClick={() => { setInput(EMPTY_EXPLAINER); setCopied(null); }}>Start over</button>
            </div>
            {copied && <p className="tiny" role="status">{copied}</p>}
          </>
        )}
      </section>
    </div>
  );
}
