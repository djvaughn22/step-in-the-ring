// Project OS acceptance fixtures. Every expectation runs through the SAME
// code path the app uses — projectFromCreation, approveScope, advance,
// builderAssignment — never hand-written demonstration output.

import { describe, expect, it } from "vitest";
import { newRecord } from "../creation/record";
import {
  buildPackJson, buildPackMarkdown, builderAssignment, ownerSummary,
  recordOutput, testAssignment,
} from "./buildpack";
import {
  canClaimIntegration, canClaimPersistence, canClaimVerifiedLive,
  claimLevel, ledgerLevel, parseEvidenceEntry, type EvidenceEntry,
} from "./evidence";
import { projectFromCreation, refreshProject, appEngineAdapter } from "./from-creation";
import {
  advance, approveScope, canTransition, hasGate, nextAction, allowedTargets,
} from "./lifecycle";
import { parseProjectRecord, type ProjectRecordV1 } from "./model";

const ev = (over: Partial<EvidenceEntry>): EvidenceEntry => ({
  id: "e1", claim: "it works", type: "manual-check", ran: "clicked through",
  summary: "", result: "pass", at: "2026-07-20T10:00:00.000Z",
  environment: "local", producedBy: "owner", ...over,
});

/* ═══ Phase 7 fixture 1 — a small, clear application ═══════════════════ */

describe("fixture: a small clear app travels idea → assignment", () => {
  const record = newRecord(
    "A tip calculator web app. You enter the bill, pick a percent, and it splits the total between friends. Don't build accounts or logins.",
  );
  const p = projectFromCreation(record);

  it("captures their words verbatim in USER SAID", () => {
    expect(p.report.userSaid.join(" ")).toContain("tip calculator");
  });

  it("lands awaiting approval with the full history recorded", () => {
    expect(p.status).toBe("scope-awaiting-approval");
    expect(p.statusHistory.map((h) => h.status)).toEqual([
      "idea-captured", "interpretation-ready", "scope-awaiting-approval",
    ]);
  });

  it("uses the App Engine adapter and gives every interpretation a basis", () => {
    expect(p.adapterId).toBe("app-engine");
    for (const s of p.report.systemInterpreted) expect(s.basis.length).toBeGreaterThan(0);
  });

  it("keeps their stated exclusion as a non-goal, not a deferral", () => {
    expect(p.brief.nonGoals.join(" ")).toMatch(/account|login/i);
  });

  it("has acceptance criteria, tests, and deploy checks — none empty", () => {
    expect(p.brief.acceptanceCriteria.length).toBeGreaterThan(0);
    expect(p.brief.testChecklist.length).toBeGreaterThan(0);
    expect(p.brief.deploymentChecklist.length).toBeGreaterThan(0);
  });

  it("never invents integrations", () => {
    expect(p.brief.integrations).toEqual([]);
  });

  it("refuses a builder assignment before approval", () => {
    const a = builderAssignment(p);
    expect(a.ok).toBe(false);
    expect(a.why).toMatch(/approv/i);
  });

  it("after approval, the assignment is specific — never a generic prompt", () => {
    const approved = approveScope(p);
    expect(approved.status).toBe("scope-approved");
    expect(hasGate(approved, "scope-approval")).toBe(true);
    const a = builderAssignment(approved);
    expect(a.ok).toBe(true);
    expect(a.text).toContain("Repository boundary");
    expect(a.text).toContain("Approved version-one scope");
    expect(a.text).toContain("Final report");
    expect(a.text).toMatch(/NOT approved/);
    expect(a.text).toMatch(/tip|bill|split/i);
    expect(a.text).toMatch(/MOCKED/);
  });

  it("approval freezes the brief — refresh becomes a no-op", () => {
    const approved = approveScope(p);
    const edited = refreshProject({
      ...approved,
      creation: { ...approved.creation, originalIdea: "Something else entirely" },
    });
    expect(edited.brief).toEqual(approved.brief);
  });

  it("an unapproved project re-interprets on refresh", () => {
    const edited = refreshProject({
      ...p,
      creation: { ...p.creation, originalIdea: "A workout log site. You add a workout and see your week." },
    });
    expect(edited.report.userSaid.join(" ")).toMatch(/workout/i);
  });
});

