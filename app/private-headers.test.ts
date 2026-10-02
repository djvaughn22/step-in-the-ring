// The private-header list uses Next's path patterns, where ":path*" also
// matches zero segments. This checks real matching, so a public page can't
// be hidden from search (or a private one exposed) by a pattern surprise.
import { describe, expect, it } from "vitest";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { pathToRegexp } = require("next/dist/compiled/path-to-regexp") as {
  pathToRegexp: (p: string) => RegExp;
};
import { PRIVATE_ROUTES } from "../next.config";

const isPrivate = (path: string) => PRIVATE_ROUTES.some((p) => pathToRegexp(p).test(path));

describe("private (no-store, noindex) headers", () => {
  it("cover every owner and account surface", () => {
    for (const p of ["/owner", "/owner/members", "/author", "/projects", "/engines/room", "/account", "/api/members/me", "/api/owner/x"]) {
      expect(isPrivate(p), p).toBe(true);
    }
  });

  it("leave the public directory and free tools findable", () => {
    for (const p of ["/engines", "/tools", "/tools/one-liner", "/five-hour-sprint-tool", "/", "/membership"]) {
      expect(isPrivate(p), p).toBe(false);
    }
  });
});
