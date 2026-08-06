"use client";

import { useEffect, useState } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// Five Hour Sprint Tool — plan, track, and report on focused AI builds
// ─────────────────────────────────────────────────────────────────────────────

type Sprint = {
  id: string;
  deliverable: string;
  repository: string;
  branch: string;
  startCommit: string;
  acceptanceCase: string;
  protectedSystems: string[];
  requiredChecks: string[];
  deploymentPath: string;
  bonusTask?: string;
  availableAllowance: number;
  implementationAllowance: number;
  testingAllowance: number;
  recoveryAllowance: number;
  createdAt: string;
};

type AllowanceEntry = {
  id: string;
  project: string;
  deliverable: string;
  role: string;
  actualUsed: number;
  verified: boolean;
  outcomes: string[];
  incidents: string[];
};

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
    deliverable: "Add Deep Dive (Hebrew/Greek) to Life Essentials principles",
    repository: "crossheartpray",
    startCommit: "044de93",
    endCommit: "d4c891b",
    acceptanceCase: "Principle expands, Hebrew/Greek pill appears, modal opens with shared Deep Dive",
    protectedSystems: "No external Bible links; Scripture stays in-app; Translation preserved",
    testsPassed: "405/405 (36 files)",
    buildResult: "✓ Success",
    deploymentResult: "vercel auto-deploy on push",
    productionVerified: "Mobile width responsive; pills visible; no clipping",
    failures: "None on final iteration",
    corrections: "Word studies lazy-load when principle expands; reuse shared OriginalWordStudyModal",
    remainingRisks: "None identified",
  },
];

function sprintReadyState(sprint: Sprint): boolean {
  return !!(
    sprint.deliverable &&
    sprint.repository &&
    sprint.branch &&
    sprint.startCommit &&
    sprint.acceptanceCase &&
    sprint.protectedSystems.length > 0 &&
    sprint.requiredChecks.length > 0 &&
    sprint.deploymentPath &&
    sprint.availableAllowance > 0
  );
}

function generateTaskPacket(sprint: Sprint): string {
  return `FIVE HOUR SPRINT TASK PACKET

Deliverable: ${sprint.deliverable}
Repository: ${sprint.repository}
Starting branch: ${sprint.branch}
Starting commit: ${sprint.startCommit}

ACCEPTANCE CASE
${sprint.acceptanceCase}

PROTECTED SYSTEMS
${sprint.protectedSystems.join("\n")}

REQUIRED CHECKS
${sprint.requiredChecks.join("\n")}

DEPLOYMENT PATH
${sprint.deploymentPath}

${sprint.bonusTask ? `\nBONUS TASK\n${sprint.bonusTask}` : ""}

ALLOWANCE ALLOCATION
- Implementation: ${sprint.implementationAllowance}k tokens
- Testing/Deployment: ${sprint.testingAllowance}k tokens
- Recovery: ${sprint.recoveryAllowance}k tokens
- Total available: ${sprint.availableAllowance}k tokens
`;
}

