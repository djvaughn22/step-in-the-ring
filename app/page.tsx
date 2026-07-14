"use client";

import { FormEvent, useEffect, useState } from "react";

/* ── TYPES ── */
type IdeaForm = {
  ideaName: string;
  whoIsItFor: string;
  problem: string;
  win: string;
  firstVersion: string;
  smallestUseful: string;
  avoid: string;
};

type SavedProject = IdeaForm & { savedAt: string };

type Stage = "landing" | "form" | "result" | "saved";

/* ── CONSTANTS ── */
const STORAGE_KEY = "sitr-v2";

const EMPTY: IdeaForm = {
  ideaName: "",
  whoIsItFor: "",
  problem: "",
  win: "",
  firstVersion: "",
  smallestUseful: "",
  avoid: "",
};

/**
 * THE SEVEN QUESTIONS — the founder's mind, top to bottom.
 * Dream → Person → Pain → Win → Scope → Core → Discipline.
 * Every engine intake follows this same arc; only the wording changes lane.
 * Seven on purpose — complete, like the seventh day.
 */
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
    placeholder: 'e.g. "A game where you dodge falling tacos" or "A website for my dog"',
  },
  {
    key: "whoIsItFor",
    label: "The Person",
    question: "Who is it for?",
    help: "Pick one real person or group. The more specific, the better.",
    placeholder: 'e.g. "Me and my friends at lunch"',
  },
  {
    key: "problem",
    label: "The Problem",
    question: "What problem does it solve?",
    help: "What is broken, missing, or frustrating for them right now?",
    placeholder: 'e.g. "Every game we play was made by someone else"',
  },
  {
    key: "win",
    label: "The Win",
    question: "What does the win look like for them?",
    help: "The first moment it actually works — what just got better in their day?",
    placeholder: 'e.g. "A friend plays it, loses, and immediately demands a rematch"',
  },
  {
    key: "firstVersion",
    label: "Version 1",
    question: "What should the first version do?",
    help: "List the most important things. One sentence per feature is fine.",
    placeholder: 'e.g. "One player, falling tacos, a score counter"',
  },
  {
    key: "smallestUseful",
    label: "The Core",
    question: "What is the smallest useful version?",
    help: "If you could only build ONE thing, what would actually help someone?",
    placeholder: 'e.g. "A square that dodges one taco, with a score"',
  },
  {
    key: "avoid",
    label: "The Limit",
    question: "What should we avoid building first?",
    help: "Name one thing that sounds good but does NOT belong in version one.",
    placeholder: 'e.g. "Levels, power-ups, online multiplayer"',
  },
];

