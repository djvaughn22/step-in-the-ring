"use client";

import { useEffect, useState } from "react";
import {
  type Sprint,
  type AllowanceEntry,
  linesFrom,
  sprintReadyState,
  generateTaskPacket,
  generateReport,
} from "./sprintLogic";

// ─────────────────────────────────────────────────────────────────────────────
// Five Hour Sprint Tool — plan, track, and report on focused AI builds
// ─────────────────────────────────────────────────────────────────────────────

const CASE_STUDIES = [
  {
    title: "DontCloneMeTom adoption-link integrity repair",
    deliverable: "Adoption URL resolution: registry decisions block legacy conflation",
    repository: "dont-clone-me-tom",
    startCommit: "d15a2bb",
    endCommit: "c490516",
    acceptanceCase: "Paco opens exact GetBuddy page; Macy shows shelter fallback; Lemon/Tango/Vida distinct",
    protectedSystems: "Registry authority preserved; Spencer dogs verified; Mastino honest fallback",
    testsPassed: "179/179",
    buildResult: "✓ Success",
    deploymentResult: "vercel auto-deploy on push",
    productionVerified: "Desktop + mobile widths verified; adoption links correct",
    failures: "Prior session had unverified placeholder suppressing valid RescueGroups URLs",
    corrections: "Explicit rejection blocks legacy URLs; unverified does not suppress valid dog URLs",
    remainingRisks: "None identified",
  },
  {
    title: "CrossHeartPray Life Essentials Deep Dive integration",
    deliverable: "Fix Life Essentials Deep Dive: pill was permanently stuck disabled",
    repository: "crossheartpray",
    startCommit: "044de93",
    endCommit: "cbe3f3c",
    acceptanceCase: "OT principle (Genesis 1:1) shows enabled Hebrew pill, opens shared modal with correct verse; NT principle (John 1:1) shows Greek; closing preserves the open principle",
    protectedSystems: "No external Bible links; Scripture stays in-app; Reading Plan Deep Dive untouched",
    testsPassed: "413/413 (37 files, 4 pre-existing skips)",
    buildResult: "✓ Success",
    deploymentResult: "vercel auto-deploy on push",
    productionVerified: "Live on crossheartpray.com: OT + NT pills open the shared modal with correct data; mobile width; console clean",
    failures: "Prior claimed commit (d4c891b) shipped a pill that was permanently stuck disabled — its loading effect depended on the state it wrote, discarding the fetched word study before it could render",
    corrections: "Adopted the ref-guard loading pattern already proven in ScriptureReader.tsx; aligned the enabled-check with hasVerifiedWordStudies(); fixed the modal's wordStudies prop, which was reading Object.values() on a Map (always empty)",
    remainingRisks: "None identified",
  },
];

