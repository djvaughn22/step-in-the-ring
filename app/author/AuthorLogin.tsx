"use client";

// Login shell for the Author's Room. Contains no private data. The password
// goes in a POST body over HTTPS, is verified server-side, and is never
// stored anywhere in this browser.

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AuthorLogin({ configured }: { configured: boolean }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!password || busy) return;
    setBusy(true);
    setMessage("");
    try {
      const res = await fetch("/api/author/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        setPassword("");
        router.refresh();
        return;
      }
      setMessage(res.status === 429 ? "Too many attempts — wait a minute." : "That didn't work.");
    } catch {
      setMessage("Couldn't reach the server. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main style={{ maxWidth: 420, margin: "0 auto", padding: "48px 18px" }}>
      <div style={{ background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 16, padding: 22 }}>
        <p style={{ fontSize: 12, fontWeight: 900, color: "var(--gold)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 6px" }}>
          Private
        </p>
        <h1 style={{ fontSize: 20, fontWeight: 900, margin: "0 0 8px" }}>Author&apos;s Room</h1>
        {configured ? (
          <>
            <p style={{ fontSize: 13.5, color: "var(--muted)", lineHeight: 1.55, margin: "0 0 14px" }}>
              This room is for its owner. Enter the password to continue.
            </p>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
              autoComplete="current-password"
              aria-label="Password"
              style={{
                width: "100%", boxSizing: "border-box", background: "var(--surface)", color: "inherit",
                border: "1px solid var(--line)", borderRadius: 10, padding: "10px 12px", fontSize: 15,
              }}
            />
            <button
              type="button"
              onClick={submit}
              disabled={busy}
              style={{
                marginTop: 10, background: "var(--gold)", color: "#111", border: "none", borderRadius: 10,
                padding: "10px 16px", fontSize: 14, fontWeight: 800, cursor: "pointer", opacity: busy ? 0.6 : 1,
              }}
            >
              {busy ? "Checking…" : "Enter"}
            </button>
          </>
        ) : (
          <p style={{ fontSize: 13.5, color: "var(--muted)", lineHeight: 1.55, margin: 0 }}>
            The room isn&apos;t configured on this deployment yet.
          </p>
        )}
        <p role="status" aria-live="polite" style={{ color: "var(--gold)", fontWeight: 800, minHeight: 20, fontSize: 13, margin: "10px 0 0" }}>
          {message}
        </p>
      </div>
    </main>
  );
}
