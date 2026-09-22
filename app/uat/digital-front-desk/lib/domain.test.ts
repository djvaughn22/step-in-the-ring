import { describe, expect, it } from "vitest";
import {
  eventLabel,
  formatTimeAgo,
  generateConfirmationNumber,
  isOverdue,
  priorityScore,
  seedRequestIds,
  seedRequests,
  validateIntake,
  validateOnboarding,
} from "./domain";

describe("generateConfirmationNumber", () => {
  it("is human-readable and effectively unique", () => {
    const a = generateConfirmationNumber();
    const b = generateConfirmationNumber();
    expect(a).toMatch(/^DFD-[0-9A-F]{6}-[0-9A-F]{6}$/);
    expect(a).not.toBe(b);
  });
});

describe("validateIntake", () => {
  const base = {
    customerName: "Jamie Rivera",
    customerEmail: "jamie@example.com",
    customerPhone: "(555) 111-2222",
    serviceArea: "Downtown",
    serviceId: "repairs",
    description: "A leaky pipe under the sink.",
    urgency: "soon",
    preferredContact: "email",
    consentToUpdates: true,
  };

  it("accepts a fully valid submission", () => {
    const result = validateIntake(base);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.status).toBe("new");
      expect(result.value.customerEmail).toBe("jamie@example.com");
    }
  });

  it("rejects a missing name, bad email, and unchecked consent all at once", () => {
    const result = validateIntake({ ...base, customerName: "", customerEmail: "not-an-email", consentToUpdates: false });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toContain("Enter your name.");
      expect(result.errors).toContain("Enter a valid email address.");
      expect(result.errors).toContain("You must agree to be contacted about this request.");
    }
  });

  it("never defaults consent to true when the field is absent", () => {
    const withoutConsent: Record<string, unknown> = { ...base };
    delete withoutConsent.consentToUpdates;
    const result = validateIntake(withoutConsent as typeof base);
    expect(result.ok).toBe(false);
  });

  it("rejects a service area or service id outside the demo business's own lists", () => {
    const result = validateIntake({ ...base, serviceArea: "Nowhere", serviceId: "made-up" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toContain("Choose a service area.");
      expect(result.errors).toContain("Choose a service.");
    }
  });
});

describe("validateOnboarding", () => {
  it("accepts a valid plan application", () => {
    const result = validateOnboarding({ plan: "working", businessName: "Acme Co", email: "owner@acme.example" });
    expect(result.ok).toBe(true);
  });

  it("rejects an unrecognized plan", () => {
    const result = validateOnboarding({ plan: "enterprise", businessName: "Acme Co", email: "owner@acme.example" });
    expect(result.ok).toBe(false);
  });
});

describe("formatTimeAgo", () => {
  it("buckets elapsed time into human units", () => {
    const now = new Date("2026-01-02T12:00:00Z");
    expect(formatTimeAgo(new Date(now.getTime() - 30 * 1000).toISOString(), now)).toBe("just now");
    expect(formatTimeAgo(new Date(now.getTime() - 5 * 60 * 1000).toISOString(), now)).toBe("5m ago");
    expect(formatTimeAgo(new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString(), now)).toBe("3h ago");
    expect(formatTimeAgo(new Date(now.getTime() - 2 * 86400 * 1000).toISOString(), now)).toBe("2d ago");
  });
});

describe("isOverdue", () => {
  const now = new Date("2026-01-02T12:00:00Z");
  it("is overdue when the due date has passed and the work isn't finished", () => {
    expect(isOverdue({ nextActionDue: "2026-01-01T00:00:00Z", status: "new" }, now)).toBe(true);
  });
  it("is never overdue once completed or paid, even with a past due date", () => {
    expect(isOverdue({ nextActionDue: "2026-01-01T00:00:00Z", status: "completed" }, now)).toBe(false);
    expect(isOverdue({ nextActionDue: "2026-01-01T00:00:00Z", status: "paid" }, now)).toBe(false);
  });
  it("is never overdue with no due date set", () => {
    expect(isOverdue({ nextActionDue: null, status: "new" }, now)).toBe(false);
  });
});

describe("priorityScore", () => {
  it("ranks a safety concern above urgent above soon above routine", () => {
    const safety = priorityScore({ urgency: "safety_concern", assignedTo: "Owner" });
    const urgent = priorityScore({ urgency: "urgent", assignedTo: "Owner" });
    const soon = priorityScore({ urgency: "soon", assignedTo: "Owner" });
    const routine = priorityScore({ urgency: "routine", assignedTo: "Owner" });
    expect(safety).toBeGreaterThan(urgent);
    expect(urgent).toBeGreaterThan(soon);
    expect(soon).toBeGreaterThan(routine);
  });

  it("floats an unassigned request above an assigned one of equal urgency", () => {
    const unassigned = priorityScore({ urgency: "routine", assignedTo: null });
    const assigned = priorityScore({ urgency: "routine", assignedTo: "Owner" });
    expect(unassigned).toBeGreaterThan(assigned);
  });
});

describe("eventLabel", () => {
  it("marks simulated customer contact as simulated, never as sent", () => {
    const label = eventLabel({ type: "customer_update_sent", timestamp: "2026-01-01T00:00:00Z", channel: "email", simulated: true });
    expect(label).toMatch(/simulated/i);
  });
});

describe("seedRequests", () => {
  it("produces the same fixed ids every time — reseeding is idempotent", () => {
    const ids = seedRequests().map((r) => r.id).sort();
    expect(ids).toEqual([...seedRequestIds()].sort());
  });

  it("gives every seed request a real, self-consistent audit trail", () => {
    for (const req of seedRequests()) {
      expect(req.events[0].type).toBe("request_created");
      expect(req.confirmationNumber).toMatch(/^DFD-/);
    }
  });
});
