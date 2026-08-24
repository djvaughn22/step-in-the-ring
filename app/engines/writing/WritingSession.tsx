"use client";

/**
 * Writing Session — the smallest public writing/story engine.
 *
 * Say what you want to write, get real story material immediately, then
 * shape it one piece at a time. Deterministic — no model call.
 */

import { useEffect, useState } from "react";
import {
  buildBrief, buildShape, addEnding, addProblem, keepShape,
  nextPrompt, startWriting, writeOpening,
  type WritingSessionV1,
} from "./writing-session.engine";
import { clearWritingSession, loadWritingSession, saveWritingSession } from "./writing-session.store";

const card = { background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 16, padding: 18 } as const;
const input = {
  width: "100%", boxSizing: "border-box" as const, background: "var(--surface)",
  border: "1px solid var(--line2)", borderRadius: 10, color: "var(--text)",
  padding: "11px 12px", fontSize: 15, fontFamily: "inherit",
};

export default function WritingSession({ seedIdea }: { seedIdea?: string }) {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<WritingSessionV1 | null>(null);
  const [ideaDraft, setIdeaDraft] = useState("");
  const [answerDraft, setAnswerDraft] = useState("");
  const [flash, setFlash] = useState("");

  useEffect(() => {
    const existing = loadWritingSession();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSession(existing && (!seedIdea || existing.idea === seedIdea) ? existing : seedIdea ? startWriting(seedIdea) : null);
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const say = (m: string) => { setFlash(m); setTimeout(() => setFlash(""), 2200); };
  const copy = async (text: string) => {
    try { await navigator.clipboard.writeText(text); say("Copied"); }
    catch { say("Couldn't reach your clipboard — select the text and copy it by hand."); }
  };
  const set = (next: WritingSessionV1) => { setSession(saveWritingSession(next)); setAnswerDraft(""); };

  if (!ready) return <div style={{ height: 160 }} />;

  // ---------------- Intake ----------------
  if (!session) {
    return (
      <div style={card}>
        <h2 style={{ fontSize: 16.5, fontWeight: 900, margin: "0 0 4px" }}>What do you want to write?</h2>
        <p style={{ fontSize: 12.5, color: "var(--muted)", margin: "0 0 10px" }}>A story, a note, an article — however it comes out.</p>
        <textarea
          value={ideaDraft} onChange={(e) => setIdeaDraft(e.target.value)}
          placeholder="e.g., a funny bedtime story about a dog who thinks he's mayor"
          style={{ ...input, minHeight: 100, resize: "vertical", marginBottom: 14 }}
        />
        <button onClick={() => set(startWriting(ideaDraft))} disabled={!ideaDraft.trim()} className="btn btn-gold" style={{ width: "100%", opacity: ideaDraft.trim() ? 1 : 0.5 }}>
          Start writing →
        </button>
      </div>
    );
  }

  const shape = buildShape(session);
  const prompt = nextPrompt(session);

  return (
    <div>
      <div style={{ ...card, marginBottom: 14, borderLeft: "4px solid var(--gold)" }}>
        <pre style={{ whiteSpace: "pre-wrap", fontFamily: "inherit", fontSize: 14, color: "var(--text)", lineHeight: 1.6, margin: 0 }}>{shape}</pre>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14 }}>
          {prompt && <button onClick={() => set(keepShape(session))} className="btn btn-gold btn-small">Keep this</button>}
          <button onClick={() => { clearWritingSession(); setSession(null); setIdeaDraft(""); }} className="btn btn-ghost btn-small">Change it</button>
          {!session.showOpening && <button onClick={() => set(writeOpening(session))} className="btn btn-ghost btn-small">Write the opening</button>}
          <button onClick={() => copy(buildBrief(session))} className="btn btn-ghost btn-small">Copy</button>
          {flash && <span style={{ fontSize: 12.5, color: "var(--gold)", fontWeight: 800 }}>{flash}</span>}
        </div>
      </div>

      {prompt && (
        <div style={card}>
          <label htmlFor="writing-next" style={{ display: "block", fontSize: 15, fontWeight: 800, color: "var(--text)", marginBottom: 6 }}>{prompt.title}</label>
          <textarea id="writing-next" value={answerDraft} onChange={(e) => setAnswerDraft(e.target.value)} placeholder={prompt.placeholder} style={{ ...input, minHeight: 80, resize: "vertical" }} />
          <button
            onClick={() => set(session.round === 0 ? addProblem(session, answerDraft) : addEnding(session, answerDraft))}
            className="btn btn-gold"
            style={{ width: "100%", marginTop: 12 }}
          >
            Keep going →
          </button>
        </div>
      )}

      {!prompt && (
        <p className="tiny" style={{ marginTop: 10 }}>
          This is a shape to write from, not a finished piece.
        </p>
      )}
    </div>
  );
}
