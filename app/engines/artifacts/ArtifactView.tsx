"use client";

// The finished artifact, first and whole: next action, the work itself,
// labeled assumptions and unknowns, the paste-ready prompt, and the actions
// that make it usable right now (copy, download, edit, change answers).

import { useState } from "react";
import { artifactToMarkdown, type EngineArtifact } from "./index";

const label = { fontSize: 12, fontWeight: 900, color: "var(--gold)", textTransform: "uppercase" as const, letterSpacing: "0.08em", margin: "0 0 6px" };
const prose = { whiteSpace: "pre-wrap" as const, fontSize: 14, color: "var(--text)", lineHeight: 1.6, margin: 0, overflowWrap: "anywhere" as const };

/** **bold** and `code` inside plain text — nothing else. */
function Rich({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith("**") && p.endsWith("**") ? <b key={i}>{p.slice(2, -2)}</b>
          : p.startsWith("`") && p.endsWith("`") ? <code key={i} style={{ fontSize: 13 }}>{p.slice(1, -1)}</code>
            : <span key={i}>{p}</span>,
      )}
    </>
  );
}

export function downloadText(filename: string, text: string) {
  const blob = new Blob([text], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function slug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 50) || "artifact";
}

export default function ArtifactView({
  artifact, edited, card, copy, onSaveEdit, onChangeAnswers,
}: {
  artifact: EngineArtifact;
  edited?: string;
  card: React.CSSProperties;
  copy: (text: string, what: string) => void;
  onSaveEdit: (markdown: string | undefined) => void;
  onChangeAnswers: () => void;
}) {
  const generated = artifactToMarkdown(artifact);
  const current = edited ?? generated;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(current);
  const file = `${slug(artifact.title)}.md`;

  const actions = (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {artifact.prompt && !edited && (
        <button onClick={() => copy(artifact.prompt!.text, artifact.prompt!.label.split(" — ")[0])} className="btn btn-gold btn-small">
          Copy {artifact.prompt.label.split(" — ")[0].toLowerCase()}
        </button>
      )}
      <button onClick={() => copy(current, `${artifact.kind}`)} className={`btn btn-small ${artifact.prompt && !edited ? "btn-ghost" : "btn-gold"}`}>Copy all</button>
      <button onClick={() => downloadText(file, current)} className="btn btn-ghost btn-small">Download .md</button>
      <button onClick={() => { setDraft(current); setEditing(true); }} className="btn btn-ghost btn-small">Edit</button>
      <button onClick={onChangeAnswers} className="btn btn-ghost btn-small">Change answers</button>
    </div>
  );

  if (editing) {
    return (
      <div style={card}>
        <p style={label}>Editing — {artifact.kind}</p>
        <label htmlFor="artifact-edit" className="sr-only">Edit the {artifact.kind}</label>
        <textarea
          id="artifact-edit"
          value={draft}
          onChange={(ev) => setDraft(ev.target.value)}
          style={{ width: "100%", boxSizing: "border-box", minHeight: 420, background: "var(--surface)", border: "1px solid var(--line2)", borderRadius: 10, color: "var(--text)", padding: 12, fontSize: 13.5, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", lineHeight: 1.5, resize: "vertical" }}
        />
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
          <button onClick={() => { onSaveEdit(draft.trim() === generated.trim() ? undefined : draft); setEditing(false); }} className="btn btn-gold btn-small">Save edits</button>
          <button onClick={() => setEditing(false)} className="btn btn-ghost btn-small">Cancel</button>
          {edited && <button onClick={() => { onSaveEdit(undefined); setEditing(false); }} className="btn btn-ghost btn-small">Go back to the generated version</button>}
        </div>
      </div>
    );
  }

  if (edited) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={card}>
          <p style={label}>{artifact.kind} — your edited version</p>
          <pre style={{ ...prose, fontFamily: "inherit" }}>{edited}</pre>
        </div>
        {actions}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={card}>
        <p style={label}>{artifact.kind}</p>
        <h2 style={{ fontSize: 21, fontWeight: 900, margin: "0 0 6px", color: "var(--text)", overflowWrap: "anywhere" }}>{artifact.title}</h2>
        <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.55, margin: "0 0 12px" }}>{artifact.summary}</p>
        {artifact.limitation && (
          <p role="note" style={{ fontSize: 13.5, color: "var(--text)", lineHeight: 1.5, margin: "0 0 12px", padding: "10px 12px", border: "1px solid var(--gold)", borderRadius: 10 }}>
            <b>Not a full answer yet:</b> {artifact.limitation}
          </p>
        )}
        <div style={{ background: "var(--surface)", border: "1px solid var(--line2)", borderRadius: 10, padding: "10px 12px", marginBottom: 12 }}>
          <p style={{ ...label, margin: "0 0 4px" }}>Next action</p>
          <p style={prose}><Rich text={artifact.nextAction} /></p>
        </div>
        {actions}
      </div>

      {artifact.sections.map((s) => (
        <section key={s.heading} style={card} aria-label={s.heading}>
          <h3 style={label}>{s.heading}</h3>
          <div style={prose}>{s.body.split("\n").map((line, i) => <div key={i}><Rich text={line} /></div>)}</div>
        </section>
      ))}

      {(artifact.assumptions.length > 0 || artifact.unknowns.length > 0) && (
        <section style={card} aria-label="Assumptions and unknowns">
          {artifact.assumptions.length > 0 && (
            <>
              <h3 style={label}>Assumptions I made — change any that are wrong</h3>
              <ul style={{ ...prose, paddingLeft: 18, whiteSpace: "normal" }}>
                {artifact.assumptions.map((x) => <li key={x} style={{ marginBottom: 6 }}>{x}</li>)}
              </ul>
            </>
          )}
          {artifact.unknowns.length > 0 && (
            <>
              <h3 style={{ ...label, marginTop: artifact.assumptions.length ? 14 : 0 }}>Still unknown</h3>
              <ul style={{ ...prose, paddingLeft: 18, whiteSpace: "normal" }}>
                {artifact.unknowns.map((x) => <li key={x} style={{ marginBottom: 6 }}>{x}</li>)}
              </ul>
            </>
          )}
          <button onClick={onChangeAnswers} className="btn btn-ghost btn-small" style={{ marginTop: 6 }}>Change answers and regenerate</button>
        </section>
      )}

      {artifact.prompt && (
        <section style={card} aria-label={artifact.prompt.label}>
          <h3 style={label}>{artifact.prompt.label}</h3>
          <pre style={{ ...prose, fontSize: 13, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", background: "var(--surface)", border: "1px solid var(--line2)", borderRadius: 10, padding: 12, maxHeight: 420, overflow: "auto" }}>{artifact.prompt.text}</pre>
          <button onClick={() => copy(artifact.prompt!.text, artifact.prompt!.label.split(" — ")[0])} className="btn btn-gold btn-small" style={{ marginTop: 10 }}>Copy</button>
        </section>
      )}
    </div>
  );
}
