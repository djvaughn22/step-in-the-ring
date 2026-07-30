// The owner boundary, exercised through the REAL route handlers:
// login issues the shared cookie, the protected publish API rejects requests
// without it and accepts requests with it, and logout clears it.
// Everything here uses invented test values only.

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { _resetAttempts, createSessionToken, SESSION_COOKIE, sessionSecret } from "../author/auth";
import { POST as loginPOST } from "../api/author/login/route";
import { POST as logoutPOST } from "../api/author/logout/route";
import { POST as publishPOST } from "../api/engines/games/publish/route";

const TEST_PW = "invented-test-password";
const ORIGINAL = process.env.STORY_OWNER_PASSWORD;

beforeEach(() => {
  process.env.STORY_OWNER_PASSWORD = TEST_PW;
  _resetAttempts();
});

afterEach(() => {
  if (ORIGINAL === undefined) delete process.env.STORY_OWNER_PASSWORD;
  else process.env.STORY_OWNER_PASSWORD = ORIGINAL;
});

function loginReq(password: string, ip: string): NextRequest {
  return new NextRequest("http://localhost/api/author/login", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify({ password }),
  });
}

function publishReq(cookie?: string): NextRequest {
  return new NextRequest("http://localhost/api/engines/games/publish", {
    method: "POST",
    headers: cookie ? { cookie } : {},
    body: "{}",
  });
}

describe("login endpoint", () => {
  it("fails closed (503) when no password is configured", async () => {
    delete process.env.STORY_OWNER_PASSWORD;
    const res = await loginPOST(loginReq(TEST_PW, "ip-a"));
    expect(res.status).toBe(503);
  });

  it("denies a wrong password with a generic 401 and no cookie", async () => {
    const res = await loginPOST(loginReq("wrong-guess", "ip-b"));
    expect(res.status).toBe(401);
    expect((await res.json()).error).toBe("That didn't work.");
    expect(res.headers.get("set-cookie")).toBeNull();
  });

  it("issues the shared HttpOnly session cookie on success", async () => {
    const res = await loginPOST(loginReq(TEST_PW, "ip-c"));
    expect(res.status).toBe(200);
    const cookie = res.headers.get("set-cookie") ?? "";
    expect(cookie).toContain(`${SESSION_COOKIE}=`);
    expect(cookie.toLowerCase()).toContain("httponly");
    expect(cookie.toLowerCase()).toContain("samesite=strict");
    expect(res.headers.get("cache-control")).toContain("no-store");
  });
});

describe("protected publish API", () => {
  it("denies a request with no session — generic reply, before any work", async () => {
    const res = await publishPOST(publishReq());
    expect(res.status).toBe(401);
    expect((await res.json()).error).toBe("That didn't work.");
  });

  it("denies a request with a tampered session token", async () => {
    const res = await publishPOST(publishReq(`${SESSION_COOKIE}=123456.deadbeef`));
    expect(res.status).toBe(401);
  });

  it("admits a valid owner session (then fails on the empty body, not on auth)", async () => {
    const token = createSessionToken(sessionSecret()!);
    const res = await publishPOST(publishReq(`${SESSION_COOKIE}=${token}`));
    expect(res.status).not.toBe(401);
  });
});

describe("logout endpoint", () => {
  it("expires the shared cookie for the whole site", async () => {
    const res = await logoutPOST();
    const cookie = res.headers.get("set-cookie") ?? "";
    expect(cookie).toContain(`${SESSION_COOKIE}=`);
    expect(cookie).toMatch(/Max-Age=0/i);
    expect(cookie).toMatch(/Path=\//);
  });
});
