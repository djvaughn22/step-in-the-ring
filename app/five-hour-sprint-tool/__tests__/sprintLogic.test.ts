import { describe, expect, it } from "vitest";
import {
  linesFrom,
  sprintReadyState,
  generateTaskPacket,
  generateReport,
  type Sprint,
  type AllowanceEntry,
} from "../sprintLogic";

function baseSprint(overrides: Partial<Sprint> = {}): Sprint {
  return {
    id: "1",
    deliverable: "Fix the thing",
    repository: "some-repo",
    branch: "main",
    startCommit: "abc1234",
    acceptanceCase: "Feature X works in production",
    protectedSystems: ["Auth flow"],
    requiredChecks: ["npm test", "npm run build"],
    deploymentPath: "vercel (auto on push)",
    availableAllowance: 200,
    implementationAllowance: 100,
    testingAllowance: 50,
    recoveryAllowance: 50,
    createdAt: "2026-08-05T00:00:00.000Z",
    ...overrides,
  };
}

describe("linesFrom", () => {
  it("splits on newlines, trims, and drops blank lines", () => {
    expect(linesFrom("a\n b \n\n c\n")).toEqual(["a", "b", "c"]);
  });

  it("returns an empty array for blank input", () => {
    expect(linesFrom("   \n  \n")).toEqual([]);
  });
});

describe("sprintReadyState — required-field readiness", () => {
  it("a fully filled-out sprint is ready", () => {
    expect(sprintReadyState(baseSprint())).toBe(true);
  });

  it("a freshly created sprint (empty protectedSystems) is NOT ready", () => {
    // Regression guard: the original tool initialized protectedSystems to []
    // with no form field to populate it, so readiness could never become
    // true. The fix adds a form field; this test locks the underlying rule.
    expect(sprintReadyState(baseSprint({ protectedSystems: [] }))).toBe(false);
  });

  it("missing required checks blocks readiness", () => {
    expect(sprintReadyState(baseSprint({ requiredChecks: [] }))).toBe(false);
  });

  it("missing deliverable, repository, branch, start commit, or acceptance case blocks readiness", () => {
    expect(sprintReadyState(baseSprint({ deliverable: "" }))).toBe(false);
    expect(sprintReadyState(baseSprint({ repository: "" }))).toBe(false);
    expect(sprintReadyState(baseSprint({ branch: "" }))).toBe(false);
    expect(sprintReadyState(baseSprint({ startCommit: "" }))).toBe(false);
    expect(sprintReadyState(baseSprint({ acceptanceCase: "" }))).toBe(false);
  });

  it("zero available allowance blocks readiness", () => {
    expect(sprintReadyState(baseSprint({ availableAllowance: 0 }))).toBe(false);
  });
});

describe("generateTaskPacket", () => {
  it("includes every field required for a Claude task packet", () => {
    const packet = generateTaskPacket(baseSprint());
    expect(packet).toContain("Fix the thing");
    expect(packet).toContain("some-repo");
    expect(packet).toContain("main");
    expect(packet).toContain("abc1234");
    expect(packet).toContain("Feature X works in production");
    expect(packet).toContain("Auth flow");
    expect(packet).toContain("npm test");
    expect(packet).toContain("npm run build");
    expect(packet).toContain("vercel (auto on push)");
    expect(packet).toContain("Implementation: 100k tokens");
    expect(packet).toContain("Testing/Deployment: 50k tokens");
    expect(packet).toContain("Recovery: 50k tokens");
    expect(packet).toContain("Total available: 200k tokens");
  });

  it("includes the bonus task only when present", () => {
    expect(generateTaskPacket(baseSprint())).not.toContain("BONUS TASK");
    expect(generateTaskPacket(baseSprint({ bonusTask: "Polish the UI" }))).toContain("BONUS TASK\nPolish the UI");
  });
});

describe("generateReport — proof-of-work report generation", () => {
  function entry(overrides: Partial<AllowanceEntry> = {}): AllowanceEntry {
    return {
      id: "e1",
      project: "some-repo",
      deliverable: "Fix the thing",
      role: "implementation",
      actualUsed: 42,
      verified: true,
      outcomes: ["Tests pass"],
      incidents: [],
      createdAt: "2026-08-05T00:00:00.000Z",
      ...overrides,
    };
  }

  it("reports zero usage honestly when no ledger entries exist", () => {
    const report = generateReport(baseSprint(), []);
    expect(report).toContain("Actual used: 0k tokens (0 ledger entries)");
    expect(report).toContain("No ledger entries recorded for this repository yet.");
    expect(report).toContain("All entries verified.");
  });

  it("sums actual usage across ledger entries and lists outcomes", () => {
    const report = generateReport(baseSprint(), [entry({ actualUsed: 42 }), entry({ id: "e2", actualUsed: 18 })]);
    expect(report).toContain("Actual used: 60k tokens (2 ledger entries)");
    expect(report).toContain("Tests pass");
  });

  it("flags unverified entries instead of silently counting them as proven", () => {
    const report = generateReport(baseSprint(), [entry({ verified: false })]);
    expect(report).toContain("1 unverified entry — not counted as proven outcomes.");
    expect(report).toContain("UNVERIFIED");
  });

  it("lists incidents when present", () => {
    const report = generateReport(baseSprint(), [entry({ incidents: ["Build failed once, fixed"] })]);
    expect(report).toContain("Incidents: Build failed once, fixed");
  });
});
