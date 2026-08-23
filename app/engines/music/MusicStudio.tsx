"use client";

/**
 * Music Engine front door.
 *
 * Primary experience: say what you want to make, get one next move, copy it,
 * do the step in your real tool, paste back what happened, keep going — see
 * MusicSession.tsx. Existing "Bring your song to life" projects (deeper
 * lyric/proof tracking for a song already under way) stay resumable below;
 * that workspace is untouched.
 */

import { useEffect, useState } from "react";
import { resumeSummary, type SongProjectV1 } from "./song.engine";
import { deleteSong, loadSongs, saveSong } from "./song.store";
import SongStudio from "./SongStudio";
import MusicSession from "./MusicSession";

const card = { background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 16, padding: 18 } as const;

type View = "door" | "song";

export default function MusicStudio({ onBack }: { onBack: () => void }) {
  const [ready, setReady] = useState(false);
  const [songs, setSongs] = useState<SongProjectV1[]>([]);
  const [view, setView] = useState<View>("door");
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSongs(loadSongs());
    setReady(true);
  }, []);

  const active = songs.find((s) => s.id === activeId) ?? null;

  const save = (p: SongProjectV1) => setSongs(saveSong(p));

  if (!ready) return <div className="page"><div style={{ height: 200 }} /></div>;

  if (view === "song" && active) {
    return (
      <main>
        <div className="page">
          <SongStudio project={active} onChange={save} onBack={() => setView("door")} />
        </div>
      </main>
    );
  }

  return (
    <main>
      <div className="page">
        <button onClick={onBack} className="btn btn-ghost btn-small" style={{ marginBottom: 12 }}>← Engine Room</button>

        <header style={{ marginBottom: 16 }}>
          <h1 style={{ fontSize: "clamp(1.5rem,6vw,2rem)", fontWeight: 900, color: "var(--text)", margin: "0 0 6px" }}>
            Music Engine
          </h1>
          <p style={{ fontSize: 14.5, color: "var(--muted)", margin: 0, lineHeight: 1.5 }}>
            Make something you can hear.
          </p>
        </header>

        {songs.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <span className="kicker">Song projects in progress</span>
            {songs.map((s) => {
              const r = resumeSummary(s);
              return (
                <div key={s.id} style={{ ...card, borderLeft: "4px solid var(--gold)", marginTop: 10 }}>
                  <p style={{ fontSize: 16, fontWeight: 900, color: "var(--text)", margin: 0 }}>🎵 {r.title}</p>
                  <p style={{ fontSize: 12.5, color: "var(--muted)", margin: "3px 0 6px" }}>
                    {r.stageLabel} · saved {new Date(r.lastSaved).toLocaleDateString()}
                    {r.unknowns.length > 0 ? ` · still unknown: ${r.unknowns.join(", ")}` : ""} · {r.proofCount} proof{r.proofCount !== 1 ? "s" : ""}
                  </p>
                  <p style={{ fontSize: 13.5, color: "var(--text)", margin: "0 0 10px", lineHeight: 1.5 }}>
                    <b style={{ color: "var(--gold)" }}>Next:</b> {r.next.title}
                  </p>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <button onClick={() => { setActiveId(s.id); setView("song"); }} className="btn btn-gold btn-small">Resume</button>
                    <button onClick={() => { if (confirm(`Delete "${s.workingTitle}"? This removes the whole project, including the preserved source.`)) setSongs(deleteSong(s.id)); }}
                      className="btn btn-ghost btn-small">Delete</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <MusicSession />
      </div>
    </main>
  );
}
