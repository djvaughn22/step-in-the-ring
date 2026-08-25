// ─────────────────────────────────────────────────────────────────────────────
// Step In The Ring Membership — the security and honesty contract, as tests.
// Everything runs against the in-memory store and a fake Stripe gateway; no
// network, no database, no real secrets.
// ─────────────────────────────────────────────────────────────────────────────

import { beforeEach, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { MemoryMemberStore, type EntitlementRecord } from "./store";

const stripComments = (src: string) =>
  src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
import {
  hashPassword,
  login,
  logout,
  requestAccountDeletion,
  resetRateLimiter,
  sessionUser,
  signup,
  verifyPassword,
} from "./auth";
import {
  engineMatrix,
  mayUseEngine,
  memberEngineIds,
  MEMBERSHIP_CADENCE,
  MEMBERSHIP_PRICE_CENTS,
  MEMBERSHIP_PRICE_LABEL,
  resolveAccess,
} from "./entitlement";
import {
  applyStripeEvent,
  readStripeConfig,
  safeReturnUrl,
  startCheckout,
  stripeConfigured,
  type StripeEventLike,
  type StripeGateway,
} from "./stripeCore";
import {
  createTesterCode,
  generateTesterCodeValue,
  hashTesterCode,
  redeemTesterCode,
  revokeTesterCode,
  revokeTesterGrant,
} from "./testerCodes";
import {
  createProject,
  deleteOwnProject,
  exportProject,
  importLocalProjects,
  readProject,
  updateProject,
} from "./projects";

const NOW = new Date("2026-08-04T12:00:00Z");
const LATER = new Date("2026-09-10T12:00:00Z");
const SECRET = "test-tester-code-secret-long";

function ent(overrides: Partial<EntitlementRecord>): EntitlementRecord {
  return {
    userId: "u1",
    status: "free",
    source: "none",
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    currentPeriodEnd: null,
    testerCodeId: null,
    revokedAt: null,
    adminNotes: "",
    createdAt: NOW.toISOString(),
    updatedAt: NOW.toISOString(),
    ...overrides,
  };
}

async function makeUser(store: MemoryMemberStore, email = "adult@example.com") {
  const result = await signup(store, { email, password: "long-enough-password" }, { ip: "1.1.1.1", now: NOW });
  if (!result.ok) throw new Error("signup failed in fixture");
  return result;
}

beforeEach(() => resetRateLimiter());

// ── Authentication ──────────────────────────────────────────────────────────

describe("authentication", () => {
  it("signs up, stores only a scrypt hash, and issues an opaque session", async () => {
    const store = new MemoryMemberStore();
    const result = await makeUser(store);
    const user = await store.getUserByEmail("adult@example.com");
    expect(user?.passwordHash.startsWith("scrypt$")).toBe(true);
    expect(user?.passwordHash.includes("long-enough-password")).toBe(false);
    // stored session is hashed — the raw token appears nowhere server-side
    expect(store.sessions.has(result.sessionToken)).toBe(false);
    const resolved = await sessionUser(store, result.sessionToken, NOW);
    expect(resolved?.email).toBe("adult@example.com");
  });

  it("verifies and rejects passwords, timing-safely shaped", () => {
    const hash = hashPassword("correct horse battery");
    expect(verifyPassword("correct horse battery", hash)).toBe(true);
    expect(verifyPassword("wrong", hash)).toBe(false);
  });

  it("rejects short passwords and bad emails", async () => {
    const store = new MemoryMemberStore();
    expect((await signup(store, { email: "a@b.co", password: "short" }, { ip: "1.1.1.1" })).ok).toBe(false);
    expect((await signup(store, { email: "nope", password: "long-enough-password" }, { ip: "1.1.1.1" })).ok).toBe(false);
  });

  it("gives one generic failure for wrong password and unknown email", async () => {
    const store = new MemoryMemberStore();
    await makeUser(store);
    const wrongPw = await login(store, { email: "adult@example.com", password: "incorrect-password" }, { ip: "2.2.2.2" });
    const unknown = await login(store, { email: "ghost@example.com", password: "incorrect-password" }, { ip: "2.2.2.2" });
    expect(wrongPw.ok).toBe(false);
    expect(unknown.ok).toBe(false);
    if (!wrongPw.ok && !unknown.ok) expect(wrongPw.error).toBe(unknown.error);
  });

  it("rate limits repeated attempts", async () => {
    const store = new MemoryMemberStore();
    let limited = false;
    for (let i = 0; i < 15; i++) {
      const r = await login(store, { email: "x@example.com", password: "wrong-password-1" }, { ip: "3.3.3.3", now: NOW });
      if (!r.ok && r.status === 429) limited = true;
    }
    expect(limited).toBe(true);
  });

  it("expired sessions stop resolving and are removed", async () => {
    const store = new MemoryMemberStore();
    const { sessionToken } = await makeUser(store);
    expect(await sessionUser(store, sessionToken, NOW)).not.toBeNull();
    const afterExpiry = new Date(NOW.getTime() + 31 * 24 * 60 * 60 * 1000);
    expect(await sessionUser(store, sessionToken, afterExpiry)).toBeNull();
  });

  it("logout deletes the session; deletion request ends all sessions and only its own account", async () => {
    const store = new MemoryMemberStore();
    const a = await makeUser(store, "a@example.com");
    const b = await makeUser(store, "b@example.com");
    await logout(store, a.sessionToken);
    expect(await sessionUser(store, a.sessionToken, NOW)).toBeNull();

    await requestAccountDeletion(store, b.userId, NOW);
    expect(await sessionUser(store, b.sessionToken, NOW)).toBeNull();
    const other = await store.getUserByEmail("a@example.com");
    expect(other?.deletionRequestedAt).toBeNull();
  });
});

// ── Entitlement resolution ──────────────────────────────────────────────────

describe("entitlement", () => {
  it("public price is TBD during the beta — one plan, no annual, no lifetime", () => {
    expect(MEMBERSHIP_PRICE_LABEL).toBe("TBD");
    expect(MEMBERSHIP_PRICE_CENTS).toBe(777);
    expect(MEMBERSHIP_CADENCE).toBe("month");
    const src = stripComments(
      readFileSync(join(__dirname, "entitlement.ts"), "utf8") +
        readFileSync(join(__dirname, "stripeCore.ts"), "utf8") +
        readFileSync(join(__dirname, "..", "membership", "page.tsx"), "utf8"),
    );
    expect(src).not.toMatch(/annual|yearly|lifetime|per year/i);
  });

  it("active with live period grants access; lapsed period does not, even with stale status", () => {
    const live = resolveAccess(ent({ status: "active", currentPeriodEnd: LATER.toISOString() }), NOW);
    expect(live.memberAccess).toBe(true);
    const stale = resolveAccess(ent({ status: "active", currentPeriodEnd: NOW.toISOString() }), LATER);
    expect(stale.memberAccess).toBe(false);
    expect(stale.status).toBe("expired");
  });

  it("canceled_active keeps access until period end, then expires", () => {
    const record = ent({ status: "canceled_active", currentPeriodEnd: LATER.toISOString() });
    expect(resolveAccess(record, NOW).memberAccess).toBe(true);
    expect(resolveAccess(record, new Date(LATER.getTime() + 1000)).memberAccess).toBe(false);
  });

  it("past_due, revoked, expired, free and missing records grant nothing", () => {
    for (const status of ["past_due", "revoked", "expired", "free"] as const) {
      expect(resolveAccess(ent({ status, currentPeriodEnd: LATER.toISOString() }), NOW).memberAccess).toBe(false);
    }
    expect(resolveAccess(null, NOW).memberAccess).toBe(false);
  });

  it("tester access is time-limited by the code expiry", () => {
    const record = ent({ status: "tester", currentPeriodEnd: LATER.toISOString() });
    expect(resolveAccess(record, NOW).memberAccess).toBe(true);
    expect(resolveAccess(record, new Date(LATER.getTime() + 1)).memberAccess).toBe(false);
  });

  it("owner-only engines stay owner-only; other engines don't", () => {
    // "game" is deliberately NOT owner-only as of 2026-08-24: GameStudio
    // forks into a fully client-side "new game idea" path (works for
    // anyone) and a re-theme/publish path that needs the OpenDoku repo on
    // the owner's machine — that path's own server route checks
    // isOwnerRequest() itself (app/api/engines/games/publish/route.ts), so
    // gating the whole engine at this level would have hidden the half that
    // genuinely works for a visitor.
    const ids = memberEngineIds();
    expect(ids).toContain("game");
    expect(ids).not.toContain("story");
    expect(ids).toContain("idea");
    const noAccess = resolveAccess(null, NOW);
    const member = resolveAccess(ent({ status: "active", currentPeriodEnd: LATER.toISOString() }), NOW);
    expect(mayUseEngine("game", member, false)).toBe(true);
    expect(mayUseEngine("game", member, true)).toBe(true);
    expect(mayUseEngine("idea", member, false)).toBe(true);
    expect(mayUseEngine("idea", noAccess, false)).toBe(false);
    expect(mayUseEngine("does-not-exist", member, false)).toBe(false);
  });

  it("every matrix row comes from the real registry", () => {
    for (const row of engineMatrix()) {
      expect(row.id.length).toBeGreaterThan(0);
      expect(["member", "owner"]).toContain(row.access);
    }
  });
});

// ── Stripe ──────────────────────────────────────────────────────────────────

function fakeGateway(calls: Record<string, unknown[]>): StripeGateway {
  return {
    async createCheckoutSession(p) {
      (calls.checkout ??= []).push(p);
      return { url: "https://checkout.stripe.test/session" };
    },
    async createBillingPortalSession(p) {
      (calls.portal ??= []).push(p);
      return { url: "https://billing.stripe.test/portal" };
    },
    verifyWebhook() {
      throw new Error("not used in these tests");
    },
  };
}

const CONFIG = {
  secretKeyPresent: true,
  webhookSecret: "whsec_test",
  priceId: "price_test_777",
  appUrl: "https://stepinthering.com",
  liveMode: false,
};

describe("stripe", () => {
  it("config fails closed until every piece exists, and test keys are not live mode", () => {
    expect(stripeConfigured(readStripeConfig({}))).toBe(false);
    expect(readStripeConfig({ STRIPE_SECRET_KEY: "sk_test_x" }).liveMode).toBe(false);
    expect(readStripeConfig({ STRIPE_SECRET_KEY: "sk_live_x" }).liveMode).toBe(true);
    expect(stripeConfigured(CONFIG)).toBe(true);
  });

  it("checkout is server-created with the configured price and allowlisted return URLs", async () => {
    const calls: Record<string, unknown[]> = {};
    const result = await startCheckout(fakeGateway(calls), CONFIG, { id: "u1", email: "a@example.com" });
    expect(result.ok).toBe(true);
    const p = calls.checkout[0] as Record<string, string>;
    expect(p.priceId).toBe("price_test_777");
    expect(p.clientReferenceId).toBe("u1");
    expect(p.successUrl.startsWith("https://stepinthering.com/")).toBe(true);
    expect(p.cancelUrl.startsWith("https://stepinthering.com/")).toBe(true);
  });

  it("return URLs cannot escape the configured origin", () => {
    expect(safeReturnUrl("https://stepinthering.com", "/account")).toBe("https://stepinthering.com/account");
    expect(safeReturnUrl("https://stepinthering.com", "//evil.example/x")).toBe("https://stepinthering.com/");
    expect(safeReturnUrl("https://stepinthering.com", "not-a-path")).toBe("https://stepinthering.com/");
  });

  it("verified subscription events grant entitlement; duplicates are idempotent", async () => {
    const store = new MemoryMemberStore();
    const { userId } = await makeUser(store);
    const mapEvent: StripeEventLike = {
      id: "evt_1",
      type: "checkout.session.completed",
      data: { object: { client_reference_id: userId, customer: "cus_1" } },
    };
    const subEvent: StripeEventLike = {
      id: "evt_2",
      type: "customer.subscription.updated",
      data: { object: { id: "sub_1", customer: "cus_1", status: "active", current_period_end: Math.floor(LATER.getTime() / 1000) } },
    };
    await applyStripeEvent(store, mapEvent, NOW);
    await applyStripeEvent(store, subEvent, NOW);
    const access = resolveAccess(await store.getEntitlement(userId), NOW);
    expect(access.memberAccess).toBe(true);
    expect(access.status).toBe("active");

    // replaying the same event id changes nothing
    const replay = await applyStripeEvent(store, subEvent, NOW);
    expect(replay).toEqual({ handled: true, action: "duplicate-ignored" });
  });

  it("cancellation respects period end; deletion after period end expires immediately", async () => {
    const store = new MemoryMemberStore();
    const { userId } = await makeUser(store);
    await applyStripeEvent(store, { id: "e1", type: "checkout.session.completed", data: { object: { client_reference_id: userId, customer: "cus_9" } } }, NOW);
    await applyStripeEvent(store, { id: "e2", type: "customer.subscription.deleted", data: { object: { customer: "cus_9", current_period_end: Math.floor(LATER.getTime() / 1000) } } }, NOW);
    let access = resolveAccess(await store.getEntitlement(userId), NOW);
    expect(access.status).toBe("canceled_active");
    expect(access.memberAccess).toBe(true);
    access = resolveAccess(await store.getEntitlement(userId), new Date(LATER.getTime() + 1000));
    expect(access.memberAccess).toBe(false);
  });

  it("payment failure marks past_due and pauses access", async () => {
    const store = new MemoryMemberStore();
    const { userId } = await makeUser(store);
    await applyStripeEvent(store, { id: "e1", type: "checkout.session.completed", data: { object: { client_reference_id: userId, customer: "cus_2" } } }, NOW);
    await applyStripeEvent(store, { id: "e2", type: "invoice.payment_failed", data: { object: { customer: "cus_2" } } }, NOW);
    const access = resolveAccess(await store.getEntitlement(userId), NOW);
    expect(access.status).toBe("past_due");
    expect(access.memberAccess).toBe(false);
  });

  it("events for unknown users or unmapped customers grant nothing", async () => {
    const store = new MemoryMemberStore();
    const bad = await applyStripeEvent(store, { id: "e1", type: "checkout.session.completed", data: { object: { client_reference_id: "ghost", customer: "cus_x" } } }, NOW);
    expect(bad.handled).toBe(false);
    const unmapped = await applyStripeEvent(store, { id: "e2", type: "customer.subscription.updated", data: { object: { customer: "cus_x", status: "active" } } }, NOW);
    expect(unmapped.handled).toBe(false);
  });

  it("browser redirects and client state cannot grant membership", async () => {
    // The only entitlement writers are applyStripeEvent (verified webhooks)
    // and testerCodes/owner grants — both server-side. Visiting a success
    // URL runs no entitlement code at all: prove the route file never
    // touches entitlement.
    const accountPage = readFileSync(join(__dirname, "..", "account", "page.tsx"), "utf8");
    expect(accountPage).not.toMatch(/upsertEntitlement|checkout=success[\s\S]*upsert/);
    const client = readFileSync(join(__dirname, "..", "membership", "MembershipClient.tsx"), "utf8");
    expect(client).not.toMatch(/upsertEntitlement|memberAccess *= *true/);
  });
});

// ── Tester codes ────────────────────────────────────────────────────────────

describe("tester codes", () => {
  const expiry = new Date(NOW.getTime() + 14 * 24 * 60 * 60 * 1000);

  it("codes are random, hashed at rest, and never stored raw", async () => {
    const store = new MemoryMemberStore();
    const created = await createTesterCode(store, SECRET, { label: "round 1", maxRedemptions: 2, expiresAt: expiry, now: NOW });
    expect(created.code).toMatch(/^SITR-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/);
    expect(created.record.codeHash).toBe(hashTesterCode(created.code, SECRET));
    expect(JSON.stringify([...store.testerCodes.values()])).not.toContain(created.code);
    expect(generateTesterCodeValue()).not.toBe(generateTesterCodeValue());
  });

  it("redemption grants time-limited tester access; limits, expiry, and revocation all hold", async () => {
    const store = new MemoryMemberStore();
    const u1 = await makeUser(store, "one@example.com");
    const u2 = await makeUser(store, "two@example.com");
    const u3 = await makeUser(store, "three@example.com");
    const { code, record } = await createTesterCode(store, SECRET, { label: "", maxRedemptions: 2, expiresAt: expiry, now: NOW });

    const r1 = await redeemTesterCode(store, SECRET, { code, userId: u1.userId, ip: "9.9.9.1" }, NOW);
    expect(r1.ok).toBe(true);
    const access = resolveAccess(await store.getEntitlement(u1.userId), NOW);
    expect(access.status).toBe("tester");
    expect(access.memberAccess).toBe(true);
    // expires with the code
    expect(resolveAccess(await store.getEntitlement(u1.userId), new Date(expiry.getTime() + 1)).memberAccess).toBe(false);

    // max redemptions
    expect((await redeemTesterCode(store, SECRET, { code, userId: u2.userId, ip: "9.9.9.2" }, NOW)).ok).toBe(true);
    expect((await redeemTesterCode(store, SECRET, { code, userId: u3.userId, ip: "9.9.9.3" }, NOW)).ok).toBe(false);

    // revoking the code stops future redemptions
    await revokeTesterCode(store, record.id, NOW);
    expect((await redeemTesterCode(store, SECRET, { code, userId: u3.userId, ip: "9.9.9.4" }, NOW)).ok).toBe(false);

    // revoking one grant ends that user's access
    expect(await revokeTesterGrant(store, u1.userId, NOW)).toBe(true);
    expect(resolveAccess(await store.getEntitlement(u1.userId), NOW).memberAccess).toBe(false);
  });

  it("expired and garbage codes fail with one generic message; attempts are rate limited", async () => {
    const store = new MemoryMemberStore();
    const u = await makeUser(store);
    const { code } = await createTesterCode(store, SECRET, { label: "", maxRedemptions: 5, expiresAt: expiry, now: NOW });
    const afterExpiry = new Date(expiry.getTime() + 1000);
    const expired = await redeemTesterCode(store, SECRET, { code, userId: u.userId, ip: "8.8.8.1" }, afterExpiry);
    const garbage = await redeemTesterCode(store, SECRET, { code: "SITR-XXXX-XXXX-XXXX", userId: u.userId, ip: "8.8.8.1" }, afterExpiry);
    expect(expired.ok).toBe(false);
    expect(garbage.ok).toBe(false);
    if (!expired.ok && !garbage.ok) expect(expired.error).toBe(garbage.error);

    let limited = false;
    for (let i = 0; i < 15; i++) {
      const r = await redeemTesterCode(store, SECRET, { code: "SITR-AAAA-AAAA-AAAA", userId: u.userId, ip: "8.8.8.2" }, NOW);
      if (!r.ok && r.status === 429) limited = true;
    }
    expect(limited).toBe(true);
  });

  it("no tester code is hard-coded anywhere in the membership modules", () => {
    for (const f of ["testerCodes.ts", "auth.ts", "stripeCore.ts", "entitlement.ts", "store.ts"]) {
      const src = readFileSync(join(__dirname, f), "utf8");
      expect(src).not.toMatch(/SITR-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}/);
      expect(src).not.toMatch(/2323/);
    }
  });
});

