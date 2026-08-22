"use client";

import { useEffect, useState } from "react";
import {
  assessCandidate,
  allChecked,
  generateCompletionReport,
  BACKUP_PREP_ITEMS,
  INSTALL_CHECKLIST_ITEMS,
  POST_INSTALL_VERIFY_ITEMS,
  type CandidateFacts,
  type CandidateAssessment,
  type BuildMachineRecord,
} from "./buildMachineLogic";

// ─────────────────────────────────────────────────────────────────────────────
// Build Machine — assess an old computer, prepare it safely, install the one
// supported Linux path, verify it, and open the ecosystem. Free, no account
// needed — this is the physical entry point into Open Mirror, before anyone
// is asked to sign up for anything.
// ─────────────────────────────────────────────────────────────────────────────

const STORAGE_KEY = "sitr-build-machine-v1";

function download(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function emptyFacts(): CandidateFacts {
  return {
    manufacturerModel: "",
    approximateAge: "",
    isLaptop: true,
    cpuArch: "unknown",
    ramGb: 4,
    storageGb: 0,
    freeStorageGb: 0,
    hasWifi: false,
    hasBluetooth: false,
    hasCameraMic: false,
    usbPorts: 1,
    batteryCondition: "unknown",
    currentlyBoots: true,
    hasImportantFiles: true,
  };
}

function emptyRecord(): BuildMachineRecord {
  const now = new Date().toISOString();
  return {
    id: Date.now().toString(),
    facts: null,
    assessment: null,
    prepState: {},
    installState: {},
    verifyState: {},
    firstBuildDone: false,
    createdAt: now,
    updatedAt: now,
  };
}

const STATUS_COLOR: Record<CandidateAssessment["status"], string> = {
  good: "#34D399",
  likely: "var(--gold)",
  "needs-upgrade": "var(--gold)",
  "not-recommended": "#ef4444",
};

const card: React.CSSProperties = { border: "1px solid var(--line2)", borderRadius: 5, padding: 16, marginBottom: 16 };
const fieldStyle: React.CSSProperties = { width: "100%", padding: "8px 12px", borderRadius: 4, border: "1px solid rgba(148,163,184,0.3)", background: "rgba(148,163,184,0.08)", color: "var(--text)", fontSize: 14 };
const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 800, color: "var(--muted)", display: "block", marginBottom: 4 };

