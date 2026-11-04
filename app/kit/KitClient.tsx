"use client";

// The two parts of the kit page that need the browser: copying the kit link,
// and ticking off steps. Ticks live only in this browser's localStorage, like
// every other tool on the site. Nothing here calls the network.

import Link from "next/link";
import { useEffect, useState } from "react";
import { useTimedFlag } from "../engines/shared/useFlash";
import type { KIT_STEPS } from "./kit";
import styles from "./kit.module.css";

const PROGRESS_KEY = "sitr-kit-progress-v1";

function copyText(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(text);
  return new Promise((resolve, reject) => {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    if (ok) resolve();
    else reject(new Error("copy failed"));
  });
}

export function KitLinkBox({ link }: { link: string }) {
  const [copied, raiseCopied] = useTimedFlag(2000);
  const [failed, raiseFailed] = useTimedFlag(4000);
  const mail = `mailto:?subject=${encodeURIComponent("My Ready to Build Kit link")}&body=${encodeURIComponent(
    `My Ready to Build Kit: ${link}\n\nOpen this link to download the kit and see the six steps.`,
  )}`;
  return (
    <div className={styles.linkBox}>
      <code className={styles.link}>{link}</code>
      <div className={styles.linkActions}>
        <button type="button" className="btn btn-ghost btn-small" onClick={() => copyText(link).then(raiseCopied, raiseFailed)}>
          {copied ? "Copied" : "Copy link"}
        </button>
        <a className="btn btn-ghost btn-small" href={mail}>Email it to myself</a>
      </div>
      {failed ? <p className="tiny" role="status">Couldn&apos;t copy. Select the link above and copy it by hand.</p> : null}
      <p className="tiny">Keep it private. Anyone with this link can open your kit.</p>
    </div>
  );
}

export function KitSteps({ steps }: { steps: typeof KIT_STEPS }) {
  const [done, setDone] = useState<string[]>([]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(PROGRESS_KEY) ?? "[]");
      // eslint-disable-next-line react-hooks/set-state-in-effect -- client-only localStorage hydration
      if (Array.isArray(saved)) setDone(saved.filter((v): v is string => typeof v === "string"));
    } catch {
      // unreadable progress starts fresh
    }
  }, []);

  const toggle = (id: string) => {
    setDone((prev) => {
      const next = prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id];
      try {
        localStorage.setItem(PROGRESS_KEY, JSON.stringify(next));
      } catch {
        // private mode: ticks last for this visit only
      }
      return next;
    });
  };

  const count = steps.filter((s) => done.includes(s.id)).length;
  return (
    <>
      <p className="tiny" aria-live="polite">{count} of {steps.length} steps done</p>
      <ol className={styles.steps}>
        {steps.map((s, i) => {
          const checked = done.includes(s.id);
          return (
            <li key={s.id} className={checked ? styles.stepDone : undefined}>
              <label className={styles.stepHead}>
                <input type="checkbox" checked={checked} onChange={() => toggle(s.id)} aria-label={`Step ${i + 1}, ${s.title}: done`} />
                <span className={styles.stepNumber}>0{i + 1}</span>
                <span className={styles.stepTitle}>{s.title}</span>
              </label>
              <p>{s.what}</p>
              <p className={styles.stepTools}>
                {s.tools.map((t, j) => (
                  <span key={t.href + t.label}>
                    {j > 0 ? " · " : null}
                    <Link href={t.href}>{t.label}</Link>
                  </span>
                ))}
              </p>
            </li>
          );
        })}
      </ol>
    </>
  );
}
