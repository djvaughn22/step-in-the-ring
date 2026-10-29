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
import { useFlash } from "../shared/useFlash";
import { downloadText } from "../artifacts/ArtifactView";

export default function GameIdeaSession({ idea, card }: { idea: string; card: React.CSSProperties }) {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<GameIdeaSessionV1 | null>(null);
  const [draft, setDraft] = useState("");
  const [flash, say] = useFlash(2200);

  useEffect(() => {
    const existing = loadGameIdeaSession();
    const next = existing && (!idea || existing.idea === idea) ? existing : startGameIdea(idea);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSession(next);
    setDraft(next.idea);
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const copy = async (text: string) => {
    try { await navigator.clipboard.writeText(text); say("Copied"); }
    catch { say("Couldn't reach your clipboard — select the text and copy it by hand."); }
  };

  const input = { width: "100%", boxSizing: "border-box" as const, background: "var(--surface)", border: "1px solid var(--line2)", borderRadius: 10, color: "var(--text)", padding: "10px 12px", fontSize: 15, fontFamily: "inherit" };
  const kicker = { fontSize: 12, fontWeight: 900, color: "var(--gold)", textTransform: "uppercase" as const, letterSpacing: "0.1em" };

  if (!ready || !session) return <div style={{ height: 160 }} />;

  const set = (next: GameIdeaSessionV1) => { setSession(saveGameIdeaSession(next)); setDraft(next.genre ? "" : next.idea); };

  // ---------------- Genre pick ----------------
  if (!session.genre) {
    return (
      <div style={card}>
        <label htmlFor="game-idea-text" style={{ display: "block", fontSize: 15, fontWeight: 800, color: "var(--text)", marginBottom: 6 }}>What&apos;s the game? (one line, optional)</label>
        <textarea id="game-idea-text" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="e.g. a game where kids race to finish chores before the timer runs out" style={{ ...input, minHeight: 70, resize: "vertical", marginBottom: 14 }} />
        <p style={{ fontSize: 12.5, color: "var(--muted)", margin: "0 0 12px", lineHeight: 1.5 }}>Describe it with &ldquo;where…&rdquo; (a game where you…) and that part becomes the core action. Then pick a type. The rest of the shape is a standard setup for that type.</p>
        <span style={kicker}>What sounds fun?</span>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
          {GENRES.map((g) => (
            <button key={g} onClick={() => set(pickGenre(session, g, undefined, draft))} className="btn btn-gold btn-small">{GENRE_LABELS[g]}</button>
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
            <button onClick={() => set(keepShape(session))} className="btn btn-gold btn-small">Keep this, no more questions</button>
          )}
          <button onClick={() => set(changeGenre(session))} className="btn btn-ghost btn-small">Change the type</button>
          <button onClick={() => copy(buildBrief(session))} className="btn btn-ghost btn-small">Copy</button>
          <button onClick={() => downloadText("game-idea.md", `${buildShape(session)}\n`)} className="btn btn-ghost btn-small">Download .md</button>
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
            This is a starting point, not a game. Nothing has been built or tested. Make the smallest playable version first.{" "}
            <button onClick={() => { clearGameIdeaSession(); set(startGameIdea("")); }} className="btn btn-ghost btn-small" style={{ marginLeft: 6 }}>
              Start a new idea
            </button>
          </p>
        </div>
      )}
    </div>
  );
}
