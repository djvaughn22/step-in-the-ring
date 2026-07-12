"use client";

import { FormEvent, useEffect, useState } from "react";

/* ── TYPES ── */
type IdeaForm = {
  ideaName: string;
  whoIsItFor: string;
  problem: string;
  firstVersion: string;
  smallestUseful: string;
  avoid: string;
};

type SavedProject = IdeaForm & { savedAt: string };

type Stage = "landing" | "form" | "result" | "portal" | "saved";

/* ── CONSTANTS ── */
const STORAGE_KEY = "sitr-v2";

const EMPTY: IdeaForm = {
  ideaName: "",
  whoIsItFor: "",
  problem: "",
  firstVersion: "",
  smallestUseful: "",
  avoid: "",
};

const QUESTIONS: {
  key: keyof IdeaForm;
  label: string;
  question: string;
  help: string;
  placeholder: string;
}[] = [
  {
    key: "ideaName",
    label: "The Idea",
    question: "What do you want to build?",
    help: "Say it plainly. One sentence is enough.",
    placeholder: 'e.g. "A dog rescue campaign" or "A prayer app for families"',
  },
  {
    key: "whoIsItFor",
    label: "The Person",
    question: "Who is it for?",
    help: "Pick one real person or group. The more specific, the better.",
    placeholder: 'e.g. "Parents with kids who love animals"',
  },
  {
    key: "problem",
    label: "The Problem",
    question: "What problem does it solve?",
    help: "What is broken, missing, or frustrating for them right now?",
    placeholder: 'e.g. "They don\'t know local shelters have great dogs waiting today"',
  },
  {
    key: "firstVersion",
    label: "Version 1",
    question: "What should the first version do?",
    help: "List the most important things. One sentence per feature is fine.",
    placeholder: 'e.g. "Show dogs, link to shelters, explain how to adopt"',
  },
  {
    key: "smallestUseful",
    label: "The Core",
    question: "What is the smallest useful version?",
    help: "If you could only build ONE thing, what would actually help someone?",
    placeholder: 'e.g. "One page with four dog cards and a find-a-shelter button"',
  },
  {
    key: "avoid",
    label: "The Limit",
    question: "What should we avoid building first?",
    help: "Name one thing that sounds good but does NOT belong in version one.",
    placeholder: 'e.g. "User accounts, payment, AI matching algorithm"',
  },
];

const EXAMPLES: { label: string; form: IdeaForm }[] = [
  {
    label: "Dog rescue campaign",
    form: {
      ideaName: "A dog rescue campaign",
      whoIsItFor: "Dog lovers who want to adopt, not shop",
      problem: "People don't know local rescues have amazing dogs waiting today",
      firstVersion: "A simple page with adoptable dogs and links to local shelters",
      smallestUseful: "One page, four dog cards, a find-a-shelter button",
      avoid: "Paid API, user accounts, donation processing",
    },
  },
  {
    label: "Family-safe movie filter",
    form: {
      ideaName: "A family-safe movie filter",
      whoIsItFor: "Parents who want to screen movies before family night",
      problem: "Finding out a movie has bad content after you've already started",
      firstVersion: "A searchable list of movies with parent-written content notes",
      smallestUseful: "Search box, 20 movies, simple content tags",
      avoid: "Video streaming, paid reviews, complex algorithms",
    },
  },
  {
    label: "Bible study app",
    form: {
      ideaName: "A Bible study app",
      whoIsItFor: "People who want a simple daily Bible routine",
      problem: "Most Bible apps are overwhelming with features nobody uses",
      firstVersion: "One verse a day, a note field, a reading streak counter",
      smallestUseful: "Daily verse, text box, save button",
      avoid: "Social features, commentary library, sermon uploads",
    },
  },
  {
    label: "Grief support page",
    form: {
      ideaName: "A grief support page",
      whoIsItFor: "People processing loss who need a quiet, honest space",
      problem: "Grief resources are either clinical or chaotic",
      firstVersion: "A page of honest words, a journaling field, gentle resources",
      smallestUseful: "Written message, text input, save locally",
      avoid: "Social sharing, login, therapist matching",
    },
  },
  {
    label: "Sports team planner",
    form: {
      ideaName: "A sports team planner",
      whoIsItFor: "Youth sports coaches managing practice schedules",
      problem: "Coordinating schedules and drills over text is a mess",
      firstVersion: "A form to create a practice plan and share it as a link",
      smallestUseful: "Practice form, plain text output, copy button",
      avoid: "Live chat, player profiles, tournament brackets",
    },
  },
  {
    label: "Local business website",
    form: {
      ideaName: "A local business website",
      whoIsItFor: "A small business owner with no online presence yet",
      problem: "No website means no credibility and no way to find them",
      firstVersion: "One page: name, what they do, hours, phone, address",
      smallestUseful: "Name, service, contact info, styled simply",
      avoid: "E-commerce, booking system, review integration",
    },
  },
];