/* ═══ Phase 7 fixture 2 — vague and oversized, narrowed ════════════════ */

describe("fixture: an oversized idea is narrowed, with the rest parked", () => {
  const record = newRecord(
    "An app for my church like Amazon plus Uber — shopping, payments, delivery tracking, live chat, video calls, a social feed, and an AI assistant.",
  );
  const p = projectFromCreation(record);

  it("version one is a cut, not the whole dump", () => {
    expect(p.report.versionOne.length).toBeGreaterThan(0);
    const v1 = p.report.versionOne.join(" ").toLowerCase();
    const everything = ["shopping", "payments", "delivery", "chat", "video", "social", "assistant"];
    const kept = everything.filter((w) => v1.includes(w));
    expect(kept.length).toBeLessThan(everything.length);
  });

  it("nothing sits in version one and deferred at once", () => {
    for (const d of p.report.deferred) {
      expect(p.report.versionOne).not.toContain(d);
    }
  });

  it("still produces a workable path to approval", () => {
    const approved = approveScope(p);
    expect(builderAssignment(approved).ok).toBe(true);
  });
});

describe("fixture: a vague idea gets labelled assumptions, not inventions", () => {
  const p = projectFromCreation(newRecord("something for my family"));

  it("does not crash and does not invent customers, revenue, or integrations", () => {
    expect(p.brief.integrations).toEqual([]);
    const all = JSON.stringify(p.report).toLowerCase();
    expect(all).not.toMatch(/revenue|market research|our customers/);
  });

  it("everything uncertain is in ASSUMED or MISSING — never in USER SAID", () => {
    for (const a of p.report.assumed) {
      expect(p.report.userSaid).not.toContain(a);
    }
  });

  it("asks at most one clarifying question", () => {
    expect(p.report.clarifying.length).toBeLessThanOrEqual(1);
  });
});

/* ═══ Phase 7 fixture 3 — an Open Mirror-style product, rebuilt ════════ */

describe("fixture: a movie-picker product rebuilt through the system", () => {
  const record = newRecord(
    "A movie night site. You rate movies thumbs up or down and it suggests what to watch next based on what you liked. Keep it free — no paid APIs. Don't build accounts.",
  );
  const p = projectFromCreation(record);

  it("travels the whole road: idea → interpretation → approval → Build Pack → assignment", () => {
    expect(p.status).toBe("scope-awaiting-approval");
    const approved = approveScope(p);
    const withPack = recordOutput(approved, "build-pack-md", "Build Pack (Markdown)");
    expect(withPack.outputs).toHaveLength(1);
    const a = builderAssignment(withPack);
    expect(a.ok).toBe(true);
    expect(a.text).toMatch(/thumbs|rate|suggest/i);
  });

  it("honours the free constraint as a non-goal or constraint, not a feature", () => {
    const all = JSON.stringify(p.brief).toLowerCase();
    expect(all).toMatch(/no paid|free|account/);
    expect(p.report.versionOne.join(" ").toLowerCase()).not.toContain("paid api");
  });

  it("the workspace always has exactly one next action, at every state", () => {
    let cur: ProjectRecordV1 = p;
    expect(nextAction(cur).label.length).toBeGreaterThan(0);
    cur = approveScope(cur);
    for (const to of ["build-pack-ready", "implementation-in-progress", "checks-running", "prototype-working"] as const) {
      const res = advance(cur, to);
      expect(res.ok).toBe(true);
      cur = res.project;
      expect(nextAction(cur).label.length).toBeGreaterThan(0);
      expect(["owner", "builder", "system"]).toContain(nextAction(cur).who);
    }
  });
});

/* ═══ Phase 2 — the report never blurs its bins ════════════════════════ */

