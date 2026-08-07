// Test middleware protection of member routes
import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { middleware } from "./middleware";

describe("Member route middleware", () => {
  it("should allow access to public routes without session", () => {
    const req = new NextRequest(new URL("http://localhost:3000/"));
    const res = middleware(req);
    // Should pass through (no redirect)
    expect(res.status).not.toBe(307); // 307 is a redirect
  });

  it("should allow access to login without session", () => {
    const req = new NextRequest(new URL("http://localhost:3000/members/login"));
    const res = middleware(req);
    expect(res.status).not.toBe(307);
  });

  it("should allow access to signup without session", () => {
    const req = new NextRequest(new URL("http://localhost:3000/members/signup"));
    const res = middleware(req);
    expect(res.status).not.toBe(307);
  });

  it("should redirect to login for protected routes without session", () => {
    const req = new NextRequest(new URL("http://localhost:3000/engines"));
    const res = middleware(req);
    // Should redirect
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/members/login");
  });

  it("should preserve returnTo parameter", () => {
    const req = new NextRequest(new URL("http://localhost:3000/projects/123"));
    const res = middleware(req);
    const location = res.headers.get("location");
    expect(location).toContain("returnTo=%2Fprojects%2F123");
  });

  it("should allow protected routes with session cookie", () => {
    const req = new NextRequest(new URL("http://localhost:3000/account"));
    req.cookies.set("sitr-member-session", "dummy-token-value");
    const res = middleware(req);
    // Middleware allows it through; actual route will verify the token
    expect(res.status).not.toBe(307);
  });

  it("should skip API routes", () => {
    const req = new NextRequest(new URL("http://localhost:3000/api/members/login"));
    const res = middleware(req);
    expect(res.status).not.toBe(307);
  });

  it("should skip static assets", () => {
    const req = new NextRequest(new URL("http://localhost:3000/_next/static/chunk.js"));
    const res = middleware(req);
    expect(res.status).not.toBe(307);
  });
});
