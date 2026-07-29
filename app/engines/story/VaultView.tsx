"use client";

/**
 * Real-to-Fiction Legend — owner-only view inside Story Partner.
 *
 * The private key connecting real people, places, organizations, events, and
 * experiences to the fictional universe. Everything here stays in a storage
 * slot separate from the story project; nothing here rides along in story
 * exports, briefing packs, or the manuscript. See the laws in vault.engine.ts.
 *
 * No routes, no URL parameters — real names never touch a URL or a log.
 */

import { useEffect, useState } from "react";
import type { StoryProjectV1 } from "./story.engine";
import { labelFor } from "./story.engine";
import {
  addMapping, addMappingChange, addNameSuggestion, addSource, aiSafeSourceContext,
  AI_SEND_WARNING, APPROVAL_STATUSES, createVault, deleteSource, exportVaultPayload,
  identityProtectionReport, IDENTITY_RISK_CHECKLIST, LEAKAGE_DISCLAIMER, leakageWarnings,
  linkMemoryToSource, markVaultExported, MENTION_CLASSIFICATIONS, parseVaultImport,
  reviewMapping, RISK_LEVELS, searchVault, SENSITIVITIES, setMappingFiction,
  setSourceArchived, setSuggestionStatus, SOURCE_KINDS, unlinkMemoryFromSource,
  updateMapping, updateSource, VAULT_EXPORT_FILENAME_PREFIX, VAULT_EXPORT_NOTICE,
  VAULT_PRIVACY_EXPLANATION,
  type ApprovalStatus, type FictionTarget, type MentionClassification, type RiskLevel,
  type SourceKind, type SourceVaultV1,
} from "./vault.engine";
import {
  hasLock, isUnlocked, loadVault, lockNow, LOCK_RESET_PHRASE, resetLock, saveVault,
  setLock, unlockWithCode,
} from "./vault.store";
import {
  disableVaultEncryption, enableVaultEncryption, lockVault, unlockVault, vaultEncryptionState,
} from "./db";

const WORKFLOW =
  "Capture → Preserve → Identify → Classify → Protect → Fictionalize → Connect → Approve. " +
  "Capture memories fast in the ordinary workspace — the original words are preserved there. " +
  "Here, privately: identify who and what a memory really involves, classify it, flag what " +
  "needs protection, plan the fictional changes, connect sources to fictional elements, and " +
  "approve mappings when you've reviewed them. Nothing becomes fictional canon here.";