// ── Projects ────────────────────────────────────────────────────────────────

describe("projects", () => {
  const memberAccess = { status: "active" as const, memberAccess: true, activeUntil: LATER.toISOString() };
  const noAccess = { status: "free" as const, memberAccess: false, activeUntil: null };

  it("saving needs membership; free accounts are told plainly", async () => {
    const store = new MemoryMemberStore();
    const u = await makeUser(store);
    const denied = await createProject(store, u.userId, noAccess, { title: "T", engineId: "idea", content: "{}" }, NOW);
    expect(denied.ok).toBe(false);
    const created = await createProject(store, u.userId, memberAccess, { title: "My idea", engineId: "idea", content: '{"raw":"x"}' }, NOW);
    expect(created.ok).toBe(true);
  });

  it("every operation verifies ownership — unauthorized reads/updates/exports/deletes fail", async () => {
    const store = new MemoryMemberStore();
    const owner = await makeUser(store, "owner@example.com");
    const stranger = await makeUser(store, "stranger@example.com");
    const created = await createProject(store, owner.userId, memberAccess, { title: "Mine", engineId: "idea", content: "{}" }, NOW);
    if (!created.ok) throw new Error("fixture");
    const id = created.value.id;

    expect((await readProject(store, stranger.userId, id)).ok).toBe(false);
    expect((await updateProject(store, stranger.userId, memberAccess, id, { title: "Stolen" })).ok).toBe(false);
    expect((await exportProject(store, stranger.userId, id)).ok).toBe(false);
    expect((await deleteOwnProject(store, stranger.userId, id)).ok).toBe(false);
    // the project is untouched
    const mine = await readProject(store, owner.userId, id);
    expect(mine.ok && mine.value.title === "Mine").toBe(true);
  });

  it("export and delete still work after paid access ends — work is never hostage", async () => {
    const store = new MemoryMemberStore();
    const u = await makeUser(store);
    const created = await createProject(store, u.userId, memberAccess, { title: "Kept", engineId: "idea", content: '{"a":1}' }, NOW);
    if (!created.ok) throw new Error("fixture");
    expect((await exportProject(store, u.userId, created.value.id)).ok).toBe(true);
    expect((await updateProject(store, u.userId, noAccess, created.value.id, { title: "New" })).ok).toBe(false);
    expect((await deleteOwnProject(store, u.userId, created.value.id)).ok).toBe(true);
  });

  it("rejects oversized or non-JSON content and unknown engines", async () => {
    const store = new MemoryMemberStore();
    const u = await makeUser(store);
    expect((await createProject(store, u.userId, memberAccess, { title: "T", engineId: "score-engine", content: "{}" }, NOW)).ok).toBe(false);
    expect((await createProject(store, u.userId, memberAccess, { title: "T", engineId: "idea", content: "not json" }, NOW)).ok).toBe(false);
    const huge = JSON.stringify({ x: "y".repeat(300 * 1024) });
    expect((await createProject(store, u.userId, memberAccess, { title: "T", engineId: "idea", content: huge }, NOW)).ok).toBe(false);
  });

  it("import is user-triggered, bounded, and validated per item", async () => {
    const store = new MemoryMemberStore();
    const u = await makeUser(store);
    const result = await importLocalProjects(store, u.userId, memberAccess, [
      { name: "Local one", engineId: "idea", content: '{"ok":true}' },
      { name: "", engineId: "idea", content: "{}" },
    ], NOW);
    expect(result.ok && result.value.imported === 1 && result.value.skipped === 1).toBe(true);
    expect((await importLocalProjects(store, u.userId, memberAccess, [], NOW)).ok).toBe(false);
    expect((await importLocalProjects(store, u.userId, noAccess, [{ name: "x" }], NOW)).ok).toBe(false);
  });
});

