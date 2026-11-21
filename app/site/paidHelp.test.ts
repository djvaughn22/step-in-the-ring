// Paid help on hold (owner, 2026-11-20): nothing offers, prices or takes a request for paid work.
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import RequestPage from "../request/page";
import ServicesPage from "../services/page";
import { PAID_HELP_OPEN, PAUSED_LINE } from "./paidHelp";
import { navPages } from "./registry";

describe("paid help on hold", () => {
  it("is off until the owner turns it on", () => {
    expect(PAID_HELP_OPEN).toBe(false);
  });

  it("/services and /request say it's paused, with no prices or form", () => {
    for (const Page of [ServicesPage, RequestPage]) {
      const h = renderToStaticMarkup(Page());
      expect(h).toContain("Paid help is paused for now.");
      expect(h).toContain(PAUSED_LINE.replace(/'/g, "&#x27;"));
      expect(h).not.toMatch(/\$\d|Starting at|quote|<form/i);
      expect(h).toContain('href="/start"');
    }
  });

  it("the menu and footer leave paid help out", () => {
    expect(navPages().map((p) => p.path)).not.toContain("/services");
    const footer = readFileSync("app/site/QuietFooterLink.tsx", "utf8");
    expect(footer).toMatch(/PAID_HELP_OPEN \? \[\["\/services"/);
  });
});
