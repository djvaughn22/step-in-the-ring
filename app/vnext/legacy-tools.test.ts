// @vitest-environment jsdom
// Your work finds the free tools and the Sprint planner — but only when the
// person actually put something in. Opening a tool once saves a blank form;
// that must not show up as "work".
import { beforeEach, describe, expect, it } from "vitest";
import { findLegacyWork } from "./legacy";
import { EMPTY_CUTTER } from "../tools/first-version/cutter";
import { EMPTY_TRY_IT } from "../tools/try-it/script";
import { EMPTY_EXPLAINER } from "../tools/one-liner/explainer";
import { EMPTY_CHECKLIST } from "../tools/launch-checklist/checklist";

const keys = () => findLegacyWork().map((f) => f.key);

describe("free tools in Your work", () => {
  beforeEach(() => localStorage.clear());

  it("ignores a tool that was only opened", () => {
    localStorage.setItem("sitr-tool-first-version", JSON.stringify(EMPTY_CUTTER));
    localStorage.setItem("sitr-tool-try-it", JSON.stringify(EMPTY_TRY_IT));
    localStorage.setItem("sitr-tool-one-liner", JSON.stringify(EMPTY_EXPLAINER));
    localStorage.setItem("sitr-tool-launch-checklist", JSON.stringify(EMPTY_CHECKLIST));
    localStorage.setItem("fhs-sprints", "[]");
    expect(keys()).toEqual([]);
  });

  it("finds a tool somebody actually used", () => {
    localStorage.setItem("sitr-tool-first-version", JSON.stringify({ ...EMPTY_CUTTER, idea: "A chore chart" }));
    localStorage.setItem("sitr-tool-try-it", JSON.stringify({ ...EMPTY_TRY_IT, notes: { ...EMPTY_TRY_IT.notes, stuck: "the login" } }));
    localStorage.setItem("sitr-tool-launch-checklist", JSON.stringify({ ...EMPTY_CHECKLIST, done: ["phone"] }));
    localStorage.setItem("fhs-sprints", JSON.stringify([{ id: "s1" }]));
    expect(keys()).toEqual(
      expect.arrayContaining(["sitr-tool-first-version", "sitr-tool-try-it", "sitr-tool-launch-checklist", "fhs-sprints"]),
    );
    expect(keys()).not.toContain("sitr-tool-one-liner");
  });

  it("survives a corrupt saved value", () => {
    localStorage.setItem("sitr-tool-one-liner", "{not json");
    expect(keys()).toEqual([]);
  });

  it("shows the person's own name for the latest thing, shortened", () => {
    localStorage.setItem("sitr-tool-first-version", JSON.stringify({ ...EMPTY_CUTTER, idea: "  A chore   chart  " }));
    localStorage.setItem("fhs-sprints", JSON.stringify([{ id: "a", deliverable: "Old one" }, { id: "b", deliverable: "Finish the sign-up page" }]));
    localStorage.setItem(
      "sitr-engine-projects-v1",
      JSON.stringify({ version: 1, projects: [
        { id: "1", name: "Older", updatedAt: "2026-09-01T00:00:00Z" },
        { id: "2", name: "x".repeat(90), updatedAt: "2026-10-01T00:00:00Z" },
      ] }),
    );
    const byKey = Object.fromEntries(findLegacyWork().map((f) => [f.key, f.title]));
    expect(byKey["sitr-tool-first-version"]).toBe("A chore chart");
    expect(byKey["fhs-sprints"]).toBe("Finish the sign-up page");
    expect(byKey["sitr-engine-projects-v1"]).toHaveLength(58);
    expect(byKey["sitr-engine-projects-v1"]?.endsWith("…")).toBe(true);
  });
});
