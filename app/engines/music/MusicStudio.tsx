"use client";

/**
 * Music Engine front door.
 *
 * The engine no longer assumes everyone starts from zero. Two paths:
 *  - "Bring your song to life" — for creators who already have words, a
 *    melody, a recording, or a project. Adaptive Song Studio.
 *  - "Start from nothing — first beat" — the original guided beginner flow,
 *    unchanged (OnboardingFlow + MUSIC_ENGINE data).
 */

import { useEffect, useState } from "react";
import OnboardingFlow from "../shared/OnboardingFlow";
import { MUSIC_ENGINE } from "./music.engine";
import {
  STARTING_ELEMENT_LABELS, createSongProject, resumeSummary,
  type SongProjectV1, type SoftwarePath, type StartingElement,
} from "./song.engine";
import { deleteSong, loadSongs, saveSong } from "./song.store";
import SongStudio from "./SongStudio";

const card = { background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 16, padding: 18 } as const;
const input = {
  width: "100%", boxSizing: "border-box" as const, background: "var(--surface)",
  border: "1px solid var(--line2)", borderRadius: 10, color: "var(--text)",
  padding: "11px 12px", fontSize: 15, fontFamily: "inherit",
};

type View = "door" | "new-song" | "song" | "first-beat";

const STARTING_ELEMENTS = Object.keys(STARTING_ELEMENT_LABELS) as StartingElement[];

export default function MusicStudio({ onBack }: { onBack: () => void }) {
  const [ready, setReady] = useState(false);
  const [songs, setSongs] = useState<SongProjectV1[]>([]);
  const [view, setView] = useState<View>("door");
  const [activeId, setActiveId] = useState<string>("");

  // new-song form
  const [title, setTitle] = useState("");
  const [starting, setStarting] = useState<StartingElement[]>([]);
  const [equipment, setEquipment] = useState<string[]>([]);
  const [software, setSoftware] = useState<SoftwarePath>("undecided");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSongs(loadSongs());
    setReady(true);
  }, []);

  const active = songs.find((s) => s.id === activeId) ?? null;

  const save = (p: SongProjectV1) => setSongs(saveSong(p));

  if (!ready) return <div className="page"><div style={{ height: 200 }} /></div>;

  if (view === "first-beat") {
    return <OnboardingFlow engine={MUSIC_ENGINE} onBack={() => setView("door")} />;
  }

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
            Bring a song that already started to a real playable Version One — or make your first beat from
            nothing. Your words, your melody, your authorship. The engine guides, preserves, and keeps the record.
          </p>
        </header>

        {view === "door" && (
          <>
            {songs.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <span className="kicker">Your songs</span>
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

            <div style={{ ...card, marginBottom: 12 }}>
              <h2 style={{ fontSize: 16.5, fontWeight: 900, margin: "0 0 4px" }}>Bring your song to life</h2>
              <p style={{ fontSize: 13.5, color: "var(--muted)", margin: "0 0 12px", lineHeight: 1.55 }}>
                Words came to you? A melody is forming? A voice memo, chords, a beat, or a half-finished
                project exists? Start here — the engine meets you where the song already is and preserves
                the spark before anything else.
              </p>
              <button onClick={() => setView("new-song")} className="btn btn-gold">I already have something →</button>
            </div>

            <div style={card}>
              <h2 style={{ fontSize: 16.5, fontWeight: 900, margin: "0 0 4px" }}>Start from nothing — first beat</h2>
              <p style={{ fontSize: 13.5, color: "var(--muted)", margin: "0 0 12px", lineHeight: 1.55 }}>
                No idea yet? The guided beginner path: choose your device, get free music software from
                official sources, and finish a real exported first beat.
              </p>
              <button onClick={() => setView("first-beat")} className="btn btn-ghost">Start from zero →</button>
            </div>
          </>
        )}

        {view === "new-song" && (
          <>
            <button onClick={() => setView("door")} className="btn btn-ghost btn-small" style={{ marginBottom: 12 }}>← Back</button>
            <div style={card}>
              <h2 style={{ fontSize: 16, fontWeight: 900, margin: "0 0 4px" }}>What do you already have?</h2>
              <p style={{ fontSize: 13, color: "var(--muted)", margin: "0 0 10px", lineHeight: 1.5 }}>
                Pick everything that&apos;s true — more than one is normal. The engine skips setup you don&apos;t need.
              </p>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
                {STARTING_ELEMENTS.map((el) => {
                  const on = starting.includes(el);
                  return (
                    <button key={el} aria-pressed={on}
                      onClick={() => setStarting((prev) => (prev.includes(el) ? prev.filter((x) => x !== el) : [...prev, el]))}
                      className={on ? "btn btn-gold btn-small" : "btn btn-ghost btn-small"}>
                      {STARTING_ELEMENT_LABELS[el]}
                    </button>
                  );
                })}
              </div>
              {starting.includes("nothing") && starting.length === 1 && (
                <p style={{ fontSize: 13, color: "var(--text)", background: "var(--surface)", border: "1px solid var(--line2)", borderRadius: 10, padding: 10, marginBottom: 14, lineHeight: 1.5 }}>
                  Starting from nothing? The guided first-beat path is built exactly for that —{" "}
                  <button onClick={() => setView("first-beat")} style={{ background: "none", border: "none", color: "var(--gold)", fontWeight: 800, cursor: "pointer", padding: 0, fontSize: 13 }}>
                    take it here →
                  </button>
                </p>
              )}

              <label htmlFor="new-title" style={{ display: "block", fontSize: 13.5, fontWeight: 800, marginBottom: 4 }}>Working title (editable any time)</label>
              <input id="new-title" value={title} onChange={(e) => setTitle(e.target.value)}
                placeholder='e.g., "New Life — Born Again"' style={{ ...input, marginBottom: 14 }} />

              <label style={{ display: "block", fontSize: 13.5, fontWeight: 800, marginBottom: 4 }}>Equipment you have</label>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
                {["Akai MPK Mini", "Other MIDI keyboard", "Microphone", "Headphones", "Phone only"].map((eq) => {
                  const on = equipment.includes(eq);
                  return (
                    <button key={eq} aria-pressed={on}
                      onClick={() => setEquipment((prev) => (prev.includes(eq) ? prev.filter((x) => x !== eq) : [...prev, eq]))}
                      className={on ? "btn btn-gold btn-small" : "btn btn-ghost btn-small"}>{eq}</button>
                  );
                })}
              </div>

              <label htmlFor="new-software" style={{ display: "block", fontSize: 13.5, fontWeight: 800, marginBottom: 4 }}>Software you plan to use</label>
              <select id="new-software" value={software} onChange={(e) => setSoftware(e.target.value as SoftwarePath)} style={{ ...input, marginBottom: 16 }}>
                <option value="undecided">Not decided yet</option>
                <option value="mpc-beats">MPC Beats</option>
                <option value="bandlab">BandLab</option>
                <option value="garageband">GarageBand</option>
                <option value="other">Other software</option>
              </select>

              <button className="btn btn-gold" style={{ width: "100%" }}
                onClick={() => {
                  const p = createSongProject({ workingTitle: title, startingState: starting, equipment, software });
                  setSongs(saveSong(p));
                  setActiveId(p.id);
                  setTitle(""); setStarting([]); setEquipment([]); setSoftware("undecided");
                  setView("song");
                }}>
                Open the song workspace →
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
