"use client";
/* eslint-disable react/no-unescaped-entities -- plain human copy; apostrophes are intentional */

// The project workspace — the persistent home of every project.
//
// A returning person sees, without digging: what the project is, what version
// one includes, what was deferred, what's still assumed, where it stands,
// what's been generated / tested / deployed, what's still unproven, the
// decisions already made, the current blocker, and ONE next action.

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { track } from "../lib/analytics";
import { newRecord, viewOf, withAnswers } from "../creation/record";
import { projectFromCreation, refreshProject } from "../project/from-creation";
import {
  advance, allowedTargets, approveScope, canTransition, nextAction,
  STATUS_LABEL, STATUS_ORDER,
} from "../project/lifecycle";
import {
  CLAIM_LEVEL_LABEL, EVIDENCE_RESULT_LABEL, EVIDENCE_TYPE_LABEL,
  ledgerLevel, newEvidenceId,
  type EvidenceEntry, type EvidenceEnvironment, type EvidenceResult, type EvidenceType,
} from "../project/evidence";
import {
  buildPackJson, buildPackMarkdown, builderAssignment, ownerSummary,
  recordOutput, testAssignment,
} from "../project/buildpack";
import type { OutputKind, ProjectRecordV1, ProjectStatus } from "../project/model";
import {
  deleteProjectRecord, loadAllProjects, saveProjectRecord,
} from "../project/store";

/* ── small helpers ────────────────────────────────────────────────────── */

function download(name: string, text: string, mime: string) {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

const slug = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "project";

const dateOf = (iso: string) => iso.slice(0, 10);

const RESULT_TONE: Record<EvidenceResult, string> = {
  pass: "#4ade80", fail: "#fbbf24", blocked: "#fbbf24",
  "not-applicable": "var(--muted)", unverified: "var(--muted)",
};

/* ── the workspace ────────────────────────────────────────────────────── */

export default function ProjectsWorkspace() {
  const [projects, setProjects] = useState<ProjectRecordV1[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [flash, setFlash] = useState("");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- SSR renders empty; saved projects can only be read from localStorage after mount
    setProjects(loadAllProjects());
    try {
      const p = new URLSearchParams(window.location.search).get("p");
      if (p) setSelectedId(p);
    } catch {}
    setLoaded(true);
  }, []);

  const selected = useMemo(
    () => projects.find((p) => p.projectId === selectedId) ?? null,
    [projects, selectedId],
  );

  function say(msg: string) {
    setFlash(msg);
    window.setTimeout(() => setFlash(""), 3000);
  }

  function put(p: ProjectRecordV1) {
    setProjects(saveProjectRecord(p));
  }

  function open(id: string | null) {
    setSelectedId(id);
    try {
      const url = new URL(window.location.href);
      if (id) url.searchParams.set("p", id);
      else url.searchParams.delete("p");
      window.history.replaceState(null, "", url.toString());
    } catch {}
    window.scrollTo({ top: 0 });
  }

  if (!loaded) return <main><div className="page" /></main>;

  return (
    <main>
      <div className="page">
        {selected ? (
          <ProjectDetail
            project={selected}
            onChange={put}
            onDelete={(id) => { setProjects(deleteProjectRecord(id)); open(null); }}
            onBack={() => open(null)}
            say={say}
          />
        ) : (
          <ProjectList
            projects={projects}
            onOpen={open}
            onCreate={(p) => { put(p); open(p.projectId); }}
          />
        )}
        <span role="status" aria-live="polite" className="tiny">{flash}</span>
      </div>
    </main>
  );
}

/* ── list + intake ────────────────────────────────────────────────────── */

