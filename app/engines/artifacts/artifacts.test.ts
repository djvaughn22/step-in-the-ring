// Every question-driven engine must end with a usable artifact for a real
// first-time visitor — not a template, not echoed answers, not generic advice.
// These fixtures are the shared end-to-end scenarios the engines were tested
// with in the browser (fictional, neutral content).
import { describe, expect, it } from "vitest";
import { artifactToMarkdown, engineArtifact, IDK } from "./index";

const NOW = new Date("2026-10-22T15:00:00Z");
const CHORES = "A weekly chore board where parents assign chores, kids check them off, and everyone sees what is done.";

// Filler the old engines produced. None of it may appear in an artifact.
const FILLER = [
  /build the single core action/i,
  /\[(name|date|specific action|person|day|amount|time)[^\]]*\]/i,
  /engine or specialty not found/i,
  /must be inspected from the repo\. do not guess/i,
  /what must happen before what\?/i,
  /\bOpen it\b$/m,
  /\(as you described\)|\(as described\)/i,
];

function md(engineId: string, a: Record<string, string>) {
  const art = engineArtifact(engineId, a, NOW);
  expect(art, engineId).not.toBeNull();
  const text = artifactToMarkdown(art!);
  for (const re of FILLER) expect(text, `${engineId} contains filler ${re}`).not.toMatch(re);
  expect(art!.nextAction.length).toBeGreaterThan(20);
  return { art: art!, text };
}

describe("Build — chore board", () => {
  it("produces the MVP scope and a paste-ready prompt from one sentence", () => {
    const { art, text } = md("build", { purpose: CHORES });
    expect(text).toMatch(/A parent can assign chores/);
    expect(text).toMatch(/A kid can check chores off/);
    expect(text).toMatch(/assignedTo/);
    expect(text).toMatch(/Empty the dishwasher/);
    expect(art.prompt!.text).toMatch(/DONE WHEN/);
    expect(art.prompt!.text).toMatch(/reload the page/);
    // The device question was unanswered: a labeled, editable assumption.
    expect(art.assumptions.join(" ")).toMatch(/ONE shared device/);
  });

  it("own devices changes the result: a hosted database, no accounts", () => {
    const { art } = md("build", { purpose: CHORES, devices: "Each on their own phone or computer" });
    expect(art.prompt!.text).toMatch(/Supabase/);
    expect(art.prompt!.text).toMatch(/second phone/);
  });

  it("is honest when it can't find what people do", () => {
    const { art } = md("build", { purpose: "Something cool" });
    expect(art.limitation).toBeTruthy();
  });
});

describe("Fix — chore disappears after refresh", () => {
  it("names the kind of bug, ranked causes, and the evidence to get", () => {
    const { art, text } = md("fix", { symptom: "When I add a new chore and press Save it shows up, but after I refresh the page the new chore is gone.", exists: IDK, error: IDK });
    expect(text).toMatch(/persistence bug/);
    expect(text).toMatch(/never written to storage/);
    expect(text).toMatch(/Network tab/);
    expect(text).toMatch(/Local Storage/);
    expect(art.prompt!.text).toMatch(/Add a chore, reload the page/);
    expect(art.limitation).toBeUndefined();
  });

  it("says so when the symptom matches no known pattern", () => {
    const { art } = md("fix", { symptom: "It feels weird." });
    expect(art.limitation).toMatch(/doesn't point to one/);
  });
});

describe("Plan — school fundraiser", () => {
  it("makes dated phases, owners, dependencies and a next action", () => {
    const { art, text } = md("plan", { outcome: "A school fundraiser in six weeks with a $3,000 goal", people: IDK });
    expect(text).toMatch(/Thu, Oct 22 → Thu, Oct 29/);
    expect(text).toMatch(/Thu, Dec 3/);
    expect(text).toMatch(/60 families/);
    expect(text).toMatch(/Approval → before any flyer/);
    expect(art.nextAction).toMatch(/^Fri, Oct 23 — You: Email the principal/);
    expect(art.assumptions.join(" ")).toMatch(/Format: a pledge drive/);
  });

  it("re-times to a real date", () => {
    const { text } = md("plan", { outcome: "Family reunion picnic", deadline: "June 13" });
    expect(text).toMatch(/Sun, Jun 13|Sat, Jun 13/);
  });
});

describe("Sell, Launch, Grow", () => {
  it("Sell: an offer with a price to test, copy, and a test", () => {
    const { text } = md("sell", { product: "Printable chore charts for families with young kids", price: IDK });
    expect(text).toMatch(/Price to test: \$9/);
    expect(text).toMatch(/Message to send/);
  });
  it("Launch: messages and dated launch week", () => {
    const { text } = md("launch", { what: "A weekly chore board web app", exists: "https://chores.example.com", audience: "parents at my kids' school" });
    expect(text).toMatch(/https:\/\/chores\.example\.com/);
    expect(text).toMatch(/Sun, Oct 25: announce/);
  });
  it("Grow: experiment with a baseline from the visitor's numbers", () => {
    const { text } = md("grow", { measure: "weekly signups", bottleneck: "they visit but don't sign up", evidence: "400 visitors, 6 signups last month" });
    expect(text).toMatch(/6 of 400 \(1.5%\)/);
    expect(text).toMatch(/Win: 8 of 400/);
  });
});

describe("I don't know is a valid answer everywhere", () => {
  it("never echoes it back as if it were content", () => {
    for (const id of ["build", "fix", "plan", "sell", "launch", "grow"]) {
      const a = { purpose: CHORES, symptom: "Save does nothing on my phone", outcome: "A bake sale", product: "Cookies", what: "A bake sale", measure: "sales" } as Record<string, string>;
      for (const k of ["devices", "exists", "error", "when", "protect", "deadline", "people", "situation", "customer", "price", "channel", "audience", "worried", "bottleneck", "evidence", "guess", "constraint"]) a[k] = IDK;
      const { text } = md(id, a);
      expect(text, id).not.toMatch(/I don't know/);
    }
  });
});

describe("plan reads a headcount typed into the outcome", () => {
  it("names volunteers instead of assuming two helpers when the people question is blank", async () => {
    const { planArtifact } = await import("./plan");
    const art = planArtifact({ outcome: "Neighborhood yard sale on Nov 14 with me and 3 volunteers" }, new Date("2026-10-28T12:00:00Z"));
    const all = art.sections.map((s) => s.body).join("\n");
    expect(all).toContain("Volunteer 1");
    expect(all).not.toMatch(/It's you plus two helpers/);
  });
});

describe("a unit of measure is never the thing being logged", () => {
  it("a practice log tracks practice, not minutes", async () => {
    const { readProduct } = await import("./product");
    expect(readProduct("A practice log where players record minutes practiced each day and coaches see the totals").entity).toBe("practice");
    expect(readProduct("A weekly chore board where parents assign chores, kids check them off").entity).toBe("chore");
  });
});
