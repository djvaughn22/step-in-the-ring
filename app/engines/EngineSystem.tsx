"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ACTIVATION_LABEL, DEPTH_LABELS, DESTINATION_LABELS, ENGINES, getEngine, STAGES,
  type BuildStage, type Depth, type Destination, type Engine,
} from "./engines";
import { generatePackage, packageToText } from "./generator";
import {
  analyzeReturn, PATH_BLURB, PATH_LABELS, REVIEW_QUESTIONS, type ReviewInput,
} from "./review";
import {
  deleteProject, duplicateProject, exportProject, importProject, loadProjects,
  newProject, uid, upsertProject, type Cycle, type NextPath, type Project,
} from "./store";
import DesignShopStudio from "./design-shop/DesignShopStudio";
import GameStudio from "./games/GameStudio";
import IdeaStudio from "./idea/IdeaStudio";
import OnboardingFlow from "./shared/OnboardingFlow";
import { MUSIC_ENGINE } from "./music/music.engine";
import { track } from "../lib/analytics";
import { adapterFor } from "../creation/adapters";
import { loadBuilderDefaults } from "../creation/builder-defaults";
import { downloadBuildPack, downloadCreationJson } from "../creation/build-pack";
import { handoffToIntake, readHandoffFromSearch, recordToIntake } from "../creation/handoff";
import { recordFromEngineIntake, viewOf } from "../creation/record";
import { parseCreationRecord } from "../creation/types";

