"use client";

// The scope summary for "Have us build it" (owner direction, Nov 25 2026).
// Hours of effort only, never a price. Nothing on this page is sent anywhere:
// while paid help is paused there is no send button at all, and a visitor
// can copy the summary for themselves. Typed nothing, stored nothing.

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  DEFAULT_SCOPE, FEATURES, INTEGRATIONS, estimate, summaryText,
  type Content, type Design, type FeatureId, type IntegrationId, type Maintenance, type Publishing, type ScopeInput, type Testing,
} from "../estimate";
import styles from "./estimate.module.css";

type Choice<T extends string | number> = { id: T; label: string; hint?: string };

const DESIGN: Choice<Design>[] = [
  { id: "example", label: "Keep the example's look" },
  { id: "adjusted", label: "Adjust it to my colors and logo" },
  { id: "custom", label: "A design made for me" },
];
const CONTENT: Choice<Content>[] = [
  { id: "ready", label: "I have my words and photos ready" },
  { id: "some-help", label: "Help me tidy them up" },
  { id: "write-it", label: "Write them with me" },
];
const TESTING: Choice<Testing>[] = [
  { id: "standard", label: "Phones and computers", hint: "Every page, every button." },
  { id: "extended", label: "Plus an accessibility pass", hint: "Screen readers, keyboard use, slow connections." },
];
const REVISIONS: Choice<1 | 2 | 3>[] = [
  { id: 1, label: "One round" },
  { id: 2, label: "Two rounds" },
  { id: 3, label: "Three rounds" },
];
const PUBLISHING: Choice<Publishing>[] = [
  { id: "none", label: "I'll put it online myself" },
  { id: "connect", label: "Help me connect my web address" },
  { id: "full", label: "Put it online for me" },
];
const MAINTENANCE: Choice<Maintenance>[] = [
  { id: "none", label: "Nothing after launch" },
  { id: "basic", label: "A monthly check that it works" },
  { id: "with-changes", label: "A monthly check plus small changes" },
];

function Radio<T extends string | number>({ name, value, options, onChange }: { name: string; value: T; options: Choice<T>[]; onChange: (v: T) => void }) {
  return (
    <div className={styles.options} role="radiogroup">
      {options.map((o) => (
        <label key={String(o.id)} className={styles.option} data-on={value === o.id || undefined}>
          <input type="radio" name={name} checked={value === o.id} onChange={() => onChange(o.id)} />
          <span><strong>{o.label}</strong>{o.hint ? <em>{o.hint}</em> : null}</span>
        </label>
      ))}
    </div>
  );
}

function Checks<T extends string>({ items, value, onChange }: { items: Record<T, string>; value: T[]; onChange: (v: T[]) => void }) {
  return (
    <div className={styles.options}>
      {(Object.keys(items) as T[]).map((id) => (
        <label key={id} className={styles.option} data-on={value.includes(id) || undefined}>
          <input
            type="checkbox"
            checked={value.includes(id)}
            onChange={(e) => onChange(e.target.checked ? [...value, id] : value.filter((x) => x !== id))}
          />
          <span><strong>{items[id]}</strong></span>
        </label>
      ))}
    </div>
  );
}

export default function EstimateBuilder({ startPages, exampleName, open }: { startPages: number; exampleName?: string; open: boolean }) {
  const [scope, setScope] = useState<ScopeInput>({ ...DEFAULT_SCOPE, pages: startPages });
  const [copied, setCopied] = useState(false);
  const est = useMemo(() => estimate(scope), [scope]);
  const set = <K extends keyof ScopeInput>(key: K, v: ScopeInput[K]) => { setScope((s) => ({ ...s, [key]: v })); setCopied(false); };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(summaryText(scope, est));
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.form}>
        {exampleName && <p className={styles.from}>Starting from your <strong>{exampleName}</strong> draft.</p>}

        <fieldset className={styles.step}>
          <legend>How many pages?</legend>
          <div className={styles.stepper}>
            <button type="button" onClick={() => { setScope((s) => ({ ...s, pages: Math.max(1, s.pages - 1) })); setCopied(false); }} aria-label="One fewer page">−</button>
            <output aria-live="polite">{scope.pages} {scope.pages === 1 ? "page" : "pages"}</output>
            <button type="button" onClick={() => { setScope((s) => ({ ...s, pages: Math.min(30, s.pages + 1) })); setCopied(false); }} aria-label="One more page">+</button>
          </div>
          <p className={styles.hint}>A one-page site is often enough to start: what you do, where, and how to reach you.</p>
        </fieldset>

        <fieldset className={styles.step}><legend>The look</legend><Radio name="design" value={scope.design} options={DESIGN} onChange={(v) => set("design", v)} /></fieldset>
        <fieldset className={styles.step}><legend>The words and photos</legend><Radio name="content" value={scope.content} options={CONTENT} onChange={(v) => set("content", v)} /></fieldset>
        <fieldset className={styles.step}><legend>What it needs to do</legend><Checks items={FEATURES} value={scope.features} onChange={(v) => set("features", v as FeatureId[])} /></fieldset>
        <fieldset className={styles.step}><legend>What it connects to</legend><Checks items={INTEGRATIONS} value={scope.integrations} onChange={(v) => set("integrations", v as IntegrationId[])} /></fieldset>
        <fieldset className={styles.step}><legend>Testing</legend><Radio name="testing" value={scope.testing} options={TESTING} onChange={(v) => set("testing", v)} /></fieldset>
        <fieldset className={styles.step}><legend>Rounds of changes</legend><Radio name="revisions" value={scope.revisions} options={REVISIONS} onChange={(v) => set("revisions", v)} /></fieldset>
        <fieldset className={styles.step}><legend>Putting it online</legend><Radio name="publishing" value={scope.publishing} options={PUBLISHING} onChange={(v) => set("publishing", v)} /></fieldset>
        <fieldset className={styles.step}><legend>After launch</legend><Radio name="maintenance" value={scope.maintenance} options={MAINTENANCE} onChange={(v) => set("maintenance", v)} /></fieldset>
      </div>

      <aside className={styles.summary} aria-labelledby="sum-h">
        <span className={styles.size} data-size={est.size}>{est.size}</span>
        <h2 id="sum-h">About {est.low}–{est.high} hours of work</h2>
        <ul className={styles.lines}>
          {est.lines.map((l) => (
            <li key={l.label}><span>{l.label}</span><span>{l.low}–{l.high} h</span></li>
          ))}
        </ul>
        {est.monthly.high > 0 && <p className={styles.small}>After launch: about {est.monthly.low}–{est.monthly.high} hours a month.</p>}
        {est.conversationFor.length > 0 && (
          <p className={styles.small}><strong>Needs a conversation first:</strong> {est.conversationFor.join(", ")}. Those depend on details only a conversation can settle.</p>
        )}
        <p className={styles.small}>This is an estimate of effort, not a price. A written quote always comes first, after a conversation.</p>
        <button type="button" className="btn btn-ghost btn-small" onClick={copy}>{copied ? "Copied" : "Copy this summary"}</button>
        {open ? (
          <p className={styles.send}>
            Ready to talk? <Link href="/request">Send a request</Link> and paste the summary in.
          </p>
        ) : (
          <p className={styles.paused} role="note">
            We aren&apos;t taking new projects right now, so nothing is sent from this page. Your choices stay on this screen.
          </p>
        )}
      </aside>
    </div>
  );
}