const EXAMPLES: { label: string; form: IdeaForm }[] = [
  {
    label: "A game you actually made",
    form: {
      ideaName: "A game where you dodge falling tacos",
      whoIsItFor: "Me and my friends — first one to 100 points wins",
      problem: "Every game we play was made by someone else",
      win: "A friend plays it, loses, and immediately demands a rematch",
      firstVersion: "One player, falling tacos, a score counter, a game-over screen",
      smallestUseful: "A square that moves left and right, one falling taco, a score",
      avoid: "Levels, power-ups, online multiplayer",
    },
  },
  {
    label: "Your pet's own website",
    form: {
      ideaName: "A website for my dog",
      whoIsItFor: "Everyone who has ever met my dog",
      problem: "The best dog in the world has zero internet presence",
      win: "Grandma clicks the link and laughs at the photo of him in sunglasses",
      firstVersion: "His photos, his backstory, a running list of socks he has stolen",
      smallestUseful: "One page: his name, one great photo, three facts",
      avoid: "A blog, a merch store, booking him for appearances",
    },
  },
  {
    label: "Game-night leaderboard",
    form: {
      ideaName: "A leaderboard for family game night",
      whoIsItFor: "My family — everyone claims they win the most",
      problem: "Nobody remembers last week's score, so every win gets disputed",
      win: "Uno night ends and the loser watches their name drop on the board",
      firstVersion: "Add players, log who won tonight, show all-time standings",
      smallestUseful: "A list of names with win counts and a plus button",
      avoid: "Accounts, stat graphs, support for fifty different games",
    },
  },
  {
    label: "Dinner decider",
    form: {
      ideaName: "A spinner that decides what's for dinner",
      whoIsItFor: "Any house stuck in the \"I don't know, what do you want\" loop",
      problem: "Deciding dinner takes longer than cooking it",
      win: "Spin, land on tacos, argument over in ten seconds",
      firstVersion: "A wheel loaded with our real meals, a spin button, one veto per person",
      smallestUseful: "A button that picks one meal from a list",
      avoid: "Recipes, grocery lists, nutrition tracking",
    },
  },
  {
    label: "Settle-the-argument bracket",
    form: {
      ideaName: "A bracket that settles the greatest-of-all-time argument",
      whoIsItFor: "Friends who argue about the best snack, movie, or player",
      problem: "The best-pizza-topping debate never actually ends",
      win: "Sixteen snacks enter, one wins, and it's on the record forever",
      firstVersion: "Build a bracket, tap winners round by round, crown a champion",
      smallestUseful: "Eight entries, tap to pick each winner, a champion screen",
      avoid: "Voting from multiple phones, accounts, sharing feeds",
    },
  },
  {
    label: "Grandma's recipe box",
    form: {
      ideaName: "Grandma's recipes, saved online",
      whoIsItFor: "Our whole family, before the handwritten cards fade",
      problem: "The good recipes live in one box in one kitchen",
      win: "A cousin two states away makes the cinnamon rolls for the first time",
      firstVersion: "Type in the recipes, add photos of the original cards",
      smallestUseful: "Five recipes on one page, exactly as she wrote them",
      avoid: "Meal planning, star ratings, importing from recipe sites",
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
  const win = (form.win ?? "").trim(); // saves from the six-question era have no win
  const features = form.firstVersion
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 5);

  const promptForAI = [
    `Project: ${form.ideaName}`,
    `Who it's for: ${form.whoIsItFor}`,
    `Problem it solves: ${form.problem}`,
    ...(win ? [`The win — what better looks like for them: ${win}`] : []),
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
    win,
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
              Bring a rough idea. Answer seven questions. Walk out with a plan for
              version one — and the exact prompt to build it with free tools.
            </p>
            <div className="actions center" style={{ marginTop: 30 }}>
              <button className="btn btn-gold btn-big" onClick={() => goToForm()}>
                🥊 Step in — start your plan
              </button>
            </div>
            <div className="hero-links">
              <a href="/how" style={{ color: "var(--muted)", fontSize: 13, fontWeight: 800, textDecoration: "underline", textUnderlineOffset: 4, textDecorationColor: "var(--line2)" }}>How it works</a>
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
                { n: "Round 1", t: "Answer seven questions", b: "What it is, who it's for, what the win looks like, what version one must do. Plain words, three minutes." },
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
              Pick the closest one — it fills all seven answers so you can edit and make it yours.
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
              Dreamed on iDontCry → shaped here → tested locally → pushed live. Your idea takes the same road.{" "}
              <a href="/live" style={{ color: "var(--gold)", fontWeight: 800, textDecoration: "none" }}>See every live product →</a>
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

            {/* The Win */}
            {plan.win && (
              <div className="card">
                <div className="plan-label">The Win</div>
                <p className="plan-value">{plan.win}</p>
              </div>
            )}

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
              <p className="tiny" style={{ textAlign: "center", marginTop: 18 }}>
                Need help reaching production?{" "}
                <a href="https://openmirrorllc.com/talk-with-the-owner" style={{ color: "var(--gold)", fontWeight: 800, textDecoration: "none" }}>
                  Talk with the Owner →
                </a>
              </p>
            </div>

          </div>
        </div>
      </main>
    );
  }

  return null;
}
