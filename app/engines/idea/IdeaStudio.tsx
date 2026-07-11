"use client";

/**
 * Idea Engine Studio.
 *
 * Flow: Start → Ideas → Compare → Decide → Handoff.
 * Real output: one saved decision record, handed directly into the next
 * engine's intake. Projects save on this device automatically.
 */

import { useEffect, useState } from "react";
import {
  generateAngles, handoffAnswers, isFullyScored, rankCandidates, totalScore,
  HANDOFF_TARGETS, IDEA_FACTORS,
  type IdeaCandidate, type IdeaDecision,
} from "./idea.engine";
import type { CreationProject } from "../shared/creation-engine.types";
import { CREATION_STATUS_LABELS } from "../shared/creation-engine.types";
import {
  createProject, deleteProject, getProject, getProjectsByEngine, uid, updateProject,
} from "../shared/persistence";

type Stage = "projects" | "start" | "ideas" | "compare" | "decide" | "done";

const ENGINE_ID = "idea";

interface IdeaContent {
  candidates?: IdeaCandidate[];
  selectedId?: string;
  decision?: IdeaDecision;
}

export default function IdeaStudio({
  onBack,
  onHandoff,
  card,
}: {
  onBack: () => void;
  onHandoff: (engineId: string, answers: Record<string, string>) => void;
  card: React.CSSProperties;
}) {
  const [ready, setReady] = useState(false);
  const [saved, setSaved] = useState<CreationProject[]>([]);
  const [project, setProject] = useState<CreationProject | null>(null);
  const [stage, setStage] = useState<Stage>("start");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [candidates, setCandidates] = useState<IdeaCandidate[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [decision, setDecision] = useState<IdeaDecision | null>(null);
  const [newIdea, setNewIdea] = useState("");
  const [flash, setFlash] = useState("");

  useEffect(() => {
    const existing = getProjectsByEngine(ENGINE_ID);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSaved(existing);
    if (existing.length > 0) setStage("projects");
    setReady(true);
  }, []);

  const say = (m: string) => { setFlash(m); setTimeout(() => setFlash(""), 2000); };

  const persist = (patch: Partial<CreationProject>) => {
    if (!project) return;
    const latest = getProject(project.id) ?? project;
    const next = { ...latest, ...patch };
    updateProject(next);
    setProject(next);
    setSaved(getProjectsByEngine(ENGINE_ID));
  };

  const content = (): IdeaContent => (project?.buildContent as IdeaContent) ?? {};

  // ---- PROJECTS ----
  const openProject = (p: CreationProject) => {
    setProject(p);
    setAnswers(p.answers);
    const c = (p.buildContent as IdeaContent) ?? {};
    setCandidates(c.candidates ?? []);
    setSelectedId(c.selectedId ?? "");
    setDecision(c.decision ?? null);
    if (c.decision) setStage("done");
    else if (c.selectedId) setStage("decide");
    else if (c.candidates && c.candidates.length > 0) setStage("compare");
    else setStage("start");
  };

  const startNew = () => {
    setProject(null); setAnswers({}); setCandidates([]); setSelectedId(""); setDecision(null);
    setStage("start");
  };

  // ---- START ----
  const submitStart = () => {
    if (!answers.name || !answers.seed || !answers.who) { say("Fill in required fields"); return; }
    let p = project;
    if (!p) { p = createProject(ENGINE_ID, answers.name, answers); setProject(p); }
    const seedCandidate: IdeaCandidate = { id: uid(), text: answers.seed, origin: "yours" };
    const initial = candidates.length > 0 ? candidates : [seedCandidate];
    setCandidates(initial);
    const next = { ...p, name: answers.name, answers, status: "exploring" as const, buildContent: { candidates: initial } };
    updateProject(next); setProject(next); setSaved(getProjectsByEngine(ENGINE_ID));
    setStage("ideas");
  };

  // ---- IDEAS ----
  const addIdea = () => {
    if (!newIdea.trim()) return;
    if (candidates.length >= 8) { say("8 ideas is enough — compare them"); return; }
    const next = [...candidates, { id: uid(), text: newIdea.trim(), origin: "yours" as const }];
    setCandidates(next); setNewIdea("");
    persist({ buildContent: { ...content(), candidates: next } });
  };

  const addAngles = () => {
    const angles = generateAngles(answers.seed, answers.who).filter(
      (a) => !candidates.some((c) => c.id === a.id),
    );
    const room = Math.max(0, 8 - candidates.length);
    const next = [...candidates, ...angles.slice(0, room)];
    setCandidates(next);
    persist({ buildContent: { ...content(), candidates: next } });
    if (room === 0) say("8 ideas is enough — compare them");
  };

  const removeIdea = (id: string) => {
    const next = candidates.filter((c) => c.id !== id);
    setCandidates(next);
    persist({ buildContent: { ...content(), candidates: next } });
  };

  // ---- COMPARE ----
  const setScore = (candidateId: string, factorId: string, value: number) => {
    const next = candidates.map((c) =>
      c.id === candidateId ? { ...c, scores: { ...(c.scores ?? {}), [factorId]: value } } : c,
    );
    setCandidates(next);
    persist({ buildContent: { ...content(), candidates: next } });
  };

  const selectIdea = (id: string) => {
    setSelectedId(id);
    persist({ status: "selected", buildContent: { ...content(), candidates, selectedId: id } });
    const chosen = candidates.find((c) => c.id === id);
    setDecision({
      description: chosen?.text ?? "",
      intendedUser: answers.who ?? "",
      problem: answers.problem ?? "",
      simplestFirstVersion: "",
      requiredTools: "",
      nextEngineId: "",
      firstAction: "",
      decidedAt: "",
    });
    setStage("decide");
  };

  // ---- DECIDE ----
  const saveDecision = () => {
    if (!decision) return;
    if (!decision.description || !decision.simplestFirstVersion || !decision.nextEngineId || !decision.firstAction) {
      say("Fill in the decision — including next engine and first action");
      return;
    }
    const final = { ...decision, decidedAt: new Date().toISOString() };
    setDecision(final);
    persist({ status: "approved", buildContent: { ...content(), candidates, selectedId, decision: final } });
    setStage("done");
  };

  // ---- STYLES ----
  const input = {
    width: "100%", boxSizing: "border-box" as const, background: "var(--surface)",
    border: "1px solid var(--line2)", borderRadius: 10, color: "var(--text)",
    padding: "11px 12px", fontSize: 15, fontFamily: "inherit",
  };

  if (!ready) return <div className="page"><div style={{ height: 200 }} /></div>;

  const ranked = rankCandidates(candidates);
  const allScored = candidates.length > 0 && candidates.every(isFullyScored);

  return (
    <main>
      <div className="page">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <button onClick={onBack} className="btn btn-ghost btn-small">← Engine Room</button>
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" }}>
            Idea Engine {stage !== "projects" ? `· ${stage}` : ""}
          </span>
        </div>
        {flash && <p style={{ color: "var(--gold)", fontWeight: 800, marginBottom: 12 }}>{flash}</p>}
        {project && stage !== "projects" && (
          <p style={{ fontSize: 12, color: "var(--muted)", margin: "0 0 12px" }}>
            Saved on this device • {CREATION_STATUS_LABELS[project.status]}
          </p>
        )}

        {/* ---- PROJECTS ---- */}
        {stage === "projects" && (
          <div style={card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h2 style={{ fontSize: 18, fontWeight: 900, margin: 0 }}>Your idea decisions</h2>
              <button onClick={startNew} className="btn btn-gold btn-small">+ New idea</button>
            </div>
            {saved.map((p) => {
              const d = (p.buildContent as IdeaContent)?.decision;
              return (
                <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, padding: "10px 0", borderBottom: "1px solid var(--line2)" }}>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 800, color: "var(--text)", margin: 0 }}>{p.name}</p>
                    <p style={{ fontSize: 12, color: "var(--muted)", margin: "2px 0 0" }}>
                      {d ? `Decided → ${HANDOFF_TARGETS.find((t) => t.engineId === d.nextEngineId)?.label ?? d.nextEngineId}` : CREATION_STATUS_LABELS[p.status]}
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                    <button onClick={() => openProject(p)} className="btn btn-gold btn-small">Open</button>
                    <button onClick={() => { if (confirm(`Delete "${p.name}"?`)) { deleteProject(p.id); setSaved(getProjectsByEngine(ENGINE_ID)); } }} className="btn btn-ghost btn-small">Delete</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ---- START ---- */}
        {stage === "start" && (
          <div style={card}>
            {saved.length > 0 && (
              <button onClick={() => setStage("projects")} className="btn btn-ghost btn-small" style={{ marginBottom: 12 }}>← Saved ideas</button>
            )}
            <h2 style={{ fontSize: 18, fontWeight: 900, marginBottom: 6 }}>1. Where are you starting?</h2>
            <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 16 }}>
              Say the idea however it comes out. You&apos;ll compare a few versions, pick one, and leave with a decision and a first action.
            </p>
            {([
              ["name", "Project name *", "A working name is fine", "text"],
              ["seed", "The idea, however it comes out *", "The thing you keep thinking about", "textarea"],
              ["who", "Who is it for? *", "One specific person or group", "text"],
              ["problem", "What problem or moment does it fit? (optional)", "Why it would matter to them", "text"],
              ["constraint", "Biggest constraint right now? (optional)", "Time, money, skills, a deadline", "text"],
            ] as const).map(([key, label, placeholder, kind]) => (
              <div key={key} style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 13.5, fontWeight: 800, marginBottom: 4 }}>{label}</label>
                {kind === "textarea" ? (
                  <textarea value={answers[key] || ""} onChange={(e) => setAnswers({ ...answers, [key]: e.target.value })} placeholder={placeholder} style={{ ...input, minHeight: 66, resize: "vertical" }} />
                ) : (
                  <input value={answers[key] || ""} onChange={(e) => setAnswers({ ...answers, [key]: e.target.value })} placeholder={placeholder} style={input} />
                )}
              </div>
            ))}
            <button onClick={submitStart} className="btn btn-gold" style={{ width: "100%", marginTop: 8 }}>
              Collect the ideas →
            </button>
          </div>
        )}

        {/* ---- IDEAS ---- */}
        {stage === "ideas" && (
          <div>
            <button onClick={() => setStage("start")} className="btn btn-ghost btn-small" style={{ marginBottom: 12 }}>← Back</button>
            <div style={card}>
              <h2 style={{ fontSize: 18, fontWeight: 900, marginBottom: 6 }}>2. Collect the ideas</h2>
              <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 16 }}>
                Your idea is first. Add other versions you&apos;re weighing (up to 8 total), or add a few generated angles to react to.
              </p>

              {candidates.map((c) => (
                <div key={c.id} style={{ display: "flex", gap: 8, alignItems: "flex-start", padding: "10px 0", borderBottom: "1px solid var(--line2)" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, color: "var(--text)", margin: 0, lineHeight: 1.5 }}>{c.text}</p>
                    <p style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted)", margin: "4px 0 0" }}>
                      {c.origin === "yours" ? "Yours" : "Generated angle"}
                    </p>
                  </div>
                  <button onClick={() => removeIdea(c.id)} className="btn btn-ghost btn-small" aria-label={`Remove idea: ${c.text.slice(0, 40)}`}>Remove</button>
                </div>
              ))}

              <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                <input value={newIdea} onChange={(e) => setNewIdea(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") addIdea(); }} placeholder="Add another version of the idea" aria-label="Add another idea" style={{ ...input, flex: 1 }} />
                <button onClick={addIdea} className="btn btn-ghost btn-small">Add</button>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                <button onClick={addAngles} className="btn btn-ghost btn-small">Add generated angles</button>
                <button onClick={() => setStage("compare")} disabled={candidates.length < 2} className="btn btn-gold btn-small" style={{ opacity: candidates.length < 2 ? 0.5 : 1 }}>
                  {candidates.length < 2 ? "Add at least 2 to compare" : "Compare them →"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ---- COMPARE ---- */}
        {stage === "compare" && (
          <div>
            <button onClick={() => setStage("ideas")} className="btn btn-ghost btn-small" style={{ marginBottom: 12 }}>← Back to ideas</button>
            <div style={{ ...card, marginBottom: 14 }}>
              <h2 style={{ fontSize: 18, fontWeight: 900, marginBottom: 6 }}>3. Compare and pick</h2>
              <p style={{ fontSize: 13, color: "var(--muted)", margin: 0 }}>
                Score each idea 1–5 on five factors. The ranking assists your judgment — you make the pick.
              </p>
            </div>

            {ranked.map((c) => (
              <div key={c.id} style={{ ...card, marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
                  <p style={{ fontSize: 14, fontWeight: 800, color: "var(--text)", margin: "0 0 10px", lineHeight: 1.5, flex: 1 }}>{c.text}</p>
                  {isFullyScored(c) && (
                    <span style={{ fontSize: 13, fontWeight: 900, color: "var(--gold)", flexShrink: 0 }}>{totalScore(c)}/25</span>
                  )}
                </div>
                {IDEA_FACTORS.map((f) => (
                  <div key={f.id} style={{ marginBottom: 10 }}>
                    <p style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text)", margin: "0 0 2px" }}>{f.label}</p>
                    <p style={{ fontSize: 12, color: "var(--muted)", margin: "0 0 6px" }}>{f.question}</p>
                    <div style={{ display: "flex", gap: 6 }}>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button key={n} onClick={() => setScore(c.id, f.id, n)}
                          aria-label={`${f.label} ${n} for: ${c.text.slice(0, 30)}`}
                          style={{
                            background: c.scores?.[f.id] === n ? "var(--gold)" : "var(--surface)",
                            color: c.scores?.[f.id] === n ? "#000" : "var(--text)",
                            border: `1px solid ${c.scores?.[f.id] === n ? "var(--gold)" : "var(--line2)"}`,
                            borderRadius: 6, padding: "7px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer",
                          }}>{n}</button>
                      ))}
                    </div>
                  </div>
                ))}
                <button onClick={() => selectIdea(c.id)} className="btn btn-gold btn-small" style={{ marginTop: 4 }}>
                  Pick this one →
                </button>
              </div>
            ))}
            {!allScored && (
              <p style={{ fontSize: 12.5, color: "var(--muted)" }}>
                Unscored ideas sink to the bottom. You can pick any idea at any time — scoring just makes the trade-offs visible.
              </p>
            )}
          </div>
        )}

        {/* ---- DECIDE ---- */}
        {stage === "decide" && decision && (
          <div>
            <button onClick={() => setStage("compare")} className="btn btn-ghost btn-small" style={{ marginBottom: 12 }}>← Back to comparison</button>
            <div style={card}>
              <h2 style={{ fontSize: 18, fontWeight: 900, marginBottom: 6 }}>4. Lock the decision</h2>
              <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 16 }}>
                This record is the output. Fill it in plainly — it becomes the starting answers for the next engine.
              </p>
              {([
                ["description", "The idea, stated clearly *", "textarea"],
                ["intendedUser", "Intended user *", "text"],
                ["problem", "Problem or purpose", "text"],
                ["simplestFirstVersion", "Simplest first version *", "textarea"],
                ["requiredTools", "Required tools (free where possible)", "text"],
                ["firstAction", "First action — the very next thing you'll do *", "text"],
              ] as const).map(([key, label, kind]) => (
                <div key={key} style={{ marginBottom: 14 }}>
                  <label style={{ display: "block", fontSize: 13.5, fontWeight: 800, marginBottom: 4 }}>{label}</label>
                  {kind === "textarea" ? (
                    <textarea value={decision[key]} onChange={(e) => setDecision({ ...decision, [key]: e.target.value })} style={{ ...input, minHeight: 60, resize: "vertical" }} />
                  ) : (
                    <input value={decision[key]} onChange={(e) => setDecision({ ...decision, [key]: e.target.value })} style={input} />
                  )}
                </div>
              ))}

              <label style={{ display: "block", fontSize: 13.5, fontWeight: 800, marginBottom: 6 }}>Next engine *</label>
              {HANDOFF_TARGETS.map((t) => (
                <label key={t.engineId} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "8px 0", cursor: "pointer" }}>
                  <input type="radio" name="nextEngine" checked={decision.nextEngineId === t.engineId} onChange={() => setDecision({ ...decision, nextEngineId: t.engineId })} style={{ marginTop: 3 }} />
                  <span>
                    <span style={{ fontSize: 14, fontWeight: 800, color: "var(--text)" }}>{t.label}</span>
                    <span style={{ display: "block", fontSize: 12.5, color: "var(--muted)" }}>{t.when}</span>
                  </span>
                </label>
              ))}

              <button onClick={saveDecision} className="btn btn-gold" style={{ width: "100%", marginTop: 14 }}>
                Save the decision →
              </button>
            </div>
          </div>
        )}

        {/* ---- DONE ---- */}
        {stage === "done" && decision && (
          <div style={card}>
            <h2 style={{ fontSize: 18, fontWeight: 900, marginBottom: 12 }}>Decision saved</h2>
            {([
              ["The idea", decision.description],
              ["Intended user", decision.intendedUser],
              ["Problem / purpose", decision.problem || "(not stated)"],
              ["Simplest first version", decision.simplestFirstVersion],
              ["Required tools", decision.requiredTools || "(none listed)"],
              ["First action", decision.firstAction],
            ] as const).map(([label, body]) => (
              <div key={label} style={{ marginBottom: 12 }}>
                <p style={{ fontSize: 12, fontWeight: 900, color: "var(--gold)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 3px" }}>{label}</p>
                <p style={{ fontSize: 14, color: "var(--text)", margin: 0, lineHeight: 1.55 }}>{body}</p>
              </div>
            ))}
            <button
              onClick={() => onHandoff(decision.nextEngineId, handoffAnswers(decision, project?.name ?? "Idea"))}
              className="btn btn-gold"
              style={{ width: "100%", marginTop: 8 }}
            >
              Continue in the {HANDOFF_TARGETS.find((t) => t.engineId === decision.nextEngineId)?.label ?? "next engine"} →
            </button>
            <p style={{ fontSize: 12.5, color: "var(--muted)", margin: "10px 0 0" }}>
              Your answers carry over as the starting point — nothing to retype.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