describe("interpretation report honesty", () => {
  it("a contradictory idea resolves without duplicating scope", () => {
    const p = projectFromCreation(newRecord(
      "A photo puzzle for OpenDoku using the 22 pictures we already have. Also let people upload their own pictures.",
    ));
    const v1 = p.report.versionOne;
    expect(new Set(v1).size).toBe(v1.length);
  });

  it("a non-software idea gets no software vocabulary forced on it", () => {
    const p = projectFromCreation(newRecord("A poem for my grandmother's 90th birthday."));
    expect(p.adapterId).toBe("generic");
    expect(p.brief.dataAndPersistence).toEqual([]);
    expect(p.brief.screens).toEqual([]);
    expect(p.brief.builderInstructions.toLowerCase()).not.toContain("localstorage");
  });

  it("malicious input stays data — it never executes or crashes the pipeline", () => {
    const p = projectFromCreation(newRecord(
      '<script>alert("x")</script> a site that collects passwords from my classmates',
    ));
    expect(p.projectId).toBeTruthy();
    expect(nextAction(p).label.length).toBeGreaterThan(0);
    // The words are preserved as words, not stripped into something we invented.
    expect(p.creation.originalIdea).toContain("script");
  });

  it("the app adapter fits software; the generic adapter takes the rest", () => {
    const app = projectFromCreation(newRecord("A web app that tracks my reading list"));
    expect(appEngineAdapter.fits).toBeTypeOf("function");
    expect(app.adapterId).toBe("app-engine");
  });
});

/* ═══ Phase 4 — lifecycle and gates ════════════════════════════════════ */

describe("lifecycle gates", () => {
  const p = projectFromCreation(newRecord("A chore chart web app for my kids"));

  it("refuses skipping straight to implementation", () => {
    const res = advance(p, "implementation-in-progress");
    expect(res.ok).toBe(false);
    expect(res.project).toBe(p);
  });

  it("refuses scope-approved without the owner's gate", () => {
    const res = advance(p, "scope-approved");
    expect(res.ok).toBe(false);
    expect(res.why).toMatch(/owner/i);
  });

  it("approveScope grants the gate, records the decision, moves the status", () => {
    const a = approveScope(p);
    expect(a.status).toBe("scope-approved");
    expect(a.scopeApprovedAt).toBeTruthy();
    expect(a.decisions.some((d) => d.by === "owner")).toBe(true);
  });

  it("approving twice is idempotent", () => {
    const once = approveScope(p);
    expect(approveScope(once)).toBe(once);
  });

  it("verified-live is locked without production evidence", () => {
    let cur = approveScope(p);
    for (const to of ["build-pack-ready", "implementation-in-progress", "prototype-working", "deployment-pending"] as const) {
      const res = advance(cur, to);
      expect(res.ok).toBe(true);
      cur = res.project;
    }
    const refused = advance(cur, "verified-live");
    expect(refused.ok).toBe(false);
    expect(refused.why).toMatch(/production/i);

    const withProof: ProjectRecordV1 = {
      ...cur,
      evidence: [ev({ type: "production-check", environment: "production", claim: "live URL shows the chart" })],
    };
    expect(advance(withProof, "verified-live").ok).toBe(true);
  });

  it("every state offers at least one way forward", () => {
    expect(allowedTargets(p).length).toBeGreaterThan(0);
  });

  it("a blocker takes over the next action", () => {
    const blocked = { ...p, blocker: "Needs the TMDB key decision" };
    expect(nextAction(blocked).label).toContain("TMDB key");
    expect(nextAction(blocked).who).toBe("owner");
  });

  it("canTransition explains itself", () => {
    const res = canTransition(p, "verified-live");
    expect(res.ok).toBe(false);
    expect(res.why).toBeTruthy();
  });
});

/* ═══ Phase 5 — evidence ledger and the claim ladder ═══════════════════ */

