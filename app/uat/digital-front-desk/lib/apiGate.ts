// Shared gates for every Digital Front Desk API route.
//
// A Digital Front Desk is only useful if a real customer can reach it
// without an account — so, by product correction, the split here is
// deliberate and asymmetric:
//
//   dfdFlagGate()   — feature flag only. For the customer-facing surface:
//                     the public intake POST. A real customer never signs
//                     in to submit a request, in production or in this UAT.
//   dfdOwnerGate()  — feature flag AND the real owner session. For every
//                     operational surface: listing/reading requests,
//                     status/assignment/notes/next-action changes, the
//                     onboarding-preview lead list, and all of Admin.
//
// Both fail closed the same way — a generic 404, no distinct "wrong
// password" signal — so a route that picks the wrong one either leaks
// customer data to the internet or locks out real customers; there is no
// quiet middle failure mode. See docs/DIGITAL_FRONT_DESK_UAT.md for the
// full access-model table.

import { NextRequest, NextResponse } from "next/server";
import { isOwnerRequest } from "../../../owner/session";
import { dfdUatEnabled } from "./flag";

const NOT_FOUND = () => NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });

/** Feature flag only — for the public customer-intake POST. Never gate
 * anything that reads existing requests or changes their state with this. */
export function dfdFlagGate(): NextResponse | null {
  if (!dfdUatEnabled()) return NOT_FOUND();
  return null;
}

/** Feature flag AND the real owner session — for every operational route. */
export function dfdOwnerGate(req: NextRequest): NextResponse | null {
  if (!dfdUatEnabled() || !isOwnerRequest(req)) return NOT_FOUND();
  return null;
}
