"use client";

// Account workspace: membership status, billing portal, saved projects
// (reopen/export/delete), user-triggered import of browser-local Engine Room
// projects, logout, and account deletion request. The server owns every
// authorization decision — this component only calls and mirrors.

import { useCallback, useEffect, useState } from "react";

type ProjectSummary = {
  id: string;
  title: string;
  engineId: string;
  createdAt: string;
  updatedAt: string;
};

const BOX: React.CSSProperties = {
  border: "1px solid rgba(148,163,184,0.25)",
  borderRadius: 14,
  padding: "16px",
  marginBottom: 16,
};

export default function AccountClient(props: {
  membershipStatus: string;
  memberAccess: boolean;
  activeUntil: string | null;
  billingLive: boolean;
}) {
  const [projects, setProjects] = useState<ProjectSummary[] | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const loadProjects = useCallback(() => setReloadKey((k) => k + 1), []);

  // Subscribe to the server's project list; state changes only in callbacks.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/members/projects")
      .then((res) => res.json().catch(() => null))
      .then((data: { ok?: boolean; projects?: ProjectSummary[] } | null) => {
        if (!cancelled) setProjects(data?.ok && data.projects ? data.projects : []);
      })
      .catch(() => {
        if (!cancelled) setProjects([]);
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  async function portal() {
    setBusy(true);
    const res = await fetch("/api/members/portal", { method: "POST" });
    const data = (await res.json().catch(() => null)) as { ok?: boolean; url?: string; error?: string } | null;
    setBusy(false);
    if (data?.ok && data.url) window.location.href = data.url;
    else setMessage(data?.error ?? "The billing portal is not available.");
  }

  async function logout() {
    await fetch("/api/members/logout", { method: "POST" });
    window.location.href = "/membership";
  }

  async function requestDeletion() {
    const sure = window.confirm(
      "Request account deletion? Your sessions end now and data is removed under the published retention policy.",
    );
    if (!sure) return;
    await fetch("/api/members/delete-request", { method: "POST" });
    window.location.href = "/membership";
  }

  async function removeProject(id: string) {
    if (!window.confirm("Delete this project? This cannot be undone.")) return;
    await fetch(`/api/members/projects/${id}`, { method: "DELETE" });
    loadProjects();
  }

  // User-triggered import of the browser-local Engine Room projects.
  async function importLocal() {
    setMessage(null);
    // Engine work lives in two local stores: the Engine Room shell
    // ("sitr-engine-projects-v1") and the creation studios like Idea and
    // Design Shop ("creation-engine-projects-v1"). Import both.
    let local: unknown[] = [];
    for (const key of ["sitr-engine-projects-v1", "creation-engine-projects-v1"]) {
      try {
        const raw = window.localStorage.getItem(key);
        const parsed = raw ? (JSON.parse(raw) as { projects?: unknown[] }) : null;
        if (Array.isArray(parsed?.projects)) local = local.concat(parsed.projects);
      } catch {
        // an unreadable store contributes nothing
      }
    }
    if (local.length === 0) {
      setMessage("No local Engine Room projects were found in this browser.");
      return;
    }
    const sure = window.confirm(
      `Import ${local.length} project(s) saved in this browser into your account? Nothing is uploaded without this confirmation.`,
    );
    if (!sure) return;
    setBusy(true);
    const items = local.map((p) => {
      const item = (typeof p === "object" && p !== null ? p : {}) as Record<string, unknown>;
      return { title: item.name, engineId: item.engineId, content: JSON.stringify(item) };
    });
    const res = await fetch("/api/members/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ import: items }),
    });
    const data = (await res.json().catch(() => null)) as { ok?: boolean; imported?: number; skipped?: number; error?: string } | null;
    setBusy(false);
    if (data?.ok) {
      setMessage(`Imported ${data.imported} project(s)${data.skipped ? `, skipped ${data.skipped}` : ""}.`);
      loadProjects();
    } else {
      setMessage(data?.error ?? "Import failed.");
    }
  }

  return (
    <>
      <div style={BOX}>
        <p style={{ fontSize: 14, fontWeight: 900, margin: "0 0 6px", color: "var(--ink, #e8edf5)" }}>Membership</p>
        <p style={{ fontSize: 13, color: "var(--muted, #94a3b8)", margin: "0 0 12px" }}>
          Status: <strong>{props.membershipStatus}</strong>
          {props.activeUntil ? ` · access through ${new Date(props.activeUntil).toLocaleDateString()}` : ""}
        </p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {props.memberAccess && (
            <a href="/engines" className="btn btn-primary">Enter the Engine Room</a>
          )}
          {props.billingLive && (
            <button type="button" className="btn btn-ghost" onClick={portal} disabled={busy}>
              Billing portal
            </button>
          )}
          {!props.memberAccess && (
            <a href="/membership" className="btn btn-ghost">See membership</a>
          )}
        </div>
        {!props.billingLive && (
          <p style={{ fontSize: 12, color: "var(--muted, #94a3b8)", margin: "10px 0 0", lineHeight: 1.6 }}>
            Billing is not live yet (private beta), so there is no billing
            portal to open. Cancellation, when billing exists, happens there —
            and canceling never disables a computer or this account.
          </p>
        )}
      </div>

      <div style={BOX}>
        <p style={{ fontSize: 14, fontWeight: 900, margin: "0 0 6px", color: "var(--ink, #e8edf5)" }}>Your projects</p>
        {projects === null ? (
          <p style={{ fontSize: 13, color: "var(--muted, #94a3b8)" }}>Loading…</p>
        ) : projects.length === 0 ? (
          <p style={{ fontSize: 13, color: "var(--muted, #94a3b8)", lineHeight: 1.6 }}>
            No saved projects yet. Projects you save from the Engine Room live
            here — and you can import work saved in this browser below.
          </p>
        ) : (
          <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
            {projects.map((p) => (
              <li
                key={p.id}
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, borderTop: "1px solid rgba(148,163,184,0.15)", padding: "10px 0" }}
              >
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: 14, fontWeight: 800, color: "var(--ink, #e8edf5)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {p.title}
                  </span>
                  <span style={{ fontSize: 11, color: "var(--muted, #94a3b8)" }}>
                    {p.engineId} · updated {new Date(p.updatedAt).toLocaleDateString()}
                  </span>
                </span>
                <span style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                  <a className="btn btn-ghost btn-small" href={`/api/members/projects/${p.id}/export`}>
                    Export
                  </a>
                  <button type="button" className="btn btn-ghost btn-small" onClick={() => removeProject(p.id)}>
                    Delete
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
        <button type="button" className="btn btn-ghost btn-small" style={{ marginTop: 12 }} onClick={importLocal} disabled={busy}>
          Import projects saved in this browser
        </button>
      </div>

      {message && (
        <p role="status" style={{ fontSize: 13, fontWeight: 800, color: "var(--gold, #f59e0b)", margin: "0 0 12px" }}>
          {message}
        </p>
      )}

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button type="button" className="btn btn-ghost" onClick={logout}>Sign out</button>
        <button
          type="button"
          onClick={requestDeletion}
          style={{ background: "none", border: "1px solid rgba(252,165,165,0.4)", borderRadius: 999, padding: "10px 18px", fontSize: 13, fontWeight: 800, color: "#fca5a5", cursor: "pointer" }}
        >
          Request account deletion
        </button>
      </div>
    </>
  );
}