export default function FiveHourSprintClient() {
  const [activeTab, setActiveTab] = useState<"planner" | "ledger" | "report" | "studies">("planner");
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [currentSprint, setCurrentSprint] = useState<Sprint | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [entries, setEntries] = useState<AllowanceEntry[]>([]);
  const [entryFormOpen, setEntryFormOpen] = useState(false);
  const [reportSprintId, setReportSprintId] = useState<string>("");
  const [reportText, setReportText] = useState<string>("");

  // SSR renders empty; saved sprints/ledger entries can only be read from
  // localStorage after mount, same pattern as ProjectsWorkspace.tsx.
  useEffect(() => {
    try {
      const savedSprints = localStorage.getItem("fhs-sprints");
      // eslint-disable-next-line react-hooks/set-state-in-effect -- restoring persisted state after mount, same pattern as the studios
      if (savedSprints) setSprints(JSON.parse(savedSprints));
      const savedEntries = localStorage.getItem("fhs-ledger");
      if (savedEntries) setEntries(JSON.parse(savedEntries));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("fhs-sprints", JSON.stringify(sprints));
    } catch {}
  }, [sprints]);

  useEffect(() => {
    try {
      localStorage.setItem("fhs-ledger", JSON.stringify(entries));
    } catch {}
  }, [entries]);

  function createSprint() {
    const newSprint: Sprint = {
      id: Date.now().toString(),
      deliverable: "",
      repository: "",
      branch: "",
      startCommit: "",
      acceptanceCase: "",
      protectedSystems: [],
      requiredChecks: ["npm test", "npm run lint", "npm run build", "git diff --check"],
      deploymentPath: "vercel (auto on push)",
      availableAllowance: 200,
      preparationAllowance: 20,
      implementationAllowance: 100,
      testingAllowance: 40,
      deploymentAllowance: 20,
      recoveryAllowance: 20,
      createdAt: new Date().toISOString(),
    };
    setSprints([...sprints, newSprint]);
    setCurrentSprint(newSprint);
    setFormOpen(true);
  }

  function updateSprint(updated: Sprint) {
    setSprints(sprints.map((s) => (s.id === updated.id ? updated : s)));
    setCurrentSprint(updated);
  }

  function deleteSprint(id: string) {
    setSprints(sprints.filter((s) => s.id !== id));
    if (currentSprint?.id === id) setCurrentSprint(null);
  }

  function addEntry(entry: AllowanceEntry) {
    setEntries([...entries, entry]);
  }

  function deleteEntry(id: string) {
    setEntries(entries.filter((e) => e.id !== id));
  }

  const reportSprint = sprints.find((s) => s.id === reportSprintId) ?? null;
  // Match by sprint id (the reliable checkpoint link). Entries saved before
  // this field existed have no sprintId — fall back to the old repository-
  // name match so nobody's already-logged work disappears from their report.
  const reportEntries = reportSprint
    ? entries.filter((e) => (e.sprintId ? e.sprintId === reportSprint.id : e.project === reportSprint.repository))
    : [];

  return (
    <main>
      <div className="page">
        <header className="mast">
          <span className="kicker">A way to work</span>
          <h1 className="mast-title">Five Hour Sprint</h1>
          <p className="mast-lead">
            Focus the work. Build for five hours. Finish something real. Plan the
            run below, keep the ledger while it happens, then write down what
            actually came out of it.
          </p>
          <hr className="rule mast-rule" />
        </header>

        <div style={{ display: "flex", gap: 6, margin: "26px 0 24px", borderBottom: "1px solid var(--line)", paddingBottom: 12, flexWrap: "wrap" }}>
          {(["planner", "ledger", "report", "studies"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: "8px 16px",
                border: "none",
                background: activeTab === tab ? "rgba(245,158,11,0.2)" : "transparent",
                color: activeTab === tab ? "var(--gold)" : "var(--muted)",
                fontSize: 14,
                fontWeight: 800,
                cursor: "pointer",
                borderRadius: 4,
              }}
            >
              {tab === "planner" && "Sprint Planner"}
              {tab === "ledger" && "Usage Ledger"}
              {tab === "report" && "Proof-of-Work"}
              {tab === "studies" && "Case Studies"}
            </button>
          ))}
        </div>

        {activeTab === "planner" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Sprint Planner</h2>
              <button
                onClick={createSprint}
                style={{
                  padding: "8px 16px",
                  background: "var(--gold)",
                  color: "#1A1408",
                  border: "none",
                  borderRadius: 4,
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                New Sprint
              </button>
            </div>

            {sprints.length === 0 ? (
              <p style={{ color: "var(--muted)", marginTop: 20 }}>No sprints yet. Create one to begin.</p>
            ) : (
              <div style={{ display: "grid", gap: 12 }}>
                {sprints.map((sprint) => (
                  <div
                    key={sprint.id}
                    onClick={() => {
                      setCurrentSprint(sprint);
                      setFormOpen(true);
                    }}
                    style={{
                      padding: 16,
                      border: "1px solid var(--line2)",
                      borderRadius: 5,
                      cursor: "pointer",
                      background: currentSprint?.id === sprint.id ? "rgba(245,158,11,0.1)" : "rgba(148,163,184,0.05)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ fontSize: 16, fontWeight: 800, margin: "0 0 6px", color: "var(--text)" }}>
                          {sprint.deliverable || "Untitled Sprint"}
                        </h3>
                        <p style={{ fontSize: 13, color: "var(--muted)", margin: "0 0 4px" }}>
                          {sprint.repository} @ {sprint.branch}
                        </p>
                        <p style={{ fontSize: 13, color: sprintReadyState(sprint) ? "#34D399" : "var(--gold)", fontWeight: 800, margin: 0 }}>
                          {sprintReadyState(sprint) ? "✓ Ready for Claude" : "⊘ Not ready yet"}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSprint(sprint.id);
                        }}
                        style={{
                          padding: "4px 8px",
                          background: "rgba(239,68,68,0.2)",
                          color: "#ef4444",
                          border: "none",
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 800,
                          cursor: "pointer",
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {formOpen && currentSprint && (
              <SprintForm
                sprint={currentSprint}
                onSave={(updated) => {
                  updateSprint(updated);
                  setFormOpen(false);
                }}
                onClose={() => setFormOpen(false)}
              />
            )}
          </div>
        )}

        {activeTab === "ledger" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Usage Ledger</h2>
              <button
                onClick={() => setEntryFormOpen(true)}
                style={{ padding: "8px 16px", background: "var(--gold)", color: "#1A1408", border: "none", borderRadius: 4, fontWeight: 800, cursor: "pointer" }}
              >
                Log Entry
              </button>
            </div>
            <p style={{ color: "var(--muted)", fontSize: 13 }}>
              No fabricated data — only actual measured tokens and real, verified results.
            </p>

            {entries.length === 0 ? (
              <p style={{ color: "var(--muted)", marginTop: 20 }}>No ledger entries yet.</p>
            ) : (
              <div style={{ display: "grid", gap: 12, marginTop: 20 }}>
                {entries.map((entry) => (
                  <div key={entry.id} style={{ padding: 16, border: "1px solid var(--line2)", borderRadius: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ fontSize: 15, fontWeight: 800, margin: "0 0 4px" }}>
                          {entry.project} — {entry.deliverable || "untitled"}
                        </h3>
                        <p style={{ fontSize: 13, color: "var(--muted)", margin: "0 0 4px" }}>
                          {entry.role} · {entry.actualUsed}k tokens ·{" "}
                          <span style={{ color: entry.verified ? "#34D399" : "var(--gold)", fontWeight: 800 }}>
                            {entry.verified ? "verified" : "unverified"}
                          </span>
                        </p>
                        {entry.outcomes.length > 0 && (
                          <p style={{ fontSize: 12, color: "var(--muted)", margin: 0 }}>Outcomes: {entry.outcomes.join("; ")}</p>
                        )}
                        {entry.incidents.length > 0 && (
                          <p style={{ fontSize: 12, color: "#ef4444", margin: "4px 0 0" }}>Incidents: {entry.incidents.join("; ")}</p>
                        )}
                      </div>
                      <button
                        onClick={() => deleteEntry(entry.id)}
                        style={{ padding: "4px 8px", background: "rgba(239,68,68,0.2)", color: "#ef4444", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 800, cursor: "pointer" }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {entryFormOpen && (
              <LedgerEntryForm
                sprints={sprints}
                onSave={(entry) => {
                  addEntry(entry);
                  setEntryFormOpen(false);
                }}
                onClose={() => setEntryFormOpen(false)}
              />
            )}
          </div>
        )}

        {activeTab === "report" && (
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 20 }}>Proof-of-Work Report</h2>
            <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 16 }}>
              Choose a sprint. The report pulls its ledger entries automatically (matched by repository) and includes
              commits, checks, deployment path, actual allowance used, and verified outcomes.
            </p>

            <select
              value={reportSprintId}
              onChange={(e) => {
                setReportSprintId(e.target.value);
                setReportText("");
              }}
              style={{ width: "100%", padding: "8px 12px", borderRadius: 4, border: "1px solid rgba(148,163,184,0.3)", background: "rgba(148,163,184,0.08)", color: "var(--text)", fontSize: 14, marginBottom: 16 }}
            >
              <option value="">Select a sprint…</option>
              {sprints.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.deliverable || "Untitled Sprint"} ({s.repository})
                </option>
              ))}
            </select>

            {reportSprint && (
              <button
                onClick={() => setReportText(generateReport(reportSprint, reportEntries))}
                style={{ padding: "10px 16px", background: "var(--gold)", color: "#1A1408", border: "none", borderRadius: 4, fontWeight: 800, cursor: "pointer", marginBottom: 16 }}
              >
                Generate Report
              </button>
            )}

            {reportText && (
              <div>
                <pre
                  style={{
                    whiteSpace: "pre-wrap",
                    fontSize: 13,
                    padding: 16,
                    border: "1px solid var(--line2)",
                    borderRadius: 5,
                    background: "rgba(148,163,184,0.05)",
                    fontFamily: "monospace",
                  }}
                >
                  {reportText}
                </pre>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(reportText).catch(() => {
                      alert("Couldn't copy to clipboard. Select and copy manually.");
                    });
                  }}
                  style={{ width: "100%", marginTop: 12, padding: "10px 16px", background: "#34D399", color: "#1A1408", border: "none", borderRadius: 4, fontWeight: 800, cursor: "pointer" }}
                >
                  Copy Report
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === "studies" && (
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 20 }}>Case Studies</h2>
            <p style={{ color: "var(--muted)" }}>Real verified work from this session.</p>
            <div style={{ display: "grid", gap: 20, marginTop: 24 }}>
              {CASE_STUDIES.map((study, idx) => (
                <div key={idx} style={{ border: "1px solid var(--line2)", borderRadius: 5, padding: 16 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 800, margin: "0 0 12px", color: "var(--text)" }}>{study.title}</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: 13, color: "var(--muted)" }}>
                    <div>
                      <p style={{ fontWeight: 800, color: "var(--text)", margin: "0 0 4px" }}>Repo</p>
                      <p style={{ margin: 0 }}>{study.repository}</p>
                    </div>
                    <div>
                      <p style={{ fontWeight: 800, color: "var(--text)", margin: "0 0 4px" }}>Commits</p>
                      <p style={{ margin: 0 }}>{study.startCommit.slice(0, 7)} → {study.endCommit.slice(0, 7)}</p>
                    </div>
                    <div>
                      <p style={{ fontWeight: 800, color: "var(--text)", margin: "0 0 4px" }}>Tests</p>
                      <p style={{ margin: 0, color: "#34D399" }}>{study.testsPassed}</p>
                    </div>
                    <div>
                      <p style={{ fontWeight: 800, color: "var(--text)", margin: "0 0 4px" }}>Build</p>
                      <p style={{ margin: 0, color: "#34D399" }}>{study.buildResult}</p>
                    </div>
                    <div style={{ gridColumn: "1 / -1" }}>
                      <p style={{ fontWeight: 800, color: "var(--text)", margin: "0 0 4px" }}>Acceptance Case</p>
                      <p style={{ margin: 0 }}>{study.acceptanceCase}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function SprintForm({ sprint, onSave, onClose }: { sprint: Sprint; onSave: (s: Sprint) => void; onClose: () => void }) {
  const [form, setForm] = useState(sprint);
  const [protectedSystemsText, setProtectedSystemsText] = useState(sprint.protectedSystems.join("\n"));
  const [requiredChecksText, setRequiredChecksText] = useState(sprint.requiredChecks.join("\n"));

  const liveForm: Sprint = {
    ...form,
    protectedSystems: linesFrom(protectedSystemsText),
    requiredChecks: linesFrom(requiredChecksText),
  };
  const ready = sprintReadyState(liveForm);

  function copyPacket() {
    const packet = generateTaskPacket(liveForm);
    navigator.clipboard.writeText(packet).catch(() => {
      alert("Couldn't copy to clipboard. Select and copy manually.");
    });
  }

  const fieldStyle = { width: "100%", padding: "8px 12px", borderRadius: 4, border: "1px solid rgba(148,163,184,0.3)", background: "rgba(148,163,184,0.08)", color: "var(--text)", fontSize: 14 };
  const labelStyle = { fontSize: 12, fontWeight: 800, color: "var(--muted)", display: "block" as const, marginBottom: 4 };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, overflowY: "auto" }}>
      <div style={{ background: "var(--bg)", border: "1px solid var(--line2)", borderRadius: 6, padding: 24, maxWidth: 520, maxHeight: "90vh", overflowY: "auto" }}>
        <h3 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 16px", color: "var(--text)" }}>Edit Sprint</h3>

        <div style={{ display: "grid", gap: 12, marginBottom: 20 }}>
          <label>
            <span style={labelStyle}>Deliverable *</span>
            <input type="text" value={form.deliverable} onChange={(e) => setForm({ ...form, deliverable: e.target.value })} style={fieldStyle} />
          </label>

          <label>
            <span style={labelStyle}>Repository *</span>
            <input type="text" value={form.repository} onChange={(e) => setForm({ ...form, repository: e.target.value })} style={fieldStyle} />
          </label>

          <label>
            <span style={labelStyle}>Branch *</span>
            <input type="text" value={form.branch} onChange={(e) => setForm({ ...form, branch: e.target.value })} style={fieldStyle} />
          </label>

          <label>
            <span style={labelStyle}>Start Commit *</span>
            <input type="text" value={form.startCommit} onChange={(e) => setForm({ ...form, startCommit: e.target.value })} style={fieldStyle} />
          </label>

          <label>
            <span style={labelStyle}>Acceptance Case *</span>
            <textarea value={form.acceptanceCase} onChange={(e) => setForm({ ...form, acceptanceCase: e.target.value })} style={{ ...fieldStyle, minHeight: 60, fontFamily: "monospace" }} />
          </label>

          <label>
            <span style={labelStyle}>Protected Systems * (one per line)</span>
            <textarea value={protectedSystemsText} onChange={(e) => setProtectedSystemsText(e.target.value)} style={{ ...fieldStyle, minHeight: 60, fontFamily: "monospace" }} />
          </label>

          <label>
            <span style={labelStyle}>Required Checks * (one per line)</span>
            <textarea value={requiredChecksText} onChange={(e) => setRequiredChecksText(e.target.value)} style={{ ...fieldStyle, minHeight: 60, fontFamily: "monospace" }} />
          </label>

          <label>
            <span style={labelStyle}>Deployment Path *</span>
            <input type="text" value={form.deploymentPath} onChange={(e) => setForm({ ...form, deploymentPath: e.target.value })} style={fieldStyle} />
          </label>

          <label>
            <span style={labelStyle}>Available allowance (k) *</span>
            <input type="number" value={form.availableAllowance} onChange={(e) => setForm({ ...form, availableAllowance: Number(e.target.value) })} style={fieldStyle} />
          </label>

          <span style={{ ...labelStyle, marginTop: 4 }}>Reserve the available allowance across:</span>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <label>
              <span style={labelStyle}>Preparation (k)</span>
              <input type="number" value={form.preparationAllowance} onChange={(e) => setForm({ ...form, preparationAllowance: Number(e.target.value) })} style={fieldStyle} />
            </label>
            <label>
              <span style={labelStyle}>Implementation (k)</span>
              <input type="number" value={form.implementationAllowance} onChange={(e) => setForm({ ...form, implementationAllowance: Number(e.target.value) })} style={fieldStyle} />
            </label>
            <label>
              <span style={labelStyle}>Testing/Correction (k)</span>
              <input type="number" value={form.testingAllowance} onChange={(e) => setForm({ ...form, testingAllowance: Number(e.target.value) })} style={fieldStyle} />
            </label>
            <label>
              <span style={labelStyle}>Deployment/Delivery (k)</span>
              <input type="number" value={form.deploymentAllowance} onChange={(e) => setForm({ ...form, deploymentAllowance: Number(e.target.value) })} style={fieldStyle} />
            </label>
            <label>
              <span style={labelStyle}>Recovery (k)</span>
              <input type="number" value={form.recoveryAllowance} onChange={(e) => setForm({ ...form, recoveryAllowance: Number(e.target.value) })} style={fieldStyle} />
            </label>
          </div>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={() => {
              onSave(liveForm);
              onClose();
            }}
            style={{ flex: 1, padding: "10px 16px", background: ready ? "var(--gold)" : "rgba(148,163,184,0.3)", color: ready ? "#0f172a" : "var(--muted)", border: "none", borderRadius: 4, fontWeight: 800, cursor: ready ? "pointer" : "not-allowed" }}
            disabled={!ready}
          >
            {ready ? "Save & Generate Packet" : "Complete required fields"}
          </button>
          <button onClick={onClose} style={{ padding: "10px 16px", background: "rgba(148,163,184,0.1)", color: "var(--muted)", border: "none", borderRadius: 4, fontWeight: 800, cursor: "pointer" }}>
            Cancel
          </button>
        </div>

        {ready && (
          <button onClick={copyPacket} style={{ width: "100%", marginTop: 12, padding: "10px 16px", background: "#34D399", color: "#1A1408", border: "none", borderRadius: 4, fontWeight: 800, cursor: "pointer" }}>
            Copy Task Packet
          </button>
        )}
      </div>
    </div>
  );
}

function LedgerEntryForm({ sprints, onSave, onClose }: { sprints: Sprint[]; onSave: (entry: AllowanceEntry) => void; onClose: () => void }) {
  const [sprintId, setSprintId] = useState(sprints[0]?.id ?? "");
  const [role, setRole] = useState("implementation");
  const [actualUsed, setActualUsed] = useState(0);
  const [verified, setVerified] = useState(false);
  const [outcomesText, setOutcomesText] = useState("");
  const [incidentsText, setIncidentsText] = useState("");

  const sprint = sprints.find((s) => s.id === sprintId) ?? null;
  const canSave = !!sprint && actualUsed > 0;
  const fieldStyle = { width: "100%", padding: "8px 12px", borderRadius: 4, border: "1px solid rgba(148,163,184,0.3)", background: "rgba(148,163,184,0.08)", color: "var(--text)", fontSize: 14 };
  const labelStyle = { fontSize: 12, fontWeight: 800, color: "var(--muted)", display: "block" as const, marginBottom: 4 };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, overflowY: "auto" }}>
      <div style={{ background: "var(--bg)", border: "1px solid var(--line2)", borderRadius: 6, padding: 24, maxWidth: 480, maxHeight: "90vh", overflowY: "auto" }}>
        <h3 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 16px", color: "var(--text)" }}>Log Ledger Entry</h3>

        <div style={{ display: "grid", gap: 12, marginBottom: 20 }}>
          <label>
            <span style={labelStyle}>Sprint *</span>
            {sprints.length === 0 ? (
              <p style={{ fontSize: 13, color: "var(--muted)", margin: 0 }}>Create a sprint first — a checkpoint has to belong to one.</p>
            ) : (
              <select value={sprintId} onChange={(e) => setSprintId(e.target.value)} style={fieldStyle}>
                {sprints.map((s) => (
                  <option key={s.id} value={s.id}>{s.deliverable || "Untitled Sprint"} ({s.repository || "no repo"})</option>
                ))}
              </select>
            )}
          </label>
          <label>
            <span style={labelStyle}>Role</span>
            <input type="text" value={role} onChange={(e) => setRole(e.target.value)} style={fieldStyle} />
          </label>
          <label>
            <span style={labelStyle}>Actual tokens used (k) *</span>
            <input type="number" value={actualUsed} onChange={(e) => setActualUsed(Number(e.target.value))} style={fieldStyle} />
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input type="checkbox" checked={verified} onChange={(e) => setVerified(e.target.checked)} />
            <span style={{ fontSize: 13, color: "var(--text)" }}>Outcome verified (tests/build/production checked)</span>
          </label>
          <label>
            <span style={labelStyle}>Outcomes (one per line)</span>
            <textarea value={outcomesText} onChange={(e) => setOutcomesText(e.target.value)} style={{ ...fieldStyle, minHeight: 50, fontFamily: "monospace" }} />
          </label>
          <label>
            <span style={labelStyle}>Incidents (one per line, optional)</span>
            <textarea value={incidentsText} onChange={(e) => setIncidentsText(e.target.value)} style={{ ...fieldStyle, minHeight: 40, fontFamily: "monospace" }} />
          </label>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={() => {
              if (!sprint) return;
              onSave({
                id: Date.now().toString(),
                sprintId: sprint.id,
                project: sprint.repository,
                deliverable: sprint.deliverable,
                role: role.trim() || "implementation",
                actualUsed,
                verified,
                outcomes: linesFrom(outcomesText),
                incidents: linesFrom(incidentsText),
                createdAt: new Date().toISOString(),
              });
            }}
            disabled={!canSave}
            style={{ flex: 1, padding: "10px 16px", background: canSave ? "var(--gold)" : "rgba(148,163,184,0.3)", color: canSave ? "#0f172a" : "var(--muted)", border: "none", borderRadius: 4, fontWeight: 800, cursor: canSave ? "pointer" : "not-allowed" }}
          >
            Save Entry
          </button>
          <button onClick={onClose} style={{ padding: "10px 16px", background: "rgba(148,163,184,0.1)", color: "var(--muted)", border: "none", borderRadius: 4, fontWeight: 800, cursor: "pointer" }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
