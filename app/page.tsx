"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Project = {
  email: string;
  idea: string;
  purpose: string;
  build: string;
  message: string;
  version: number;
};

const storageKey = "step-in-the-ring-email-gate-mvp1";

const emptyProject: Project = {
  email: "",
  idea: "",
  purpose: "",
  build: "",
  message: "",
  version: 0,
};

function firstLine(value: string, fallback: string) {
  const clean = value.trim();
  if (!clean) return fallback;
  const line = clean.split("\n")[0].trim();
  if (line.length <= 58) return line;
  return `${line.slice(0, 58).trim()}...`;
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function Icons() {
  return (
    <div className="icons" aria-label="Enter Idea Build">
      <div className="icon-card">
        <div className="icon-wrap">
          <div className="enter-ring" aria-hidden="true" />
        </div>
        <span className="icon-label">Enter</span>
      </div>

      <div className="icon-card">
        <div className="icon-wrap">
          <span className="idea-icon" aria-hidden="true">✦</span>
        </div>
        <span className="icon-label">Idea</span>
      </div>

      <div className="icon-card">
        <div className="icon-wrap">
          <span className="build-icon" aria-hidden="true">💻</span>
        </div>
        <span className="icon-label">Build</span>
      </div>
    </div>
  );
}

export default function Home() {
  const [project, setProject] = useState<Project>(emptyProject);
  const [emailDraft, setEmailDraft] = useState("");
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(storageKey);
    if (!saved) return;

    try {
      const parsed = JSON.parse(saved) as Project;
      setProject(parsed);
      setEmailDraft(parsed.email);
      setAllowed(Boolean(parsed.email));
    } catch {
      window.localStorage.removeItem(storageKey);
    }
  }, []);

  const title = useMemo(() => {
    return firstLine(project.message || project.idea, "First version");
  }, [project.idea, project.message]);

  function saveProject(nextProject: Project) {
    setProject(nextProject);
    window.localStorage.setItem(storageKey, JSON.stringify(nextProject));
  }

  function enter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isEmail(emailDraft)) return;

    const nextProject = {
      ...project,
      email: emailDraft.trim(),
    };

    saveProject(nextProject);
    setAllowed(true);
  }

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = new FormData(event.currentTarget);
    const nextProject: Project = {
      email: project.email,
      idea: String(form.get("idea") || "").trim(),
      purpose: String(form.get("purpose") || "").trim(),
      build: String(form.get("build") || "").trim(),
      message: String(form.get("message") || "").trim(),
      version: project.version + 1,
    };

    saveProject(nextProject);
  }

  function reset() {
    setProject(emptyProject);
    setEmailDraft("");
    setAllowed(false);
    window.localStorage.removeItem(storageKey);
  }

  if (!allowed) {
    return (
      <main>
        <Icons />

        <h1>Step In The Ring</h1>

        <form className="form panel" onSubmit={enter}>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={emailDraft}
            onChange={(event) => setEmailDraft(event.target.value)}
            placeholder="you@example.com"
            autoFocus
            required
          />

          <div className="actions">
            <button type="submit">Welcome</button>
          </div>
        </form>

        <p className="small">Private family MVP1</p>
      </main>
    );
  }

  return (
    <main>
      <Icons />

      <div className="topline">
        <span>{project.email}</span>
        <button className="secondary" type="button" onClick={reset}>
          Reset
        </button>
      </div>

      <section className="stack">
        <h1 className="project-title">What do you want to build?</h1>

        <form className="form panel" onSubmit={save}>
          <label htmlFor="idea">Idea</label>
          <textarea
            id="idea"
            name="idea"
            defaultValue={project.idea}
            placeholder="What is the idea?"
            required
          />

          <label htmlFor="purpose">Purpose</label>
          <textarea
            id="purpose"
            name="purpose"
            defaultValue={project.purpose}
            placeholder="Why should this exist?"
            required
          />

          <label htmlFor="build">Build</label>
          <textarea
            id="build"
            name="build"
            defaultValue={project.build}
            placeholder="What should the first version do?"
            required
          />

          <label htmlFor="message">Message</label>
          <textarea
            id="message"
            name="message"
            defaultValue={project.message}
            placeholder="What should the first screen say?"
            required
          />

          <div className="actions">
            <button type="submit">Save</button>
          </div>
        </form>

        {project.version > 0 && (
          <section className="preview">
            <h2>Version {project.version}</h2>
            <p><strong>{title}</strong></p>
            <p>{project.purpose}</p>
            <p>{project.build}</p>
          </section>
        )}
      </section>
    </main>
  );
}
