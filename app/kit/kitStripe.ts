// ─────────────────────────────────────────────────────────────────────────────
// Ready to Build Kit commerce — server-side only.
//
// Rules (test-locked in kitStripe.test.ts):
//   - Checkout is Stripe Checkout in "payment" mode: one line item, one
//     payment. A Stripe price that is recurring, inactive, in another
//     currency or a different amount from KIT_PRICE_CENTS is refused, so a
//     dashboard slip can never turn this into a subscription or a surprise.
//   - Cards only (Apple Pay and Google Pay ride on cards). Methods that settle
//     days later would need webhooks to finish; instant payment keeps the
//     whole flow on one page load.
//   - Access is never stored here. The Checkout Session id is the purchase
//     record: every check asks Stripe whether that session was paid for this
//     product and not refunded or disputed. Visiting a success URL grants
//     nothing by itself.
//   - Secrets stay in env vars and never reach the client bundle.
//
// The Stripe SDK sits behind a small gateway so every path is testable
// without network calls, the same pattern as app/members/stripeCore.ts.
// ─────────────────────────────────────────────────────────────────────────────

import { KIT_CURRENCY, KIT_ID, KIT_NAME, KIT_PRICE_CENTS } from "./kit";

export const KIT_COOKIE = "sitr-kit";
/** The cookie only travels to /kit, /kit/open and /kit/download. */
export const KIT_COOKIE_PATH = "/kit";
export const KIT_COOKIE_MAX_AGE_S = 365 * 24 * 60 * 60;

export const KIT_SUCCESS_PATH = "/kit/open?session_id={CHECKOUT_SESSION_ID}";
export const KIT_CANCEL_PATH = "/products/ready-to-build?checkout=canceled#kit";

export interface KitConfig {
  /** The owner's switch: SITR_KIT_SALES=open. Anything else keeps sales closed. */
  salesSwitch: boolean;
  secretKey: string | null;
  priceId: string | null;
  /** Public origin for return URLs — the ONLY redirect base Stripe is given. */
  appUrl: string | null;
}

export function readKitConfig(env: Record<string, string | undefined> = process.env): KitConfig {
  return {
    salesSwitch: (env.SITR_KIT_SALES ?? "").trim() === "open",
    secretKey: env.STRIPE_SECRET_KEY || null,
    priceId: env.STRIPE_KIT_PRICE_ID || null,
    appUrl: env.MEMBER_APP_URL || null,
  };
}

/** The product page shows the offer only when this is true. */
export function kitSalesOpen(config: KitConfig): boolean {
  return config.salesSwitch && Boolean(config.secretKey && config.priceId && config.appUrl);
}

/** Checking an existing purchase needs only the key, so buyers keep access
 *  even after the owner closes sales. */
export function kitChecksReady(config: KitConfig): boolean {
  return Boolean(config.secretKey);
}

export function siteOrigin(appUrl: string): string {
  return new URL(appUrl).origin;
}

/** The buyer's own way back in. Works on any device for as long as the
 *  purchase stands. */
export function kitLinkFor(appUrl: string, sessionId: string): string {
  return `${siteOrigin(appUrl)}/kit/open?session_id=${encodeURIComponent(sessionId)}`;
}

const SESSION_ID = /^cs_(test|live)_[A-Za-z0-9]{8,250}$/;

export function looksLikeSessionId(value: unknown): value is string {
  return typeof value === "string" && SESSION_ID.test(value);
}

// ── The slice of Stripe this module uses ────────────────────────────────────

export interface KitPrice {
  id: string;
  active: boolean;
  /** "one_time" or "recurring" */
  type: string;
  unitAmount: number | null;
  currency: string;
}

export interface KitSession {
  id: string;
  mode: string;
  /** "open" | "complete" | "expired" */
  status: string | null;
  /** "paid" | "unpaid" | "no_payment_required" */
  paymentStatus: string;
  product: string | null;
  email: string | null;
  refunded: boolean;
  disputed: boolean;
}

export interface KitCheckoutParams {
  mode: "payment";
  line_items: { price: string; quantity: 1 }[];
  payment_method_types: ["card"];
  submit_type: "pay";
  allow_promotion_codes: false;
  success_url: string;
  cancel_url: string;
  metadata: { product: string };
  payment_intent_data: { description: string; metadata: { product: string } };
  custom_text: { submit: { message: string } };
}

export interface KitGateway {
  retrievePrice(priceId: string): Promise<KitPrice>;
  createCheckoutSession(params: KitCheckoutParams): Promise<{ url: string | null }>;
  /** null when Stripe has no such session. Throws on any other failure. */
  retrieveSession(sessionId: string): Promise<KitSession | null>;
}

/** Everything Stripe is told when a checkout starts, in one pure function. */
export function kitCheckoutParams(priceId: string, appUrl: string): KitCheckoutParams {
  const origin = siteOrigin(appUrl);
  return {
    mode: "payment",
    line_items: [{ price: priceId, quantity: 1 }],
    payment_method_types: ["card"],
    submit_type: "pay",
    allow_promotion_codes: false,
    // String concatenation on purpose: URL() would encode the braces and
    // Stripe would no longer fill in the session id.
    success_url: `${origin}${KIT_SUCCESS_PATH}`,
    cancel_url: `${origin}${KIT_CANCEL_PATH}`,
    metadata: { product: KIT_ID },
    payment_intent_data: { description: KIT_NAME, metadata: { product: KIT_ID } },
    custom_text: {
      submit: {
        message: "One payment, no subscription. After you pay, you go straight to your kit page to download it.",
      },
    },
  };
}

