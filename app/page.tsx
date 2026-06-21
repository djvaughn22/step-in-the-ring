"use client";

import { FormEvent, useEffect, useState } from "react";

type Project = {
  idea: string;
  version: number;
  note: string;
};

const key = "step-in-the-ring-simple-project-v1";

function makeNote(idea: string) {
  const clean = idea.trim();
  if (!clean) return "";
  return "Start with one screen, one person, and one useful action.";
}

export default function Home() {
  const [started, setStarted] = useState(false);
  const [idea, setIdea] = useState("");
  const [project, setProject] = useState<Project | null>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem(key);
    if (!saved) return;

    try {
      const parsed = JSON.parse(saved) as Project;
      setProject(parsed);
      setIdea(parsed.idea);
      setStarted(true);
    } catch {
      window.localStorage.removeItem(key);
    }
  }, []);

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextProject: Project = {
      idea: idea.trim(),
      version: (project?.version || 0) + 1,
      note: makeNote(idea),
    };

    setProject(nextProject);
    window.localStorage.setItem(key, JSON.stringify(nextProject));
  }

  function reset() {
    setStarted(false);
    setIdea("");
    setProject(null);
    window.localStorage.removeItem(key);
  }

  if (!started) {
    return (
      <main>
        <section className="welcome">
          <div className="product-line">Open Mirror project</div>

          <div className="icon-row">
            <div className="icon-card">
              <span className="icon">⭕</span>
              <strong>Step</strong>
            </div>
            <div className="icon-card">
              <span className="icon">💭</span>
              <strong>Dream</strong>
            </div>
            <div className="icon-card">
              <span className="icon">🛠️</span>
              <strong>Create</strong>
            </div>
          </div>

          <h1>Step In The Ring</h1>
          <p className="lede">
            Bring the idea. Shape the first version. Keep going until it feels
            right.
          </p>

          <div className="actions">
            <button type="button" onClick={() => setStarted(true)}>
              Welcome
            </button>
          </div>

          <div className="footer-note">Private family MVP1</div>
        </section>
      </main>
    );
  }

  return (
    <main>
      <section className="builder">
        <div className="top">
          <span>⭕ Step · 💭 Dream · 🛠️ Create</span>
          <button className="secondary" type="button" onClick={reset}>
            Reset
          </button>
        </div>

        <h1>What do you want to build?</h1>

        <form className="builder" onSubmit={save}>
          <label htmlFor="idea">Your idea</label>
          <textarea
            id="idea"
            value={idea}
            onChange={(event) => setIdea(event.target.value)}
            placeholder="Example: I want to make an app that helps my kids track chores."
            autoFocus
            required
          />

          <div className="actions">
            <button type="submit">Save first version</button>
          </div>
        </form>

        {project && (
          <section className="preview">
            <h2>Version {project.version}</h2>
            <p>{project.idea}</p>
            <p>{project.note}</p>
          </section>
        )}

        <div className="footer-note">
          Saved in this browser for now. Project pages come next.
        </div>
      </section>
    </main>
  );
}
