import { beforeEach, describe, expect, it } from "vitest";
import {
  createFeedback,
  listAllFeedback,
  markFeedbackStatus,
  MAX_FEEDBACK_PER_USER,
  MAX_MESSAGE_LENGTH,
} from "./feedback";
import { MemoryMemberStore } from "./store";

const NOW = new Date("2026-08-06T12:00:00.000Z");

describe("feedback", () => {
  let store: MemoryMemberStore;

  beforeEach(() => {
    store = new MemoryMemberStore();
  });

  it("accepts a valid submission with a known category", async () => {
    const result = await createFeedback(
      store,
      "user-1",
      { category: "bug", message: "The idea box eats my last sentence.", contextUrl: "/engines?engine=idea" },
      NOW,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.userId).toBe("user-1");
    expect(result.value.category).toBe("bug");
    expect(result.value.status).toBe("new");
    expect(result.value.createdAt).toBe(NOW.toISOString());
    const all = await store.listFeedback();
    expect(all).toHaveLength(1);
  });

  it("rejects an unknown category", async () => {
    const result = await createFeedback(store, "user-1", { category: "rant", message: "x", contextUrl: "" }, NOW);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(422);
  });

  it("rejects empty or oversized messages", async () => {
    const empty = await createFeedback(store, "user-1", { category: "idea", message: "   ", contextUrl: "" }, NOW);
    expect(empty.ok).toBe(false);
    const huge = await createFeedback(
      store,
      "user-1",
      { category: "idea", message: "x".repeat(MAX_MESSAGE_LENGTH + 1), contextUrl: "" },
      NOW,
    );
    expect(huge.ok).toBe(false);
  });

  it("strips control characters but keeps newlines", async () => {
    const result = await createFeedback(
      store,
      "user-1",
      { category: "other", message: "line one\nline two\x00\x07", contextUrl: "" },
      NOW,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.message).toBe("line one\nline two");
  });

  it("only stores a same-site path as contextUrl, never an external URL", async () => {
    const good = await createFeedback(store, "user-1", { category: "idea", message: "ok", contextUrl: "/account" }, NOW);
    expect(good.ok && good.value.contextUrl).toBe("/account");
    const bad = await createFeedback(
      store,
      "user-1",
      { category: "idea", message: "ok", contextUrl: "https://evil.example/phish" },
      NOW,
    );
    expect(bad.ok && bad.value.contextUrl).toBe("");
  });

  it("caps submissions per user", async () => {
    for (let i = 0; i < MAX_FEEDBACK_PER_USER; i++) {
      const r = await createFeedback(store, "user-1", { category: "idea", message: `n${i}`, contextUrl: "" }, NOW);
      expect(r.ok).toBe(true);
    }
    const over = await createFeedback(store, "user-1", { category: "idea", message: "one more", contextUrl: "" }, NOW);
    expect(over.ok).toBe(false);
    if (over.ok) return;
    expect(over.status).toBe(409);
    // a different user is unaffected by another user's cap
    const other = await createFeedback(store, "user-2", { category: "idea", message: "hi", contextUrl: "" }, NOW);
    expect(other.ok).toBe(true);
  });

  it("acting user id is never taken from the submitted payload", async () => {
    // The signature has no field for a submitted user id — the caller must
    // pass the server-verified actingUserId. This test documents that
    // contract: whatever the caller passes is what gets stored.
    const result = await createFeedback(store, "server-verified-id", { category: "idea", message: "hi", contextUrl: "" }, NOW);
    expect(result.ok && result.value.userId).toBe("server-verified-id");
  });

  it("listAllFeedback returns every submission, newest first", async () => {
    await createFeedback(store, "user-1", { category: "idea", message: "first", contextUrl: "" }, new Date("2026-08-01T00:00:00.000Z"));
    await createFeedback(store, "user-2", { category: "bug", message: "second", contextUrl: "" }, new Date("2026-08-02T00:00:00.000Z"));
    const all = await listAllFeedback(store);
    expect(all).toHaveLength(2);
    expect(all[0].message).toBe("second");
    expect(all[1].message).toBe("first");
  });

  it("markFeedbackStatus updates only the targeted record", async () => {
    const a = await createFeedback(store, "user-1", { category: "bug", message: "a", contextUrl: "" }, NOW);
    const b = await createFeedback(store, "user-1", { category: "bug", message: "b", contextUrl: "" }, NOW);
    if (!a.ok || !b.ok) throw new Error("setup failed");
    await markFeedbackStatus(store, a.value.id, "reviewed");
    const all = await listAllFeedback(store);
    expect(all.find((f) => f.id === a.value.id)?.status).toBe("reviewed");
    expect(all.find((f) => f.id === b.value.id)?.status).toBe("new");
  });
});