const AI_PLANS = [
  {
    name: "Claude",
    by: "Anthropic",
    free: "Free tier available",
    price: "$20",
    period: "/month — Claude Pro",
    featured: true,
    features: [
      "Best for long planning sessions",
      "Paste your MVP plan — it builds with you",
      "Understands context across long conversations",
      "Writes code, copy, structure, and strategy",
      "claude.ai — works in browser, no install",
    ],
    url: "https://claude.ai",
    cta: "Open Claude",
  },
  {
    name: "ChatGPT",
    by: "OpenAI",
    free: "Free tier available",
    price: "$20",
    period: "/month — ChatGPT Plus",
    featured: false,
    features: [
      "Great for brainstorming and fast drafts",
      "Paste your MVP plan to get started fast",
      "Image generation built in (Plus)",
      "Massive plugin and GPT store ecosystem",
      "chatgpt.com — works in browser, no install",
    ],
    url: "https://chatgpt.com",
    cta: "Open ChatGPT",
  },
];

/* ── STORAGE ── */
function loadProjects(): SavedProject[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveToStorage(form: IdeaForm) {
  const all = loadProjects();
  all.unshift({ ...form, savedAt: new Date().toISOString() });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all.slice(0, 30)));
}

/* ── MVP PLAN BUILDER ── */
function buildPlan(form: IdeaForm) {
  const features = form.firstVersion
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 5);

  const promptForAI = [
    `Project: ${form.ideaName}`,
    `Who it's for: ${form.whoIsItFor}`,
    `Problem it solves: ${form.problem}`,
    `First version does: ${form.firstVersion}`,
    `Smallest useful version: ${form.smallestUseful}`,
    `Do NOT build yet: ${form.avoid}`,
    ``,
    `Build the first version of this for me. Start with the smallest useful version only. Keep it simple.`,
  ].join("\n");

  return {
    name: form.ideaName,
    pitch: `${form.ideaName} helps ${form.whoIsItFor} by solving: ${form.problem.replace(/^[A-Z]/, (c) => c.toLowerCase())}.`,
    targetUser: form.whoIsItFor,
    coreProblem: form.problem,
    features,
    firstPage: form.smallestUseful,
    notYet: form.avoid,
    nextAction: `Show your plan to one real person who matches your target user. Ask: "Does this make sense to you?" Their answer is your next step.`,
    promptForAI,
  };
}

/* ── THE RING (flat top-down boxing ring — the brand mark) ── */
function RingMark() {
  return (
    <div className="ring-mark" aria-hidden="true">
      <span className="ring-post tl" />
      <span className="ring-post tr" />
      <span className="ring-post bl" />
      <span className="ring-post br" />
      <span className="ring-glove">🥊</span>
    </div>
  );
}

/* ── STEP TRACK ── */
function StepTrack({ current, total }: { current: number; total: number }) {
  return (
    <div className="step-track">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`step-dot ${i < current ? "done" : i === current ? "active" : ""}`}
          style={{ marginRight: i < total - 1 ? 4 : 0 }}
        />
      ))}
    </div>
  );
}

/* ── COPY BUTTON ── */
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      className="btn btn-ghost btn-small"
      onClick={() => {
        navigator.clipboard.writeText(text).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        });
      }}
    >
      {copied ? "Copied!" : "Copy AI Prompt"}
    </button>
  );
}

