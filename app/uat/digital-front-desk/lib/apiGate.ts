// Shared gates for every Digital Front Desk API route.
//
// A Digital Front Desk is only useful if a real customer can reach it
// without an account — so the split here is deliberate and asymmetric:
//
//   dfdFlagGate()   — feature flag only. For the customer-facing surface:
//                     the public intake POST. A real customer never signs
//                     in to submit a request, in production or in this UAT.
//   dfdOwnerGate()  — feature flag AND (normally) the real owner session.
//                     For every operational surface: listing/reading
//                     requests, status/assignment/notes/next-action
//                     changes, the onboarding-preview lead list, and all
//                     of Admin.
//
// TEMPORARY: while DFD_OPEN_UAT_MODE is true (./openMode.ts), dfdOwnerGate
// skips the owner-session check — see that file for the full explanation
// and the restore procedure. The owner-session check itself is untouched
// below; it's just short-circuited, not deleted, so restoring it is a
// one-line change in openMode.ts, not a rewrite of this file.
//
// Both fail closed the same way when they DO deny — a generic 404, no
// distinct "wrong password" signal — so a route that picks the wrong gate
// either leaks customer data to the internet or locks out real customers;
// there is no quiet middle failure mode. See docs/DIGITAL_FRONT_DESK_UAT.md
// for the full access-model table.

import { NextRequest, NextResponse } from "next/server";
import { isOwnerRequest } from "../../../owner/session";
import { dfdUatEnabled } from "./flag";
import { DFD_OPEN_UAT_MODE } from "./openMode";

const NOT_FOUND = () => NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });

/** Feature flag only — for the public customer-intake POST. Never gate
 * anything that reads existing requests or changes their state with this. */
export function dfdFlagGate(): NextResponse | null {
  if (!dfdUatEnabled()) return NOT_FOUND();
  return null;
}

/**
 * Feature flag AND (normally) the real owner session — for every
 * operational route. `openMode` defaults to the shared DFD_OPEN_UAT_MODE
 * constant; it's a parameter (not a hardcoded read) so a test can exercise
 * the real owner-checking branch directly, proving that code path still
 * works correctly even while it's switched off in production.
 */
export function dfdOwnerGate(req: NextRequest, openMode: boolean = DFD_OPEN_UAT_MODE): NextResponse | null {
  if (!dfdUatEnabled()) return NOT_FOUND();
  if (openMode) return null;
  if (!isOwnerRequest(req)) return NOT_FOUND();
  return null;
}
