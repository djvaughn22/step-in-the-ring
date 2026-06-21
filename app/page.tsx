"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type StepKey =
  | "idea"
  | "purpose"
  | "audience"
  | "function"
  | "value"
  | "message"
  | "style"
  | "action";

type Project = {
  email: string;
  idea: string;
  purpose: string;
  audience: string;
  function: string;
  value: string;
  message: string;
  style: string;
  action: string;
  version: number;
};

const storageKey = "step-in-the-ring-guided-site-mvp1";

const emptyProject: Project = {
  email: "",
  idea: "",
  purpose: "",
  audience: "",
  function: "",
  value: "",
  message: "",
  style: "",
  action: "",
  version: 0,
};

const questions: {
  key: StepKey;
  label: string;
  question: string;
  help: string;
  placeholder: string;
}[] = [
  {
    key: "idea",
    label: "Idea",
    question: "What website do you want to make?",
    help: "Say it normally.",
    placeholder: "Example: A fashion site where I can design clothes and show new outfits.",
  },
  {
    key: "purpose",
    label: "Purpose",
    question: "Why should this site exist?",
    help: "This keeps the project from becoming random.",
    placeholder: "Example: Help me turn outfit ideas into real clothing designs.",
  },
  {
    key: "audience",
    label: "User",
    question: "Who is it for first?",
    help: "Pick one real person or group.",
    placeholder: "Example: Me and my friends who like fashion.",
  },
  {
    key: "function",
    label: "Function",
    question: "What should it do first?",
    help: "One useful thing. Keep it small.",
    placeholder: "Example: Let me describe an outfit idea and save it as a design card.",
  },
  {
    key: "value",
    label: "Value",
    question: "Why would they care?",
    help: "What gets easier, better, faster, calmer, or more fun?",
    placeholder: "Example: It helps me remember my ideas and choose what to make next.",
  },
  {
    key: "message",
    label: "Message",
    question: "What should the first screen say?",
    help: "This is the first thing the user understands.",
    placeholder: "Example: Design your next outfit. Save the idea. Build your look.",
  },
  {
    key: "style",
    label: "Style",
    question: "How should it feel?",
    help: "Use simple words.",
    placeholder: "Example: clean, stylish, fun, black and white, fashion magazine.",
  },
  {
    key: "action",
    label: "Action",
    question: "What should the first button do?",
    help: "This becomes the first click.",
    placeholder: "Example: Start a design.",
  },
];

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

function validEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function firstLine(value: string, fallback: string) {
  const clean = value.trim();
  if (!clean) return fallback;
  const line = clean.split("\n")[0].trim();
  if (line.length <= 64) return line;
  return `${line.slice(0, 64).trim()}...`;
}

export default function Home() {
  const [project, setProject] = useState<Project>(emptyProject);
  const [emailDraft, setEmailDraft] = useState("");
  const [allowed, setAllowed] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    const saved = window.localStorage.getItem(storageKey);
    if (!saved) return;

    try {
      const parsed = JSON.parse(saved) as Project;
      setProject(parsed);
      setEmailDraft(parsed.email);
      setAllowed(Boolean(parsed.email));
      const firstEmpty = questions.findIndex((item) => !parsed[item.key]);
      setCurrentIndex(firstEmpty >= 0 ? firstEmpty : questions.length);
    } catch {
      window.localStorage.removeItem(storageKey);
    }
  }, []);

  const active = questions[currentIndex];
  const complete = allowed && currentIndex >= questions.length;

  const title = useMemo(() => {
    return firstLine(project.message || project.idea, "First website");
  }, [project.idea, project.message]);

  function saveProject(nextProject: Project) {
    setProject(nextProject);
    window.localStorage.setItem(storageKey, JSON.stringify(nextProject));
  }

  function enter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validEmail(emailDraft)) return;

    const nextProject = { ...project, email: emailDraft.trim() };
    saveProject(nextProject);
    setAllowed(true);
    setCurrentIndex(0);
  }

  function saveAnswer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!active) return;

    const value = draft.trim();
    if (!value) return;

    const nextProject = {
      ...project,
      [active.key]: value,
      version: project.version + 1,
    };

    saveProject(nextProject);
    setDraft("");
    setCurrentIndex((index) => index + 1);
  }

  function editStep(index: number) {
    const item = questions[index];
    setCurrentIndex(index);
    setDraft(project[item.key]);
  }

  function reset() {
    setProject(emptyProject);
    setEmailDraft("");
    setAllowed(false);
    setCurrentIndex(0);
    setDraft("");
    window.localStorage.removeItem(storageKey);
  }

  function nextVersion() {
    saveProject({ ...project, version: project.version + 1 });
  }

  if (!allowed) {
    return (
      <main className="center">
        <Icons />

        <h1 className="welcome-title">Step In The Ring</h1>

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

      {!complete && active && (
        <section className="stack">
          <div className="question-head">
            <div className="kicker">{active.label}</div>
            <h1>{active.question}</h1>
            <p>{active.help}</p>
            <div className="progress" aria-label="Progress">
              {questions.map((item, index) => (
                <div
                  className={`dot ${index <= currentIndex ? "done" : ""}`}
                  key={item.key}
                />
              ))}
            </div>
          </div>

          <form className="form panel" onSubmit={saveAnswer}>
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={active.placeholder}
              autoFocus
              required
            />

            <div className="actions">
              <button type="submit">
                {currentIndex === questions.length - 1 ? "Show website" : "Next"}
              </button>
            </div>
          </form>
        </section>
      )}

      {complete && (
        <section className="stack">
          <div className="question-head">
            <div className="kicker">Version {Math.max(project.version, 1)}</div>
            <h1>Your first website</h1>
            <p>Change the core answers until it feels right.</p>
          </div>

          <div className="site-preview">
            <div className="preview-top">first screen</div>
            <div className="preview-body">
              <h2>{title}</h2>
              <p>{project.value}</p>
              <p>For {project.audience}, this site helps by doing this first: {project.function}</p>
              <div className="preview-button">{project.action || "Start"}</div>
            </div>
          </div>

          <div className="grid-two">
            <section className="panel summary">
              <h3>Core answers</h3>
              {questions.map((item, index) => (
                <button
                  className="chip"
                  type="button"
                  key={item.key}
                  onClick={() => editStep(index)}
                >
                  Change {item.label}
                </button>
              ))}
            </section>

            <section className="panel build-list">
              <h3>Build next</h3>
              <div className="build-item">
                <strong>Page 1</strong>
                <p>Home page with the message, value, and first button.</p>
              </div>
              <div className="build-item">
                <strong>Feature 1</strong>
                <p>{project.function}</p>
              </div>
              <div className="build-item">
                <strong>Test</strong>
                <p>Show it to {project.audience} and ask what feels confusing.</p>
              </div>
            </section>
          </div>

          <section className="panel summary">
            <h3>Project summary</h3>
            <div className="row">
              <strong>Idea</strong>
              <p>{project.idea}</p>
            </div>
            <div className="row">
              <strong>Purpose</strong>
              <p>{project.purpose}</p>
            </div>
            <div className="row">
              <strong>Message</strong>
              <p>{project.message}</p>
            </div>
          </section>

          <div className="actions">
            <button type="button" onClick={nextVersion}>
              Save next version
            </button>
            <button className="secondary" type="button" onClick={() => editStep(0)}>
              Start questions again
            </button>
          </div>
        </section>
      )}
    </main>
  );
}
