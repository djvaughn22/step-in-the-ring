// Test that login correctly handles pending approval status
import { describe, it, expect, beforeEach } from "vitest";
import { MemoryMemberStore } from "../../../members/store";
import { signup, login } from "../../../members/auth";


type TestAuthResult = Awaited<ReturnType<typeof signup>>;

function assertAuthSuccess(
  result: TestAuthResult,
): asserts result is Extract<TestAuthResult, { ok: true }> {
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error("expected successful auth result");
}

function assertAuthFailure(
  result: TestAuthResult,
): asserts result is Extract<TestAuthResult, { ok: false }> {
  expect(result.ok).toBe(false);
  if (result.ok) throw new Error("expected failed auth result");
}

describe("Login with approval flow", () => {
  let store: MemoryMemberStore;

  beforeEach(() => {
    store = new MemoryMemberStore();
  });

  it("should create new signup accounts in pending status", async () => {
    const result = await signup(
      store,
      { email: "new@example.com", password: "password123456" },
      { ip: "127.0.0.1" },
    );
    assertAuthSuccess(result);

    expect(result.userId).toBeDefined();

    // Verify entitlement is pending
    const entitlement = await store.getEntitlement(result.userId!);
    expect(entitlement?.status).toBe("pending");
  });

  it("should allow login with valid credentials regardless of approval", async () => {
    // Signup creates a pending account
    const signupResult = await signup(
      store,
      { email: "pending@example.com", password: "password123456" },
      { ip: "127.0.0.1" },
    );
    assertAuthSuccess(signupResult);
    // Login should succeed (it's the API route that checks approval)
    const loginResult = await login(
      store,
      { email: "pending@example.com", password: "password123456" },
      { ip: "127.0.0.1" },
    );
    assertAuthSuccess(loginResult);
  });

  it("should reject login with incorrect password", async () => {
    await signup(
      store,
      { email: "user@example.com", password: "password123456" },
      { ip: "127.0.0.1" },
    );

    const result = await login(
      store,
      { email: "user@example.com", password: "wrongpassword" },
      { ip: "127.0.0.1" },
    );
    assertAuthFailure(result);
    expect(result.status).toBe(401);
  });

  it("should allow owner to approve pending accounts", async () => {
    const signupResult = await signup(
      store,
      { email: "approver@example.com", password: "password123456" },
      { ip: "127.0.0.1" },
    );
    assertAuthSuccess(signupResult);
    const userId = signupResult.userId!;

    // Initially pending
    let entitlement = await store.getEntitlement(userId);
    expect(entitlement?.status).toBe("pending");

    // Owner approves
    await store.upsertEntitlement({
      ...entitlement!,
      status: "active",
      updatedAt: new Date().toISOString(),
    });

    // Now active
    entitlement = await store.getEntitlement(userId);
    expect(entitlement?.status).toBe("active");
  });
});
