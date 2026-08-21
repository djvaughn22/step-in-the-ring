"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { interpret, type PlannerInput } from "./planner/interpret";
import { buildBuilderPrompt } from "./planner/builder-prompt";
import { recommendEngine } from "./planner/handoff";
import Link from "next/link";
import CreationEntry from "./vnext/CreationEntry";
import SteppedIn from "./vnext/SteppedIn";
import ContinueStrip from "./vnext/ContinueStrip";
import { shapingFromView } from "./vnext/shape";
import { saveDraft } from "./vnext/draft";
import { deletePlan, loadPlans, savePlan, type SavedPlan } from "./planner/storage";
import { BUILD_TYPE_LABEL, type Interpretation } from "./planner/types";
import { adapterForType } from "./creation/adapters";
import { track } from "./lib/analytics";
import {
  loadBuilderDefaults, saveBuilderDefaults, type BuilderDefaults,
} from "./creation/builder-defaults";
import { downloadBuildPack, downloadCreationJson } from "./creation/build-pack";
import { readHandoffFromSearch } from "./creation/handoff";
import {
  loadCurrentCreation, newRecord, saveCurrentCreation, viewOf, type CreationView,
} from "./creation/record";
import { recommendEngines } from "./creation/recommend";
import { projectFromCreation } from "./project/from-creation";
import { saveProjectRecord } from "./project/store";
import { ECOSYSTEM } from "./site/registry";
import {
  CREATION_TYPE_LABEL, SOFTWARE_VERDICT_LABEL, type HandoffPayloadV1,
} from "./creation/types";

type Stage = "landing" | "stepped" | "result" | "saved";

/* Starters — outcome-first ways in. Each one drops an editable stem into the
   box: the person finishes the sentence in their own words, and the reading
   flows from what they actually typed. No hidden category state. */
