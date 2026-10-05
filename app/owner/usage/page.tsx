// Owner-only usage view: are people coming, coming back, and using things?
// Same server-side gate as the rest of /owner. Counts only; see
// app/lib/usage.ts for what is and isn't counted.

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { isOwnerAuthed } from "../session";
import { getMemberStore } from "../../members/store";
import { buildUsageReport, type UsageTotals } from "../usageReport";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Usage",
  robots: { index: false, follow: false, nocache: true },
};

const card = { background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 14, padding: 16 } as const;
const th = { textAlign: "left", padding: "6px 8px", fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em" } as const;
const td = { padding: "6px 8px", fontSize: 13.5, borderTop: "1px solid var(--line)", fontVariantNumeric: "tabular-nums" } as const;

const KPIS: { key: keyof UsageTotals; label: string; hint: string }[] = [
  { key: "visitors", label: "Visitors", hint: "Browsers, counted once per day" },
  { key: "returning", label: "Came back", hint: "Visitor-days from a browser seen on an earlier day" },
  { key: "pageViews", label: "Page views", hint: "Each page once per tab" },
  { key: "ideas", label: "Ideas shaped", hint: "Someone used the idea box and got a reading" },
  { key: "engineStarts", label: "Engine runs started", hint: "" },
  { key: "engineOutputs", label: "Engine results", hint: "An engine produced its package" },
  { key: "firstBuildRounds", label: "First-build rounds", hint: "Rounds finished in /build" },
  { key: "feedback", label: "Feedback notes", hint: "From the form anyone can use" },
];

export default async function OwnerUsagePage() {
  if (!(await isOwnerAuthed())) redirect("/owner?to=/owner/usage");
  const store = await getMemberStore();
  const now = new Date();
  const rows = store ? await store.summarizeEvents(new Date(now.getTime() - 31 * 86_400_000).toISOString()).catch(() => null) : null;
  const report = buildUsageReport(rows ?? [], now);

  return (
    <main style={{ maxWidth: 880, margin: "0 auto", padding: "40px 18px 64px" }}>
      <p style={{ fontSize: 12, fontWeight: 900, color: "var(--gold)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 6px" }}>Private</p>
      <h1 style={{ fontSize: 24, fontWeight: 900, margin: "0 0 6px" }}>Usage</h1>
      <p style={{ fontSize: 13.5, color: "var(--muted)", lineHeight: 1.55, margin: "0 0 18px" }}>
        Counts only, by Central day. Never what anyone typed, never an IP or an ID. Browsers asking not to be
        tracked aren&apos;t counted, and neither are your own visits while signed in here. Counting started on
        October 4, 2026.
      </p>
      {rows === null && (
        <p role="alert" style={{ ...card, fontSize: 13.5, fontWeight: 800, color: "var(--gold)" }}>
          {store ? "The usage numbers didn't load. Reload in a moment." : "No database is configured here, so nothing is counted."}
        </p>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: 10, margin: "0 0 26px" }}>
        {KPIS.map((k) => (
          <div key={k.key} style={card}>
            <p style={{ fontSize: 12, fontWeight: 800, color: "var(--muted)", margin: "0 0 4px" }}>{k.label}</p>
            <p style={{ fontSize: 26, fontWeight: 900, margin: 0, fontVariantNumeric: "tabular-nums" }}>{report.last7[k.key]}</p>
            <p style={{ fontSize: 12, color: "var(--muted)", margin: "2px 0 0" }}>
              last 7 days · {report.last30[k.key]} in 30
            </p>
            {k.hint && <p style={{ fontSize: 11.5, color: "var(--muted)", margin: "6px 0 0", lineHeight: 1.4 }}>{k.hint}</p>}
          </div>
        ))}
      </div>

      <h2 style={{ fontSize: 17, fontWeight: 900, margin: "0 0 8px" }}>Last 14 days</h2>
      <div style={{ ...card, padding: 8, overflowX: "auto", marginBottom: 26 }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr><th style={th}>Day</th><th style={th}>Visitors</th><th style={th}>Page views</th><th style={th}>Ideas</th><th style={th}>Engine results</th></tr>
          </thead>
          <tbody>
            {report.days.map((d) => (
              <tr key={d.day}><td style={td}>{d.day}</td><td style={td}>{d.visitors}</td><td style={td}>{d.pageViews}</td><td style={td}>{d.ideas}</td><td style={td}>{d.engineOutputs}</td></tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>
        <section>
          <h2 style={{ fontSize: 17, fontWeight: 900, margin: "0 0 8px" }}>Most opened pages (30 days)</h2>
          <div style={{ ...card, padding: 8 }}>
            {report.topPages.length === 0 ? (
              <p style={{ fontSize: 13, color: "var(--muted)", margin: 8 }}>Nothing counted yet.</p>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                  {report.topPages.map((p) => (
                    <tr key={p.slug}><td style={td}>{p.name}</td><td style={{ ...td, textAlign: "right" }}>{p.views}</td></tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
        <section>
          <h2 style={{ fontSize: 17, fontWeight: 900, margin: "0 0 8px" }}>Engines (30 days)</h2>
          <div style={{ ...card, padding: 8 }}>
            {report.engines.length === 0 ? (
              <p style={{ fontSize: 13, color: "var(--muted)", margin: 8 }}>No engine runs yet.</p>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr><th style={th}>Engine</th><th style={th}>Started</th><th style={th}>Results</th></tr></thead>
                <tbody>
                  {report.engines.map((e) => (
                    <tr key={e.id}><td style={td}>{e.id}</td><td style={td}>{e.starts}</td><td style={td}>{e.outputs}</td></tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </div>

      <p style={{ fontSize: 12, marginTop: 24, display: "flex", gap: 16, flexWrap: "wrap" }}>
        <Link href="/owner/feedback" style={{ color: "var(--gold)", fontWeight: 800 }}>Tester feedback →</Link>
        <Link href="/owner" style={{ color: "var(--gold)", fontWeight: 800 }}>← Owner hub</Link>
      </p>
    </main>
  );
}
