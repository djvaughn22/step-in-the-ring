import { countUsage, type UsageEvent } from "./usage";

// The few GA events the owner also sees in the site's own usage view
// (/owner/usage). Only the structural label travels: an engine id, a
// creation type, a round number.
const OWN_COUNTS: Record<string, { event: UsageEvent; label?: string }> = {
  engine_start: { event: "engine-start", label: "engine" },
  engine_output: { event: "engine-output", label: "engine" },
  plan_result_viewed: { event: "idea-shaped", label: "type" },
  build_round: { event: "first-build-round", label: "round" },
};

// Thin wrapper over the GA4 gtag queue. Safe everywhere: no-ops during SSR,
// in tests, and when the tag is blocked by an ad blocker.
export function track(event: string, params?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  const gtag = (window as { gtag?: (...args: unknown[]) => void }).gtag;
  if (typeof gtag === "function") gtag("event", event, params);
  const own = OWN_COUNTS[event];
  if (own) {
    const raw = own.label ? params?.[own.label] : "";
    countUsage(own.event, typeof raw === "string" || typeof raw === "number" ? String(raw) : "");
  }
}
