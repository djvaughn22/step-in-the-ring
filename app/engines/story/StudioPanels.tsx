"use client";

// Author's Room panels: series board, constitutions, research ledger, and
// revisions & backups. Pure presentation over the engine functions — every
// rule in story.engine.ts (immutable editions, amendment history, honest
// research statuses, restore-parks-current-first) is enforced there, not here.

import { useRef, useState } from "react";
import {
  addBook, addResearchClaim, addRule, amendRule, BOOK_STATUSES, moveBook,
  RESEARCH_STATUSES, SPIRITUAL_CLASSIFICATIONS, chaptersInBook, createEdition,
  setResearchStatus, updateBook, updateResearchClaim, projectWordCount,
  type BookStatus, type ResearchStatus, type SpiritualClassification, type StoryProject,
} from "./story.engine";
import {
  CHECKPOINT_SUGGESTIONS, compareRevisions, makeRevision, planRestore,
  REVISION_KIND_LABELS, type RevisionRecord,
} from "./revisions";
import { cachedRevisions, persistRevision, setRevisionProtected, storageHealth } from "./db";
import { chooseFolder, folderName, folderSupported, writeBackupFile } from "./localFolder";

export interface PanelStyles {
  input: React.CSSProperties;
  label: React.CSSProperties;
  help: React.CSSProperties;
  kicker: React.CSSProperties;
  btn: React.CSSProperties;
  btnQuiet: React.CSSProperties;
  sectionTitle: React.CSSProperties;
  verbatim: React.CSSProperties;
}

interface PanelProps {
  project: StoryProject;
  card: React.CSSProperties;
  s: PanelStyles;
  persist: (next: StoryProject, message?: string) => void;
  say: (m: string) => void;
}

// ---------------------------------------------------------------------------
// Series board
// ---------------------------------------------------------------------------

export function SeriesPanel({ project, card, s, persist, say }: PanelProps) {
  const [newBook, setNewBook] = useState("");

  const field = (
    bookId: string,
    key: "workingTitle" | "finalTitle" | "timeSpan" | "humanConflict" | "systemsConflict" | "spiritualConflict" | "faithQuestion" | "beginningState" | "endingState" | "closingHook" | "setupForLater" | "notes",
    labelText: string,
    value: string,
    tall = false,
  ) => (
    <div style={{ marginTop: 8 }}>
      <span style={s.label}>{labelText}</span>
      <textarea
        value={value}
        onChange={(e) => persist(updateBook(project, bookId, { [key]: e.target.value }))}
        style={{ ...s.input, minHeight: tall ? 56 : 38, resize: "vertical" }}
      />
    </div>
  );

  return (
    <>
      <div style={card}>
        <p style={s.kicker}>Series board</p>
        <h2 style={{ fontSize: 19, fontWeight: 900, margin: "0 0 6px" }}>The saga, book by book</h2>
        <p style={s.help}>
          Planned as connected books — seven to start — without demanding every book be outlined before
          Book One begins. Series order is the card order. Chapters are assigned to books from The Novel.
        </p>
        <div style={{ display: "flex", gap: 6 }}>
          <input
            value={newBook} onChange={(e) => setNewBook(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && newBook.trim()) { persist(addBook(project, newBook).project, "Book added to the board."); setNewBook(""); } }}
            placeholder="Working title for the next book" style={{ ...s.input, maxWidth: 300 }}
          />
          <button type="button" style={s.btn} onClick={() => { if (!newBook.trim()) { say("Give the book a working title."); return; } persist(addBook(project, newBook).project, "Book added to the board."); setNewBook(""); }}>
            + Add book
          </button>
        </div>
      </div>

      {project.books.map((b, i) => (
        <div key={b.id} style={card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <p style={{ ...s.kicker, margin: 0 }}>Book {i + 1} · {chaptersInBook(project, b.id).length} chapter{chaptersInBook(project, b.id).length === 1 ? "" : "s"}</p>
            <span style={{ display: "flex", gap: 6 }}>
              <button type="button" style={s.btnQuiet} disabled={i === 0} onClick={() => persist(moveBook(project, b.id, -1))}>↑</button>
              <button type="button" style={s.btnQuiet} disabled={i === project.books.length - 1} onClick={() => persist(moveBook(project, b.id, 1))}>↓</button>
              <select value={b.status} onChange={(e) => persist(updateBook(project, b.id, { status: e.target.value as BookStatus }))} style={{ ...s.input, width: "auto" }}>
                {BOOK_STATUSES.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}
              </select>
            </span>
          </div>
          <input value={b.workingTitle} onChange={(e) => persist(updateBook(project, b.id, { workingTitle: e.target.value }))} style={{ ...s.input, marginTop: 8, fontWeight: 800 }} />
          <details style={{ marginTop: 8 }}>
            <summary style={{ fontSize: 13, fontWeight: 800, cursor: "pointer" }}>Planning card</summary>
            {field(b.id, "finalTitle", "Final title (when decided)", b.finalTitle)}
            {field(b.id, "timeSpan", "Time span", b.timeSpan)}
            {field(b.id, "humanConflict", "Primary human conflict", b.humanConflict, true)}
            {field(b.id, "systemsConflict", "Primary technological / systems conflict", b.systemsConflict, true)}
            {field(b.id, "spiritualConflict", "Primary spiritual conflict", b.spiritualConflict, true)}
            {field(b.id, "faithQuestion", "The faith question this book asks", b.faithQuestion)}
            {field(b.id, "beginningState", "Where things stand as it opens", b.beginningState)}
            {field(b.id, "endingState", "Where things stand as it closes", b.endingState)}
            {field(b.id, "closingHook", "Closing hook", b.closingHook)}
            {field(b.id, "setupForLater", "What this book must plant for later books", b.setupForLater, true)}
            {field(b.id, "notes", "Notes", b.notes, true)}
          </details>
        </div>
      ))}
    </>
  );
}

