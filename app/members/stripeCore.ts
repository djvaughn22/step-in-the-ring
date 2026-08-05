// ─────────────────────────────────────────────────────────────────────────────
// Stripe membership commerce — server-side only.
//
// One product, one price, one cadence (test-locked):
//   Step In The Ring Membership — $7.77 per month.
// No annual plan, no lifetime plan, no tiers, no trials, no discounts.
//
// Security rules (test-locked):
//   - Checkout Sessions are created ON THE SERVER for a signed-in account.
//   - Entitlement changes come ONLY from webhook events whose signature was
//     verified. Visiting a success URL grants nothing.
//   - Every event id is recorded first; replays and retries are no-ops
//     (idempotent).
//   - Secrets live in env vars; nothing here ships to the client bundle.
//
// The Stripe SDK is injected as a small gateway interface so every path is
// testable without network calls. The real gateway wraps the official
// `stripe` package.
// ─────────────────────────────────────────────────────────────────────────────

import type { MemberStore } from "./store";

export const CHECKOUT_SUCCESS_PATH = "/account?checkout=success";
export const CHECKOUT_CANCEL_PATH = "/membership?checkout=canceled";

export interface StripeConfig {
  secretKeyPresent: boolean;
  webhookSecret: string | null;
  priceId: string | null;
  /** Public origin for return URLs — the ONLY allowed redirect base. */
  appUrl: string | null;
  liveMode: boolean;
}

export function readStripeConfig(
  env: Record<string, string | undefined> = process.env,
): StripeConfig {
  const key = env.STRIPE_SECRET_KEY ?? "";
  return {
    secretKeyPresent: Boolean(key),
    webhookSecret: env.STRIPE_WEBHOOK_SECRET ?? null,
    priceId: env.STRIPE_PRICE_ID ?? null,
    appUrl: env.MEMBER_APP_URL ?? null,
    liveMode: key.startsWith("sk_live_"),
  };
}

export function stripeConfigured(config: StripeConfig): boolean {
  return (
    config.secretKeyPresent &&
    Boolean(config.webhookSecret) &&
    Boolean(config.priceId) &&
    Boolean(config.appUrl)
  );
}

/** The slice of Stripe this module uses — injectable for tests. */
export interface StripeGateway {
  createCheckoutSession(params: {
    priceId: string;
    customerEmail: string;
    clientReferenceId: string;
    successUrl: string;
    cancelUrl: string;
  }): Promise<{ url: string | null }>;
  createBillingPortalSession(params: {
    customerId: string;
    returnUrl: string;
  }): Promise<{ url: string | null }>;
  /** Throws when the signature is invalid — callers answer 400. */
  verifyWebhook(rawBody: string, signature: string, webhookSecret: string): StripeEventLike;
}

export interface StripeEventLike {
  id: string;
  type: string;
  data: { object: Record<string, unknown> };
}

let realGateway: StripeGateway | null = null;

/** Real gateway over the official SDK — lazy so builds don't need the key. */
export async function getStripeGateway(secretKey: string): Promise<StripeGateway> {
  if (realGateway) return realGateway;
  const { default: Stripe } = await import("stripe");
  const stripe = new Stripe(secretKey);
  realGateway = {
    async createCheckoutSession(p) {
      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        line_items: [{ price: p.priceId, quantity: 1 }],
        customer_email: p.customerEmail,
        client_reference_id: p.clientReferenceId,
        success_url: p.successUrl,
        cancel_url: p.cancelUrl,
        allow_promotion_codes: false,
      });
      return { url: session.url };
    },
    async createBillingPortalSession(p) {
      const session = await stripe.billingPortal.sessions.create({
        customer: p.customerId,
        return_url: p.returnUrl,
      });
      return { url: session.url };
    },
    verifyWebhook(rawBody, signature, webhookSecret) {
      return stripe.webhooks.constructEvent(rawBody, signature, webhookSecret) as unknown as StripeEventLike;
    },
  };
  return realGateway;
}

/**
 * Return-URL guard: only paths on the configured app origin are ever used.
 * Client-supplied URLs are ignored entirely — the allowlist is total.
 */
export function safeReturnUrl(appUrl: string, path: string): string {
  const base = new URL(appUrl);
  // Reject protocol-relative (//host), backslash tricks, and anything that
  // is not a plain same-origin path — then verify the constructed origin.
  const clean = /^\/(?![/\\])/.test(path) ? path : "/";
  const url = new URL(clean, base.origin);
  return url.origin === base.origin ? url.toString() : `${base.origin}/`;
}

// ── Checkout + portal ───────────────────────────────────────────────────────

export async function startCheckout(
  gateway: StripeGateway,
  config: StripeConfig,
  user: { id: string; email: string },
): Promise<{ ok: true; url: string } | { ok: false; error: string; status: number }> {
  if (!stripeConfigured(config)) {
    return { ok: false, error: "Billing is not live yet — membership is in private beta.", status: 503 };
  }
  const session = await gateway.createCheckoutSession({
    priceId: config.priceId!,
    customerEmail: user.email,
    clientReferenceId: user.id,
    successUrl: safeReturnUrl(config.appUrl!, CHECKOUT_SUCCESS_PATH),
    cancelUrl: safeReturnUrl(config.appUrl!, CHECKOUT_CANCEL_PATH),
  });
  if (!session.url) return { ok: false, error: "Checkout could not be started.", status: 502 };
  return { ok: true, url: session.url };
}

