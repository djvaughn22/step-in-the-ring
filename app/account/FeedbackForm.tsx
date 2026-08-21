"use client";

// Structured tester feedback — journey step 7. Any signed-in account can
// leave a categorized note about what they hit. No rating scale, no reply
// thread: just a category, a message, and where they were when it happened.

import { useState } from "react";

const BOX: React.CSSProperties = {
  border: "1px solid rgba(148,163,184,0.25)",
  borderRadius: 6,
  padding: "16px",
  marginBottom: 16,
};

const INPUT: React.CSSProperties = {
  width: "100%",
  background: "rgba(148,163,184,0.08)",
  border: "1px solid rgba(148,163,184,0.3)",
  borderRadius: 10,
  padding: "10px 12px",
  fontSize: 14,
  color: "var(--text)",
  marginBottom: 10,
};

const CATEGORIES: { value: string; label: string }[] = [
  { value: "bug", label: "Something broke" },
  { value: "confusing", label: "Something was confusing" },
  { value: "idea", label: "An idea for the beta" },
  { value: "other", label: "Something else" },
];

export default function FeedbackForm() {
  const [category, setCategory] = useState("bug");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setResult(null);
    const res = await fetch("/api/members/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category,
        message,
        contextUrl: typeof window !== "undefined" ? window.location.pathname + window.location.search : "",
      }),
    });
    const data = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
    setBusy(false);
    if (data?.ok) {
      setMessage("");
      setResult({ ok: true, text: "Thanks — the owner reads every one of these." });
    } else {
      setResult({ ok: false, text: data?.error ?? "Feedback didn't send. Try again." });
    }
  }

  return (
    <div id="feedback" style={BOX}>
      <p style={{ fontSize: 14, fontWeight: 900, margin: "0 0 6px", color: "var(--text)" }}>
        Give feedback on the beta
      </p>
      <p style={{ fontSize: 13, color: "var(--muted)", margin: "0 0 12px", lineHeight: 1.6 }}>
        Hit something broken, confusing, or worth building? Say it here — it goes straight to the
        owner, not a queue.
      </p>
      <form onSubmit={submit}>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          style={INPUT}
          aria-label="Feedback category"
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          maxLength={2000}
          style={{ ...INPUT, resize: "vertical" }}
          placeholder="What happened, or what you'd want instead…"
          required
        />
        <button type="submit" className="btn btn-ghost" disabled={busy || !message.trim()}>
          {busy ? "Sending…" : "Send feedback"}
        </button>
      </form>
      {result && (
        <p role="status" style={{ fontSize: 13, fontWeight: 800, margin: "10px 0 0", color: result.ok ? "#34D399" : "#fca5a5" }}>
          {result.text}
        </p>
      )}
    </div>
  );
}
