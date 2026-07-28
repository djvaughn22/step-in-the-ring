"use client";

/**
 * Story Partner — studio.
 *
 * A private working story room: capture memories in any order, open one focus
 * at a time (character / relationship / storyline / scene / chapter), and turn
 * source material into scenes, chapters, and a novel. The author owns every
 * decision; pasted-back AI output is never canon until classified.
 *
 * Storage honesty: local-first in this browser. See PRIVACY_EXPLANATION.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import {
  addChapter, addCharacter, addDraft, addMemory, addNote, addRelationship,
  addScene, addStoryline, amendMemory, applyPasteBack, briefingPack,
  CHAPTER_STATUSES, countRecords, createProject, currentDraft, exportPayload,
  exportReminder, FOCUS_KIND_LABELS, gatherFocus, labelFor, markExported,
  moveChapter, moveSceneInChapter, NOTE_KINDS, parseImport, placeSceneInChapter,
  PASTE_CLASSIFICATIONS, PRIVACY_EXPLANATION, promoteNote,
  removeSceneFromChapter, setNoteStatus, deleteNote, toggleMemoryLink,
  updateChapter, updateCharacter, updateRelationship, updateScene,
  updateStoryline,
  type FocusKind, type LinkRef, type NoteKind, type PasteClassification,
  type StoryProjectV1,
} from "./story.engine";
import { loadActiveProject, saveActiveProject } from "./story.store";

type View = { name: "home" } | { name: "room"; ref: LinkRef } | { name: "novel" };

const ROOM_NOTE_SECTIONS: { kind: NoteKind; title: string }[] = [
  { kind: "fact", title: "Established story facts" },
  { kind: "decision", title: "Fictionalization decisions" },
  { kind: "question", title: "Open questions" },
  { kind: "contradiction", title: "Contradictions" },
  { kind: "possibility", title: "Fictional possibilities" },
  { kind: "scene-idea", title: "Scene ideas" },
  { kind: "working", title: "Working notes" },
];

export default function StoryStudio({
  onBack,
  card,
}: {
  onBack: () => void;
  card: React.CSSProperties;
}) {
  const [ready, setReady] = useState(false);
  const [project, setProject] = useState<StoryProjectV1 | null>(null);
  const [view, setView] = useState<View>({ name: "home" });
  const [flash, setFlash] = useState("");

  // transient inputs
  const [newTitle, setNewTitle] = useState("");
  const [newPremise, setNewPremise] = useState("");
  const [capture, setCapture] = useState("");
  const [captureEra, setCaptureEra] = useState("");
  const [captureLinks, setCaptureLinks] = useState<LinkRef[]>([]);
  const [adding, setAdding] = useState<FocusKind | "">("");
  const [addName, setAddName] = useState("");
  const [noteKind, setNoteKind] = useState<NoteKind>("question");
  const [noteText, setNoteText] = useState("");
  const [task, setTask] = useState("");
  const [paste, setPaste] = useState("");
  const [pasteClass, setPasteClass] = useState<PasteClassification>("working");
  const [pasteSceneId, setPasteSceneId] = useState("");
  const [pasteSceneTitle, setPasteSceneTitle] = useState("");
  const [revision, setRevision] = useState("");
  const [revisionNote, setRevisionNote] = useState("");
  const [openMemoryId, setOpenMemoryId] = useState("");
  const [pendingImport, setPendingImport] = useState<StoryProjectV1 | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setProject(loadActiveProject());
    setReady(true);
  }, []);

  const say = (m: string) => { setFlash(m); setTimeout(() => setFlash(""), 3000); };

  const persist = (next: StoryProjectV1, message?: string) => {
    setProject(next);
    if (!saveActiveProject(next)) {
      say("Saving to this browser failed — export a backup now.");
      return;
    }
    if (message) say(message);
  };

  const reminder = useMemo(() => (project ? exportReminder(project) : null), [project]);

  // ---- styles (match Engine Room conventions) ----
  const input = {
    width: "100%", boxSizing: "border-box" as const, background: "var(--surface)",
    color: "inherit", border: "1px solid var(--line)", borderRadius: 10,
    padding: "10px 12px", fontSize: 15, fontFamily: "inherit",
  };
  const label = { display: "block", fontSize: 13, fontWeight: 800, marginBottom: 4 } as const;
  const help = { fontSize: 12.5, color: "var(--muted)", margin: "0 0 6px", lineHeight: 1.5 } as const;
  const kicker = { fontSize: 12, fontWeight: 900, color: "var(--gold)", textTransform: "uppercase" as const, letterSpacing: "0.08em", margin: "0 0 6px" };
  const verbatim = {
    whiteSpace: "pre-wrap" as const, fontSize: 14, lineHeight: 1.6, margin: 0,
    background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 10, padding: "10px 12px",
  };
  const btn = {
    background: "var(--gold)", color: "#111", border: "none", borderRadius: 10,
    padding: "9px 14px", fontSize: 14, fontWeight: 800, cursor: "pointer",
  } as const;
  const btnQuiet = {
    ...btn, background: "var(--surface)", color: "inherit", border: "1px solid var(--line)", fontWeight: 700,
  } as const;
  const chip = (active: boolean) => ({
    background: active ? "var(--gold)" : "var(--surface)",
    color: active ? "#111" : "inherit",
    border: "1px solid var(--line)", borderRadius: 999, padding: "5px 11px",
    fontSize: 12.5, fontWeight: 700, cursor: "pointer",
  });
  const sectionTitle = { fontSize: 14.5, fontWeight: 900, margin: "0 0 8px" } as const;

  if (!ready) return <div style={{ height: 200 }} />;

  // ================= helpers =================

  const focusGroups: { kind: FocusKind; title: string; items: { id: string; name: string }[] }[] = project
    ? [
        { kind: "character", title: "Characters", items: project.characters.map((c) => ({ id: c.id, name: c.name })) },
        { kind: "relationship", title: "Relationships", items: project.relationships.map((r) => ({ id: r.id, name: r.title })) },
        { kind: "storyline", title: "Storylines", items: project.storylines.map((s) => ({ id: s.id, name: s.name })) },
        { kind: "scene", title: "Scenes", items: project.scenes.map((s) => ({ id: s.id, name: s.title })) },
        { kind: "chapter", title: "Chapters", items: project.chapters.map((c) => ({ id: c.id, name: c.workingTitle })) },
      ]
    : [];

  const addFocusRecord = (kind: FocusKind, name: string) => {
    if (!project || !name.trim()) return;
    const made =
      kind === "character" ? addCharacter(project, name)
      : kind === "relationship" ? addRelationship(project, name)
      : kind === "storyline" ? addStoryline(project, name)
      : kind === "scene" ? addScene(project, name, view.name === "room" ? [view.ref] : [])
      : addChapter(project, name);
    if (!made.record) return;
    persist(made.project, `${FOCUS_KIND_LABELS[kind]} added`);
    setAdding("");
    setAddName("");
    setView({ name: "room", ref: { kind, id: (made.record as { id: string }).id } });
  };

  const saveCapture = (autoLink?: LinkRef) => {
    if (!project) return;
    const links = autoLink ? [...captureLinks, autoLink] : captureLinks;
    const made = addMemory(project, capture, { era: captureEra, links });
    if (!made.memory) { say("Write the memory first."); return; }
    persist(made.project, "Memory saved — original text is preserved permanently.");
    setCapture(""); setCaptureEra(""); setCaptureLinks([]);
  };

  const doExport = () => {
    if (!project) return;
    const stamped = markExported(project);
    const payload = exportPayload(stamped);
    const blob = new Blob([payload], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${stamped.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "story-partner"}-${stamped.lastExportAt.slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    persist(stamped, "Export downloaded. Keep it somewhere safe.");
  };

  const onImportFile = async (file: File) => {
    const raw = await file.text();
    const result = parseImport(raw);
    if (!result.ok) { say(result.error); return; }
    if (!project || countRecords(project) === 0) {
      persist(result.project, "Project imported.");
      setView({ name: "home" });
      return;
    }
    setPendingImport(result.project); // confirmation step — never silently replace
  };

  const linkChips = (current: LinkRef[], onToggle: (ref: LinkRef) => void) => (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {focusGroups.flatMap((g) =>
        g.items.map((item) => {
          const ref: LinkRef = { kind: g.kind, id: item.id };
          const active = current.some((x) => x.kind === ref.kind && x.id === ref.id);
          return (
            <button key={`${g.kind}-${item.id}`} type="button" style={chip(active)} onClick={() => onToggle(ref)}>
              {FOCUS_KIND_LABELS[g.kind]}: {item.name}
            </button>
          );
        }),
      )}
    </div>
  );

  const memoryCard = (memoryId: string) => {
    if (!project) return null;
    const m = project.memories.find((x) => x.id === memoryId);
    if (!m) return null;
    const open = openMemoryId === m.id;
    return (
      <div key={m.id} style={{ border: "1px solid var(--line)", borderRadius: 12, padding: 12, marginBottom: 10 }}>
        <p style={{ ...kicker, margin: "0 0 4px" }}>Original memory — never edited</p>
        <pre style={verbatim}>{m.original}</pre>
        <p style={{ fontSize: 12, color: "var(--muted)", margin: "6px 0 0" }}>
          Captured {m.capturedAt.slice(0, 10)}{m.era ? ` · era: ${m.era}` : ""}
        </p>
        <button type="button" style={{ ...btnQuiet, marginTop: 8, padding: "6px 10px", fontSize: 12.5 }} onClick={() => setOpenMemoryId(open ? "" : m.id)}>
          {open ? "Close" : "Working notes & links"}
        </button>
        {open && (
          <div style={{ marginTop: 10 }}>
            <span style={label}>Working notes — interpretation, kept separate from the original</span>
            <textarea
              value={m.workingNotes}
              onChange={(e) => persist(amendMemory(project, m.id, { workingNotes: e.target.value }))}
              placeholder="Cleanups, context, what this might become…"
              style={{ ...input, minHeight: 60, resize: "vertical" }}
            />
            <div style={{ marginTop: 8 }}>
              <span style={label}>Attached to</span>
              {linkChips(m.links, (ref) => persist(toggleMemoryLink(project, m.id, ref)))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // ================= no project yet =================

  if (!project) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button type="button" onClick={onBack} style={btnQuiet}>← Engine Room</button>
        </div>
        <div style={card}>
          <p style={kicker}>Story Partner</p>
          <h2 style={{ fontSize: 19, fontWeight: 900, margin: "0 0 6px" }}>Start your novel</h2>
          <p style={help}>
            A private working room: capture memories in any order, then turn them into characters,
            relationships, storylines, scenes, and chapters — one focus at a time. You are the author.
          </p>
          <span style={label}>Working title</span>
          <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="A working title is fine" style={input} />
          <div style={{ marginTop: 10 }}>
            <span style={label}>Premise (optional)</span>
            <textarea value={newPremise} onChange={(e) => setNewPremise(e.target.value)} placeholder="One or two sentences on what this novel might be." style={{ ...input, minHeight: 60, resize: "vertical" }} />
          </div>
          <button
            type="button" style={{ ...btn, marginTop: 12 }}
            onClick={() => {
              if (!newTitle.trim()) { say("Give it a working title."); return; }
              persist(createProject(newTitle, newPremise), "Project created.");
            }}
          >
            Create project
          </button>
          <p role="status" aria-live="polite" style={{ color: "var(--gold)", fontWeight: 800, minHeight: 20, margin: "10px 0 0" }}>{flash}</p>
        </div>
        <div style={card}>
          <p style={sectionTitle}>Where your words live</p>
          <p style={help}>{PRIVACY_EXPLANATION}</p>
          <button type="button" style={btnQuiet} onClick={() => fileRef.current?.click()}>Import a Story Partner export</button>
          <input ref={fileRef} type="file" accept=".json,application/json" style={{ display: "none" }}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) onImportFile(f); e.target.value = ""; }} />
        </div>
      </div>
    );
  }

  // ================= shared header =================

  const header = (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
        <button type="button" onClick={view.name === "home" ? onBack : () => setView({ name: "home" })} style={btnQuiet}>
          {view.name === "home" ? "← Engine Room" : "← Workspace"}
        </button>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <button type="button" style={view.name === "novel" ? btn : btnQuiet} onClick={() => setView({ name: "novel" })}>The Novel</button>
          <button type="button" style={btnQuiet} onClick={doExport}>Export backup</button>
        </div>
      </div>
      <p role="status" aria-live="polite" style={{ color: "var(--gold)", fontWeight: 800, minHeight: 20, margin: "0 0 6px" }}>{flash}</p>
      {reminder && (
        <div style={{ ...card, borderLeft: "4px solid var(--gold)", padding: 12, marginBottom: 10 }}>
          <p style={{ fontSize: 13, margin: 0, lineHeight: 1.5 }}>⚠️ {reminder}</p>
        </div>
      )}
      {pendingImport && (
        <div style={{ ...card, borderLeft: "4px solid var(--gold)", marginBottom: 10 }}>
          <p style={sectionTitle}>Replace the current project?</p>
          <p style={help}>
            Importing “{pendingImport.title}” ({countRecords(pendingImport)} records) will REPLACE
            “{project.title}” ({countRecords(project)} records) in this browser. This cannot be undone
            unless you have an export of the current project.
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button type="button" style={btn} onClick={() => { persist(pendingImport, "Project imported."); setPendingImport(null); setView({ name: "home" }); }}>
              Replace it
            </button>
            <button type="button" style={btnQuiet} onClick={() => setPendingImport(null)}>Keep current project</button>
          </div>
        </div>
      )}
    </div>
  );

  const quickCapture = (autoLink?: LinkRef) => (
    <div style={card}>
      <p style={kicker}>Quick memory capture</p>
      <textarea
        value={capture} onChange={(e) => setCapture(e.target.value)}
        placeholder="Spit it out exactly how it comes — any order, any era. The original is preserved forever."
        style={{ ...input, minHeight: 84, resize: "vertical" }}
      />
      <div style={{ marginTop: 8 }}>
        <input value={captureEra} onChange={(e) => setCaptureEra(e.target.value)} placeholder="Rough era (optional) — e.g. childhood, New Zealand" style={input} />
      </div>
      {focusGroups.some((g) => g.items.length > 0) && (
        <div style={{ marginTop: 8 }}>
          <span style={label}>Attach now (optional — zero, one, or many)</span>
          {linkChips(captureLinks, (ref) =>
            setCaptureLinks((cur) => (cur.some((x) => x.kind === ref.kind && x.id === ref.id) ? cur.filter((x) => !(x.kind === ref.kind && x.id === ref.id)) : [...cur, ref])),
          )}
        </div>
      )}
      {autoLink && <p style={{ ...help, margin: "8px 0 0" }}>Will also attach to {FOCUS_KIND_LABELS[autoLink.kind].toLowerCase()} “{labelFor(project, autoLink)}”.</p>}
      <button type="button" style={{ ...btn, marginTop: 10 }} onClick={() => saveCapture(autoLink)}>Save memory</button>
    </div>
  );

  // ================= home =================

  if (view.name === "home") {
    const unattached = project.memories.filter((m) => m.links.length === 0);
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {header}
        <div style={card}>
          <p style={kicker}>Story Partner</p>
          <h2 style={{ fontSize: 19, fontWeight: 900, margin: 0 }}>{project.title}</h2>
          {project.premise && <p style={{ ...help, margin: "4px 0 0" }}>{project.premise}</p>}
          <p style={{ fontSize: 12.5, color: "var(--muted)", margin: "6px 0 0" }}>
            {project.memories.length} memories · {project.scenes.length} scenes · {project.chapters.length} chapters ·
            last export: {project.lastExportAt ? project.lastExportAt.slice(0, 10) : "never"}
          </p>
        </div>

        {quickCapture()}

        <div style={card}>
          <p style={sectionTitle}>Pick a focus — one room at a time</p>
          <p style={help}>Open a character, relationship, storyline, scene, or chapter and develop it with everything attached to it.</p>
          {focusGroups.map((g) => (
            <div key={g.kind} style={{ marginBottom: 12 }}>
              <span style={label}>{g.title}</span>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {g.items.map((item) => (
                  <button key={item.id} type="button" style={chip(false)} onClick={() => setView({ name: "room", ref: { kind: g.kind, id: item.id } })}>
                    {item.name}
                  </button>
                ))}
                {adding === g.kind ? (
                  <span style={{ display: "flex", gap: 6 }}>
                    <input autoFocus value={addName} onChange={(e) => setAddName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") addFocusRecord(g.kind, addName); }}
                      placeholder={`New ${FOCUS_KIND_LABELS[g.kind].toLowerCase()} name`} style={{ ...input, width: 200, padding: "5px 10px", fontSize: 13 }} />
                    <button type="button" style={{ ...btn, padding: "5px 10px", fontSize: 12.5 }} onClick={() => addFocusRecord(g.kind, addName)}>Add</button>
                  </span>
                ) : (
                  <button type="button" style={{ ...chip(false), borderStyle: "dashed" }} onClick={() => { setAdding(g.kind); setAddName(""); }}>+ add</button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div style={card}>
          <p style={sectionTitle}>All memories ({project.memories.length})</p>
          {unattached.length > 0 && <p style={help}>{unattached.length} not yet attached to anything — that&apos;s fine; attach them when a room needs them.</p>}
          {project.memories.length === 0 && <p style={help}>Nothing captured yet.</p>}
          {project.memories.map((m) => memoryCard(m.id))}
        </div>

        <div style={card}>
          <p style={sectionTitle}>Backup & where your words live</p>
          <p style={help}>{PRIVACY_EXPLANATION}</p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button type="button" style={btn} onClick={doExport}>Export backup (.json)</button>
            <button type="button" style={btnQuiet} onClick={() => fileRef.current?.click()}>Import</button>
          </div>
          <input ref={fileRef} type="file" accept=".json,application/json" style={{ display: "none" }}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) onImportFile(f); e.target.value = ""; }} />
        </div>
      </div>
    );
  }

  // ================= the novel =================

  if (view.name === "novel") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {header}
        <div style={card}>
          <p style={kicker}>The Novel</p>
          <h2 style={{ fontSize: 19, fontWeight: 900, margin: "0 0 6px" }}>{project.title}</h2>
          <p style={help}>Chapters in reading order. Reordering moves references only — scenes and their drafts are never duplicated or lost.</p>
          <div style={{ display: "flex", gap: 6 }}>
            {adding === "chapter" ? (
              <>
                <input autoFocus value={addName} onChange={(e) => setAddName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") addFocusRecord("chapter", addName); }}
                  placeholder="Working title" style={{ ...input, maxWidth: 260 }} />
                <button type="button" style={btn} onClick={() => addFocusRecord("chapter", addName)}>Add</button>
              </>
            ) : (
              <button type="button" style={btn} onClick={() => { setAdding("chapter"); setAddName(""); }}>+ New chapter</button>
            )}
          </div>
        </div>
        {project.chapters.map((ch, i) => {
          const issues = project.notes.filter(
            (n) => n.status === "open" && (n.kind === "question" || n.kind === "contradiction") &&
              n.attachedTo.some((r) => r.kind === "chapter" && r.id === ch.id),
          );
          return (
            <div key={ch.id} style={card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <p style={{ ...kicker, margin: 0 }}>Chapter {i + 1}</p>
                <span style={{ display: "flex", gap: 6 }}>
                  <button type="button" style={btnQuiet} disabled={i === 0} onClick={() => persist(moveChapter(project, ch.id, -1))}>↑</button>
                  <button type="button" style={btnQuiet} disabled={i === project.chapters.length - 1} onClick={() => persist(moveChapter(project, ch.id, 1))}>↓</button>
                  <button type="button" style={btnQuiet} onClick={() => setView({ name: "room", ref: { kind: "chapter", id: ch.id } })}>Open room</button>
                </span>
              </div>
              <input value={ch.workingTitle} onChange={(e) => persist(updateChapter(project, ch.id, { workingTitle: e.target.value }))} style={{ ...input, marginTop: 8, fontWeight: 800 }} />
              <textarea value={ch.purpose} onChange={(e) => persist(updateChapter(project, ch.id, { purpose: e.target.value }))}
                placeholder="What this chapter is for in the novel." style={{ ...input, minHeight: 48, resize: "vertical", marginTop: 8 }} />
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 8 }}>
                <div>
                  <span style={label}>Viewpoint</span>
                  <select value={ch.viewpointCharacterId} onChange={(e) => persist(updateChapter(project, ch.id, { viewpointCharacterId: e.target.value }))} style={{ ...input, width: "auto" }}>
                    <option value="">Undecided</option>
                    {project.characters.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <span style={label}>Status</span>
                  <select value={ch.status} onChange={(e) => persist(updateChapter(project, ch.id, { status: e.target.value as typeof ch.status }))} style={{ ...input, width: "auto" }}>
                    {CHAPTER_STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </select>
                </div>
              </div>
              {project.storylines.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  <span style={label}>Storylines</span>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {project.storylines.map((s) => {
                      const on = ch.storylineIds.includes(s.id);
                      return (
                        <button key={s.id} type="button" style={chip(on)}
                          onClick={() => persist(updateChapter(project, ch.id, { storylineIds: on ? ch.storylineIds.filter((x) => x !== s.id) : [...ch.storylineIds, s.id] }))}>
                          {s.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              <div style={{ marginTop: 8 }}>
                <span style={label}>Scenes, in order</span>
                {ch.sceneIds.length === 0 && <p style={help}>No scenes placed yet.</p>}
                {ch.sceneIds.map((sid, j) => {
                  const scene = project.scenes.find((s) => s.id === sid);
                  if (!scene) return null;
                  return (
                    <div key={sid} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, padding: "7px 0", borderBottom: "1px solid var(--line)" }}>
                      <button type="button" style={{ ...btnQuiet, border: "none", padding: 0, textAlign: "left" }} onClick={() => setView({ name: "room", ref: { kind: "scene", id: sid } })}>
                        {j + 1}. {scene.title} <span style={{ color: "var(--muted)", fontWeight: 400 }}>({scene.drafts.length} draft{scene.drafts.length === 1 ? "" : "s"})</span>
                      </button>
                      <span style={{ display: "flex", gap: 4 }}>
                        <button type="button" style={{ ...btnQuiet, padding: "3px 8px" }} disabled={j === 0} onClick={() => persist(moveSceneInChapter(project, ch.id, sid, -1))}>↑</button>
                        <button type="button" style={{ ...btnQuiet, padding: "3px 8px" }} disabled={j === ch.sceneIds.length - 1} onClick={() => persist(moveSceneInChapter(project, ch.id, sid, 1))}>↓</button>
                        <button type="button" style={{ ...btnQuiet, padding: "3px 8px" }} onClick={() => persist(removeSceneFromChapter(project, ch.id, sid), "Removed from chapter — the scene and its drafts still exist.")}>✕</button>
                      </span>
                    </div>
                  );
                })}
                {project.scenes.some((s) => !ch.sceneIds.includes(s.id)) && (
                  <select value="" style={{ ...input, width: "auto", marginTop: 8 }}
                    onChange={(e) => { if (e.target.value) persist(placeSceneInChapter(project, ch.id, e.target.value), "Scene placed."); }}>
                    <option value="">+ Place an existing scene…</option>
                    {project.scenes.filter((s) => !ch.sceneIds.includes(s.id)).map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
                  </select>
                )}
              </div>
              {issues.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  <span style={label}>Open issues</span>
                  {issues.map((n) => <p key={n.id} style={{ ...help, margin: "0 0 3px" }}>• {n.text}</p>)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // ================= the room =================

  const ref = view.ref;
  const focus = gatherFocus(project, ref);
  const scene = ref.kind === "scene" ? project.scenes.find((s) => s.id === ref.id) : null;
  const relationship = ref.kind === "relationship" ? project.relationships.find((r) => r.id === ref.id) : null;
  const character = ref.kind === "character" ? project.characters.find((c) => c.id === ref.id) : null;
  const storyline = ref.kind === "storyline" ? project.storylines.find((s) => s.id === ref.id) : null;
  const unlinkedMemories = project.memories.filter((m) => !m.links.some((x) => x.kind === ref.kind && x.id === ref.id));
  const pasteNeedsScene = PASTE_CLASSIFICATIONS.find((c) => c.id === pasteClass)?.needsScene ?? false;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {header}

      <div style={card}>
        <p style={kicker}>{FOCUS_KIND_LABELS[ref.kind]} room</p>
        <h2 style={{ fontSize: 19, fontWeight: 900, margin: "0 0 8px" }}>{focus.label}</h2>

        {character && (
          <>
            <span style={label}>Description (in the novel)</span>
            <textarea value={character.description} onChange={(e) => persist(updateCharacter(project, ref.id, { description: e.target.value }))}
              placeholder="Who this character is in the fiction." style={{ ...input, minHeight: 52, resize: "vertical", marginBottom: 8 }} />
            <span style={label}>Real basis (private notes)</span>
            <textarea value={character.realBasis} onChange={(e) => persist(updateCharacter(project, ref.id, { realBasis: e.target.value }))}
              placeholder="Who or what this draws from in real life. Stays in this browser." style={{ ...input, minHeight: 52, resize: "vertical" }} />
          </>
        )}
        {relationship && (
          <>
            <span style={label}>Description</span>
            <textarea value={relationship.description} onChange={(e) => persist(updateRelationship(project, ref.id, { description: e.target.value }))}
              placeholder="What this relationship is — and what it costs." style={{ ...input, minHeight: 52, resize: "vertical", marginBottom: 8 }} />
            <span style={label}>Participants</span>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {project.characters.map((c) => {
                const on = relationship.participantIds.includes(c.id);
                return (
                  <button key={c.id} type="button" style={chip(on)}
                    onClick={() => persist(updateRelationship(project, ref.id, { participantIds: on ? relationship.participantIds.filter((x) => x !== c.id) : [...relationship.participantIds, c.id] }))}>
                    {c.name}
                  </button>
                );
              })}
              {project.characters.length === 0 && <p style={help}>Add characters first, then mark who&apos;s in this relationship.</p>}
            </div>
          </>
        )}
        {storyline && (
          <>
            <span style={label}>Summary</span>
            <textarea value={storyline.summary} onChange={(e) => persist(updateStoryline(project, ref.id, { summary: e.target.value }))}
              placeholder="Where this storyline starts, turns, and lands." style={{ ...input, minHeight: 52, resize: "vertical" }} />
          </>
        )}
        {scene && (
          <>
            <span style={label}>Purpose</span>
            <textarea value={scene.purpose} onChange={(e) => persist(updateScene(project, ref.id, { purpose: e.target.value }))}
              placeholder="What this scene must do for the story." style={{ ...input, minHeight: 48, resize: "vertical", marginBottom: 8 }} />
            <span style={label}>Belongs to</span>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
              {project.chapters.map((c) => {
                const on = c.sceneIds.includes(scene.id);
                return (
                  <button key={c.id} type="button" style={chip(on)}
                    onClick={() => persist(on ? removeSceneFromChapter(project, c.id, scene.id) : placeSceneInChapter(project, c.id, scene.id))}>
                    {c.workingTitle}
                  </button>
                );
              })}
              {project.chapters.length === 0 && <p style={{ ...help, margin: 0 }}>No chapters yet — create them in The Novel.</p>}
            </div>
          </>
        )}
      </div>

      {/* Scene drafts — append-only history */}
      {scene && (
        <div style={card}>
          <p style={sectionTitle}>Drafts ({scene.drafts.length}) — every revision is kept</p>
          {scene.drafts.length === 0 && <p style={help}>No draft yet. Write the first one below — rough is right.</p>}
          {scene.drafts.map((d, i) => {
            const isCurrent = i === scene.drafts.length - 1;
            return (
              <details key={d.id} open={isCurrent} style={{ marginBottom: 10 }}>
                <summary style={{ fontSize: 13, fontWeight: 800, cursor: "pointer" }}>
                  Revision {i + 1}{isCurrent ? " (current)" : ""} · {d.savedAt.slice(0, 10)}{d.note ? ` · ${d.note}` : ""}
                </summary>
                <pre style={{ ...verbatim, marginTop: 6 }}>{d.text}</pre>
              </details>
            );
          })}
          <span style={label}>{scene.drafts.length ? "New revision" : "First draft"}</span>
          <textarea value={revision} onChange={(e) => setRevision(e.target.value)} placeholder="The scene, as it stands right now." style={{ ...input, minHeight: 120, resize: "vertical" }} />
          <input value={revisionNote} onChange={(e) => setRevisionNote(e.target.value)} placeholder="What changed (optional)" style={{ ...input, marginTop: 6 }} />
          <button type="button" style={{ ...btn, marginTop: 8 }}
            onClick={() => {
              if (!revision.trim()) { say("Write the draft first."); return; }
              persist(addDraft(project, scene.id, revision, revisionNote), `Revision ${scene.drafts.length + 1} saved — earlier drafts kept.`);
              setRevision(""); setRevisionNote("");
            }}>
            Save revision
          </button>
        </div>
      )}

      {/* Memories */}
      <div style={card}>
        <p style={sectionTitle}>Linked memories ({focus.memories.length})</p>
        {focus.memories.length === 0 && <p style={help}>Nothing attached yet. Capture below or attach an existing memory.</p>}
        {focus.memories.map((m) => memoryCard(m.id))}
        {unlinkedMemories.length > 0 && (
          <select value="" style={{ ...input, width: "auto" }}
            onChange={(e) => { if (e.target.value) persist(toggleMemoryLink(project, e.target.value, ref), "Memory attached."); }}>
            <option value="">+ Attach an existing memory…</option>
            {unlinkedMemories.map((m) => <option key={m.id} value={m.id}>{m.original.slice(0, 70)}{m.original.length > 70 ? "…" : ""}</option>)}
          </select>
        )}
      </div>

      {quickCapture(ref)}

      {/* Notes */}
      <div style={card}>
        <p style={sectionTitle}>Story development</p>
        <p style={help}>Facts and decisions are canon. Possibilities and working notes are not — promoting one is your call, made explicitly.</p>
        {ROOM_NOTE_SECTIONS.map((section) => {
          const notes = focus.notes[section.kind];
          if (notes.length === 0) return null;
          return (
            <div key={section.kind} style={{ marginBottom: 10 }}>
              <span style={label}>{section.title}</span>
              {notes.map((n) => (
                <div key={n.id} style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "flex-start", padding: "6px 0", borderBottom: "1px solid var(--line)" }}>
                  <p style={{ fontSize: 13.5, margin: 0, lineHeight: 1.5, textDecoration: n.status === "resolved" ? "line-through" : "none", opacity: n.status === "resolved" ? 0.6 : 1 }}>{n.text}</p>
                  <span style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                    {(n.kind === "question" || n.kind === "contradiction") && (
                      <button type="button" style={{ ...btnQuiet, padding: "3px 8px", fontSize: 11.5 }} onClick={() => persist(setNoteStatus(project, n.id, n.status === "open" ? "resolved" : "open"))}>
                        {n.status === "open" ? "Resolve" : "Reopen"}
                      </button>
                    )}
                    {n.kind === "possibility" && (
                      <button type="button" style={{ ...btnQuiet, padding: "3px 8px", fontSize: 11.5 }} onClick={() => persist(promoteNote(project, n.id, "decision"), "Promoted to an approved decision — canon now.")}>
                        Approve
                      </button>
                    )}
                    <button type="button" style={{ ...btnQuiet, padding: "3px 8px", fontSize: 11.5 }} onClick={() => persist(deleteNote(project, n.id))}>✕</button>
                  </span>
                </div>
              ))}
            </div>
          );
        })}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
          <select value={noteKind} onChange={(e) => setNoteKind(e.target.value as NoteKind)} style={{ ...input, width: "auto" }}>
            {NOTE_KINDS.map((k) => <option key={k.id} value={k.id}>{k.label}</option>)}
          </select>
          <input value={noteText} onChange={(e) => setNoteText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && noteText.trim()) { persist(addNote(project, noteKind, noteText, [ref]).project, "Noted."); setNoteText(""); } }}
            placeholder="Add to this room…" style={{ ...input, flex: 1, minWidth: 200 }} />
          <button type="button" style={btn} onClick={() => { if (noteText.trim()) { persist(addNote(project, noteKind, noteText, [ref]).project, "Noted."); setNoteText(""); } }}>Add</button>
        </div>
      </div>

      {/* Scenes linked to this focus */}
      {ref.kind !== "scene" && (
        <div style={card}>
          <p style={sectionTitle}>Scenes ({focus.scenes.length})</p>
          {focus.scenes.map((s) => (
            <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, padding: "7px 0", borderBottom: "1px solid var(--line)" }}>
              <span style={{ fontSize: 13.5 }}>{s.title} <span style={{ color: "var(--muted)" }}>({s.drafts.length} draft{s.drafts.length === 1 ? "" : "s"})</span></span>
              <button type="button" style={{ ...btnQuiet, padding: "5px 10px" }} onClick={() => setView({ name: "room", ref: { kind: "scene", id: s.id } })}>Open</button>
            </div>
          ))}
          <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
            {adding === "scene" ? (
              <>
                <input autoFocus value={addName} onChange={(e) => setAddName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") addFocusRecord("scene", addName); }}
                  placeholder="Scene title" style={{ ...input, maxWidth: 260 }} />
                <button type="button" style={btn} onClick={() => addFocusRecord("scene", addName)}>Add</button>
              </>
            ) : (
              <button type="button" style={btnQuiet} onClick={() => { setAdding("scene"); setAddName(""); }}>+ New scene from this material</button>
            )}
          </div>
        </div>
      )}

      {/* Chapters this focus touches */}
      {ref.kind !== "chapter" && focus.chapters.length > 0 && (
        <div style={card}>
          <p style={sectionTitle}>Appears in chapters</p>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {focus.chapters.map((c) => (
              <button key={c.id} type="button" style={chip(false)} onClick={() => setView({ name: "room", ref: { kind: "chapter", id: c.id } })}>{c.workingTitle}</button>
            ))}
          </div>
        </div>
      )}

      {/* Briefing pack */}
      <div style={card}>
        <p style={sectionTitle}>Work on this with your own story partner</p>
        <p style={help}>
          Builds a structured briefing — project instructions, this focus, verbatim memories, established
          facts, approved decisions, open questions, the current draft, your task, and a rule against
          inventing facts. Paste it into your own ChatGPT. What you copy there is governed by your
          ChatGPT account&apos;s privacy settings.
        </p>
        <span style={label}>The exact task for this session</span>
        <textarea value={task} onChange={(e) => setTask(e.target.value)}
          placeholder='e.g. "Ask me five questions that would deepen this relationship before we draft the meeting scene."'
          style={{ ...input, minHeight: 56, resize: "vertical" }} />
        <button type="button" style={{ ...btn, marginTop: 8 }}
          onClick={async () => {
            if (!task.trim()) { say("Say what you want your partner to do — the pack needs a task."); return; }
            try { await navigator.clipboard.writeText(briefingPack(project, ref, task)); say("Briefing pack copied."); }
            catch { say("Couldn't reach the clipboard — select and copy by hand."); }
          }}>
          Copy briefing pack
        </button>
      </div>

      {/* Paste back */}
      <div style={card}>
        <p style={sectionTitle}>Bring the results back</p>
        <p style={help}>Paste what came back, then decide what it is. Nothing becomes canon unless you classify it as an approved decision or established fact.</p>
        <textarea value={paste} onChange={(e) => setPaste(e.target.value)} placeholder="Paste the part worth keeping." style={{ ...input, minHeight: 84, resize: "vertical" }} />
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
          <select value={pasteClass} onChange={(e) => setPasteClass(e.target.value as PasteClassification)} style={{ ...input, width: "auto" }}>
            {PASTE_CLASSIFICATIONS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
          {pasteNeedsScene && (
            <select value={pasteSceneId} onChange={(e) => setPasteSceneId(e.target.value)} style={{ ...input, width: "auto" }}>
              <option value="">Which scene?</option>
              {(ref.kind === "scene" ? project.scenes.filter((s) => s.id === ref.id) : focus.scenes).map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
            </select>
          )}
          {pasteClass === "scene-draft" && (
            <input value={pasteSceneTitle} onChange={(e) => setPasteSceneTitle(e.target.value)} placeholder="New scene title" style={{ ...input, width: "auto", minWidth: 180 }} />
          )}
        </div>
        <button type="button" style={{ ...btn, marginTop: 8 }}
          onClick={() => {
            const sceneId = pasteNeedsScene ? (pasteSceneId || (ref.kind === "scene" ? ref.id : "")) : undefined;
            if (pasteNeedsScene && !sceneId) { say("Pick the scene this revises."); return; }
            const r = applyPasteBack(project, ref, pasteClass, paste, { sceneId, sceneTitle: pasteSceneTitle });
            if (!r.saved) { say("Nothing to save — paste the text first."); return; }
            persist(r.project, `Saved as: ${r.saved}.`);
            setPaste(""); setPasteSceneId(""); setPasteSceneTitle("");
          }}>
          Save classified result
        </button>
      </div>
    </div>
  );
}
