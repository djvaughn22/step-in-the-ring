import { beforeEach, describe, expect, it } from "vitest";
import { betaAdmit, betaPasswordFromEnv, betaPasswordMatches } from "./beta-access";
import { resetRateLimiter, sessionUser } from "./auth";
import { resolveAccess } from "./entitlement";
import { MemoryMemberStore } from "./store";

// The production secret is NEVER written here. Admission is injected.
const BETA = "test-beta-admission-password";

const store = () => new MemoryMemberStore();

async function admit(
  s: MemoryMemberStore,
  email: string,
  password: string,
  ip = "1.2.3.4",
) {
  return betaAdmit(s, { email, password }, { ip, betaPassword: BETA });
}

beforeEach(() => resetRateLimiter());

describe("beta admission — the shared private-beta door", () => {
  it("admits an unknown email on the correct beta password, as a tester", async () => {
    const s = store();
    const r = await admit(s, "brand-new@example.com", BETA);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const ent = await s.getEntitlement(r.userId);
    expect(resolveAccess(ent).status).toBe("tester");
    expect(resolveAccess(ent).memberAccess).toBe(true);
  });

  it("denies an unknown email on the wrong password", async () => {
    const s = store();
    const r = await admit(s, "brand-new@example.com", "not-the-password");
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.status).toBe(401);
    expect(await s.getUserByEmail("brand-new@example.com")).toBeNull();
  });

  it("tolerates whitespace pasted around the password", async () => {
    const s = store();
    const r = await admit(s, "paster@example.com", `  ${BETA}\n`);
    expect(r.ok).toBe(true);
  });

  it("promotes a pending account to tester instead of leaving it stuck", async () => {
    const s = store();
    const first = await admit(s, "waiting@example.com", BETA);
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    await s.upsertEntitlement({
      ...(await s.getEntitlement(first.userId))!,
      status: "pending",
    });
    const again = await admit(s, "waiting@example.com", BETA);
    expect(again.ok).toBe(true);
    if (!again.ok) return;
    expect(resolveAccess(await s.getEntitlement(again.userId)).status).toBe("tester");
  });

  it("lets an existing tester back in", async () => {
    const s = store();
    const first = await admit(s, "regular@example.com", BETA);
    expect(first.ok).toBe(true);
    const second = await admit(s, "regular@example.com", BETA);
    expect(second.ok).toBe(true);
    if (!first.ok || !second.ok) return;
    expect(second.userId).toBe(first.userId);
  });

  it("DENIES a revoked email even with the correct beta password", async () => {
    const s = store();
    const first = await admit(s, "removed@example.com", BETA);
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    await s.upsertEntitlement({
      ...(await s.getEntitlement(first.userId))!,
      status: "revoked",
      revokedAt: new Date().toISOString(),
    });
    const again = await admit(s, "removed@example.com", BETA);
    expect(again.ok).toBe(false);
    if (again.ok) return;
    expect(again.status).toBe(403);
  });

  it("never downgrades an owner or a paid account to tester", async () => {
    const s = store();
    const first = await admit(s, "owner@example.com", BETA);
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    await s.upsertEntitlement({
      ...(await s.getEntitlement(first.userId))!,
      status: "owner",
    });
    const again = await admit(s, "owner@example.com", BETA);
    expect(again.ok).toBe(true);
    expect((await s.getEntitlement(first.userId))!.status).toBe("owner");
  });

  it("issues a real member session, not a second weak mechanism", async () => {
    const s = store();
    const r = await admit(s, "sessioned@example.com", BETA);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const user = await sessionUser(s, r.sessionToken);
    expect(user?.email).toBe("sessioned@example.com");
  });

  it("keeps rate limiting on repeated wrong guesses", async () => {
    const s = store();
    let last;
    for (let i = 0; i < 12; i++) {
      last = await admit(s, "guesser@example.com", `wrong-${i}`, "9.9.9.9");
    }
    expect(last?.ok).toBe(false);
    if (last?.ok) return;
    expect(last?.status).toBe(429);
  });

  it("fails CLOSED when no beta password is configured", async () => {
    const s = store();
    const r = await betaAdmit(
      s,
      { email: "anyone@example.com", password: "anything" },
      { ip: "1.2.3.4", betaPassword: null },
    );
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.status).toBe(503);
  });

  it("never stores the shared password on the created user record", async () => {
    const s = store();
    const r = await admit(s, "leaky@example.com", BETA);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const user = await s.getUserById(r.userId);
    expect(user?.passwordHash).not.toContain(BETA);
    // The shared password must not work as that account's own login password.
    const { login } = await import("./auth");
    resetRateLimiter();
    const asLogin = await login(s, { email: "leaky@example.com", password: BETA }, { ip: "1.1.1.1" });
    expect(asLogin.ok).toBe(false);
  });

  it("reads the password from server-only env, and blank means unset", () => {
    expect(betaPasswordFromEnv({ SITR_BETA_ACCESS_PASSWORD: " secret " })).toBe("secret");
    expect(betaPasswordFromEnv({ SITR_BETA_ACCESS_PASSWORD: "   " })).toBeNull();
    expect(betaPasswordFromEnv({})).toBeNull();
    // NEXT_PUBLIC_ would ship to the browser — the name must not be public.
    expect(betaPasswordFromEnv({ NEXT_PUBLIC_SITR_BETA_ACCESS_PASSWORD: "x" })).toBeNull();
  });

  it("rejects non-string and mismatched-length submissions", () => {
    expect(betaPasswordMatches(undefined, BETA)).toBe(false);
    expect(betaPasswordMatches(123, BETA)).toBe(false);
    expect(betaPasswordMatches(`${BETA}x`, BETA)).toBe(false);
    expect(betaPasswordMatches(BETA, "")).toBe(false);
    expect(betaPasswordMatches(BETA, BETA)).toBe(true);
  });
});
