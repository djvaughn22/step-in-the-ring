import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { BUDGETS, CARE_PLANS, CARE_TERMS, INDEPENDENCE_NOTICE, NOT_INCLUDED, OFFERS, SERVICE_CHOICES } from "./offers";
import { WORK, workWithIdentity } from "../work/work";

const visible = (path: string) => readFileSync(path, "utf8").replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");

describe("Build it with us: honest offers", () => {
  it("has the four introductory services, in order, with the owner's prices", () => {
    expect(OFFERS.map((o) => [o.name, o.price])).toEqual([
      ["Website Review", "$149"],
      ["Starter Website", "$499"],
      ["Business Website", "$999"],
      ["Custom Website or Web App", "Starting at $2,499"],
    ]);
    expect(CARE_PLANS.map((c) => c.price)).toEqual(["$49 a month", "$99 a month", "$199 a month"]);
  });

  it("never promises unlimited anything, guarantees, or 24/7", () => {
    const all = JSON.stringify({ OFFERS, NOT_INCLUDED, CARE_PLANS });
    expect(all).not.toMatch(/unlimited|guarantee|24\/7|always available/i);
    expect(CARE_TERMS).toMatch(/No 24\/7 support and no uptime guarantee/);
  });

  it("states timing as usual, never as a promise", () => {
    for (const o of OFFERS) expect(o.timing).toMatch(/^(Usually|Timing is set)/);
  });

  it("keeps the independence notice word for word, naming no employer", () => {
    expect(INDEPENDENCE_NOTICE).toBe(
      "Step In The Ring is independently owned and operated by Open Mirror LLC. All services are provided outside other employment, using independent resources, and are not affiliated with or endorsed by any employer. We do not undertake projects that conflict with existing employment obligations.",
    );
    for (const path of ["app/site/QuietFooterLink.tsx", "app/about/page.tsx", "app/services/page.tsx"]) {
      expect(readFileSync(path, "utf8"), path).toContain("INDEPENDENCE_NOTICE");
    }
  });

  it("offers every service and a not-sure option on the form", () => {
    expect(SERVICE_CHOICES.map((s) => s.id)).toEqual(["review", "starter", "business", "custom", "care", "not-sure"]);
    expect(BUDGETS[0]).toEqual({ id: "", label: "Prefer not to say" });
  });

  it("no page sells, subscribes or checks out", () => {
    for (const path of ["app/services/page.tsx", "app/work/page.tsx", "app/request/page.tsx", "app/request/RequestForm.tsx"]) {
      const src = visible(path);
      expect(src, path).not.toMatch(/stripe|checkout|subscribe|buy now|add to cart/i);
      expect(src, path).not.toMatch(/revolutionary|game.?chang|AI[- ]powered|10x|magic/i);
    }
  });
});

describe("Our work: real projects, labelled as our own", () => {
  it("every entry is a live project in the registry", () => {
    expect(workWithIdentity()).toHaveLength(WORK.length);
  });

  it("says plainly that these are not client projects, and invents no numbers", () => {
    const page = visible("app/work/page.tsx");
    expect(page).toContain("not client work");
    const shown = JSON.stringify(WORK);
    expect(shown).not.toMatch(/\d{2,}|client|customer|testimonial|users|visitors/i);
  });
});