export default function VaultView({
  project,
  card,
  onBack,
}: {
  project: StoryProjectV1;
  card: React.CSSProperties;
  onBack: () => void;
}) {
  const [ready, setReady] = useState(false);
  const [locked, setLocked] = useState(true);
  const [lockExists, setLockExists] = useState(false);
  const [codeInput, setCodeInput] = useState("");
  const [resetInput, setResetInput] = useState("");
  const [showReset, setShowReset] = useState(false);
  const [vault, setVault] = useState<SourceVaultV1 | null>(null);
  const [flash, setFlash] = useState("");

  // transient inputs
  const [newKind, setNewKind] = useState<SourceKind>("person");
  const [newName, setNewName] = useState("");
  const [openSourceId, setOpenSourceId] = useState("");
  const [deleteTyped, setDeleteTyped] = useState("");
  const [mapLabel, setMapLabel] = useState("");
  const [mapSources, setMapSources] = useState<string[]>([]);
  const [openMapId, setOpenMapId] = useState("");
  const [changeWhat, setChangeWhat] = useState("");
  const [changeWhy, setChangeWhy] = useState("");
  const [suggestName, setSuggestName] = useState("");
  const [suggestNotes, setSuggestNotes] = useState("");
  const [query, setQuery] = useState("");
  const [report, setReport] = useState("");
  const [aiPicks, setAiPicks] = useState<string[]>([]);
  const [aiPreview, setAiPreview] = useState("");
  const [confirmExport, setConfirmExport] = useState(false);
  const [pendingImport, setPendingImport] = useState<SourceVaultV1 | null>(null);

  const [encState, setEncState] = useState<"off" | "locked" | "unlocked">("off");
  const [passInput, setPassInput] = useState("");
  const [passConfirm, setPassConfirm] = useState("");
  const [showEncrypt, setShowEncrypt] = useState(false);

  useEffect(() => {
    let alive = true;
    // Deferred so state settles in one pass after mount, not synchronously in the effect.
    void Promise.resolve().then(() => {
      if (!alive) return;
      setLockExists(hasLock());
      const isLocked = !isUnlocked();
      setLocked(isLocked);
      const enc = vaultEncryptionState(project.id);
      setEncState(enc);
      if (!isLocked && enc !== "locked") setVault(loadVault(project.id) ?? createVault(project.id));
      setReady(true);
    });
    return () => { alive = false; };
  }, [project.id]);

  const openVault = () => setVault(loadVault(project.id) ?? createVault(project.id));

  const say = (m: string) => { setFlash(m); setTimeout(() => setFlash(""), 3500); };

  const persist = (next: SourceVaultV1, message?: string) => {
    setVault(next);
    void saveVault(next).then((ok) => {
      if (!ok) { say("Saving to this browser failed — export the vault now."); return; }
      if (message) say(message);
    });
  };

  // ---- styles (match StoryStudio conventions) ----
  const input = {
    width: "100%", boxSizing: "border-box" as const, background: "var(--surface)",
    color: "inherit", border: "1px solid var(--line)", borderRadius: 10,
    padding: "10px 12px", fontSize: 15, fontFamily: "inherit",
  };
  const label = { display: "block", fontSize: 13, fontWeight: 800, marginBottom: 4 } as const;
  const help = { fontSize: 12.5, color: "var(--muted)", margin: "0 0 6px", lineHeight: 1.5 } as const;
  const kicker = { fontSize: 12, fontWeight: 900, color: "var(--gold)", textTransform: "uppercase" as const, letterSpacing: "0.08em", margin: "0 0 6px" };
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
  const mono = { fontFamily: "ui-monospace, monospace", fontSize: 12.5 } as const;

  const flashLine = (
    <p role="status" aria-live="polite" style={{ color: "var(--gold)", fontWeight: 800, minHeight: 20, margin: "8px 0 0" }}>{flash}</p>
  );

  if (!ready) return <div style={{ height: 200 }} />;

  // ================= lock screens =================

  // Real encryption comes first: while the vault is sealed, there is nothing
  // readable in memory — the passphrase is the only way in, and it is NOT
  // recoverable.
  if (encState === "locked") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <button type="button" onClick={onBack} style={{ ...btnQuiet, alignSelf: "flex-start" }}>← Workspace</button>
        <div style={card}>
          <p style={kicker}>Real-to-Fiction Legend</p>
          <h2 style={{ fontSize: 19, fontWeight: 900, margin: "0 0 6px" }}>Unlock the encrypted vault</h2>
          <p style={help}>
            This vault is encrypted (AES-256-GCM) under your passphrase. There is no reset and no
            recovery — a forgotten passphrase means this vault stays sealed for good. Your Complete
            Owner Vault Backups are the safety net.
          </p>
          <span style={label}>Vault passphrase</span>
          <input type="password" value={passInput} onChange={(e) => setPassInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") (document.getElementById("vault-decrypt-btn") as HTMLButtonElement | null)?.click(); }}
            style={input} />
          <button id="vault-decrypt-btn" type="button" style={{ ...btn, marginTop: 10 }}
            onClick={async () => {
              if (!passInput) { say("Enter the passphrase."); return; }
              if (await unlockVault(project.id, passInput)) {
                setPassInput("");
                setEncState("unlocked");
                openVault();
                say("Vault unlocked for this page session.");
              } else {
                say("That passphrase doesn't open this vault.");
              }
            }}>
            Unlock
          </button>
          {flashLine}
        </div>
      </div>
    );
  }

  if (locked) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <button type="button" onClick={onBack} style={{ ...btnQuiet, alignSelf: "flex-start" }}>← Workspace</button>
        <div style={card}>
          <p style={kicker}>Real-to-Fiction Legend</p>
          <h2 style={{ fontSize: 19, fontWeight: 900, margin: "0 0 6px" }}>
            {lockExists ? "Unlock the private legend" : "Set a vault lock first"}
          </h2>
          <p style={help}>
            This area holds the real identities behind the fiction. Only the owner works here —
            people with access to the manuscript do not get access to this.
          </p>
          {!lockExists && (
            <p style={help}>
              Choose a lock code. Honest limit: this lock deters casual access on a shared device;
              it is not encryption and not a security boundary. Your data stays in this browser either way.
            </p>
          )}
          <span style={label}>{lockExists ? "Lock code" : "New lock code"}</span>
          <input
            type="password" value={codeInput} onChange={(e) => setCodeInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") (document.getElementById("vault-unlock-btn") as HTMLButtonElement | null)?.click(); }}
            placeholder={lockExists ? "Enter your code" : "Pick something you'll remember"} style={input}
          />
          <button
            id="vault-unlock-btn" type="button" style={{ ...btn, marginTop: 10 }}
            onClick={async () => {
              if (!codeInput.trim()) { say("Enter a code."); return; }
              // This screen only renders when the encrypted seal is already off or open.
              if (lockExists) {
                if (await unlockWithCode(codeInput)) { setLocked(false); setCodeInput(""); openVault(); }
                else say("That's not the code.");
              } else {
                if (await setLock(codeInput)) { setLockExists(true); setLocked(false); setCodeInput(""); openVault(); }
                else say("Couldn't set the lock in this browser.");
              }
            }}
          >
            {lockExists ? "Unlock" : "Set lock & open"}
          </button>
          {flashLine}
        </div>
        {lockExists && (
          <div style={card}>
            <p style={sectionTitle}>Forgot the code?</p>
            <p style={help}>
              The lock can be removed without the code — your legend data is kept. That is possible
              precisely because this lock is a courtesy, not security: anyone at this device could do
              the same. Type {LOCK_RESET_PHRASE} to confirm.
            </p>
            {showReset ? (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <input value={resetInput} onChange={(e) => setResetInput(e.target.value)} placeholder={LOCK_RESET_PHRASE} style={{ ...input, maxWidth: 240 }} />
                <button type="button" style={btnQuiet} onClick={() => {
                  if (resetLock(resetInput)) { setLockExists(false); setResetInput(""); setShowReset(false); say("Lock removed. Set a new one."); }
                  else say(`Type ${LOCK_RESET_PHRASE} exactly.`);
                }}>Remove lock</button>
              </div>
            ) : (
              <button type="button" style={btnQuiet} onClick={() => setShowReset(true)}>Remove the lock…</button>
            )}
          </div>
        )}
      </div>
    );
  }

  if (!vault) return <div style={{ height: 200 }} />;

  // ================= helpers =================

  const activeSources = vault.sources.filter((s) => !s.archived);
  const archivedSources = vault.sources.filter((s) => s.archived);
  const hits = query.trim() ? searchVault(vault, project, query) : [];

  const fictionOptions: { target: FictionTarget; label: string }[] = [
    ...project.characters.map((c) => ({ target: { kind: "character" as const, id: c.id }, label: `Character: ${c.name}` })),
    ...project.relationships.map((r) => ({ target: { kind: "relationship" as const, id: r.id }, label: `Relationship: ${r.title}` })),
    ...project.storylines.map((s) => ({ target: { kind: "storyline" as const, id: s.id }, label: `Storyline: ${s.name}` })),
    ...project.scenes.map((s) => ({ target: { kind: "scene" as const, id: s.id }, label: `Scene: ${s.title}` })),
    ...project.chapters.map((c) => ({ target: { kind: "chapter" as const, id: c.id }, label: `Chapter: ${c.workingTitle}` })),
  ];

  const fictionKey = (f: FictionTarget | null) => (f ? `${f.kind}:${f.id}` : "");

  const doVaultExport = () => {
    const stamped = markVaultExported(vault);
    const payload = exportVaultPayload(stamped);
    const blob = new Blob([payload], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${VAULT_EXPORT_FILENAME_PREFIX}-${stamped.lastExportAt.slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    persist(stamped, "Vault exported. That file contains real identities — store it privately.");
    setConfirmExport(false);
  };

  const textField = (
    sourceId: string, field: "relationshipToOwner" | "lifePeriod" | "locations" | "organizations" | "privateContext" | "identifyingDetails" | "neverPublish" | "mustAlter" | "ownerNotes",
    title: string, placeholder: string, tall = false,
  ) => {
    const s = vault.sources.find((x) => x.id === sourceId);
    if (!s) return null;
    return (
      <div style={{ marginTop: 8 }}>
        <span style={label}>{title}</span>
        <textarea
          value={s[field]}
          onChange={(e) => persist(updateSource(vault, sourceId, { [field]: e.target.value }))}
          placeholder={placeholder}
          style={{ ...input, minHeight: tall ? 64 : 40, resize: "vertical" }}
        />
      </div>
    );
  };

  const historyBlock = (entries: { at: string; note: string }[]) => (
    <details style={{ marginTop: 8 }}>
      <summary style={{ fontSize: 12.5, fontWeight: 800, cursor: "pointer" }}>History ({entries.length})</summary>
      {entries.map((h, i) => (
        <p key={i} style={{ ...help, margin: "4px 0 0" }}>{h.at.slice(0, 10)} — {h.note}</p>
      ))}
    </details>
  );

  // ================= main =================

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <button type="button" onClick={onBack} style={btnQuiet}>← Workspace</button>
        <button type="button" style={btnQuiet} onClick={async () => {
          if (encState === "unlocked") { await lockVault(project.id); setEncState("locked"); setVault(null); }
          lockNow();
          setLocked(true);
        }}>🔒 Lock now</button>
      </div>

      <div style={card}>
        <p style={kicker}>Real-to-Fiction Legend — owner only</p>
        <h2 style={{ fontSize: 19, fontWeight: 900, margin: "0 0 6px" }}>{project.title}: the private key</h2>
        <p style={help}>{WORKFLOW}</p>
        <p style={help}>{VAULT_PRIVACY_EXPLANATION}</p>
        {flashLine}
      </div>

      <div style={card}>
        <p style={sectionTitle}>
          {encState === "unlocked" ? "🔐 Encryption is ON (unlocked this session)" : "Encryption — off"}
        </p>
        {encState === "unlocked" ? (
          <>
            <p style={help}>
              The vault is stored as AES-256-GCM ciphertext. While unlocked it lives decrypted in this
              page&apos;s memory only — locking, refreshing, or closing the tab seals it again. Nothing
              typed here is written back to unencrypted storage.
            </p>
            <button type="button" style={btnQuiet} onClick={async () => {
              if (!window.confirm("Turn encryption OFF and store the vault as plain browser data again?")) return;
              const ok = await disableVaultEncryption(project.id);
              if (ok) { setEncState("off"); say("Encryption is off — the vault is plain browser data again."); }
              else say("Couldn't disable encryption.");
            }}>Turn encryption off</button>
          </>
        ) : showEncrypt ? (
          <>
            <p style={help}>
              Real encryption (AES-256-GCM, PBKDF2). Two honest warnings before you turn it on:
              the passphrase is NOT recoverable — forgetting it loses this vault permanently — and
              encryption protects the vault at rest, not while it&apos;s unlocked on an open screen.
              Download a Complete Owner Vault Backup first and store it somewhere safe.
            </p>
            <span style={label}>Vault passphrase (min 8 characters — separate from your login password)</span>
            <input type="password" value={passInput} onChange={(e) => setPassInput(e.target.value)} style={input} />
            <span style={{ ...label, marginTop: 6, display: "block" }}>Type it again</span>
            <input type="password" value={passConfirm} onChange={(e) => setPassConfirm(e.target.value)} style={input} />
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <button type="button" style={btn} onClick={async () => {
                if (passInput.length < 8) { say("Use at least 8 characters."); return; }
                if (passInput !== passConfirm) { say("The two entries don't match."); return; }
                const ok = await enableVaultEncryption(project.id, passInput);
                if (ok) { setEncState("unlocked"); setShowEncrypt(false); setPassInput(""); setPassConfirm(""); say("Vault encrypted. The passphrase is NOT recoverable — keep backups."); }
                else say("Couldn't encrypt the vault in this browser.");
              }}>Encrypt the vault</button>
              <button type="button" style={btnQuiet} onClick={() => { setShowEncrypt(false); setPassInput(""); setPassConfirm(""); }}>Cancel</button>
            </div>
          </>
        ) : (
          <>
            <p style={help}>
              Today this vault is plain browser data behind a courtesy lock. Optional real encryption
              seals it under a passphrase so browser storage and stolen device backups hold only
              ciphertext. The trade is permanent: no passphrase, no vault.
            </p>
            <button type="button" style={btnQuiet} onClick={() => setShowEncrypt(true)}>Encrypt this vault…</button>
          </>
        )}
      </div>

      {/* Private search */}
      <div style={card}>
        <p style={sectionTitle}>Private search</p>
        <p style={help}>Search by real name, fictional name, source ID, place, organization — this search exists only here.</p>
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="e.g. a real name, MAP-001, a city" style={input} />
        {hits.map((h) => (
          <button
            key={`${h.kind}-${h.id}`} type="button"
            style={{ ...btnQuiet, display: "block", width: "100%", textAlign: "left", marginTop: 6 }}
            onClick={() => { if (h.kind === "source") setOpenSourceId(h.id); else setOpenMapId(h.id); setQuery(""); }}
          >
            {h.kind === "source" ? "Source" : "Mapping"}: {h.label}
          </button>
        ))}
        {query.trim() && hits.length === 0 && <p style={{ ...help, marginTop: 6 }}>Nothing in the legend matches.</p>}
      </div>

      {/* Sources */}
      <div style={card}>
        <p style={sectionTitle}>Source identities ({activeSources.length})</p>
        <p style={help}>
          The real people, places, organizations, events, relationships, and experiences behind the
          fiction. Each gets a stable private ID — the manuscript never sees these records.
        </p>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <select value={newKind} onChange={(e) => setNewKind(e.target.value as SourceKind)} style={{ ...input, width: "auto" }}>
            {SOURCE_KINDS.map((k) => <option key={k.id} value={k.id}>{k.label}</option>)}
          </select>
          <input
            value={newName} onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && newName.trim()) { const made = addSource(vault, newKind, newName); if (made.source) { persist(made.vault, `${made.source.id} recorded.`); setOpenSourceId(made.source.id); setNewName(""); } } }}
            placeholder="Real name — stays in the vault" style={{ ...input, flex: 1, minWidth: 200 }}
          />
          <button type="button" style={btn} onClick={() => {
            const made = addSource(vault, newKind, newName);
            if (!made.source) { say("Enter the real name."); return; }
            persist(made.vault, `${made.source.id} recorded.`);
            setOpenSourceId(made.source.id); setNewName("");
          }}>Add source</button>
        </div>

        {activeSources.map((s) => {
          const open = openSourceId === s.id;
          const mappedTo = vault.mappings.filter((m) => m.sourceIds.includes(s.id));
          return (
            <div key={s.id} style={{ border: "1px solid var(--line)", borderRadius: 12, padding: 12, marginTop: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span><span style={{ ...mono, color: "var(--gold)", fontWeight: 800 }}>{s.id}</span> — <strong>{s.realName}</strong></span>
                <button type="button" style={{ ...btnQuiet, padding: "5px 10px", fontSize: 12.5 }} onClick={() => { setOpenSourceId(open ? "" : s.id); setDeleteTyped(""); }}>
                  {open ? "Close" : "Open"}
                </button>
              </div>
              <p style={{ ...help, margin: "4px 0 0" }}>
                {SOURCE_KINDS.find((k) => k.id === s.kind)?.label}
                {mappedTo.length ? ` · in ${mappedTo.map((m) => m.id).join(", ")}` : " · no mapping yet"}
                {` · ${SENSITIVITIES.find((x) => x.id === s.sensitivity)?.label}`}
              </p>
              {open && (
                <div>
                  <div style={{ marginTop: 8 }}>
                    <span style={label}>Real name</span>
                    <input value={s.realName} onChange={(e) => persist(updateSource(vault, s.id, { realName: e.target.value }))} style={input} />
                  </div>
                  {textField(s.id, "relationshipToOwner", "Your relationship to this source", "e.g. an invented example: childhood neighbor")}
                  {textField(s.id, "lifePeriod", "Relevant life period", "When this source matters in your life")}
                  {textField(s.id, "locations", "Real locations involved", "Cities, buildings, neighborhoods")}
                  {textField(s.id, "organizations", "Real organizations involved", "Employers, schools, churches")}
                  {textField(s.id, "privateContext", "Source memories & private context", "What actually happened, in your words", true)}
                  {textField(s.id, "identifyingDetails", "Identifying characteristics", "Distinctive traits, expressions, habits", true)}
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 8 }}>
                    <div>
                      <span style={label}>Sensitivity</span>
                      <select value={s.sensitivity} onChange={(e) => persist(updateSource(vault, s.id, { sensitivity: e.target.value as typeof s.sensitivity }, "Sensitivity changed"))} style={{ ...input, width: "auto" }}>
                        {SENSITIVITIES.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}
                      </select>
                    </div>
                    {s.kind === "person" && (
                      <>
                        <div>
                          <span style={label}>Living?</span>
                          <select value={s.living} onChange={(e) => persist(updateSource(vault, s.id, { living: e.target.value as typeof s.living }))} style={{ ...input, width: "auto" }}>
                            <option value="living">Living</option><option value="deceased">Deceased</option><option value="unknown">Unknown</option>
                          </select>
                        </div>
                        <div>
                          <span style={label}>Permission to appear?</span>
                          <select value={s.permission} onChange={(e) => persist(updateSource(vault, s.id, { permission: e.target.value as typeof s.permission }))} style={{ ...input, width: "auto" }}>
                            <option value="none">Not asked</option><option value="asked">Asked</option><option value="granted">Granted</option>
                          </select>
                        </div>
                      </>
                    )}
                  </div>
                  {textField(s.id, "neverPublish", "Must NEVER be published", "Details that stay out of the books, period", true)}
                  {textField(s.id, "mustAlter", "Requires significant alteration", "Details that can appear only after real change")}
                  {textField(s.id, "ownerNotes", "Owner notes", "Anything else you need to remember")}

                  {project.memories.length > 0 && (
                    <div style={{ marginTop: 8 }}>
                      <span style={label}>Memories this source appears in</span>
                      {s.memoryLinks.map((l) => {
                        const m = project.memories.find((x) => x.id === l.memoryId);
                        return (
                          <div key={l.memoryId} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, padding: "5px 0", borderBottom: "1px solid var(--line)" }}>
                            <span style={{ fontSize: 12.5 }}>
                              {m ? `${m.original.slice(0, 50)}${m.original.length > 50 ? "…" : ""}` : "(memory no longer in the project)"}
                            </span>
                            <span style={{ display: "flex", gap: 4, alignItems: "center" }}>
                              <select value={l.classification} onChange={(e) => persist(linkMemoryToSource(vault, s.id, l.memoryId, e.target.value as MentionClassification))} style={{ ...input, width: "auto", padding: "4px 8px", fontSize: 12 }}>
                                {MENTION_CLASSIFICATIONS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                              </select>
                              <button type="button" style={{ ...btnQuiet, padding: "3px 8px" }} onClick={() => persist(unlinkMemoryFromSource(vault, s.id, l.memoryId))}>✕</button>
                            </span>
                          </div>
                        );
                      })}
                      <select value="" style={{ ...input, width: "auto", marginTop: 6 }}
                        onChange={(e) => { if (e.target.value) persist(linkMemoryToSource(vault, s.id, e.target.value, "possible"), "Linked — classify it."); }}>
                        <option value="">+ Identify this source in a memory…</option>
                        {project.memories.filter((m) => !s.memoryLinks.some((l) => l.memoryId === m.id)).map((m) => (
                          <option key={m.id} value={m.id}>{m.original.slice(0, 70)}{m.original.length > 70 ? "…" : ""}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {historyBlock(s.history)}

                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10, alignItems: "center" }}>
                    <button type="button" style={btnQuiet} onClick={() => { persist(setSourceArchived(vault, s.id, true), "Archived — the record and its history are kept."); setOpenSourceId(""); }}>
                      Archive (preferred)
                    </button>
                    <input value={deleteTyped} onChange={(e) => setDeleteTyped(e.target.value)} placeholder={`Type ${s.id} to enable delete`} style={{ ...input, width: 230, padding: "6px 10px", fontSize: 12.5 }} />
                    <button type="button" style={{ ...btnQuiet, opacity: deleteTyped.trim() === s.id ? 1 : 0.5 }} onClick={() => {
                      const r = deleteSource(vault, s.id, deleteTyped);
                      if (!r.ok) { say(r.error); return; }
                      persist(r.vault, "Source deleted permanently."); setOpenSourceId("");
                    }}>Delete forever</button>
                  </div>
                  <p style={{ ...help, margin: "6px 0 0" }}>
                    Deleting is irreversible and blocked while any mapping references this source. Archiving keeps everything.
                  </p>
                </div>
              )}
            </div>
          );
        })}

        {archivedSources.length > 0 && (
          <details style={{ marginTop: 10 }}>
            <summary style={{ fontSize: 12.5, fontWeight: 800, cursor: "pointer" }}>Archived ({archivedSources.length})</summary>
            {archivedSources.map((s) => (
              <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid var(--line)" }}>
                <span style={{ fontSize: 12.5 }}><span style={mono}>{s.id}</span> — {s.realName}</span>
                <button type="button" style={{ ...btnQuiet, padding: "3px 8px", fontSize: 12 }} onClick={() => persist(setSourceArchived(vault, s.id, false), "Restored.")}>Restore</button>
              </div>
            ))}
          </details>
        )}
      </div>

      {/* Mappings */}
      <div style={card}>
        <p style={sectionTitle}>Legend mappings ({vault.mappings.length})</p>
        <p style={help}>
          How reality becomes fiction — one source into many characters, many sources into one
          composite, or no published element at all. Links use stable IDs, so renaming a character
          in the story never breaks a mapping.
        </p>
        <div style={{ marginBottom: 6 }}>
          <span style={label}>Sources going into this mapping</span>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {activeSources.map((s) => {
              const on = mapSources.includes(s.id);
              return (
                <button key={s.id} type="button" style={chip(on)} onClick={() => setMapSources((cur) => (on ? cur.filter((x) => x !== s.id) : [...cur, s.id]))}>
                  {s.id}
                </button>
              );
            })}
            {activeSources.length === 0 && <p style={{ ...help, margin: 0 }}>Record a source first.</p>}
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <input value={mapLabel} onChange={(e) => setMapLabel(e.target.value)} placeholder="Working label (e.g. the mentor figure)" style={{ ...input, flex: 1, minWidth: 200 }} />
          <button type="button" style={btn} onClick={() => {
            const made = addMapping(vault, mapSources, { workingLabel: mapLabel });
            if (!made.mapping) { say("Pick at least one source."); return; }
            persist(made.vault, `${made.mapping.id} created.`);
            setOpenMapId(made.mapping.id); setMapSources([]); setMapLabel("");
          }}>Create mapping</button>
        </div>

        {vault.mappings.map((m) => {
          const open = openMapId === m.id;
          const fictionalName = m.fiction ? labelFor(project, m.fiction) : (m.workingLabel || "(no fictional element yet)");
          const risk = RISK_LEVELS.find((r) => r.id === m.risk);
          return (
            <div key={m.id} style={{ border: "1px solid var(--line)", borderRadius: 12, padding: 12, marginTop: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span><span style={{ ...mono, color: "var(--gold)", fontWeight: 800 }}>{m.id}</span> → <strong>{fictionalName}</strong></span>
                <button type="button" style={{ ...btnQuiet, padding: "5px 10px", fontSize: 12.5 }} onClick={() => setOpenMapId(open ? "" : m.id)}>{open ? "Close" : "Open"}</button>
              </div>
              <p style={{ ...help, margin: "4px 0 0" }}>
                From {m.sourceIds.join(" + ")} · {risk?.label} · {APPROVAL_STATUSES.find((a) => a.id === m.approval)?.label}
                {m.lastReviewedAt ? ` · reviewed ${m.lastReviewedAt.slice(0, 10)}` : " · never reviewed"}
              </p>
              {open && (
                <div>
                  <div style={{ marginTop: 8 }}>
                    <span style={label}>Fictional element (by stable ID — rename-safe)</span>
                    <select value={fictionKey(m.fiction)} style={{ ...input, width: "auto" }}
                      onChange={(e) => {
                        const found = fictionOptions.find((o) => fictionKey(o.target) === e.target.value);
                        persist(setMappingFiction(vault, m.id, found ? found.target : null, project));
                      }}>
                      <option value="">Not in the story yet</option>
                      {fictionOptions.map((o) => <option key={fictionKey(o.target)} value={fictionKey(o.target)}>{o.label}</option>)}
                    </select>
                    {m.previousFictionalNames.length > 0 && (
                      <p style={{ ...help, margin: "4px 0 0" }}>Previously: {m.previousFictionalNames.join(", ")}</p>
                    )}
                  </div>

                  <div style={{ marginTop: 8 }}>
                    <span style={label}>Sources in this mapping</span>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {vault.sources.filter((s) => !s.archived || m.sourceIds.includes(s.id)).map((s) => {
                        const on = m.sourceIds.includes(s.id);
                        return (
                          <button key={s.id} type="button" style={chip(on)}
                            onClick={() => persist(updateMapping(vault, m.id, { sourceIds: on ? m.sourceIds.filter((x) => x !== s.id) : [...m.sourceIds, s.id] }, on ? `Removed ${s.id}` : `Added ${s.id}`))}>
                            {s.id}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {([
                    ["inspiredBy", "What reality inspired", "The true seed of this fictional element"],
                    ["invented", "What was invented", "Pure fiction added around the seed"],
                    ["removedDetails", "What was removed", "Identifying details deliberately left out"],
                    ["mergedFrom", "What was merged from other sources", "Composite ingredients"],
                    ["stillNeedsChange", "What still needs to change", "Open protection work"],
                    ["mustStayPrivate", "What must remain private", "Never sent anywhere, never published"],
                  ] as const).map(([field, title, placeholder]) => (
                    <div key={field} style={{ marginTop: 8 }}>
                      <span style={label}>{title}</span>
                      <textarea value={m[field]} onChange={(e) => persist(updateMapping(vault, m.id, { [field]: e.target.value }))}
                        placeholder={placeholder} style={{ ...input, minHeight: 40, resize: "vertical" }} />
                    </div>
                  ))}

                  <div style={{ marginTop: 8 }}>
                    <span style={label}>Deliberate changes — what, and why it protects or improves</span>
                    {m.changes.map((c) => (
                      <p key={c.id} style={{ ...help, margin: "0 0 3px" }}>• {c.what}{c.why ? ` — ${c.why}` : ""}</p>
                    ))}
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <input value={changeWhat} onChange={(e) => setChangeWhat(e.target.value)} placeholder="What changed (e.g. moved the city)" style={{ ...input, flex: 1, minWidth: 160 }} />
                      <input value={changeWhy} onChange={(e) => setChangeWhy(e.target.value)} placeholder="Why (protection or story)" style={{ ...input, flex: 1, minWidth: 160 }} />
                      <button type="button" style={btnQuiet} onClick={() => {
                        if (!changeWhat.trim()) { say("Say what changed."); return; }
                        persist(addMappingChange(vault, m.id, changeWhat, changeWhy), "Change recorded.");
                        setChangeWhat(""); setChangeWhy("");
                      }}>Record change</button>
                    </div>
                  </div>

                  <div style={{ marginTop: 8 }}>
                    <span style={label}>Fictional name suggestions — approving assigns nothing; renaming stays your act in the story room</span>
                    {m.nameSuggestions.map((s) => (
                      <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, padding: "4px 0", borderBottom: "1px solid var(--line)" }}>
                        <span style={{ fontSize: 12.5 }}>
                          <strong>{s.name}</strong>{s.notes ? ` — ${s.notes}` : ""} · {s.status}
                        </span>
                        {s.status === "proposed" && (
                          <span style={{ display: "flex", gap: 4 }}>
                            <button type="button" style={{ ...btnQuiet, padding: "3px 8px", fontSize: 11.5 }} onClick={() => persist(setSuggestionStatus(vault, m.id, s.id, "approved"), "Approved — rename in the story room when ready.")}>Approve</button>
                            <button type="button" style={{ ...btnQuiet, padding: "3px 8px", fontSize: 11.5 }} onClick={() => persist(setSuggestionStatus(vault, m.id, s.id, "rejected"))}>Reject</button>
                          </span>
                        )}
                      </div>
                    ))}
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
                      <input value={suggestName} onChange={(e) => setSuggestName(e.target.value)} placeholder="Proposed fictional name" style={{ ...input, flex: 1, minWidth: 140 }} />
                      <input value={suggestNotes} onChange={(e) => setSuggestNotes(e.target.value)} placeholder="Why it fits / audio clarity / risks" style={{ ...input, flex: 1, minWidth: 160 }} />
                      <button type="button" style={btnQuiet} onClick={() => {
                        if (!suggestName.trim()) { say("Enter the name."); return; }
                        persist(addNameSuggestion(vault, m.id, suggestName, suggestNotes), "Suggestion saved as proposed.");
                        setSuggestName(""); setSuggestNotes("");
                      }}>Suggest</button>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 8, alignItems: "flex-end" }}>
                    <div>
                      <span style={label}>Identification risk</span>
                      <select value={m.risk} onChange={(e) => persist(reviewMapping(vault, m.id, e.target.value as RiskLevel, m.approval))} style={{ ...input, width: "auto" }}>
                        {RISK_LEVELS.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <span style={label}>Owner approval</span>
                      <select value={m.approval} onChange={(e) => persist(reviewMapping(vault, m.id, m.risk, e.target.value as ApprovalStatus), "Review recorded.")} style={{ ...input, width: "auto" }}>
                        {APPROVAL_STATUSES.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
                      </select>
                    </div>
                  </div>

                  {historyBlock(m.history)}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Identity protection review */}
      <div style={card}>
        <p style={sectionTitle}>Identity Protection Review</p>
        <p style={help}>{LEAKAGE_DISCLAIMER}</p>
        <button type="button" style={btn} onClick={() => setReport(identityProtectionReport(vault, project))}>
          Run the private review
        </button>
        {report && (
          <div style={{ marginTop: 10 }}>
            <pre style={{ whiteSpace: "pre-wrap", fontSize: 12.5, lineHeight: 1.55, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 10, padding: "10px 12px", margin: 0 }}>{report}</pre>
            <button type="button" style={{ ...btnQuiet, marginTop: 8 }} onClick={async () => {
              try { await navigator.clipboard.writeText(report); say("Report copied — it is owner-only; don't paste it anywhere public."); }
              catch { say("Couldn't reach the clipboard — select and copy by hand."); }
            }}>Copy report (owner-only)</button>
          </div>
        )}
        {(() => {
          const live = leakageWarnings(vault, project);
          if (!report && live.length > 0) {
            return <p style={{ ...help, marginTop: 8 }}>⚠️ {live.length} mechanical finding{live.length === 1 ? "" : "s"} waiting — run the review.</p>;
          }
          return null;
        })()}
      </div>

      {/* AI-safe excerpt */}
      <div style={card}>
        <p style={sectionTitle}>Source context for your own AI — smallest safe excerpt</p>
        <p style={help}>
          Never send the legend to an AI. When a drafting task genuinely needs source context, this
          builds the smallest excerpt: source IDs, the fictional name, and your recorded changes.
          Real names are replaced with IDs; never-publish and must-stay-private fields are not included.
        </p>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {vault.mappings.map((m) => {
            const on = aiPicks.includes(m.id);
            return (
              <button key={m.id} type="button" style={chip(on)} onClick={() => { setAiPicks((cur) => (on ? cur.filter((x) => x !== m.id) : [...cur, m.id])); setAiPreview(""); }}>
                {m.id}
              </button>
            );
          })}
          {vault.mappings.length === 0 && <p style={{ ...help, margin: 0 }}>No mappings yet.</p>}
        </div>
        {aiPicks.length > 0 && !aiPreview && (
          <button type="button" style={{ ...btn, marginTop: 8 }} onClick={() => setAiPreview(aiSafeSourceContext(vault, aiPicks, project))}>
            Preview what would be sent
          </button>
        )}
        {aiPreview && (
          <div style={{ marginTop: 10 }}>
            <pre style={{ whiteSpace: "pre-wrap", fontSize: 12.5, lineHeight: 1.55, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 10, padding: "10px 12px", margin: 0 }}>{aiPreview}</pre>
            <p style={{ ...help, marginTop: 6 }}>{AI_SEND_WARNING}</p>
            <button type="button" style={{ ...btnQuiet, marginTop: 4 }} onClick={async () => {
              try { await navigator.clipboard.writeText(aiPreview); say("Excerpt copied — you reviewed it; you decide where it goes."); }
              catch { say("Couldn't reach the clipboard — select and copy by hand."); }
            }}>Copy excerpt</button>
          </div>
        )}
      </div>

      {/* Backups */}
      <div style={card}>
        <p style={sectionTitle}>Two backups, deliberately separate</p>
        <p style={help}>
          <strong>Creative project backup</strong> — the Export backup button in the workspace. Safe for
          ordinary manuscript recovery; it never includes this legend.{" "}
          <strong>Owner vault backup</strong> — the export below. It contains the real identities behind
          the fiction. Keep both if you want complete disaster recovery; store this one like a private journal.
        </p>
        {confirmExport ? (
          <div style={{ borderLeft: "4px solid var(--gold)", paddingLeft: 10 }}>
            <p style={help}>{VAULT_EXPORT_NOTICE}</p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button type="button" style={btn} onClick={doVaultExport}>I understand — export the vault</button>
              <button type="button" style={btnQuiet} onClick={() => setConfirmExport(false)}>Cancel</button>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button type="button" style={btn} onClick={() => setConfirmExport(true)}>Export owner vault backup…</button>
            <label style={{ ...btnQuiet, display: "inline-block" }}>
              Import vault backup
              <input type="file" accept=".json,application/json" style={{ display: "none" }}
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  e.target.value = "";
                  if (!f) return;
                  const result = parseVaultImport(await f.text());
                  if (!result.ok) { say(result.error); return; }
                  const incoming = { ...result.vault, projectId: project.id };
                  if (vault.sources.length === 0 && vault.mappings.length === 0) { persist(incoming, "Vault imported."); return; }
                  setPendingImport(incoming);
                }} />
            </label>
          </div>
        )}
        <p style={{ ...help, margin: "8px 0 0" }}>
          Last vault export: {vault.lastExportAt ? vault.lastExportAt.slice(0, 10) : "never"} ·
          {" "}{vault.sources.length} sources · {vault.mappings.length} mappings
        </p>
        {pendingImport && (
          <div style={{ borderLeft: "4px solid var(--gold)", paddingLeft: 10, marginTop: 8 }}>
            <p style={help}>
              Importing replaces the current legend ({vault.sources.length} sources, {vault.mappings.length} mappings)
              with the file ({pendingImport.sources.length} sources, {pendingImport.mappings.length} mappings).
              This cannot be undone unless you exported the current vault.
            </p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button type="button" style={btn} onClick={() => { persist(pendingImport, "Vault replaced from backup."); setPendingImport(null); }}>Replace it</button>
              <button type="button" style={btnQuiet} onClick={() => setPendingImport(null)}>Keep current</button>
            </div>
          </div>
        )}
      </div>

      {/* Owner checklist */}
      <div style={card}>
        <p style={sectionTitle}>Combination-risk checklist</p>
        <p style={help}>Details that can identify someone even after every name changes — walk this per mapping before publication:</p>
        {IDENTITY_RISK_CHECKLIST.map((c) => <p key={c} style={{ ...help, margin: "0 0 3px" }}>• {c}</p>)}
      </div>
    </div>
  );
}
