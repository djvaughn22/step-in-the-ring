import { describe, expect, it } from "vitest";
import {
  assessCandidate,
  allChecked,
  generateCompletionReport,
  BACKUP_PREP_ITEMS,
  INSTALL_CHECKLIST_ITEMS,
  POST_INSTALL_VERIFY_ITEMS,
  type CandidateFacts,
  type BuildMachineRecord,
} from "../buildMachineLogic";

function baseFacts(overrides: Partial<CandidateFacts> = {}): CandidateFacts {
  return {
    manufacturerModel: "Dell Latitude 7490",
    approximateAge: "2019",
    isLaptop: true,
    cpuArch: "x86_64",
    ramGb: 8,
    storageGb: 256,
    freeStorageGb: 100,
    hasWifi: true,
    hasBluetooth: true,
    hasCameraMic: true,
    usbPorts: 2,
    batteryCondition: "good",
    currentlyBoots: true,
    hasImportantFiles: false,
    ...overrides,
  };
}

describe("assessCandidate", () => {
  it("a strong, well-equipped machine is a good candidate with no blockers or verify items", () => {
    const result = assessCandidate(baseFacts());
    expect(result.status).toBe("good");
    expect(result.blockers).toEqual([]);
    expect(result.verifyItems).toEqual([]);
  });

  it("a machine that doesn't boot is not recommended, regardless of other specs", () => {
    const result = assessCandidate(baseFacts({ currentlyBoots: false }));
    expect(result.status).toBe("not-recommended");
    expect(result.blockers.some((b) => b.includes("doesn't currently boot"))).toBe(true);
  });

  it("ARM architecture is a hard blocker — not a supported path", () => {
    const result = assessCandidate(baseFacts({ cpuArch: "arm" }));
    expect(result.status).toBe("not-recommended");
    expect(result.blockers.some((b) => b.includes("64-bit x86"))).toBe(true);
  });

  it("insufficient free storage blocks candidacy", () => {
    const result = assessCandidate(baseFacts({ freeStorageGb: 10 }));
    expect(result.status).toBe("not-recommended");
  });

  it("no usable USB port blocks candidacy (no way to boot installer media)", () => {
    const result = assessCandidate(baseFacts({ usbPorts: 0 }));
    expect(result.status).toBe("not-recommended");
  });

  it("one soft concern (e.g. tight RAM) yields a likely candidate", () => {
    const result = assessCandidate(baseFacts({ ramGb: 3 }));
    expect(result.status).toBe("likely");
    expect(result.verifyItems.length).toBe(1);
  });

  it("multiple soft concerns push it to needs-upgrade", () => {
    const result = assessCandidate(baseFacts({ ramGb: 3, freeStorageGb: 25 }));
    expect(result.status).toBe("needs-upgrade");
    expect(result.verifyItems.length).toBeGreaterThanOrEqual(2);
  });

  it("unconfirmed Wi-Fi never claims hardware works — it always asks the tester to verify", () => {
    const result = assessCandidate(baseFacts({ hasWifi: false }));
    expect(result.verifyItems.some((v) => v.toLowerCase().includes("wi-fi"))).toBe(true);
  });

  it("important files present adds a note requiring the backup checklist, without changing status by itself", () => {
    const result = assessCandidate(baseFacts({ hasImportantFiles: true }));
    expect(result.notes.some((n) => n.includes("backup checklist"))).toBe(true);
    expect(result.status).toBe("good");
  });

  it("poor/unknown laptop battery is a verify item, not a blocker", () => {
    const result = assessCandidate(baseFacts({ batteryCondition: "poor" }));
    expect(result.status).not.toBe("not-recommended");
    expect(result.verifyItems.some((v) => v.toLowerCase().includes("battery"))).toBe(true);
  });
});

describe("allChecked", () => {
  it("is false until every item is checked, true once all are", () => {
    const items = ["a", "b", "c"];
    expect(allChecked(items, {})).toBe(false);
    expect(allChecked(items, { 0: true, 1: true })).toBe(false);
    expect(allChecked(items, { 0: true, 1: true, 2: true })).toBe(true);
  });
});

describe("generateCompletionReport", () => {
  function baseRecord(overrides: Partial<BuildMachineRecord> = {}): BuildMachineRecord {
    return {
      id: "1",
      facts: baseFacts(),
      assessment: assessCandidate(baseFacts()),
      prepState: {},
      installState: {},
      verifyState: {},
      firstBuildDone: false,
      createdAt: "2026-08-07T00:00:00.000Z",
      updatedAt: "2026-08-07T00:00:00.000Z",
      ...overrides,
    };
  }

  it("honestly reports incomplete sections as not complete", () => {
    const report = generateCompletionReport(baseRecord());
    expect(report).toContain("Not complete — required before wipe/install.");
    expect(report).toContain("Not yet done.");
  });

  it("reports each section complete only when every one of its items is checked", () => {
    const allTrue = (items: string[]) => Object.fromEntries(items.map((_, i) => [i, true]));
    const report = generateCompletionReport(
      baseRecord({
        prepState: allTrue(BACKUP_PREP_ITEMS),
        installState: allTrue(INSTALL_CHECKLIST_ITEMS),
        verifyState: allTrue(POST_INSTALL_VERIFY_ITEMS),
        firstBuildDone: true,
      }),
    );
    expect(report).toContain("Complete — all required items confirmed.");
    expect(report).toContain("Complete — all checks passed.");
    expect(report).toContain("Complete — a first idea was shaped in Step In The Ring.");
  });

  it("includes the machine name and assessment status", () => {
    const report = generateCompletionReport(baseRecord());
    expect(report).toContain("Dell Latitude 7490");
    expect(report).toContain("Good candidate");
  });
});
