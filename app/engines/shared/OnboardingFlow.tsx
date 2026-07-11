"use client";

/**
 * Shared 1-2-3 engine flow: Choose → Set up → Create.
 * Reusable across engines. Progress saves on this device automatically.
 */

import { useEffect, useMemo, useState } from "react";
import {
  ACTIVATION_LABELS, COST_LABELS, PLATFORM_LABELS,
  loadProgress, newProgress, saveProgress, clearProgress,
  pathsForPlatform,
  type EngineOnboarding, type OnboardingProgress, type Platform,
} from "./onboarding.types";

type Step = 1 | 2 | 3;

const cardStyle = { background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 16, padding: 18 } as const;
const inputStyle = {
  width: "100%", boxSizing: "border-box" as const, background: "var(--surface)",
  border: "1px solid var(--line2)", borderRadius: 10, color: "var(--text)",
  padding: "11px 12px", fontSize: 15, fontFamily: "inherit",
};

function StepHeader({ current }: { current: Step }) {
  const items: [Step, string][] = [[1, "Choose"], [2, "Set up"], [3, "Create"]];
  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 16 }} aria-label={`Step ${current} of 3`}>
      {items.map(([n, label]) => (
        <span key={n} style={{
          fontSize: 12.5, fontWeight: 800, borderRadius: 50, padding: "6px 14px",
          background: current === n ? "var(--gold)" : "var(--surface)",
          color: current === n ? "#000" : "var(--muted)",
          border: `1px solid ${current === n ? "var(--gold)" : "var(--line2)"}`,
        }}>
          {n}. {label}
        </span>
      ))}
    </div>
  );
}

