"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { interpret, type PlannerInput } from "./planner/interpret";
import { buildBuilderPrompt } from "./planner/builder-prompt";
import { recommendEngine } from "./planner/handoff";
import { deletePlan, loadPlans, savePlan, type SavedPlan } from "./planner/storage";
import { BUILD_TYPE_LABEL, type Interpretation } from "./planner/types";

type Stage = "landing" | "shape" | "clarify" | "result" | "saved";

/* Examples are whole descriptions now — the way a person actually talks. */
const EXAMPLES: { label: string; hint: string; description: string }[] = [
  {
    label: "A game you actually made",
    hint: "For you and your friends",
    description:
      "A game where you dodge falling tacos and try to beat your friend's score. One player, a score counter, and it gets faster the longer you last. No levels or power-ups yet.",
  },
  {
    label: "Your pet's own website",
    hint: "For everyone who's met him",
    description:
      "A one-page website for my dog. It shows his name, one great photo, three facts about him, and a running list of the socks he has stolen. I already have the photos.",
  },
  {
    label: "Game-night leaderboard",
    hint: "For the family who argues about it",
    description:
      "A leaderboard for family game night. Nobody remembers last week's score so every win gets disputed. You add players, log who won tonight, and it shows the all-time standings.",
  },
  {
    label: "Grandma's recipe box",
    hint: "Before the cards fade",
    description:
      "Grandma's recipes saved online for our whole family, before the handwritten cards fade. I have photos of about 30 original cards. You pick a recipe and read it exactly as she wrote it.",
  },
];

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

function CopyButton({ text, label, big }: { text: string; label: string; big?: boolean }) {
  const [copied, setCopied] = useState(false);
  return (
    <>
      <button
        type="button"
        className={`btn ${big ? "btn-gold" : "btn-ghost btn-small"}`}
        onClick={() => {
          const done = () => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2200);
          };
          navigator.clipboard?.writeText(text).then(done).catch(() => {
            // Older phone webviews: fall back to a hidden textarea.
            const ta = document.createElement("textarea");
            ta.value = text;
            ta.style.position = "fixed";
            ta.style.opacity = "0";
            document.body.appendChild(ta);
            ta.select();
            try {
              document.execCommand("copy");
              done();
            } finally {
              document.body.removeChild(ta);
            }
          });
        }}
      >
        {copied ? "Copied" : label}
      </button>
      {/* Confirmation reaches a screen reader, not just the eye. */}
      <span role="status" aria-live="polite" className="sr-only">
        {copied ? "Builder prompt copied to your clipboard" : ""}
      </span>
    </>
  );
}

/** What we understood — shown before the plan, and before any question. */
function UnderstoodCard({ i }: { i: Interpretation }) {
  return (
    <div className="card card-gold">
      <div className="plan-label">What I understood</div>
      <h2 style={{ marginBottom: 10 }}>{i.title.value}</h2>
      <p style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", lineHeight: 1.6 }}>{i.summary}</p>
      <div className="pill-row">
        <span className="pill">{BUILD_TYPE_LABEL[i.buildType.value]}</span>
        {i.destination && <span className="pill">Lands on {i.destination.value}</span>}
        {/* Lowercase the first letter only — blanket toLowerCase() turns
            OpenDoku into "opendoku" and mangles every product name. */}
        {i.audience && (
          <span className="pill">For {i.audience.value.charAt(0).toLowerCase() + i.audience.value.slice(1)}</span>
        )}
      </div>
    </div>
  );
}