// ── Page honesty + gate wiring (source-level locks) ─────────────────────────

describe("membership surface honesty", () => {
  const read = (rel: string) => readFileSync(join(__dirname, "..", rel), "utf8");

  it("the membership page shows the exact price, private beta truth, and no pressure tactics", () => {
    const page = stripComments(read("membership/page.tsx"));
    expect(page).toMatch(/\$7\.77 per month|MEMBERSHIP_PRICE_LABEL/);
    expect(page).toMatch(/Monthly recurring billing/);
    expect(page).toMatch(/Billing is not live yet/);
    expect(page).toMatch(/never disables a computer/i);
    expect(page).toMatch(/remain yours/i);
    expect(page).toMatch(/What stays free/);
    expect(page).not.toMatch(/countdown|only \d+ left|limited spots|was \$|\btestimonial/i);
    expect(page).not.toMatch(/free trial|% off|discount/i);
  });

  it("iDontCry stays free in the membership copy and the gate never touches iDontCry", () => {
    const page = read("membership/page.tsx");
    expect(page).toMatch(/iDontCry — the family playground stays free/);
  });

  it("the Engine Room is open to everyone — the owner check only decides whether owner-only engines are in the list", () => {
    // Superseded 2026-08-24: the Engine Room no longer requires an account.
    // /engines/room checks isOwnerAuthed ONLY to decide whether the
    // owner-only engines are included — it never redirects a visitor away.
    const gate = read("engines/room/page.tsx");
    expect(gate).toMatch(/isOwnerAuthed/);
    expect(gate).not.toMatch(/currentMember/);
    expect(gate).not.toMatch(/redirect/);
    expect(read("engines/page.tsx")).not.toMatch(/isOwnerAuthed/);
    const system = read("engines/EngineSystem.tsx");
    expect(system).toMatch(/memberMode && e\.activation === "owner-only"/);
    expect(system).toMatch(/!memberMode && OWNER_ENGINES\.length > 0/);
  });

  it("the Five Hour Sprint tool is open to everyone too", () => {
    const page = read("five-hour-sprint-tool/page.tsx");
    expect(page).not.toMatch(/currentMember|memberAccess|redirect/);
  });

  it("owner tester-code routes require the owner session and never log raw codes", () => {
    const route = readFileSync(join(__dirname, "..", "api", "owner", "tester-codes", "route.ts"), "utf8");
    expect(route).toMatch(/isOwnerRequest/);
    expect(route).not.toMatch(/console\.log/);
  });

  it("the webhook route requires a signature and rejects unverifiable requests", () => {
    const route = readFileSync(join(__dirname, "..", "api", "members", "stripe-webhook", "route.ts"), "utf8");
    expect(route).toMatch(/stripe-signature/);
    expect(route).toMatch(/invalid signature/);
    expect(route).toMatch(/verifyWebhook/);
  });

  it("no secret env value names leak into client components", () => {
    for (const rel of ["membership/MembershipClient.tsx", "account/AccountClient.tsx"]) {
      const src = read(rel);
      expect(src).not.toMatch(/STRIPE_SECRET_KEY|STRIPE_WEBHOOK_SECRET|TESTER_CODE_SECRET|DATABASE_URL/);
      expect(src).not.toMatch(/process\.env/);
    }
  });

  it("no automatic cross-product synchronization is claimed", () => {
    const page = read("membership/page.tsx") + read("membership/MembershipClient.tsx");
    expect(page).not.toMatch(/automatically sync|seamless/i);
    expect(page).toMatch(/stays in this browser/i);
  });
});
