// Plain words for an account's access status, for the person who owns the
// account. Pure and client-safe: no store, no billing, no prices.

const LABELS: Record<string, string> = {
  free: "Free account (saved builds stay in this browser)",
  pending: "Waiting for an invite",
  tester: "Invited tester (builds sync between devices)",
  owner: "Owner",
  active: "Syncing between devices",
  canceled_active: "Syncing between devices",
  past_due: "Sync paused",
  expired: "Sync ended (your saved work is still here)",
  revoked: "Access removed",
};

export function statusLabel(status: string | null | undefined): string {
  if (!status) return "Not signed in";
  return LABELS[status] ?? "Signed in";
}
