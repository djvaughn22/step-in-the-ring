"use client";

// The private owner hub — shown only after the server-side session check in
// page.tsx passes. Lists the protected creation rooms; names and links only,
// no project data. Logout clears the shared cookie, which ends access to
// every private room at once.

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const ROOMS = [
  { href: "/author", emoji: "📖", name: "Author's Room", what: "Story Partner — the private writing room." },
  { href: "/engines", emoji: "🎛️", name: "Engine Room", what: "Idea, Build, Sell, Design Shop, Game, How-to and Music studios, plus saved engine projects." },
  { href: "/projects", emoji: "🗂️", name: "Project OS", what: "Project records: scope, evidence, lifecycle, next actions." },
];

const card = { background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 16, padding: 18 } as const;

export default function OwnerHub() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const logout = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await fetch("/api/author/logout", { method: "POST" });
    } catch {
      // the cookie expires on its own; refresh shows the true state either way
    }
    router.refresh();
  };

  return (
    <main style={{ maxWidth: 560, margin: "0 auto", padding: "40px 18px 64px" }}>
      <p style={{ fontSize: 12, fontWeight: 900, color: "var(--gold)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 6px" }}>
        Private
      </p>
      <h1 style={{ fontSize: 22, fontWeight: 900, margin: "0 0 6px" }}>Owner hub</h1>
      <p style={{ fontSize: 13.5, color: "var(--muted)", lineHeight: 1.55, margin: "0 0 18px" }}>
        You&apos;re signed in. One session covers every room below; logging out closes them all.
      </p>
      <div style={{ display: "grid", gap: 12 }}>
        {ROOMS.map((r) => (
          <Link key={r.href} href={r.href} style={{ ...card, display: "block", textDecoration: "none", color: "inherit" }}>
            <p style={{ fontSize: 16, fontWeight: 900, margin: "0 0 4px" }}>{r.emoji} {r.name} →</p>
            <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.5, margin: 0 }}>{r.what}</p>
          </Link>
        ))}
      </div>
      <button
        type="button"
        onClick={logout}
        disabled={busy}
        style={{
          marginTop: 20, background: "transparent", color: "var(--muted)", border: "1px solid var(--line)",
          borderRadius: 10, padding: "9px 14px", fontSize: 13, fontWeight: 800, cursor: "pointer", opacity: busy ? 0.6 : 1,
        }}
      >
        {busy ? "Signing out…" : "🔒 Sign out everywhere"}
      </button>
    </main>
  );
}
