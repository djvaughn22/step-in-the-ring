"use client";

/**
 * Song Studio — the "Bring Your Song to Life" workspace.
 *
 * One project at a time, one primary next action, honest saved state.
 * The engine organizes, guides, teaches, and records — the creator keeps
 * the words, the melody, and the authorship. All state changes go through
 * the pure functions in song.engine.ts; this file only renders and saves.
 */

import { useMemo, useState } from "react";
import {
  ELEMENT_STATE_LABELS, PLAYABLE_AUDIO_TYPES, PROJECT_PROOF_TYPES,
  PRODUCTION_STAGES, PROOF_TYPE_LABELS, SECTION_KIND_LABELS, SOFTWARE_LABELS,
  STAGE_LABELS, STARTING_ELEMENT_LABELS,
  addHookCandidate, addProof, addSection, canDeclareVersionOne, checklistFor,
  declareVersionOne, duplicateSection, makeWorkingCopy, milestones, moveSection,
  nextAction, preserveOriginalSource, removeHook, removeProof, removeSection,
  songUid, stageOf, updateHook, updateSection, updateWorkingCopy, visibleGuidance,
  type ElementState, type ProofType, type SectionKind, type SongProjectV1, type SongStage,
} from "./song.engine";

const card = { background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 16, padding: 18 } as const;
const input = {
  width: "100%", boxSizing: "border-box" as const, background: "var(--surface)",
  border: "1px solid var(--line2)", borderRadius: 10, color: "var(--text)",
  padding: "11px 12px", fontSize: 15, fontFamily: "inherit",
};
const label = { display: "block", fontSize: 13.5, fontWeight: 800, color: "var(--text)", marginBottom: 4 } as const;
const sub = { fontSize: 12.5, color: "var(--muted)", lineHeight: 1.5 } as const;

const PANELS: [SongStage, string][] = [
  ["spark", "Spark"], ["melody", "Melody"], ["notes", "Notes"],
  ["record", "Record"], ["arrange", "Arrange"], ["finish", "Version One"],
];

const ELEMENT_STATES = Object.keys(ELEMENT_STATE_LABELS) as ElementState[];

function StateSelect({ id, value, onChange, ariaLabel }: {
  id: string; value: ElementState; onChange: (s: ElementState) => void; ariaLabel: string;
}) {
  return (
    <select id={id} aria-label={ariaLabel} value={value} onChange={(e) => onChange(e.target.value as ElementState)} style={input}>
      {ELEMENT_STATES.map((s) => <option key={s} value={s}>{ELEMENT_STATE_LABELS[s]}</option>)}
    </select>
  );
}

