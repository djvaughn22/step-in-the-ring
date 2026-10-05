// Usage counts, visitor feedback and the owner's report: the privacy promises
// on the About page are only as good as these checks.
import { beforeEach, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { cleanSource, isUsageEvent, pageSlug, trackingRefused } from "./usage";
import { allow, resetRateLimits } from "./rateLimit";
import { MemoryMemberStore, VISITOR_FEEDBACK_DDL } from "../members/store";
import { buildVisitorFeedbackMail, cleanContextPath, createVisitorFeedback } from "../members/visitorFeedback";
import { buildUsageReport, dayKeys } from "../owner/usageReport";

const root = join(__dirname, "..", "..");
const read = (p: string) => readFileSync(join(root, p), "utf8");

describe("what gets counted", () => {
  it("counts only allowlisted events", () => {
    expect(isUsageEvent("page-view")).toBe(true);
    expect(isUsageEvent("idea-text")).toBe(false);
    expect(isUsageEvent(undefined)).toBe(false);
  });

  it("turns public pages into slugs and refuses everything else", () => {
    expect(pageSlug("/")).toBe("home");
    expect(pageSlug("/tools/first-version")).toBe("tools-first-version");
    expect(pageSlug("/create?idea=my%20secret%20plan")).toBe("create");
    expect(pageSlug("/builds/abc123")).toBe("builds-item");
    for (const p of ["/owner", "/owner/usage", "/account", "/projects", "/author", "/nope"]) expect(pageSlug(p)).toBeNull();
  });

  it("keeps labels to short slugs, so no sentence can ride along", () => {
    expect(cleanSource("My Secret Idea: a bakery!")).toBe("mysecretideaabakery");
    expect(cleanSource("x".repeat(99))).toHaveLength(40);
    expect(cleanSource({})).toBe("");
  });

  it("sends nothing when the browser asks not to be tracked", () => {
    expect(trackingRefused({ doNotTrack: "1" })).toBe(true);
    expect(trackingRefused({ globalPrivacyControl: true })).toBe(true);
    expect(trackingRefused({ doNotTrack: null })).toBe(false);
  });

  it("drops the owner's own visits and always answers 204", () => {
    const route = read("app/api/usage/route.ts");
    expect(route).toMatch(/isOwnerRequest\(req\)\) return done\(\)/);
    expect(route).not.toMatch(/status: (4|5)\d\d/);
  });

  it("is mounted once, site-wide", () => {
    expect(read("app/layout.tsx")).toMatch(/<UsageCounter \/>/);
  });
});

describe("rate limit", () => {
  beforeEach(() => resetRateLimits());
  it("allows up to the limit inside the window, then refuses, then resets", () => {
    for (let i = 0; i < 3; i++) expect(allow("k", 3, 1000, 0)).toBe(true);
    expect(allow("k", 3, 1000, 10)).toBe(false);
    expect(allow("k", 3, 1000, 2000)).toBe(true);
  });
});

