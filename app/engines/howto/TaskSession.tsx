"use client";

/**
 * Task Session — How to Anything's default mode.
 *
 * WHAT ARE YOU TRYING TO DO? → one concrete next step → DID IT WORK? →
 * next step. Deterministic — no model call.
 */

import { useEffect, useState } from "react";
import { advance, currentStep, finish, startTask, stuckHelp, type TaskSessionV1 } from "./task-session.engine";
import { clearTaskSession, loadTaskSession, saveTaskSession } from "./task-session.store";

const card = { background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 16, padding: 18 } as const;
const input = {
  width: "100%", boxSizing: "border-box" as const, background: "var(--surface)",
  border: "1px solid var(--line2)", borderRadius: 10, color: "var(--text)",
  padding: "11px 12px", fontSize: 15, fontFamily: "inherit",
};
const sub = { fontSize: 12.5, color: "var(--muted)", lineHeight: 1.5 } as const;

export default function TaskSession({ onDocumentInstead }: { onDocumentInstead: () => void }) {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<TaskSessionV1 | null>(null);
  const [goalDraft, setGoalDraft] = useState("");
  const [noteDraft, setNoteDraft] = useState("");
  const [stuckOpen, setStuckOpen] = useState(false);
  const [flash, setFlash] = useState("");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSession(loadTaskSession());
    setReady(true);
  }, []);

  const say = (m: string) => { setFlash(m); setTimeout(() => setFlash(""), 2200); };
  const copy = async (text: string) => {
    try { await navigator.clipboard.writeText(text); say("Copied"); }
    catch { say("Couldn't reach your clipboard — select the text and copy it by hand."); }
  };

  const start = () => { setSession(saveTaskSession(startTask(goalDraft))); setGoalDraft(""); };
  const keepGoing = () => { if (!session) return; setSession(saveTaskSession(advance(session, noteDraft))); setNoteDraft(""); setStuckOpen(false); };
  const startSomethingNew = () => { clearTaskSession(); setSession(null); setNoteDraft(""); setStuckOpen(false); };
  const markDone = () => { if (!session) return; setSession(saveTaskSession(finish(session, undefined))); };

  if (!ready) return <div style={{ height: 160 }} />;

  if (!session) {
    return (
      <div style={card}>
        <h2 style={{ fontSize: 16.5, fontWeight: 900, margin: "0 0 4px" }}>What are you trying to do?</h2>
        <p style={{ fontSize: 12.5, color: "var(--muted)", margin: "0 0 10px" }}>However specific — a tool, a task, a repair.</p>
        <textarea value={goalDraft} onChange={(e) => setGoalDraft(e.target.value)}
          placeholder="e.g., make my first beat in BandLab" style={{ ...input, minHeight: 90, resize: "vertical", marginBottom: 14 }} />
        <button onClick={start} disabled={!goalDraft.trim()} className="btn btn-gold" style={{ width: "100%", opacity: goalDraft.trim() ? 1 : 0.5 }}>
          Start →
        </button>
        <p style={{ ...sub, margin: "14px 0 0" }}>
          Already solved something like this and want to turn it into a video?{" "}
          <button onClick={onDocumentInstead} className="btn btn-ghost btn-small" style={{ marginLeft: 4 }}>Document it instead</button>
        </p>
      </div>
    );
  }

  if (session.finishedAt) {
    return (
      <div style={card}>
        <h2 style={{ fontSize: 16.5, fontWeight: 900, margin: "0 0 6px" }}>Done</h2>
        <p style={{ fontSize: 14, color: "var(--text)", margin: "0 0 14px" }}>{session.goal}</p>
        <button onClick={startSomethingNew} className="btn btn-gold">Start something new →</button>
      </div>
    );
  }

  const step = currentStep(session);

  return (
    <div>
      <div style={{ ...card, marginBottom: 14, borderLeft: "4px solid var(--gold)" }}>
        <p style={{ fontSize: 11.5, fontWeight: 900, color: "var(--gold)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 6px" }}>Next step</p>
        <h2 style={{ fontSize: 17, fontWeight: 900, color: "var(--text)", margin: "0 0 6px" }}>{step.title}</h2>
        <p style={{ fontSize: 14, color: "var(--text)", lineHeight: 1.55, margin: "0 0 14px" }}>{step.detail}</p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <button onClick={() => copy(step.copyText)} className="btn btn-gold btn-small">Copy</button>
          <button onClick={() => setStuckOpen((v) => !v)} className="btn btn-ghost btn-small">I&apos;m stuck</button>
          {flash && <span style={{ fontSize: 12.5, color: "var(--gold)", fontWeight: 800 }}>{flash}</span>}
        </div>
        {stuckOpen && <p style={{ ...sub, marginTop: 12, background: "var(--surface)", border: "1px solid var(--line2)", borderRadius: 10, padding: 12 }}>{stuckHelp(session)}</p>}
      </div>

      <div style={card}>
        <label htmlFor="task-paste-back" style={{ display: "block", fontSize: 13.5, fontWeight: 800, color: "var(--text)", marginBottom: 4 }}>Did it work?</label>
        <p style={{ ...sub, margin: "0 0 8px" }}>Leave it blank for yes, or say what happened.</p>
        <textarea id="task-paste-back" value={noteDraft} onChange={(e) => setNoteDraft(e.target.value)}
          placeholder="e.g., &quot;Yes, done&quot; or &quot;I don't see that button&quot;" style={{ ...input, minHeight: 60, resize: "vertical", marginBottom: 12 }} />
        <button onClick={keepGoing} className="btn btn-gold" style={{ width: "100%" }}>Keep going →</button>
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <button onClick={markDone} className="btn btn-ghost btn-small">That did it — I&apos;m done</button>
          <button onClick={startSomethingNew} className="btn btn-ghost btn-small">Start something new</button>
        </div>
      </div>
    </div>
  );
}
