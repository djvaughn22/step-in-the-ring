import { NextRequest, NextResponse } from "next/server";
import { getMemberStore } from "../../../members/store";
import { applyStripeEvent, getStripeGateway, readStripeConfig } from "../../../members/stripeCore";

export const runtime = "nodejs";

// The ONLY writer of paid entitlement. Signature verification is mandatory;
// unverifiable requests are rejected before anything is read. Handling is
// idempotent, so Stripe's retries are always safe.
export async function POST(req: NextRequest) {
  const store = await getMemberStore();
  const config = readStripeConfig();
  if (!store || !config.secretKeyPresent || !config.webhookSecret) {
    return NextResponse.json({ error: "unconfigured" }, { status: 503 });
  }
  const signature = req.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "missing signature" }, { status: 400 });

  const rawBody = await req.text();
  const gateway = await getStripeGateway(process.env.STRIPE_SECRET_KEY!);

  let event;
  try {
    event = gateway.verifyWebhook(rawBody, signature, config.webhookSecret);
  } catch {
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  const outcome = await applyStripeEvent(store, event);
  // Unhandled mapping problems return 200 with a note — Stripe retries are
  // for transient failures, not permanently unmappable events.
  return NextResponse.json(outcome, { status: 200 });
}
