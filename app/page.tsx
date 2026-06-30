"use client";

import { FormEvent, useEffect, useState } from "react";

type IdeaForm = {
  ideaName: string;
  whoIsItFor: string;
  problem: string;
  firstVersion: string;
  smallestUseful: string;
  avoid: string;
};

type SavedProject = IdeaForm & { savedAt: string };

const STORAGE_KEY = "sitr-projects-v1";
const EXAMPLES: IdeaForm[] = [
  {
    ideaName: "A dog rescue campaign",
    whoIsItFor: "Dog lovers who want to adopt, not shop",
    problem: "People don't know local rescues have amazing dogs waiting today",
    firstVersion: "A simple page with adoptable dogs and links to local shelters",
    smallestUseful: "One page, four dog cards, a find-a-shelter button",
    avoid: "Paid API, user accounts, donation processing on day one",
  },
  {
    ideaName: "A family-safe movie filter idea",
    whoIsItFor: "Parents who want to screen movies before family night",
    problem: "Finding out a movie has bad content after you've already started watching",
    firstVersion: "A searchable list of movies with parent-written content notes",
    smallestUseful: "Search box, 20 movies, simple content tag system",
    avoid: "Video streaming, paid reviews, complex rating algorithms",
  },
  {
    ideaName: "A Bible study app",
    whoIsItFor: "People who want a simple daily Bible routine",
    problem: "Most Bible apps are overwhelming with features nobody uses",
    firstVersion: "One verse a day, a note field, a reading streak counter",
    smallestUseful: "Daily verse, text box, save button",
    avoid: "Social features, commentary library, sermon uploads",
  },
  {
    ideaName: "A grief support page",
    whoIsItFor: "People processing loss who need a quiet, honest space",
    problem: "Grief resources are either clinical or chaotic — nothing feels human",
    firstVersion: "A page of honest words, a journaling field, gentle resources",
    smallestUseful: "A written message, a text input, a save locally option",
    avoid: "Social sharing, login, therapist matching",
  },
  {
    ideaName: "A sports team planner",
    whoIsItFor: "Youth sports coaches managing practice schedules",
    problem: "Coordinating schedules and drills by text or email is a mess",
    firstVersion: "A simple form to create a practice plan and share it as a link",
    smallestUseful: "Practice form, plain text output, copy button",
    avoid: "Live chat, player profiles, tournament bracket builder",
  },
  {
    ideaName: "A local business website",
    whoIsItFor: "A small business owner with no online presence yet",
    problem: "No website means no credibility, no hours listed, no way to contact them",
    firstVersion: "One page: name, what they do, hours, phone number, address",
    smallestUseful: "Name, service, contact info, styled simply",
    avoid: "E-commerce, booking system, review integration",
  },
];

const EMPTY: IdeaForm = {
  ideaName: "",
  whoIsItFor: "",
  problem: "",
  firstVersion: "",
  smallestUseful: "",
  avoid: "",
};

function loadProjects(): SavedProject[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveProject(form: IdeaForm) {
  const projects = loadProjects();
  const entry: SavedProject = { ...form, savedAt: new Date().toISOString() };
  projects.unshift(entry);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects.slice(0, 20)));
}

function buildMVPPlan(form: IdeaForm) {
  const pitch = `${form.ideaName} helps ${form.whoIsItFor} by ${form.problem.toLowerCase().replace(/^people |^users /, "solving: ")}.`;
  const features = form.firstVersion
    .split(/[,.\n]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 5);
  return {
    projectName: form.ideaName,
    pitch,
    targetUser: form.whoIsItFor,
    coreProblem: form.problem,
    features,
    firstPage: form.smallestUseful,
    notYet: form.avoid,
    nextAction: `Build the first page. Show it to one real person from your target group. Ask: "Does this make sense?" Then improve.`,
  };
}

