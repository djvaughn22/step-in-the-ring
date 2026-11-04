// The kit's money rules, exercised through a fake Stripe gateway. Nothing here
// touches the network; the real gateway is a thin wrapper over the same
// kitCheckoutParams() and mapStripeSession() tested below.

import { describe, expect, it, vi } from "vitest";
import { KIT_ID, KIT_PRICE_CENTS } from "./kit";
import {
  checkKitAccess,
  kitCheckoutParams,
  kitLinkFor,
  kitSalesOpen,
  looksLikeSessionId,
  mapStripeSession,
  readKitConfig,
  startKitCheckout,
  type KitGateway,
  type KitPrice,
  type KitSession,
} from "./kitStripe";

const SID = "cs_test_a1B2c3D4e5F6g7H8i9J0";
const OPEN_ENV = {
  SITR_KIT_SALES: "open",
  STRIPE_SECRET_KEY: "sk_test_x",
  STRIPE_KIT_PRICE_ID: "price_kit",
  MEMBER_APP_URL: "https://stepinthering.com",
};

const goodPrice: KitPrice = { id: "price_kit", active: true, type: "one_time", unitAmount: KIT_PRICE_CENTS, currency: "usd" };

function paidSession(over: Partial<KitSession> = {}): KitSession {
  return { id: SID, mode: "payment", status: "complete", paymentStatus: "paid", product: KIT_ID, email: "buyer@example.com", refunded: false, disputed: false, ...over };
}

function fakeGateway(over: Partial<KitGateway> = {}): KitGateway & { created: unknown[] } {
  const created: unknown[] = [];
  return {
    created,
    retrievePrice: vi.fn(async () => goodPrice),
    createCheckoutSession: vi.fn(async (p) => {
      created.push(p);
      return { url: "https://checkout.stripe.com/c/pay/cs_test_x" };
    }),
    retrieveSession: vi.fn(async () => paidSession()),
    ...over,
  };
}

const fileThere = async () => true;

describe("sales switch", () => {
  it("stays closed unless the owner sets SITR_KIT_SALES=open and Stripe is configured", () => {
    expect(kitSalesOpen(readKitConfig({}))).toBe(false);
    expect(kitSalesOpen(readKitConfig({ ...OPEN_ENV, SITR_KIT_SALES: "" }))).toBe(false);
    expect(kitSalesOpen(readKitConfig({ ...OPEN_ENV, SITR_KIT_SALES: "yes" }))).toBe(false);
    expect(kitSalesOpen(readKitConfig({ ...OPEN_ENV, STRIPE_SECRET_KEY: "" }))).toBe(false);
    expect(kitSalesOpen(readKitConfig({ ...OPEN_ENV, STRIPE_KIT_PRICE_ID: "" }))).toBe(false);
    expect(kitSalesOpen(readKitConfig({ ...OPEN_ENV, MEMBER_APP_URL: "" }))).toBe(false);
    expect(kitSalesOpen(readKitConfig(OPEN_ENV))).toBe(true);
  });
});

describe("starting a checkout", () => {
  it("does nothing at all while sales are closed", async () => {
    const g = fakeGateway();
    const r = await startKitCheckout(g, readKitConfig({ ...OPEN_ENV, SITR_KIT_SALES: "" }), fileThere);
    expect(r).toEqual({ ok: false, reason: "closed" });
    expect(g.retrievePrice).not.toHaveBeenCalled();
    expect(g.createCheckoutSession).not.toHaveBeenCalled();
  });

  it("never takes a payment when the kit file isn't uploaded", async () => {
    const g = fakeGateway();
    const r = await startKitCheckout(g, readKitConfig(OPEN_ENV), async () => false);
    expect(r).toEqual({ ok: false, reason: "no-file" });
    expect(g.createCheckoutSession).not.toHaveBeenCalled();
  });

  it.each([
    ["a recurring price (a subscription)", { type: "recurring" }],
    ["an archived price", { active: false }],
    ["a different amount from the page", { unitAmount: KIT_PRICE_CENTS + 100 }],
    ["another currency", { currency: "eur" }],
    ["a price with no fixed amount", { unitAmount: null }],
  ])("refuses %s", async (_label, over) => {
    const g = fakeGateway({ retrievePrice: vi.fn(async () => ({ ...goodPrice, ...over })) });
    const r = await startKitCheckout(g, readKitConfig(OPEN_ENV), fileThere);
    expect(r).toEqual({ ok: false, reason: "price-mismatch" });
    expect(g.createCheckoutSession).not.toHaveBeenCalled();
  });

  it("opens a one-payment checkout for exactly one kit", async () => {
    const g = fakeGateway();
    const r = await startKitCheckout(g, readKitConfig(OPEN_ENV), fileThere);
    expect(r).toEqual({ ok: true, url: "https://checkout.stripe.com/c/pay/cs_test_x" });
    expect(g.created).toEqual([kitCheckoutParams("price_kit", "https://stepinthering.com")]);
  });

  it("reports a Stripe failure instead of throwing", async () => {
    const g = fakeGateway({ createCheckoutSession: vi.fn(async () => { throw new Error("network"); }) });
    expect(await startKitCheckout(g, readKitConfig(OPEN_ENV), fileThere)).toEqual({ ok: false, reason: "stripe-error" });
    const noUrl = fakeGateway({ createCheckoutSession: vi.fn(async () => ({ url: null })) });
    expect(await startKitCheckout(noUrl, readKitConfig(OPEN_ENV), fileThere)).toEqual({ ok: false, reason: "stripe-error" });
  });
});

