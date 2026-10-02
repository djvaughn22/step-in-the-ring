"use client";

import { useState } from "react";
import { copyText, useSavedState } from "../useSavedState";
import { EMPTY_TRY_IT, GOALS, buildScript, parseTryItState, scriptText, type TryItState } from "./script";

const NOTE_FIELDS: { key: keyof TryItState["notes"]; label: string }[] = [
  { key: "did", label: "What they did" },
  { key: "stuck", label: "Where they got stuck" },
  { key: "said", label: "What they said (their words)" },
  { key: "change", label: "The one change I'll make next" },
];

export default function TryItClient() {
  const [state, setState] = useSavedState<TryItState>("sitr-tool-try-it", EMPTY_TRY_IT, parseTryItState);
  const [copied, setCopied] = useState<string | null>(null);
  const script = buildScript(state);

  async function copy() {
    setCopied((await copyText(scriptText(state))) ? "Copied." : "Copy didn't work. Select the text instead.");
  }

  function clearAll() {
    if (window.confirm("Clear the script and your notes? They only live in this browser.")) {
      setState(EMPTY_TRY_IT);
      setCopied(null);
    }
  }

  return (
    <div className="ft-tool">
      <section className="ft-step" aria-labelledby="try-1">
        <h2 id="try-1"><span className="ft-num">1</span>Set it up</h2>
        <label className="ft-label" htmlFor="try-what">What did you make?</label>
        <input
          id="try-what"
          className="ft-input"
          value={state.what}
          maxLength={200}
          placeholder="e.g. a sign-up page for the cleanup"
          onChange={(e) => setState((s) => ({ ...s, what: e.target.value }))}
        />
        <label className="ft-label" htmlFor="try-task">The one thing they should try</label>
        <input
          id="try-task"
          className="ft-input"
          value={state.task}
          maxLength={200}
          placeholder="e.g. sign up for the Saturday morning slot"
          onChange={(e) => setState((s) => ({ ...s, task: e.target.value }))}
        />
        <fieldset className="ft-fieldset">
          <legend className="ft-label">What do you most want to learn?</legend>
          {GOALS.map((g) => (
            <label key={g.id} className="ft-radio">
              <input
                type="radio"
                name="try-goal"
                checked={state.goal === g.id}
                onChange={() => setState((s) => ({ ...s, goal: g.id }))}
              />
              {g.label}
            </label>
          ))}
        </fieldset>
      </section>

      <section className="ft-step" aria-labelledby="try-2">
        <h2 id="try-2"><span className="ft-num">2</span>Your script</h2>
        <p className="ft-help">Ten to fifteen minutes with one person is plenty. Read it out loud or keep it on your phone.</p>
        <div className="ft-script">
          <h3>Before they start</h3>
          <ul>{script.before.map((l) => <li key={l}>{l}</li>)}</ul>
          <h3>The task</h3>
          <p>{script.task}</p>
          <h3>While they try it</h3>
          <ul>{script.watch.map((l) => <li key={l}>{l}</li>)}</ul>
          <h3>Afterwards, ask</h3>
          <ol>{script.questions.map((q) => <li key={q}>{q}</li>)}</ol>
        </div>
      </section>

      <section className="ft-step" aria-labelledby="try-3">
        <h2 id="try-3"><span className="ft-num">3</span>Write down what happened</h2>
        <p className="ft-help">Right after, while it&apos;s fresh. Their words, not your summary of them.</p>
        {NOTE_FIELDS.map((f) => (
          <div key={f.key}>
            <label className="ft-label" htmlFor={`try-note-${f.key}`}>{f.label}</label>
            <textarea
              id={`try-note-${f.key}`}
              className="ft-input"
              rows={f.key === "change" ? 2 : 3}
              maxLength={1000}
              value={state.notes[f.key]}
              onChange={(e) => setState((s) => ({ ...s, notes: { ...s.notes, [f.key]: e.target.value } }))}
            />
          </div>
        ))}
        <div className="ft-actions">
          <button type="button" className="btn btn-gold" onClick={copy}>Copy script and notes</button>
          <button type="button" className="ft-link" onClick={clearAll}>Start over</button>
        </div>
        {copied && <p className="tiny" role="status">{copied}</p>}
      </section>
    </div>
  );
}