export default function StepInTheRing() {
  const [stage, setStage] = useState<"landing" | "form" | "result" | "saved">("landing");
  const [form, setForm] = useState<IdeaForm>(EMPTY);
  const [plan, setPlan] = useState<ReturnType<typeof buildMVPPlan> | null>(null);
  const [savedProjects, setSavedProjects] = useState<SavedProject[]>([]);

  useEffect(() => {
    setSavedProjects(loadProjects());
  }, []);

  function handleExampleClick(example: IdeaForm) {
    setForm(example);
    setStage("form");
    setTimeout(() => document.getElementById("idea-form")?.scrollIntoView({ behavior: "smooth" }), 80);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const result = buildMVPPlan(form);
    setPlan(result);
    setStage("result");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleSave() {
    if (!form.ideaName) return;
    saveProject(form);
    setSavedProjects(loadProjects());
    setStage("saved");
  }

  function reopenProject(p: SavedProject) {
    const { savedAt: _savedAt, ...fields } = p;
    setForm(fields);
    setPlan(buildMVPPlan(fields));
    setStage("result");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function reset() {
    setForm(EMPTY);
    setPlan(null);
    setStage("landing");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function field(key: keyof IdeaForm, label: string, placeholder: string) {
    return (
      <div className="stack" key={key} style={{ gap: 6 }}>
        <label htmlFor={key} className="label">{label}</label>
        <textarea
          id={key}
          value={form[key]}
          onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
          placeholder={placeholder}
          required
          rows={3}
        />
      </div>
    );
  }

  /* ── LANDING ── */
  if (stage === "landing") {
    return (
      <main>
        <div className="center" style={{ textAlign: "center", paddingBottom: 40 }}>
          <div className="icons">
            <div className="icon-card">
              <div className="icon-wrap"><div className="enter-ring" /></div>
              <span className="icon-label">Enter</span>
            </div>
            <div className="icon-card">
              <div className="icon-wrap"><span className="idea-icon">✦</span></div>
              <span className="icon-label">Idea</span>
            </div>
            <div className="icon-card">
              <div className="icon-wrap"><span className="build-icon">💻</span></div>
              <span className="icon-label">Build</span>
            </div>
          </div>

          <h1 className="welcome-title">Step In The Ring</h1>
          <p style={{ maxWidth: 480, margin: "0 auto 10px", fontSize: 18, fontWeight: 700 }}>
            Turn a rough idea into a simple first MVP.
          </p>
          <p style={{ maxWidth: 420, margin: "0 auto 8px", fontSize: 13 }}>
            Kids should build with a parent or trusted adult.
          </p>

          <div className="actions" style={{ marginTop: 24 }}>
            <button type="button" onClick={() => setStage("form")}>
              Start Building
            </button>
            <button
              type="button"
              className="secondary"
              onClick={() => {
                setStage("form");
                setTimeout(() => document.getElementById("examples")?.scrollIntoView({ behavior: "smooth" }), 80);
              }}
            >
              See Examples
            </button>
          </div>

          {savedProjects.length > 0 && (
            <div style={{ marginTop: 32 }}>
              <button
                type="button"
                className="secondary"
                onClick={() => setStage("saved")}
                style={{ fontSize: 13 }}
              >
                View {savedProjects.length} Saved Project{savedProjects.length !== 1 ? "s" : ""}
              </button>
            </div>
          )}
        </div>
      </main>
    );
  }

  /* ── SAVED PROJECTS ── */
  if (stage === "saved") {
    return (
      <main>
        <div className="topline">
          <span className="kicker">Saved Projects</span>
          <button className="secondary" type="button" onClick={reset} style={{ fontSize: 13 }}>
            Back
          </button>
        </div>

        {savedProjects.length === 0 ? (
          <div className="panel" style={{ textAlign: "center", padding: 32 }}>
            <p>No saved projects yet.</p>
            <div className="actions" style={{ marginTop: 16 }}>
              <button type="button" onClick={() => setStage("form")}>Start Building</button>
            </div>
          </div>
        ) : (
          <div className="stack">
            {savedProjects.map((p, i) => (
              <div key={i} className="panel">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                  <div>
                    <strong style={{ color: "var(--text)", display: "block", marginBottom: 4 }}>
                      {p.ideaName}
                    </strong>
                    <p style={{ fontSize: 12 }}>
                      For: {p.whoIsItFor}
                    </p>
                    <p style={{ fontSize: 11, marginTop: 4 }}>
                      {new Date(p.savedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="chip"
                    onClick={() => reopenProject(p)}
                    style={{ fontSize: 13 }}
                  >
                    Open
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    );
  }

  /* ── RESULT / MVP PLAN ── */
  if (stage === "result" && plan) {
    return (
      <main>
        <div className="topline">
          <span className="kicker">First MVP Plan</span>
          <button className="secondary" type="button" onClick={reset} style={{ fontSize: 13 }}>
            Start Over
          </button>
        </div>

        <div className="stack">
          <div className="panel">
            <div className="kicker" style={{ marginBottom: 8 }}>Project</div>
            <h2 style={{ fontSize: "clamp(22px, 5vw, 32px)" }}>{plan.projectName}</h2>
            <p style={{ marginTop: 10, fontWeight: 600, color: "var(--text)", fontSize: 15 }}>
              {plan.pitch}
            </p>
          </div>

          <div className="grid-two">
            <div className="panel">
              <div className="kicker" style={{ marginBottom: 6 }}>Target User</div>
              <p style={{ color: "var(--text)", fontWeight: 600, fontSize: 14 }}>{plan.targetUser}</p>
            </div>
            <div className="panel">
              <div className="kicker" style={{ marginBottom: 6 }}>Core Problem</div>
              <p style={{ color: "var(--text)", fontWeight: 600, fontSize: 14 }}>{plan.coreProblem}</p>
            </div>
          </div>

          <div className="panel">
            <div className="kicker" style={{ marginBottom: 8 }}>MVP Features</div>
            <div className="stack" style={{ gap: 8 }}>
              {plan.features.map((f, i) => (
                <div key={i} className="build-item">
                  <strong style={{ fontSize: 13, color: "var(--gold)" }}>#{i + 1}</strong>
                  <p style={{ color: "var(--text)", fontWeight: 600, fontSize: 14, marginTop: 2 }}>{f}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid-two">
            <div className="panel">
              <div className="kicker" style={{ marginBottom: 6 }}>First Page to Build</div>
              <p style={{ color: "var(--text)", fontWeight: 600, fontSize: 14 }}>{plan.firstPage}</p>
            </div>
            <div className="panel">
              <div className="kicker" style={{ color: "var(--muted)", marginBottom: 6 }}>
                Do NOT Build Yet
              </div>
              <p style={{ color: "var(--text)", fontWeight: 600, fontSize: 14 }}>{plan.notYet}</p>
            </div>
          </div>

          <div className="panel" style={{ background: "rgba(215, 181, 109, 0.08)", borderColor: "rgba(215, 181, 109, 0.3)" }}>
            <div className="kicker" style={{ marginBottom: 8 }}>Next Best Action</div>
            <p style={{ color: "var(--text)", fontWeight: 600, fontSize: 14, lineHeight: 1.6 }}>
              {plan.nextAction}
            </p>
          </div>

          <div className="actions">
            <button type="button" onClick={handleSave}>
              Save Project
            </button>
            <button type="button" className="secondary" onClick={() => setStage("form")}>
              Edit Answers
            </button>
            {savedProjects.length > 0 && (
              <button type="button" className="secondary" onClick={() => setStage("saved")} style={{ fontSize: 13 }}>
                View Saved
              </button>
            )}
          </div>
        </div>
      </main>
    );
  }

  /* ── FORM ── */
  return (
    <main id="idea-form">
      <div className="topline">
        <span>
          <span className="kicker">What do you want to build?</span>
        </span>
        <button className="secondary" type="button" onClick={reset} style={{ fontSize: 13 }}>
          Back
        </button>
      </div>

      {/* Example chips */}
      <section id="examples" style={{ marginBottom: 22 }}>
        <p className="label" style={{ marginBottom: 10, display: "block" }}>
          Examples — click to fill the form
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {EXAMPLES.map((ex) => (
            <button
              key={ex.ideaName}
              type="button"
              className="chip"
              onClick={() => handleExampleClick(ex)}
              style={{ fontSize: 13 }}
            >
              {ex.ideaName}
            </button>
          ))}
        </div>
      </section>

      <form className="stack" onSubmit={handleSubmit} style={{ gap: 14 }}>
        <div className="panel">
          <div className="stack" style={{ gap: 14 }}>
            {field("ideaName", "Idea Name", 'e.g. "A dog rescue campaign" or "A family movie tracker"')}
            {field("whoIsItFor", "Who is it for?", "Describe the real person or group who will use this first.")}
            {field("problem", "What problem does it solve?", "What is annoying, missing, or broken for them right now?")}
            {field("firstVersion", "What should the first version do?", "List the most important things — one sentence per feature.")}
            {field("smallestUseful", "What is the smallest useful version?", "If you could only build one thing, what would it be?")}
            {field("avoid", "What should we avoid?", "Name at least one thing that sounds tempting but does NOT belong in version 1.")}
          </div>
        </div>

        <p className="small">Kids should build with a parent or trusted adult.</p>

        <div className="actions">
          <button type="submit">Generate My MVP Plan</button>
        </div>
      </form>
    </main>
  );
}
