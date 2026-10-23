"use client";

/**
 * Idea Engine Studio.
 *
 * Flow: Start → three versions (one recommended) → pick → finished decision →
 * handoff. The engine lays out the versions and fills the decision in; the
 * visitor picks one and can edit it. Projects save on this device.
 */

import { useEffect, useState } from "react";
import {
  decisionFor, decisionToMarkdown, handoffAnswers, ideaVersions, recommendVersion,
  HANDOFF_TARGETS,
  type IdeaCandidate, type IdeaDecision, type IdeaVersion,
} from "./idea.engine";
import type { CreationProject } from "../shared/creation-engine.types";
import { CREATION_STATUS_LABELS } from "../shared/creation-engine.types";
import {
  createProject, deleteProject, getProject, getProjectsByEngine, updateProject,
} from "../shared/persistence";
import { downloadText, slug } from "../artifacts/ArtifactView";
import { shortName } from "../artifacts/text";

type Stage = "projects" | "start" | "versions" | "done";

const ENGINE_ID = "idea";

/** A project name nobody had to type: the first sentence of the idea,
 *  trimmed to a card-sized name. Still editable. */
function deriveIdeaName(seed: string): string {
  return shortName(seed) || "Untitled idea";
}

interface IdeaContent {
  /** Pre-2026-10 saves: the old compare-and-score list. Read, never written. */
  candidates?: IdeaCandidate[];
  selectedId?: string;
  decision?: IdeaDecision;
}

