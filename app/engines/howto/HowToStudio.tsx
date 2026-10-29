"use client";

/**
 * How to Anything Engine — studio.
 *
 * One proven solution at a time: Remember → Prove → Create → Footage →
 * Publish → Promote → Learn → Next solution. Real output: a complete
 * production package built from the owner's own words, saved on this device.
 * The proof gate is the law here — an uncertain fix never becomes a video.
 */

import { useEffect, useMemo, useState } from "react";
import {
  buildPackage, captureGate, emptyRecord, packageMarkdown, parseRecord,
  proofGate, socialPack, PROOF_LEVELS, XUMO_SEED,
  type PerformanceSnapshot, type SolutionRecord,
} from "./howto.engine";
import type { CreationProject } from "../shared/creation-engine.types";
import {
  createProject, deleteProject, getProject, getProjectsByEngine, uid, updateProject,
} from "../shared/persistence";
import TaskSession from "./TaskSession";
import { useFlash } from "../shared/useFlash";

type Stage = "solutions" | "capture" | "proof" | "package" | "footage" | "publish" | "promote" | "learn";

const ENGINE_ID = "howto";

const STEPS: { id: Stage; label: string }[] = [
  { id: "capture", label: "1 Your story" },
  { id: "proof", label: "2 Confirm" },
  { id: "package", label: "3 Package" },
  { id: "footage", label: "4 Footage" },
  { id: "publish", label: "5 Publish" },
  { id: "promote", label: "6 Promote" },
  { id: "learn", label: "7 Check-ins" },
];