describe("what Stripe is told", () => {
  const p = kitCheckoutParams("price_kit", "https://stepinthering.com/some/path?x=1");

  it("is a single payment, never a subscription", () => {
    expect(p.mode).toBe("payment");
    expect(p.line_items).toEqual([{ price: "price_kit", quantity: 1 }]);
    expect(JSON.stringify(p)).not.toMatch(/subscription_data|recurring|trial/);
    expect(p.allow_promotion_codes).toBe(false);
    expect(p.payment_method_types).toEqual(["card"]);
  });

  it("tags the session so only kit purchases can ever open a kit", () => {
    expect(p.metadata).toEqual({ product: KIT_ID });
    expect(p.payment_intent_data.metadata).toEqual({ product: KIT_ID });
  });

  it("returns buyers to this site's own origin, with Stripe's placeholder left literal", () => {
    expect(p.success_url).toBe("https://stepinthering.com/kit/open?session_id={CHECKOUT_SESSION_ID}");
    expect(p.cancel_url).toBe("https://stepinthering.com/products/ready-to-build?checkout=canceled#kit");
  });
});

describe("checking a purchase", () => {
  it("rejects anything that isn't a Checkout Session id without calling Stripe", async () => {
    const g = fakeGateway();
    for (const bad of [undefined, "", "cs_live_", "pi_123456789", "cs_test_abc def", `${SID}"><script>`, 42]) {
      expect(await checkKitAccess(g, bad)).toEqual({ state: "invalid" });
    }
    expect(g.retrieveSession).not.toHaveBeenCalled();
    expect(looksLikeSessionId(SID)).toBe(true);
  });

  it("opens the kit for a paid kit purchase", async () => {
    expect(await checkKitAccess(fakeGateway(), SID)).toEqual({ state: "paid", sessionId: SID, email: "buyer@example.com" });
  });

  it.each([
    ["an unknown session", null],
    ["another product's checkout", paidSession({ product: "something-else" })],
    ["a session with no product tag", paidSession({ product: null })],
    ["a subscription checkout", paidSession({ mode: "subscription" })],
    ["an abandoned checkout", paidSession({ status: "open", paymentStatus: "unpaid" })],
    ["an expired checkout", paidSession({ status: "expired", paymentStatus: "unpaid" })],
    ["a session id that doesn't match", paidSession({ id: "cs_test_someoneelse123" })],
  ])("keeps the kit closed for %s", async (_label, session) => {
    expect(await checkKitAccess(fakeGateway({ retrieveSession: vi.fn(async () => session) }), SID)).toEqual({ state: "invalid" });
  });

  it("closes the kit after a refund or a dispute", async () => {
    for (const over of [{ refunded: true }, { disputed: true }]) {
      const g = fakeGateway({ retrieveSession: vi.fn(async () => paidSession(over)) });
      expect(await checkKitAccess(g, SID)).toEqual({ state: "refunded" });
    }
  });

  it("says a completed but unsettled payment is still processing", async () => {
    const g = fakeGateway({ retrieveSession: vi.fn(async () => paidSession({ paymentStatus: "unpaid" })) });
    expect(await checkKitAccess(g, SID)).toEqual({ state: "processing", sessionId: SID });
  });

  it("says Stripe is unreachable rather than calling a buyer's purchase invalid", async () => {
    const g = fakeGateway({ retrieveSession: vi.fn(async () => { throw new Error("timeout"); }) });
    expect(await checkKitAccess(g, SID)).toEqual({ state: "unavailable" });
  });
});

describe("reading Stripe's session object", () => {
  it("reads refunds and disputes from the expanded charge", () => {
    const s = mapStripeSession({
      id: SID,
      mode: "payment",
      status: "complete",
      payment_status: "paid",
      metadata: { product: KIT_ID },
      customer_details: { email: "buyer@example.com" },
      payment_intent: { id: "pi_1", latest_charge: { id: "ch_1", refunded: true, disputed: false } },
    });
    expect(s).toEqual(paidSession({ refunded: true }));
  });

  it("treats an unexpanded or missing charge as not refunded", () => {
    const s = mapStripeSession({ id: SID, mode: "payment", status: "complete", payment_status: "paid", metadata: { product: KIT_ID }, payment_intent: "pi_1" });
    expect(s.refunded).toBe(false);
    expect(s.disputed).toBe(false);
    expect(s.email).toBeNull();
  });
});

describe("the buyer's kit link", () => {
  it("points at /kit/open on the site's origin", () => {
    expect(kitLinkFor("https://stepinthering.com/", SID)).toBe(`https://stepinthering.com/kit/open?session_id=${SID}`);
  });
});
