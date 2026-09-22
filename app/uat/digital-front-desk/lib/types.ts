// Digital Front Desk — domain types.
//
// Ported from the iDontCry UAT (src/lib/frontDesk.ts) and trimmed to what
// SITR's own front desk demo actually uses: one fictional demo business
// instead of two, optional fields as `| null` instead of `?` (so a server
// store round-trips through JSON without ambiguity), and a slightly richer
// event union so the request-detail timeline can show every action the
// dashboard actually performs (next-action edits and follow-up scheduling
// were tracked in the source but never rendered anywhere).

export type PipelineStage =
  | "new"
  | "contacted"
  | "quoted"
  | "scheduled"
  | "in_progress"
  | "completed"
  | "paid";

export const PIPELINE_STAGES: PipelineStage[] = [
  "new",
  "contacted",
  "quoted",
  "scheduled",
  "in_progress",
  "completed",
  "paid",
];

export const STAGE_LABEL: Record<PipelineStage, string> = {
  new: "New",
  contacted: "Contacted",
  quoted: "Quoted",
  scheduled: "Scheduled",
  in_progress: "In progress",
  completed: "Completed",
  paid: "Paid",
};

export type UrgencyLevel = "routine" | "soon" | "urgent" | "safety_concern";

export const URGENCY_LABEL: Record<UrgencyLevel, string> = {
  routine: "Routine",
  soon: "Soon",
  urgent: "Urgent",
  safety_concern: "Safety concern",
};

export type ContactMethod = "email" | "phone";

export interface ServiceDefinition {
  id: string;
  name: string;
  description: string;
}

export interface InternalNote {
  timestamp: string;
  text: string;
  author: string;
}

// Every state change a request goes through, kept as an append-only audit
// trail. Nothing is ever removed from `events` — that is the "nothing
// important quietly disappears" promise made concrete.
export type FrontDeskEvent =
  | { type: "request_created"; timestamp: string }
  | { type: "request_assigned"; timestamp: string; assignee: string }
  | { type: "status_changed"; timestamp: string; from: PipelineStage; to: PipelineStage }
  | { type: "next_action_set"; timestamp: string; nextAction: string; dueAt: string | null }
  | { type: "note_added"; timestamp: string; author: string }
  | { type: "customer_update_sent"; timestamp: string; channel: ContactMethod; simulated: true }
  | { type: "review_requested"; timestamp: string; channel: ContactMethod; simulated: true }
  | { type: "request_completed"; timestamp: string };

export interface CustomerRequest {
  id: string;
  createdAt: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  serviceArea: string;
  serviceId: string;
  description: string;
  urgency: UrgencyLevel;
  preferredContact: ContactMethod;
  consentToUpdates: true; // the intake form will not submit without this
  status: PipelineStage;
  assignedTo: string | null;
  nextAction: string | null;
  nextActionDue: string | null;
  lastUpdate: string;
  lastCustomerUpdate: string | null;
  lastCustomerUpdateChannel: ContactMethod | null;
  internalNotes: InternalNote[];
  events: FrontDeskEvent[];
  confirmationNumber: string;
}

export type OnboardingPlan = "starter" | "working" | "pro";

export interface OnboardingApplication {
  id: string;
  createdAt: string;
  plan: OnboardingPlan;
  businessName: string;
  email: string;
}
