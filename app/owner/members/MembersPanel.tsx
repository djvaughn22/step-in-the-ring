"use client";

import { useEffect, useState } from "react";
import type { MemberStore } from "../../members/store";

interface Member {
  userId: string;
  email: string;
  createdAt: string;
  status: string;
}

export default function MembersPanel({ store }: { store: MemberStore }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actioning, setActioning] = useState<string | null>(null);

  useEffect(() => {
    loadMembers();
  }, []);

  async function loadMembers() {
    try {
      const res = await fetch("/api/owner/members");
      const data = await res.json();
      if (data.ok) {
        setMembers(data.members);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError("Failed to load members");
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(userId: string) {
    setActioning(userId);
    try {
      const res = await fetch(`/api/owner/members/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      });
      if (res.ok) {
        await loadMembers();
      } else {
        setError("Failed to approve member");
      }
    } catch (err) {
      setError("Network error");
    } finally {
      setActioning(null);
    }
  }

  async function handleRevoke(userId: string) {
    if (!confirm("Revoke access for this member?")) return;
    setActioning(userId);
    try {
      const res = await fetch(`/api/owner/members/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "revoke" }),
      });
      if (res.ok) {
        await loadMembers();
      } else {
        setError("Failed to revoke member");
      }
    } catch (err) {
      setError("Network error");
    } finally {
      setActioning(null);
    }
  }

  return (
    <main>
      <div className="page">
        <div className="topbar">
          <span className="topbar-title">Manage Members</span>
          <a href="/owner" className="btn btn-ghost btn-small" style={{ textDecoration: "none" }}>
            Back
          </a>
        </div>

        {error && <div style={{ color: "var(--error)", marginBottom: 16 }}>{error}</div>}

        {loading ? (
          <div style={{ textAlign: "center", padding: 40 }}>
            <p>Loading members…</p>
          </div>
        ) : members.length === 0 ? (
          <div className="card" style={{ textAlign: "center", padding: 40 }}>
            <p>No members yet.</p>
          </div>
        ) : (
          <div className="stack">
            <div style={{ fontSize: 14, color: "var(--muted)" }}>
              {members.length} account{members.length === 1 ? "" : "s"}
            </div>
            {members.map((m) => (
              <div key={m.userId} className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>{m.email}</div>
                  <div style={{ fontSize: 13, color: "var(--muted)" }}>
                    {new Date(m.createdAt).toLocaleDateString()}
                    {" · "}
                    <span style={{
                      display: "inline-block",
                      padding: "2px 8px",
                      borderRadius: 4,
                      fontSize: 12,
                      fontWeight: 600,
                      backgroundColor: m.status === "pending" ? "var(--gold)" : m.status === "active" ? "var(--success)" : "var(--error)",
                      color: m.status === "pending" ? "var(--text)" : "white",
                    }}>
                      {m.status}
                    </span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                  {m.status === "pending" && (
                    <button
                      className="btn btn-small"
                      onClick={() => handleApprove(m.userId)}
                      disabled={actioning === m.userId}
                      style={{
                        background: "var(--success)",
                        color: "white",
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      {actioning === m.userId ? "…" : "Approve"}
                    </button>
                  )}
                  {m.status !== "revoked" && (
                    <button
                      className="btn btn-small"
                      onClick={() => handleRevoke(m.userId)}
                      disabled={actioning === m.userId}
                      style={{
                        background: "var(--error)",
                        color: "white",
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      {actioning === m.userId ? "…" : "Revoke"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
