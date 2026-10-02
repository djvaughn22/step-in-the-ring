// @vitest-environment jsdom
// The free tools: pure logic first (the parts that decide what a person sees),
// then a render of each page and the hub, and the rule that none of them ever
// sends anything anywhere.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  EMPTY_CUTTER,
  addFeatures,
  cutAdvice,
  ideaBoxHandoff,
  parseCutterState,
  parseFeatures,
  scopeText,
  type CutterState,
} from "./first-version/cutter";
import { EMPTY_TRY_IT, buildScript, parseTryItState, scriptText } from "./try-it/script";
import { CHECK_GROUPS, checklistText, parseChecklistState, progress, visibleGroups } from "./launch-checklist/checklist";
import ToolsPage from "./page";
import FirstVersionPage from "./first-version/page";
import TryItPage from "./try-it/page";
import LaunchChecklistPage from "./launch-checklist/page";
import { pageAt, navPages } from "../site/registry";

let n = 0;
const id = () => `t${n++}`;

describe("first version cutter", () => {
  it("cleans pasted lists: bullets, numbers, blanks, duplicates", () => {
    expect(parseFeatures("- Sign up\n\n2. Reminders\n* sign up\n[ ] Map\n•  Photos  ")).toEqual([
      "Sign up",
      "Reminders",
      "Map",
      "Photos",
    ]);
  });

  it("adds without disturbing sorted items and never exceeds the cap", () => {
    const first = addFeatures([], "A\nB", id);
    const sorted = first.map((i) => (i.text === "A" ? { ...i, bucket: "now" as const } : i));
    const more = addFeatures(sorted, "a\nC", id);
    expect(more.map((i) => [i.text, i.bucket])).toEqual([["A", "now"], ["B", null], ["C", null]]);
    const big = addFeatures([], Array.from({ length: 60 }, (_, i) => `item ${i}`).join("\n"), id);
    expect(big).toHaveLength(40);
  });

  it("gives advice about the person's own list only", () => {
    const items = Array.from({ length: 7 }, (_, i) => ({ id: `x${i}`, text: `f${i}`, bucket: "now" as const }));
    const advice = cutAdvice({ idea: "x", doneMeans: "", items });
    expect(advice.join(" ")).toMatch(/7 things are in “now”/);
    expect(advice.join(" ")).toMatch(/done means/);
    expect(cutAdvice(EMPTY_CUTTER)).toEqual([]);
  });

  it("outputs only the person's own words, and hands only the now items to the idea box", () => {
    const s: CutterState = {
      idea: "Cleanup sign-up",
      doneMeans: "a neighbor can claim a slot",
      items: [
        { id: "1", text: "Pick a slot", bucket: "now" },
        { id: "2", text: "Reminder texts", bucket: "later" },
        { id: "3", text: "Leaderboard", bucket: "never" },
      ],
    };
    const text = scopeText(s);
    expect(text).toContain("Build now (1)\n- Pick a slot");
    expect(text).toContain("Not doing (1)\n- Leaderboard");
    const handoff = ideaBoxHandoff(s);
    expect(handoff).toContain("Pick a slot");
    expect(handoff).not.toContain("Reminder texts");
    expect(handoff).not.toContain("Leaderboard");
  });

  it("parses saved state safely", () => {
    expect(parseCutterState(null)).toBeNull();
    expect(parseCutterState({ items: "nope" })).toBeNull();
    const ok = parseCutterState({ idea: 5, items: [{ id: "a", text: "x", bucket: "bogus" }, { text: 1 }] });
    expect(ok).toEqual({ idea: "", doneMeans: "", items: [{ id: "a", text: "x", bucket: null }] });
  });
});