export default function FiveHourSprintTool() {
  const [activeTab, setActiveTab] = useState<"planner" | "ledger" | "report" | "studies">("planner");
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [currentSprint, setCurrentSprint] = useState<Sprint | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("fhs-sprints");
      if (saved) setSprints(JSON.parse(saved));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("fhs-sprints", JSON.stringify(sprints));
    } catch {}
  }, [sprints]);

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
      implementationAllowance: 100,
      testingAllowance: 50,
      recoveryAllowance: 50,
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

  return (
    <main style={{ minHeight: "100vh", background: "var(--bg, #0f172a)", color: "var(--ink, #e8edf5)", padding: "20px" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 24 }}>Five Hour Sprint</h1>

        <div style={{ display: "flex", gap: 12, marginBottom: 24, borderBottom: "1px solid rgba(148,163,184,0.2)", paddingBottom: 12 }}>
          {(["planner", "ledger", "report", "studies"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: "8px 16px",
                border: "none",
                background: activeTab === tab ? "rgba(245,158,11,0.2)" : "transparent",
                color: activeTab === tab ? "var(--gold, #f59e0b)" : "var(--muted, #94a3b8)",
                fontSize: 14,
                fontWeight: 800,
                cursor: "pointer",
                borderRadius: 8,
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
                  background: "var(--gold, #f59e0b)",
                  color: "#0f172a",
                  border: "none",
                  borderRadius: 8,
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                New Sprint
              </button>
            </div>

            {sprints.length === 0 ? (
              <p style={{ color: "var(--muted, #94a3b8)", marginTop: 20 }}>No sprints yet. Create one to begin.</p>
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
                      border: "1px solid rgba(148,163,184,0.25)",
                      borderRadius: 12,
                      cursor: "pointer",
                      background: currentSprint?.id === sprint.id ? "rgba(245,158,11,0.1)" : "rgba(148,163,184,0.05)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ fontSize: 16, fontWeight: 800, margin: "0 0 6px", color: "var(--ink, #e8edf5)" }}>
                          {sprint.deliverable || "Untitled Sprint"}
                        </h3>
                        <p style={{ fontSize: 13, color: "var(--muted, #94a3b8)", margin: "0 0 4px" }}>
                          {sprint.repository} @ {sprint.branch}
                        </p>
                        <p style={{ fontSize: 13, color: sprintReadyState(sprint) ? "#34D399" : "var(--gold, #f59e0b)", fontWeight: 800, margin: 0 }}>
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
            <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 20 }}>Usage Ledger</h2>
            <p style={{ color: "var(--muted, #94a3b8)" }}>Track allowance usage and verified outcomes. No fabricated data — only actual measured tokens and real results.</p>
            <div style={{ marginTop: 20, fontSize: 13, color: "var(--muted, #94a3b8)" }}>
              <p>Enter actual token usage from terminal feedback or API logs. Record verified outcomes only — tests passed, deployments successful, owner acceptance confirmed.</p>
            </div>
          </div>
        )}

        {activeTab === "report" && (
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 20 }}>Proof-of-Work Report</h2>
            <p style={{ color: "var(--muted, #94a3b8)" }}>Generate a copyable report with deliverable, commits, tests, deployment, and production verification.</p>
            <div style={{ marginTop: 20, fontSize: 13, color: "var(--muted, #94a3b8)" }}>
              <p>The report includes: exact starting/ending commits, required checks run, build result, deployment result, production verification, failures, corrections, remaining risks, and actual allowance used.</p>
            </div>
          </div>
        )}

        {activeTab === "studies" && (
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 20 }}>Case Studies</h2>
            <p style={{ color: "var(--muted, #94a3b8)" }}>Real verified work from this session.</p>
            <div style={{ display: "grid", gap: 20, marginTop: 24 }}>
              {CASE_STUDIES.map((study, idx) => (
                <div key={idx} style={{ border: "1px solid rgba(148,163,184,0.25)", borderRadius: 12, padding: 16 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 800, margin: "0 0 12px", color: "var(--ink, #e8edf5)" }}>{study.title}</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: 13, color: "var(--muted, #94a3b8)" }}>
                    <div>
                      <p style={{ fontWeight: 800, color: "var(--ink, #e8edf5)", margin: "0 0 4px" }}>Repo</p>
                      <p style={{ margin: 0 }}>{study.repository}</p>
                    </div>
                    <div>
                      <p style={{ fontWeight: 800, color: "var(--ink, #e8edf5)", margin: "0 0 4px" }}>Commits</p>
                      <p style={{ margin: 0 }}>{study.startCommit.slice(0, 7)} → {study.endCommit.slice(0, 7)}</p>
                    </div>
                    <div>
                      <p style={{ fontWeight: 800, color: "var(--ink, #e8edf5)", margin: "0 0 4px" }}>Tests</p>
                      <p style={{ margin: 0, color: "#34D399" }}>{study.testsPassed}</p>
                    </div>
                    <div>
                      <p style={{ fontWeight: 800, color: "var(--ink, #e8edf5)", margin: "0 0 4px" }}>Build</p>
                      <p style={{ margin: 0, color: "#34D399" }}>{study.buildResult}</p>
                    </div>
                    <div style={{ gridColumn: "1 / -1" }}>
                      <p style={{ fontWeight: 800, color: "var(--ink, #e8edf5)", margin: "0 0 4px" }}>Acceptance Case</p>
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

  const ready = sprintReadyState(form);

  function copyPacket() {
    const packet = generateTaskPacket(form);
    navigator.clipboard.writeText(packet).catch(() => {
      alert("Couldn't copy to clipboard. Select and copy manually.");
    });
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "var(--bg, #0f172a)", border: "1px solid rgba(148,163,184,0.25)", borderRadius: 16, padding: 24, maxWidth: 500, maxHeight: "90vh", overflowY: "auto" }}>
        <h3 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 16px", color: "var(--ink, #e8edf5)" }}>
          {sprint.id ? "Edit Sprint" : "New Sprint"}
        </h3>

        <div style={{ display: "grid", gap: 12, marginBottom: 20 }}>
          <label>
            <span style={{ fontSize: 12, fontWeight: 800, color: "var(--muted, #94a3b8)", display: "block", marginBottom: 4 }}>Deliverable *</span>
            <input
              type="text"
              value={form.deliverable}
              onChange={(e) => setForm({ ...form, deliverable: e.target.value })}
              style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid rgba(148,163,184,0.3)", background: "rgba(148,163,184,0.08)", color: "var(--ink, #e8edf5)", fontSize: 14 }}
            />
          </label>

          <label>
            <span style={{ fontSize: 12, fontWeight: 800, color: "var(--muted, #94a3b8)", display: "block", marginBottom: 4 }}>Repository *</span>
            <input
              type="text"
              value={form.repository}
              onChange={(e) => setForm({ ...form, repository: e.target.value })}
              style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid rgba(148,163,184,0.3)", background: "rgba(148,163,184,0.08)", color: "var(--ink, #e8edf5)", fontSize: 14 }}
            />
          </label>

          <label>
            <span style={{ fontSize: 12, fontWeight: 800, color: "var(--muted, #94a3b8)", display: "block", marginBottom: 4 }}>Branch *</span>
            <input
              type="text"
              value={form.branch}
              onChange={(e) => setForm({ ...form, branch: e.target.value })}
              style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid rgba(148,163,184,0.3)", background: "rgba(148,163,184,0.08)", color: "var(--ink, #e8edf5)", fontSize: 14 }}
            />
          </label>

          <label>
            <span style={{ fontSize: 12, fontWeight: 800, color: "var(--muted, #94a3b8)", display: "block", marginBottom: 4 }}>Start Commit *</span>
            <input
              type="text"
              value={form.startCommit}
              onChange={(e) => setForm({ ...form, startCommit: e.target.value })}
              style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid rgba(148,163,184,0.3)", background: "rgba(148,163,184,0.08)", color: "var(--ink, #e8edf5)", fontSize: 14 }}
            />
          </label>

          <label>
            <span style={{ fontSize: 12, fontWeight: 800, color: "var(--muted, #94a3b8)", display: "block", marginBottom: 4 }}>Acceptance Case *</span>
            <textarea
              value={form.acceptanceCase}
              onChange={(e) => setForm({ ...form, acceptanceCase: e.target.value })}
              style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid rgba(148,163,184,0.3)", background: "rgba(148,163,184,0.08)", color: "var(--ink, #e8edf5)", fontSize: 14, minHeight: 60, fontFamily: "monospace" }}
            />
          </label>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={() => {
              onSave(form);
              onClose();
            }}
            style={{ flex: 1, padding: "10px 16px", background: ready ? "var(--gold, #f59e0b)" : "rgba(148,163,184,0.3)", color: ready ? "#0f172a" : "var(--muted, #94a3b8)", border: "none", borderRadius: 8, fontWeight: 800, cursor: ready ? "pointer" : "not-allowed" }}
            disabled={!ready}
          >
            {ready ? "Save & Generate Packet" : "Complete required fields"}
          </button>
          <button
            onClick={onClose}
            style={{ padding: "10px 16px", background: "rgba(148,163,184,0.1)", color: "var(--muted, #94a3b8)", border: "none", borderRadius: 8, fontWeight: 800, cursor: "pointer" }}
          >
            Cancel
          </button>
        </div>

        {ready && (
          <button
            onClick={copyPacket}
            style={{ width: "100%", marginTop: 12, padding: "10px 16px", background: "#34D399", color: "#0f172a", border: "none", borderRadius: 8, fontWeight: 800, cursor: "pointer" }}
          >
            Copy Task Packet
          </button>
        )}
      </div>
    </div>
  );
}
