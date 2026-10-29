"use client";

/**
 * Music Session — the working companion.
 *
 * Say what you want to make → get one next move → copy it → do the step in
 * your real music tool → paste back what happened → keep going. This is the
 * whole interaction model; there is no giant checklist rendered up front.
 * Nothing here calls a model or generates audio — every move is built from
 * the goal, the chosen tool, and whatever was pasted back last time.
 */

import { useEffect, useState } from "react";
import {
  STAGE_LABELS, STAGE_ORDER, TOOLS, TOOL_LABELS,
  advance, currentMove, goBack, isFinished, progress as sessionProgress, retry, sessionSummary, startSession, stuckHelp,
  type MusicSessionV1, type Tool,
} from "./music-session.engine";
import { clearSession, loadSession, saveSession } from "./music-session.store";
import { useFlash } from "../shared/useFlash";
import { downloadText } from "../artifacts/ArtifactView";

const card = { background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 16, padding: 18 } as const;
const input = {
  width: "100%", boxSizing: "border-box" as const, background: "var(--surface)",
  border: "1px solid var(--line2)", borderRadius: 10, color: "var(--text)",
  padding: "11px 12px", fontSize: 15, fontFamily: "inherit",
};
const label = { display: "block", fontSize: 13.5, fontWeight: 800, color: "var(--text)", marginBottom: 4 } as const;
const sub = { fontSize: 12.5, color: "var(--muted)", lineHeight: 1.5 } as const;

const GOAL_PLACEHOLDER =
  "a laid-back reggae beat\na simple piano idea\na first hip-hop loop\nbackground music for a game\na song from an idea I already have";