export async function openBillingPortal(
  gateway: StripeGateway,
  config: StripeConfig,
  store: MemberStore,
  userId: string,
): Promise<{ ok: true; url: string } | { ok: false; error: string; status: number }> {
  if (!stripeConfigured(config)) {
    return { ok: false, error: "Billing is not live yet.", status: 503 };
  }
  const entitlement = await store.getEntitlement(userId);
  if (!entitlement?.stripeCustomerId) {
    return { ok: false, error: "No billing record exists for this account.", status: 404 };
  }
  const session = await gateway.createBillingPortalSession({
    customerId: entitlement.stripeCustomerId,
    returnUrl: safeReturnUrl(config.appUrl!, "/account"),
  });
  if (!session.url) return { ok: false, error: "The billing portal could not be opened.", status: 502 };
  return { ok: true, url: session.url };
}

// ── Webhook processing — the only writer of paid entitlement ────────────────

function str(v: unknown): string | null {
  return typeof v === "string" && v ? v : null;
}

function periodEndIso(object: Record<string, unknown>): string | null {
  const raw = object.current_period_end;
  return typeof raw === "number" && raw > 0 ? new Date(raw * 1000).toISOString() : null;
}

export type WebhookOutcome =
  | { handled: true; action: string }
  | { handled: false; reason: string };

/**
 * Apply one verified Stripe event. The caller has already verified the
 * signature; this function enforces idempotency and maps events to
 * entitlement transitions. Unknown event types are acknowledged untouched.
 */
export async function applyStripeEvent(
  store: MemberStore,
  event: StripeEventLike,
  now: Date = new Date(),
): Promise<WebhookOutcome> {
  const fresh = await store.recordStripeEvent(event.id);
  if (!fresh) return { handled: true, action: "duplicate-ignored" };

  const object = event.data.object;
  const nowIso = now.toISOString();

  const upsertFor = async (
    userId: string,
    patch: Partial<Parameters<MemberStore["upsertEntitlement"]>[0]>,
  ) => {
    const existing = await store.getEntitlement(userId);
    await store.upsertEntitlement({
      userId,
      status: "free",
      source: "stripe",
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      currentPeriodEnd: null,
      testerCodeId: null,
      revokedAt: null,
      adminNotes: existing?.adminNotes ?? "",
      createdAt: existing?.createdAt ?? nowIso,
      ...existing,
      ...patch,
      updatedAt: nowIso,
    });
  };

  switch (event.type) {
    case "checkout.session.completed": {
      // Maps the Stripe customer to our account. client_reference_id was set
      // server-side at checkout creation — it is OUR user id, not client input.
      const userId = str(object.client_reference_id);
      const customerId = str(object.customer);
      if (!userId || !customerId) return { handled: false, reason: "missing mapping ids" };
      if (!(await store.getUserById(userId))) return { handled: false, reason: "unknown user" };
      await upsertFor(userId, { stripeCustomerId: customerId, source: "stripe" });
      return { handled: true, action: "customer-mapped" };
    }
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const customerId = str(object.customer);
      if (!customerId) return { handled: false, reason: "missing customer" };
      const entitlement = await store.getEntitlementByStripeCustomer(customerId);
      if (!entitlement) return { handled: false, reason: "unmapped customer" };
      const subStatus = str(object.status);
      const cancelAtPeriodEnd = object.cancel_at_period_end === true;
      const patch = {
        stripeSubscriptionId: str(object.id),
        currentPeriodEnd: periodEndIso(object),
        source: "stripe" as const,
      };
      if (subStatus === "active" || subStatus === "trialing") {
        await upsertFor(entitlement.userId, {
          ...patch,
          status: cancelAtPeriodEnd ? "canceled_active" : "active",
        });
        return { handled: true, action: cancelAtPeriodEnd ? "canceled-active" : "activated" };
      }
      if (subStatus === "past_due" || subStatus === "unpaid") {
        await upsertFor(entitlement.userId, { ...patch, status: "past_due" });
        return { handled: true, action: "past-due" };
      }
      if (subStatus === "canceled" || subStatus === "incomplete_expired") {
        await upsertFor(entitlement.userId, { ...patch, status: "expired" });
        return { handled: true, action: "expired" };
      }
      return { handled: true, action: `sub-status-${subStatus ?? "unknown"}-ignored` };
    }
    case "customer.subscription.deleted": {
      const customerId = str(object.customer);
      if (!customerId) return { handled: false, reason: "missing customer" };
      const entitlement = await store.getEntitlementByStripeCustomer(customerId);
      if (!entitlement) return { handled: false, reason: "unmapped customer" };
      // If the paid period still has time left, access runs to its end.
      const end = periodEndIso(object) ?? entitlement.currentPeriodEnd;
      const stillPaid = end !== null && new Date(end).getTime() > now.getTime();
      await upsertFor(entitlement.userId, {
        status: stillPaid ? "canceled_active" : "expired",
        currentPeriodEnd: end,
      });
      return { handled: true, action: stillPaid ? "canceled-active" : "expired" };
    }
    case "invoice.payment_failed": {
      const customerId = str(object.customer);
      if (!customerId) return { handled: false, reason: "missing customer" };
      const entitlement = await store.getEntitlementByStripeCustomer(customerId);
      if (!entitlement) return { handled: false, reason: "unmapped customer" };
      await upsertFor(entitlement.userId, { status: "past_due" });
      return { handled: true, action: "past-due" };
    }
    default:
      return { handled: true, action: "ignored" };
  }
}