type Obj = Record<string, unknown>;

function obj(v: unknown): Obj | null {
  return v && typeof v === "object" ? (v as Obj) : null;
}

function text(v: unknown): string | null {
  return typeof v === "string" && v ? v : null;
}

/** Reads a retrieved Checkout Session (payment_intent.latest_charge expanded). */
export function mapStripeSession(raw: Obj): KitSession {
  const charge = obj(obj(raw.payment_intent)?.latest_charge);
  return {
    id: text(raw.id) ?? "",
    mode: text(raw.mode) ?? "",
    status: text(raw.status),
    paymentStatus: text(raw.payment_status) ?? "",
    product: text(obj(raw.metadata)?.product),
    email: text(obj(raw.customer_details)?.email),
    refunded: charge?.refunded === true,
    disputed: charge?.disputed === true,
  };
}

let realGateway: { key: string; gateway: KitGateway } | null = null;

/** Real gateway over the official SDK — lazy so builds don't need the key. */
export async function getKitGateway(secretKey: string): Promise<KitGateway> {
  if (realGateway?.key === secretKey) return realGateway.gateway;
  const { default: Stripe } = await import("stripe");
  const stripe = new Stripe(secretKey);
  const gateway: KitGateway = {
    async retrievePrice(priceId) {
      const p = await stripe.prices.retrieve(priceId);
      return { id: p.id, active: p.active, type: p.type, unitAmount: p.unit_amount, currency: p.currency };
    },
    async createCheckoutSession(params) {
      const session = await stripe.checkout.sessions.create(params);
      return { url: session.url };
    },
    async retrieveSession(sessionId) {
      try {
        const s = await stripe.checkout.sessions.retrieve(sessionId, { expand: ["payment_intent.latest_charge"] });
        return mapStripeSession(s as unknown as Obj);
      } catch (err) {
        if (obj(err)?.code === "resource_missing") return null;
        throw err;
      }
    },
  };
  realGateway = { key: secretKey, gateway };
  return gateway;
}

// ── Starting a checkout ─────────────────────────────────────────────────────

export type KitCheckoutResult =
  | { ok: true; url: string }
  | { ok: false; reason: "closed" | "no-file" | "price-mismatch" | "stripe-error" };

/** True when the Stripe price is exactly the one-time price this site shows. */
export function priceMatchesKit(price: KitPrice): boolean {
  return (
    price.active &&
    price.type === "one_time" &&
    price.unitAmount === KIT_PRICE_CENTS &&
    price.currency.toLowerCase() === KIT_CURRENCY
  );
}

export async function startKitCheckout(
  gateway: KitGateway,
  config: KitConfig,
  fileReady: () => Promise<boolean>,
): Promise<KitCheckoutResult> {
  if (!kitSalesOpen(config)) return { ok: false, reason: "closed" };
  // Never take a payment for a file that isn't there to download.
  if (!(await fileReady())) return { ok: false, reason: "no-file" };
  try {
    const price = await gateway.retrievePrice(config.priceId!);
    if (!priceMatchesKit(price)) return { ok: false, reason: "price-mismatch" };
    const session = await gateway.createCheckoutSession(kitCheckoutParams(config.priceId!, config.appUrl!));
    return session.url ? { ok: true, url: session.url } : { ok: false, reason: "stripe-error" };
  } catch {
    return { ok: false, reason: "stripe-error" };
  }
}

// ── Checking a purchase ─────────────────────────────────────────────────────

export type KitAccess =
  | { state: "paid"; sessionId: string; email: string | null }
  | { state: "processing"; sessionId: string }
  | { state: "refunded" }
  | { state: "invalid" }
  | { state: "unavailable" };

export async function checkKitAccess(gateway: KitGateway, sessionId: unknown): Promise<KitAccess> {
  if (!looksLikeSessionId(sessionId)) return { state: "invalid" };
  let session: KitSession | null;
  try {
    session = await gateway.retrieveSession(sessionId);
  } catch {
    return { state: "unavailable" };
  }
  if (!session || session.id !== sessionId) return { state: "invalid" };
  if (session.product !== KIT_ID || session.mode !== "payment" || session.status !== "complete") {
    return { state: "invalid" };
  }
  if (session.refunded || session.disputed) return { state: "refunded" };
  if (session.paymentStatus === "paid" || session.paymentStatus === "no_payment_required") {
    return { state: "paid", sessionId, email: session.email };
  }
  if (session.paymentStatus === "unpaid") return { state: "processing", sessionId };
  return { state: "invalid" };
}

/** Convenience for routes and the kit page: config → gateway → check. */
export async function checkKitAccessFromEnv(sessionId: unknown): Promise<KitAccess> {
  const config = readKitConfig();
  if (!kitChecksReady(config)) return { state: "unavailable" };
  if (!looksLikeSessionId(sessionId)) return { state: "invalid" };
  const gateway = await getKitGateway(config.secretKey!);
  return checkKitAccess(gateway, sessionId);
}

export function kitCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: KIT_COOKIE_PATH,
    maxAge: KIT_COOKIE_MAX_AGE_S,
  };
}