export default function OnboardingFlow({
  engine,
  onBack,
}: {
  engine: EngineOnboarding;
  onBack: () => void;
}) {
  const [ready, setReady] = useState(false);
  const [progress, setProgress] = useState<OnboardingProgress>(() => newProgress(engine.engineId));
  const [step, setStep] = useState<Step>(1);
  const [outputName, setOutputName] = useState("");

  useEffect(() => {
    const existing = loadProgress(engine.engineId);
    if (existing) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setProgress(existing);
      if (existing.output) setStep(3);
      else if (existing.pathId && existing.platform) setStep(2);
    }
    setReady(true);
  }, [engine.engineId]);

  const update = (patch: Partial<OnboardingProgress>) => {
    const next = { ...progress, ...patch };
    setProgress(next);
    saveProgress(next);
  };

  const path = engine.paths.find((p) => p.id === progress.pathId);
  const platform = progress.platform;

  const visibleSetup = useMemo(() => {
    if (!path) return [];
    return path.setup.filter((s) => !s.platforms || (platform && s.platforms.includes(platform)));
  }, [path, platform]);

  const setupDone = visibleSetup.length > 0 && visibleSetup.every((s) => progress.checkedSetup[s.id]);
  const stepsDone = path ? path.steps.every((s) => progress.completedSteps[s.id]) : false;

  const resourceById = (id: string) => engine.resources.find((r) => r.id === id);

  if (!ready) return <div className="page"><div style={{ height: 200 }} /></div>;

  return (
    <main>
      <div className="page">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <button onClick={onBack} className="btn btn-ghost btn-small">← Engine Room</button>
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" }}>
            {engine.title} · {ACTIVATION_LABELS[engine.status]}
          </span>
        </div>

        <header style={{ marginBottom: 16 }}>
          <h1 style={{ fontSize: "clamp(1.5rem,6vw,2rem)", fontWeight: 900, color: "var(--text)", margin: "0 0 6px" }}>
            {engine.title}
          </h1>
          <p style={{ fontSize: 14.5, color: "var(--muted)", margin: 0, lineHeight: 1.5 }}>{engine.promise}</p>
        </header>

        <StepHeader current={step} />

        {/* ---------- 1. CHOOSE ---------- */}
        {step === 1 && (
          <div style={cardStyle}>
            <h2 style={{ fontSize: 16, fontWeight: 900, margin: "0 0 12px" }}>What are you working with?</h2>

            <label style={{ display: "block", fontSize: 13.5, fontWeight: 800, marginBottom: 6 }}>Your device</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
              {(Object.keys(PLATFORM_LABELS) as Platform[]).map((pl) => (
                <button key={pl} onClick={() => update({ platform: pl, pathId: undefined })}
                  className={platform === pl ? "btn btn-gold btn-small" : "btn btn-ghost btn-small"}>
                  {PLATFORM_LABELS[pl]}
                </button>
              ))}
            </div>

            {platform && (
              <>
                <label style={{ display: "block", fontSize: 13.5, fontWeight: 800, marginBottom: 6 }}>Your path</label>
                {pathsForPlatform(engine.paths, platform).length === 0 && (
                  <p style={{ fontSize: 14, color: "var(--muted)" }}>
                    No supported path for {PLATFORM_LABELS[platform]} yet. The closest option is a desktop or browser path — pick another device if you have one.
                  </p>
                )}
                {pathsForPlatform(engine.paths, platform).map((p) => (
                  <div key={p.id} style={{ background: "var(--surface)", border: `1px solid ${progress.pathId === p.id ? "var(--gold)" : "var(--line2)"}`, borderRadius: 12, padding: 14, marginBottom: 10 }}>
                    <p style={{ fontSize: 14, fontWeight: 900, color: "var(--text)", margin: "0 0 4px" }}>{p.name}</p>
                    <p style={{ fontSize: 13, color: "var(--muted)", margin: "0 0 6px", lineHeight: 1.5 }}>{p.description}</p>
                    {p.requiredHardware && p.requiredHardware.length > 0 && (
                      <p style={{ fontSize: 12.5, color: "var(--muted)", margin: "0 0 8px" }}>Needs: {p.requiredHardware.join(", ")}</p>
                    )}
                    <p style={{ fontSize: 12.5, color: "var(--text)", fontWeight: 700, margin: "0 0 10px" }}>You finish with: {p.output}</p>
                    <button onClick={() => update({ pathId: p.id })} className="btn btn-gold btn-small">
                      {progress.pathId === p.id ? "Selected" : "Choose this path"}
                    </button>
                  </div>
                ))}
              </>
            )}

            {path && platform && (
              <button onClick={() => setStep(2)} className="btn btn-gold" style={{ width: "100%", marginTop: 12 }}>
                Get the free tools →
              </button>
            )}
          </div>
        )}

        {/* ---------- 2. SET UP ---------- */}
        {step === 2 && path && platform && (
          <>
            <button onClick={() => setStep(1)} className="btn btn-ghost btn-small" style={{ marginBottom: 12 }}>← Change path</button>

            <div style={{ ...cardStyle, marginBottom: 14 }}>
              <h2 style={{ fontSize: 16, fontWeight: 900, margin: "0 0 4px" }}>Tools for this path</h2>
              <p style={{ fontSize: 13, color: "var(--muted)", margin: "0 0 12px" }}>
                Official sources only. Open each link, install or sign up if needed, then check it off below.
              </p>
              {path.toolIds.map((id) => {
                const r = resourceById(id);
                if (!r || !r.platforms.includes(platform)) return null;
                return (
                  <div key={r.id} style={{ background: "var(--surface)", border: "1px solid var(--line2)", borderRadius: 12, padding: 14, marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                      <p style={{ fontSize: 14, fontWeight: 900, color: "var(--text)", margin: 0 }}>{r.name}</p>
                      <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--gold)" }}>{COST_LABELS[r.cost]}</span>
                    </div>
                    <p style={{ fontSize: 13, color: "var(--muted)", margin: "4px 0 6px", lineHeight: 1.5 }}>{r.purpose}</p>
                    <p style={{ fontSize: 12, color: "var(--muted)", margin: "0 0 10px" }}>
                      {r.accountRequired ? "Free account required" : "No account needed"} · {r.installRequired ? "Installs on your device" : "Runs in the browser"} · Source: {r.source} · Link verified {r.lastVerifiedAt}
                    </p>
                    {r.notes && <p style={{ fontSize: 12, color: "var(--muted)", margin: "0 0 10px" }}>{r.notes}</p>}
                    <a href={r.officialUrl} target="_blank" rel="noopener noreferrer" className="btn btn-gold btn-small">
                      Open official site →
                    </a>
                  </div>
                );
              })}
            </div>

            <div style={cardStyle}>
              <h2 style={{ fontSize: 16, fontWeight: 900, margin: "0 0 12px" }}>Setup checklist</h2>
              {visibleSetup.map((s) => (
                <label key={s.id} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "8px 0", borderBottom: "1px solid var(--line2)", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={!!progress.checkedSetup[s.id]}
                    onChange={(e) => update({ checkedSetup: { ...progress.checkedSetup, [s.id]: e.target.checked } })}
                    style={{ marginTop: 3, width: 18, height: 18 }}
                  />
                  <span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>{s.label}</span>
                    {s.detail && <span style={{ display: "block", fontSize: 12.5, color: "var(--muted)", lineHeight: 1.5 }}>{s.detail}</span>}
                  </span>
                </label>
              ))}
              <button
                onClick={() => setStep(3)}
                disabled={!setupDone}
                className="btn btn-gold"
                style={{ width: "100%", marginTop: 14, opacity: setupDone ? 1 : 0.5 }}
              >
                {setupDone ? "Start your first project →" : "Finish the checklist to continue"}
              </button>
              <p style={{ fontSize: 12, color: "var(--muted)", margin: "10px 0 0" }}>
                You can leave and come back — this checklist is saved on this device.
              </p>
            </div>
          </>
        )}

        {/* ---------- 3. CREATE ---------- */}
        {step === 3 && path && (
          <>
            <button onClick={() => setStep(2)} className="btn btn-ghost btn-small" style={{ marginBottom: 12 }}>← Back to setup</button>

            <div style={{ ...cardStyle, marginBottom: 14 }}>
              <h2 style={{ fontSize: 16, fontWeight: 900, margin: "0 0 4px" }}>First project</h2>
              <p style={{ fontSize: 13, color: "var(--muted)", margin: "0 0 12px" }}>
                Work through the steps in order. Steps marked &ldquo;in your tool&rdquo; happen in the external app — come back and check them off when done.
              </p>
              {path.steps.map((s, i) => (
                <label key={s.id} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "10px 0", borderBottom: "1px solid var(--line2)", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={!!progress.completedSteps[s.id]}
                    onChange={(e) => update({ completedSteps: { ...progress.completedSteps, [s.id]: e.target.checked } })}
                    style={{ marginTop: 3, width: 18, height: 18 }}
                  />
                  <span>
                    <span style={{ fontSize: 14, fontWeight: 800, color: "var(--text)" }}>
                      {i + 1}. {s.title}
                      {s.external && <span style={{ fontSize: 11, fontWeight: 800, color: "var(--gold)", marginLeft: 8 }}>in your tool</span>}
                    </span>
                    <span style={{ display: "block", fontSize: 13, color: "var(--muted)", lineHeight: 1.55 }}>{s.detail}</span>
                  </span>
                </label>
              ))}
            </div>

            <div style={cardStyle}>
              <h2 style={{ fontSize: 16, fontWeight: 900, margin: "0 0 8px" }}>Record your result</h2>
              {progress.output ? (
                <>
                  <p style={{ fontSize: 14, color: "var(--text)", fontWeight: 700, margin: "0 0 4px" }}>
                    Finished: {progress.output.name}
                  </p>
                  <p style={{ fontSize: 12.5, color: "var(--muted)", margin: "0 0 12px" }}>
                    Recorded {new Date(progress.output.at).toLocaleString()}. The file lives on your device — StepInTheRing guided the process; your tool made the file.
                  </p>
                  <button onClick={() => { clearProgress(engine.engineId); update({ ...newProgress(engine.engineId) }); setStep(1); }} className="btn btn-ghost btn-small">
                    Start another project
                  </button>
                </>
              ) : (
                <>
                  <p style={{ fontSize: 13, color: "var(--muted)", margin: "0 0 10px" }}>
                    When your exported file exists, name it here so your progress shows finished.
                  </p>
                  <input
                    value={outputName}
                    onChange={(e) => setOutputName(e.target.value)}
                    placeholder='e.g., "first-beat.mp3"'
                    aria-label="Finished file name"
                    style={{ ...inputStyle, marginBottom: 10 }}
                  />
                  <button
                    onClick={() => {
                      if (!outputName.trim()) return;
                      update({ output: { name: outputName.trim(), at: new Date().toISOString() } });
                    }}
                    disabled={!stepsDone || !outputName.trim()}
                    className="btn btn-gold"
                    style={{ width: "100%", opacity: stepsDone && outputName.trim() ? 1 : 0.5 }}
                  >
                    {stepsDone ? "Mark project finished" : "Complete all steps first"}
                  </button>
                </>
              )}
            </div>

            {(engine.troubleshooting.length > 0 || engine.limitations.length > 0) && (
              <details style={{ ...cardStyle, marginTop: 14 }}>
                <summary style={{ fontSize: 14, fontWeight: 800, color: "var(--text)", cursor: "pointer" }}>
                  Troubleshooting & known limits
                </summary>
                {engine.troubleshooting.map((t, i) => (
                  <div key={i} style={{ marginTop: 10 }}>
                    <p style={{ fontSize: 13, fontWeight: 800, color: "var(--text)", margin: 0 }}>{t.problem}</p>
                    <p style={{ fontSize: 13, color: "var(--muted)", margin: "2px 0 0", lineHeight: 1.5 }}>{t.fix}</p>
                  </div>
                ))}
                {engine.limitations.length > 0 && (
                  <ul style={{ fontSize: 13, color: "var(--muted)", margin: "10px 0 0", paddingLeft: 18 }}>
                    {engine.limitations.map((l, i) => <li key={i}>{l}</li>)}
                  </ul>
                )}
              </details>
            )}
          </>
        )}
      </div>
    </main>
  );
}
