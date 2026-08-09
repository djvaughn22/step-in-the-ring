// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { clearDraft, loadDraft, saveDraft } from "./draft";

const SAID = "A game where you dodge falling tacos and beat your friend's score.";

beforeEach(() => {
  window.sessionStorage.clear();
  window.localStorage.clear();
});

describe("an idea in flight", () => {
  it("survives the trip to sign-in and back", () => {
    expect(saveDraft(SAID, { audience: "my kids" })).toBe(true);
    const back = loadDraft()!;
    expect(back.intent).toBe(SAID);
    expect(back.answers).toEqual({ audience: "my kids" });
  });

  it("is session state, never left behind in localStorage", () => {
    saveDraft(SAID);
    expect(window.sessionStorage.length).toBe(1);
    // A draft that outlived the visit would be a lie about being saved.
    expect(window.localStorage.length).toBe(0);
  });

  it("is gone once the build is real", () => {
    saveDraft(SAID);
    clearDraft();
    expect(loadDraft()).toBeNull();
  });

  it("keeps an empty answer, because 'decide for me' is an answer", () => {
    saveDraft(SAID, { versionOne: "" });
    expect(loadDraft()!.answers).toEqual({ versionOne: "" });
  });

  it("refuses to hold nothing", () => {
    expect(saveDraft("   ")).toBe(false);
    expect(loadDraft()).toBeNull();
  });

  it("never returns a half-read draft", () => {
    window.sessionStorage.setItem("sitr-vnext-draft", "{not json");
    expect(loadDraft()).toBeNull();
    window.sessionStorage.setItem("sitr-vnext-draft", JSON.stringify({ answers: {} }));
    expect(loadDraft()).toBeNull();
  });

  it("bounds what it will carry", () => {
    saveDraft("x".repeat(5000));
    expect(loadDraft()!.intent.length).toBe(2000);

    const many: Record<string, string> = {};
    for (let i = 0; i < 40; i++) many[`k${i}`] = "a";
    saveDraft(SAID, many);
    expect(Object.keys(loadDraft()!.answers).length).toBeLessThanOrEqual(8);
  });

  it("ignores junk somebody put in the key by hand", () => {
    window.sessionStorage.setItem(
      "sitr-vnext-draft",
      JSON.stringify({ intent: SAID, answers: { audience: 42, ok: "yes" } }),
    );
    expect(loadDraft()!.answers).toEqual({ ok: "yes" });
  });
});
