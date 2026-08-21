// The preview door, tested the way a door should be: mostly by trying to get
// through it without the key.
//
// The rule that matters most is the last one — the passcode must never exist
// anywhere a browser can read it.

import { describe, it, expect, beforeEach } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import {
  checkPasscode,
  issueToken,
  tokenValid,
  previewConfigured,
  previewCookieOptions,
  __resetPreviewRateLimit,
  PREVIEW_COOKIE,
} from "./previewAuth";

const CODE = "test-passcode-value";
const ENV = { SITR_PREVIEW_PASSCODE: CODE };
const NO_ENV: Record<string, string | undefined> = {};

beforeEach(() => __resetPreviewRateLimit());

describe("with no passcode configured, the door is shut", () => {
  it("reports itself unconfigured", () => {
    expect(previewConfigured(NO_ENV)).toBe(false);
    expect(previewConfigured({ SITR_PREVIEW_PASSCODE: "   " })).toBe(false);
  });

  it("lets nobody in — not even with the right code", () => {
    const r = checkPasscode(CODE, "ip", NO_ENV);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("unconfigured");
  });

  it("rejects a token that was valid before the door was unconfigured", () => {
    const token = issueToken(CODE);
    expect(tokenValid(token, ENV)).toBe(true);
    expect(tokenValid(token, NO_ENV)).toBe(false);
  });
});

describe("the passcode itself", () => {
  it("opens the door", () => {
    const r = checkPasscode(CODE, "ip", ENV);
    expect(r.ok).toBe(true);
  });

  it("tolerates the spaces a phone keyboard adds", () => {
    expect(checkPasscode(`  ${CODE} `, "ip", ENV).ok).toBe(true);
  });

  it("stays shut for a wrong code", () => {
    const r = checkPasscode("not-it", "ip", ENV);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("wrong");
  });

  it("stays shut for an empty code", () => {
    expect(checkPasscode("", "ip", ENV).ok).toBe(false);
  });

  it("stops guessing after enough wrong tries", () => {
    for (let i = 0; i < 8; i++) checkPasscode("nope", "guesser", ENV);
    const r = checkPasscode(CODE, "guesser", ENV);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("rate-limited");
  });

  it("throttles one guesser without locking out everybody else", () => {
    for (let i = 0; i < 9; i++) checkPasscode("nope", "guesser", ENV);
    expect(checkPasscode(CODE, "somebody-else", ENV).ok).toBe(true);
  });
});

describe("the session token", () => {
  it("is accepted when freshly issued", () => {
    expect(tokenValid(issueToken(CODE), ENV)).toBe(true);
  });

  it("is refused once it has aged out", () => {
    const issued = issueToken(CODE, 0);
    expect(tokenValid(issued, ENV, 13 * 60 * 60 * 1000)).toBe(false);
  });

  it("is refused when it was signed with a different passcode", () => {
    expect(tokenValid(issueToken("some-other-code"), ENV)).toBe(false);
  });

  it("is refused when the signature is edited", () => {
    const t = issueToken(CODE);
    const parts = t.split(".");
    parts[2] = parts[2].replace(/.$/, (c) => (c === "a" ? "b" : "a"));
    expect(tokenValid(parts.join("."), ENV)).toBe(false);
  });

  it("is refused when the timestamp is edited to buy more time", () => {
    const t = issueToken(CODE, 1000);
    const [subject, , sig] = t.split(".");
    expect(tokenValid(`${subject}.999999999999.${sig}`, ENV)).toBe(false);
  });

  it("is refused when it claims to be from the future", () => {
    expect(tokenValid(issueToken(CODE, 10_000_000), ENV, 0)).toBe(false);
  });

  it("is refused when it is garbage, empty or missing", () => {
    for (const t of [undefined, "", "x", "a.b", "a.b.c.d", "owner.1.deadbeef"]) {
      expect(tokenValid(t, ENV), String(t)).toBe(false);
    }
  });

  it("never carries the passcode inside it", () => {
    expect(issueToken(CODE)).not.toContain(CODE);
  });
});

describe("the cookie", () => {
  it("is unreadable by script and does not travel cross-site", () => {
    const o = previewCookieOptions();
    expect(o.httpOnly).toBe(true);
    expect(o.sameSite).toBe("lax");
    expect(o.maxAge).toBeGreaterThan(0);
    expect(o.maxAge).toBeLessThanOrEqual(24 * 60 * 60);
  });

  it("is named distinctly from the member and owner sessions", () => {
    expect(PREVIEW_COOKIE).toBe("sitr_preview");
  });
});

describe("the passcode never reaches a browser", () => {
  const APP = path.join(process.cwd(), "app");

  function clientFiles(dir: string, out: string[] = []): string[] {
    for (const entry of readdirSync(dir)) {
      if (entry === "node_modules" || entry === ".next") continue;
      const full = path.join(dir, entry);
      if (statSync(full).isDirectory()) {
        clientFiles(full, out);
      } else if (/\.(tsx|ts)$/.test(entry) && !/\.test\./.test(entry)) {
        out.push(full);
      }
    }
    return out;
  }

  const files = clientFiles(APP);

  it("is read only on the server", () => {
    for (const f of files) {
      const src = readFileSync(f, "utf8");
      if (!src.includes("SITR_PREVIEW_PASSCODE")) continue;
      expect(
        src.startsWith('"use client"') || src.startsWith("'use client'"),
        `${path.relative(APP, f)} reads the passcode in a client component`,
      ).toBe(false);
    }
  });

  it("is never compared inside the gate component", () => {
    const gate = readFileSync(path.join(APP, "preview", "PreviewGate.tsx"), "utf8");
    expect(gate).not.toContain("SITR_PREVIEW_PASSCODE");
    expect(gate).not.toContain("process.env");
    // The code goes out in a POST body, never in the address bar.
    expect(gate).not.toMatch(/searchParams.*passcode/i);
    expect(gate).not.toMatch(/localStorage|sessionStorage/);
  });

  it("is never accepted from the URL", () => {
    const route = readFileSync(
      path.join(APP, "api", "preview", "route.ts"),
      "utf8",
    );
    expect(route).not.toMatch(/searchParams\.get\(\s*["'`]passcode/);
  });
});