export default function BuildMachineClient() {
  const [tab, setTab] = useState<"assess" | "prepare" | "verify" | "report">("assess");
  const [record, setRecord] = useState<BuildMachineRecord>(emptyRecord());
  const [form, setForm] = useState<CandidateFacts>(emptyFacts());
  const [reportText, setReportText] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const parsed = saved ? (JSON.parse(saved) as BuildMachineRecord) : null;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- restoring persisted state after mount, same pattern as the other tools
      if (parsed) setRecord(parsed);
      if (parsed?.facts) setForm(parsed.facts);
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
    } catch {}
  }, [record]);

  function runAssessment(e: React.FormEvent) {
    e.preventDefault();
    const assessment = assessCandidate(form);
    setRecord({ ...record, facts: form, assessment, updatedAt: new Date().toISOString() });
    setTab("prepare");
  }

  function toggleCheck(section: "prepState" | "installState" | "verifyState", idx: number) {
    setRecord({
      ...record,
      [section]: { ...record[section], [idx]: !record[section][idx] },
      updatedAt: new Date().toISOString(),
    });
  }

  const prepDone = allChecked(BACKUP_PREP_ITEMS, record.prepState);
  const installDone = allChecked(INSTALL_CHECKLIST_ITEMS, record.installState);

  return (
    <main>
      <div className="page" style={{ maxWidth: 860 }}>
        <header className="mast">
          <span className="kicker">Your machine</span>
          <h1 className="mast-title">Build Machine</h1>
          <p className="mast-lead">
            Turn a computer you already have into one that can actually build
            what you are making. Check what you have, get it ready safely,
            install the one setup we support, then prove it works.
          </p>
          <hr className="rule mast-rule" />
        </header>

        <div style={{ display: "flex", gap: 6, margin: "26px 0 24px", borderBottom: "1px solid var(--line)", paddingBottom: 12, flexWrap: "wrap" }}>
          {(["assess", "prepare", "verify", "report"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: "8px 16px", border: "none", borderRadius: 4, fontSize: 14, fontWeight: 800, cursor: "pointer",
                background: tab === t ? "var(--gold-glow)" : "transparent",
                color: tab === t ? "var(--gold)" : "var(--muted)",
              }}
            >
              {t === "assess" && "1. Assess"}
              {t === "prepare" && "2. Prepare & Install"}
              {t === "verify" && "3. Verify & First Build"}
              {t === "report" && "4. Report"}
            </button>
          ))}
        </div>

        {tab === "assess" && (
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>Is this computer a candidate?</h2>
            <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 16 }}>
              Answer honestly — this only checks whether a Linux Mint 22 Build Machine is realistic for
              this exact computer. Nothing here is destructive.
            </p>
            <form onSubmit={runAssessment} style={{ display: "grid", gap: 12 }}>
              <label><span style={labelStyle}>Manufacturer / model</span>
                <input style={fieldStyle} value={form.manufacturerModel} onChange={(e) => setForm({ ...form, manufacturerModel: e.target.value })} placeholder="e.g. Dell Latitude 7490" />
              </label>
              <label><span style={labelStyle}>Approximate age</span>
                <input style={fieldStyle} value={form.approximateAge} onChange={(e) => setForm({ ...form, approximateAge: e.target.value })} placeholder="e.g. 5 years" />
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input type="checkbox" checked={form.isLaptop} onChange={(e) => setForm({ ...form, isLaptop: e.target.checked })} />
                <span style={{ fontSize: 13 }}>This is a laptop (unchecked = desktop)</span>
              </label>
              <label><span style={labelStyle}>CPU architecture</span>
                <select style={fieldStyle} value={form.cpuArch} onChange={(e) => setForm({ ...form, cpuArch: e.target.value as CandidateFacts["cpuArch"] })}>
                  <option value="unknown">Not sure</option>
                  <option value="x86_64">64-bit x86 (amd64 / Intel / AMD)</option>
                  <option value="arm">ARM</option>
                </select>
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <label><span style={labelStyle}>RAM (GB)</span>
                  <input type="number" style={fieldStyle} value={form.ramGb} onChange={(e) => setForm({ ...form, ramGb: Number(e.target.value) })} />
                </label>
                <label><span style={labelStyle}>Total storage (GB)</span>
                  <input type="number" style={fieldStyle} value={form.storageGb} onChange={(e) => setForm({ ...form, storageGb: Number(e.target.value) })} />
                </label>
                <label><span style={labelStyle}>Free storage (GB)</span>
                  <input type="number" style={fieldStyle} value={form.freeStorageGb} onChange={(e) => setForm({ ...form, freeStorageGb: Number(e.target.value) })} />
                </label>
                <label><span style={labelStyle}>Usable USB ports</span>
                  <input type="number" style={fieldStyle} value={form.usbPorts} onChange={(e) => setForm({ ...form, usbPorts: Number(e.target.value) })} />
                </label>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input type="checkbox" checked={form.hasWifi} onChange={(e) => setForm({ ...form, hasWifi: e.target.checked })} />
                  <span style={{ fontSize: 13 }}>Wi-Fi works today</span>
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input type="checkbox" checked={form.hasBluetooth} onChange={(e) => setForm({ ...form, hasBluetooth: e.target.checked })} />
                  <span style={{ fontSize: 13 }}>Bluetooth works today</span>
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input type="checkbox" checked={form.hasCameraMic} onChange={(e) => setForm({ ...form, hasCameraMic: e.target.checked })} />
                  <span style={{ fontSize: 13 }}>Camera / mic present</span>
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input type="checkbox" checked={form.currentlyBoots} onChange={(e) => setForm({ ...form, currentlyBoots: e.target.checked })} />
                  <span style={{ fontSize: 13 }}>Currently boots</span>
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input type="checkbox" checked={form.hasImportantFiles} onChange={(e) => setForm({ ...form, hasImportantFiles: e.target.checked })} />
                  <span style={{ fontSize: 13 }}>Important files still on it</span>
                </label>
              </div>
              {form.isLaptop && (
                <label><span style={labelStyle}>Battery condition</span>
                  <select style={fieldStyle} value={form.batteryCondition} onChange={(e) => setForm({ ...form, batteryCondition: e.target.value as CandidateFacts["batteryCondition"] })}>
                    <option value="unknown">Not sure</option>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                    <option value="poor">Poor</option>
                  </select>
                </label>
              )}
              <button type="submit" style={{ padding: "10px 16px", background: "var(--gold)", color: "var(--ink)", border: "none", borderRadius: 4, fontWeight: 800, cursor: "pointer" }}>
                Check candidacy
              </button>
            </form>

            {record.assessment && (
              <div style={{ ...card, marginTop: 20, borderColor: STATUS_COLOR[record.assessment.status] }}>
                <p style={{ fontSize: 16, fontWeight: 900, color: STATUS_COLOR[record.assessment.status], margin: "0 0 10px" }}>
                  {record.assessment.statusLabel}
                </p>
                {record.assessment.blockers.length > 0 && (
                  <div style={{ marginBottom: 10 }}>
                    <p style={{ fontSize: 12, fontWeight: 800, color: "#ef4444", margin: "0 0 4px" }}>Fix before proceeding</p>
                    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: "var(--muted)" }}>
                      {record.assessment.blockers.map((b, i) => <li key={i} style={{ marginBottom: 4 }}>{b}</li>)}
                    </ul>
                  </div>
                )}
                {record.assessment.verifyItems.length > 0 && (
                  <div style={{ marginBottom: 10 }}>
                    <p style={{ fontSize: 12, fontWeight: 800, color: "var(--gold)", margin: "0 0 4px" }}>Verify these</p>
                    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: "var(--muted)" }}>
                      {record.assessment.verifyItems.map((v, i) => <li key={i} style={{ marginBottom: 4 }}>{v}</li>)}
                    </ul>
                  </div>
                )}
                {record.assessment.notes.length > 0 && (
                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: "var(--muted)" }}>
                    {record.assessment.notes.map((n, i) => <li key={i} style={{ marginBottom: 4 }}>{n}</li>)}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}

        {tab === "prepare" && (
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>Back up, then prepare</h2>
            <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 16 }}>
              Every item below must be checked before the install checklist unlocks. Nothing on this
              machine is touched by checking a box — this is only a confirmation you&apos;ve done it.
            </p>
            <div style={card}>
              {BACKUP_PREP_ITEMS.map((item, i) => (
                <label key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10, fontSize: 14 }}>
                  <input type="checkbox" checked={!!record.prepState[i]} onChange={() => toggleCheck("prepState", i)} style={{ marginTop: 3 }} />
                  <span>{item}</span>
                </label>
              ))}
            </div>

            {!prepDone ? (
              <p style={{ fontSize: 13, color: "var(--muted)" }}>
                Complete every item above to unlock the installation checklist.
              </p>
            ) : (
              <div style={card}>
                <p style={{ fontSize: 16, fontWeight: 900, margin: "0 0 8px" }}>Install: Linux Mint 22 (Cinnamon or Xfce)</p>
                <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 12 }}>
                  The single supported path — built on an Ubuntu 24.04 base. The full step-by-step guide,
                  scripts, and troubleshooting live in the{" "}
                  <a href="https://openmirrorllc.com/products/old-laptop-to-build-machine" target="_blank" rel="noopener noreferrer" style={{ color: "var(--gold)" }}>
                    Old Laptop → Build Machine guide
                  </a>{" — "}
                  this checklist tracks your progress through it.
                </p>
                {INSTALL_CHECKLIST_ITEMS.map((item, i) => (
                  <label key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10, fontSize: 14 }}>
                    <input type="checkbox" checked={!!record.installState[i]} onChange={() => toggleCheck("installState", i)} style={{ marginTop: 3 }} />
                    <span>{item}</span>
                  </label>
                ))}
                {installDone && (
                  <button onClick={() => setTab("verify")} style={{ marginTop: 8, padding: "10px 16px", background: "var(--gold)", color: "var(--ink)", border: "none", borderRadius: 4, fontWeight: 800, cursor: "pointer" }}>
                    Continue to verification →
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {tab === "verify" && (
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>Verify, then open the ecosystem</h2>
            <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 16 }}>
              Check each item only once you&apos;ve actually confirmed it on the machine.
            </p>
            <div style={card}>
              {POST_INSTALL_VERIFY_ITEMS.map((item, i) => (
                <label key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10, fontSize: 14 }}>
                  <input type="checkbox" checked={!!record.verifyState[i]} onChange={() => toggleCheck("verifyState", i)} style={{ marginTop: 3 }} />
                  <span>{item}</span>
                </label>
              ))}
            </div>

            <div style={card}>
              <p style={{ fontSize: 16, fontWeight: 900, margin: "0 0 8px" }}>Open the ecosystem</p>
              <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 12 }}>
                From this machine, open iDontCry to play and test ideas, and Step In The Ring to build one for real.
              </p>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
                <a href="https://www.idontcry.com" target="_blank" rel="noopener noreferrer" style={{ padding: "10px 16px", background: "rgba(148,163,184,0.1)", color: "var(--text)", borderRadius: 4, fontWeight: 800, textDecoration: "none", fontSize: 14 }}>
                  Open iDontCry
                </a>
                <a href="/create" target="_blank" rel="noopener noreferrer" style={{ padding: "10px 16px", background: "var(--gold)", color: "var(--ink)", borderRadius: 4, fontWeight: 800, textDecoration: "none", fontSize: 14 }}>
                  Start creating
                </a>
              </div>
              <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 10 }}>
                First build exercise: on the Create page, shape one small idea from
                start to a plan and builder prompt — a real first result, on this machine.
              </p>
              <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14 }}>
                <input
                  type="checkbox"
                  checked={record.firstBuildDone}
                  onChange={() => setRecord({ ...record, firstBuildDone: !record.firstBuildDone, updatedAt: new Date().toISOString() })}
                />
                <span>I shaped a first idea in Step In The Ring on this machine.</span>
              </label>
            </div>
          </div>
        )}

        {tab === "report" && (
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 16 }}>Completion report</h2>
            <button
              onClick={() => setReportText(generateCompletionReport(record))}
              style={{ padding: "10px 16px", background: "var(--gold)", color: "var(--ink)", border: "none", borderRadius: 4, fontWeight: 800, cursor: "pointer", marginBottom: 16 }}
            >
              Generate report
            </button>
            {reportText && (
              <div>
                <pre style={{ whiteSpace: "pre-wrap", fontSize: 13, padding: 16, border: "1px solid var(--line2)", borderRadius: 5, background: "rgba(148,163,184,0.05)", fontFamily: "monospace" }}>
                  {reportText}
                </pre>
                <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
                  <button
                    onClick={() => navigator.clipboard.writeText(reportText).catch(() => alert("Couldn't copy. Select and copy manually."))}
                    style={{ padding: "10px 16px", background: "#34D399", color: "#1A1408", border: "none", borderRadius: 4, fontWeight: 800, cursor: "pointer" }}
                  >
                    Copy report
                  </button>
                  <button
                    onClick={() => download("build-machine-report.txt", reportText)}
                    style={{ padding: "10px 16px", background: "rgba(148,163,184,0.1)", color: "var(--text)", border: "none", borderRadius: 4, fontWeight: 800, cursor: "pointer" }}
                  >
                    Download report
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
