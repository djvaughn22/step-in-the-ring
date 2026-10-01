// Digital Front Desk moved to iDontCry on 2026-09-30. This locks the move:
// every old page link lands on the matching iDontCry page, and nothing in
// this repo can store or return a front-desk request any more.

import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { DIGITAL_FRONT_DESK_REDIRECTS } from "../../next.config";
import { SITE_PAGES } from "./registry";
import { PROTECTED_PREFIXES } from "../owner/gate";

const IDC = "https://idontcry.com/digital-front-desk";

describe("Digital Front Desk old routes on Step In The Ring", () => {
  const bySource = new Map(DIGITAL_FRONT_DESK_REDIRECTS.map((r) => [r.source, r.destination]));

  it("send every old page to the matching iDontCry page", () => {
    expect(bySource.get("/uat/digital-front-desk")).toBe(IDC);
    expect(bySource.get("/uat/digital-front-desk/request")).toBe(`${IDC}/request`);
    expect(bySource.get("/uat/digital-front-desk/desk")).toBe(`${IDC}/desk`);
    expect(bySource.get("/uat/digital-front-desk/onboarding")).toBe(`${IDC}/onboarding`);
    expect(bySource.get("/uat/digital-front-desk/admin")).toBe(`${IDC}/admin`);
    expect(bySource.get("/uat/digital-front-desk/:path*")).toBe(IDC);
  });

  it("only ever redirect to the iDontCry product over https", () => {
    for (const r of DIGITAL_FRONT_DESK_REDIRECTS) expect(r.destination.startsWith(IDC)).toBe(true);
  });

  it("leave no pages, API routes or request store behind here", () => {
    expect(existsSync(path.join(process.cwd(), "app", "uat", "digital-front-desk"))).toBe(false);
    expect(existsSync(path.join(process.cwd(), "app", "api", "uat", "digital-front-desk"))).toBe(false);
  });

  it("are not listed in the site directory or the owner gate", () => {
    expect(SITE_PAGES.some((p) => p.path.startsWith("/uat/"))).toBe(false);
    expect((PROTECTED_PREFIXES as readonly string[]).some((p) => p.startsWith("/uat"))).toBe(false);
  });
});
