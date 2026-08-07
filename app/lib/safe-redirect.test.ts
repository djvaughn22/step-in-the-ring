import { describe, it, expect } from "vitest";
import { safeRedirectDestination } from "./safe-redirect";

describe("safeRedirectDestination", () => {
  it("should allow internal paths", () => {
    expect(safeRedirectDestination("/engines")).toBe("/engines");
    expect(safeRedirectDestination("/author")).toBe("/author");
    expect(safeRedirectDestination("/projects/123")).toBe("/projects/123");
    expect(safeRedirectDestination("/engines?engine=idea")).toBe("/engines?engine=idea");
  });

  it("should reject http/https URLs", () => {
    expect(safeRedirectDestination("http://evil.com")).toBe("/engines");
    expect(safeRedirectDestination("https://evil.com")).toBe("/engines");
  });

  it("should reject protocol-relative URLs", () => {
    expect(safeRedirectDestination("//evil.com")).toBe("/engines");
  });

  it("should reject encoded bypass attempts", () => {
    expect(safeRedirectDestination("/%2F%2Fevil.com")).toBe("/engines");
    expect(safeRedirectDestination("/%3A%2F%2Fevil.com")).toBe("/engines");
  });

  it("should reject non-string values", () => {
    expect(safeRedirectDestination(null)).toBe("/engines");
    expect(safeRedirectDestination(undefined)).toBe("/engines");
    expect(safeRedirectDestination(123)).toBe("/engines");
  });

  it("should reject relative paths without leading slash", () => {
    expect(safeRedirectDestination("evil.com")).toBe("/engines");
    expect(safeRedirectDestination("./evil")).toBe("/engines");
  });

  it("should use custom default", () => {
    expect(safeRedirectDestination("https://evil.com", "/author")).toBe("/author");
  });

  it("should handle whitespace", () => {
    expect(safeRedirectDestination("  /engines  ")).toBe("/engines");
  });
});