export default function IdeaStudio({
  onBack,
  onHandoff,
  card,
  initialAnswers,
}: {
  onBack: () => void;
  onHandoff: (engineId: string, answers: Record<string, string>) => void;
  card: React.CSSProperties;
  /** A plan handed over from the planner. Never make them retype it. */
  initialAnswers?: Record<string, string>;
}) {
  const [ready, setReady] = useState(false);
  const [saved, setSaved] = useState<CreationProject[]>([]);
  const [project, setProject] = useState<CreationProject | null>(null);
  const [stage, setStage] = useState<Stage>("start");
  const [answers, setAnswers] = useState<Record<string, string>>(initialAnswers ?? {});
  const [selectedId, setSelectedId] = useState<string>("");
  const [decision, setDecision] = useState<IdeaDecision | null>(null);
  const [editing, setEditing] = useState(false);
  const [flash, setFlash] = useState("");

  useEffect(() => {
    const existing = getProjectsByEngine(ENGINE_ID);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSaved(existing);
    // An arriving plan goes straight to the form it prefilled — showing the
    // project list instead would bury the thing they just handed us.
    if (existing.length > 0 && !initialAnswers) setStage("projects");
    setReady(true);
  }, [initialAnswers]);

  const say = (m: string) => { setFlash(m); setTimeout(() => setFlash(""), 2000); };
  const copy = async (text: string, what: string) => {
    try { await navigator.clipboard.writeText(text); say(`${what} copied`); }
    catch { say("Couldn't reach your clipboard — select the text and copy it by hand."); }
  };

  const persist = (patch: Partial<CreationProject>) => {
    if (!project) return;
    const latest = getProject(project.id) ?? project;
    const next = { ...latest, ...patch };
    updateProject(next);
    setProject(next);
    setSaved(getProjectsByEngine(ENGINE_ID));
  };

  const seed = answers.seed ?? "";
  const versions: IdeaVersion[] = seed.trim() ? ideaVersions(seed, answers.who ?? "") : [];
  const recommended = recommendVersion(seed, answers.constraint ?? "");
  const pickedLabel = versions.find((v) => v.id === selectedId)?.label ?? "Your version";

  // ---- PROJECTS ----
  const openProject = (p: CreationProject) => {
    setProject(p);
    setAnswers(p.answers);
    const c = (p.buildContent as IdeaContent) ?? {};
    setSelectedId(c.selectedId ?? "");
    setDecision(c.decision ?? null);
    setEditing(false);
    setStage(c.decision ? "done" : p.answers.seed ? "versions" : "start");
  };

  const startNew = () => {
    setProject(null); setAnswers({}); setSelectedId(""); setDecision(null); setEditing(false);
    setStage("start");
  };

  // ---- START ----
  const submitStart = () => {
    if (!answers.seed?.trim()) { say("Say the idea however it comes out"); return; }
    const name = answers.name?.trim() || deriveIdeaName(answers.seed);
    const filledAnswers = { ...answers, name };
    let p = project;
    if (!p) { p = createProject(ENGINE_ID, name, filledAnswers); setProject(p); }
    setAnswers(filledAnswers);
    const next = { ...p, name, answers: filledAnswers, status: "exploring" as const };
    updateProject(next); setProject(next); setSaved(getProjectsByEngine(ENGINE_ID));
    setStage("versions");
  };

  // ---- PICK → the finished decision ----
  const pick = (v: IdeaVersion) => {
    const d = decisionFor(v, seed, answers.who ?? "", answers.problem ?? "", recommended);
    setSelectedId(v.id);
    setDecision(d);
    setEditing(false);
    persist({ status: "approved", buildContent: { selectedId: v.id, decision: d } });
    setStage("done");
  };

  const saveEdit = () => {
    if (!decision) return;
    persist({ buildContent: { selectedId, decision } });
    setEditing(false);
    say("Saved");
  };

  // ---- STYLES ----
  const input = {
    width: "100%", boxSizing: "border-box" as const, background: "var(--surface)",
    border: "1px solid var(--line2)", borderRadius: 10, color: "var(--text)",
    padding: "11px 12px", fontSize: 15, fontFamily: "inherit",
  };

  if (!ready) return <div className="page"><div style={{ height: 200 }} /></div>;


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
            <h2 style={{ fontSize: 18, fontWeight: 900, marginBottom: 6 }}>What are you thinking about?</h2>
            <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 16 }}>
              Say it however it comes out. You&apos;ll get three ways to try it, one recommended, and leave with a decision, a dated first action, and how to tell if it worked.
            </p>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 13.5, fontWeight: 800, marginBottom: 4 }}>The idea, however it comes out</label>
              <textarea value={answers.seed || ""} onChange={(e) => setAnswers({ ...answers, seed: e.target.value })} placeholder="The thing you keep thinking about" style={{ ...input, minHeight: 90, resize: "vertical" }} />
            </div>
            {([
              ["who", "Who is it for? (optional)", "One specific person or group"],
              ["problem", "What problem or moment does it fit? (optional)", "Why it would matter to them"],
              ["name", "Project name (optional)", "A working name is fine"],
              ["constraint", "Biggest limit right now? (optional)", "Time, money, skills, a deadline"],
            ] as const).map(([key, label, placeholder]) => (
              <div key={key} style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 13.5, fontWeight: 800, marginBottom: 4 }}>{label}</label>
                <input value={answers[key] || ""} onChange={(e) => setAnswers({ ...answers, [key]: e.target.value })} placeholder={placeholder} style={input} />
              </div>
            ))}
            <button onClick={submitStart} disabled={!answers.seed?.trim()} style={{ width: "100%", marginTop: 8, opacity: !answers.seed?.trim() ? 0.5 : 1 }} className="btn btn-gold">
              Show me ways to try it →
            </button>
          </div>
        )}

        {/* ---- VERSIONS: the engine's work, one recommended ---- */}
        {stage === "versions" && (
          <div>
            <button onClick={() => setStage("start")} className="btn btn-ghost btn-small" style={{ marginBottom: 12 }}>← Change the idea</button>
            <div style={{ ...card, marginBottom: 14 }}>
              <h2 style={{ fontSize: 18, fontWeight: 900, margin: "0 0 6px" }}>Three ways to try it</h2>
              <p style={{ fontSize: 13.5, color: "var(--muted)", margin: 0, lineHeight: 1.5 }}>
                From the cheapest test to the full thing. Pick one — the decision, first action and next step are filled in for you.
              </p>
            </div>
            {versions.map((v) => {
              const isRec = v.id === recommended.id;
              return (
                <div key={v.id} style={{ ...card, marginBottom: 12, borderColor: isRec ? "var(--gold)" : undefined }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "baseline", flexWrap: "wrap" }}>
                    <h3 style={{ fontSize: 16, fontWeight: 900, margin: 0, color: "var(--text)" }}>{v.label}</h3>
                    <span style={{ fontSize: 12, fontWeight: 800, color: isRec ? "var(--gold)" : "var(--muted)" }}>{isRec ? "Recommended" : v.effort}</span>
                  </div>
                  <p style={{ fontSize: 14, color: "var(--text)", lineHeight: 1.55, margin: "6px 0 8px" }}>{v.what}</p>
                  <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.5, margin: "0 0 4px" }}><b style={{ color: "var(--text)" }}>Effort:</b> {v.effort} · <b style={{ color: "var(--text)" }}>Tools:</b> {v.tools}</p>
                  <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.5, margin: "0 0 10px" }}><b style={{ color: "var(--text)" }}>It worked if:</b> {v.test}</p>
                  {isRec && <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.5, margin: "0 0 10px" }}>Why this one: {recommended.why}.</p>}
                  <button onClick={() => pick(v)} className={`btn btn-small ${isRec ? "btn-gold" : "btn-ghost"}`}>Go with this →</button>
                </div>
              );
            })}
          </div>
        )}

        {/* ---- DONE: the finished decision ---- */}
        {stage === "done" && decision && (() => {
          const md = decisionToMarkdown(decision, project?.name ?? "Idea", pickedLabel);
          const target = HANDOFF_TARGETS.find((t) => t.engineId === decision.nextEngineId);
          const rows: [keyof IdeaDecision, string, boolean][] = [
            ["description", "The idea", true],
            ["intendedUser", "For", false],
            ["problem", "Why it matters", false],
            ["simplestFirstVersion", "First version", true],
            ["requiredTools", "Tools", false],
            ["firstAction", "First action", true],
            ["successTest", "How you'll know it worked", true],
          ];
          return (
            <div style={card}>
              <p style={{ fontSize: 12, fontWeight: 900, color: "var(--gold)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 4px" }}>Idea decision · {pickedLabel}</p>
              <h2 style={{ fontSize: 19, fontWeight: 900, margin: "0 0 6px" }}>{project?.name ?? "Your idea"}</h2>
              {decision.whyThis && <p style={{ fontSize: 13.5, color: "var(--muted)", margin: "0 0 14px", lineHeight: 1.5 }}>{decision.whyThis}</p>}
              {rows.map(([key, lbl, wide]) => {
                const value = (decision[key] as string | undefined) ?? "";
                if (!editing && !value) return null;
                return (
                  <div key={key} style={{ marginBottom: 12 }}>
                    <label htmlFor={`decision-${key}`} style={{ display: "block", fontSize: 12, fontWeight: 900, color: "var(--gold)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 3px" }}>{lbl}</label>
                    {editing ? (
                      wide
                        ? <textarea id={`decision-${key}`} value={value} onChange={(e) => setDecision({ ...decision, [key]: e.target.value })} style={{ ...input, minHeight: 60, resize: "vertical" }} />
                        : <input id={`decision-${key}`} value={value} onChange={(e) => setDecision({ ...decision, [key]: e.target.value })} style={input} />
                    ) : (
                      <p style={{ fontSize: 14, color: "var(--text)", margin: 0, lineHeight: 1.55 }}>{value}</p>
                    )}
                  </div>
                );
              })}
              {editing ? (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button onClick={saveEdit} className="btn btn-gold btn-small">Save edits</button>
                  <button onClick={() => setEditing(false)} className="btn btn-ghost btn-small">Cancel</button>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => onHandoff(decision.nextEngineId, handoffAnswers(decision, project?.name ?? "Idea"))}
                    className="btn btn-gold"
                    style={{ width: "100%", marginTop: 4 }}
                  >
                    Continue in the {target?.label ?? "next engine"} →
                  </button>
                  <p style={{ fontSize: 12.5, color: "var(--muted)", margin: "8px 0 12px" }}>
                    {target?.when} Your answers carry over — nothing to retype.
                  </p>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button onClick={() => copy(md, "Decision")} className="btn btn-ghost btn-small">Copy</button>
                    <button onClick={() => downloadText(`${slug(project?.name ?? "idea")}.md`, md)} className="btn btn-ghost btn-small">Download .md</button>
                    <button onClick={() => setEditing(true)} className="btn btn-ghost btn-small">Edit</button>
                    <button onClick={() => setStage("versions")} className="btn btn-ghost btn-small">Pick a different version</button>
                  </div>
                </>
              )}
            </div>
          );
        })()}
      </div>
    </main>
  );
}