function ProjectList({
  projects, onOpen, onCreate,
}: {
  projects: ProjectRecordV1[];
  onOpen: (id: string) => void;
  onCreate: (p: ProjectRecordV1) => void;
}) {
  const [idea, setIdea] = useState("");

  function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!idea.trim()) return;
    const project = projectFromCreation(newRecord(idea));
    track("project_created", { adapter: project.adapterId });
    onCreate(project);
  }

  return (
    <>
      <header style={{ marginBottom: 20 }}>
        <p className="kicker">Your projects</p>
        <h1>Projects</h1>
        <p className="field-help">
          Each project keeps its whole story: your words, what we read into them,
          the approved scope, and the evidence. Nothing here claims more than it can prove.
        </p>
      </header>

      <form onSubmit={handleCreate} className="card" style={{ marginBottom: 20 }}>
        <label htmlFor="new-project-idea" className="plan-label">Start a project</label>
        <textarea
          id="new-project-idea"
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          rows={3}
          maxLength={2000}
          placeholder="Say it the way it comes out. What do you want to build?"
          style={{ width: "100%", marginTop: 8 }}
        />
        <div className="actions" style={{ marginTop: 10 }}>
          <button type="submit" className="btn btn-primary" disabled={!idea.trim()}>
            Interpret it
          </button>
        </div>
      </form>

      {projects.length === 0 ? (
        <p className="field-help">No projects yet. Say an idea above — you'll get back what it really is, and it stays here.</p>
      ) : (
        <div className="stack">
          {projects.map((p) => {
            const act = nextAction(p);
            return (
              <button
                key={p.projectId}
                className="card"
                onClick={() => onOpen(p.projectId)}
                style={{ textAlign: "left", cursor: "pointer", width: "100%" }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                  <strong>{p.name}</strong>
                  <span className="pill">{STATUS_LABEL[p.status]}</span>
                </div>
                <p className="tiny" style={{ marginTop: 6 }}>
                  Next: {act.label}
                </p>
                <p className="tiny" style={{ color: "var(--muted)" }}>Updated {dateOf(p.updatedAt)}</p>
              </button>
            );
          })}
        </div>
      )}
    </>
  );
}

/* ── detail ───────────────────────────────────────────────────────────── */

