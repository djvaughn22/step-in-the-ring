"use client";

// Owner triage panel over /api/owner/sprint-applications. Every application
// to the paid Five Hour Sprint service, newest first — mirrors
// app/owner/feedback/FeedbackPanel.tsx.

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

interface SprintApplicationItem {
  id: string;
  name: string;
  email: string;
  whatToFinish: string;
  successLooksLike: string;
  timing: "asap" | "this-month" | "exploring";
  teamSize: "individual" | "team";
  marketingConsent: boolean;
  status: "new" | "reviewed";
  createdAt: string;
}

const TIMING_LABEL: Record<SprintApplicationItem["timing"], string> = {
  asap: "As soon as possible",
  "this-month": "Sometime this month",
  exploring: "Just exploring",
};

const card = { background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 16, padding: 18 } as const;

export default function SprintApplicationsPanel() {
  const [items, setItems] = useState<SprintApplicationItem[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [showReviewed, setShowReviewed] = useState(false);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/owner/sprint-applications");
    const data = await res.json();
    return (data.ok ? data.applications : []) as SprintApplicationItem[];
  }, []);

  useEffect(() => {
    refresh().then(setItems).catch(() => setItems([]));
  }, [refresh]);

  const setStatus = async (id: string, status: SprintApplicationItem["status"]) => {
    if (busyId) return;
    setBusyId(id);
    setMessage("");
    try {
      await fetch("/api/owner/sprint-applications", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      setItems(await refresh());
    } catch {
      setMessage("Could not update that item.");
    }
    setBusyId(null);
  };

  const visible = (items ?? []).filter((i) => showReviewed || i.status === "new");

  return (
    <main style={{ maxWidth: 680, margin: "0 auto", padding: "40px 18px 64px" }}>
      <p style={{ fontSize: 12, fontWeight: 900, color: "var(--gold)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 6px" }}>
        Private
      </p>
      <h1 style={{ fontSize: 22, fontWeight: 900, margin: "0 0 6px" }}>Five Hour Sprint applications</h1>
      <p style={{ fontSize: 13.5, color: "var(--muted)", lineHeight: 1.55, margin: "0 0 14px" }}>
        Every application to the paid Sprint service, newest first. Mark one
        reviewed once you have followed up — nothing is ever deleted here.
      </p>

      <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--muted)", marginBottom: 16 }}>
        <input type="checkbox" checked={showReviewed} onChange={(e) => setShowReviewed(e.target.checked)} />
        Show reviewed applications too
      </label>

      {message && (
        <p role="alert" style={{ fontSize: 13, fontWeight: 800, color: "#fca5a5", margin: "0 0 12px" }}>{message}</p>
      )}

      <div style={{ display: "grid", gap: 10 }}>
        {items === null && <p style={{ fontSize: 13, color: "var(--muted)" }}>Loading…</p>}
        {items !== null && visible.length === 0 && (
          <p style={{ fontSize: 13, color: "var(--muted)" }}>
            {showReviewed ? "No applications yet." : "Nothing new — everything has been reviewed."}
          </p>
        )}
        {visible.map((a) => (
          <div key={a.id} style={card}>
            <p style={{ fontSize: 14, fontWeight: 900, margin: "0 0 4px" }}>
              {a.name}{" "}
              <span style={{ fontSize: 11, fontWeight: 800, color: a.status === "new" ? "var(--gold)" : "var(--muted)", textTransform: "uppercase" }}>
                {a.status}
              </span>
            </p>
            <p style={{ fontSize: 13, color: "var(--muted)", margin: "0 0 8px" }}>
              <a href={`mailto:${a.email}`} style={{ color: "var(--muted)" }}>{a.email}</a>
              {" · "}{TIMING_LABEL[a.timing]}{" · "}{a.teamSize === "team" ? "Team" : "Individual"}
              {a.marketingConsent ? " · OK to email updates" : ""}
            </p>
            <p style={{ fontSize: 12, fontWeight: 800, color: "var(--muted)", margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Wants to finish
            </p>
            <p style={{ fontSize: 14, color: "var(--ink, var(--text))", margin: "0 0 8px", lineHeight: 1.55, whiteSpace: "pre-wrap" }}>
              {a.whatToFinish}
            </p>
            <p style={{ fontSize: 12, fontWeight: 800, color: "var(--muted)", margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Success looks like
            </p>
            <p style={{ fontSize: 14, color: "var(--ink, var(--text))", margin: "0 0 8px", lineHeight: 1.55, whiteSpace: "pre-wrap" }}>
              {a.successLooksLike}
            </p>
            <p style={{ fontSize: 12, color: "var(--muted)", margin: "0 0 10px", lineHeight: 1.5 }}>
              {new Date(a.createdAt).toLocaleString()}
            </p>
            <button
              type="button"
              onClick={() => setStatus(a.id, a.status === "new" ? "reviewed" : "new")}
              disabled={busyId === a.id}
              style={{ background: "transparent", color: "var(--muted)", border: "1px solid var(--line)", borderRadius: 10, padding: "6px 12px", fontSize: 12, fontWeight: 800, cursor: "pointer" }}
            >
              {a.status === "new" ? "Mark reviewed" : "Mark new"}
            </button>
          </div>
        ))}
      </div>

      <p style={{ fontSize: 12, marginTop: 20 }}>
        <Link href="/owner" style={{ color: "var(--gold)", fontWeight: 800 }}>← Owner hub</Link>
      </p>
    </main>
  );
}
