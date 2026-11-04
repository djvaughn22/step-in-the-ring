// What the kit promises, checked against the code that makes the promise.

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { pageAt } from "../site/registry";
import { KIT_CONTENTS, KIT_CURRENCY, KIT_PAGE_COUNT, KIT_PRICE_CENTS, KIT_STEPS, kitPrice } from "./kit";

const ROOT = path.join(__dirname, "..", "..");
const KIT_SOURCES = [
  "app/kit/kit.ts",
  "app/kit/page.tsx",
  "app/kit/KitClient.tsx",
  "app/kit/kitStripe.ts",
  "app/products/ready-to-build/KitOffer.tsx",
  "app/products/ready-to-build/CheckoutNote.tsx",
  "app/products/ready-to-build/page.tsx",
].map((p) => [p, readFileSync(path.join(ROOT, p), "utf8")] as const);

function* files(dir: string): Generator<string> {
  for (const name of readdirSync(dir)) {
    const p = path.join(dir, name);
    if (statSync(p).isDirectory()) yield* files(p);
    else yield p;
  }
}

describe("the offer", () => {
  it("is one price in whole cents, in dollars", () => {
    expect(Number.isInteger(KIT_PRICE_CENTS)).toBe(true);
    expect(KIT_PRICE_CENTS).toBeGreaterThan(0);
    expect(KIT_CURRENCY).toBe("usd");
    expect(kitPrice()).toMatch(/^\$\d+(\.\d{2})?$/);
  });

  it("never offers a subscription, a plan or a trial", () => {
    for (const [file, src] of KIT_SOURCES) {
      expect(src, file).not.toMatch(/per month|\/mo\b|monthly|per year|yearly|annual|free trial|subscribe|membership|cancel any ?time/i);
    }
  });

  it("claims no endorsement, testimonial or sales count", () => {
    for (const [file, src] of KIT_SOURCES) {
      expect(src, file).not.toMatch(/endorse|testimonial|trusted by|as seen|bestsell|customers love|\d[\d,]* (buyers|customers|copies)/i);
    }
  });

  it("adds no link to another Open Mirror site", () => {
    for (const [file, src] of KIT_SOURCES) expect(src, file).not.toMatch(/crossheartpray|idontcry\.com|thedjcares/i);
  });

  it("describes a workbook with real contents", () => {
    expect(KIT_PAGE_COUNT).toBeGreaterThan(KIT_CONTENTS.length);
    for (const c of KIT_CONTENTS) {
      expect(c.title.trim().length).toBeGreaterThan(4);
      expect(c.what.trim().length).toBeGreaterThan(20);
    }
  });
});

describe("the kit page's six steps", () => {
  it("are the same six steps as the guide, in order", () => {
    expect(KIT_STEPS.map((s) => s.title)).toEqual(["Check it", "Protect it", "Rebuild it", "Prepare it", "Build it", "Go live"]);
  });

  it("only point at pages anyone can open", () => {
    for (const s of KIT_STEPS) {
      for (const t of s.tools) {
        const page = pageAt(t.href.split("#")[0]);
        expect(page, t.href).toBeDefined();
        expect(page?.access, t.href).toBe("public");
      }
    }
  });
});

describe("the paid file stays private", () => {
  it("has no PDF anywhere in public/", () => {
    const pdfs = [...files(path.join(ROOT, "public"))].filter((f) => /\.pdf$/i.test(f));
    expect(pdfs).toEqual([]);
  });

  it("keeps private/ out of Git", () => {
    expect(readFileSync(path.join(ROOT, ".gitignore"), "utf8")).toMatch(/^\/private\/$/m);
  });

  it("serves the file only from the download route", () => {
    const route = readFileSync(path.join(ROOT, "app/kit/download/route.ts"), "utf8");
    expect(route).toMatch(/checkKitAccessFromEnv/);
    expect(route.indexOf("checkKitAccessFromEnv(")).toBeLessThan(route.indexOf("getKitFileSource()"));
    expect(existsSync(path.join(ROOT, "app/kit/kit.pdf"))).toBe(false);
  });
});
