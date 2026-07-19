"use client";

// The repeatable loop, rendered from the same data that exports as Markdown.

import { PLAYBOOK_STEPS, playbookMarkdown } from "../creation/playbook";

export default function Playbook() {
  const downloadPlaybook = () => {
    const blob = new Blob([playbookMarkdown()], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "repeatable-build-playbook.md";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="home-section" style={{ marginTop: 40 }}>
      <span className="kicker">The repeatable loop</span>
      <p className="section-lead">
        The steps above are one trip through the ring. This is how the same loop runs again and
        again — the actual method, written down so you can run it on your own machine.
      </p>
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
      <div className="actions" style={{ marginTop: 14 }}>
        <button className="btn btn-gold" onClick={downloadPlaybook}>
          Download the playbook (Markdown)
        </button>
      </div>
    </section>
  );
}