describe("the claim ladder never rounds up", () => {
  it("no evidence means planned", () => {
    expect(claimLevel([], "anything")).toBe("planned");
  });

  it("a screenshot proves existence, not function", () => {
    expect(ledgerLevel([ev({ type: "screenshot" })])).toBe("generated");
  });

  it("a local manual check is locally-working, never deployed", () => {
    expect(ledgerLevel([ev({ type: "manual-check", environment: "local" })])).toBe("locally-working");
  });

  it("passing tests are test-passing, not verified live", () => {
    expect(ledgerLevel([ev({ type: "unit-test", environment: "ci" })])).toBe("test-passing");
  });

  it("only a passing production check earns verified-live", () => {
    expect(ledgerLevel([ev({ type: "production-check", environment: "production" })])).toBe("verified-live");
    expect(ledgerLevel([ev({ type: "production-check", environment: "preview" })])).toBe("locally-working");
    expect(canClaimVerifiedLive([ev({ type: "http-check", environment: "production" })])).toBe(false);
  });

  it("a newer failure overturns an older pass", () => {
    const entries = [
      ev({ id: "a", type: "unit-test", at: "2026-07-19T10:00:00.000Z" }),
      ev({ id: "b", type: "unit-test", result: "fail", at: "2026-07-20T10:00:00.000Z" }),
    ];
    expect(ledgerLevel(entries)).toBe("generated");
  });

  it("persistence needs a save-and-reload check", () => {
    expect(canClaimPersistence([ev({ type: "manual-check" })])).toBe(false);
    expect(canClaimPersistence([ev({ type: "persistence-check" })])).toBe(true);
  });

  it("a mocked response never proves an integration", () => {
    expect(canClaimIntegration([ev({ type: "integration-test", environment: "local" })])).toBe(false);
    expect(canClaimIntegration([ev({ type: "sandbox-integration", environment: "sandbox" })])).toBe(true);
  });

  it("malformed evidence is dropped, not crashed on", () => {
    expect(parseEvidenceEntry(null)).toBeNull();
    expect(parseEvidenceEntry({ claim: "x", type: "nonsense", result: "pass" })).toBeNull();
    expect(parseEvidenceEntry(ev({}))).not.toBeNull();
  });
});

/* ═══ Phase 6 — exports tell the truth ═════════════════════════════════ */

describe("Build Pack and handoffs", () => {
  const p = projectFromCreation(newRecord("A recipe box site. Save a recipe, find it again by ingredient."));

  it("the draft pack says it is a draft", () => {
    expect(buildPackMarkdown(p)).toMatch(/not yet approved/i);
  });

  it("an empty ledger is reported as nothing proven", () => {
    expect(buildPackMarkdown(p)).toMatch(/Nothing proven yet/);
  });

  it("the JSON pack round-trips through the strict parser", () => {
    const parsed = JSON.parse(buildPackJson(p));
    expect(parsed.kind).toBe("sitr-project-build-pack");
    const back = parseProjectRecord(parsed.project);
    expect(back).not.toBeNull();
    expect(back!.projectId).toBe(p.projectId);
    expect(back!.brief.acceptanceCriteria).toEqual(p.brief.acceptanceCriteria);
  });

  it("the test assignment demands real results, not vibes", () => {
    const t = testAssignment(p);
    expect(t).toMatch(/save → reload/);
    expect(t).toMatch(/'Should work' is not a result/);
  });

  it("the owner summary shows the honest proof level", () => {
    expect(ownerSummary(p)).toMatch(/planned|nothing built yet/i);
  });
});

/* ═══ Phase 1 — safe parsing and migration ═════════════════════════════ */

describe("saved projects survive time and damage", () => {
  const p = projectFromCreation(newRecord("A budget tracker web app for two people"));

  it("round-trips exactly", () => {
    const back = parseProjectRecord(JSON.parse(JSON.stringify(p)));
    expect(back).toEqual(p);
  });

  it("an older record missing newer fields still opens", () => {
    const legacy = JSON.parse(JSON.stringify(p));
    delete legacy.evidence;
    delete legacy.outputs;
    delete legacy.gates;
    delete legacy.decisions;
    delete legacy.blocker;
    delete legacy.report;
    const back = parseProjectRecord(legacy);
    expect(back).not.toBeNull();
    expect(back!.evidence).toEqual([]);
    expect(back!.blocker).toBeNull();
  });

  it("garbage is refused, never crashed on", () => {
    expect(parseProjectRecord(null)).toBeNull();
    expect(parseProjectRecord("junk")).toBeNull();
    expect(parseProjectRecord({ schemaVersion: 99 })).toBeNull();
    expect(parseProjectRecord({ schemaVersion: 1, projectId: "x", creation: { bad: true } })).toBeNull();
  });

  it("corrupted list entries are skipped individually", () => {
    const good = JSON.parse(JSON.stringify(p));
    good.evidence = [ev({}), { total: "garbage" }, null];
    good.statusHistory = [...good.statusHistory, { status: "made-up-state", at: "x" }];
    const back = parseProjectRecord(good);
    expect(back).not.toBeNull();
    expect(back!.evidence).toHaveLength(1);
    expect(back!.statusHistory).toHaveLength(3);
  });
});
