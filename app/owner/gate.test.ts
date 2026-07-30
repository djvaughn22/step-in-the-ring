import { describe, expect, it } from "vitest";
import { createSessionToken, sessionSecret } from "../author/auth";
import { hasOwnerSession, safeReturnTo } from "./gate";

// Test-only secret — never the real password.
const ENV = { STORY_OWNER_PASSWORD: "invented-test-password" };

describe("shared owner session", () => {
  it("accepts a token signed with the configured secret", () => {
    const token = createSessionToken(sessionSecret(ENV)!);
    expect(hasOwnerSession(token, ENV)).toBe(true);
  });

  it("rejects missing, garbage, and foreign tokens", () => {
    expect(hasOwnerSession(undefined, ENV)).toBe(false);
    expect(hasOwnerSession("garbage", ENV)).toBe(false);
    const foreign = createSessionToken(sessionSecret({ STORY_OWNER_PASSWORD: "some-other-password" })!);
    expect(hasOwnerSession(foreign, ENV)).toBe(false);
  });

  it("fails closed with no password configured", () => {
    const token = createSessionToken(sessionSecret(ENV)!);
    expect(hasOwnerSession(token, {})).toBe(false);
  });
});

describe("safeReturnTo — open-redirect prevention", () => {
  it("allows protected same-site paths, preserving the query string", () => {
    expect(safeReturnTo("/engines")).toBe("/engines");
    expect(safeReturnTo("/projects")).toBe("/projects");
    expect(safeReturnTo("/author")).toBe("/author");
    expect(safeReturnTo("/engines?pkg=abc&x=1")).toBe("/engines?pkg=abc&x=1");
    expect(safeReturnTo("/engines/sub?y=2")).toBe("/engines/sub?y=2");
  });

  it("drops fragments", () => {
    expect(safeReturnTo("/engines#section")).toBe("/engines");
  });

  it("falls back to the hub for absolute and protocol-relative URLs", () => {
    expect(safeReturnTo("https://evil.example/engines")).toBe("/owner");
    expect(safeReturnTo("http://evil.example")).toBe("/owner");
    expect(safeReturnTo("//evil.example/engines")).toBe("/owner");
  });

  it("falls back for non-http schemes and malformed input", () => {
    expect(safeReturnTo("javascript:alert(1)")).toBe("/owner");
    expect(safeReturnTo("data:text/html,hi")).toBe("/owner");
    expect(safeReturnTo("\\\\evil.example")).toBe("/owner");
  });

  it("falls back for public or unknown paths (no forced-login loops onto public pages)", () => {
    expect(safeReturnTo("/")).toBe("/owner");
    expect(safeReturnTo("/about")).toBe("/owner");
    expect(safeReturnTo("/enginesx")).toBe("/owner");
    expect(safeReturnTo("")).toBe("/owner");
    expect(safeReturnTo(null)).toBe("/owner");
    expect(safeReturnTo(undefined)).toBe("/owner");
  });
});
