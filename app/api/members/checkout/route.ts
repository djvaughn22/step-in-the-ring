import { NextRequest, NextResponse } from "next/server";
import { memberFromRequest } from "../../../members/session";
import { getMemberStore } from "../../../members/store";
import {
  getStripeGateway,
  readStripeConfig,
  startCheckout,
  stripeConfigured,
} from "../../../members/stripeCore";

export const runtime = "nodejs";

// Server-created Stripe Checkout for the signed-in account. The browser
// receives only a redirect URL — price, product, and account mapping are
// decided here, never client-side.
export async function POST(req: NextRequest) {
  const store = await getMemberStore();
  const config = readStripeConfig();
  if (!store || !stripeConfigured(config)) {
    return NextResponse.json(
      { ok: false, error: "Billing is not live yet — membership is in private beta." },
      { status: 503 },
    );
  }
  const ctx = await memberFromRequest(req);
  if (!ctx) return NextResponse.json({ ok: false, error: "Sign in first." }, { status: 401 });

  const gateway = await getStripeGateway(process.env.STRIPE_SECRET_KEY!);
  const result = await startCheckout(gateway, config, { id: ctx.user.id, email: ctx.user.email });
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
  }
  try {
    await store.recordEvent({ event: "checkout-start", source: "", createdAt: new Date().toISOString() });
  } catch {
    // analytics must never break checkout
  }
  return NextResponse.json({ ok: true, url: result.url });
}
