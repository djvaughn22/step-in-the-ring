"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DEPTH_LABELS, DESTINATION_LABELS, ENGINES, getEngine, STAGES,
  type BuildStage, type Depth, type Destination,
} from "./engines";
import { generatePackage, packageToText } from "./generator";
import {
  analyzeReturn, PATH_BLURB, PATH_LABELS, REVIEW_QUESTIONS, type ReviewInput,
} from "./review";
import {
  deleteProject, duplicateProject, exportProject, importProject, loadProjects,
  newProject, uid, upsertProject, type Cycle, type NextPath, type Project,
} from "./store";

type View = "list" | "picker" | "intake" | "review" | "cycle" | "return";
const REQUEST_MAILTO = (subject: string, body: string) =>
  `mailto:ask@openmirrorllc.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

const PATH_ENGINE: Record<NextPath, string> = { fix: "fix", refine: "", expand: "", launch: "launch" };

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

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setProjects(loadProjects()); setReady(true); }, []);
  const engine = getEngine(engineId);
  const activeProject = projects.find((p) => p.id === activeProjectId) || null;
  const activeCycle = activeProject?.cycles.find((c) => c.id === activeCycleId) || null;

  const say = (m: string) => { setFlash(m); setTimeout(() => setFlash(""), 1600); };
  const copy = async (text: string, label: string) => {
    try { await navigator.clipboard.writeText(text); say(`${label} copied`); } catch { say("Copy failed"); }
  };

  // ---- draft package preview (review screen) ----
  const previewPackage = useMemo(() => {
    if (!engine) return null;
    return generatePackage(engine, answers, stage, depth, destination);
  }, [engine, answers, stage, depth, destination]);

  const startNew = () => { setEngineId(""); setAnswers({}); setActiveProjectId(""); setView("picker"); };

  const pickEngine = (id: string) => {
    const e = getEngine(id); if (!e) return;
    setEngineId(id); setAnswers({}); setStage(e.suggestedStage);
    setDestination(e.technical ? "claude-code" : e.id === "plan" || e.id === "grow" || e.id === "sell" || e.id === "idea" ? "chatgpt" : "self");
    setView("intake");
  };

  const toReview = () => {
    if (!engine) return;
    setObjectiveEdit(generatePackage(engine, answers, stage, depth, destination).objective);
    setView("review");
  };

  const generate = () => {
    if (!engine) return;
    const pkg = generatePackage(engine, answers, stage, depth, destination);
    if (objectiveEdit.trim()) pkg.objective = objectiveEdit.trim();
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

  return (
    <main>
      <div className="page">
        <header style={{ textAlign: "center", marginBottom: 24 }}>
          <a href="https://stepinthering.com" className="kicker" style={{ textDecoration: "none" }}>Step In The Ring</a>
          <h1 style={{ fontSize: "clamp(1.9rem,8vw,2.6rem)", fontWeight: 900, color: "var(--text)", margin: "6px 0 8px", lineHeight: 1.05 }}>
            Engine <span style={{ color: "var(--gold)" }}>Room</span>
          </h1>
          <p className="hero-sub" style={{ maxWidth: 500, margin: "0 auto" }}>
            Pick an engine. Answer the real situation. Get a detailed build package. Take it, come back with results, and generate the next focused cycle. Build in passes.
          </p>
          {flash && <p style={{ color: "var(--gold)", fontWeight: 800, marginTop: 8 }}>{flash}</p>}
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
                        <div style={{ display: "flex", gap: 6, flexShrink: 0, flexWrap: "wrap" }}>
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
            <span className="kicker">Choose an engine</span>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: 12, marginTop: 6 }}>
              {ENGINES.map((e) => (
                <button key={e.id} onClick={() => pickEngine(e.id)} style={{ ...card, textAlign: "left", cursor: "pointer", borderLeft: "4px solid var(--gold)", minHeight: 130 }}>
                  <div style={{ fontSize: 24 }}>{e.emoji}</div>
                  <div style={{ fontSize: 15, fontWeight: 900, color: "var(--text)", marginTop: 4 }}>{e.name}</div>
                  <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 4, lineHeight: 1.4 }}>{e.tagline}</div>
                </button>
              ))}
            </div>
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
                  <label style={{ display: "block", fontSize: 13.5, fontWeight: 800, color: "var(--text)", marginBottom: 4 }}>{q.label}{q.optional ? " (optional)" : ""}</label>
                  {q.help && <p style={{ fontSize: 12, color: "var(--muted)", margin: "0 0 6px" }}>{q.help}</p>}
                  {q.type === "textarea" ? (
                    <textarea value={answers[q.key] ?? ""} onChange={(ev) => setAnswers({ ...answers, [q.key]: ev.target.value })} placeholder={q.placeholder} style={{ ...input, minHeight: 66, resize: "vertical" }} />
                  ) : (
                    <input value={answers[q.key] ?? ""} onChange={(ev) => setAnswers({ ...answers, [q.key]: ev.target.value })} placeholder={q.placeholder} style={input} />
                  )}
                </div>
              ))}
              <label style={{ display: "block", fontSize: 13.5, fontWeight: 800, color: "var(--text)", marginBottom: 4 }}>Current build stage</label>
              <select value={stage} onChange={(ev) => setStage(ev.target.value as BuildStage)} style={input}>
                {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <button onClick={toReview} className="btn btn-gold" style={{ width: "100%", marginTop: 16 }}>Review before generating →</button>
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
                <div style={{ fontSize: 13, fontWeight: 900, color: "var(--gold)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Current objective (edit if needed)</div>
                <textarea value={objectiveEdit} onChange={(ev) => setObjectiveEdit(ev.target.value)} style={{ ...input, minHeight: 60, resize: "vertical" }} />
              </div>
              <div style={{ display: "grid", gap: 10, gridTemplateColumns: "1fr 1fr" }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: "var(--muted)", marginBottom: 4 }}>Depth</div>
                  <select value={depth} onChange={(ev) => setDepth(ev.target.value as Depth)} style={input}>
                    {(["quick", "full", "deep"] as Depth[]).map((d) => <option key={d} value={d}>{DEPTH_LABELS[d]}</option>)}
                  </select>
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: "var(--muted)", marginBottom: 4 }}>Send it to</div>
                  <select value={destination} onChange={(ev) => setDestination(ev.target.value as Destination)} style={input}>
                    {(Object.keys(DESTINATION_LABELS) as Destination[]).map((d) => <option key={d} value={d}>{DESTINATION_LABELS[d]}</option>)}
                  </select>
                </div>
              </div>
              <button onClick={generate} className="btn btn-gold" style={{ width: "100%", marginTop: 16 }}>Generate execution package →</button>
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
            onBack={() => setView("list")}
          />
        )}

        {/* ---------- RETURN WITH RESULTS ---------- */}
        {view === "return" && activeCycle && (
          <>
            <button onClick={() => setView("cycle")} className="btn btn-ghost btn-small" style={{ marginBottom: 12 }}>← Back to cycle</button>
            <div style={card}>
              <span className="kicker">Return with results</span>
              <p style={{ fontSize: 13.5, color: "var(--muted)", margin: "0 0 14px" }}>Paste what actually came back, then answer a few quick things. StepInTheRing will inspect it and recommend the next move.</p>
              <textarea value={review.raw} onChange={(ev) => setReview({ ...review, raw: ev.target.value })} placeholder="Paste the tool's final report / results here…" style={{ ...input, minHeight: 120, resize: "vertical", marginBottom: 14 }} />
              {REVIEW_QUESTIONS.map((q) => (
                <div key={q.key} style={{ marginBottom: 12 }}>
                  <label style={{ display: "block", fontSize: 13.5, fontWeight: 800, color: "var(--text)", marginBottom: 4 }}>{q.label}</label>
                  {q.type === "bool" ? (
                    <div style={{ display: "flex", gap: 8 }}>
                      {[["Yes", true], ["No", false]].map(([lbl, v]) => (
                        <button key={String(v)} onClick={() => setReview({ ...review, [q.key]: v })} className={(review[q.key] as boolean) === v ? "btn btn-gold btn-small" : "btn btn-ghost btn-small"}>{lbl as string}</button>
                      ))}
                    </div>
                  ) : (
                    <input value={review[q.key] as string} onChange={(ev) => setReview({ ...review, [q.key]: ev.target.value })} style={input} />
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
function CycleView({ project, cycle, engine, tab, setTab, card, Section, copy, onMarkSent, onReturn, onNext, onNewCycle, onBack }: {
  project: Project; cycle: Cycle; engine: ReturnType<typeof getEngine>; tab: string; setTab: (t: string) => void;
  card: React.CSSProperties; Section: (p: { title: string; body: string }) => React.ReactElement;
  copy: (t: string, l: string) => void;
  onMarkSent: () => void; onReturn: () => void; onNext: (p: NextPath) => void; onNewCycle: () => void; onBack: () => void;
}) {
  const p = cycle.pkg;
  const e = engine!;
  const tabs = [["overview", "Overview"], ["execution", "Execution"], ["verify", "Verify"], ["return", "Return"], ["next", "Next Cycle"]];
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
      </div>

      {/* primary action bar (matches state) */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14 }}>
        <button onClick={() => copy(packageToText(e, project.answers, p), "Full package")} className="btn btn-ghost btn-small">Copy full package</button>
        {cycle.status === "drafted" && <button onClick={onMarkSent} className="btn btn-gold btn-small">Mark as sent</button>}
        {(cycle.status === "sent" || cycle.status === "drafted") && <button onClick={onReturn} className="btn btn-gold btn-small">Return with results</button>}
        {cycle.status === "reviewed" && <button onClick={onNewCycle} className="btn btn-ghost btn-small">Manual new cycle</button>}
        <a href={REQUEST_MAILTO(`Build this for me: ${project.name}`, packageToText(e, project.answers, p))} className="btn btn-ghost btn-small">💌 Send to Open Mirror to build free</a>
      </div>
    </>
  );
}
