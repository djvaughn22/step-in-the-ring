"use client";

// Minimal owner tester-code panel over the existing /api/owner/tester-codes
// API. The raw code appears exactly once, at creation, and is never shown or
// retrievable again — the list below carries administrative metadata only.

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

interface CodeMeta {
  id: string;
  label: string;
  maxRedemptions: number;
  redemptions: number;
  expiresAt: string;
  revokedAt: string | null;
  createdAt: string;
}

const card = { background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 16, padding: 18 } as const;
const input = {
  width: "100%", boxSizing: "border-box", background: "var(--bg)", color: "var(--ink)",
  border: "1px solid var(--line)", borderRadius: 10, padding: "9px 12px", fontSize: 14, marginBottom: 10,
} as const;
const btn = {
  background: "var(--gold)", color: "#111", border: "none", borderRadius: 10,
  padding: "9px 14px", fontSize: 13, fontWeight: 800, cursor: "pointer",
} as const;

export default function TesterCodesPanel() {
  const [codes, setCodes] = useState<CodeMeta[] | null>(null);
  const [label, setLabel] = useState("");
  const [days, setDays] = useState("14");
  const [maxRedemptions, setMaxRedemptions] = useState("1");
  const [freshCode, setFreshCode] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const [now, setNow] = useState(0);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/owner/tester-codes");
    const data = await res.json();
    return { codes: (data.ok ? data.codes : []) as CodeMeta[], at: Date.now() };
  }, []);

  useEffect(() => {
    refresh()
      .then(({ codes: list, at }) => {
        setCodes(list);
        setNow(at);
      })
      .catch(() => setCodes([]));
  }, [refresh]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setMessage("");
    setFreshCode(null);
    try {
      const res = await fetch("/api/owner/tester-codes", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          label: label.trim(),
          expiresInDays: Number(days) || 14,
          maxRedemptions: Number(maxRedemptions) || 1,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setFreshCode(data.code);
        setLabel("");
        const r = await refresh();
        setCodes(r.codes);
        setNow(r.at);
      } else {
        setMessage(data.error || "Could not create the code.");
      }
    } catch {
      setMessage("Could not create the code.");
    }
    setBusy(false);
  };

  const revoke = async (id: string) => {
    if (busy) return;
    setBusy(true);
    setMessage("");
    try {
      await fetch(`/api/owner/tester-codes?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      await refresh();
    } catch {
      setMessage("Could not revoke the code.");
    }
    setBusy(false);
  };

  return (
    <main style={{ maxWidth: 560, margin: "0 auto", padding: "40px 18px 64px" }}>
      <p style={{ fontSize: 12, fontWeight: 900, color: "var(--gold)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 6px" }}>
        Private
      </p>
      <h1 style={{ fontSize: 22, fontWeight: 900, margin: "0 0 6px" }}>Tester codes</h1>
      <p style={{ fontSize: 13.5, color: "var(--muted)", lineHeight: 1.55, margin: "0 0 18px" }}>
        Each code grants temporary tester membership. The code is shown once,
        right here, when you create it — copy it then, because it is stored
        only as a hash and can never be shown again.
      </p>

      <form onSubmit={create} style={{ ...card, marginBottom: 16 }}>
        <label style={{ fontSize: 12, fontWeight: 800, color: "var(--muted)" }}>Label (who it&apos;s for)</label>
        <input style={input} value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. First outside tester" />
        <label style={{ fontSize: 12, fontWeight: 800, color: "var(--muted)" }}>Expires in (days, 1–90)</label>
        <input style={input} value={days} onChange={(e) => setDays(e.target.value)} inputMode="numeric" />
        <label style={{ fontSize: 12, fontWeight: 800, color: "var(--muted)" }}>Max redemptions</label>
        <input style={input} value={maxRedemptions} onChange={(e) => setMaxRedemptions(e.target.value)} inputMode="numeric" />
        <button style={btn} disabled={busy}>{busy ? "Working…" : "Generate code"}</button>
      </form>

      {freshCode && (
        <div style={{ ...card, marginBottom: 16, borderColor: "var(--gold)" }}>
          <p style={{ fontSize: 12, fontWeight: 900, color: "var(--gold)", margin: "0 0 6px" }}>
            Copy this now — it will never be shown again
          </p>
          <p data-testid="fresh-code" style={{ fontSize: 18, fontWeight: 900, letterSpacing: "0.04em", margin: 0, userSelect: "all" }}>
            {freshCode}
          </p>
        </div>
      )}

      {message && (
        <p role="alert" style={{ fontSize: 13, fontWeight: 800, color: "#fca5a5", margin: "0 0 12px" }}>{message}</p>
      )}

      <div style={{ display: "grid", gap: 10 }}>
        {codes === null && <p style={{ fontSize: 13, color: "var(--muted)" }}>Loading…</p>}
        {codes?.length === 0 && <p style={{ fontSize: 13, color: "var(--muted)" }}>No codes yet.</p>}
        {codes?.map((c) => {
          const expired = now > 0 && new Date(c.expiresAt).getTime() <= now;
          const status = c.revokedAt ? "revoked" : expired ? "expired" : "active";
          return (
            <div key={c.id} style={card}>
              <p style={{ fontSize: 14, fontWeight: 900, margin: "0 0 4px" }}>
                {c.label || "(no label)"}{" "}
                <span style={{ fontSize: 11, fontWeight: 800, color: status === "active" ? "var(--gold)" : "var(--muted)", textTransform: "uppercase" }}>
                  {status}
                </span>
              </p>
              <p style={{ fontSize: 12, color: "var(--muted)", margin: "0 0 8px", lineHeight: 1.5 }}>
                {c.redemptions}/{c.maxRedemptions} redeemed · expires {new Date(c.expiresAt).toLocaleDateString()}
              </p>
              {status === "active" && (
                <button
                  type="button"
                  onClick={() => revoke(c.id)}
                  disabled={busy}
                  style={{ background: "transparent", color: "var(--muted)", border: "1px solid var(--line)", borderRadius: 10, padding: "6px 12px", fontSize: 12, fontWeight: 800, cursor: "pointer" }}
                >
                  Revoke
                </button>
              )}
            </div>
          );
        })}
      </div>

      <p style={{ fontSize: 12, marginTop: 20 }}>
        <Link href="/owner" style={{ color: "var(--gold)", fontWeight: 800 }}>← Owner hub</Link>
      </p>
    </main>
  );
}