export default function StepInTheRing() {
  const [stage, setStage] = useState<Stage>("landing");
  const [description, setDescription] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [questionDraft, setQuestionDraft] = useState("");
  const [saved, setSaved] = useState<SavedPlan[]>([]);
  const [flash, setFlash] = useState("");
  const shapeRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSaved(loadPlans());
    // Handoff from iDontCry's Dream Lab: ?idea=... opens straight into shaping.
    try {
      const idea = new URLSearchParams(window.location.search).get("idea");
      if (idea && idea.trim()) {
        setDescription(idea.trim().slice(0, 600));
        setStage("shape");
      }
    } catch {}
  }, []);

  const input: PlannerInput = useMemo(() => ({ description, answers }), [description, answers]);
  const plan = useMemo(
    () => (description.trim() ? interpret(input) : null),
    [input, description],
  );
  const question = plan?.openQuestions[0] ?? null;
  const engine = useMemo(() => (plan ? recommendEngine(plan) : null), [plan]);
  const builderPrompt = useMemo(() => (plan ? buildBuilderPrompt(plan) : ""), [plan]);

  function go(next: Stage) {
    setStage(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleShape(e: FormEvent) {
    e.preventDefault();
    if (!description.trim()) return;
    const fresh = interpret({ description, answers });
    go(fresh.openQuestions.length ? "clarify" : "result");
  }

  function handleAnswer(e: FormEvent) {
    e.preventDefault();
    if (!question) return;
    const next = { ...answers, [question.key]: questionDraft.trim() };
    setAnswers(next);
    setQuestionDraft("");
    go("result");
  }

  function skipQuestion() {
    if (!question) return;
    // Skipping is allowed — we already have a safe assumption for it.
    setAnswers({ ...answers, [question.key]: "" });
    go("result");
  }

  function startOver() {
    setDescription("");
    setAnswers({});
    setQuestionDraft("");
    go("landing");
  }

  function handleSave() {
    if (!plan) return;
    setSaved(savePlan(input, plan.title.value));
    setFlash("Saved to your corner.");
    setTimeout(() => setFlash(""), 2500);
  }

  function openSaved(p: SavedPlan) {
    setDescription(p.description);
    setAnswers(p.answers ?? {});
    go("result");
  }

  /* ── LANDING — two doors, both obvious ── */
  if (stage === "landing") {
    return (
      <main>
        <div className="page">
          <section className="hero" style={{ paddingBottom: 8 }}>
            <RingMark />
            <a href="https://openmirrorllc.com" target="_blank" rel="noopener noreferrer" className="kicker" style={{ textDecoration: "none" }}>
              Open Mirror LLC
            </a>
            <h1>Step In The Ring</h1>
            <p className="hero-sub">
              Two ways in: say a rough idea and get a clear plan for version one — or open the
              Engine Room and make something today.
            </p>
          </section>

          <section className="home-section" style={{ marginTop: 8 }}>
            <div className="doors2">
              <div className="door-big">
                <span className="door-emoji" aria-hidden="true">🥊</span>
                <h2>Shape an idea</h2>
                <p>
                  Say it however it comes out — messy is fine. You get back a plan for version one
                  and a builder prompt worth handing to Claude or ChatGPT.
                </p>
                <button className="btn btn-gold btn-big" onClick={() => go("shape")}>
                  Shape my idea
                </button>
              </div>

              <div className="door-big">
                <span className="door-emoji" aria-hidden="true">🧰</span>
                <h2>Create something</h2>
                <p>
                  The Engine Room: pick an engine and finish a real thing — a decision, a design,
                  a first beat. Access code required.
                </p>
                <a href="/engines" className="btn btn-primary btn-big">
                  Open the Engine Room
                </a>
              </div>
            </div>
          </section>

          <section className="home-section">
            <span className="kicker">What people finish here</span>
            <div className="ex-grid">
              <a href="/engines?engine=idea" className="ex-card">
                <span className="ex-name">💡 Choose and improve an idea</span>
                <span className="ex-who">Weigh a few versions, leave with one decision</span>
              </a>
              <a href="/engines?engine=design-shop" className="ex-card">
                <span className="ex-name">🛒 Create and export a design</span>
                <span className="ex-who">A design package and an Etsy listing draft</span>
              </a>
              <a href="/engines?engine=music" className="ex-card">
                <span className="ex-name">🎵 Make and export a first beat</span>
                <span className="ex-who">Free tools, guided, to a real audio file</span>
              </a>
            </div>
          </section>

          <section className="home-section">
            <span className="kicker">Not sure yet? Start from one of these</span>
            <p className="section-lead">Pick the closest one — it fills the box so you can edit and make it yours.</p>
            <div className="ex-grid">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex.label}
                  className="ex-card"
                  onClick={() => {
                    setDescription(ex.description);
                    setAnswers({});
                    go("shape");
                  }}
                >
                  <span className="ex-name">{ex.label}</span>
                  <span className="ex-who">{ex.hint}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="home-section">
            <span className="kicker">Built through the Ring</span>
            <p className="section-lead">Real things that started as rough ideas. Play them.</p>
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
                <span className="proof-sub">Built and pushed live from the Game Engine.</span>
              </a>
            </div>
            <p className="tiny" style={{ marginTop: 12 }}>
              <a href="/live" style={{ color: "var(--gold)", fontWeight: 800, textDecoration: "none" }}>See every live product →</a>
              {" · "}
              <a href="/how" style={{ color: "var(--muted)", fontWeight: 800, textDecoration: "none" }}>How it works</a>
              {" · "}
              <a href="/build" style={{ color: "var(--muted)", fontWeight: 800, textDecoration: "none" }}>Never built a web app? Start here</a>
            </p>
          </section>

          {saved.length > 0 && (
            <section className="home-section">
              <button className="btn btn-ghost btn-small" onClick={() => go("saved")}>
                Your corner — {saved.length} saved plan{saved.length !== 1 ? "s" : ""}
              </button>
            </section>
          )}

          <div className="divider" />
          <p className="tiny" style={{ textAlign: "center" }}>
            Step In The Ring is part of{" "}
            <a href="https://openmirrorllc.com" target="_blank" rel="noopener noreferrer" style={{ color: "var(--gold)", textDecoration: "none" }}>
              Open Mirror LLC
            </a>
            . Kids should build with a parent or trusted adult.
          </p>
        </div>
      </main>
    );
  }

  /* ── SHAPE — one open box ── */
  if (stage === "shape") {
    return (
      <main>
        <div className="page">
          <div className="topbar">
            <span className="topbar-title">Shape an idea</span>
            <button className="btn btn-ghost btn-small" onClick={startOver}>Exit</button>
          </div>

          <div className="step-enter stack">
            <div>
              <label className="field-question" htmlFor="idea-description" style={{ display: "block" }}>
                What do you want to make, improve, or fix?
              </label>
              <p className="field-help" id="idea-help">
                However it comes out. Spelling doesn&apos;t matter. If it belongs on a site you already
                have, say which one.
              </p>
            </div>

            <form className="stack" onSubmit={handleShape}>
              <textarea
                id="idea-description"
                ref={shapeRef}
                aria-describedby="idea-help"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder='e.g. "A puzzle game where you pick a photo and drag the pieces back together. Add it to my games site."'
                autoFocus
                rows={7}
                required
              />
              <div className="actions">
                <button type="submit" className="btn btn-gold" disabled={!description.trim()}>
                  Read my idea →
                </button>
                <button type="button" className="btn btn-ghost btn-small" onClick={() => go("landing")}>
                  ← Back
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    );
  }

  /* ── CLARIFY — what we understood, plus at most one question ── */
  if (stage === "clarify" && plan && question) {
    return (
      <main>
        <div className="page">
          <div className="topbar">
            <span className="topbar-title">One question</span>
            <button className="btn btn-ghost btn-small" onClick={startOver}>Exit</button>
          </div>

          <div className="stack">
            <UnderstoodCard i={plan} />

            <form className="card stack" onSubmit={handleAnswer}>
              <div>
                <label className="field-question" htmlFor="follow-up" style={{ display: "block" }}>
                  {question.question}
                </label>
                <p className="field-help" id="follow-up-help">{question.help}</p>
              </div>
              <textarea
                id="follow-up"
                aria-describedby="follow-up-help"
                value={questionDraft}
                onChange={(e) => setQuestionDraft(e.target.value)}
                placeholder={question.placeholder}
                autoFocus
                rows={3}
              />
              <div className="actions">
                <button type="submit" className="btn btn-gold" disabled={!questionDraft.trim()}>
                  That&apos;s it →
                </button>
                <button type="button" className="btn btn-ghost btn-small" onClick={skipQuestion}>
                  Skip — decide for me
                </button>
                <button type="button" className="btn btn-ghost btn-small" onClick={() => go("shape")}>
                  ← Change what I said
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    );
  }

  /* ── SAVED ── */
  if (stage === "saved") {
    return (
      <main>
        <div className="page">
          <div className="topbar">
            <span className="topbar-title">Your corner — saved plans</span>
            <button className="btn btn-ghost btn-small" onClick={() => go("landing")}>Back</button>
          </div>
          {saved.length === 0 ? (
            <div className="card" style={{ textAlign: "center", padding: 40 }}>
              <p style={{ marginBottom: 20 }}>Nothing saved yet.</p>
              <button className="btn btn-gold" onClick={() => go("shape")}>Shape my idea</button>
            </div>
          ) : (
            <div className="stack">
              {saved.map((p) => (
                <div key={p.id} className="saved-item">
                  <div style={{ minWidth: 0 }}>
                    <h3 style={{ fontSize: 15, marginBottom: 4 }}>{p.title}</h3>
                    <p style={{ fontSize: 12 }}>{p.description.slice(0, 110)}{p.description.length > 110 ? "…" : ""}</p>
                    <p style={{ fontSize: 11, marginTop: 4, color: "var(--dim)" }}>
                      {new Date(p.savedAt).toLocaleDateString()}
                      {p.legacy ? " · from your older saves" : ""}
                    </p>
                  </div>
                  <div className="actions" style={{ flexShrink: 0 }}>
                    <button className="btn btn-ghost btn-small" onClick={() => openSaved(p)}>Open</button>
                    <button className="btn btn-ghost btn-small" onClick={() => setSaved(deletePlan(p.id))}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    );
  }

  /* ── RESULT ── */
  if (stage === "result" && plan) {
    const decided = plan.assumptions;
    return (
      <main>
        <div className="page">
          <div className="topbar">
            <span className="topbar-title">🥊 Your plan</span>
            <button className="btn btn-ghost btn-small" onClick={startOver}>Start over</button>
          </div>

          <div className="stack">
            <UnderstoodCard i={plan} />

            {decided.length > 0 && (
              <div className="card">
                <div className="plan-label">What I decided</div>
                <p className="field-help" style={{ marginBottom: 10 }}>
                  Safe calls so you could keep moving. Wrong ones are worth fixing.
                </p>
                <ul className="plan-list">
                  {decided.map((a, n) => <li key={n}>{a}</li>)}
                </ul>
              </div>
            )}

            <div className="card">
              <div className="plan-label">What version one does</div>
              <ul className="plan-list">
                {plan.versionOne.map((c, n) => (
                  <li key={n}>
                    {c.value}
                    {c.confidence !== "stated" && <span className="tag">my call</span>}
                  </li>
                ))}
              </ul>
            </div>

            {(plan.assets.length > 0 || plan.preserve.length > 0) && (
              <div className="row2">
                {plan.assets.length > 0 && (
                  <div className="card">
                    <div className="plan-label">What it already has</div>
                    <ul className="plan-list">
                      {plan.assets.map((c, n) => <li key={n}>{c.value}</li>)}
                    </ul>
                  </div>
                )}
                {plan.preserve.length > 0 && (
                  <div className="card">
                    <div className="plan-label">Don&apos;t break</div>
                    <ul className="plan-list">
                      {plan.preserve.map((p, n) => <li key={n}>{p}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {plan.exclusions.length > 0 && (
              <div className="card">
                <div className="plan-label" style={{ color: "var(--muted)" }}>Not in version one</div>
                <ul className="plan-list">
                  {plan.exclusions.map((c, n) => <li key={n}>{c.value}</li>)}
                </ul>
              </div>
            )}

            {plan.desiredResult && (
              <div className="card">
                <div className="plan-label">Ready when</div>
                <p className="plan-value" style={{ fontSize: 14 }}>{plan.desiredResult.value}</p>
              </div>
            )}

            <div className="next-action">
              <div className="plan-label">Next</div>
              <p className="plan-value" style={{ fontSize: 14 }}>{plan.completionAction}</p>
            </div>

            {/* The builder prompt is the handoff. Everything else is convenience. */}
            <div className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
                <div className="plan-label" style={{ margin: 0 }}>Your builder prompt</div>
                <CopyButton text={builderPrompt} label="Copy builder prompt" big />
              </div>
              <pre className="prompt-box">{builderPrompt}</pre>
              <div className="actions" style={{ marginTop: 14 }}>
                <a href="https://claude.ai" target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-small">Open Claude →</a>
                <a href="https://chatgpt.com" target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-small">Open ChatGPT →</a>
              </div>
            </div>

            {engine && (
              <a href={engine.route} className="door-card" onClick={() => engine.seed()}>
                <span className="door-emoji" aria-hidden="true">→</span>
                <div>
                  <h3>Continue in {engine.name}</h3>
                  <p>{engine.why} Your plan comes with you.</p>
                </div>
                <span className="door-go" aria-hidden="true">→</span>
              </a>
            )}

            <div className="actions">
              <button className="btn btn-primary" onClick={() => go("shape")}>Fix this plan</button>
              <button className="btn btn-ghost btn-small" onClick={handleSave}>Save it</button>
              {saved.length > 0 && (
                <button className="btn btn-ghost btn-small" onClick={() => go("saved")}>Your corner</button>
              )}
            </div>
            <span role="status" aria-live="polite" className="tiny">{flash}</span>

            <div className="divider" />

            {/* Open Mirror's current closing stanza — 5-7-5. */}
            <p className="tiny" style={{ textAlign: "center" }}>
              <span style={{ display: "block", whiteSpace: "nowrap" }}>Build what feels alive</span>
              <span style={{ display: "block", whiteSpace: "nowrap" }}>Keep it useful, keep it fun</span>
              <span style={{ display: "block", whiteSpace: "nowrap" }}>Then see where it goes</span>
              <a href="https://openmirrorllc.com/contact" style={{ display: "inline-block", marginTop: 10, color: "var(--gold)", fontWeight: 800, textDecoration: "none" }}>
                Contact Open Mirror →
              </a>
            </p>
          </div>
        </div>
      </main>
    );
  }

  return null;
}
