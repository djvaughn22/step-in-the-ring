"use client";

// Admin controls: seed/reset the demo store, export what's stored, and the
// single honest place that documents implemented vs. mocked behavior — see
// docs/DIGITAL_FRONT_DESK_UAT.md for the same list in full.

import { useEffect, useState } from "react";
import Link from "next/link";
import { STAGE_LABEL, PIPELINE_STAGES } from "../lib/types";
import { card, btnPrimary, btnQuiet } from "../lib/ui";

interface Stats {
  requestCount: number;
  onboardingCount: number;
  byStage: Record<string, number>;
}

export default function AdminClient() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/uat/digital-front-desk/admin")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data.ok) setStats(data.stats);
      })
      .catch(() => {
        // stats are advisory only; a failed fetch just leaves tiles blank
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function doAction(action: "seed" | "reset") {
    setBusy(action);
    setMessage(null);
    try {
      const res = await fetch("/api/uat/digital-front-desk/admin", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!data.ok) {
        setMessage("That didn't work.");
        return;
      }
      if (action === "seed") setMessage(data.added > 0 ? `Loaded ${data.added} seed request(s).` : "Seed data already loaded.");
      if (action === "reset") setMessage("All demo data cleared.");
      setStats(data.stats);
    } catch {
      setMessage("Couldn't reach the server.");
    } finally {
      setBusy(null);
    }
  }

  async function doExport() {
    setBusy("export");
    try {
      const res = await fetch("/api/uat/digital-front-desk/admin?export=1");
      const data = await res.json();
      if (!data.ok) {
        setMessage("Export failed.");
        return;
      }
      const blob = new Blob([JSON.stringify(data.snapshot, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `digital-front-desk-export-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setBusy(null);
    }
  }

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "28px 18px 72px" }}>
      <p style={{ fontSize: 12, fontWeight: 900, color: "var(--gold)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 4px" }}>
        Digital Front Desk
      </p>
      <h1 style={{ fontSize: 22, fontWeight: 900, margin: "0 0 20px" }}>Admin controls</h1>

      {message && (
        <p style={{ ...card, fontSize: 13, marginBottom: 16 }}>{message}</p>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 10, marginBottom: 24 }}>
        <StatTile label="Requests" value={stats?.requestCount ?? "—"} />
        <StatTile label="Onboarding leads" value={stats?.onboardingCount ?? "—"} />
        {PIPELINE_STAGES.slice(0, 2).map((s) => (
          <StatTile key={s} label={STAGE_LABEL[s]} value={stats?.byStage?.[s] ?? 0} />
        ))}
      </div>

      <Section title="Data management">
        <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6, margin: "0 0 12px" }}>
          Storage is a server-side, in-memory demo store — not a database. It resets on server restart and, on a
          serverless deployment, may vary between requests handled by different instances.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          <button type="button" style={btnPrimary} disabled={busy === "seed"} onClick={() => doAction("seed")}>
            {busy === "seed" ? "Loading…" : "Load seed data"}
          </button>
          <button type="button" style={btnQuiet} disabled={busy === "export"} onClick={doExport}>
            {busy === "export" ? "Exporting…" : "Export as JSON"}
          </button>
          <button
            type="button"
            style={{ ...btnQuiet, borderColor: "#EB5757", color: "#EB5757" }}
            disabled={busy === "reset"}
            onClick={() => {
              if (window.confirm("Clear all Digital Front Desk demo data? This can't be undone.")) doAction("reset");
            }}
          >
            {busy === "reset" ? "Clearing…" : "Clear all demo data"}
          </button>
        </div>
      </Section>

      <Section title="Feature flag">
        <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6, margin: 0 }}>
          <code style={{ background: "var(--bg)", padding: "2px 6px", borderRadius: 4 }}>DIGITAL_FRONT_DESK_UAT_ENABLED</code>{" "}
          — server-only environment variable. Every route under <code>/uat/digital-front-desk</code> (pages and API
          routes) 404s when it isn&rsquo;t exactly <code>&quot;true&quot;</code>.
        </p>
      </Section>

      <Section title="Access">
        <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6, margin: "0 0 8px" }}>
          <strong>Public, no sign-in:</strong> the overview page and the customer intake form + confirmation — a
          real customer is never asked to authenticate to submit a request.
        </p>
        <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6, margin: 0 }}>
          <strong>Owner-only:</strong> this admin panel, the owner&rsquo;s desk (listing, reading, and changing any
          request), and the onboarding preview — all gated by the same owner session used across the rest of this
          site (<Link href="/owner" style={{ color: "var(--gold)" }}>/owner</Link>). Every page and API route also
          carries the feature flag and a <code>noindex, nofollow</code> tag.
        </p>
      </Section>

      <Section title="What's implemented vs. mocked">
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: "var(--muted)", lineHeight: 1.8 }}>
          <li><strong>Real:</strong> intake validation, server-side request storage, status/assignment/notes/next-action changes, the audit timeline, and the owner-session gate.</li>
          <li><strong>Mocked:</strong> customer email/SMS and review requests are logged as events only — nothing is actually sent. Scheduling is a plain date field, not a calendar integration.</li>
          <li><strong>Not built yet:</strong> a real database (this resets on server restart), payments, file/photo uploads, multi-business or multi-team support, and a full onboarding flow (the onboarding page is a lead-capture preview only).</li>
        </ul>
      </Section>

      <p style={{ marginTop: 8 }}>
        <Link href="/uat/digital-front-desk" style={{ fontSize: 12.5, color: "var(--muted)" }}>← Back to overview</Link>
      </p>
    </main>
  );
}

function StatTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ ...card, textAlign: "center", padding: 14 }}>
      <p style={{ fontSize: 20, fontWeight: 900, margin: "0 0 2px" }}>{value}</p>
      <p style={{ fontSize: 11, color: "var(--muted)", margin: 0, textTransform: "uppercase", letterSpacing: "0.03em" }}>{label}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ ...card, marginBottom: 16 }}>
      <p style={{ fontSize: 14, fontWeight: 900, margin: "0 0 10px" }}>{title}</p>
      {children}
    </div>
  );
}
