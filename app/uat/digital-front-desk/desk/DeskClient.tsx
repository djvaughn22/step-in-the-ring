"use client";

// Requests grouped by status, with ownership and next actions visible.
// Existing detail actions share the same protected API.

import styles from "../front-desk.module.css";
import { useEffect, useState } from "react";
import Link from "next/link";
import { serviceName } from "../lib/business";
import { eventLabel, formatTimeAgo, isOverdue, URGENCY_COLOR } from "../lib/display";
import { card, inputBase, label as labelStyle, btnPrimary, btnQuiet, badge } from "../lib/ui";
import { PIPELINE_STAGES, STAGE_LABEL, URGENCY_LABEL } from "../lib/types";
import type { ContactMethod, CustomerRequest, PipelineStage } from "../lib/types";

type Filter = "all" | "unassigned" | "overdue";

export default function DeskClient() {
  const [requests, setRequests] = useState<CustomerRequest[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const res = await fetch("/api/uat/digital-front-desk/requests");
      const data = await res.json();
      if (!data.ok) {
        setLoadError("Couldn't load requests.");
        return;
      }
      setRequests(data.requests);
      setLoadError(null);
    } catch {
      setLoadError("Couldn't reach the server.");
    }
  }

  const selected = requests?.find((r) => r.id === selectedId) ?? null;

  async function patch(id: string, body: Record<string, unknown>): Promise<boolean> {
    try {
      const res = await fetch(`/api/uat/digital-front-desk/requests/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!data.ok) return false;
      await load();
      return true;
    } catch {
      return false;
    }
  }

  const now = new Date();
  const visible = (requests ?? []).filter((r) => {
    if (filter === "unassigned") return !r.assignedTo;
    if (filter === "overdue") return isOverdue(r, now);
    return true;
  });

  return (
    <main className={styles.desk}>
      <Link className={styles.back} href="/uat/digital-front-desk">← Digital Front Desk</Link>
      <BoardStyles />
      <div className={styles.deskHeader}>
        <div>
          <p style={{ fontSize: 12, fontWeight: 900, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 4px" }}>
            Digital Front Desk
          </p>
          <h1>Owner&rsquo;s desk</h1>
          <p>See what needs attention. Give it a clear next step.</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" style={btnQuiet} onClick={() => load()}>↻ Refresh</button>
          <Link href="/uat/digital-front-desk/admin" style={{ ...btnQuiet, textDecoration: "none", display: "inline-flex", alignItems: "center" }}>
            Admin →
          </Link>
        </div>
      </div>

      {loadError && (
        <p role="alert" style={{ ...card, borderColor: "#EB5757", fontSize: 13, color: "#EB5757", marginTop: 16 }}>
          {loadError}
        </p>
      )}

      <div className={styles.filters} aria-label="Filter requests">
        {(
          [
            ["all", "All"],
            ["unassigned", "Unassigned"],
            ["overdue", "Overdue"],
          ] as [Filter, string][]
        ).map(([value, name]) => (
          <button
            key={value}
            type="button"
            aria-pressed={filter === value}
            onClick={() => setFilter(value)}
            style={{
              ...btnQuiet,
              whiteSpace: "nowrap",
              borderColor: filter === value ? "var(--accent)" : "var(--line)",
              color: filter === value ? "var(--accent)" : "var(--muted)",
            }}
          >
            {name} · {(requests ?? []).filter((r) => value === "all" || (value === "unassigned" ? !r.assignedTo : isOverdue(r, now))).length}
          </button>
        ))}
      </div>

      {requests === null && !loadError && (
        <p style={{ fontSize: 13, color: "var(--muted)" }}>Loading…</p>
      )}

      {requests !== null && requests.length === 0 && (
        <div style={{ ...card, marginTop: 12 }}>
          <p style={{ fontSize: 14, fontWeight: 800, margin: "0 0 6px" }}>No requests yet</p>
          <p style={{ fontSize: 13, color: "var(--muted)", margin: 0, lineHeight: 1.6 }}>
            Load demo data from <Link href="/uat/digital-front-desk/admin" style={{ color: "var(--accent)" }}>Admin controls</Link>, or
            submit one yourself from the <Link href="/uat/digital-front-desk/request" style={{ color: "var(--accent)" }}>customer intake form</Link>.
          </p>
        </div>
      )}

      {requests !== null && requests.length > 0 && (
        <div className={styles.board}>
          {PIPELINE_STAGES.map((stage) => {
            const stageRequests = visible.filter((r) => r.status === stage);
            if (!stageRequests.length) return null;
            return (
              <section key={stage}>
                <h2 className={styles.stageTitle}>{STAGE_LABEL[stage]} <span>{stageRequests.length}</span></h2>
                <div style={{ display: "grid", gap: 8 }}>
                  {stageRequests.map((r) => (
                    <RequestCard key={r.id} request={r} now={now} onOpen={() => setSelectedId(r.id)} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {requests !== null && requests.length > 0 && visible.length === 0 && <p className={styles.empty}>No {filter} requests. You’re caught up here.</p>}

      {selected && (
        <DetailPanel
          request={selected}
          onClose={() => setSelectedId(null)}
          onAssign={(assignee) => patch(selected.id, { action: "assign", assignee })}
          onStatus={(status) => patch(selected.id, { action: "status", status })}
          onNote={(text) => patch(selected.id, { action: "note", text })}
          onNextAction={(nextAction, dueAt) => patch(selected.id, { action: "next_action", nextAction, dueAt })}
          onCustomerUpdate={(channel, message) => patch(selected.id, { action: "customer_update", channel, message })}
          onReviewRequest={(channel) => patch(selected.id, { action: "review_request", channel })}
        />
      )}
    </main>
  );
}

function BoardStyles() {
  return (
    <style>{`
      .dfd-detail {
        position: fixed; inset: 0; z-index: 60; overflow-y: auto;
      }
      @media (min-width: 900px) {
        .dfd-detail { left: auto; width: 440px; box-shadow: -20px 0 60px rgba(0,0,0,0.4); }
      }
    `}</style>
  );
}

function RequestCard({ request, now, onOpen }: { request: CustomerRequest; now: Date; onOpen: () => void }) {
  const overdue = isOverdue(request, now);
  return (
    <button type="button" onClick={onOpen} className={`${styles.requestRow} ${overdue || request.urgency === "safety_concern" || request.urgency === "urgent" ? styles.attention : ""}`}>
      <span><strong>{request.customerName}</strong><small>{serviceName(request.serviceId)} · {request.serviceArea}</small><small>{formatTimeAgo(request.createdAt, now)}</small></span>
      <span className={styles.rowValue}><span className={styles.rowLabel}>Priority</span>{URGENCY_LABEL[request.urgency]}{overdue && <small>Overdue</small>}</span>
      <span className={styles.rowValue}><span className={styles.rowLabel}>Next action</span>{request.nextAction || "Review request and set a next step"}{request.nextActionDue && <small>Due {new Date(request.nextActionDue).toLocaleDateString()}</small>}</span>
      <span className={styles.rowValue}><span className={styles.rowLabel}>Owner</span>{request.assignedTo || "Unassigned"}<small>Open request →</small></span>
    </button>
  );
}

function DetailPanel({
  request,
  onClose,
  onAssign,
  onStatus,
  onNote,
  onNextAction,
  onCustomerUpdate,
  onReviewRequest,
}: {
  request: CustomerRequest;
  onClose: () => void;
  onAssign: (assignee: string) => Promise<boolean>;
  onStatus: (status: PipelineStage) => Promise<boolean>;
  onNote: (text: string) => Promise<boolean>;
  onNextAction: (nextAction: string, dueAt: string | null) => Promise<boolean>;
  onCustomerUpdate: (channel: ContactMethod, message: string) => Promise<boolean>;
  onReviewRequest: (channel: ContactMethod) => Promise<boolean>;
}) {
  const [assignee, setAssignee] = useState("Owner");
  const [noteText, setNoteText] = useState("");
  const [nextAction, setNextAction] = useState(request.nextAction ?? "");
  const [dueAt, setDueAt] = useState(request.nextActionDue ? request.nextActionDue.slice(0, 10) : "");
  const [updateChannel, setUpdateChannel] = useState<ContactMethod>(request.preferredContact);
  const [updateMessage, setUpdateMessage] = useState("");
  const [reviewChannel, setReviewChannel] = useState<ContactMethod>(request.preferredContact);
  const [busy, setBusy] = useState<string | null>(null);

  async function run(key: string, fn: () => Promise<boolean>) {
    setBusy(key);
    await fn();
    setBusy(null);
  }

  const canRequestReview = request.status === "completed" || request.status === "paid";

  return (
    <>
      <div
        onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(6,18,31,0.6)", zIndex: 50 }}
      />
      <div className="dfd-detail" style={{ background: "var(--bg)", borderLeft: "1px solid var(--line)" }}>
        <div style={{ padding: "20px 20px 60px", maxWidth: 520, margin: "0 auto" }}>
          <button type="button" onClick={onClose} style={{ ...btnQuiet, marginBottom: 16 }}>← Close</button>

          <p style={{ fontSize: 11, fontWeight: 900, color: "var(--muted)", textTransform: "uppercase", margin: "0 0 4px" }}>
            {request.confirmationNumber}
          </p>
          <h2 style={{ fontSize: 20, fontWeight: 900, margin: "0 0 4px" }}>{request.customerName}</h2>
          <p style={{ fontSize: 13, color: "var(--muted)", margin: "0 0 16px" }}>
            {serviceName(request.serviceId)} · {request.serviceArea}
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
            <span style={badge(URGENCY_COLOR[request.urgency])}>{URGENCY_LABEL[request.urgency]}</span>
            {!request.assignedTo && <span style={badge("#EB5757", "#fff")}>Unassigned</span>}
          </div>

          <Section title="Customer">
            <Row label="Email" value={request.customerEmail} />
            <Row label="Phone" value={request.customerPhone} />
            <Row label="Preferred contact" value={request.preferredContact} />
            <Row label="Description" value={request.description} last />
          </Section>

          <Section title="Status">
            <select
              style={inputBase}
              aria-label="Request status"
              value={request.status}
              onChange={(e) => run("status", () => onStatus(e.target.value as PipelineStage))}
              disabled={busy === "status"}
            >
              {PIPELINE_STAGES.map((s) => (
                <option key={s} value={s}>{STAGE_LABEL[s]}</option>
              ))}
            </select>
          </Section>

          <Section title="Assignment">
            {request.assignedTo ? (
              <p style={{ fontSize: 13.5, margin: 0 }}>Assigned to <strong>{request.assignedTo}</strong></p>
            ) : (
              <div style={{ display: "flex", gap: 8 }}>
                <input style={inputBase} aria-label="Assign to" value={assignee} onChange={(e) => setAssignee(e.target.value)} />
                <button type="button" style={btnPrimary} disabled={busy === "assign"} onClick={() => run("assign", () => onAssign(assignee))}>
                  Assign
                </button>
              </div>
            )}
          </Section>

          <Section title="Next action">
            <input style={{ ...inputBase, marginBottom: 8 }} aria-label="Next action" value={nextAction} onChange={(e) => setNextAction(e.target.value)} placeholder="What happens next" />
            <input aria-label="Next action due date" type="date" style={{ ...inputBase, marginBottom: 8 }} value={dueAt} onChange={(e) => setDueAt(e.target.value)} />
            <button
              type="button"
              style={btnPrimary}
              disabled={busy === "next_action" || !nextAction.trim()}
              onClick={() => run("next_action", () => onNextAction(nextAction.trim(), dueAt ? new Date(dueAt).toISOString() : null))}
            >
              Save next action
            </button>
          </Section>

          <Section title="Internal notes">
            <div style={{ display: "grid", gap: 8, marginBottom: 10 }}>
              {request.internalNotes.length === 0 && <p style={{ fontSize: 12.5, color: "var(--muted)", margin: 0 }}>No notes yet.</p>}
              {request.internalNotes.map((n, i) => (
                <div key={i} style={{ ...card, padding: 10 }}>
                  <p style={{ fontSize: 13, margin: "0 0 4px" }}>{n.text}</p>
                  <p style={{ fontSize: 11, color: "var(--muted)", margin: 0 }}>{n.author} · {formatTimeAgo(n.timestamp)}</p>
                </div>
              ))}
            </div>
            <textarea style={{ ...inputBase, minHeight: 70, marginBottom: 8 }} aria-label="Internal note" value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Add an internal note" />
            <button type="button" style={btnPrimary} disabled={busy === "note" || !noteText.trim()} onClick={() => run("note", async () => { const ok = await onNote(noteText.trim()); if (ok) setNoteText(""); return ok; })}>
              Add note
            </button>
          </Section>

          <Section title="Customer update (simulated)">
            <p style={{ fontSize: 11.5, color: "var(--muted)", margin: "0 0 8px", lineHeight: 1.5 }}>
              Logs that an update was sent to the timeline. No real email or SMS is sent by this UAT.
            </p>
            <select style={{ ...inputBase, marginBottom: 8 }} aria-label="Customer update channel" value={updateChannel} onChange={(e) => setUpdateChannel(e.target.value as ContactMethod)}>
              <option value="email">Email</option>
              <option value="phone">Phone</option>
            </select>
            <textarea style={{ ...inputBase, minHeight: 60, marginBottom: 8 }} aria-label="Customer update message" value={updateMessage} onChange={(e) => setUpdateMessage(e.target.value)} placeholder="What would this update say?" />
            <button
              type="button"
              style={btnPrimary}
              disabled={busy === "customer_update" || !updateMessage.trim()}
              onClick={() => run("customer_update", async () => { const ok = await onCustomerUpdate(updateChannel, updateMessage.trim()); if (ok) setUpdateMessage(""); return ok; })}
            >
              Log simulated update
            </button>
            {request.lastCustomerUpdate && (
              <p style={{ fontSize: 11.5, color: "var(--muted)", margin: "8px 0 0" }}>
                Last logged {formatTimeAgo(request.lastCustomerUpdate)} via {request.lastCustomerUpdateChannel}.
              </p>
            )}
          </Section>

          {canRequestReview && (
            <Section title="Review request (simulated)">
              <p style={{ fontSize: 11.5, color: "var(--muted)", margin: "0 0 8px", lineHeight: 1.5 }}>
                Logs that a review was requested. No real message is sent by this UAT.
              </p>
              <select style={{ ...inputBase, marginBottom: 8 }} aria-label="Review request channel" value={reviewChannel} onChange={(e) => setReviewChannel(e.target.value as ContactMethod)}>
                <option value="email">Email</option>
                <option value="phone">Phone</option>
              </select>
              <button type="button" style={btnPrimary} disabled={busy === "review"} onClick={() => run("review", () => onReviewRequest(reviewChannel))}>
                Log simulated review request
              </button>
            </Section>
          )}

          <Section title="Timeline">
            <div style={{ display: "grid", gap: 6 }}>
              {[...request.events].reverse().map((ev, i) => (
                <p key={i} style={{ fontSize: 12, color: "var(--muted)", margin: 0, lineHeight: 1.5 }}>
                  <span style={{ color: "var(--fg, inherit)" }}>{eventLabel(ev)}</span> — {formatTimeAgo(ev.timestamp)}
                </p>
              ))}
            </div>
          </Section>
        </div>
      </div>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <p style={labelStyle}>{title}</p>
      {children}
    </div>
  );
}

function Row({ label: text, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div style={{ marginBottom: last ? 0 : 8 }}>
      <span style={{ fontSize: 11, color: "var(--muted)" }}>{text}: </span>
      <span style={{ fontSize: 13 }}>{value}</span>
    </div>
  );
}