const STARTERS: { emoji: string; label: string; stem: string }[] = [
  { emoji: "🛠️", label: "Build something", stem: "A website that " },
  { emoji: "🎮", label: "Make a game", stem: "A game where " },
  { emoji: "🎨", label: "Design something", stem: "A design for " },
  { emoji: "🎵", label: "Create music", stem: "A song about " },
  { emoji: "✍️", label: "Write something", stem: "A short story about " },
  { emoji: "🏈", label: "Coach a team", stem: "A football practice plan for " },
  { emoji: "🔧", label: "Fix something", stem: "Something broke: " },
  { emoji: "💼", label: "Start a business", stem: "A service where I " },
];


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
function UnderstoodCard({ i, view }: { i: Interpretation; view?: CreationView | null }) {
  return (
    <div className="card card-gold">
      <div className="plan-label">What I think you&apos;re making</div>
      <h2 style={{ marginBottom: 10 }}>{i.title.value}</h2>
      <p style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", lineHeight: 1.6 }}>{i.summary}</p>
      <div className="pill-row">
        <span className="pill">{BUILD_TYPE_LABEL[i.buildType.value]}</span>
        {view && <span className="pill">{CREATION_TYPE_LABEL[view.creationType]}</span>}
        {i.destination && <span className="pill">Lands on {i.destination.value}</span>}
        {/* Lowercase the first letter only — blanket toLowerCase() turns
            OpenDoku into "opendoku" and mangles every product name. */}
        {(view?.primaryUser || i.audience) && (
          <span className="pill">
            For {(view?.primaryUser ?? i.audience!.value).charAt(0).toLowerCase() + (view?.primaryUser ?? i.audience!.value).slice(1)}
          </span>
        )}
      </div>
      {view && (
        <div style={{ marginTop: 12, fontSize: 13.5, color: "var(--muted)", lineHeight: 1.6 }}>
          <p style={{ margin: 0 }}>
            <b style={{ color: "var(--text)" }}>The real result:</b>{" "}
            {view.smallestOutcome}
          </p>
          <p style={{ margin: "6px 0 0" }}>
            <b style={{ color: "var(--text)" }}>{SOFTWARE_VERDICT_LABEL[view.software.verdict]}.</b>{" "}
            {view.software.reason}
            {view.software.nonSoftwareTest && (
              <> <span style={{ color: "var(--text)" }}>Cheapest first test:</span> {view.software.nonSoftwareTest}</>
            )}
          </p>
          {view.record.source === "idontcry" && (
            <p style={{ margin: "6px 0 0" }}>
              Carried over from iDontCry — your original words came with it.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/** Builder Defaults — how far the builder goes, saved on this device. */
function BuilderDefaultsPanel({ value, onChange }: { value: BuilderDefaults; onChange: (d: BuilderDefaults) => void }) {
  const set = (patch: Partial<BuilderDefaults>) => {
    const next = { ...value, ...patch };
    saveBuilderDefaults(next);
    onChange(next);
  };
  const selStyle: React.CSSProperties = {
    width: "100%", boxSizing: "border-box", background: "var(--surface)",
    border: "1px solid var(--line2)", borderRadius: 10, color: "var(--text)",
    padding: "9px 10px", fontSize: 14, fontFamily: "inherit",
  };
  return (
    <details className="card">
      <summary style={{ cursor: "pointer", fontSize: 13, fontWeight: 900, color: "var(--gold)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
        Builder defaults — how your prompts run
      </summary>
      <p className="field-help" style={{ margin: "10px 0 12px" }}>
        Baked into every generated prompt. Saved on this device only — no account, no names.
      </p>
      <div className="row2">
        <div>
          <label htmlFor="bd-work" style={{ display: "block", fontSize: 13, fontWeight: 800, marginBottom: 4 }}>Where the work lands</label>
          <select id="bd-work" style={selStyle} value={value.workMode} onChange={(e) => set({ workMode: e.target.value as BuilderDefaults["workMode"] })}>
            <option value="new-standalone">New standalone build — start clean</option>
            <option value="existing-repo">Existing repository — inspect first</option>
          </select>
        </div>
        <div>
          <label htmlFor="bd-git" style={{ display: "block", fontSize: 13, fontWeight: 800, marginBottom: 4 }}>How far it goes</label>
          <select id="bd-git" style={selStyle} value={value.gitMode} onChange={(e) => set({ gitMode: e.target.value as BuilderDefaults["gitMode"] })}>
            <option value="prototype">Prototype only — no commits</option>
            <option value="build-commit">Build and commit</option>
            <option value="build-commit-push">Build, commit, and push</option>
          </select>
        </div>
      </div>
      <div style={{ marginTop: 10 }}>
        <label htmlFor="bd-notes" style={{ display: "block", fontSize: 13, fontWeight: 800, marginBottom: 4 }}>
          Anything else every prompt should say (optional)
        </label>
        <textarea
          id="bd-notes"
          rows={2}
          style={{ ...selStyle, resize: "vertical" }}
          value={value.notes}
          onChange={(e) => set({ notes: e.target.value })}
          placeholder="e.g. Tailwind only; keep copy plain and human."
        />
      </div>
    </details>
  );
}

export default function StepInTheRing() {
  const [stage, setStage] = useState<Stage>("landing");
  const [description, setDescription] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState<SavedPlan[]>([]);
  const [flash, setFlash] = useState("");
  const [incoming, setIncoming] = useState<HandoffPayloadV1 | null>(null);
  const [hasLastCreation, setHasLastCreation] = useState(false);
  const [defaults, setDefaults] = useState<BuilderDefaults>(loadBuilderDefaults);
  const shapeRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSaved(loadPlans());
    setHasLastCreation(!!loadCurrentCreation());
    setDefaults(loadBuilderDefaults());
    try {
      // Versioned handoff (?cr=) first — it carries the whole creation.
      // The idea box lives on the landing page now, so a handoff simply
      // prefills it and puts the cursor there — one screen fewer to cross.
      const payload = readHandoffFromSearch(window.location.search);
      if (payload) {
        setIncoming(payload);
        setDescription(payload.idea.slice(0, 2000));
        setTimeout(() => shapeRef.current?.focus(), 0);
        return;
      }
      // Legacy handoff from iDontCry's Dream Lab: ?idea=... still works.
      const idea = new URLSearchParams(window.location.search).get("idea");
      if (idea && idea.trim()) {
        setDescription(idea.trim().slice(0, 600));
        setTimeout(() => shapeRef.current?.focus(), 0);
      }
    } catch {}
  }, []);

  const input: PlannerInput = useMemo(() => ({ description, answers }), [description, answers]);
  const plan = useMemo(
    () => (description.trim() ? interpret(input) : null),
    [input, description],
  );
  /* The creation record — one creation, wherever it started. Edits to the
     description ARE the creator's words, so the record follows them; a
     handoff's structured facts and origin ride along untouched. */
  const record = useMemo(() => {
    if (!description.trim()) return null;
    return newRecord(description, {
      answers,
      ...(incoming
        ? {
            source: "idontcry" as const,
            sourceFlow: incoming.flow,
            originalTitle: incoming.title,
            facts: { ...(incoming.facts ?? {}), ...(incoming.typeHint ? { typeHint: incoming.typeHint } : {}) },
            exclusions: incoming.exclusions ?? [],
          }
        : {}),
    });
  }, [description, answers, incoming]);
  // `plan` already interpreted these exact words — reuse it, don't recompute.
  const view = useMemo(() => (record ? viewOf(record, plan ?? undefined) : null), [record, plan]);
  /* The shaping IS the step-in moment. It reuses the view this page already
     computed — one reading of their words, shown two ways. */
  const shaping = useMemo(() => (view ? shapingFromView(view) : null), [view]);
  const engine = useMemo(() => (plan ? recommendEngine(plan) : null), [plan]);
  const engineRec = useMemo(() => (view ? recommendEngines(view) : null), [view]);
  /* Repo-touching work keeps the permission-aware brief (never claims access
     or authority the person didn't give). Standalone creations get their
     creation-type prompt — a game brief for a game, a design brief for a
     design, never a generic app plan for a story. */
  const builderPrompt = useMemo(() => {
    if (!plan) return "";
    const repoWork = !!plan.destination || plan.permissions.build || plan.permissions.commit || plan.permissions.push;
    if (view && !repoWork) return adapterForType(view.creationType).prompt(view, defaults);
    return buildBuilderPrompt(plan);
  }, [plan, view, defaults]);

  // The current creation survives a refresh — resume is one tap.
  useEffect(() => {
    if (stage === "result" && view) saveCurrentCreation(view.record);
  }, [stage, view]);
  useEffect(() => {
    if (stage === "result" && view) track("plan_result_viewed", { type: view.creationType });
    // Once per arrival at the result, not per keystroke of a correction.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  function continueLast() {
    const last = loadCurrentCreation();
    if (!last) return;
    setDescription(last.originalIdea);
    setAnswers(last.answers);
    if (last.source === "idontcry") {
      setIncoming({
        v: 1, source: "idontcry",
        flow: last.sourceFlow === "dream-lab" || last.sourceFlow === "game-lab" || last.sourceFlow === "dream-shop" ? last.sourceFlow : "dream-lab",
        idea: last.originalIdea, title: last.originalTitle,
        facts: last.facts, exclusions: last.exclusions,
      });
    }
    go("result");
  }

  function go(next: Stage) {
    setStage(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleShape(e: FormEvent) {
    e.preventDefault();
    if (!description.trim()) return;
    go("stepped");
  }

  /* Put the idea in flight so the sign-in round trip costs nothing, then let
     the link navigate normally. sessionStorage, this tab — never described to
     anyone as saved work. */
  function keepThisBuild() {
    saveDraft(description, answers);
    track("build_kept_from_step_in", {});
  }

  /* Answering the one question re-reads their words in place — the card above
     it sharpens without a page move. Deterministic, instant, free. */
  function answerQuestion(key: string, answer: string) {
    setAnswers({ ...answers, [key]: answer });
  }

  function skipQuestion(key: string) {
    // Skipping is allowed — we already have a safe assumption for it.
    setAnswers({ ...answers, [key]: "" });
  }

  function startOver() {
    setDescription("");
    setAnswers({});
    setIncoming(null);
    go("landing");
  }

  /** Hand the whole creation record to an engine, then follow the route. */
  function seedEngineWithRecord(engineId: string) {
    if (!view) return;
    try {
      window.localStorage.setItem(
        "sitr-engine-seed",
        JSON.stringify({
          engineId,
          title: view.interpretation.title.value,
          summary: view.interpretation.summary,
          raw: view.record.originalIdea,
          record: view.record,
        }),
      );
    } catch {}
  }

  function handleSave() {
    if (!plan) return;
    setSaved(savePlan(input, plan.title.value));
    setFlash("Saved to your corner.");
    setTimeout(() => setFlash(""), 2500);
  }

  /** Promote the creation to a full project — workspace, gates, evidence. */
  function makeProject() {
    if (!view || !plan) return;
    const project = projectFromCreation(view.record, plan);
    saveProjectRecord(project);
    track("project_created", { adapter: project.adapterId, from: "planner" });
    window.location.href = `/projects?p=${project.projectId}`;
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
          {/* ── THE STAGE. Name on the left, the box on the right. On a laptop
              this fills the screen instead of stacking a phone column down the
              middle of it. ── */}
          <section className="stage">
            <div>
              <a
                href="https://openmirrorllc.com"
                target="_blank"
                rel="noopener noreferrer"
                className="stage-mark"
              >
                Open Mirror LLC
              </a>
              <h1 className="ring-display">
                Make
                <br />
                something
                <br />
                <span className="amber">real.</span>
              </h1>
              <p className="ring-sub" style={{ marginTop: 24 }}>
                You have something in your head. Say it in your own words and
                walk out with the smallest real version of it, plus the next
                move to make on it.
              </p>
            </div>

            <div>
              <CreationEntry
                id="idea-description"
                heading="What do you want to make?"
                help="Messy is fine."
                placeholder="A puzzle game where you pick a photo and drag the pieces back together."
                submitLabel="Step in"
                rows={5}
                value={description}
                onValueChange={setDescription}
                onSubmit={handleShape}
                inputRef={shapeRef}
                starters={STARTERS}
                actions={
                  <>
                    {hasLastCreation && (
                      <button type="button" className="btn btn-ghost" onClick={continueLast}>
                        Pick up the last one
                      </button>
                    )}
                    {saved.length > 0 && (
                      <button type="button" className="btn btn-ghost" onClick={() => go("saved")}>
                        Saved ({saved.length})
                      </button>
                    )}
                  </>
                }
              />
              {/* Somebody who was here yesterday sees their work first. A
                  stranger sees nothing extra and loses nothing. */}
              <ContinueStrip />
            </div>
          </section>

          {/* ── FOUR DOORS ── */}
          <nav className="doors" aria-label="Where to go">
            <Link href="/builds" className="door">
              <span className="door-n">01</span>
              <h2 className="door-t">Keep building</h2>
              <p className="door-d">Open something you already started.</p>
              <span className="door-hint">Your builds</span>
            </Link>
            <Link href="/explore" className="door">
              <span className="door-n">02</span>
              <h2 className="door-t">See what&apos;s real</h2>
              <p className="door-d">Things that actually got made and shipped.</p>
              <span className="door-hint">Explore</span>
            </Link>
            <Link href="/library" className="door">
              <span className="door-n">03</span>
              <h2 className="door-t">Things you can use</h2>
              <p className="door-d">Every tool in here, with an honest label on it.</p>
              <span className="door-hint">Library</span>
            </Link>
            <Link href="/preview" className="door">
              <span className="door-n">04</span>
              <h2 className="door-t">Have a code?</h2>
              <p className="door-d">Open something somebody shared with you.</p>
              <span className="door-hint">Preview</span>
            </Link>
          </nav>

          {/* ── THE LOOP ── */}
          <section className="band">
            <div className="band-head">
              <h2 className="band-title">How it goes</h2>
              <p className="band-note">
                The same five moves every time, whether it&apos;s an app, a song
                or a practice plan.
              </p>
            </div>
            <div className="loop">
              {[
                ["01", "Say it", "In your own words. No form to fill in."],
                ["02", "Shape it", "See what it really is before any plan shows up."],
                ["03", "Make it", "The smallest version that actually works."],
                ["04", "Try it", "Use it yourself. If it doesn't work for you it isn't done."],
                ["05", "Go again", "Fix it, grow it, or start the next one."],
              ].map(([n, t, d]) => (
                <div key={n} className="loop-step">
                  <span className="loop-n">{n}</span>
                  <h3 className="loop-t">{t}</h3>
                  <p className="loop-d">{d}</p>
                </div>
              ))}
            </div>
            <p className="tiny" style={{ marginTop: 16 }}>
              <Link href="/how" style={{ color: "var(--gold)", fontWeight: 800, textDecoration: "none" }}>
                The longer version
              </Link>
            </p>
          </section>

          {/* ── REAL THINGS. The proof is the work, not a testimonial. ── */}
          <section className="band">
            <div className="band-head">
              <h2 className="band-title">Real things</h2>
              <p className="band-note">
                Every one of these is live right now. Open any of them.
              </p>
            </div>
            <div className="tiles">
              {ECOSYSTEM.filter((p) => p.liveUrl).map((p) => (
                <a
                  key={p.name}
                  className="tile"
                  href={p.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={
                    {
                      "--tile-accent": p.accent,
                      "--tile-soft": `${p.accent}1A`,
                    } as React.CSSProperties
                  }
                >
                  <span className="tile-mark" aria-hidden="true">{p.emoji}</span>
                  <h3 className="tile-name">{p.name}</h3>
                  <p className="tile-what">{p.what}</p>
                  <span className="tile-foot">
                    <span className={p.status === "live" ? "dot" : "dot dot-building"} />
                    {p.status === "live" ? "Live" : "Building"}
                    <span className="tile-open">Open</span>
                  </span>
                </a>
              ))}
            </div>
            <p className="tiny" style={{ marginTop: 16 }}>
              <Link href="/everything" style={{ color: "var(--gold)", fontWeight: 800, textDecoration: "none" }}>
                Everything, including the code behind it
              </Link>
            </p>
          </section>

          {/* ── CLOSE ── */}
          <section className="closing">
            <p>Live your dream.</p>
            <a href="#idea-description" className="btn btn-gold btn-big">
              Start something
            </a>
            <p className="tiny" style={{ marginTop: 30, color: "var(--dim)" }}>
              Open beta. Everything here works and is still being corrected, so
              don&apos;t trust it yet with anything irreplaceable. Kids should
              build with a parent.{" "}
              <a href="/account#feedback" style={{ color: "var(--muted)", fontWeight: 800 }}>
                Tell us what broke
              </a>
              .
            </p>
          </section>
        </div>
      </main>
    );
  }

  /* ── STEPPED IN — the moment after they said it. Deterministic, instant. ── */
  if (stage === "stepped" && shaping) {
    return (
      <main>
        <div className="page">
          <SteppedIn
            intent={description.trim()}
            shaping={shaping}
            onAnswer={answerQuestion}
            onSkip={skipQuestion}
            onChangeWords={() => go("landing")}
            onSeeWholePlan={() => go("result")}
            onKeep={keepThisBuild}
            keepHref="/builds"
          />
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
              <button className="btn btn-gold" onClick={() => go("landing")}>Start a creation</button>
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
            <UnderstoodCard i={plan} view={view} />

            {/* BRING IT → the persistent object. The plan below is yours
                either way; this is what makes it survive this browser. */}
            <div className="card">
              <div className="plan-label">Keep going with this</div>
              <p style={{ fontSize: 14.5, color: "var(--text)", margin: "0 0 12px" }}>
                Save it as a build and it&apos;s on your account — still here tomorrow, on
                any device, with the next move on it.
              </p>
              <div className="actions">
                <a
                  className="btn btn-gold"
                  href={`/builds?intent=${encodeURIComponent(description.trim().slice(0, 2000))}`}
                >
                  Make it a build →
                </a>
              </div>
            </div>

            {plan.versionOne.length > 0 && (
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
            )}

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

            {/* Their own words about what "done" means — inferences already
                live on the understood card as "the real result". */}
            {plan.desiredResult && plan.desiredResult.confidence === "stated" && (
              <div className="card">
                <div className="plan-label">Ready when</div>
                <p className="plan-value" style={{ fontSize: 14 }}>{plan.desiredResult.value}</p>
              </div>
            )}

            {/* Tools and setup, honestly — what to use, what's manual once,
                what turns automatic, what deliberately waits. */}
            {view && (
              <div className="card">
                <div className="plan-label">The tools this needs</div>
                <p className="plan-value" style={{ fontSize: 14.5 }}>{view.tools.stack}</p>
                <p className="field-help" style={{ margin: "4px 0 0" }}>{view.tools.why}</p>
                {view.tools.noSetup.length > 0 && (
                  <p style={{ fontSize: 13.5, color: "var(--muted)", margin: "10px 0 0", lineHeight: 1.55 }}>
                    <b style={{ color: "var(--text)" }}>No setup needed:</b> {view.tools.noSetup.join(" ")}
                  </p>
                )}
                {view.tools.setup.length > 0 && (
                  <>
                    <p className="tools-sub">You set up once</p>
                    <ul className="plan-list">
                      {view.tools.setup.map((s, n) => <li key={n}>{s}</li>)}
                    </ul>
                  </>
                )}
                {view.tools.automatic.length > 0 && (
                  <>
                    <p className="tools-sub">Automatic after that</p>
                    <ul className="plan-list">
                      {view.tools.automatic.map((s, n) => <li key={n}>{s}</li>)}
                    </ul>
                  </>
                )}
                {view.tools.optional.length > 0 && (
                  <>
                    <p className="tools-sub">Optional — know the cost first</p>
                    <ul className="plan-list">
                      {view.tools.optional.map((s, n) => <li key={n}>{s}</li>)}
                    </ul>
                  </>
                )}
                {view.tools.wait.length > 0 && (
                  <>
                    <p className="tools-sub">You don&apos;t need yet</p>
                    <ul className="plan-list">
                      {view.tools.wait.map((s, n) => <li key={n}>{s}</li>)}
                    </ul>
                  </>
                )}
              </div>
            )}

            {decided.length > 0 && (
              <details className="card">
                <summary className="plan-label" style={{ marginBottom: 0 }}>
                  Calls I made for you ({decided.length}) — open to check them
                </summary>
                <p className="field-help" style={{ margin: "8px 0 10px" }}>
                  Safe assumptions so you could keep moving. Wrong ones are worth fixing.
                </p>
                <ul className="plan-list">
                  {decided.map((a, n) => <li key={n}>{a}</li>)}
                </ul>
              </details>
            )}

            {/* ONE next step — an engine door, or the prompt path, never both. */}
            {engineRec && (
              <div className="next-action">
                <div className="plan-label">Next step</div>
                {engineRec.primary ? (
                  <a
                    href={engineRec.primary.route}
                    className="door-card"
                    style={{ marginBottom: engineRec.alternates.length ? 10 : 0 }}
                    onClick={() => {
                      if (engine && engine.engineId === engineRec.primary!.engineId) engine.seed();
                      else seedEngineWithRecord(engineRec.primary!.engineId);
                    }}
                  >
                    <span className="door-emoji" aria-hidden="true">→</span>
                    <div>
                      <h3>Continue in {engineRec.primary.name}</h3>
                      <p>{engineRec.primary.why} Your creation comes with you — nothing gets retyped.</p>
                    </div>
                    <span className="door-go" aria-hidden="true">→</span>
                  </a>
                ) : (
                  <>
                    <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.6, margin: 0 }}>
                      {engineRec.promptPathWhy}
                    </p>
                    <p className="plan-value" style={{ fontSize: 14, marginTop: 8 }}>{plan.completionAction}</p>
                  </>
                )}
                {engineRec.alternates.length > 0 && (
                  <div style={{ marginTop: 10 }}>
                    {engineRec.alternates.map((alt) => (
                      <a
                        key={alt.engineId}
                        href={alt.route}
                        onClick={() => seedEngineWithRecord(alt.engineId)}
                        style={{ display: "block", fontSize: 13.5, color: "var(--muted)", textDecoration: "none", lineHeight: 1.6, marginTop: 4 }}
                      >
                        <b style={{ color: "var(--gold)" }}>or {alt.name} →</b> {alt.why}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* The builder prompt is the handoff. One card holds it and the
                two files that carry it — nothing else competes with it. */}
            <div className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
                <div className="plan-label" style={{ margin: 0 }}>Your builder prompt</div>
                <CopyButton text={builderPrompt} label="Copy builder prompt" big />
              </div>
              <pre className="prompt-box">{builderPrompt}</pre>
              <p className="field-help" style={{ marginTop: 12, marginBottom: 0 }}>
                Copy it into the building tool you already use, and start.
              </p>
              {view && (
                <div style={{ borderTop: "1px solid var(--line)", marginTop: 14, paddingTop: 14 }}>
                  <p className="field-help" style={{ marginBottom: 10 }}>
                    Or take the whole creation with you — the readable brief, and the record you can
                    bring back later.
                  </p>
                  <div className="actions">
                    <button
                      className="btn btn-ghost btn-small"
                      onClick={() => downloadBuildPack(view, builderPrompt)}
                    >
                      Download brief (.md)
                    </button>
                    <button
                      className="btn btn-ghost btn-small"
                      onClick={() => downloadCreationJson(view)}
                    >
                      Download record (.json)
                    </button>
                    <button className="btn btn-ghost btn-small" onClick={makeProject}>
                      Make it a project
                    </button>
                  </div>
                </div>
              )}
            </div>

            <BuilderDefaultsPanel value={defaults} onChange={setDefaults} />

            <div className="actions">
              <button className="btn btn-primary" onClick={() => go("landing")}>Fix this plan</button>
              <button className="btn btn-ghost btn-small" onClick={handleSave}>Save it</button>
              {saved.length > 0 && (
                <button className="btn btn-ghost btn-small" onClick={() => go("saved")}>Your corner</button>
              )}
            </div>
            <span role="status" aria-live="polite" className="tiny">{flash}</span>

            <div className="divider" />

            {/* Mission haikus live on the hub About page only — no stanza here. */}
            <p className="tiny" style={{ textAlign: "center" }}>
              <a href="https://openmirrorllc.com/contact" style={{ display: "inline-block", color: "var(--gold)", fontWeight: 800, textDecoration: "none" }}>
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