function ProjectDetail({
  project: p, onChange, onDelete, onBack, say,
}: {
  project: ProjectRecordV1;
  onChange: (p: ProjectRecordV1) => void;
  onDelete: (id: string) => void;
  onBack: () => void;
  say: (msg: string) => void;
}) {
  const [armDelete, setArmDelete] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(p.creation.originalIdea);
  const [answerDraft, setAnswerDraft] = useState("");
  const [blockerDraft, setBlockerDraft] = useState("");

  const act = nextAction(p);
  const approved = !!p.scopeApprovedAt;
  const question = p.report.clarifying[0] ?? null;

  /* actions */

  function approve() {
    const next = approveScope(p, "Approved in the workspace.");
    track("project_scope_approved", {});
    onChange(next);
    say("Scope approved. The brief is now frozen.");
  }

  function move(to: ProjectStatus) {
    const res = advance(p, to, "Moved in the workspace.");
    if (!res.ok) { say(res.why ?? "That move isn't allowed yet."); return; }
    onChange(res.project);
  }

  function saveIdeaEdit() {
    if (!draft.trim()) return;
    const next = refreshProject({
      ...p,
      creation: { ...p.creation, originalIdea: draft.trim().slice(0, 4000), updatedAt: new Date().toISOString() },
    });
    onChange(next);
    setEditing(false);
    say("Re-interpreted from the new words.");
  }

  function answerQuestion(e: FormEvent) {
    e.preventDefault();
    if (!question) return;
    const key = viewOf(p.creation).interpretation.openQuestions[0]?.key;
    if (!key) return;
    const next = refreshProject({ ...p, creation: withAnswers(p.creation, { [key]: answerDraft }) });
    onChange(next);
    setAnswerDraft("");
    say("Answer folded in. The interpretation was rebuilt.");
  }

  function exportOutput(kind: OutputKind) {
    const stamp = slug(p.name);
    if (kind === "build-pack-md") {
      download(`${stamp}-build-pack.md`, buildPackMarkdown(p), "text/markdown");
      onChange(recordOutput(p, kind, "Build Pack (Markdown)"));
    } else if (kind === "build-pack-json") {
      download(`${stamp}-build-pack.json`, buildPackJson(p), "application/json");
      onChange(recordOutput(p, kind, "Build Pack (JSON)"));
    } else if (kind === "builder-assignment") {
      const a = builderAssignment(p);
      if (!a.ok) { say(a.why ?? "Not available yet."); return; }
      download(`${stamp}-builder-assignment.md`, a.text!, "text/markdown");
      onChange(recordOutput(p, kind, "Claude builder assignment"));
    } else if (kind === "test-assignment") {
      download(`${stamp}-test-assignment.md`, testAssignment(p), "text/markdown");
      onChange(recordOutput(p, kind, "Test & verification assignment"));
    } else if (kind === "owner-summary") {
      download(`${stamp}-owner-summary.md`, ownerSummary(p), "text/markdown");
      onChange(recordOutput(p, kind, "Owner summary"));
    }
  }

  function addEvidence(entry: EvidenceEntry) {
    onChange({ ...p, evidence: [...p.evidence, entry], updatedAt: new Date().toISOString() });
    say("Evidence recorded.");
  }

  /* derived proof view */
  const criteriaLevels = p.brief.acceptanceCriteria.map((c) => ({
    criterion: c,
    level: ledgerLevel(p.evidence.filter((e) => e.criterion === c)),
  }));

  return (
    <>
      <div className="actions" style={{ marginBottom: 14 }}>
        <button className="btn btn-ghost btn-small" onClick={onBack}>← All projects</button>
      </div>

      <header style={{ marginBottom: 16 }}>
        <h1 style={{ marginBottom: 6 }}>{p.name}</h1>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          {STATUS_ORDER.map((s) => (
            <span
              key={s}
              className="pill"
              style={s === p.status
                ? { borderColor: "var(--gold)", color: "var(--gold)", fontWeight: 700 }
                : { opacity: STATUS_ORDER.indexOf(s) <= STATUS_ORDER.indexOf(p.status) ? 0.9 : 0.45 }}
            >
              {STATUS_LABEL[s]}
            </span>
          ))}
          {(p.status === "paused" || p.status === "rejected" || p.status === "build-failed") && (
            <span className="pill" style={{ borderColor: "#fbbf24", color: "#fbbf24" }}>{STATUS_LABEL[p.status]}</span>
          )}
        </div>
      </header>

      {/* THE one next action */}
      <div className="card" style={{ borderColor: "var(--gold)", marginBottom: 16 }}>
        <p className="plan-label">Next action — {act.who === "owner" ? "yours" : act.who}</p>
        <p style={{ marginTop: 6 }}>{act.label}</p>
        {p.status === "scope-awaiting-approval" && !approved && (
          <div className="actions" style={{ marginTop: 10 }}>
            <button className="btn btn-gold" onClick={approve}>Approve version-one scope</button>
            <button className="btn btn-ghost btn-small" onClick={() => { setEditing(true); setDraft(p.creation.originalIdea); }}>
              Fix the idea first
            </button>
          </div>
        )}
      </div>

      {/* blocker */}
      <div className="card" style={{ marginBottom: 16 }}>
        <p className="plan-label">Blocker</p>
        {p.blocker ? (
          <>
            <p style={{ marginTop: 6 }}>{p.blocker}</p>
            <div className="actions" style={{ marginTop: 8 }}>
              <button className="btn btn-ghost btn-small" onClick={() => onChange({ ...p, blocker: null, updatedAt: new Date().toISOString() })}>
                Cleared
              </button>
            </div>
          </>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!blockerDraft.trim()) return;
              onChange({ ...p, blocker: blockerDraft.trim(), updatedAt: new Date().toISOString() });
              setBlockerDraft("");
            }}
            className="actions"
            style={{ marginTop: 8, alignItems: "stretch" }}
          >
            <label htmlFor="blocker-input" className="tiny" style={{ alignSelf: "center" }}>None. If something is stopping this:</label>
            <input
              id="blocker-input"
              value={blockerDraft}
              onChange={(e) => setBlockerDraft(e.target.value)}
              maxLength={300}
              placeholder="What exactly is in the way?"
            />
            <button type="submit" className="btn btn-ghost btn-small" disabled={!blockerDraft.trim()}>Set</button>
          </form>
        )}
      </div>

      {/* the idea + edit */}
      <div className="card" style={{ marginBottom: 16 }}>
        <p className="plan-label">Their words {approved && <span className="tiny">(frozen at approval)</span>}</p>
        {editing && !approved ? (
          <>
            <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={4} maxLength={4000} style={{ width: "100%", marginTop: 8 }} />
            <div className="actions" style={{ marginTop: 8 }}>
              <button className="btn btn-primary" onClick={saveIdeaEdit} disabled={!draft.trim()}>Re-interpret</button>
              <button className="btn btn-ghost btn-small" onClick={() => setEditing(false)}>Cancel</button>
            </div>
          </>
        ) : (
          <>
            <p style={{ marginTop: 6 }}>“{p.creation.originalIdea}”</p>
            {!approved && (
              <div className="actions" style={{ marginTop: 8 }}>
                <button className="btn btn-ghost btn-small" onClick={() => { setEditing(true); setDraft(p.creation.originalIdea); }}>
                  Edit and re-interpret
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* clarifying question */}
      {question && !approved && (
        <div className="card" style={{ marginBottom: 16 }}>
          <p className="plan-label">One question worth answering</p>
          <p style={{ marginTop: 6 }}>{question.question}</p>
          <p className="tiny" style={{ marginTop: 4 }}>{question.why} Skipping is fine — the labelled assumption stands.</p>
          <form onSubmit={answerQuestion} className="actions" style={{ marginTop: 8 }}>
            <label htmlFor="clarify-input" className="tiny" style={{ position: "absolute", left: -9999 }}>Your answer</label>
            <input
              id="clarify-input"
              value={answerDraft}
              onChange={(e) => setAnswerDraft(e.target.value)}
              maxLength={600}
              placeholder="Your answer"
            />
            <button type="submit" className="btn btn-ghost btn-small" disabled={!answerDraft.trim()}>Fold it in</button>
          </form>
        </div>
      )}

      {/* the labelled reading */}
      <ReportSection title="They said" items={p.report.userSaid} />
      <ReportSection
        title="We read"
        items={p.report.systemInterpreted.map((x) => `${x.text} — ${x.basis}`)}
      />
      <ReportSection title="Assumed (correct us)" items={p.report.assumed} />
      <ReportSection title="Missing" items={p.report.missing} />
      <ReportSection title="Version one" items={p.report.versionOne} strong />
      <ReportSection title="Not in version one (their call)" items={p.brief.nonGoals} />
      <ReportSection title="Deferred (our call — parked, not forgotten)" items={p.report.deferred} />
      <ReportSection title="Recommended" items={p.report.recommended} />

      {/* proof — what's real vs claimed */}
      <div className="card" style={{ marginBottom: 16 }}>
        <p className="plan-label">What's proven — and what isn't</p>
        {criteriaLevels.length === 0 ? (
          <p className="tiny" style={{ marginTop: 6 }}>No acceptance criteria yet.</p>
        ) : (
          <ul className="plan-list" style={{ marginTop: 8 }}>
            {criteriaLevels.map(({ criterion, level }) => (
              <li key={criterion} style={{ display: "flex", gap: 8, justifyContent: "space-between", flexWrap: "wrap" }}>
                <span>{criterion}</span>
                <span className="pill" style={level === "planned" ? { opacity: 0.6 } : { borderColor: "#4ade80", color: "#4ade80" }}>
                  {CLAIM_LEVEL_LABEL[level]}
                </span>
              </li>
            ))}
          </ul>
        )}
        <p className="tiny" style={{ marginTop: 8 }}>
          A criterion only moves off “planned” when evidence below names it. Deployed is not verified;
          mocked is not integrated; generated is not working.
        </p>
      </div>

      {/* evidence ledger */}
      <EvidenceLedger project={p} onAdd={addEvidence} />

      {/* outputs */}
      <div className="card" style={{ marginBottom: 16 }}>
        <p className="plan-label">Generate & export</p>
        {!approved && (
          <p className="tiny" style={{ marginTop: 6 }}>
            The Build Pack downloads as a draft until the scope is approved. The builder assignment
            needs the approval — that's the gate doing its job.
          </p>
        )}
        <div className="actions" style={{ marginTop: 10, flexWrap: "wrap" }}>
          <button className="btn btn-ghost btn-small" onClick={() => exportOutput("build-pack-md")}>Build Pack (.md)</button>
          <button className="btn btn-ghost btn-small" onClick={() => exportOutput("build-pack-json")}>Build Pack (.json)</button>
          <button className="btn btn-ghost btn-small" onClick={() => exportOutput("builder-assignment")}>Claude builder assignment</button>
          <button className="btn btn-ghost btn-small" onClick={() => exportOutput("test-assignment")}>Test assignment</button>
          <button className="btn btn-ghost btn-small" onClick={() => exportOutput("owner-summary")}>Owner summary</button>
        </div>
        {p.outputs.length > 0 && (
          <ul className="plan-list" style={{ marginTop: 10 }}>
            {p.outputs.slice(-6).map((o) => (
              <li key={o.id} className="tiny">{dateOf(o.at)} — {o.label}</li>
            ))}
          </ul>
        )}
      </div>

      {/* status moves */}
      <div className="card" style={{ marginBottom: 16 }}>
        <p className="plan-label">Move it forward</p>
        <div className="actions" style={{ marginTop: 10, flexWrap: "wrap" }}>
          {allowedTargets(p).map((to) => {
            const check = canTransition(p, to);
            return (
              <button
                key={to}
                className="btn btn-ghost btn-small"
                aria-disabled={!check.ok}
                title={check.ok ? undefined : check.why}
                onClick={() => move(to)}
                style={check.ok ? undefined : { opacity: 0.5 }}
              >
                {STATUS_LABEL[to]}
              </button>
            );
          })}
        </div>
        <p className="tiny" style={{ marginTop: 8 }}>
          Greyed moves say why when tapped. “Verified live” stays locked until a passing
          production check is in the ledger.
        </p>
      </div>

      {/* decisions + history */}
      {(p.decisions.length > 0 || p.statusHistory.length > 0) && (
        <div className="card" style={{ marginBottom: 16 }}>
          <p className="plan-label">Decisions & history</p>
          <ul className="plan-list" style={{ marginTop: 8 }}>
            {p.decisions.map((d) => (
              <li key={d.id}>{dateOf(d.at)} — {d.by}: {d.decision}{d.note ? ` (${d.note})` : ""}</li>
            ))}
            {p.statusHistory.map((h, n) => (
              <li key={n} className="tiny" style={{ color: "var(--muted)" }}>
                {dateOf(h.at)} — {STATUS_LABEL[h.status]}{h.note ? ` — ${h.note}` : ""}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="actions" style={{ marginBottom: 30 }}>
        {armDelete ? (
          <>
            <button className="btn btn-ghost btn-small" onClick={() => onDelete(p.projectId)} style={{ color: "#fbbf24" }}>
              Yes, delete this project
            </button>
            <button className="btn btn-ghost btn-small" onClick={() => setArmDelete(false)}>Keep it</button>
          </>
        ) : (
          <button className="btn btn-ghost btn-small" onClick={() => setArmDelete(true)}>Delete project…</button>
        )}
      </div>
    </>
  );
}

/* ── pieces ───────────────────────────────────────────────────────────── */

function ReportSection({ title, items, strong }: { title: string; items: string[]; strong?: boolean }) {
  if (!items.length) return null;
  return (
    <div className="card" style={{ marginBottom: 16, ...(strong ? { borderColor: "var(--accent, #60A5FA)" } : {}) }}>
      <p className="plan-label">{title}</p>
      <ul className="plan-list" style={{ marginTop: 8 }}>
        {items.map((x, n) => <li key={n}>{x}</li>)}
      </ul>
    </div>
  );
}

const EV_TYPES = Object.keys(EVIDENCE_TYPE_LABEL) as EvidenceType[];
const EV_RESULTS = Object.keys(EVIDENCE_RESULT_LABEL) as EvidenceResult[];
const EV_ENVS: EvidenceEnvironment[] = ["local", "ci", "preview", "production", "sandbox"];

function EvidenceLedger({ project: p, onAdd }: { project: ProjectRecordV1; onAdd: (e: EvidenceEntry) => void }) {
  const [claim, setClaim] = useState("");
  const [ran, setRan] = useState("");
  const [summary, setSummary] = useState("");
  const [type, setType] = useState<EvidenceType>("manual-check");
  const [result, setResult] = useState<EvidenceResult>("pass");
  const [environment, setEnvironment] = useState<EvidenceEnvironment>("local");
  const [criterion, setCriterion] = useState("");

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!claim.trim() || !ran.trim()) return;
    onAdd({
      id: newEvidenceId(),
      claim: claim.trim(),
      type,
      ran: ran.trim(),
      summary: summary.trim(),
      result,
      at: new Date().toISOString(),
      environment,
      criterion: criterion || undefined,
      producedBy: "owner",
    });
    setClaim(""); setRan(""); setSummary("");
  }

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <p className="plan-label">Evidence ledger</p>
      {p.evidence.length === 0 ? (
        <p className="tiny" style={{ marginTop: 6 }}>
          Empty — which means nothing is proven yet, and the workspace says so.
        </p>
      ) : (
        <ul className="plan-list" style={{ marginTop: 8 }}>
          {p.evidence.map((e) => (
            <li key={e.id}>
              <span style={{ color: RESULT_TONE[e.result], fontWeight: 700 }}>
                [{EVIDENCE_RESULT_LABEL[e.result]}]
              </span>{" "}
              {e.claim} — <span className="tiny">{e.ran} · {EVIDENCE_TYPE_LABEL[e.type]} · {e.environment} · {dateOf(e.at)} · by {e.producedBy}</span>
              {e.summary && <span className="tiny" style={{ display: "block", color: "var(--muted)" }}>{e.summary}</span>}
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={submit} className="stack" style={{ marginTop: 12, gap: 8 }}>
        <div>
          <label htmlFor="ev-claim" className="tiny">The claim being tested</label>
          <input id="ev-claim" value={claim} onChange={(e) => setClaim(e.target.value)} maxLength={300}
            placeholder="e.g. Ratings survive a reload" style={{ width: "100%" }} />
        </div>
        <div>
          <label htmlFor="ev-ran" className="tiny">What ran (command, URL, or manual steps)</label>
          <input id="ev-ran" value={ran} onChange={(e) => setRan(e.target.value)} maxLength={400}
            placeholder="e.g. npm test · saved, reloaded, checked" style={{ width: "100%" }} />
        </div>
        <div className="actions" style={{ flexWrap: "wrap" }}>
          <label className="tiny" htmlFor="ev-type">Type</label>
          <select id="ev-type" style={{ maxWidth: "100%" }} value={type} onChange={(e) => setType(e.target.value as EvidenceType)}>
            {EV_TYPES.map((t) => <option key={t} value={t}>{EVIDENCE_TYPE_LABEL[t]}</option>)}
          </select>
          <label className="tiny" htmlFor="ev-result">Result</label>
          <select id="ev-result" style={{ maxWidth: "100%" }} value={result} onChange={(e) => setResult(e.target.value as EvidenceResult)}>
            {EV_RESULTS.map((r) => <option key={r} value={r}>{EVIDENCE_RESULT_LABEL[r]}</option>)}
          </select>
          <label className="tiny" htmlFor="ev-env">Where</label>
          <select id="ev-env" style={{ maxWidth: "100%" }} value={environment} onChange={(e) => setEnvironment(e.target.value as EvidenceEnvironment)}>
            {EV_ENVS.map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
        {p.brief.acceptanceCriteria.length > 0 && (
          <div>
            <label htmlFor="ev-criterion" className="tiny">Speaks to (optional)</label>
            <select id="ev-criterion" value={criterion} onChange={(e) => setCriterion(e.target.value)} style={{ width: "100%" }}>
              <option value="">— no specific criterion —</option>
              {p.brief.acceptanceCriteria.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        )}
        <div>
          <label htmlFor="ev-summary" className="tiny">Safe one-line result (no secrets)</label>
          <input id="ev-summary" value={summary} onChange={(e) => setSummary(e.target.value)} maxLength={600}
            placeholder="e.g. 12 tests, all green" style={{ width: "100%" }} />
        </div>
        <div className="actions">
          <button type="submit" className="btn btn-ghost btn-small" disabled={!claim.trim() || !ran.trim()}>
            Record evidence
          </button>
        </div>
      </form>
    </div>
  );
}
