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
    // /engines is the PUBLIC catalog now; the protected root is /engines/room,
    // where an engine actually runs. A public page is not somewhere the owner
    // login needs to return you to, so it is no longer on the allow list.
    expect(safeReturnTo("/engines/room")).toBe("/engines/room");
    expect(safeReturnTo("/projects")).toBe("/projects");
    expect(safeReturnTo("/author")).toBe("/author");
    expect(safeReturnTo("/engines/room?pkg=abc&x=1")).toBe("/engines/room?pkg=abc&x=1");
    expect(safeReturnTo("/engines/room/sub?y=2")).toBe("/engines/room/sub?y=2");
  });

  it("sends a public path to the hub rather than back to itself", () => {
    expect(safeReturnTo("/engines")).toBe("/owner");
  });

  it("drops fragments", () => {
    expect(safeReturnTo("/engines/room#section")).toBe("/engines/room");
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