export default function HowToStudio({
  onBack,
  card,
  seedIdea,
}: {
  onBack: () => void;
  card: React.CSSProperties;
  seedIdea?: string;
}) {
  // "help": the default — help someone do something, right now, one step at
  // a time. "document": the original retrospective evidence-capture flow,
  // for turning something already solved into a YouTube package.
  const [mode, setMode] = useState<"help" | "document">("help");
  const [ready, setReady] = useState(false);
  const [saved, setSaved] = useState<CreationProject[]>([]);
  const [project, setProject] = useState<CreationProject | null>(null);
  const [stage, setStage] = useState<Stage>("solutions");
  const [record, setRecord] = useState<SolutionRecord>(emptyRecord());
  const [stepsText, setStepsText] = useState("");
  const [snap, setSnap] = useState<Omit<PerformanceSnapshot, "id">>({ date: "", views: "", watchTime: "", ctr: "", notes: "" });
  const [accuracyOk, setAccuracyOk] = useState(false);
  const [flash, say] = useFlash(2400);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSaved(getProjectsByEngine(ENGINE_ID));
    setReady(true);
  }, []);

    const copy = async (text: string, label: string) => {
    try { await navigator.clipboard.writeText(text); say(`${label} copied`); }
    catch { say("Couldn't reach your clipboard — select the text and copy it by hand."); }
  };

  const persist = (next: SolutionRecord, status?: CreationProject["status"]) => {
    setRecord(next);
    if (!project) return;
    const latest = getProject(project.id) ?? project;
    const updated = { ...latest, name: next.name || latest.name, buildContent: { ...next }, ...(status ? { status } : {}) };
    updateProject(updated);
    setProject(updated);
    setSaved(getProjectsByEngine(ENGINE_ID));
  };

  const capture = useMemo(() => captureGate(record), [record]);
  const proof = useMemo(() => proofGate(record), [record]);
  const pkg = useMemo(() => buildPackage(record), [record]);
  const social = useMemo(() => (pkg ? socialPack(record, pkg) : []), [record, pkg]);

  // ---- open / start ----
  const openProject = (p: CreationProject) => {
    const r = parseRecord(p.buildContent);
    setProject(p);
    setRecord(r);
    setStepsText(r.steps.join("\n"));
    if (r.publishedAt) setStage("learn");
    else if (buildPackage(r)) setStage("package");
    else if (captureGate(r).ready) setStage("proof");
    else setStage("capture");
  };

  const startNew = (seed?: Partial<SolutionRecord>) => {
    const r = { ...emptyRecord(), ...(seed ?? {}) } as SolutionRecord;
    setProject(null);
    setRecord(r);
    setStepsText(r.steps.join("\n"));
    setStage("capture");
  };

  // ---- capture ----
  const saveCapture = () => {
    const steps = stepsText.split("\n").map((s) => s.trim()).filter(Boolean);
    const next = { ...record, steps };
    if (!captureGate(next).ready) {
      setRecord(next);
      say("Still missing: " + captureGate(next).missing[0]);
      return;
    }
    let p = project;
    if (!p) { p = createProject(ENGINE_ID, next.name, {}); setProject(p); }
    const latest = getProject(p.id) ?? p;
    const updated = { ...latest, name: next.name, buildContent: { ...next }, status: "creating" as const };
    updateProject(updated);
    setProject(updated);
    setRecord(next);
    setSaved(getProjectsByEngine(ENGINE_ID));
    setStage("proof");
  };

  // ---- proof ----
  const confirmProof = () => {
    if (!proof.ready) { say("Still missing: " + proof.missing[0]); return; }
    persist(record, "approved");
    setStage("package");
  };

  // ---- publish ----
  const markPublished = () => {
    if (!/^https?:\/\/\S+\.\S+/i.test(record.videoUrl.trim())) { say("Paste the full video link, starting with https://"); return; }
    if (!accuracyOk) { say("Tick the accuracy check first"); return; }
    persist({ ...record, publishedAt: new Date().toISOString() }, "published");
    setStage("promote");
  };

  // ---- learn ----
  const addSnapshot = () => {
    if (!snap.date && !snap.views && !snap.notes) { say("Add a date, a number, or a note"); return; }
    const entry: PerformanceSnapshot = { id: uid(), ...snap, date: snap.date || new Date().toISOString().slice(0, 10) };
    persist({ ...record, snapshots: [entry, ...record.snapshots] });
    setSnap({ date: "", views: "", watchTime: "", ctr: "", notes: "" });
    say("Snapshot saved");
  };

  const downloadPackage = () => {
    if (!pkg) return;
    const blob = new Blob([packageMarkdown(record, pkg)], { type: "text/markdown" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${(record.name || "solution").toLowerCase().replace(/[^a-z0-9]+/g, "-")}-package.md`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  // ---- styles ----
  const input = {
    width: "100%", boxSizing: "border-box" as const, background: "var(--surface)",
    border: "1px solid var(--line2)", borderRadius: 10, color: "var(--text)",
    padding: "11px 12px", fontSize: 15, fontFamily: "inherit",
  };
  const label = { display: "block", fontSize: 13.5, fontWeight: 800, marginBottom: 4 } as const;
  const help = { fontSize: 12.5, color: "var(--muted)", margin: "0 0 6px" } as const;
  const mono = {
    ...input, whiteSpace: "pre-wrap" as const, fontSize: 13.5, lineHeight: 1.55,
    background: "var(--surface)", margin: 0,
  };
  const kicker = { fontSize: 12, fontWeight: 900, color: "var(--gold)", textTransform: "uppercase" as const, letterSpacing: "0.08em", margin: "0 0 3px" };

  if (!ready) return <div className="page"><div style={{ height: 200 }} /></div>;

  if (mode === "help") {
    return (
      <main>
        <div className="page">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <button onClick={onBack} className="btn btn-ghost btn-small">← Engine Room</button>
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" }}>
              How to Anything Engine
            </span>
          </div>
          <TaskSession onDocumentInstead={() => setMode("document")} seedIdea={seedIdea} />
        </div>
      </main>
    );
  }

  const unlocked = (s: Stage): boolean => {
    switch (s) {
      case "capture": return true;
      case "proof": return capture.ready;
      case "package": case "footage": case "publish": return !!pkg;
      case "promote": case "learn": return !!pkg;
      default: return true;
    }
  };

  const field = (
    key: keyof SolutionRecord, text: string, hint: string, placeholder: string, kind: "text" | "textarea",
  ) => (
    <div style={{ marginBottom: 14 }}>
      <label style={label}>{text}</label>
      {hint && <p style={help}>{hint}</p>}
      {kind === "textarea" ? (
        <textarea value={record[key] as string} onChange={(e) => setRecord({ ...record, [key]: e.target.value })} placeholder={placeholder} style={{ ...input, minHeight: 66, resize: "vertical" }} />
      ) : (
        <input value={record[key] as string} onChange={(e) => setRecord({ ...record, [key]: e.target.value })} placeholder={placeholder} style={input} />
      )}
    </div>
  );

  const copyBlock = (title: string, body: string) => (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <p style={kicker}>{title}</p>
        <button onClick={() => copy(body, title)} className="btn btn-ghost btn-small">Copy</button>
      </div>
      <pre style={mono}>{body}</pre>
    </div>
  );

  return (
    <main>
      <div className="page">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <button onClick={onBack} className="btn btn-ghost btn-small">← Engine Room</button>
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" }}>
            How to Anything Engine
          </span>
        </div>
        <p role="status" aria-live="polite" style={{ color: "var(--gold)", fontWeight: 800, minHeight: 20, margin: "0 0 10px" }}>{flash}</p>

        {/* step chips */}
        {stage !== "solutions" && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
            <button onClick={() => setStage("solutions")} className="btn btn-ghost btn-small">Solutions</button>
            {STEPS.map((s) => (
              <button key={s.id} onClick={() => unlocked(s.id) ? setStage(s.id) : say(s.id === "proof" ? "Finish the capture first" : "Finish the Confirm step first")}
                className="btn btn-small"
                style={{
                  background: stage === s.id ? "var(--gold)" : "var(--surface)",
                  color: stage === s.id ? "#000" : unlocked(s.id) ? "var(--text)" : "var(--muted)",
                  border: `1px solid ${stage === s.id ? "var(--gold)" : "var(--line2)"}`,
                  opacity: unlocked(s.id) ? 1 : 0.55,
                }}>
                {s.label}
              </button>
            ))}
          </div>
        )}

        {/* ---- SOLUTIONS (library + next solution) ---- */}
        {stage === "solutions" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={card}>
              <button onClick={() => setMode("help")} className="btn btn-ghost btn-small" style={{ marginBottom: 12 }}>← Help me do something instead</button>
              <h2 style={{ fontSize: 18, fontWeight: 900, margin: "0 0 6px" }}>Document something you already solved</h2>
              <p style={{ fontSize: 13.5, color: "var(--muted)", margin: "0 0 14px", lineHeight: 1.55 }}>
                You type what happened and the steps you took. This tool then lays them out as a script, shot list,
                YouTube title and description, thumbnail text and social posts. It uses only your words and has no way
                to check that the fix works. You film it and you publish it.
              </p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button onClick={() => startNew()} className="btn btn-gold">+ New solution</button>
                {saved.length === 0 && (
                  <button onClick={() => startNew(XUMO_SEED)} className="btn btn-ghost">Try it with a sample fix (Xumo box)</button>
                )}
              </div>
            </div>
            {saved.length > 0 && (
              <div style={card}>
                <h3 style={{ fontSize: 15, fontWeight: 900, margin: "0 0 10px" }}>Your solutions</h3>
                {saved.map((p) => {
                  const r = parseRecord(p.buildContent);
                  return (
                    <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, padding: "10px 0", borderBottom: "1px solid var(--line2)" }}>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: 14, fontWeight: 800, color: "var(--text)", margin: 0 }}>{p.name}</p>
                        <p style={{ fontSize: 12, color: "var(--muted)", margin: "2px 0 0" }}>
                          {r.publishedAt ? `Marked published${r.snapshots.length ? ` · ${r.snapshots.length} check-in${r.snapshots.length !== 1 ? "s" : ""}` : ""}` : buildPackage(r) ? "Package ready — film and publish" : captureGate(r).ready ? "Captured — needs proof review" : "Capture in progress"}
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
          </div>
        )}

        {/* ---- 1 REMEMBER ---- */}
        {stage === "capture" && (
          <div style={card}>
            <h2 style={{ fontSize: 18, fontWeight: 900, marginBottom: 6 }}>1. Your story — what happened</h2>
            <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 16 }}>
              Rough is fine. Say it the way you&apos;d tell a neighbor. Every answer here becomes the video&apos;s raw material — your words, not generated ones.
            </p>
            {field("name", "Working name *", "", "e.g. Xumo box flashing white", "text")}
            {field("problem", "What looked broken or confusing? *", "", "The situation as you found it", "textarea")}
            {field("device", "Exact device, product, or situation *", "Model names help people searching for the same problem.", "e.g. Spectrum Xumo Stream Box", "text")}
            {field("symptoms", "What could you actually see happening? *", "", "e.g. flashes white, keeps power cycling", "textarea")}
            {field("wrongPaths", "What did other people or support get wrong?", "Optional — this is often the story.", "Replaced boxes, bad advice, dead ends", "textarea")}
            <div style={{ marginBottom: 14 }}>
              <label style={label}>The exact steps that worked * (one per line)</label>
              <p style={help}>Only what you actually did. The engine never adds a step you didn&apos;t take.</p>
              <textarea value={stepsText} onChange={(e) => setStepsText(e.target.value)} placeholder={"Point the remote at the box\nHold the green Home button about five seconds"} style={{ ...input, minHeight: 90, resize: "vertical" }} />
            </div>
            {field("result", "What happened when it worked? *", "", "The moment it came back", "textarea")}
            {field("limits", "When will this NOT help?", "Honest limits make the video trustworthy.", "e.g. if holding Home does nothing, it may be real hardware failure", "textarea")}
            {field("story", "Anything else worth telling?", "Optional background — how you found it, who passed it on.", "", "textarea")}
            <button onClick={saveCapture} className="btn btn-gold" style={{ width: "100%", marginTop: 8 }}>
              Save and review the proof →
            </button>
          </div>
        )}

        {/* ---- 2 PROVE ---- */}
        {stage === "proof" && (
          <div style={card}>
            <h2 style={{ fontSize: 18, fontWeight: 900, marginBottom: 6 }}>2. Confirm — how sure are you?</h2>
            <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 16 }}>
              You tell this tool how sure you are. It can&apos;t check any of it. It only holds the package back while you have marked the fix as uncertain or left the confirmation unticked.
            </p>
            {field("proofNote", "How did you check that it worked? *", "", "e.g. done on my own box, technician confirmed the same fix", "textarea")}
            <label style={label}>Proof level *</label>
            {PROOF_LEVELS.map((p) => (
              <label key={p.id} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "8px 0", cursor: "pointer" }}>
                <input type="radio" name="prooflevel" checked={record.proofLevel === p.id} onChange={() => setRecord({ ...record, proofLevel: p.id })} style={{ marginTop: 3 }} />
                <span>
                  <span style={{ fontSize: 14, fontWeight: 800, color: "var(--text)" }}>{p.label}</span>
                  <span style={{ display: "block", fontSize: 12.5, color: "var(--muted)" }}>{p.means}</span>
                </span>
              </label>
            ))}
            {record.proofLevel === "uncertain" && (
              <p style={{ fontSize: 13, color: "var(--gold)", fontWeight: 700, margin: "8px 0 0", lineHeight: 1.5 }}>
                Held back. Do the fix again, watch it work, then come back and change the level.
              </p>
            )}
            <label style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "14px 0 0", cursor: "pointer" }}>
              <input type="checkbox" checked={record.proofConfirmed} onChange={(e) => setRecord({ ...record, proofConfirmed: e.target.checked })} style={{ marginTop: 3 }} />
              <span style={{ fontSize: 13.5, color: "var(--text)", lineHeight: 1.5 }}>
                Every step above is exactly what happened. Nothing added, nothing smoothed over.
              </span>
            </label>
            <button onClick={confirmProof} className="btn btn-gold" style={{ width: "100%", marginTop: 14 }}>
              Make the package →
            </button>
            {!proof.ready && proof.missing.length > 0 && (
              <p style={{ fontSize: 12.5, color: "var(--muted)", margin: "10px 0 0" }}>Still needed: {proof.missing.join(" · ")}</p>
            )}
          </div>
        )}

        {/* ---- 3 CREATE ---- */}
        {stage === "package" && pkg && (
          <div style={card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 6 }}>
              <h2 style={{ fontSize: 18, fontWeight: 900, margin: 0 }}>3. Package — script, titles, thumbnail text</h2>
              <button onClick={downloadPackage} className="btn btn-gold btn-small">Download it all (.md)</button>
            </div>
            <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 16 }}>
              Built entirely from your captured words. Edit anything by going back to Your story — the package rebuilds itself.
            </p>
            {copyBlock("Title options", pkg.titles.map((t, i) => `${i + 1}. ${t}`).join("\n"))}
            {copyBlock("Voiceover script (this is also the caption file)", pkg.script.map((s) => `[${s.heading}]\n${s.voiceover}`).join("\n\n"))}
            {copyBlock("Thumbnail plan", `Text: ${pkg.thumbnail.text}\nShot: ${pkg.thumbnail.shot}`)}
          </div>
        )}

        {/* ---- 4 FOOTAGE ---- */}
        {stage === "footage" && pkg && (
          <div style={card}>
            <h2 style={{ fontSize: 18, fontWeight: 900, marginBottom: 6 }}>4. Footage — your shot list</h2>
            <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 16 }}>
              Film each shot yourself, then tick it here. This page does not record or store video. The ticks only track your own progress.
            </p>
            {pkg.shotList.map((s) => {
              const done = record.footageDone.includes(s.id);
              return (
                <label key={s.id} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "9px 0", borderBottom: "1px solid var(--line2)", cursor: "pointer" }}>
                  <input type="checkbox" checked={done} onChange={(e) => {
                    const footageDone = e.target.checked ? [...record.footageDone, s.id] : record.footageDone.filter((id) => id !== s.id);
                    persist({ ...record, footageDone });
                  }} style={{ marginTop: 3 }} />
                  <span>
                    <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--gold)" }}>{s.covers}</span>
                    <span style={{ display: "block", fontSize: 13.5, color: done ? "var(--muted)" : "var(--text)", lineHeight: 1.5, textDecoration: done ? "line-through" : "none" }}>{s.label}</span>
                  </span>
                </label>
              );
            })}
            <div style={{ marginTop: 14 }}>
              <label style={label}>Where the clips live</label>
              <input value={record.footageNotes} onChange={(e) => setRecord({ ...record, footageNotes: e.target.value })} onBlur={() => persist(record)} placeholder="e.g. phone camera roll, July 27 folder" style={input} />
            </div>
            <p style={{ fontSize: 12.5, color: "var(--muted)", margin: "12px 0 0" }}>
              {record.footageDone.length} of {pkg.shotList.length} shots ticked off by you
            </p>
          </div>
        )}

        {/* ---- 5 PUBLISH ---- */}
        {stage === "publish" && pkg && (
          <div style={card}>
            <h2 style={{ fontSize: 18, fontWeight: 900, marginBottom: 6 }}>5. Publish — text to paste into YouTube</h2>
            <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 16 }}>
              Copy each piece into the YouTube upload screen yourself. This tool does not upload or publish anything.
              The chapter times marked [m:ss] are blanks: fill them in after you edit the video, and add a sponsor note if one applies.
            </p>
            {copyBlock("Title (pick one)", pkg.titles.map((t, i) => `${i + 1}. ${t}`).join("\n"))}
            {copyBlock("Description (chapter times are blanks to fill in)", pkg.description)}
            {copyBlock("Tags", pkg.tags.join(", "))}
            {copyBlock("Pinned comment (add it right after publishing)", pkg.pinnedComment)}
            <div style={{ borderTop: "1px solid var(--line2)", paddingTop: 14 }}>
              <label style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "0 0 14px", cursor: "pointer" }}>
                <input type="checkbox" checked={accuracyOk} onChange={(e) => setAccuracyOk(e.target.checked)} style={{ marginTop: 3 }} />
                <span style={{ fontSize: 13.5, color: "var(--text)", lineHeight: 1.5 }}>
                  I checked that my footage shows the real steps, the title claims nothing I can&apos;t back, and the limits are in the description.
                </span>
              </label>
              <label style={label}>Video link (paste it after you have published it yourself)</label>
              <input value={record.videoUrl} onChange={(e) => setRecord({ ...record, videoUrl: e.target.value })} placeholder="https://youtu.be/..." style={input} />
              <button onClick={markPublished} className="btn btn-gold" style={{ width: "100%", marginTop: 12 }}>
                I published it — save the link and build the social posts
              </button>
              {record.publishedAt && (
                <p style={{ fontSize: 12.5, color: "var(--muted)", margin: "8px 0 0" }}>You marked this published on {record.publishedAt.slice(0, 10)}</p>
              )}
            </div>
          </div>
        )}

        {/* ---- 6 PROMOTE ---- */}
        {stage === "promote" && pkg && (
          <div style={card}>
            <h2 style={{ fontSize: 18, fontWeight: 900, marginBottom: 6 }}>6. Promote — social post text</h2>
            <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 16 }}>
              One version per platform, each pointing to your video link.
              {!record.videoUrl.trim() && " Add the video link on the Publish step and it fills in here."}
            </p>
            {social.map((p) => copyBlock(p.platform, p.text))}
            {copyBlock("Step In The Ring article (markdown)", pkg.article)}
          </div>
        )}

        {/* ---- 7 LEARN ---- */}
        {stage === "learn" && (
          <div style={card}>
            <h2 style={{ fontSize: 18, fontWeight: 900, marginBottom: 6 }}>7. Check-ins — your own numbers</h2>
            <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 16 }}>
              Type in numbers from YouTube Studio when you want a record. This tool does not fetch them.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
              <div><label style={label}>Date</label><input type="date" value={snap.date} onChange={(e) => setSnap({ ...snap, date: e.target.value })} style={input} /></div>
              <div><label style={label}>Views</label><input value={snap.views} onChange={(e) => setSnap({ ...snap, views: e.target.value })} placeholder="e.g. 412" style={input} /></div>
              <div><label style={label}>Watch time</label><input value={snap.watchTime} onChange={(e) => setSnap({ ...snap, watchTime: e.target.value })} placeholder="e.g. 9.1 hrs" style={input} /></div>
              <div><label style={label}>Click-through rate</label><input value={snap.ctr} onChange={(e) => setSnap({ ...snap, ctr: e.target.value })} placeholder="e.g. 4.2%" style={input} /></div>
            </div>
            <label style={label}>What are people saying and searching?</label>
            <textarea value={snap.notes} onChange={(e) => setSnap({ ...snap, notes: e.target.value })} placeholder="Comments that report success, questions, search terms, follow-up topics" style={{ ...input, minHeight: 66, resize: "vertical" }} />
            <button onClick={addSnapshot} className="btn btn-gold" style={{ width: "100%", margin: "12px 0 4px" }}>Save the check-in</button>
            {record.snapshots.map((s) => (
              <div key={s.id} style={{ padding: "10px 0", borderBottom: "1px solid var(--line2)" }}>
                <p style={{ fontSize: 13, fontWeight: 800, color: "var(--text)", margin: 0 }}>
                  {s.date}{s.views ? ` · ${s.views} views` : ""}{s.watchTime ? ` · ${s.watchTime}` : ""}{s.ctr ? ` · ${s.ctr} CTR` : ""}
                </p>
                {s.notes && <p style={{ fontSize: 13, color: "var(--muted)", margin: "3px 0 0", lineHeight: 1.5 }}>{s.notes}</p>}
              </div>
            ))}
            <div style={{ borderTop: "1px solid var(--line2)", marginTop: 14, paddingTop: 14 }}>
              <p style={{ fontSize: 13.5, color: "var(--text)", fontWeight: 800, margin: "0 0 8px" }}>
                When you solve something else:
              </p>
              <button onClick={() => startNew()} className="btn btn-gold">+ Start the next solution</button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
