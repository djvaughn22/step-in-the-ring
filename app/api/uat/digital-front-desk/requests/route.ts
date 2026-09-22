// GET (list) is owner-only — it's the whole request queue, not one
// customer's own submission. POST (create) is the public customer-intake
// endpoint: a real customer never signs in to submit a request, so it is
// gated by the feature flag alone. See lib/apiGate.ts for the split.

import { NextRequest, NextResponse } from "next/server";
import { dfdFlagGate, dfdOwnerGate } from "../../../../uat/digital-front-desk/lib/apiGate";
import { validateIntake, generateConfirmationNumber } from "../../../../uat/digital-front-desk/lib/domain";
import { addRequest, listRequests } from "../../../../uat/digital-front-desk/lib/store";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const denied = dfdOwnerGate(req);
  if (denied) return denied;
  return NextResponse.json({ ok: true, requests: listRequests() });
}

export async function POST(req: NextRequest) {
  const denied = dfdFlagGate();
  if (denied) return denied;

  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, errors: ["Bad request."] }, { status: 400 });
  }

  const result = validateIntake({
    customerName: body.customerName,
    customerEmail: body.customerEmail,
    customerPhone: body.customerPhone,
    serviceArea: body.serviceArea,
    serviceId: body.serviceId,
    description: body.description,
    urgency: body.urgency,
    preferredContact: body.preferredContact,
    consentToUpdates: body.consentToUpdates,
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, errors: result.errors }, { status: 422 });
  }

  // The response echoes back only what the caller just submitted — never
  // another customer's data, and never the internal request queue. A
  // confirmation number is not a lookup credential: there is no public
  // GET-by-id or GET-by-confirmation-number route.
  const request = addRequest(result.value, generateConfirmationNumber());
  return NextResponse.json({ ok: true, request });
}
