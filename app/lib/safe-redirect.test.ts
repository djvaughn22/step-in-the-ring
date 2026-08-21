import { describe, it, expect } from "vitest";
import { safeRedirectDestination } from "./safe-redirect";

// The fallback is now /builds, not /engines. Signing in is something a person
// does to get at their own work, and the engine catalog is public anyway — the
// old default sent them to a page that no longer needs a session. The
// rejection behaviour below is unchanged; only the safe landing spot moved.
describe("safeRedirectDestination", () => {
  it("should allow internal paths", () => {
    expect(safeRedirectDestination("/engines/room")).toBe("/engines/room");
    expect(safeRedirectDestination("/author")).toBe("/author");
    expect(safeRedirectDestination("/projects/123")).toBe("/projects/123");
    expect(safeRedirectDestination("/engines/room?engine=idea")).toBe("/engines/room?engine=idea");
  });

  it("should reject http/https URLs", () => {
    expect(safeRedirectDestination("http://evil.com")).toBe("/builds");
    expect(safeRedirectDestination("https://evil.com")).toBe("/builds");
  });

  it("should reject protocol-relative URLs", () => {
    expect(safeRedirectDestination("//evil.com")).toBe("/builds");
  });

  it("should reject encoded bypass attempts", () => {
    expect(safeRedirectDestination("/%2F%2Fevil.com")).toBe("/builds");
    expect(safeRedirectDestination("/%3A%2F%2Fevil.com")).toBe("/builds");
  });

  it("should reject non-string values", () => {
    expect(safeRedirectDestination(null)).toBe("/builds");
    expect(safeRedirectDestination(undefined)).toBe("/builds");
    expect(safeRedirectDestination(123)).toBe("/builds");
  });

  it("should reject relative paths without leading slash", () => {
    expect(safeRedirectDestination("evil.com")).toBe("/builds");
    expect(safeRedirectDestination("./evil")).toBe("/builds");
  });

  it("should use custom default", () => {
    expect(safeRedirectDestination("https://evil.com", "/author")).toBe("/author");
  });

  it("should handle whitespace", () => {
    expect(safeRedirectDestination("  /builds  ")).toBe("/builds");
  });
});
