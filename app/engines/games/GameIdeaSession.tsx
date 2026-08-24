"use client";

/**
 * Game Idea Session — the NEW-game path.
 *
 * Pick what sounds fun, get a real first game shape back immediately, then
 * refine it one question at a time. Deterministic — no model call, and the
 * result is a shape/brief to build from, never a claim of a finished game.
 */

import { useEffect, useState } from "react";
import {
  GENRES, GENRE_LABELS, addFunHook, addObstacle, buildBrief, buildShape,
  changeGenre, keepShape, nextPrompt, pickGenre, startGameIdea,
  type GameIdeaSessionV1,
} from "./game-idea.engine";
import { clearGameIdeaSession, loadGameIdeaSession, saveGameIdeaSession } from "./game-idea.store";

export default function GameIdeaSession({ idea, card }: { idea: string; card: React.CSSProperties }) {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<GameIdeaSessionV1 | null>(null);
  const [draft, setDraft] = useState("");
  const [flash, setFlash] = useState("");

  useEffect(() => {
    const existing = loadGameIdeaSession();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSession(existing && existing.idea === idea ? existing : startGameIdea(idea));
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const say = (m: string) => { setFlash(m); setTimeout(() => setFlash(""), 2200); };
  const copy = async (text: string) => {
    try { await navigator.clipboard.writeText(text); say("Copied"); }
    catch { say("Couldn't reach your clipboard — select the text and copy it by hand."); }
  };

  const input = { width: "100%", boxSizing: "border-box" as const, background: "var(--surface)", border: "1px solid var(--line2)", borderRadius: 10, color: "var(--text)", padding: "10px 12px", fontSize: 15, fontFamily: "inherit" };
  const kicker = { fontSize: 12, fontWeight: 900, color: "var(--gold)", textTransform: "uppercase" as const, letterSpacing: "0.1em" };

  if (!ready || !session) return <div style={{ height: 160 }} />;

  const set = (next: GameIdeaSessionV1) => { setSession(saveGameIdeaSession(next)); setDraft(""); };

  // ---------------- Genre pick ----------------
  if (!session.genre) {
    return (
      <div style={card}>
        <span style={kicker}>What sounds fun?</span>
        {session.idea && <p style={{ fontSize: 14, color: "var(--text)", margin: "8px 0 14px", lineHeight: 1.5 }}>Your idea: {session.idea}</p>}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
          {GENRES.map((g) => (
            <button key={g} onClick={() => set(pickGenre(session, g))} className="btn btn-gold btn-small">{GENRE_LABELS[g]}</button>
          ))}
        </div>
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
          {prompt && (
            <button onClick={() => set(keepShape(session))} className="btn btn-gold btn-small">Keep this</button>
          )}
          <button onClick={() => set(changeGenre(session))} className="btn btn-ghost btn-small">Change it</button>
          <button onClick={() => copy(buildBrief(session))} className="btn btn-ghost btn-small">Copy</button>
          {flash && <span style={{ fontSize: 12.5, color: "var(--gold)", fontWeight: 800 }}>{flash}</span>}
        </div>
      </div>

      {prompt && (
        <div style={card}>
          <label htmlFor="game-idea-next" style={{ display: "block", fontSize: 15, fontWeight: 800, color: "var(--text)", marginBottom: 6 }}>{prompt.title}</label>
          <textarea id="game-idea-next" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={prompt.placeholder} style={{ ...input, minHeight: 80, resize: "vertical" }} />
          <button
            onClick={() => set(session.round === 1 ? addObstacle(session, draft) : addFunHook(session, draft))}
            className="btn btn-gold"
            style={{ width: "100%", marginTop: 12 }}
          >
            Keep going →
          </button>
        </div>
      )}

      {!prompt && (
        <div style={{ ...card, marginTop: 14 }}>
          <p style={{ fontSize: 13.5, color: "var(--muted)", lineHeight: 1.55, margin: 0 }}>
            This is a shape, not a finished game — make the smallest playable version of it first. Want to
            build it toward a real doku world instead?{" "}
            <button onClick={() => { clearGameIdeaSession(); set(changeGenre(session)); }} className="btn btn-ghost btn-small" style={{ marginLeft: 6 }}>
              Start a new idea
            </button>
          </p>
        </div>
      )}
    </div>
  );
}