// ---------------------------------------------------------------------------
// Constitutions
// ---------------------------------------------------------------------------

function RuleList({ project, which, card, s, persist }: PanelProps & { which: "constitution" | "spiritual" }) {
  const [area, setArea] = useState("");
  const [text, setText] = useState("");
  const [cls, setCls] = useState<SpiritualClassification>("interpretation");
  const [amending, setAmending] = useState("");
  const [amendText, setAmendText] = useState("");
  const [amendReason, setAmendReason] = useState("");

  const rules = project[which];
  const spiritual = which === "spiritual";

  return (
    <div style={card}>
      <p style={s.sectionTitle}>{spiritual ? "Spiritual-World Constitution" : "Series Constitution"}</p>
      <p style={s.help}>
        {spiritual
          ? "Every rule carries a truth label: direct biblical teaching, a chosen interpretation, fictional invention, or an open question. Fictional invention is never doctrine."
          : "Durable decisions about the series — promise, boundaries, craft rules. Amendments keep the previous wording, the reason, and the date."}
      </p>
      {rules.map((r) => (
        <div key={r.id} style={{ borderBottom: "1px solid var(--line)", padding: "8px 0" }}>
          <p style={{ ...s.label, margin: 0 }}>
            {r.area}
            {spiritual && r.classification && (
              <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 700, color: "var(--gold)" }}>
                {SPIRITUAL_CLASSIFICATIONS.find((c) => c.id === r.classification)?.label}
              </span>
            )}
          </p>
          <p style={{ fontSize: 13.5, lineHeight: 1.5, margin: "3px 0 0", whiteSpace: "pre-wrap" }}>{r.text}</p>
          {amending === r.id ? (
            <div style={{ marginTop: 6 }}>
              <textarea value={amendText} onChange={(e) => setAmendText(e.target.value)} placeholder="New wording" style={{ ...s.input, minHeight: 48, resize: "vertical" }} />
              <input value={amendReason} onChange={(e) => setAmendReason(e.target.value)} placeholder="Why it changed (recorded forever)" style={{ ...s.input, marginTop: 6 }} />
              {spiritual && (
                <select value={cls} onChange={(e) => setCls(e.target.value as SpiritualClassification)} style={{ ...s.input, width: "auto", marginTop: 6 }}>
                  {SPIRITUAL_CLASSIFICATIONS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
              )}
              <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                <button type="button" style={s.btn} onClick={() => {
                  if (!amendText.trim()) return;
                  persist(amendRule(project, which, r.id, amendText, amendReason, spiritual ? cls : undefined), "Amended — previous wording kept in history.");
                  setAmending(""); setAmendText(""); setAmendReason("");
                }}>Amend</button>
                <button type="button" style={s.btnQuiet} onClick={() => setAmending("")}>Cancel</button>
              </div>
            </div>
          ) : (
            <button type="button" style={{ ...s.btnQuiet, marginTop: 6, padding: "4px 9px", fontSize: 12 }} onClick={() => { setAmending(r.id); setAmendText(r.text); setAmendReason(""); if (spiritual && r.classification) setCls(r.classification); }}>
              Amend
            </button>
          )}
          {r.history.length > 0 && (
            <details style={{ marginTop: 4 }}>
              <summary style={{ fontSize: 12, color: "var(--muted)", cursor: "pointer" }}>History ({r.history.length})</summary>
              {r.history.map((h, idx) => (
                <p key={idx} style={{ ...s.help, margin: "4px 0 0" }}>
                  {h.changedAt.slice(0, 10)} — was: “{h.previousText}” · reason: {h.reason}
                </p>
              ))}
            </details>
          )}
        </div>
      ))}
      <div style={{ marginTop: 10 }}>
        <input value={area} onChange={(e) => setArea(e.target.value)} placeholder={spiritual ? "Area — e.g. Limits of angels" : "Area — e.g. Point of view"} style={s.input} />
        <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="The rule, in your words." style={{ ...s.input, minHeight: 48, resize: "vertical", marginTop: 6 }} />
        {spiritual && (
          <select value={cls} onChange={(e) => setCls(e.target.value as SpiritualClassification)} style={{ ...s.input, width: "auto", marginTop: 6 }}>
            {SPIRITUAL_CLASSIFICATIONS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        )}
        <div>
          <button type="button" style={{ ...s.btn, marginTop: 8 }} onClick={() => {
            const made = addRule(project, which, area, text, spiritual ? cls : undefined);
            if (!made.rule) return;
            persist(made.project, "Rule added.");
            setArea(""); setText("");
          }}>+ Add rule</button>
        </div>
      </div>
    </div>
  );
}