/* ── MAIN ── */
export default function StepInTheRing() {
  const [stage, setStage] = useState<Stage>("landing");
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<IdeaForm>(EMPTY);
  const [draft, setDraft] = useState("");
  const [plan, setPlan] = useState<ReturnType<typeof buildPlan> | null>(null);
  const [saved, setSaved] = useState<SavedProject[]>([]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSaved(loadProjects());
    // Handoff from iDontCry's Dream Lab: ?idea=... prefills the idea and opens the form.
    try {
      const idea = new URLSearchParams(window.location.search).get("idea");
      if (idea && idea.trim()) {
        const seeded = { ...EMPTY, ideaName: idea.trim().slice(0, 160) };
        setForm(seeded);
        setDraft(seeded.ideaName);
        setStep(0);
        setStage("form");
      }
    } catch {}
  }, []);

  const currentQ = QUESTIONS[step];
  const totalSteps = QUESTIONS.length;

  function goToForm(prefill?: IdeaForm) {
    if (prefill) setForm(prefill);
    setStep(0);
    setDraft(prefill ? prefill[QUESTIONS[0].key] : "");
    setStage("form");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleNext(e: FormEvent) {
    e.preventDefault();
    const value = draft.trim();
    if (!value) return;
    const updated = { ...form, [currentQ.key]: value };
    setForm(updated);
    if (step < totalSteps - 1) {
      const nextStep = step + 1;
      setStep(nextStep);
      setDraft(updated[QUESTIONS[nextStep].key] || "");
    } else {
      const result = buildPlan(updated);
      setPlan(result);
      setStage("result");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function handleSave() {
    if (!form.ideaName) return;
    saveToStorage(form);
    setSaved(loadProjects());
  }

  function reopenProject(p: SavedProject) {
    const { savedAt: _, ...fields } = p;
    setForm(fields);
    setPlan(buildPlan(fields));
    setStage("result");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function reset() {
    setForm(EMPTY);
    setPlan(null);
    setStep(0);
    setDraft("");
    setStage("landing");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /* ── LANDING ── */
  if (stage === "landing") {
    return (
      <main>
        <div className="page">
          <section className="hero" style={{ paddingBottom: 8 }}>
            <RingMark />
            <a href="https://openmirrorllc.com" target="_blank" rel="noopener noreferrer" className="kicker" style={{ textDecoration: "none" }}>Open Mirror LLC</a>
            <h1>Step In The Ring</h1>
            <p className="hero-sub">
              Bring a rough idea. Answer six questions. Walk out with a plan for
              version one — and the exact prompt to build it with free tools.
            </p>
            <div className="actions center" style={{ marginTop: 30 }}>
              <button className="btn btn-gold btn-big" onClick={() => goToForm()}>
                🥊 Step in — start your plan
              </button>
            </div>
            <div className="hero-links">
              <button onClick={() => setStage("portal")}>How it works</button>
              {saved.length > 0 && (
                <button onClick={() => setStage("saved")}>
                  Your corner — {saved.length} saved plan{saved.length !== 1 ? "s" : ""}
                </button>
              )}
            </div>
            <p className="tiny" style={{ marginTop: 20 }}>
              Dreamed it up on{" "}
              <a href="https://idontcry.com" target="_blank" rel="noopener noreferrer" style={{ color: "var(--gold)", textDecoration: "none", fontWeight: 800 }}>iDontCry</a>?
              It lands right here.
            </p>
          </section>

          {/* The three rounds */}
          <section className="home-section">
            <span className="kicker">The three rounds</span>
            <div className="rounds3">
              {[
                { n: "Round 1", t: "Answer six questions", b: "What it is, who it's for, what version one must do. Plain words, two minutes." },
                { n: "Round 2", t: "Get your fight plan", b: "One clean card: the pitch, the features, the first page to build — and what to skip." },
                { n: "Round 3", t: "Hand it to your builder", b: "Copy one ready prompt into Claude or ChatGPT and start building. Both have free tiers." },
              ].map((r) => (
                <div key={r.n} className="round-card">
                  <span className="round-num">{r.n}</span>
                  <h3>{r.t}</h3>
                  <p>{r.b}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Examples */}
          <section className="home-section">
            <span className="kicker">Not sure yet? Tag in an example</span>
            <p className="section-lead">
              Pick the closest one — it fills all six answers so you can edit and make it yours.
            </p>
            <div className="ex-grid">
              {EXAMPLES.map((ex) => (
                <button key={ex.label} className="ex-card" onClick={() => goToForm(ex.form)}>
                  <span className="ex-name">{ex.label}</span>
                  <span className="ex-who">For {ex.form.whoIsItFor.replace(/^[A-Z]/, (c) => c.toLowerCase())}</span>
                </button>
              ))}
            </div>
          </section>

          {/* The other doors */}
          <section className="home-section">
            <span className="kicker">More ways into the ring</span>
            <div className="stack">
              <a href="/build" className="door-card">
                <span className="door-emoji">🛠️</span>
                <div>
                  <h3>Build your first web app</h3>
                  <p>Six guided rounds — idea, tools, create, save, deploy, your own domain. Made for total beginners.</p>
                </div>
                <span className="door-go">→</span>
              </a>
              <a href="/engines" className="door-card">
                <span className="door-emoji">🧰</span>
                <div>
                  <h3>Engine Room</h3>
                  <p>The pro shop: Idea, Design Shop, Music, and Game engines. The Game Engine pushes real games live to OpenDoku.com. Access code required.</p>
                </div>
                <span className="door-go">→</span>
              </a>
            </div>
          </section>

          {/* Proof */}
          <section className="home-section">
            <span className="kicker">Built through the Ring</span>
            <p className="section-lead">
              Real things that started as rough ideas. Play them.
            </p>
            <div className="proof-grid">
              <a href="https://opendoku.com/slopedoku/" target="_blank" rel="noopener noreferrer" className="proof-card">
                <span className="proof-name">⛷️ SlopeDoku</span>
                <span className="proof-sub">Winter sudoku — two puzzles in every tile, plus Avalanche.</span>
              </a>
              <a href="https://opendoku.com/surfdoku/" target="_blank" rel="noopener noreferrer" className="proof-card">
                <span className="proof-name">🌞 SurfDoku</span>
                <span className="proof-sub">The beach remix — same brain, different weather.</span>
              </a>
              <a href="https://opendoku.com/minedoku/" target="_blank" rel="noopener noreferrer" className="proof-card">
                <span className="proof-name">⛏️ MineDoku</span>
                <span className="proof-sub">Published live by the Game Engine itself.</span>
              </a>
            </div>
            <p className="tiny" style={{ marginTop: 12 }}>
              Dreamed on iDontCry → shaped here → live on OpenDoku.com. Your idea takes the same road.
            </p>
          </section>

          {/* AI tools */}
          <section className="home-section">
            <span className="kicker">In your corner</span>
            <p className="section-lead">
              You don&apos;t need expensive tools. Both of these have free tiers —
              $20/month only if you go deep.
            </p>
            <div className="ai-plans">
              {AI_PLANS.map((plan) => (
                <div key={plan.name} className={`ai-plan-card ${plan.featured ? "featured" : ""}`}>
                  <div className="ai-plan-name" style={{ color: plan.featured ? "var(--gold)" : "var(--muted)" }}>
                    {plan.name}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--dim)", marginBottom: 10 }}>by {plan.by}</div>
                  <div className="ai-plan-price">{plan.price}</div>
                  <div className="ai-plan-period">{plan.period}</div>
                  <div style={{ fontSize: 11, color: "var(--green)", fontWeight: 700, marginBottom: 12 }}>
                    ✓ {plan.free}
                  </div>
                  {plan.features.map((f) => (
                    <div key={f} className="ai-plan-feature">{f}</div>
                  ))}
                  <a
                    href={plan.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-ghost btn-small"
                    style={{ marginTop: 16, width: "100%" }}
                  >
                    {plan.cta} →
                  </a>
                </div>
              ))}
            </div>
            <p className="tiny" style={{ marginTop: 14, textAlign: "center" }}>
              No affiliate links. No paid promotions. Just the tools we actually use.
            </p>
          </section>

          <div className="divider" />

          <p className="tiny" style={{ textAlign: "center" }}>
            Step In The Ring is part of <a href="https://openmirrorllc.com" target="_blank" rel="noopener noreferrer" style={{ color: "var(--gold)", textDecoration: "none" }}>Open Mirror LLC</a>. Looking for something deeper? Try <a href="https://crossheartpray.com" target="_blank" rel="noopener noreferrer" style={{ color: "var(--gold)", textDecoration: "none" }}>CrossHeartPray</a>. Kids should build with a parent or trusted adult.
          </p>
        </div>
      </main>
    );
  }

  /* ── HOW IT WORKS ── */
  if (stage === "portal") {
    return (
      <main>
        <div className="page">
          <div className="topbar">
            <span className="topbar-title">How It Works</span>
            <button className="btn btn-ghost btn-small" onClick={reset}>Back</button>
          </div>

          <div className="stack">
            {[
              { n: "01", title: "You walk in with a rough idea", body: "It doesn't have to be polished. It doesn't have to be smart yet. Just say what you want to build." },
              { n: "02", title: "Six questions shape it", body: "Who is it for? What problem does it solve? What's the smallest version that actually helps someone? We strip the fluff and find the core." },
              { n: "03", title: "You get your fight plan", body: "A clean plan card: project name, pitch, target user, feature list, what to build first, and what NOT to build yet." },
              { n: "04", title: "You copy your AI prompt", body: "Your plan becomes a ready-to-paste prompt for Claude or ChatGPT. Paste it in. Start building. Both have free tiers." },
              { n: "05", title: "Save and come back", body: "Save your project locally. Reopen it later. No account required. Your ideas stay on your device." },
            ].map((item) => (
              <div key={item.n} className="card" style={{ display: "flex", gap: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 900, color: "var(--gold)", minWidth: 28, marginTop: 2 }}>
                  {item.n}
                </div>
                <div>
                  <h3 style={{ marginBottom: 8 }}>{item.title}</h3>
                  <p style={{ fontSize: 14 }}>{item.body}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="actions center" style={{ marginTop: 40 }}>
            <button className="btn btn-primary" onClick={() => goToForm()}>
              Start Building
            </button>
          </div>

          <p className="tiny" style={{ textAlign: "center", marginTop: 20 }}>
            Kids should build with a parent or trusted adult.
          </p>
        </div>
      </main>
    );
  }

  /* ── FORM (STEP BY STEP) ── */
  if (stage === "form") {
    return (
      <main>
        <div className="page">
          <div className="topbar">
            <span className="topbar-title">{currentQ.label} · {step + 1} of {totalSteps}</span>
            <button className="btn btn-ghost btn-small" onClick={reset}>Exit</button>
          </div>

          <StepTrack current={step} total={totalSteps} />

          <div className="step-enter stack">
            <div>
              <span className="field-label">{currentQ.label}</span>
              <p className="field-question">{currentQ.question}</p>
              <p className="field-help">{currentQ.help}</p>
            </div>

            <form className="stack" onSubmit={handleNext}>
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={currentQ.placeholder}
                autoFocus
                rows={4}
                required
              />

              <div className="actions">
                <button type="submit" className="btn btn-gold">
                  {step < totalSteps - 1 ? "Next →" : "🥊 Get my fight plan"}
                </button>
                {step > 0 && (
                  <button
                    type="button"
                    className="btn btn-ghost btn-small"
                    onClick={() => {
                      setStep(step - 1);
                      setDraft(form[QUESTIONS[step - 1].key] || "");
                    }}
                  >
                    ← Back
                  </button>
                )}
              </div>
            </form>

            {/* Quick examples while in form */}
            <div style={{ marginTop: 8 }}>
              <p style={{ fontSize: 12, color: "var(--dim)", marginBottom: 8 }}>
                Or jump to an example:
              </p>
              <div className="chips">
                {EXAMPLES.map((ex) => (
                  <button
                    key={ex.label}
                    className="chip"
                    style={{ fontSize: 12 }}
                    onClick={() => {
                      setForm(ex.form);
                      setDraft(ex.form[currentQ.key]);
                    }}
                  >
                    {ex.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  /* ── SAVED PROJECTS ── */
  if (stage === "saved") {
    return (
      <main>
        <div className="page">
          <div className="topbar">
            <span className="topbar-title">Your corner — saved plans</span>
            <button className="btn btn-ghost btn-small" onClick={reset}>Back</button>
          </div>

          {saved.length === 0 ? (
            <div className="card" style={{ textAlign: "center", padding: 40 }}>
              <p style={{ marginBottom: 20 }}>No saved projects yet.</p>
              <button className="btn btn-primary" onClick={() => goToForm()}>
                Start Building
              </button>
            </div>
          ) : (
            <div className="stack">
              {saved.map((p, i) => (
                <div key={i} className="saved-item">
                  <div>
                    <h3 style={{ fontSize: 15, marginBottom: 4 }}>{p.ideaName}</h3>
                    <p style={{ fontSize: 12 }}>For: {p.whoIsItFor}</p>
                    <p style={{ fontSize: 11, marginTop: 4, color: "var(--dim)" }}>
                      {new Date(p.savedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button className="btn btn-ghost btn-small" onClick={() => reopenProject(p)}>
                    Open
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    );
  }

  /* ── RESULT / MVP PLAN ── */
  if (stage === "result" && plan) {
    return (
      <main>
        <div className="page">
          <div className="topbar">
            <span className="topbar-title">🥊 Your Fight Plan</span>
            <button className="btn btn-ghost btn-small" onClick={reset}>Start Over</button>
          </div>

          <div className="stack">

            {/* Hero card */}
            <div className="card card-gold">
              <div className="plan-label">Project</div>
              <h2 style={{ marginBottom: 12 }}>{plan.name}</h2>
              <p style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", lineHeight: 1.6 }}>
                {plan.pitch}
              </p>
            </div>

            {/* User + Problem */}
            <div className="row2">
              <div className="card">
                <div className="plan-label">Target User</div>
                <p className="plan-value">{plan.targetUser}</p>
              </div>
              <div className="card">
                <div className="plan-label">Core Problem</div>
                <p className="plan-value">{plan.coreProblem}</p>
              </div>
            </div>

            {/* Features */}
            <div className="card">
              <div className="plan-label">MVP Features</div>
              {plan.features.map((f, i) => (
                <div key={i} className="feature-item">
                  <span className="feature-num">#{i + 1}</span>
                  <p className="plan-value" style={{ fontSize: 14 }}>{f}</p>
                </div>
              ))}
            </div>

            {/* First page + Not yet */}
            <div className="row2">
              <div className="card">
                <div className="plan-label">First Page to Build</div>
                <p className="plan-value" style={{ fontSize: 14 }}>{plan.firstPage}</p>
              </div>
              <div className="card">
                <div className="plan-label" style={{ color: "var(--muted)" }}>Do NOT Build Yet</div>
                <p className="plan-value" style={{ fontSize: 14 }}>{plan.notYet}</p>
              </div>
            </div>

            {/* Next action */}
            <div className="next-action">
              <div className="plan-label">Next Best Action</div>
              <p className="plan-value" style={{ fontSize: 14 }}>{plan.nextAction}</p>
            </div>

            {/* AI Prompt */}
            <div className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
                <div className="plan-label" style={{ margin: 0 }}>Your AI Prompt</div>
                <CopyButton text={plan.promptForAI} />
              </div>
              <pre style={{
                background: "var(--surface)",
                border: "1px solid var(--line)",
                borderRadius: 12,
                padding: "14px 16px",
                fontSize: 12,
                color: "var(--muted)",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                lineHeight: 1.6,
                fontFamily: "monospace",
              }}>
                {plan.promptForAI}
              </pre>
              <p style={{ fontSize: 12, color: "var(--dim)", marginTop: 10 }}>
                Copy this. Paste it into Claude or ChatGPT. Tell them to start building.
              </p>
              <div className="actions" style={{ marginTop: 14 }}>
                <a href="https://claude.ai" target="_blank" rel="noopener noreferrer" className="btn btn-gold btn-small">
                  Open Claude →
                </a>
                <a href="https://chatgpt.com" target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-small">
                  Open ChatGPT →
                </a>
              </div>
            </div>

            {/* Actions */}
            <div className="actions">
              <button className="btn btn-primary" onClick={() => { handleSave(); }}>
                Save Project
              </button>
              <button className="btn btn-ghost btn-small" onClick={() => { setStep(0); setDraft(form[QUESTIONS[0].key]); setStage("form"); }}>
                Edit Answers
              </button>
              {saved.length > 0 && (
                <button className="btn btn-ghost btn-small" onClick={() => setStage("saved")}>
                  View Saved
                </button>
              )}
            </div>

            <div className="divider" />

            {/* AI Plans teaser */}
            <div>
              <span className="kicker">Ready to build? Start free.</span>
              <div className="ai-plans" style={{ marginTop: 16 }}>
                {AI_PLANS.map((p) => (
                  <a
                    key={p.name}
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`ai-plan-card ${p.featured ? "featured" : ""}`}
                    style={{ textDecoration: "none", display: "block" }}
                  >
                    <div className="ai-plan-name" style={{ color: p.featured ? "var(--gold)" : "var(--muted)" }}>
                      {p.name}
                    </div>
                    <div className="ai-plan-price" style={{ fontSize: 20 }}>{p.price}/mo</div>
                    <div style={{ fontSize: 11, color: "var(--green)", fontWeight: 700, margin: "6px 0 12px" }}>
                      ✓ {p.free}
                    </div>
                    <span className="btn btn-ghost btn-small" style={{ display: "inline-flex" }}>
                      {p.cta} →
                    </span>
                  </a>
                ))}
              </div>
            </div>

          </div>
        </div>
      </main>
    );
  }

  return null;
}