export default function MusicSession({ seedIdea }: { seedIdea?: string }) {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<MusicSessionV1 | null>(null);
  // Initial value only — a person editing their own draft should never have
  // it overwritten if the seed prop happens to change identity later.
  const [goalDraft, setGoalDraft] = useState(() => seedIdea ?? "");
  const [toolDraft, setToolDraft] = useState<Tool>("unsure");
  const [noteDraft, setNoteDraft] = useState("");
  const [stuckOpen, setStuckOpen] = useState(false);
  const [flash, say] = useFlash(2400);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSession(loadSession());
    setReady(true);
  }, []);

  const copy = async (text: string) => {
    try { await navigator.clipboard.writeText(text); say("Copied"); }
    catch { say("Couldn't reach your clipboard — select the text and copy it by hand."); }
  };

  const start = () => {
    setSession(saveSession(startSession(goalDraft, toolDraft)));
    setGoalDraft(""); setToolDraft("unsure"); setNoteDraft(""); setStuckOpen(false);
  };

  const keepGoing = () => {
    if (!session) return;
    setSession(saveSession(advance(session, noteDraft)));
    setNoteDraft(""); setStuckOpen(false);
  };

  const didntWork = () => {
    if (!session) return;
    if (!noteDraft.trim()) { say("Write what went wrong first, then press this."); return; }
    setSession(saveSession(retry(session, noteDraft)));
    setNoteDraft(""); setStuckOpen(false);
  };

  const previous = () => {
    if (!session) return;
    setSession(saveSession(goBack(session)));
    setNoteDraft(""); setStuckOpen(false);
  };

  const startSomethingNew = () => {
    clearSession();
    setSession(null);
    setNoteDraft(""); setStuckOpen(false);
  };

  if (!ready) return <div style={{ height: 160 }} />;

  // ---------------- Intake: what do you want to make ----------------
  if (!session) {
    return (
      <div style={card}>
        <h2 style={{ fontSize: 16.5, fontWeight: 900, margin: "0 0 4px" }}>What do you want to make?</h2>
        <p style={{ ...sub, margin: "0 0 10px" }}>Say it in a few words. Leave it empty and you get a first-beat walkthrough. Each step is written from your words and the tool you pick.</p>
        <label htmlFor="music-goal" className="sr-only">What do you want to make</label>
        <textarea id="music-goal" value={goalDraft} onChange={(e) => setGoalDraft(e.target.value)}
          placeholder={GOAL_PLACEHOLDER} style={{ ...input, minHeight: 110, resize: "vertical", marginBottom: 14 }} />

        <label htmlFor="music-tool" style={label}>What are you using?</label>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }} role="group" aria-label="What are you using">
          {TOOLS.map((t) => {
            const on = toolDraft === t;
            return (
              <button key={t} aria-pressed={on} onClick={() => setToolDraft(t)}
                className={on ? "btn btn-gold btn-small" : "btn btn-ghost btn-small"}>{TOOL_LABELS[t]}</button>
            );
          })}
        </div>

        <button onClick={start} className="btn btn-gold" style={{ width: "100%" }}>Start making →</button>
      </div>
    );
  }

  // ---------------- Finished ----------------
  if (isFinished(session)) {
    return (
      <div style={card}>
        <h2 style={{ fontSize: 16.5, fontWeight: 900, margin: "0 0 6px" }}>All seven steps marked done</h2>
        <p style={{ fontSize: 14, color: "var(--text)", margin: "0 0 4px" }}>
          <b>{session.goal || "First beat"}</b> · {TOOL_LABELS[session.tool]}
        </p>
        <p style={{ ...sub, margin: "0 0 14px" }}>
          You said each step was done. This page can&apos;t hear or check the track, and it has no audio. If you exported a file, it is in your music software or your downloads.
        </p>
        {session.log.some((e) => e.note.trim()) && (
          <ol style={{ margin: "0 0 14px", paddingLeft: 20, fontSize: 13.5, color: "var(--text)", lineHeight: 1.5 }}>
            {session.log.filter((e) => e.note.trim()).map((e, i) => <li key={i}>Step {e.stepIndex + 1}: {e.note}</li>)}
          </ol>
        )}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <button onClick={() => copy(sessionSummary(session))} className="btn btn-ghost btn-small">Copy notes</button>
          <button onClick={() => downloadText("music-notes.txt", sessionSummary(session))} className="btn btn-ghost btn-small">Download notes</button>
          <button onClick={previous} className="btn btn-ghost btn-small">← Back to step 7</button>
          <button onClick={startSomethingNew} className="btn btn-gold">Start something new →</button>
          {flash && <span style={{ fontSize: 12.5, color: "var(--gold)", fontWeight: 800 }}>{flash}</span>}
        </div>
      </div>
    );
  }

  // ---------------- Active flow ----------------
  const move = currentMove(session);
  const prog = sessionProgress(session);
  const lastNote = session.log[session.log.length - 1]?.note.trim() ?? "";

  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }} role="list" aria-label="Progress">
        {STAGE_ORDER.map((stage, i) => {
          const done = i < prog.stageIndex;
          const active = i === prog.stageIndex;
          return (
            <span key={stage} role="listitem" style={{
              fontSize: 11.5, fontWeight: 800, borderRadius: 50, padding: "4px 10px",
              background: active ? "var(--gold)" : done ? "var(--surface)" : "var(--surface)",
              color: active ? "#000" : done ? "var(--text)" : "var(--muted)",
              border: `1px solid ${active ? "var(--gold)" : "var(--line2)"}`,
            }}>{done ? "✓ " : ""}{i + 1}. {STAGE_LABELS[stage]}</span>
          );
        })}
      </div>

      <div style={{ ...card, marginBottom: 14, borderLeft: "4px solid var(--gold)" }}>
        <p style={{ fontSize: 11.5, fontWeight: 900, color: "var(--gold)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 6px" }}>
          Do this next · {STAGE_LABELS[move.stage]}
        </p>
        <h2 style={{ fontSize: 17, fontWeight: 900, color: "var(--text)", margin: "0 0 6px" }}>{move.title}</h2>
        <p style={{ fontSize: 14, color: "var(--text)", lineHeight: 1.55, margin: "0 0 14px" }}>{move.detail}</p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <button onClick={() => copy(move.copyText)} className="btn btn-gold btn-small">Copy</button>
          <button onClick={() => setStuckOpen((v) => !v)} className="btn btn-ghost btn-small">I&apos;m stuck</button>
          {flash && <span style={{ fontSize: 12.5, color: "var(--gold)", fontWeight: 800 }}>{flash}</span>}
        </div>
        <p style={{ ...sub, margin: "8px 0 0" }}>Copy turns this step into a message you can paste into any assistant you use. This page does not contact one.</p>
        {lastNote && (
          <p style={{ ...sub, margin: "8px 0 0" }}>
            You wrote: &ldquo;{lastNote}&rdquo;. This tool doesn&apos;t read it. It is saved and added to the Copy text.
          </p>
        )}
        {stuckOpen && (
          <div style={{ background: "var(--surface)", border: "1px solid var(--line2)", borderRadius: 10, padding: 12, marginTop: 12 }}>
            {stuckHelp(session.tool).map((tip, i) => (
              <p key={i} style={{ ...sub, margin: i === 0 ? 0 : "8px 0 0" }}>{tip}</p>
            ))}
          </div>
        )}
      </div>

      <div style={card}>
        <label htmlFor="music-paste-back" style={label}>What happened?</label>
        <p style={{ ...sub, margin: "0 0 8px" }}>Paste a response, or describe what you did. Leave it blank if it&apos;s simply done.</p>
        <textarea id="music-paste-back" value={noteDraft} onChange={(e) => setNoteDraft(e.target.value)}
          placeholder="e.g., &quot;Done. The beat feels too empty.&quot; or paste what an assistant told you."
          style={{ ...input, minHeight: 70, resize: "vertical", marginBottom: 12 }} />
        <button onClick={keepGoing} className="btn btn-gold" style={{ width: "100%" }}>Done — keep going →</button>
        <button onClick={didntWork} className="btn btn-ghost" style={{ width: "100%", marginTop: 8 }}>That didn&apos;t work — stay on this step</button>
        <p style={{ ...sub, margin: "10px 0 0" }}>
          Saved on this device · step {prog.moveIndex + 1} of {prog.moveCount}
        </p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
          {prog.moveIndex > 0 && <button onClick={previous} className="btn btn-ghost btn-small">← Previous step</button>}
          <button onClick={startSomethingNew} className="btn btn-ghost btn-small">Start something new</button>
        </div>
      </div>
    </div>
  );
}
