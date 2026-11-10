import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { MemoryMemberStore, PROJECT_INQUIRIES_DDL } from "./store";
import { buildInquiryMail, cleanSiteUrl, createProjectInquiry, MIN_FILL_MS, validateInquiry } from "./projectInquiry";

const good = {
  name: "Pat Example",
  email: "Pat@Example.com",
  organization: "Example Bakery",
  siteUrl: "examplebakery.com",
  projectType: "redo-site",
  service: "business",
  description: "We need a simple site with our menu, hours and a contact form.",
  timeline: "1-3-months",
  budget: "500-1000",
  elapsedMs: 20_000,
};

describe("project requests", () => {
  it("stores a valid request with cleaned values", async () => {
    const store = new MemoryMemberStore();
    const r = await createProjectInquiry(store, good);
    expect(r.ok).toBe(true);
    const [saved] = await store.listProjectInquiries();
    expect(saved.email).toBe("pat@example.com");
    expect(saved.siteUrl).toBe("https://examplebakery.com/");
    expect(saved.status).toBe("new");
  });

  it("accepts a request with only the required fields", () => {
    const v = validateInquiry({ ...good, organization: "", siteUrl: "", budget: undefined });
    expect(v.ok && v.record?.budget).toBe("");
  });

  it("names every field that needs a look, and stores nothing", async () => {
    const store = new MemoryMemberStore();
    const r = await createProjectInquiry(store, { elapsedMs: 20_000 });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(Object.keys(r.fields ?? {}).sort()).toEqual(["description", "email", "name", "projectType", "service", "timeline"]);
    expect(await store.listProjectInquiries()).toHaveLength(0);
  });

  it("refuses choices that aren't on the form", () => {
    const v = validateInquiry({ ...good, service: "everything-unlimited", budget: "a million" });
    expect(v.ok).toBe(false);
    if (!v.ok) expect(Object.keys(v.fields).sort()).toEqual(["budget", "service"]);
  });

  it("quietly drops bots: honeypot filled, or sent faster than a person can type", async () => {
    const store = new MemoryMemberStore();
    expect(await createProjectInquiry(store, { ...good, nickname: "bot" })).toEqual({ ok: true, stored: null });
    expect(await createProjectInquiry(store, { ...good, elapsedMs: MIN_FILL_MS - 1 })).toEqual({ ok: true, stored: null });
    expect(await store.listProjectInquiries()).toHaveLength(0);
  });

  it("only keeps http(s) web addresses", () => {
    expect(cleanSiteUrl("javascript:alert(1)")).toBeNull();
    expect(cleanSiteUrl("not a site")).toBeNull();
    expect(cleanSiteUrl("http://ok.example.org/page")).toBe("http://ok.example.org/page");
    expect(cleanSiteUrl("")).toBe("");
  });

  it("strips control characters and caps length", () => {
    const v = validateInquiry({ ...good, name: "Pat\u0000 Example", description: "x".repeat(5000) });
    expect(v.ok).toBe(false);
    const w = validateInquiry({ ...good, name: "Pat\u0000 Example" });
    expect(w.ok && w.record?.name).toBe("Pat Example");
  });

  it("emails the owner, never the visitor, and says it isn't accepted yet", () => {
    const v = validateInquiry(good);
    if (!v.ok || !v.record) throw new Error("expected a record");
    const mail = buildInquiryMail(v.record, {});
    expect(mail.to).toBe("ask@openmirrorllc.com");
    expect(mail.subject).toContain("Business Website");
    expect(mail.text).toContain("not accepted until you reply");
    expect(mail.text).toContain("pat@example.com");
  });

  it("the migration and the on-first-use statement agree", () => {
    const sql = readFileSync("migrations/006_project_inquiries.sql", "utf8");
    expect(sql).toContain(PROJECT_INQUIRIES_DDL);
  });

  it("the route never logs what a person typed", () => {
    const src = readFileSync("app/api/inquiry/route.ts", "utf8");
    for (const m of src.matchAll(/console\.\w+\(([^;]*)\);/g)) {
      expect(m[1]).not.toMatch(/body|stored\.|description|email|name/);
    }
  });
});
