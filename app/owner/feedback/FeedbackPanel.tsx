"use client";

// Owner triage panel over /api/owner/feedback. Every submission, newest
// first; mark reviewed to clear it from the top without deleting it.

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

interface FeedbackItem {
  id: string;
  userId: string;
  category: "bug" | "confusing" | "idea" | "other";
  message: string;
  contextUrl: string;
  status: "new" | "reviewed";
  createdAt: string;
}

const CATEGORY_LABEL: Record<FeedbackItem["category"], string> = {
  bug: "Something broke",
  confusing: "Something was confusing",
  idea: "An idea",
  other: "Other",
};

const card = { background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 16, padding: 18 } as const;

export default function FeedbackPanel() {
  const [items, setItems] = useState<FeedbackItem[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [showReviewed, setShowReviewed] = useState(false);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/owner/feedback");
    const data = await res.json();
    return (data.ok ? data.feedback : []) as FeedbackItem[];
  }, []);

  useEffect(() => {
    refresh().then(setItems).catch(() => setItems([]));
  }, [refresh]);

  const setStatus = async (id: string, status: FeedbackItem["status"]) => {
    if (busyId) return;
    setBusyId(id);
    setMessage("");
    try {
      await fetch("/api/owner/feedback", {
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
    <main style={{ maxWidth: 640, margin: "0 auto", padding: "40px 18px 64px" }}>
      <p style={{ fontSize: 12, fontWeight: 900, color: "var(--gold)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 6px" }}>
        Private
      </p>
      <h1 style={{ fontSize: 22, fontWeight: 900, margin: "0 0 6px" }}>Tester feedback</h1>
      <p style={{ fontSize: 13.5, color: "var(--muted)", lineHeight: 1.55, margin: "0 0 14px" }}>
        Every submission from every signed-in account, newest first. Mark an
        item reviewed once you have read it — nothing is ever deleted here.
      </p>

      <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--muted)", marginBottom: 16 }}>
        <input type="checkbox" checked={showReviewed} onChange={(e) => setShowReviewed(e.target.checked)} />
        Show reviewed items too
      </label>

      {message && (
        <p role="alert" style={{ fontSize: 13, fontWeight: 800, color: "#fca5a5", margin: "0 0 12px" }}>{message}</p>
      )}

      <div style={{ display: "grid", gap: 10 }}>
        {items === null && <p style={{ fontSize: 13, color: "var(--muted)" }}>Loading…</p>}
        {items !== null && visible.length === 0 && (
          <p style={{ fontSize: 13, color: "var(--muted)" }}>
            {showReviewed ? "No feedback yet." : "Nothing new — everything has been reviewed."}
          </p>
        )}
        {visible.map((f) => (
          <div key={f.id} style={card}>
            <p style={{ fontSize: 14, fontWeight: 900, margin: "0 0 4px" }}>
              {CATEGORY_LABEL[f.category]}{" "}
              <span style={{ fontSize: 11, fontWeight: 800, color: f.status === "new" ? "var(--gold)" : "var(--muted)", textTransform: "uppercase" }}>
                {f.status}
              </span>
            </p>
            <p style={{ fontSize: 14, color: "var(--ink, var(--text))", margin: "0 0 8px", lineHeight: 1.55, whiteSpace: "pre-wrap" }}>
              {f.message}
            </p>
            <p style={{ fontSize: 12, color: "var(--muted)", margin: "0 0 10px", lineHeight: 1.5 }}>
              {new Date(f.createdAt).toLocaleString()}
              {f.contextUrl ? ` · from ${f.contextUrl}` : ""}
            </p>
            <button
              type="button"
              onClick={() => setStatus(f.id, f.status === "new" ? "reviewed" : "new")}
              disabled={busyId === f.id}
              style={{ background: "transparent", color: "var(--muted)", border: "1px solid var(--line)", borderRadius: 10, padding: "6px 12px", fontSize: 12, fontWeight: 800, cursor: "pointer" }}
            >
              {f.status === "new" ? "Mark reviewed" : "Mark new"}
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