describe("feedback from anyone", () => {
  it("stores a note with no account, path only", async () => {
    const store = new MemoryMemberStore();
    const r = await createVisitorFeedback(store, {
      category: "bug",
      message: "  The cutter lost my list  ",
      contextUrl: "/create?idea=my%20private%20idea",
    });
    expect(r.ok).toBe(true);
    const [saved] = await store.listVisitorFeedback();
    expect(saved.message).toBe("The cutter lost my list");
    expect(saved.contextUrl).toBe("/create");
    expect(saved.replyEmail).toBe("");
  });

  it("refuses an unknown kind, an empty note, a bad email", async () => {
    const store = new MemoryMemberStore();
    expect((await createVisitorFeedback(store, { category: "spam", message: "hi", contextUrl: "/" })).ok).toBe(false);
    expect((await createVisitorFeedback(store, { category: "idea", message: "   ", contextUrl: "/" })).ok).toBe(false);
    expect((await createVisitorFeedback(store, { category: "idea", message: "x".repeat(2001), contextUrl: "/" })).ok).toBe(false);
    expect((await createVisitorFeedback(store, { category: "idea", message: "hi", contextUrl: "/", replyEmail: "not-an-email" })).ok).toBe(false);
    expect(await store.listVisitorFeedback()).toHaveLength(0);
  });

  it("accepts a bot's honeypot quietly and stores nothing", async () => {
    const store = new MemoryMemberStore();
    const r = await createVisitorFeedback(store, { category: "idea", message: "buy now", contextUrl: "/", website: "spam.example" });
    expect(r).toEqual({ ok: true, stored: null });
    expect(await store.listVisitorFeedback()).toHaveLength(0);
  });

  it("never accepts an outside URL as the page", () => {
    expect(cleanContextPath("https://evil.example/x")).toBe("");
    expect(cleanContextPath("/tools/try-it#x")).toBe("/tools/try-it");
    expect(cleanContextPath("/<script>")).toBe("");
  });

  it("mails the owner, with the tester's email only in the body", async () => {
    const store = new MemoryMemberStore();
    const r = await createVisitorFeedback(store, { category: "loved", message: "Great", contextUrl: "/tools", replyEmail: "Tester@Example.com" });
    if (!r.ok || !r.stored) throw new Error("not stored");
    const mail = buildVisitorFeedbackMail(r.stored, {});
    expect(mail.to).toBe("ask@openmirrorllc.com");
    expect(mail.subject).not.toContain("tester@example.com");
    expect(mail.text).toContain("tester@example.com");
  });

  it("the footer and the Engine Room point at the open form, not a sign-in wall", () => {
    expect(read("app/site/QuietFooterLink.tsx")).toMatch(/<TesterFeedback /);
    expect(read("app/engines/EngineSystem.tsx")).not.toMatch(/account#feedback/);
    const form = read("app/site/TesterFeedback.tsx");
    expect(form).toMatch(/contextUrl: window\.location\.pathname/);
    expect(form).not.toMatch(/location\.(href|search)/);
  });

  it("the table the code creates matches the migration file", () => {
    const sql = read("migrations/004_visitor_feedback.sql");
    for (const stmt of VISITOR_FEEDBACK_DDL.split(";").map((s) => s.trim()).filter(Boolean)) {
      expect(sql.replace(/\s+/g, " ")).toContain(stmt.replace(/\s+/g, " "));
    }
  });
});

describe("the owner's usage report", () => {
  const now = new Date("2026-10-04T18:00:00Z");
  const [today, yesterday] = dayKeys(now, 2);

  it("adds up visitors, returns, ideas and engine runs by window", async () => {
    const store = new MemoryMemberStore();
    const at = (iso: string, event: string, source = "") => store.recordEvent({ event, source, createdAt: iso });
    await at("2026-10-04T15:00:00Z", "daily-visitor");
    await at("2026-10-04T15:00:01Z", "page-view", "home");
    await at("2026-10-04T15:00:02Z", "page-view", "tools");
    await at("2026-10-04T15:00:03Z", "idea-shaped", "app");
    await at("2026-10-03T15:00:00Z", "daily-visitor");
    await at("2026-10-03T15:00:00Z", "returning-visitor");
    await at("2026-10-03T15:00:01Z", "engine-start", "plan");
    await at("2026-10-03T15:00:02Z", "engine-output", "plan");
    await at("2026-08-01T15:00:00Z", "daily-visitor"); // outside 30 days
    await at("2026-10-04T15:00:00Z", "membership-page-visit"); // older counter, ignored

    const report = buildUsageReport(await store.summarizeEvents("2026-01-01T00:00:00Z"), now);
    expect(report.last7).toMatchObject({ visitors: 2, returning: 1, pageViews: 2, ideas: 1, engineStarts: 1, engineOutputs: 1 });
    expect(report.last30.visitors).toBe(2);
    expect(report.days[0]).toMatchObject({ day: today, visitors: 1, pageViews: 2, ideas: 1 });
    expect(report.days[1]).toMatchObject({ day: yesterday, visitors: 1, engineOutputs: 1 });
    expect(report.days).toHaveLength(14);
    expect(report.topPages.map((p) => p.name)).toEqual(expect.arrayContaining(["Home", "Free tools"]));
    expect(report.engines).toEqual([{ id: "plan", starts: 1, outputs: 1 }]);
  });

  it("is an owner page, gated in the page itself", () => {
    const page = read("app/owner/usage/page.tsx");
    expect(page).toMatch(/if \(!\(await isOwnerAuthed\(\)\)\) redirect\(/);
    expect(page).toMatch(/index: false/);
  });
});
