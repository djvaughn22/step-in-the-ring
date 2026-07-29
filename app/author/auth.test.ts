import { beforeEach, describe, expect, it } from "vitest";
import {
  _resetAttempts, clearFailures, createSessionToken, isLockedOut, ownerPassword,
  passwordMatches, registerFailure, SESSION_MAX_AGE_S, sessionSecret, verifySessionToken,
} from "./auth";

// Test-only secrets — never the real password.
const TEST_PW = "correct-horse-battery";
const ENV = { STORY_OWNER_PASSWORD: TEST_PW };

describe("owner password configuration", () => {
  it("fails closed when the env var is missing", () => {
    expect(ownerPassword({})).toBeNull();
    expect(sessionSecret({})).toBeNull();
  });

  it("treats a too-short password as unconfigured", () => {
    expect(ownerPassword({ STORY_OWNER_PASSWORD: "short" })).toBeNull();
  });

  it("derives a session secret from the password so rotation invalidates sessions", () => {
    const a = sessionSecret({ STORY_OWNER_PASSWORD: TEST_PW });
    const b = sessionSecret({ STORY_OWNER_PASSWORD: TEST_PW + "-rotated" });
    expect(a).toBeTruthy();
    expect(a).not.toBe(b);
  });

  it("prefers an explicit STORY_SESSION_SECRET", () => {
    expect(sessionSecret({ ...ENV, STORY_SESSION_SECRET: "s1" })).toBe("s1");
  });
});

describe("password verification", () => {
  it("accepts the exact password and rejects everything else", () => {
    expect(passwordMatches(TEST_PW, TEST_PW)).toBe(true);
    expect(passwordMatches("", TEST_PW)).toBe(false);
    expect(passwordMatches(TEST_PW + " ", TEST_PW)).toBe(false);
    expect(passwordMatches(TEST_PW.toUpperCase(), TEST_PW)).toBe(false);
  });
});

describe("session tokens", () => {
  const secret = sessionSecret(ENV)!;

  it("round-trips a valid token", () => {
    const t = createSessionToken(secret, 1000);
    expect(verifySessionToken(t, secret, 1000)).toBe(true);
  });

  it("expires", () => {
    const t = createSessionToken(secret, 1000);
    expect(verifySessionToken(t, secret, 1000 + SESSION_MAX_AGE_S * 1000 + 1)).toBe(false);
  });

  it("rejects tampering with the expiry or signature", () => {
    const t = createSessionToken(secret, 1000);
    const [exp, mac] = t.split(".");
    expect(verifySessionToken(`${Number(exp) + 9999999}.${mac}`, secret, 1000)).toBe(false);
    expect(verifySessionToken(`${exp}.${"0".repeat(mac.length)}`, secret, 1000)).toBe(false);
    expect(verifySessionToken("garbage", secret, 1000)).toBe(false);
    expect(verifySessionToken(undefined, secret, 1000)).toBe(false);
  });

  it("rejects tokens signed with a different secret (password rotation)", () => {
    const t = createSessionToken(secret, 1000);
    const rotated = sessionSecret({ STORY_OWNER_PASSWORD: TEST_PW + "-new" })!;
    expect(verifySessionToken(t, rotated, 1000)).toBe(false);
  });

  it("never accepts anything without a secret", () => {
    const t = createSessionToken(secret, 1000);
    expect(verifySessionToken(t, null, 1000)).toBe(false);
  });
});

describe("repeated-attempt protection", () => {
  beforeEach(() => _resetAttempts());

  it("locks out after five failures and releases after the lockout", () => {
    const now = 1_000_000;
    for (let i = 0; i < 4; i++) registerFailure("ip1", now + i);
    expect(isLockedOut("ip1", now + 10)).toBe(false);
    registerFailure("ip1", now + 5);
    expect(isLockedOut("ip1", now + 10)).toBe(true);
    expect(isLockedOut("ip1", now + 5 + 60_001)).toBe(false);
  });

  it("is per-key and clears on success", () => {
    const now = 1_000_000;
    for (let i = 0; i < 5; i++) registerFailure("ip1", now + i);
    expect(isLockedOut("ip2", now + 10)).toBe(false);
    clearFailures("ip1");
    expect(isLockedOut("ip1", now + 10)).toBe(false);
  });
});