describe("try-it script", () => {
  it("builds a non-leading script from the person's own task", () => {
    const s = buildScript({ what: "a sign-up page", task: "to sign up for Saturday", goal: "do" });
    expect(s.before[0]).toContain("I made a sign-up page");
    expect(s.task).toContain("Could you try to sign up for Saturday?");
    expect(s.questions.length).toBeGreaterThanOrEqual(4);
    for (const q of s.questions) expect(q).not.toMatch(/love|great|easy|amazing/i);
  });

  it("changes the questions with the goal", () => {
    const a = buildScript({ what: "", task: "", goal: "understand" }).questions;
    const b = buildScript({ what: "", task: "", goal: "return" }).questions;
    expect(a).not.toEqual(b);
  });

  it("includes notes in the copy only once something is written", () => {
    expect(scriptText(EMPTY_TRY_IT)).not.toContain("Notes");
    const withNotes = scriptText({ ...EMPTY_TRY_IT, notes: { ...EMPTY_TRY_IT.notes, stuck: "the date picker" } });
    expect(withNotes).toContain("Where they got stuck: the date picker");
  });

  it("parses saved state safely", () => {
    expect(parseTryItState("x")).toBeNull();
    expect(parseTryItState({ goal: "sell" })?.goal).toBe("do");
  });
});

describe("launch checklist", () => {
  it("hides software-only checks for non-software work", () => {
    const soft = visibleGroups(true).flatMap((g) => g.items.map((i) => i.id));
    const plain = visibleGroups(false).flatMap((g) => g.items.map((i) => i.id));
    expect(soft).toContain("secrets");
    expect(plain).not.toContain("secrets");
    expect(plain).not.toContain("git");
  });

  it("has unique ids and counts progress only over visible items", () => {
    const ids = CHECK_GROUPS.flatMap((g) => g.items.map((i) => i.id));
    expect(new Set(ids).size).toBe(ids.length);
    const p = progress({ software: false, done: ["phone", "secrets"] });
    expect(p.done).toBe(1);
    expect(checklistText({ software: true, done: ["phone"] })).toContain("- [x] I opened it on a phone");
  });

  it("drops unknown ids from saved state", () => {
    expect(parseChecklistState({ done: ["phone", "phone", "made-up"], software: false })).toEqual({
      software: false,
      done: ["phone"],
    });
  });
});

describe("free tool pages", () => {
  const render = (C: () => React.ReactElement) => {
    const doc = document.implementation.createHTMLDocument();
    doc.body.innerHTML = renderToStaticMarkup(createElement(C));
    return doc;
  };

  it("each tool page has one h1, the privacy note, and a way back to the list", () => {
    for (const Page of [FirstVersionPage, TryItPage, LaunchChecklistPage]) {
      const doc = render(Page);
      expect(doc.querySelectorAll("h1")).toHaveLength(1);
      expect(doc.body.textContent).toContain("never sent anywhere");
      expect(doc.querySelector('a[href="/tools"]')).not.toBeNull();
    }
  });

  it("the hub links every free tool to a real, public, registered page", () => {
    const doc = render(ToolsPage);
    const hrefs = [...doc.querySelectorAll<HTMLAnchorElement>(".rows a")].map((a) => a.getAttribute("href")!);
    for (const h of ["/tools/first-version", "/tools/try-it", "/tools/launch-checklist", "/five-hour-sprint-tool", "/build", "/build-machine"]) {
      expect(hrefs).toContain(h);
    }
    for (const h of hrefs) expect(pageAt(h.split("#")[0])?.access, h).toBe("public");
    expect(doc.body.textContent).not.toMatch(/\$\d|price|purchase|checkout|subscribe/i);
  });

  it("is in the main menu, second, right after Create", () => {
    expect(navPages().map((p) => p.path).slice(0, 2)).toEqual(["/create", "/tools"]);
  });

  it("never sends anything: no fetch, no forms posting anywhere, no analytics", () => {
    const walk = (dir: string): string[] =>
      readdirSync(dir).flatMap((f) => {
        const p = join(dir, f);
        return statSync(p).isDirectory() ? walk(p) : /\.tsx?$/.test(f) && !f.endsWith(".test.ts") ? [p] : [];
      });
    for (const file of walk(__dirname)) {
      const src = readFileSync(file, "utf8");
      expect(src, file).not.toMatch(/\bfetch\(|XMLHttpRequest|sendBeacon|<form|track\(/);
    }
  });
});
