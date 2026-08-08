// Test member session verification — the boundary check for access
import { describe, it, expect } from "vitest";
import { MemoryMemberStore } from "./store";
import { signup, login, hashSessionToken } from "./auth";
import { resolveAccess } from "./entitlement";


type TestAuthResult = Awaited<ReturnType<typeof signup>>;

function assertAuthSuccess(
  result: TestAuthResult,
): asserts result is Extract<TestAuthResult, { ok: true }> {
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error("expected successful auth result");
}


describe("Member session verification", () => {
  it("should reject pending accounts even with valid session", async () => {
    const store = new MemoryMemberStore();

    // Signup creates pending account
    const signupRes = await signup(
      store,
      { email: "pending@example.com", password: "password123456" },
      { ip: "127.0.0.1" },
    );
    assertAuthSuccess(signupRes);
    // User tries to login — login succeeds but session check should block
    const loginRes = await login(
      store,
      { email: "pending@example.com", password: "password123456" },
      { ip: "127.0.0.1" },
    );
    assertAuthSuccess(loginRes);
    // Session exists in store
    const session = await store.getSession(hashSessionToken(loginRes.sessionToken));
    expect(session).toBeDefined();

    // But entitlement is pending (no memberAccess)
    const entitlement = await store.getEntitlement(loginRes.userId);
    const access = resolveAccess(entitlement);
    expect(access.status).toBe("pending");
    expect(access.memberAccess).toBe(false);
  });

  it("should allow active accounts with valid session", async () => {
    const store = new MemoryMemberStore();

    // Signup creates pending
    const signupRes = await signup(
      store,
      { email: "active@example.com", password: "password123456" },
      { ip: "127.0.0.1" },
    );
    assertAuthSuccess(signupRes);

    // Owner approves
    const entitlement = await store.getEntitlement(signupRes.userId);
    await store.upsertEntitlement({
      ...entitlement!,
      status: "active",
      updatedAt: new Date().toISOString(),
    });

    // Login succeeds
    const loginRes = await login(
      store,
      { email: "active@example.com", password: "password123456" },
      { ip: "127.0.0.1" },
    );
    assertAuthSuccess(loginRes);
    // Session and access both valid
    const session = await store.getSession(hashSessionToken(loginRes.sessionToken));
    expect(session).toBeDefined();

    const entitlementAfter = await store.getEntitlement(loginRes.userId);
    const access = resolveAccess(entitlementAfter);
    expect(access.memberAccess).toBe(true);
  });

  it("should reject revoked accounts even if session exists", async () => {
    const store = new MemoryMemberStore();

    // Signup and approve
    const signupRes = await signup(
      store,
      { email: "revoked@example.com", password: "password123456" },
      { ip: "127.0.0.1" },
    );
    assertAuthSuccess(signupRes);
    const ent = await store.getEntitlement(signupRes.userId);
    await store.upsertEntitlement({
      ...ent!,
      status: "active",
      updatedAt: new Date().toISOString(),
    });

    // Login works
    const loginRes = await login(
      store,
      { email: "revoked@example.com", password: "password123456" },
      { ip: "127.0.0.1" },
    );
    assertAuthSuccess(loginRes);
    // Then revoked
    const entAfter = await store.getEntitlement(loginRes.userId);
    await store.upsertEntitlement({
      ...entAfter!,
      status: "revoked",
      revokedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Session still exists but access is denied
    const session = await store.getSession(hashSessionToken(loginRes.sessionToken));
    expect(session).toBeDefined(); // Session isn't deleted automatically

    const revoked = await store.getEntitlement(loginRes.userId);
    const access = resolveAccess(revoked);
    expect(access.status).toBe("revoked");
    expect(access.memberAccess).toBe(false);
  });

  it("should allow owner status", async () => {
    const store = new MemoryMemberStore();

    // Create an owner account (manually set to test)
    const userId = "owner-user-id";
    const owner = await store.createUser({
      id: userId,
      email: "owner@example.com",
      passwordHash: "dummy",
      emailVerified: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletionRequestedAt: null,
    });

    await store.upsertEntitlement({
      userId,
      status: "owner",
      source: "owner-grant",
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      currentPeriodEnd: null,
      testerCodeId: null,
      revokedAt: null,
      adminNotes: "founder",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const entitlement = await store.getEntitlement(userId);
    const access = resolveAccess(entitlement);
    expect(access.status).toBe("owner");
    expect(access.memberAccess).toBe(true);
  });
});
