// Pure display/formatting helpers with NO server-only dependencies (no
// node:crypto, no next/headers) — safe to import from a "use client"
// component. generateConfirmationNumber(), validation, seeding, and the
// server store all live in domain.ts / store.ts instead, and are never
// imported here or from any client file.

import type { CustomerRequest, FrontDeskEvent, UrgencyLevel } from "./types";

export function formatTimeAgo(iso: string, now: Date = new Date()): string {
  const seconds = Math.max(0, Math.floor((now.getTime() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return new Date(iso).toLocaleDateString();
}

export const URGENCY_COLOR: Record<UrgencyLevel, string> = {
  routine: "#9DB2C6",
  soon: "#F2C94C",
  urgent: "#F2994A",
  safety_concern: "#EB5757",
};

export function eventLabel(event: FrontDeskEvent): string {
  switch (event.type) {
    case "request_created":
      return "Request received";
    case "request_assigned":
      return `Assigned to ${event.assignee}`;
    case "status_changed":
      return `Status moved from ${event.from.replace("_", " ")} to ${event.to.replace("_", " ")}`;
    case "next_action_set":
      return event.dueAt
        ? `Next action set: ${event.nextAction}`
        : `Next action set: ${event.nextAction} (no due date)`;
    case "note_added":
      return `Internal note added by ${event.author}`;
    case "customer_update_sent":
      return `Customer update sent via ${event.channel} (simulated — no message actually sent)`;
    case "review_requested":
      return `Review requested via ${event.channel} (simulated — no message actually sent)`;
    case "request_completed":
      return "Marked completed";
  }
}

export function isOverdue(request: Pick<CustomerRequest, "nextActionDue" | "status">, now: Date = new Date()): boolean {
  if (!request.nextActionDue) return false;
  if (request.status === "completed" || request.status === "paid") return false;
  return new Date(request.nextActionDue).getTime() < now.getTime();
}

export function priorityScore(request: Pick<CustomerRequest, "urgency" | "assignedTo">): number {
  const urgencyScore =
    request.urgency === "safety_concern" ? 100 : request.urgency === "urgent" ? 50 : request.urgency === "soon" ? 25 : 0;
  const unassignedScore = request.assignedTo ? 0 : 10;
  return urgencyScore + unassignedScore;
}

export function sortForStage(requests: CustomerRequest[]): CustomerRequest[] {
  return [...requests].sort((a, b) => priorityScore(b) - priorityScore(a) || a.createdAt.localeCompare(b.createdAt));
}
