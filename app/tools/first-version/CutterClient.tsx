"use client";

import Link from "next/link";
import { useState } from "react";
import { copyText, useSavedState } from "../useSavedState";
import {
  BUCKET_LABEL,
  EMPTY_CUTTER,
  MAX_ITEMS,
  addFeatures,
  cutAdvice,
  ideaBoxHandoff,
  inBucket,
  parseCutterState,
  scopeText,
  type Bucket,
  type CutterState,
} from "./cutter";

const BUCKETS: Bucket[] = ["now", "later", "never"];

let counter = 0;
const makeId = () => `f${Date.now().toString(36)}${(counter++).toString(36)}`;

export default function CutterClient() {
  const [state, setState] = useSavedState<CutterState>("sitr-tool-first-version", EMPTY_CUTTER, parseCutterState);
  const [draft, setDraft] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  const advice = cutAdvice(state);
  const unsorted = inBucket(state.items, null);
  const handoff = ideaBoxHandoff(state);

  function add() {
    if (!draft.trim()) return;
    setState((s) => ({ ...s, items: addFeatures(s.items, draft, makeId) }));
    setDraft("");
  }

  function sort(id: string, bucket: Bucket | null) {
    setState((s) => ({ ...s, items: s.items.map((i) => (i.id === id ? { ...i, bucket } : i)) }));
  }

  // Sorting removes the buttons that had focus. Hand keyboard and screen
  // reader users the next item to sort, or the finished scope when done.
  function sortAndMoveOn(id: string, bucket: Bucket) {
    sort(id, bucket);
    requestAnimationFrame(() => {
      const next = document.querySelector<HTMLButtonElement>(".ft-sort .ft-chip");
      if (next) next.focus();
      else document.getElementById("cut-4")?.focus();
    });
  }

  function remove(id: string) {
    setState((s) => ({ ...s, items: s.items.filter((i) => i.id !== id) }));
  }

  async function copy() {
    setCopied((await copyText(scopeText(state))) ? "Copied." : "Copy didn't work. Select the text below instead.");
  }

  function clearAll() {
    if (window.confirm("Clear this list? It only lives in this browser, so it can't be brought back.")) {
      setState(EMPTY_CUTTER);
      setCopied(null);
    }
  }

  return (
    <div className="ft-tool">
      <section className="ft-step" aria-labelledby="cut-1">
        <h2 id="cut-1"><span className="ft-num">1</span>What is it?</h2>
        <label className="ft-label" htmlFor="cut-idea">The idea, in one line</label>
        <input
          id="cut-idea"
          className="ft-input"
          value={state.idea}
          maxLength={300}
          placeholder="e.g. A sign-up sheet for our neighborhood cleanup"
          onChange={(e) => setState((s) => ({ ...s, idea: e.target.value }))}
        />
        <label className="ft-label" htmlFor="cut-done">Done means… (one sentence)</label>
        <input
          id="cut-done"
          className="ft-input"
          value={state.doneMeans}
          maxLength={300}
          placeholder="e.g. A neighbor can open the link and put their name on a time slot"
          onChange={(e) => setState((s) => ({ ...s, doneMeans: e.target.value }))}
        />
      </section>

      <section className="ft-step" aria-labelledby="cut-2">
        <h2 id="cut-2"><span className="ft-num">2</span>Everything it could do</h2>
        <p className="ft-help">Dump it all here, one thing per line. Don&apos;t judge yet. Pasted lists with bullets or numbers are fine.</p>
        <label className="ft-label" htmlFor="cut-list">Features and wishes</label>
        <textarea
          id="cut-list"
          className="ft-input"
          rows={5}
          value={draft}
          placeholder={"Pick a time slot\nSend a reminder text\nShow a map of the route\nPhotos from last year"}
          onChange={(e) => setDraft(e.target.value)}
        />
        <div className="ft-actions">
          <button type="button" className="btn btn-gold" onClick={add} disabled={!draft.trim() || state.items.length >= MAX_ITEMS}>
            Add to the list
          </button>
          <span className="tiny">{state.items.length} of {MAX_ITEMS}</span>
        </div>
      </section>

      {state.items.length > 0 && (
        <section className="ft-step" aria-labelledby="cut-3">
          <h2 id="cut-3"><span className="ft-num">3</span>Sort each one</h2>
          <p className="ft-help">Ask of each line: would the first version be useless without it? If not, it can wait.</p>
          {unsorted.length > 0 && (
            <ul className="ft-sort" aria-label="Still to sort">
              {unsorted.map((item) => (
                <li key={item.id}>
                  <span className="ft-sort-text">{item.text}</span>
                  <span className="ft-choices" role="group" aria-label={`Sort “${item.text}”`}>
                    {BUCKETS.map((b) => (
                      <button key={b} type="button" className="ft-chip" onClick={() => sortAndMoveOn(item.id, b)}>
                        {BUCKET_LABEL[b]}
                      </button>
                    ))}
                  </span>
                </li>
              ))}
            </ul>
          )}

          <div className="ft-buckets">
            {BUCKETS.map((b) => {
              const list = inBucket(state.items, b);
              return (
                <div key={b} className={`ft-bucket ft-bucket-${b}`}>
                  <h3>{BUCKET_LABEL[b]} <span className="ft-count">{list.length}</span></h3>
                  {list.length === 0 ? (
                    <p className="tiny">Nothing here yet.</p>
                  ) : (
                    <ul>
                      {list.map((item) => (
                        <li key={item.id}>
                          <span>{item.text}</span>
                          <span className="ft-row-actions">
                            <button type="button" className="ft-link" onClick={() => sort(item.id, null)} aria-label={`Move “${item.text}” back to unsorted`}>
                              Re-sort
                            </button>
                            <button type="button" className="ft-link" onClick={() => remove(item.id)} aria-label={`Remove “${item.text}”`}>
                              Remove
                            </button>
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>

          {advice.length > 0 && (
            <ul className="ft-advice" aria-live="polite">
              {advice.map((a) => <li key={a}>{a}</li>)}
            </ul>
          )}
        </section>
      )}

      {state.items.length > 0 && (
        <section className="ft-step" aria-labelledby="cut-4">
          <h2 id="cut-4" tabIndex={-1}><span className="ft-num">4</span>Your first version</h2>
          <pre className="ft-output">{scopeText(state)}</pre>
          <div className="ft-actions">
            <button type="button" className="btn btn-gold" onClick={copy}>Copy it</button>
            {inBucket(state.items, "now").length > 0 && (
              <Link className="btn btn-ghost" href={`/create?idea=${encodeURIComponent(handoff)}`}>
                Plan just this version →
              </Link>
            )}
            <button type="button" className="ft-link" onClick={clearAll}>Start over</button>
          </div>
          {copied && <p className="tiny" role="status">{copied}</p>}
        </section>
      )}
    </div>
  );
}
