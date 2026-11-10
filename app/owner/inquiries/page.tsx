// Owner-only: every project request, newest first. Same server-side gate as
// the owner hub. Read-only on purpose: replies happen by email, and the
// status of a project lives in the owner's own records, not here.

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isOwnerAuthed } from "../session";
import { getMemberStore, type ProjectInquiryRecord } from "../../members/store";
import { formatCentralTimestamp } from "../../members/login-notification";
import { BUDGETS, PROJECT_TYPES, SERVICE_CHOICES, TIMELINES, labelFor } from "../../services/offers";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Project requests",
  robots: { index: false, follow: false, nocache: true },
};

export default async function OwnerInquiriesPage() {
  if (!(await isOwnerAuthed())) redirect("/owner?to=/owner/inquiries");
  const store = await getMemberStore();
  let rows: ProjectInquiryRecord[] = [];
  let problem = "";
  if (!store) problem = "No database is configured here, so requests can't be received.";
  else {
    try {
      rows = await store.listProjectInquiries();
    } catch {
      problem = "Couldn't read requests from the database. Try again shortly.";
    }
  }
  return (
    <main style={{ maxWidth: 760, margin: "0 auto", padding: "40px 18px 64px" }}>
      <p className="kicker">Private</p>
      <h1 style={{ fontSize: 24, fontWeight: 900, margin: "4px 0 6px" }}>Project requests</h1>
      <p style={{ color: "var(--muted)", fontSize: 14, lineHeight: 1.55, margin: "0 0 20px" }}>
        Newest first. A request is not accepted until you reply. Run the conflict screening
        checklist before answering.
      </p>
      {problem ? <p role="alert" style={{ color: "var(--text)" }}>{problem}</p> : null}
      {!problem && rows.length === 0 ? <p style={{ color: "var(--muted)" }}>No requests yet.</p> : null}
      <div style={{ display: "grid", gap: 14 }}>
        {rows.map((r) => (
          <article key={r.id} style={{ border: "1px solid var(--line)", borderRadius: 14, padding: 18, background: "var(--panel)" }}>
            <p style={{ margin: 0, fontSize: 12, color: "var(--muted)" }}>{formatCentralTimestamp(new Date(r.createdAt))}</p>
            <h2 style={{ fontSize: 18, margin: "4px 0 2px" }}>
              {r.name}
              {r.organization ? <span style={{ color: "var(--muted)", fontWeight: 600 }}> · {r.organization}</span> : null}
            </h2>
            <p style={{ margin: "0 0 10px", fontSize: 14 }}>
              <a href={`mailto:${encodeURIComponent(r.email)}?subject=${encodeURIComponent("Your Step In The Ring project request")}`} style={{ color: "var(--gold)" }}>{r.email}</a>
              {r.siteUrl ? <> · <a href={r.siteUrl} target="_blank" rel="noopener noreferrer nofollow" style={{ color: "var(--gold)" }}>{r.siteUrl}</a></> : null}
            </p>
            <p style={{ margin: "0 0 10px", fontSize: 13.5, color: "var(--muted)" }}>
              {labelFor(PROJECT_TYPES, r.projectType)} · {labelFor(SERVICE_CHOICES, r.service)} · {labelFor(TIMELINES, r.timeline)} · Budget: {labelFor(BUDGETS, r.budget)}
            </p>
            <p style={{ margin: 0, whiteSpace: "pre-wrap", fontSize: 15, lineHeight: 1.6 }}>{r.description}</p>
          </article>
        ))}
      </div>
    </main>
  );
}
