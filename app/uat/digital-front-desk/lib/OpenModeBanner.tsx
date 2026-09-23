"use client";

// Shown at the top of every owner-only Digital Front Desk surface (desk,
// onboarding, admin) while DFD_OPEN_UAT_MODE is on — so a visitor who
// reaches one of these pages without signing in understands why, and that
// it's a deliberate, temporary state rather than a broken login. See
// ./openMode.ts for the restore procedure.

import { card } from "./ui";
import { DFD_OPEN_UAT_MODE } from "./openMode";

export default function OpenModeBanner() {
  if (!DFD_OPEN_UAT_MODE) return null;
  return (
    <div style={{ ...card, borderColor: "var(--accent)", marginBottom: 16, padding: "12px 16px" }} role="status">
      <p style={{ fontSize: 12.5, fontWeight: 900, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.04em", margin: "0 0 4px" }}>
        Open UAT — no sign-in required right now
      </p>
      <p style={{ fontSize: 12.5, color: "var(--muted)", margin: 0, lineHeight: 1.5 }}>
        This is a temporary, reviewed state for an early walkthrough period. The owner sign-in requirement still
        exists in code and can be restored with one change — it&rsquo;s just switched off for now. Anyone with this
        URL can see and change any request in the demo store while this banner is showing.
      </p>
    </div>
  );
}