type View = "list" | "picker" | "intake" | "review" | "edit" | "cycle" | "return";
const REQUEST_MAILTO = (subject: string, body: string) =>
  `mailto:ask@openmirrorllc.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

const PATH_ENGINE: Record<NextPath, string> = { fix: "fix", refine: "", expand: "", launch: "launch" };

/* Grouped by whether the engine actually works for the person reading this —
   verified by running each one, not by what the registry used to claim. */
const VISIBLE = ENGINES.filter((e) => !e.hidden);
const READY_ENGINES = VISIBLE.filter((e) => e.activation === "working" || e.activation === "beta");
const OWNER_ENGINES = VISIBLE.filter((e) => e.activation === "owner-only");

/* Concepts in creation-engine.registry.ts with launched:false — no intake, no
   studio, no route. Named honestly; deliberately not clickable. */
const PLANNED = [
  { emoji: "📖", name: "Story Engine", what: "premise to a full draft" },
  { emoji: "👗", name: "Fashion Engine", what: "design to a tech-pack" },
];

type PlannerSeed = {
  engineId?: string;
  title?: string;
  summary?: string;
  raw?: string;
  /** The full creation record, when the planner handed one over. */
  record?: unknown;
};

/**
 * Read the handed-over plan exactly once per page load, and remember it.
 *
 * This MUST be idempotent: it's called from an effect, and React re-invokes
 * effects in development. Removing the key on the first call and returning
 * nothing on the second wiped the prefill right back out — the plan arrived
 * and vanished. Cache the answer instead of re-reading storage.
 */
let seedCache: PlannerSeed | null | undefined;

function readPlannerSeed(): PlannerSeed | null {
  if (seedCache !== undefined) return seedCache;
  try {
    const raw = window.localStorage.getItem("sitr-engine-seed");
    // Consume it now so a later unrelated visit doesn't refill the form.
    if (raw) window.localStorage.removeItem("sitr-engine-seed");
    seedCache = raw ? (JSON.parse(raw) as PlannerSeed) : null;
  } catch {
    seedCache = null;
  }
  return seedCache;
}

/**
 * A plan handed over from the planner (/) arrives here. Never make someone
 * retype what they already told us — carry it into the engine's own questions.
 */
function consumePlannerSeed(e: Engine): Record<string, string> {
  try {
    const seed = readPlannerSeed();
    if (!seed || seed.engineId !== e.id) return {};

    // A full creation record maps into this engine's own intake keys — the
    // person never retypes what the planner already knows.
    const record = seed.record ? parseCreationRecord(seed.record) : null;
    if (record) {
      const prefill = recordToIntake(e.id, record);
      if (e.id === "idea") prefill.seed = record.originalIdea;
      return prefill;
    }

    const prefill: Record<string, string> = {};
    if (seed.title) prefill.name = seed.title;
    const idea = seed.raw || seed.summary || "";
    // The first free-text question is where the idea itself belongs.
    const firstProse = e.intake.find((q) => q.type === "textarea");
    if (firstProse) prefill[firstProse.key] = idea;
    // The studios keep their own field names; IdeaStudio reads `seed`.
    if (e.id === "idea") prefill.seed = idea;
    return prefill;
  } catch {
    return {};
  }
}

function EngineCard({
  engine, projects, onStart, onResume,
}: {
  engine: Engine;
  projects: Project[];
  onStart: (id: string) => void;
  onResume: (project: Project) => void;
}) {
  const saved = projects.filter((p) => p.engineId === engine.id && !p.archived);
  const resumable = saved[0];
  const status = engine.activation ?? "beta";
  const owner = status === "owner-only";

  return (
    <div className={`engine-card${owner ? " engine-card-quiet" : ""}`}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 24 }} aria-hidden="true">{engine.emoji}</span>
        <span className={`status-pill status-${status}`}>{ACTIVATION_LABEL[status]}</span>
      </div>
      <h3 className="engine-name">{engine.name}</h3>
      <p className="engine-line">{engine.tagline}</p>
      {engine.output && (
        <p className="engine-out"><span>You finish with:</span> {engine.output}</p>
      )}
      {engine.statusNote && <p className="engine-note">{engine.statusNote}</p>}
      <div className="engine-foot">
        {resumable ? (
          <>
            <button className="btn btn-gold btn-small" onClick={() => onResume(resumable)}>Resume</button>
            <button className="btn btn-ghost btn-small" onClick={() => onStart(engine.id)}>Start new</button>
            <span className="engine-saved">{saved.length} saved</span>
          </>
        ) : (
          <button className={`btn btn-small ${owner ? "btn-ghost" : "btn-gold"}`} onClick={() => onStart(engine.id)}>
            {owner ? "Open anyway" : "Start"}
          </button>
        )}
      </div>
    </div>
  );
}

function Section({ title, body }: { title: string; body: string }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 13, fontWeight: 900, color: "var(--gold)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>{title}</div>
      <pre style={{ whiteSpace: "pre-wrap", fontFamily: "inherit", fontSize: 14, color: "var(--muted)", lineHeight: 1.6, margin: 0 }}>{body}</pre>
    </div>
  );
}

export default function EngineSystem() {
  const [ready, setReady] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [view, setView] = useState<View>("list");

  // draft (new / next cycle)
  const [engineId, setEngineId] = useState<string>("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [stage, setStage] = useState<BuildStage>("Building");
  const [depth, setDepth] = useState<Depth>("full");
  const [destination, setDestination] = useState<Destination>("claude-code");
  const [objectiveEdit, setObjectiveEdit] = useState("");

  const [activeProjectId, setActiveProjectId] = useState<string>("");
  const [activeCycleId, setActiveCycleId] = useState<string>("");
  const [tab, setTab] = useState("overview");
  const [flash, setFlash] = useState("");

  // return flow
  const [review, setReview] = useState<ReviewInput>({ completed: true, correctLive: true, broke: "", wrong: "", deferred: "", readyForPublic: false, raw: "" });

  // edit screen (Pass 2)
  const [specialtyEdits, setSpecialtyEdits] = useState<Record<string, string>>({});

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setProjects(loadProjects()); setReady(true); }, []);

  // Deep link: /engines?engine=game opens that engine's intake directly
  // (how iDontCry's Game Lab jumps straight into the Game Engine). A `cr`
  // payload riding on the same URL is iDontCry's versioned handoff — it
  // prefills the intake, and the access gate never touches the URL, so the
  // creation survives the gate and resumes exactly here after unlock.
  useEffect(() => {
    const wanted = new URLSearchParams(window.location.search).get("engine");
    const e = wanted ? getEngine(wanted) : undefined;
    if (e && !e.hidden) {
      const handoff = readHandoffFromSearch(window.location.search);
      const prefill = handoff
        ? { ...handoffToIntake(e.id, handoff), ...consumePlannerSeed(e) }
        : consumePlannerSeed(e);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEngineId(e.id);
      setAnswers(prefill);
      setStage(e.suggestedStage);
      setDestination(e.technical ? "claude-code" : "self");
      setView("intake");
    }
  }, []);
  const engine = getEngine(engineId);
  const activeProject = projects.find((p) => p.id === activeProjectId) || null;
  const activeCycle = activeProject?.cycles.find((c) => c.id === activeCycleId) || null;

  const say = (m: string) => { setFlash(m); setTimeout(() => setFlash(""), 2400); };
  const copy = async (text: string, label: string) => {
    try { await navigator.clipboard.writeText(text); say(`${label} copied`); }
    catch { say("Couldn't reach your clipboard — select the text and copy it by hand."); }
  };

  // ---- draft package preview ----
  // Only the review and edit screens read this. Building it during intake
  // would re-run the whole interpreter on every keystroke.
  const previewPackage = useMemo(() => {
    if (!engine || (view !== "review" && view !== "edit")) return null;
    return generatePackage(engine, answers, stage, depth, destination);
  }, [engine, answers, stage, depth, destination, view]);

  const startNew = () => { setEngineId(""); setAnswers({}); setActiveProjectId(""); setView("picker"); };

  const pickEngine = (id: string) => {
    const e = getEngine(id); if (!e) return;
    track("engine_start", { engine: id });
    setEngineId(id); setAnswers({}); setStage(e.suggestedStage);
    setDestination(e.technical ? "claude-code" : e.id === "plan" || e.id === "grow" || e.id === "sell" || e.id === "idea" ? "chatgpt" : "self");
    setView("intake");
  };

  const toReview = () => {
    if (!engine) return;
    const pkg = generatePackage(engine, answers, stage, depth, destination);
    setObjectiveEdit(pkg.objective);
    setSpecialtyEdits(pkg.specialties ?? {});
    setView("review");
  };

  const toEdit = () => {
    if (!engine) return;
    const pkg = generatePackage(engine, answers, stage, depth, destination);
    setObjectiveEdit(pkg.objective);
    setSpecialtyEdits(pkg.specialties ?? {});
    setView("edit");
  };

  const generate = () => {
    if (!engine) return;
    track("engine_output", { engine: engine.id });
    const pkg = generatePackage(engine, answers, stage, depth, destination);
    if (objectiveEdit.trim()) pkg.objective = objectiveEdit.trim();
    if (Object.keys(specialtyEdits).length > 0) {
      pkg.specialties = { ...pkg.specialties, ...specialtyEdits };
    }
    const cycle: Cycle = {
      id: uid(), index: 0, objective: pkg.objective, stage, destination, depth, pkg, status: "drafted", createdAt: new Date().toISOString(),
    };
    let project = activeProject;
    if (project) {
      cycle.index = project.cycles.length;
      project = { ...project, cycles: [...project.cycles, cycle], stage };
    } else {
      project = newProject(answers.name || engine.name, engine.id, stage, answers);
      cycle.index = 0;
      project.cycles = [cycle];
    }
    const next = upsertProject(project);
    setProjects(next);
    setActiveProjectId(project.id);
    setActiveCycleId(cycle.id);
    setTab("overview");
    setView("cycle");
  };

  const openProject = (p: Project) => {
    setActiveProjectId(p.id);
    const last = p.cycles[p.cycles.length - 1];
    if (last) { setActiveCycleId(last.id); setEngineId(p.engineId); setAnswers(p.answers); setStage(p.stage); setTab("overview"); setView("cycle"); }
  };

  const updateCycle = (patch: Partial<Cycle>) => {
    if (!activeProject || !activeCycle) return;
    const cycles = activeProject.cycles.map((c) => (c.id === activeCycle.id ? { ...c, ...patch } : c));
    const next = upsertProject({ ...activeProject, cycles });
    setProjects(next);
  };

  const submitReturn = () => {
    if (!activeCycle) return;
    const { recommendation, notes } = analyzeReturn(review);
    updateCycle({ status: "reviewed", ret: { raw: review.raw, completed: review.completed, worked: review.wrong ? "" : "yes", broke: review.broke, deferred: review.deferred, reviewedAt: new Date().toISOString(), recommendation, reviewNotes: notes.join(" ") } });
    setView("cycle"); setTab("next");
  };

  const generateNextCycle = (path: NextPath) => {
    if (!activeProject) return;
    track("engine_cycle", { engine: activeProject.engineId, path });
    const mapped = PATH_ENGINE[path] || activeProject.engineId;
    const e = getEngine(mapped) || engine!;
    setEngineId(e.id);
    // carry answers forward; add a note about the path
    const carried = { ...activeProject.answers, name: activeProject.name };
    setAnswers(carried);
    const nextStage: BuildStage = path === "launch" ? "Launching" : path === "fix" ? "Repairing" : path === "expand" ? "Building" : "Polishing";
    setStage(nextStage);
    setDepth(path === "launch" ? "deep" : "full");
    setDestination(e.technical ? "claude-code" : "chatgpt");
    setObjectiveEdit(`${PATH_LABELS[path]} cycle: ${PATH_BLURB[path]}`);
    setView("review");
  };

  // ---- render helpers ----
  const card = { background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 16, padding: 18 } as const;
  const input = { width: "100%", boxSizing: "border-box" as const, background: "var(--surface)", border: "1px solid var(--line2)", borderRadius: 10, color: "var(--text)", padding: "11px 12px", fontSize: 15, fontFamily: "inherit" };

  if (!ready) return <div className="page"><div style={{ height: 200 }} /></div>;

  // Design Shop Engine uses a specialized UI
  if (engineId === "design-shop" && view === "intake") {
    return (
      <DesignShopStudio
        onBack={() => {
          setEngineId("");
          setAnswers({});
          setView("list");
        }}
        initialAnswers={Object.keys(answers).length > 0 ? answers : undefined}
        card={card}
        Section={Section}
      />
    );
  }

  // Game Engine: platform mode → template → world → live preview → real publish
  if (engineId === "game" && view === "intake") {
    return (
      <GameStudio
        onBack={() => {
          setEngineId("");
          setAnswers({});
          setView("list");
        }}
        card={card}
      />
    );
  }

  // Idea Engine: compare → pick → decision record → handoff into the next engine
  if (engineId === "idea" && view === "intake") {
    return (
      <IdeaStudio
        onBack={() => {
          setEngineId("");
          setAnswers({});
          setView("list");
        }}
        initialAnswers={Object.keys(answers).length > 0 ? answers : undefined}
        onHandoff={(nextEngineId, prefilled) => {
          const target = getEngine(nextEngineId);
          if (!target) return;
          setActiveProjectId("");
          setEngineId(nextEngineId);
          setAnswers(prefilled);
          setStage(target.suggestedStage);
          setDestination(target.technical ? "claude-code" : "chatgpt");
          setView("intake");
        }}
        card={card}
      />
    );
  }

  // Music Engine uses the shared 1-2-3 onboarding flow
  if (engineId === "music" && view === "intake") {
    return (
      <OnboardingFlow
        engine={MUSIC_ENGINE}
        onBack={() => {
          setEngineId("");
          setAnswers({});
          setView("list");
        }}
      />
    );
  }

  return (
    <main>
      <div className="page">
        <header style={{ textAlign: "center", marginBottom: 24 }}>
          <a href="https://stepinthering.com" className="kicker" style={{ textDecoration: "none" }}>Step In The Ring</a>
          <h1 style={{ fontSize: "clamp(1.9rem,8vw,2.6rem)", fontWeight: 900, color: "var(--text)", margin: "6px 0 8px", lineHeight: 1.05 }}>
            Engine <span style={{ color: "var(--gold)" }}>Room</span>
          </h1>
          <p className="hero-sub" style={{ maxWidth: 460, margin: "0 auto" }}>
            Pick an engine, answer a few real questions, and leave with a package you can act on today.
          </p>
          {/* Always mounted so screen readers hear the announcement, not just see it. */}
          <p role="status" aria-live="polite" style={{ color: "var(--gold)", fontWeight: 800, marginTop: 8, minHeight: 20, margin: "8px 0 0" }}>{flash}</p>
        </header>

        {/* ---------- LIST ---------- */}
        {view === "list" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span className="kicker" style={{ margin: 0 }}>Your projects</span>
              <button onClick={startNew} className="btn btn-gold">+ New project</button>
            </div>
            {projects.filter((p) => !p.archived).length === 0 ? (
              <div style={{ ...card, textAlign: "center" }}>
                <p style={{ color: "var(--text)", fontWeight: 800 }}>No projects yet.</p>
                <p style={{ color: "var(--muted)", fontSize: 14, margin: "6px 0 14px" }}>Start with an engine and your real situation.</p>
                <button onClick={startNew} className="btn btn-gold">Choose an engine →</button>
                <div style={{ marginTop: 14 }}>
                  <label className="btn btn-ghost btn-small" style={{ cursor: "pointer" }}>
                    Import project
                    <input type="file" accept="application/json" hidden onChange={(ev) => {
                      const f = ev.target.files?.[0]; if (!f) return;
                      f.text().then((t) => { const p = importProject(t); if (p) { setProjects(upsertProject(p)); say("Imported"); } else say("Invalid file"); });
                    }} />
                  </label>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {projects.filter((p) => !p.archived).map((p) => {
                  const e = getEngine(p.engineId);
                  const last = p.cycles[p.cycles.length - 1];
                  return (
                    <div key={p.id} style={{ ...card, borderLeft: "4px solid var(--gold)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                        <div style={{ minWidth: 0 }}>
                          <p style={{ fontSize: 17, fontWeight: 900, color: "var(--text)", margin: 0 }}>{e?.emoji} {p.name}</p>
                          <p style={{ fontSize: 13, color: "var(--muted)", margin: "2px 0 0" }}>{e?.name} · {p.stage} · {p.cycles.length} cycle{p.cycles.length !== 1 ? "s" : ""}{last ? ` · last: ${last.status}` : ""}</p>
                        </div>
                        {/* Shrinkable so the row wraps inside a 320px phone
                            instead of pushing the card past the edge. */}
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", minWidth: 0 }}>
                          <button onClick={() => openProject(p)} className="btn btn-gold btn-small">Open</button>
                          <button onClick={() => { setProjects(duplicateProject(p.id)); say("Duplicated"); }} className="btn btn-ghost btn-small">Copy</button>
                          <button onClick={() => copy(exportProject(p), "Project JSON")} className="btn btn-ghost btn-small">Export</button>
                          <button onClick={() => { if (confirm(`Delete "${p.name}"?`)) { setProjects(deleteProject(p.id)); say("Deleted"); } }} className="btn btn-ghost btn-small">Delete</button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ---------- PICKER ---------- */}
        {view === "picker" && (
          <>
            <button onClick={() => setView("list")} className="btn btn-ghost btn-small" style={{ marginBottom: 12 }}>← Projects</button>

            <span className="kicker">Ready to use</span>
            <p style={{ fontSize: 13, color: "var(--muted)", margin: "4px 0 12px", lineHeight: 1.5 }}>
              Each of these was run end to end. You finish holding something real.
            </p>
            <div className="engine-grid">
              {READY_ENGINES.map((e) => (
                <EngineCard key={e.id} engine={e} projects={projects} onStart={pickEngine} onResume={openProject} />
              ))}
            </div>

            {OWNER_ENGINES.length > 0 && (
              <div style={{ marginTop: 30 }}>
                <span className="kicker">Owner only — not ready for you yet</span>
                <p style={{ fontSize: 13, color: "var(--muted)", margin: "4px 0 12px", lineHeight: 1.5 }}>
                  Real and working, but only on the machine that hosts the site. Shown here so you know it exists —
                  not hidden, not pretending.
                </p>
                <div className="engine-grid">
                  {OWNER_ENGINES.map((e) => (
                    <EngineCard key={e.id} engine={e} projects={projects} onStart={pickEngine} onResume={openProject} />
                  ))}
                </div>
              </div>
            )}

            <div style={{ marginTop: 30 }}>
              <span className="kicker">Planned — nothing to open yet</span>
              <p style={{ fontSize: 13, color: "var(--muted)", margin: "4px 0 10px", lineHeight: 1.5 }}>
                Named because they&apos;re coming, not because they&apos;re built. There&apos;s no screen behind them,
                so there&apos;s no button — we won&apos;t send you into an empty room.
              </p>
              <div className="planned-row">
                {PLANNED.map((p) => (
                  <span key={p.name} className="planned-chip">
                    {p.emoji} {p.name} — {p.what}
                  </span>
                ))}
              </div>
            </div>

            <p style={{ fontSize: 12.5, color: "var(--dim)", marginTop: 26, lineHeight: 1.5 }}>
              Looking for the beginner walkthrough? That&apos;s{" "}
              <a href="/build" style={{ color: "var(--gold)", fontWeight: 800, textDecoration: "none" }}>/build</a>{" "}
              — six rounds from idea to a live site, for a first web app. It&apos;s a different thing from the Build
              Engine above, which writes the brief for a builder.
            </p>
          </>
        )}

        {/* ---------- INTAKE ---------- */}
        {view === "intake" && engine && (
          <>
            <button onClick={() => setView(activeProject ? "cycle" : "picker")} className="btn btn-ghost btn-small" style={{ marginBottom: 12 }}>← Back</button>
            <div style={card}>
              <p style={{ fontSize: 12, fontWeight: 900, color: "var(--gold)", textTransform: "uppercase", letterSpacing: "0.1em" }}>{engine.emoji} {engine.name}</p>
              <p style={{ fontSize: 14, color: "var(--muted)", margin: "4px 0 16px" }}>{engine.blurb}</p>
              {engine.intake.map((q) => (
                <div key={q.key} style={{ marginBottom: 14 }}>
                  <label htmlFor={`intake-${q.key}`} style={{ display: "block", fontSize: 13.5, fontWeight: 800, color: "var(--text)", marginBottom: 4 }}>{q.label}{q.optional ? " (optional)" : ""}</label>
                  {q.help && <p id={`intake-${q.key}-help`} style={{ fontSize: 12, color: "var(--muted)", margin: "0 0 6px" }}>{q.help}</p>}
                  {q.type === "textarea" ? (
                    <textarea id={`intake-${q.key}`} aria-describedby={q.help ? `intake-${q.key}-help` : undefined} value={answers[q.key] ?? ""} onChange={(ev) => setAnswers({ ...answers, [q.key]: ev.target.value })} placeholder={q.placeholder} style={{ ...input, minHeight: 66, resize: "vertical" }} />
                  ) : (
                    <input id={`intake-${q.key}`} aria-describedby={q.help ? `intake-${q.key}-help` : undefined} value={answers[q.key] ?? ""} onChange={(ev) => setAnswers({ ...answers, [q.key]: ev.target.value })} placeholder={q.placeholder} style={input} />
                  )}
                </div>
              ))}
              <label htmlFor="intake-stage" style={{ display: "block", fontSize: 13.5, fontWeight: 800, color: "var(--text)", marginBottom: 4 }}>Current build stage</label>
              <select id="intake-stage" value={stage} onChange={(ev) => setStage(ev.target.value as BuildStage)} style={input}>
                {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <button onClick={toReview} className="btn btn-gold" style={{ width: "100%", marginTop: 16 }}>Review & customize →</button>
            </div>
          </>
        )}

        {/* ---------- REVIEW BEFORE GENERATION ---------- */}
        {view === "review" && engine && previewPackage && (
          <>
            <button onClick={() => setView("intake")} className="btn btn-ghost btn-small" style={{ marginBottom: 12 }}>← Edit answers</button>
            <div style={card}>
              <span className="kicker">Review — is this right before we generate?</span>
              <Section title="Engine understanding" body={previewPackage.understanding} />
              <Section title="Recommended direction" body={previewPackage.direction} />
              <div style={{ marginBottom: 16 }}>
                <label htmlFor="review-objective" style={{ display: "block", fontSize: 13, fontWeight: 900, color: "var(--gold)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Current objective (edit if needed)</label>
                <textarea id="review-objective" value={objectiveEdit} onChange={(ev) => setObjectiveEdit(ev.target.value)} style={{ ...input, minHeight: 60, resize: "vertical" }} />
              </div>
              <div style={{ display: "grid", gap: 10, gridTemplateColumns: "1fr 1fr" }}>
                <div>
                  <label htmlFor="review-depth" style={{ display: "block", fontSize: 12, fontWeight: 800, color: "var(--muted)", marginBottom: 4 }}>Depth</label>
                  <select id="review-depth" value={depth} onChange={(ev) => setDepth(ev.target.value as Depth)} style={input}>
                    {(["quick", "full", "deep"] as Depth[]).map((d) => <option key={d} value={d}>{DEPTH_LABELS[d]}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="review-destination" style={{ display: "block", fontSize: 12, fontWeight: 800, color: "var(--muted)", marginBottom: 4 }}>Send it to</label>
                  <select id="review-destination" value={destination} onChange={(ev) => setDestination(ev.target.value as Destination)} style={input}>
                    {(Object.keys(DESTINATION_LABELS) as Destination[]).map((d) => <option key={d} value={d}>{DESTINATION_LABELS[d]}</option>)}
                  </select>
                </div>
              </div>
              <button onClick={toEdit} className="btn btn-gold" style={{ width: "100%", marginTop: 16 }}>Customize sections →</button>
            </div>
          </>
        )}

        {/* ---------- EDIT SPECIALTIES ---------- */}
        {view === "edit" && engine && previewPackage && (
          <>
            <button onClick={() => setView("review")} className="btn btn-ghost btn-small" style={{ marginBottom: 12 }}>← Back to review</button>
            <div style={card}>
              <span className="kicker">Customize this package</span>
              <p style={{ fontSize: 13.5, color: "var(--muted)", margin: "0 0 14px" }}>Edit any section below. Changes are saved in the package.</p>
            </div>
            {engine.specialties.map((title) => {
              const id = `edit-${title.toLowerCase().replace(/\s+/g, "-")}`;
              return (
                <div key={title} style={{ ...card, marginBottom: 12 }}>
                  <label htmlFor={id} style={{ display: "block", fontSize: 13, fontWeight: 900, color: "var(--gold)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>{title}</label>
                  <textarea
                    id={id}
                    value={specialtyEdits[title] ?? previewPackage.specialties?.[title] ?? ""}
                    onChange={(ev) => setSpecialtyEdits({ ...specialtyEdits, [title]: ev.target.value })}
                    style={{ ...input, minHeight: 80, resize: "vertical" }}
                  />
                </div>
              );
            })}
            <div style={card}>
              <button onClick={generate} className="btn btn-gold" style={{ width: "100%", marginTop: 8 }}>Generate final package →</button>
            </div>
          </>
        )}

        {/* ---------- CYCLE (result page + history) ---------- */}
        {view === "cycle" && activeProject && activeCycle && engine && (
          <CycleView
            project={activeProject} cycle={activeCycle} engine={engine}
            tab={tab} setTab={setTab} card={card} Section={Section}
            copy={copy}
            onMarkSent={() => updateCycle({ status: "sent" })}
            onReturn={() => { setReview({ completed: true, correctLive: true, broke: "", wrong: "", deferred: "", readyForPublic: false, raw: "" }); setView("return"); }}
            onNext={generateNextCycle}
            onNewCycle={() => { setEngineId(activeProject.engineId); setAnswers(activeProject.answers); setView("intake"); }}
            onPushRequested={() => updateCycle({ pushRequestedAt: new Date().toISOString() })}
            onBack={() => setView("list")}
          />
        )}

        {/* ---------- RETURN WITH RESULTS ---------- */}
        {view === "return" && activeCycle && (
          <>
            <button onClick={() => setView("cycle")} className="btn btn-ghost btn-small" style={{ marginBottom: 12 }}>← Back to cycle</button>
            <div style={card}>
              <span className="kicker">Return with results</span>
              <label htmlFor="return-raw" style={{ display: "block", fontSize: 13.5, color: "var(--muted)", margin: "0 0 14px", fontWeight: 400 }}>Paste what actually came back, then answer a few quick things. StepInTheRing will inspect it and recommend the next move.</label>
              <textarea id="return-raw" value={review.raw} onChange={(ev) => setReview({ ...review, raw: ev.target.value })} placeholder="Paste the tool's final report / results here…" style={{ ...input, minHeight: 120, resize: "vertical", marginBottom: 14 }} />
              {REVIEW_QUESTIONS.map((q) => (
                <div key={q.key} style={{ marginBottom: 12 }}>
                  <label htmlFor={q.type === "bool" ? undefined : `return-${q.key}`} style={{ display: "block", fontSize: 13.5, fontWeight: 800, color: "var(--text)", marginBottom: 4 }}>{q.label}</label>
                  {q.type === "bool" ? (
                    <div style={{ display: "flex", gap: 8 }} role="group" aria-label={q.label}>
                      {[["Yes", true], ["No", false]].map(([lbl, v]) => (
                        <button key={String(v)} aria-pressed={(review[q.key] as boolean) === v} onClick={() => setReview({ ...review, [q.key]: v })} className={(review[q.key] as boolean) === v ? "btn btn-gold btn-small" : "btn btn-ghost btn-small"}>{lbl as string}</button>
                      ))}
                    </div>
                  ) : (
                    <input id={`return-${q.key}`} value={review[q.key] as string} onChange={(ev) => setReview({ ...review, [q.key]: ev.target.value })} style={input} />
                  )}
                </div>
              ))}
              <button onClick={submitReturn} className="btn btn-gold" style={{ width: "100%", marginTop: 8 }}>Inspect what happened →</button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

// ---- Cycle result view (tabs + history + actions) ----
function CycleView({ project, cycle, engine, tab, setTab, card, Section, copy, onMarkSent, onReturn, onNext, onNewCycle, onPushRequested, onBack }: {
  project: Project; cycle: Cycle; engine: ReturnType<typeof getEngine>; tab: string; setTab: (t: string) => void;
  card: React.CSSProperties; Section: (p: { title: string; body: string }) => React.ReactElement;
  copy: (t: string, l: string) => void;
  onMarkSent: () => void; onReturn: () => void; onNext: (p: NextPath) => void; onNewCycle: () => void; onPushRequested: () => void; onBack: () => void;
}) {
  const p = cycle.pkg;
  const e = engine!;
  const baseTabs: [string, string][] = [["overview", "Overview"], ["execution", "Execution"], ["verify", "Verify"], ["return", "Return"], ["next", "Next Cycle"]];
  const specialtyTabs = e.specialties.map((title) => [title.toLowerCase().replace(/\s+/g, "-"), title] as [string, string]);
  const tabs = [...baseTabs, ...specialtyTabs];
  const bullets = (arr: string[]) => arr.map((x) => `- ${x}`).join("\n");
  return (
    <>
      <button onClick={onBack} className="btn btn-ghost btn-small" style={{ marginBottom: 12 }}>← Projects</button>

      {/* build-cycle history */}
      <div style={{ ...card, marginBottom: 14 }}>
        <span className="kicker" style={{ margin: 0 }}>{e.emoji} {project.name} — build cycles</span>
        <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
          {project.cycles.map((c) => (
            <div key={c.id} style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 13, color: c.id === cycle.id ? "var(--text)" : "var(--muted)", fontWeight: c.id === cycle.id ? 800 : 400 }}>
              <span>Cycle {c.index + 1} — {c.objective.slice(0, 46)}{c.objective.length > 46 ? "…" : ""}</span>
              <span style={{ flexShrink: 0 }}>{c.status}{c.ret?.recommendation ? ` → ${PATH_LABELS[c.ret.recommendation]}` : ""}</span>
            </div>
          ))}
        </div>
      </div>

      {/* tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
        {tabs.map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} className={tab === id ? "btn btn-gold btn-small" : "btn btn-ghost btn-small"}>{label}</button>
        ))}
      </div>

      <div style={card}>
        {tab === "overview" && (<>
          <Section title="Engine understanding" body={p.understanding} />
          <Section title="Recommended direction" body={p.direction} />
          <Section title="Objective" body={p.objective} />
          <Section title="In scope" body={bullets(p.inScope)} />
          <Section title="Out of scope" body={bullets(p.outOfScope)} />
        </>)}
        {tab === "execution" && (<>
          {p.design && <Section title="Design direction" body={p.design} />}
          <Section title="Architecture" body={p.architecture} />
          <Section title="Execution sequence" body={p.sequence} />
          <div style={{ fontSize: 13, fontWeight: 900, color: "var(--gold)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>The prompt ({DESTINATION_LABELS[p.destination]})</div>
          <pre style={{ whiteSpace: "pre-wrap", fontFamily: "inherit", fontSize: 13, color: "var(--text)", lineHeight: 1.55, background: "var(--surface)", border: "1px solid var(--line2)", borderRadius: 10, padding: 12, margin: 0 }}>{p.mainPrompt}</pre>
          <button onClick={() => copy(p.mainPrompt, "Prompt")} className="btn btn-gold btn-small" style={{ marginTop: 10 }}>Copy prompt</button>
        </>)}
        {tab === "verify" && <Section title="Definition of done" body={p.verify} />}
        {tab === "return" && (<>
          <Section title="Bring these back" body={p.returnTemplate} />
          <button onClick={() => copy(p.returnTemplate, "Return template")} className="btn btn-ghost btn-small">Copy return template</button>
        </>)}
        {tab === "next" && (<>
          {cycle.ret?.recommendation ? (<>
            <div style={{ fontSize: 13, fontWeight: 900, color: "var(--gold)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Recommended next: {PATH_LABELS[cycle.ret.recommendation]}</div>
            <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.6 }}>{PATH_BLURB[cycle.ret.recommendation]}</p>
            {cycle.ret.reviewNotes && <p style={{ fontSize: 13.5, color: "var(--text)", lineHeight: 1.6 }}>{cycle.ret.reviewNotes}</p>}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
              <button onClick={() => onNext(cycle.ret!.recommendation!)} className="btn btn-gold">Generate {PATH_LABELS[cycle.ret.recommendation]} cycle →</button>
              {(["fix", "refine", "expand", "launch"] as NextPath[]).filter((x) => x !== cycle.ret!.recommendation).map((x) => (
                <button key={x} onClick={() => onNext(x)} className="btn btn-ghost btn-small">or {PATH_LABELS[x]}</button>
              ))}
            </div>
          </>) : (
            <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.6 }}>{p.nextCycleNote}</p>
          )}
        </>)}
        {e.specialties.some((s) => tab === s.toLowerCase().replace(/\s+/g, "-")) && (<>
          {e.specialties.map((title) => {
            const tabId = title.toLowerCase().replace(/\s+/g, "-");
            if (tab !== tabId) return null;
            return <Section key={title} title={title} body={p.specialties?.[title] ?? `(${title} not found)`} />;
          })}
        </>)}
      </div>

      {/* primary action bar (matches state) */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14 }}>
        <button onClick={() => copy(packageToText(e, project.answers, p), "Full package")} className="btn btn-ghost btn-small">Copy full package</button>
        {adapterFor(e.id) && (
          <>
            <button
              onClick={() => {
                const v = viewOf(recordFromEngineIntake(e.id, project.answers));
                downloadBuildPack(v, p.mainPrompt, loadBuilderDefaults(), adapterFor(e.id)!.spec(v));
              }}
              className="btn btn-ghost btn-small"
            >
              Build Pack (.md)
            </button>
            <button
              onClick={() => downloadCreationJson(viewOf(recordFromEngineIntake(e.id, project.answers)))}
              className="btn btn-ghost btn-small"
            >
              Creation (.json)
            </button>
          </>
        )}
        {cycle.status === "drafted" && <button onClick={onMarkSent} className="btn btn-gold btn-small">Mark as sent</button>}
        {(cycle.status === "sent" || cycle.status === "drafted") && <button onClick={onReturn} className="btn btn-gold btn-small">Return with results</button>}
        {cycle.status === "reviewed" && <button onClick={onNewCycle} className="btn btn-ghost btn-small">Manual new cycle</button>}
        <a href={REQUEST_MAILTO(`Build this for me: ${project.name}`, packageToText(e, project.answers, p))} className="btn btn-ghost btn-small">💌 Send to Open Mirror to build free</a>
      </div>

      {/* The road to live: build → test locally → return results → push */}
      <div style={{ ...card, marginTop: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 900, color: "var(--gold)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
          The road to live
        </div>
        <p style={{ fontSize: 13.5, color: "var(--muted)", lineHeight: 1.6, margin: "0 0 12px" }}>
          Build it → <b style={{ color: "var(--text)" }}>test it locally</b> (the Verify tab is your checklist) →
          return with results → send it to Open Mirror to push. Every push lands on the{" "}
          <a href="/live" style={{ color: "var(--gold)", fontWeight: 800, textDecoration: "none" }}>Live page</a>.
        </p>
        {cycle.pushRequestedAt ? (
          <p style={{ fontSize: 14, fontWeight: 800, color: "var(--text)", margin: 0 }}>
            🚀 Push requested {new Date(cycle.pushRequestedAt).toLocaleDateString()} — once Open Mirror pushes it,
            it lands on <a href="/live" style={{ color: "var(--gold)", textDecoration: "none" }}>the Live page</a>.
          </p>
        ) : cycle.status === "reviewed" ? (
          <a
            href={REQUEST_MAILTO(
              `Push this live: ${project.name}`,
              [
                `I built and TESTED this locally. Please push it live.`,
                ``,
                `PROJECT: ${project.name}`,
                `ENGINE: ${e.name}`,
                `CYCLE OBJECTIVE: ${cycle.objective}`,
                ``,
                `MY LOCAL TEST RESULTS:`,
                cycle.ret?.raw || "(paste your test results here)",
                ``,
                `WHERE THE CODE LIVES (repo / zip / link):`,
                ``,
                `--- Full package below for reference ---`,
                packageToText(e, project.answers, p),
              ].join("\n"),
            )}
            onClick={onPushRequested}
            className="btn btn-gold"
          >
            🚀 Tested locally? Send to Open Mirror to push it live
          </a>
        ) : (
          <p style={{ fontSize: 13, color: "var(--muted)", margin: 0 }}>
            🔒 The push button unlocks after you test locally and return with results.
          </p>
        )}
      </div>
    </>
  );
}
