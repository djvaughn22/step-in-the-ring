import { NextRequest, NextResponse } from "next/server";
import { memberFromRequest } from "../../../members/session";
import { getMemberStore } from "../../../members/store";
import { getStripeGateway, openBillingPortal, readStripeConfig } from "../../../members/stripeCore";

export const runtime = "nodejs";

// Billing Portal for the signed-in account only — the customer id comes from
// the account's own entitlement record, never from the request.
export async function POST(req: NextRequest) {
  const store = await getMemberStore();
  if (!store) return NextResponse.json({ ok: false, error: "Not available." }, { status: 503 });
  const ctx = await memberFromRequest(req);
  if (!ctx) return NextResponse.json({ ok: false, error: "Sign in first." }, { status: 401 });

  const config = readStripeConfig();
  if (!config.secretKeyPresent) {
    return NextResponse.json({ ok: false, error: "Billing is not live yet." }, { status: 503 });
  }
  const gateway = await getStripeGateway(process.env.STRIPE_SECRET_KEY!);
  const result = await openBillingPortal(gateway, config, store, ctx.user.id);
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
  }
  return NextResponse.json({ ok: true, url: result.url });
}