export default function SongStudio({ project, onChange, onBack }: {
  project: SongProjectV1;
  onChange: (p: SongProjectV1) => void;
  onBack: () => void;
}) {
  const p = project;
  const next = useMemo(() => nextAction(p), [p]);
  const stones = useMemo(() => milestones(p), [p]);
  const guidance = useMemo(() => visibleGuidance(p), [p]);
  const v1check = useMemo(() => canDeclareVersionOne(p), [p]);

  const [panel, setPanel] = useState<SongStage>(() => {
    const s = stageOf(p);
    return s === "done" ? "finish" : s;
  });

  // input buffers
  const [sourceDraft, setSourceDraft] = useState("");
  const [hookDraft, setHookDraft] = useState("");
  const [noteSection, setNoteSection] = useState("");
  const [noteText, setNoteText] = useState("");
  const [noteRhythm, setNoteRhythm] = useState("");
  const [noteConfidence, setNoteConfidence] = useState<"guess" | "close" | "confident">("guess");
  const [sectionKind, setSectionKind] = useState<SectionKind>("verse");
  const [sectionContent, setSectionContent] = useState("");
  const [proofType, setProofType] = useState<ProofType>(p.software === "mpc-beats" ? "mpc-beats-project" : "daw-project");
  const [proofRef, setProofRef] = useState("");
  const [proofNote, setProofNote] = useState("");
  const [whatWorked, setWhatWorked] = useState("");
  const [nextImprovement, setNextImprovement] = useState("");

  const set = (patch: Partial<SongProjectV1>) => onChange({ ...p, ...patch });

  const checklist = checklistFor(p.software);
  const projectProof = p.proofs.some((x) => (PROJECT_PROOF_TYPES as string[]).includes(x.type));
  const audioProof = p.proofs.some((x) => (PLAYABLE_AUDIO_TYPES as string[]).includes(x.type));

  return (
    <div>
      <button onClick={onBack} className="btn btn-ghost btn-small" style={{ marginBottom: 12 }}>← Music Engine</button>

      {/* ---------- Project header: title, milestones, the one next action ---------- */}
      <div style={{ ...card, marginBottom: 14 }}>
        <label htmlFor="song-title" style={{ ...label, fontSize: 12, textTransform: "uppercase", color: "var(--gold)", letterSpacing: "0.08em" }}>Working title (yours to change)</label>
        <input id="song-title" value={p.workingTitle} onChange={(e) => set({ workingTitle: e.target.value })} style={{ ...input, fontWeight: 800, fontSize: 17, marginBottom: 10 }} />
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
          {stones.map((m) => (
            <span key={m.id} style={{
              fontSize: 11.5, fontWeight: 800, borderRadius: 50, padding: "4px 10px",
              background: m.done ? "var(--gold)" : "var(--surface)",
              color: m.done ? "#000" : "var(--muted)",
              border: `1px solid ${m.done ? "var(--gold)" : "var(--line2)"}`,
            }}>{m.done ? "✓ " : ""}{m.label}</span>
          ))}
        </div>
        <div style={{ background: "var(--surface)", border: "1px solid var(--gold)", borderRadius: 12, padding: 14 }}>
          <p style={{ fontSize: 11.5, fontWeight: 900, color: "var(--gold)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 4px" }}>
            Next · {STAGE_LABELS[next.stage]}
          </p>
          <p style={{ fontSize: 15, fontWeight: 800, color: "var(--text)", margin: "0 0 4px" }}>{next.title}</p>
          <p style={{ ...sub, margin: 0 }}>{next.detail}</p>
        </div>
        <p style={{ ...sub, margin: "10px 0 0" }}>
          Saved on this device · last saved {new Date(p.updatedAt).toLocaleString()}
        </p>
      </div>

      {/* ---------- Stage panels ---------- */}
      <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }} role="tablist" aria-label="Song stages">
        {PANELS.map(([id, name]) => (
          <button key={id} role="tab" aria-selected={panel === id} onClick={() => setPanel(id)}
            className={panel === id ? "btn btn-gold btn-small" : "btn btn-ghost btn-small"}>{name}</button>
        ))}
      </div>

      {/* ================= SPARK ================= */}
      {panel === "spark" && (
        <>
          <div style={{ ...card, marginBottom: 14 }}>
            <h2 style={{ fontSize: 16, fontWeight: 900, margin: "0 0 4px" }}>Preserve the Spark</h2>
            <p style={{ ...sub, margin: "0 0 12px" }}>
              The raw words exactly as they arrived — misspellings, punctuation, and all. This record is
              permanent: later edits happen on a separate working copy, never here.
            </p>
            {p.originalSource ? (
              <>
                <p style={{ fontSize: 12, fontWeight: 900, color: "var(--gold)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 6px" }}>
                  Original source — preserved exactly · {new Date(p.originalSource.preservedAt).toLocaleDateString()}
                </p>
                <pre style={{ whiteSpace: "pre-wrap", fontFamily: "inherit", fontSize: 14, color: "var(--text)", lineHeight: 1.6, background: "var(--surface)", border: "1px dashed var(--gold)", borderRadius: 10, padding: 12, margin: 0 }}>
                  {p.originalSource.text}
                </pre>
                <div style={{ marginTop: 12 }}>
                  {p.workingCopy ? (
                    <>
                      <label htmlFor="working-copy" style={label}>Working copy (editable — the source above never changes)</label>
                      <textarea id="working-copy" value={p.workingCopy} onChange={(e) => onChange(updateWorkingCopy(p, e.target.value))} style={{ ...input, minHeight: 100, resize: "vertical" }} />
                    </>
                  ) : (
                    <button onClick={() => onChange(makeWorkingCopy(p))} className="btn btn-ghost btn-small">
                      Create an editable working copy
                    </button>
                  )}
                </div>
              </>
            ) : (
              <>
                <label htmlFor="source-draft" style={label}>Paste the raw source</label>
                <textarea id="source-draft" value={sourceDraft} onChange={(e) => setSourceDraft(e.target.value)}
                  placeholder="The words exactly as they came to you — nothing gets corrected."
                  style={{ ...input, minHeight: 120, resize: "vertical", marginBottom: 10 }} />
                <button onClick={() => { if (sourceDraft.trim()) { onChange(preserveOriginalSource(p, sourceDraft)); setSourceDraft(""); } }}
                  disabled={!sourceDraft.trim()} className="btn btn-gold" style={{ opacity: sourceDraft.trim() ? 1 : 0.5 }}>
                  Preserve exactly — no edits
                </button>
              </>
            )}
          </div>

          <div style={{ ...card, marginBottom: 14 }}>
            <h3 style={{ fontSize: 14.5, fontWeight: 900, margin: "0 0 4px" }}>What already exists</h3>
            <p style={{ ...sub, margin: "0 0 10px" }}>Pick everything that&apos;s true. The engine skips setup you don&apos;t need.</p>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {(Object.keys(STARTING_ELEMENT_LABELS) as (keyof typeof STARTING_ELEMENT_LABELS)[]).map((el) => {
                const on = p.startingState.includes(el);
                return (
                  <button key={el} aria-pressed={on}
                    onClick={() => set({ startingState: on ? p.startingState.filter((x) => x !== el) : [...p.startingState, el] })}
                    className={on ? "btn btn-gold btn-small" : "btn btn-ghost btn-small"}>
                    {STARTING_ELEMENT_LABELS[el]}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ ...card, marginBottom: 14 }}>
            <h3 style={{ fontSize: 14.5, fontWeight: 900, margin: "0 0 4px" }}>Your boundaries</h3>
            <p style={{ ...sub, margin: "0 0 10px" }}>
              These change what the engine offers — they are rules, not decoration. Authorship stays with you either way.
            </p>
            {([
              ["preserveOriginalWords", "Preserve my original words"],
              ["allowLyricWriting", "The engine may write lyrics for me"],
              ["allowMelodyReplacement", "The engine may replace my melody"],
              ["preserveMeaning", "Do not change testimony or theological meaning"],
              ["askBeforeWordingSuggestions", "Ask before suggesting wording"],
              ["allowProductionGuidance", "Production guidance is welcome"],
              ["allowArrangementGuidance", "Arrangement guidance is welcome"],
              ["allowTheoryTeaching", "Music-theory teaching is welcome"],
              ["allowChordExperiments", "Chord experiments are welcome"],
            ] as const).map(([k, text]) => (
              <label key={k} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "7px 0", borderBottom: "1px solid var(--line2)", cursor: "pointer" }}>
                <input type="checkbox" checked={p.boundaries[k]} style={{ marginTop: 3, width: 18, height: 18 }}
                  onChange={(e) => set({ boundaries: { ...p.boundaries, [k]: e.target.checked } })} />
                <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>{text}</span>
              </label>
            ))}
            <p style={{ ...sub, margin: "10px 0 0" }}>Keep authorship with me — always on. The engine never claims it created your song.</p>
          </div>

          <div style={card}>
            <h3 style={{ fontSize: 14.5, fontWeight: 900, margin: "0 0 8px" }}>Equipment & software</h3>
            <label htmlFor="song-equipment" style={label}>Equipment you have</label>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
              {["Akai MPK Mini", "Other MIDI keyboard", "Microphone", "Headphones", "Phone only"].map((eq) => {
                const on = p.equipment.includes(eq);
                return (
                  <button key={eq} aria-pressed={on}
                    onClick={() => set({ equipment: on ? p.equipment.filter((x) => x !== eq) : [...p.equipment, eq] })}
                    className={on ? "btn btn-gold btn-small" : "btn btn-ghost btn-small"}>{eq}</button>
                );
              })}
            </div>
            <label htmlFor="song-software" style={label}>Software path</label>
            <select id="song-software" value={p.software} onChange={(e) => set({ software: e.target.value as SongProjectV1["software"] })} style={input}>
              {(Object.keys(SOFTWARE_LABELS) as (keyof typeof SOFTWARE_LABELS)[]).map((s) => (
                <option key={s} value={s}>{SOFTWARE_LABELS[s]}</option>
              ))}
            </select>
            <label htmlFor="session-notes" style={{ ...label, marginTop: 12 }}>Session notes (optional)</label>
            <textarea id="session-notes" value={p.sessionNotes} onChange={(e) => set({ sessionNotes: e.target.value })} style={{ ...input, minHeight: 60, resize: "vertical" }} />
          </div>
        </>
      )}

      {/* ================= MELODY ================= */}
      {panel === "melody" && (
        <>
          <div style={{ ...card, marginBottom: 14 }}>
            <h2 style={{ fontSize: 16, fontWeight: 900, margin: "0 0 4px" }}>Capture the Melody</h2>
            <p style={{ ...sub, margin: "0 0 12px" }}>Record the melody before changing it. A melody in your head is one distraction away from gone.</p>
            <ol style={{ fontSize: 13.5, color: "var(--muted)", lineHeight: 1.7, margin: "0 0 12px", paddingLeft: 20 }}>
              <li>Open a voice recorder (your phone is perfect).</li>
              <li>Sing or hum the <b style={{ color: "var(--text)" }}>entire</b> idea.</li>
              <li>Keep going through unfinished sections instead of stopping.</li>
              <li>Humming, repeated words, silence, or spoken notes are all valid placeholders.</li>
              <li>Save the memo with a name you&apos;ll recognize.</li>
            </ol>
            <label htmlFor="melody-state" style={label}>Where the melody lives right now</label>
            <StateSelect id="melody-state" ariaLabel="Melody state" value={p.melodyState} onChange={(s) => set({ melodyState: s })} />
            <label htmlFor="memo-ref" style={{ ...label, marginTop: 12 }}>Voice memo filename or reference</label>
            <input id="memo-ref" value={p.voiceMemo.reference} placeholder='e.g., "new-life-born-again-full-idea.m4a"'
              onChange={(e) => set({ voiceMemo: { ...p.voiceMemo, reference: e.target.value } })} style={input} />
            <label htmlFor="memo-strongest" style={{ ...label, marginTop: 12 }}>Which parts feel strongest</label>
            <textarea id="memo-strongest" value={p.voiceMemo.strongestParts}
              onChange={(e) => set({ voiceMemo: { ...p.voiceMemo, strongestParts: e.target.value } })}
              style={{ ...input, minHeight: 56, resize: "vertical" }} />
            {p.voiceMemo.status === "captured" ? (
              <p style={{ fontSize: 13.5, fontWeight: 800, color: "var(--text)", margin: "12px 0 0" }}>
                ✓ Voice memo captured{p.voiceMemo.capturedAt ? ` · ${new Date(p.voiceMemo.capturedAt).toLocaleDateString()}` : ""} — the file lives on your device; you confirmed it exists.
              </p>
            ) : (
              <button className="btn btn-gold" style={{ marginTop: 12 }}
                onClick={() => set({
                  voiceMemo: { ...p.voiceMemo, status: "captured", capturedAt: new Date().toISOString() },
                  melodyState: p.melodyState === "in-head" || p.melodyState === "unknown" ? "in-voice-memo" : p.melodyState,
                })}>
                Mark the voice memo captured
              </button>
            )}
          </div>

          <div style={card}>
            <h3 style={{ fontSize: 14.5, fontWeight: 900, margin: "0 0 4px" }}>Hook candidates — your phrases</h3>
            <p style={{ ...sub, margin: "0 0 10px" }}>
              Lines from your own source that feel especially repeatable or central. They came from you —
              nothing here is generated. Confirm, reject, or decide later.
            </p>
            {p.hookCandidates.map((h) => (
              <div key={h.id} style={{ background: "var(--surface)", border: "1px solid var(--line2)", borderRadius: 12, padding: 12, marginBottom: 8 }}>
                <p style={{ fontSize: 14, fontWeight: 800, color: "var(--text)", margin: "0 0 6px" }}>&ldquo;{h.text}&rdquo;</p>
                <p style={{ fontSize: 11.5, color: "var(--muted)", margin: "0 0 8px" }}>From your source · {h.status}{h.melodicPeak ? " · melodic peak" : ""}{h.emotionalPeak ? " · emotional peak" : ""}</p>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {(["confirmed", "rejected", "decide-later"] as const).map((s) => (
                    <button key={s} onClick={() => onChange(updateHook(p, h.id, { status: s }))}
                      className={h.status === s ? "btn btn-gold btn-small" : "btn btn-ghost btn-small"}>
                      {s === "decide-later" ? "Decide later" : s === "confirmed" ? "Confirm" : "Reject"}
                    </button>
                  ))}
                  <button onClick={() => onChange(updateHook(p, h.id, { melodicPeak: !h.melodicPeak }))}
                    className={h.melodicPeak ? "btn btn-gold btn-small" : "btn btn-ghost btn-small"}>Melodic peak</button>
                  <button onClick={() => onChange(updateHook(p, h.id, { emotionalPeak: !h.emotionalPeak }))}
                    className={h.emotionalPeak ? "btn btn-gold btn-small" : "btn btn-ghost btn-small"}>Emotional peak</button>
                  <button onClick={() => onChange(removeHook(p, h.id))} className="btn btn-ghost btn-small">Remove</button>
                </div>
              </div>
            ))}
            <label htmlFor="hook-draft" style={label}>Add a hook from your words</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input id="hook-draft" value={hookDraft} onChange={(e) => setHookDraft(e.target.value)}
                placeholder='e.g., "I was saved! I was saved!"' style={input} />
              <button onClick={() => { if (hookDraft.trim()) { onChange(addHookCandidate(p, hookDraft)); setHookDraft(""); } }}
                className="btn btn-gold btn-small" style={{ flexShrink: 0 }}>Add</button>
            </div>
          </div>
        </>
      )}

      {/* ================= NOTES ================= */}
      {panel === "notes" && (
        <>
          <div style={{ ...card, marginBottom: 14 }}>
            <h2 style={{ fontSize: 16, fontWeight: 900, margin: "0 0 4px" }}>Find the Notes</h2>
            <p style={{ ...sub, margin: "0 0 12px" }}>
              You determine the notes in your app — the engine just keeps the record. No sheet music
              required, no theory vocabulary required. Unknown and partial are valid answers.
            </p>
            <label htmlFor="notes-app" style={label}>App you use to find notes</label>
            <input id="notes-app" value={p.notesWork.appUsed} placeholder="The music app on your phone, a piano app, MPC Beats itself…"
              onChange={(e) => set({ notesWork: { ...p.notesWork, appUsed: e.target.value } })} style={input} />

            <div style={{ marginTop: 14 }}>
              {p.notesWork.entries.map((n) => (
                <div key={n.id} style={{ background: "var(--surface)", border: "1px solid var(--line2)", borderRadius: 12, padding: 12, marginBottom: 8 }}>
                  <p style={{ fontSize: 13.5, fontWeight: 800, color: "var(--text)", margin: "0 0 2px" }}>{n.section || "Untitled section"}</p>
                  <p style={{ fontSize: 13.5, color: "var(--text)", margin: "0 0 2px", whiteSpace: "pre-wrap" }}>{n.notes}</p>
                  <p style={{ fontSize: 12, color: "var(--muted)", margin: 0 }}>{n.rhythm ? `Rhythm: ${n.rhythm} · ` : ""}Confidence: {n.confidence}</p>
                  <button onClick={() => set({ notesWork: { ...p.notesWork, entries: p.notesWork.entries.filter((x) => x.id !== n.id) } })}
                    className="btn btn-ghost btn-small" style={{ marginTop: 6 }}>Remove</button>
                </div>
              ))}
            </div>

            <label htmlFor="note-section" style={label}>Section these notes cover</label>
            <input id="note-section" value={noteSection} onChange={(e) => setNoteSection(e.target.value)}
              placeholder='e.g., "I was saved" hook' style={{ ...input, marginBottom: 8 }} />
            <label htmlFor="note-text" style={label}>The notes (names, MIDI numbers, or a rough sequence)</label>
            <textarea id="note-text" value={noteText} onChange={(e) => setNoteText(e.target.value)}
              placeholder="e.g., G G A G E … or 55 55 57 55 52 — however you hear it" style={{ ...input, minHeight: 56, resize: "vertical", marginBottom: 8 }} />
            <label htmlFor="note-rhythm" style={label}>Rhythm, if known (optional)</label>
            <input id="note-rhythm" value={noteRhythm} onChange={(e) => setNoteRhythm(e.target.value)} style={{ ...input, marginBottom: 8 }} />
            <label htmlFor="note-confidence" style={label}>Confidence</label>
            <select id="note-confidence" value={noteConfidence} onChange={(e) => setNoteConfidence(e.target.value as typeof noteConfidence)} style={{ ...input, marginBottom: 10 }}>
              <option value="guess">Rough guess</option>
              <option value="close">Close</option>
              <option value="confident">Confident</option>
            </select>
            <button className="btn btn-gold" disabled={!noteText.trim()} style={{ opacity: noteText.trim() ? 1 : 0.5 }}
              onClick={() => {
                if (!noteText.trim()) return;
                set({
                  notesWork: {
                    ...p.notesWork,
                    entries: [...p.notesWork.entries, {
                      id: songUid(), section: noteSection.trim(), notes: noteText.trim(),
                      rhythm: noteRhythm.trim(), confidence: noteConfidence, addedAt: new Date().toISOString(),
                    }],
                  },
                });
                setNoteSection(""); setNoteText(""); setNoteRhythm(""); setNoteConfidence("guess");
              }}>
              Save this note entry
            </button>
            <label style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 12, cursor: "pointer" }}>
              <input type="checkbox" checked={p.notesWork.transferredToDaw} style={{ width: 18, height: 18 }}
                onChange={(e) => set({ notesWork: { ...p.notesWork, transferredToDaw: e.target.checked } })} />
              <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>These notes have been transferred into my music software</span>
            </label>
            {guidance.theory && (
              <details style={{ marginTop: 12 }}>
                <summary style={{ fontSize: 13, fontWeight: 800, color: "var(--text)", cursor: "pointer" }}>Finding notes by ear (short help)</summary>
                <p style={{ ...sub, margin: "8px 0 0" }}>
                  Hum one syllable of your melody and hold it. Tap keys in your app until one matches — that&apos;s your note.
                  Write it down, move to the next syllable. Most melodies use only 5–8 different notes, and the same few keep
                  returning. Start with the phrase you hear most clearly; the rest gets easier after the first three notes.
                </p>
              </details>
            )}
          </div>

          <div style={card}>
            <h3 style={{ fontSize: 14.5, fontWeight: 900, margin: "0 0 8px" }}>Key · Tempo · Time signature</h3>
            <p style={{ ...sub, margin: "0 0 12px" }}>Nothing here gets invented for you. Unknown stays unknown until you discover it.</p>
            {([["key", "Key"], ["tempo", "Tempo"], ["timeSignature", "Time signature"]] as const).map(([k, name]) => (
              <div key={k} style={{ marginBottom: 12 }}>
                <label htmlFor={`fact-${k}`} style={label}>{name}</label>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <div style={{ flex: "1 1 180px" }}>
                    <StateSelect id={`fact-${k}`} ariaLabel={`${name} state`} value={p[k].state} onChange={(s) => set({ [k]: { ...p[k], state: s } } as Partial<SongProjectV1>)} />
                  </div>
                  <input aria-label={`${name} value`} value={p[k].value} placeholder="Value, once you know it"
                    onChange={(e) => set({ [k]: { ...p[k], value: e.target.value } } as Partial<SongProjectV1>)}
                    style={{ ...input, flex: "1 1 140px", width: "auto" }} />
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ================= RECORD ================= */}
      {panel === "record" && (
        <>
          <div style={{ ...card, marginBottom: 14 }}>
            <h2 style={{ fontSize: 16, fontWeight: 900, margin: "0 0 4px" }}>
              Record It — {SOFTWARE_LABELS[p.software]}
            </h2>
            <p style={{ ...sub, margin: "0 0 12px" }}>
              First proof: a simple keys sound, your melody, a scratch vocal, and a saved project.
              Drums are a later production choice, not a prerequisite.
            </p>
            {checklist.map((item, i) => (
              <label key={item.id} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "9px 0", borderBottom: "1px solid var(--line2)", cursor: "pointer" }}>
                <input type="checkbox" checked={!!p.softwareChecklist[item.id]} style={{ marginTop: 3, width: 18, height: 18 }}
                  onChange={(e) => set({ softwareChecklist: { ...p.softwareChecklist, [item.id]: e.target.checked } })} />
                <span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>{i + 1}. {item.label}</span>
                  {item.detail && <span style={{ display: "block", ...sub }}>{item.detail}</span>}
                </span>
              </label>
            ))}
            <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
              <label style={{ display: "flex", gap: 10, alignItems: "center", cursor: "pointer" }}>
                <input type="checkbox" checked={p.scratchVocal === "recorded"} style={{ width: 18, height: 18 }}
                  onChange={(e) => set({ scratchVocal: e.target.checked ? "recorded" : "none" })} />
                <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>A scratch or first vocal exists</span>
              </label>
              <label style={{ display: "flex", gap: 10, alignItems: "center", cursor: "pointer" }}>
                <input type="checkbox" checked={p.playsEndToEnd} style={{ width: 18, height: 18 }}
                  onChange={(e) => set({ playsEndToEnd: e.target.checked })} />
                <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>The song plays from beginning to end (placeholders allowed)</span>
              </label>
              <div>
                <label htmlFor="placeholders-note" style={label}>Where the placeholders are (required if any)</label>
                <input id="placeholders-note" value={p.placeholdersNote} placeholder='e.g., "bridge is hummed, second verse repeats verse one"'
                  onChange={(e) => set({ placeholdersNote: e.target.value })} style={input} />
              </div>
            </div>
          </div>

          {guidance.production && (
            <details style={{ ...card }}>
              <summary style={{ fontSize: 14, fontWeight: 800, color: "var(--text)", cursor: "pointer" }}>The production stages, in plain language</summary>
              {PRODUCTION_STAGES.map((s) => (
                <p key={s.name} style={{ fontSize: 13.5, margin: "10px 0 0", lineHeight: 1.5 }}>
                  <b style={{ color: "var(--text)" }}>{s.name}</b>
                  <span style={{ color: "var(--muted)" }}> — {s.plain}</span>
                </p>
              ))}
              <p style={{ ...sub, margin: "10px 0 0" }}>
                You&apos;re in Capture. Later passes can add chords, bass, a beat, pads, dynamics, and transitions — after the song exists.
              </p>
            </details>
          )}
        </>
      )}

      {/* ================= ARRANGE ================= */}
      {panel === "arrange" && (
        <>
          <div style={{ ...card, marginBottom: 14 }}>
            <h2 style={{ fontSize: 16, fontWeight: 900, margin: "0 0 4px" }}>Shape Without Taking Over</h2>
            <p style={{ ...sub, margin: "0 0 12px" }}>
              Organize your words into sections. Moving them never rewrites them, and your original source stays untouched.
              No structure is forced — verse-chorus is a choice, not a rule.
            </p>
            {p.sections.map((s, i) => (
              <div key={s.id} style={{ background: "var(--surface)", border: "1px solid var(--line2)", borderRadius: 12, padding: 12, marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
                  <p style={{ fontSize: 13.5, fontWeight: 900, color: "var(--gold)", margin: 0 }}>{i + 1}. {s.label}</p>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button aria-label={`Move ${s.label} up`} onClick={() => onChange(moveSection(p, s.id, -1))} className="btn btn-ghost btn-small">↑</button>
                    <button aria-label={`Move ${s.label} down`} onClick={() => onChange(moveSection(p, s.id, 1))} className="btn btn-ghost btn-small">↓</button>
                    <button onClick={() => onChange(duplicateSection(p, s.id))} className="btn btn-ghost btn-small">Repeat</button>
                    <button onClick={() => onChange(removeSection(p, s.id))} className="btn btn-ghost btn-small">Remove</button>
                  </div>
                </div>
                <textarea aria-label={`${s.label} content`} value={s.content}
                  onChange={(e) => onChange(updateSection(p, s.id, { content: e.target.value }))}
                  style={{ ...input, minHeight: 56, resize: "vertical", marginBottom: 6 }} />
                <input aria-label={`${s.label} energy`} value={s.energy} placeholder="Quiet, building, or full? Where should the beat enter?"
                  onChange={(e) => onChange(updateSection(p, s.id, { energy: e.target.value }))} style={input} />
              </div>
            ))}
            <label htmlFor="section-kind" style={label}>Add a section</label>
            <select id="section-kind" value={sectionKind} onChange={(e) => setSectionKind(e.target.value as SectionKind)} style={{ ...input, marginBottom: 8 }}>
              {(Object.keys(SECTION_KIND_LABELS) as SectionKind[]).map((k) => (
                <option key={k} value={k}>{SECTION_KIND_LABELS[k]}</option>
              ))}
            </select>
            <textarea aria-label="Section content" value={sectionContent} onChange={(e) => setSectionContent(e.target.value)}
              placeholder="Paste or type the words for this section — copied from your working copy, never moved out of the source."
              style={{ ...input, minHeight: 56, resize: "vertical", marginBottom: 8 }} />
            <button className="btn btn-gold btn-small"
              onClick={() => { onChange(addSection(p, sectionKind, sectionContent)); setSectionContent(""); }}>
              Add section
            </button>
          </div>

          {guidance.arrangement && (
            <details style={card}>
              <summary style={{ fontSize: 14, fontWeight: 800, color: "var(--text)", cursor: "pointer" }}>Concrete production questions (no criticism, just decisions)</summary>
              <ul style={{ fontSize: 13.5, color: "var(--muted)", lineHeight: 1.7, margin: "8px 0 0", paddingLeft: 18 }}>
                <li>Where does the song open up?</li>
                <li>Which section holds the emotional peak?</li>
                <li>Which line should return?</li>
                <li>Should the instruments stop before this line?</li>
                <li>Should this section be quiet, building, or full?</li>
                <li>Where should the beat enter?</li>
                <li>Does this section need space?</li>
                <li>Should this melody repeat exactly or change?</li>
                <li>What should the listener feel here?</li>
              </ul>
            </details>
          )}
        </>
      )}

      {/* ================= FINISH / VERSION ONE ================= */}
      {panel === "finish" && (
        <>
          <div style={{ ...card, marginBottom: 14 }}>
            <h2 style={{ fontSize: 16, fontWeight: 900, margin: "0 0 4px" }}>Proof</h2>
            <p style={{ ...sub, margin: "0 0 12px" }}>
              The engine can&apos;t open files on your device, so it never pretends to. Proof here is your
              confirmation plus the reference — honest, and enough.
            </p>
            {p.proofs.map((x) => (
              <div key={x.id} style={{ display: "flex", justifyContent: "space-between", gap: 8, padding: "8px 0", borderBottom: "1px solid var(--line2)", flexWrap: "wrap" }}>
                <span style={{ fontSize: 13.5, color: "var(--text)", minWidth: 0 }}>
                  <b>{PROOF_TYPE_LABELS[x.type]}</b> · {x.reference}
                  {x.note ? <span style={{ color: "var(--muted)" }}> — {x.note}</span> : null}
                  <span style={{ display: "block", fontSize: 11.5, color: "var(--muted)" }}>Creator-confirmed · {new Date(x.addedAt).toLocaleDateString()}</span>
                </span>
                <button onClick={() => onChange(removeProof(p, x.id))} className="btn btn-ghost btn-small" style={{ flexShrink: 0 }}>Remove</button>
              </div>
            ))}
            <label htmlFor="proof-type" style={{ ...label, marginTop: 12 }}>Add proof</label>
            <select id="proof-type" value={proofType} onChange={(e) => setProofType(e.target.value as ProofType)} style={{ ...input, marginBottom: 8 }}>
              {(Object.keys(PROOF_TYPE_LABELS) as ProofType[]).map((t) => (
                <option key={t} value={t}>{PROOF_TYPE_LABELS[t]}</option>
              ))}
            </select>
            <input aria-label="Proof reference" value={proofRef} onChange={(e) => setProofRef(e.target.value)}
              placeholder="Filename, project name, or path" style={{ ...input, marginBottom: 8 }} />
            <input aria-label="Proof note" value={proofNote} onChange={(e) => setProofNote(e.target.value)}
              placeholder="Note (optional)" style={{ ...input, marginBottom: 10 }} />
            <button className="btn btn-gold btn-small" disabled={!proofRef.trim()} style={{ opacity: proofRef.trim() ? 1 : 0.5 }}
              onClick={() => { onChange(addProof(p, proofType, proofRef, proofNote)); setProofRef(""); setProofNote(""); }}>
              Add proof (I confirm this exists)
            </button>
          </div>

          <div style={card}>
            <h2 style={{ fontSize: 16, fontWeight: 900, margin: "0 0 4px" }}>Version One</h2>
            <p style={{ ...sub, margin: "0 0 12px" }}>
              Version One is a real, playable rough version — not a professional mix or master. It exists
              when the evidence exists AND you decide to call it. A lyric sheet or a plan never completes a song.
            </p>
            {p.versionOne ? (
              <>
                <p style={{ fontSize: 14.5, fontWeight: 900, color: "var(--gold)", margin: "0 0 6px" }}>
                  ✓ Version One — declared by you on {new Date(p.versionOne.declaredAt).toLocaleDateString()}
                </p>
                <p style={{ fontSize: 13.5, color: "var(--text)", margin: "0 0 4px" }}><b>What worked:</b> {p.versionOne.whatWorked}</p>
                <p style={{ fontSize: 13.5, color: "var(--text)", margin: 0 }}><b>Next improvement:</b> {p.versionOne.nextImprovement}</p>
                <p style={{ ...sub, margin: "10px 0 0" }}>Ready for another pass whenever you are — better takes, more instruments, a real mix.</p>
              </>
            ) : (
              <>
                {!v1check.ok && (
                  <div style={{ background: "var(--surface)", border: "1px solid var(--line2)", borderRadius: 12, padding: 12, marginBottom: 12 }}>
                    <p style={{ fontSize: 13, fontWeight: 800, color: "var(--text)", margin: "0 0 6px" }}>Still needed before Version One:</p>
                    <ul style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6, margin: 0, paddingLeft: 18 }}>
                      {v1check.missing.map((m) => <li key={m}>{m}</li>)}
                    </ul>
                  </div>
                )}
                {projectProof && audioProof && !v1check.ok && (
                  <p style={{ ...sub, margin: "0 0 12px" }}>Proof is in — finish the remaining items above.</p>
                )}
                <label htmlFor="v1-worked" style={label}>What worked</label>
                <input id="v1-worked" value={whatWorked} onChange={(e) => setWhatWorked(e.target.value)} style={{ ...input, marginBottom: 8 }} />
                <label htmlFor="v1-next" style={label}>The next improvement</label>
                <input id="v1-next" value={nextImprovement} onChange={(e) => setNextImprovement(e.target.value)} style={{ ...input, marginBottom: 10 }} />
                <button className="btn btn-gold" style={{ width: "100%", opacity: v1check.ok && whatWorked.trim() && nextImprovement.trim() ? 1 : 0.5 }}
                  disabled={!v1check.ok || !whatWorked.trim() || !nextImprovement.trim()}
                  onClick={() => onChange(declareVersionOne(p, whatWorked, nextImprovement))}>
                  This is Version One — my call
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
