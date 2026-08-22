"use client";

// The repeatable loop, rendered from the same data that exports as Markdown.

import { PLAYBOOK_STEPS, playbookMarkdown } from "../creation/playbook";

export default function Playbook() {
  const downloadPlaybook = () => {
    const blob = new Blob([playbookMarkdown()], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "software-build-playbook.md";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="home-section" style={{ marginTop: 40 }}>
      <span className="kicker">For people building software</span>
      <p className="section-lead">
        The five steps above work for anything. If what you&apos;re making is
        software and you want to run the whole build-and-ship workflow
        yourself, here is the exact method, step by step.
      </p>
      <details className="card" style={{ marginTop: 14 }}>
        <summary className="plan-label" style={{ cursor: "pointer" }}>
          Read the technical workflow ({PLAYBOOK_STEPS.length} steps)
        </summary>
        <div className="stack" style={{ marginTop: 14 }}>
          {PLAYBOOK_STEPS.map((s) => (
            <div key={s.n} className="card">
              <div className="plan-label">{s.n} · {s.title}</div>
              <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.6, margin: "0 0 10px" }}>{s.body}</p>
              <ul className="plan-list">
                {s.points.map((p, i) => <li key={i}>{p}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </details>
      <div className="actions" style={{ marginTop: 14 }}>
        <button className="btn btn-gold" onClick={downloadPlaybook}>
          Download the software playbook (Markdown)
        </button>
      </div>
    </section>
  );
}
