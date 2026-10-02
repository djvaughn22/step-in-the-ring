"use client";

import { useState } from "react";
import { copyText, useSavedState } from "../useSavedState";
import {
  EMPTY_CHECKLIST,
  checklistText,
  parseChecklistState,
  progress,
  visibleGroups,
  type ChecklistState,
} from "./checklist";

export default function ChecklistClient() {
  const [state, setState] = useSavedState<ChecklistState>("sitr-tool-launch-checklist", EMPTY_CHECKLIST, parseChecklistState);
  const [copied, setCopied] = useState<string | null>(null);
  const p = progress(state);

  function toggle(id: string) {
    setState((s) => ({ ...s, done: s.done.includes(id) ? s.done.filter((d) => d !== id) : [...s.done, id] }));
  }

  async function copy() {
    setCopied((await copyText(checklistText(state))) ? "Copied." : "Copy didn't work. Select the text instead.");
  }

  return (
    <div className="ft-tool">
      <fieldset className="ft-fieldset ft-step">
        <legend className="ft-label">What are you sharing?</legend>
        <label className="ft-radio">
          <input type="radio" name="ship-kind" checked={state.software} onChange={() => setState((s) => ({ ...s, software: true }))} />
          A website or app
        </label>
        <label className="ft-radio">
          <input type="radio" name="ship-kind" checked={!state.software} onChange={() => setState((s) => ({ ...s, software: false }))} />
          Something else (a document, printable, video, song…)
        </label>
      </fieldset>

      <div className="ft-progress" role="status" aria-live="polite">
        <span>{p.done} of {p.total} checked</span>
        <span className="ft-bar" aria-hidden="true"><span style={{ width: `${p.total ? (p.done / p.total) * 100 : 0}%` }} /></span>
      </div>

      {visibleGroups(state.software).map((g) => (
        <section key={g.title} className="ft-step" aria-label={g.title}>
          <h2>{g.title}</h2>
          <ul className="ft-checks">
            {g.items.map((i) => (
              <li key={i.id}>
                <label>
                  <input type="checkbox" checked={state.done.includes(i.id)} onChange={() => toggle(i.id)} />
                  <span>
                    <strong>{i.label}</strong>
                    <span className="ft-why">{i.why}</span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </section>
      ))}

      {p.total > 0 && p.done === p.total && (
        <p className="ft-done" role="status">Every check is done. Share the link.</p>
      )}

      <div className="ft-actions">
        <button type="button" className="btn btn-gold" onClick={copy}>Copy the checklist</button>
        <button type="button" className="ft-link" onClick={() => { setState((s) => ({ ...s, done: [] })); setCopied(null); }}>
          Uncheck everything
        </button>
      </div>
      {copied && <p className="tiny" role="status">{copied}</p>}
    </div>
  );
}