export function ConstitutionPanel(props: PanelProps) {
  return (
    <>
      <RuleList {...props} which="constitution" />
      <RuleList {...props} which="spiritual" />
    </>
  );
}

// ---------------------------------------------------------------------------
// Research ledger
// ---------------------------------------------------------------------------

export function ResearchPanel({ project, card, s, persist, say }: PanelProps) {
  const [topic, setTopic] = useState("");
  const [text, setText] = useState("");

  return (
    <>
      <div style={card}>
        <p style={s.kicker}>Research ledger</p>
        <h2 style={{ fontSize: 19, fontWeight: 900, margin: "0 0 6px" }}>Claims, honestly labeled</h2>
        <p style={s.help}>
          A claim is never more proven than its status says. Only “Verified finding” counts as verified —
          everything else is an idea, a question, or deliberate fiction, and the manuscript should treat it that way.
        </p>
        <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Topic — e.g. solar-assisted narrow-route vehicles" style={s.input} />
        <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="The claim or question, as it stands." style={{ ...s.input, minHeight: 56, resize: "vertical", marginTop: 6 }} />
        <button type="button" style={{ ...s.btn, marginTop: 8 }} onClick={() => {
          const made = addResearchClaim(project, topic, text);
          if (!made.claim) { say("A claim needs a topic and text."); return; }
          persist(made.project, "Claim recorded as a raw idea.");
          setTopic(""); setText("");
        }}>+ Add claim</button>
      </div>

      {project.research.map((c) => {
        const status = RESEARCH_STATUSES.find((x) => x.id === c.status)!;
        return (
          <div key={c.id} style={card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <p style={{ ...s.label, margin: 0 }}>{c.topic}</p>
              <select value={c.status} onChange={(e) => persist(setResearchStatus(project, c.id, e.target.value as ResearchStatus), "Status change recorded.")} style={{ ...s.input, width: "auto" }}>
                {RESEARCH_STATUSES.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}
              </select>
            </div>
            {!status.proven && <p style={{ fontSize: 11.5, color: "var(--muted)", margin: "4px 0 0" }}>Not verified — don&apos;t write it as proven engineering.</p>}
            <p style={{ fontSize: 13.5, lineHeight: 1.5, margin: "6px 0 0", whiteSpace: "pre-wrap" }}>{c.text}</p>
            <details style={{ marginTop: 6 }}>
              <summary style={{ fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>Sources & notes</summary>
              <span style={{ ...s.label, marginTop: 6, display: "block" }}>Sources (with dates)</span>
              <textarea value={c.sources} onChange={(e) => persist(updateResearchClaim(project, c.id, { sources: e.target.value }))} style={{ ...s.input, minHeight: 40, resize: "vertical" }} />
              <span style={{ ...s.label, marginTop: 6, display: "block" }}>Notes — confidence, contradictions, expert questions</span>
              <textarea value={c.notes} onChange={(e) => persist(updateResearchClaim(project, c.id, { notes: e.target.value }))} style={{ ...s.input, minHeight: 40, resize: "vertical" }} />
              {c.history.length > 0 && (
                <p style={{ ...s.help, margin: "6px 0 0" }}>
                  {c.history.map((h) => `${h.changedAt.slice(0, 10)}: ${h.from} → ${h.to}`).join(" · ")}
                </p>
              )}
            </details>
          </div>
        );
      })}
    </>
  );
}

// ---------------------------------------------------------------------------
// Revisions & backups
// ---------------------------------------------------------------------------

export function RevisionsPanel({
  project, card, s, persist, say,
  onExportCreative, onExportOwner, onImportClick,
}: PanelProps & {
  onExportCreative: () => void;
  onExportOwner: () => void;
  onImportClick: () => void;
}) {
  const [checkpointLabel, setCheckpointLabel] = useState("");
  const [compareLines, setCompareLines] = useState<string[]>([]);
  const [editionName, setEditionName] = useState("");
  const [, bump] = useState(0);
  const refresh = () => bump((n) => n + 1);
  const busyRef = useRef(false);

  const revisions = cachedRevisions(project.id);
  const health = storageHealth();

  const saveRevision = async (kind: "save" | "checkpoint", label: string) => {
    if (busyRef.current) return;
    busyRef.current = true;
    const ok = await persistRevision(makeRevision(project, kind, label));
    busyRef.current = false;
    say(ok ? (kind === "checkpoint" ? `Checkpoint "${label}" saved.` : "Revision saved.") : "Saving the revision failed — export a backup now.");
    refresh();
  };

  const restore = async (rev: RevisionRecord) => {
    const plan = planRestore(project, rev);
    if (!plan) { say("That revision can't be restored — it doesn't match this project."); return; }
    const parked = await persistRevision(plan.park);
    if (!parked) { say("Couldn't park the current state — restore cancelled, nothing changed."); return; }
    persist(plan.restored, "Restored. The newer state is parked as a protected checkpoint.");
    refresh();
  };

  return (
    <>
      <div style={card}>
        <p style={s.kicker}>Revisions</p>
        <h2 style={{ fontSize: 19, fontWeight: 900, margin: "0 0 6px" }}>Every draft, recoverable</h2>
        <p style={s.help}>
          Autosaves run in the background (the newest {20} are kept). Manual saves and named checkpoints are
          permanent. Restoring an older revision parks the current state first — both branches survive, always.
        </p>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <button type="button" style={s.btn} onClick={() => saveRevision("save", "")}>Save revision now</button>
          <input list="checkpoint-names" value={checkpointLabel} onChange={(e) => setCheckpointLabel(e.target.value)}
            placeholder="Checkpoint name — e.g. Owner read-through" style={{ ...s.input, width: "auto", minWidth: 220 }} />
          <datalist id="checkpoint-names">
            {CHECKPOINT_SUGGESTIONS.map((c) => <option key={c} value={c} />)}
          </datalist>
          <button type="button" style={s.btnQuiet} onClick={() => {
            if (!checkpointLabel.trim()) { say("Name the checkpoint first."); return; }
            saveRevision("checkpoint", checkpointLabel);
            setCheckpointLabel("");
          }}>📌 Named checkpoint</button>
        </div>
        <p style={{ fontSize: 12, color: "var(--muted)", margin: "8px 0 0" }}>
          Storage: {health === "indexeddb" ? "IndexedDB (durable in this browser)" : health === "localstorage-only" ? "localStorage only — revisions won't survive a reload in this browser" : "memory only — nothing survives a reload; export a backup"} · current draft ≈ {projectWordCount(project)} words
        </p>
      </div>

      <div style={card}>
        <p style={s.sectionTitle}>History ({revisions.length})</p>
        {revisions.length === 0 && <p style={s.help}>No revisions yet — save one above.</p>}
        {revisions.map((r) => (
          <div key={r.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap", padding: "7px 0", borderBottom: "1px solid var(--line)" }}>
            <span style={{ fontSize: 13 }}>
              {r.protected ? "🔒 " : ""}{REVISION_KIND_LABELS[r.kind]}{r.label ? ` — ${r.label}` : ""}
              <span style={{ color: "var(--muted)" }}> · {r.createdAt.slice(0, 16).replace("T", " ")} · {r.wordCount} words · {r.records} records</span>
            </span>
            <span style={{ display: "flex", gap: 4 }}>
              <button type="button" style={{ ...s.btnQuiet, padding: "3px 8px", fontSize: 11.5 }} onClick={() => setCompareLines(compareRevisions(r, makeRevision(project, "autosave")))}>
                Compare to now
              </button>
              <button type="button" style={{ ...s.btnQuiet, padding: "3px 8px", fontSize: 11.5 }} onClick={() => { void setRevisionProtected(r.id, !r.protected).then(refresh); }}>
                {r.protected ? "Unprotect" : "Protect"}
              </button>
              <button type="button" style={{ ...s.btnQuiet, padding: "3px 8px", fontSize: 11.5 }} onClick={() => restore(r)}>Restore</button>
            </span>
          </div>
        ))}
        {compareLines.length > 0 && (
          <div style={{ marginTop: 8 }}>
            <span style={s.label}>Selected revision → now</span>
            {compareLines.map((l, i) => <p key={i} style={{ ...s.help, margin: "0 0 2px" }}>• {l}</p>)}
            <button type="button" style={{ ...s.btnQuiet, marginTop: 4, padding: "3px 8px", fontSize: 11.5 }} onClick={() => setCompareLines([])}>Close</button>
          </div>
        )}
      </div>

      <div style={card}>
        <p style={s.sectionTitle}>Backups — two kinds, deliberately different</p>
        <p style={s.help}>
          The <strong>Creative Project Backup</strong> is the ordinary one: the fictional project only, with the
          private legend excluded by design. The <strong>Complete Owner Vault Backup</strong> additionally contains
          the Real-to-Fiction Legend with real identities — it is highly sensitive, produced only on this explicit
          click, and named PRIVATE so it can&apos;t be mistaken for the shareable kind.
        </p>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <button type="button" style={s.btn} onClick={onExportCreative}>Creative Project Backup</button>
          <button type="button" style={s.btnQuiet} onClick={onExportOwner}>🔐 Complete Owner Vault Backup</button>
          <button type="button" style={s.btnQuiet} onClick={onImportClick}>Restore from a backup file</button>
        </div>
        <p style={{ ...s.help, margin: "8px 0 0" }}>
          Restores never overwrite: an imported project lands alongside the current one as a separate copy.
        </p>
        {folderSupported() && (
          <div style={{ marginTop: 10, borderTop: "1px solid var(--line)", paddingTop: 10 }}>
            <span style={s.label}>Local writing folder {folderName() ? `— ${folderName()}` : ""}</span>
            <p style={s.help}>
              Pick a folder on this computer and backups can be written straight into its Backups subfolder with
              versioned names. The browser asks again after a reload — that&apos;s the browser&apos;s own safety rule.
            </p>
            <button type="button" style={s.btnQuiet} onClick={async () => {
              const name = await chooseFolder();
              say(name ? `Folder chosen: ${name}` : "No folder chosen.");
              refresh();
            }}>Choose folder…</button>
          </div>
        )}
      </div>

      <div style={card}>
        <p style={s.sectionTitle}>Published editions ({project.editions.length}) — immutable</p>
        <p style={s.help}>
          Freezing an edition preserves the exact compiled manuscript. Nothing can edit or delete one afterwards —
          a correction is a new edition with its own name.
        </p>
        {project.editions.map((e) => (
          <details key={e.id} style={{ marginBottom: 8 }}>
            <summary style={{ fontSize: 13, fontWeight: 800, cursor: "pointer" }}>
              {e.name} · {e.publishedAt.slice(0, 10)} · {e.wordCount} words
            </summary>
            <pre style={{ ...s.verbatim, marginTop: 6, maxHeight: 240, overflow: "auto" }}>{e.manuscript}</pre>
          </details>
        ))}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <input value={editionName} onChange={(e) => setEditionName(e.target.value)} placeholder='Edition name — e.g. "First Edition"' style={{ ...s.input, width: "auto", minWidth: 220 }} />
          <button type="button" style={s.btn} onClick={() => {
            const made = createEdition(project, editionName, { sourceNote: `frozen from working draft, ${new Date().toISOString().slice(0, 10)}` });
            if (!made.edition) { say("Name the edition first."); return; }
            persist(made.project, `Edition "${made.edition.name}" frozen.`);
            setEditionName("");
          }}>Freeze edition</button>
        </div>
      </div>
    </>
  );
}

export { writeBackupFile };
