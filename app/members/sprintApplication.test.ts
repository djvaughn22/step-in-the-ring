import { beforeEach, describe, expect, it } from "vitest";
import {
  createSprintApplication,
  listSprintApplications,
  markSprintApplicationStatus,
  MAX_FIELD_LENGTH,
  MAX_NAME_LENGTH,
  sprintApplicationRateLimited,
  __resetSprintApplicationRateLimit,
} from "./sprintApplication";
import { MemoryMemberStore } from "./store";

const NOW = new Date("2026-08-27T12:00:00.000Z");

const VALID = {
  name: "Dana Owner",
  email: "dana@example.com",
  whatToFinish: "A booking page for my studio.",
  successLooksLike: "A customer can pick a time and pay.",
  timing: "asap",
  teamSize: "individual",
  marketingConsent: false,
};

describe("sprint applications", () => {
  let store: MemoryMemberStore;

  beforeEach(() => {
    store = new MemoryMemberStore();
    __resetSprintApplicationRateLimit();
  });

  it("accepts a valid application with no member account involved", async () => {
    const result = await createSprintApplication(store, VALID, NOW);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.name).toBe("Dana Owner");
    expect(result.value.email).toBe("dana@example.com");
    expect(result.value.status).toBe("new");
    expect(result.value.createdAt).toBe(NOW.toISOString());
    const all = await listSprintApplications(store);
    expect(all).toHaveLength(1);
  });

  it("lowercases the stored email", async () => {
    const result = await createSprintApplication(store, { ...VALID, email: "Dana@EXAMPLE.com" }, NOW);
    expect(result.ok && result.value.email).toBe("dana@example.com");
  });

  it("rejects a missing or blank name", async () => {
    const result = await createSprintApplication(store, { ...VALID, name: "   " }, NOW);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(422);
  });

  it("rejects an oversized name", async () => {
    const result = await createSprintApplication(store, { ...VALID, name: "x".repeat(MAX_NAME_LENGTH + 1) }, NOW);
    expect(result.ok).toBe(false);
  });

  it("rejects a malformed email", async () => {
    const result = await createSprintApplication(store, { ...VALID, email: "not-an-email" }, NOW);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(422);
  });

  it("rejects an empty or oversized 'what to finish'", async () => {
    const empty = await createSprintApplication(store, { ...VALID, whatToFinish: "" }, NOW);
    expect(empty.ok).toBe(false);
    const huge = await createSprintApplication(
      store,
      { ...VALID, whatToFinish: "x".repeat(MAX_FIELD_LENGTH + 1) },
      NOW,
    );
    expect(huge.ok).toBe(false);
  });

  it("rejects an empty 'success looks like'", async () => {
    const result = await createSprintApplication(store, { ...VALID, successLooksLike: "" }, NOW);
    expect(result.ok).toBe(false);
  });

  it("rejects an unknown timing value", async () => {
    const result = await createSprintApplication(store, { ...VALID, timing: "yesterday" }, NOW);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(422);
  });

  it("rejects an unknown team size value", async () => {
    const result = await createSprintApplication(store, { ...VALID, teamSize: "a crowd" }, NOW);
    expect(result.ok).toBe(false);
  });

  it("never defaults marketing consent to true — only a literal boolean true opts in", async () => {
    const missing = await createSprintApplication(store, { ...VALID, marketingConsent: undefined }, NOW);
    expect(missing.ok && missing.value.marketingConsent).toBe(false);

    const truthyString = await createSprintApplication(store, { ...VALID, marketingConsent: "true" }, NOW);
    expect(truthyString.ok && truthyString.value.marketingConsent).toBe(false);

    const explicitTrue = await createSprintApplication(store, { ...VALID, marketingConsent: true }, NOW);
    expect(explicitTrue.ok && explicitTrue.value.marketingConsent).toBe(true);
  });

  it("strips control characters from free-text fields", async () => {
    const result = await createSprintApplication(
      store,
      { ...VALID, whatToFinish: "line one\nline two\x00\x07" },
      NOW,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.whatToFinish).toBe("line one\nline two");
  });

  it("owner can mark an application reviewed and back to new", async () => {
    const created = await createSprintApplication(store, VALID, NOW);
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    await markSprintApplicationStatus(store, created.value.id, "reviewed");
    let all = await listSprintApplications(store);
    expect(all[0].status).toBe("reviewed");
    await markSprintApplicationStatus(store, created.value.id, "new");
    all = await listSprintApplications(store);
    expect(all[0].status).toBe("new");
  });

  it("lists newest first", async () => {
    await createSprintApplication(store, VALID, new Date("2026-08-01T00:00:00.000Z"));
    await createSprintApplication(store, { ...VALID, email: "later@example.com" }, new Date("2026-08-20T00:00:00.000Z"));
    const all = await listSprintApplications(store);
    expect(all[0].email).toBe("later@example.com");
  });
});

describe("sprint application rate limiting", () => {
  beforeEach(() => {
    __resetSprintApplicationRateLimit();
  });

  it("allows a handful of attempts then blocks the same key", () => {
    const key = "ip-under-test";
    const now = Date.now();
    for (let i = 0; i < 5; i++) {
      expect(sprintApplicationRateLimited(key, now)).toBe(false);
    }
    expect(sprintApplicationRateLimited(key, now)).toBe(true);
  });

  it("does not block a different key", () => {
    const now = Date.now();
    for (let i = 0; i < 5; i++) sprintApplicationRateLimited("ip-a", now);
    expect(sprintApplicationRateLimited("ip-b", now)).toBe(false);
  });

  it("resets after the window passes", () => {
    const key = "ip-window";
    const start = Date.now();
    for (let i = 0; i < 5; i++) sprintApplicationRateLimited(key, start);
    expect(sprintApplicationRateLimited(key, start)).toBe(true);
    expect(sprintApplicationRateLimited(key, start + 61 * 60 * 1000)).toBe(false);
  });
});
