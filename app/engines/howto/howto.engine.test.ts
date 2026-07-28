// How to Anything Engine — the rules that must not regress:
// a guess never becomes a claimed fact, the package is built from the owner's
// own words, and every social version points at the primary video.

import { describe, expect, it } from "vitest";
import {
  buildPackage, buildTags, buildTitles, captureGate, emptyRecord,
  packageMarkdown, parseRecord, proofGate, socialPack,
  VIDEO_LINK_PLACEHOLDER, XUMO_SEED,
  type SolutionRecord,
} from "./howto.engine";

function xumoRecord(): SolutionRecord {
  return { ...emptyRecord(), ...XUMO_SEED, proofConfirmed: true } as SolutionRecord;
}

describe("gates", () => {
  it("captureGate lists everything missing on an empty record", () => {
    const gate = captureGate(emptyRecord());
    expect(gate.ready).toBe(false);
    expect(gate.missing.length).toBeGreaterThanOrEqual(5);
  });

  it("proofGate blocks an uncertain solution even when everything else is filled in", () => {
    const r = xumoRecord();
    r.proofLevel = "uncertain";
    const gate = proofGate(r);
    expect(gate.ready).toBe(false);
    expect(gate.missing.join(" ")).toMatch(/uncertain/i);
    expect(buildPackage(r)).toBeNull();
  });

  it("proofGate blocks without the owner's confirmation", () => {
    const r = xumoRecord();
    r.proofConfirmed = false;
    expect(proofGate(r).ready).toBe(false);
    expect(buildPackage(r)).toBeNull();
  });

  it("proofGate passes a complete firsthand record", () => {
    expect(proofGate(xumoRecord()).ready).toBe(true);
  });
});

describe("the Xumo package", () => {
  const r = xumoRecord();
  const pkg = buildPackage(r)!;

  it("generates once the proof gate passes", () => {
    expect(pkg).not.toBeNull();
  });

  it("titles are searchable and name the device", () => {
    expect(pkg.titles.length).toBeGreaterThanOrEqual(2);
    for (const t of pkg.titles.slice(0, 2)) expect(t).toContain("Spectrum Xumo Stream Box");
  });

  it("every fix step appears verbatim in the script", () => {
    const stepsSection = pkg.script.find((s) => s.heading === "The fix, step by step")!;
    for (const step of r.steps) expect(stepsSection.voiceover).toContain(step);
  });

  it("the green Home button step survives word for word", () => {
    const all = JSON.stringify(pkg);
    expect(all).toContain("Press and hold the green Home button for about five seconds");
  });

  it("one shot per step, plus problem and result shots", () => {
    const stepShots = pkg.shotList.filter((s) => s.id.startsWith("shot-step-"));
    expect(stepShots.length).toBe(r.steps.length);
    expect(pkg.shotList.some((s) => s.id === "shot-problem")).toBe(true);
    expect(pkg.shotList.some((s) => s.id === "shot-result")).toBe(true);
  });

  it("description carries the disclosure line and the limits", () => {
    expect(pkg.description).toContain("my own experience with my own device");
    expect(pkg.description).toContain("Not sponsored.");
    expect(pkg.description).toContain(r.limits);
  });

  it("description includes numbered steps and chapters", () => {
    expect(pkg.description).toContain("1. " + r.steps[0]);
    expect(pkg.description).toContain("Chapters:");
    expect(pkg.description).toContain("0:00 The problem");
  });

  it("tags are non-empty, deduped, capped at 15", () => {
    expect(pkg.tags.length).toBeGreaterThan(3);
    expect(pkg.tags.length).toBeLessThanOrEqual(15);
    expect(new Set(pkg.tags).size).toBe(pkg.tags.length);
  });

  it("never promises what the record doesn't — no hype words appear", () => {
    const all = JSON.stringify(pkg).toLowerCase();
    for (const banned of ["guaranteed", "always works", "every time", "100%"]) {
      expect(all).not.toContain(banned);
    }
  });

  it("article is real markdown with the steps and the honesty line", () => {
    expect(pkg.article.startsWith("# ")).toBe(true);
    expect(pkg.article).toContain("1. " + r.steps[0]);
    expect(pkg.article).toContain("my own experience");
  });
});

describe("optional sections stay optional", () => {
  it("no wrongPaths → no 'What didn't work' section or shot", () => {
    const r = xumoRecord();
    r.wrongPaths = "";
    r.story = "";
    const pkg = buildPackage(r)!;
    expect(pkg.script.some((s) => s.heading === "What didn't work")).toBe(false);
    expect(pkg.shotList.some((s) => s.id === "shot-wrong")).toBe(false);
    expect(pkg.titles.some((t) => t.includes("Don't replace"))).toBe(false);
  });

  it("no limits → no 'When this won't help' section", () => {
    const r = xumoRecord();
    r.limits = "";
    const pkg = buildPackage(r)!;
    expect(pkg.script.some((s) => s.heading === "When this won't help")).toBe(false);
    expect(pkg.description).not.toContain("When this won't help");
  });
});

describe("social pack", () => {
  it("before publish: placeholder link, never 'undefined'", () => {
    const r = xumoRecord();
    const pkg = buildPackage(r)!;
    const posts = socialPack(r, pkg);
    expect(posts.length).toBe(6);
    const linked = posts.filter((p) => p.text.includes(VIDEO_LINK_PLACEHOLDER));
    expect(linked.length).toBeGreaterThanOrEqual(3);
    for (const p of posts) expect(p.text).not.toContain("undefined");
  });

  it("after publish: the real URL replaces the placeholder everywhere", () => {
    const r = xumoRecord();
    r.videoUrl = "https://youtu.be/abc123";
    const pkg = buildPackage(r)!;
    for (const p of socialPack(r, pkg)) {
      expect(p.text).not.toContain(VIDEO_LINK_PLACEHOLDER);
    }
    expect(socialPack(r, pkg).some((p) => p.text.includes("https://youtu.be/abc123"))).toBe(true);
  });

  it("X post stays inside 280 characters for the Xumo solution", () => {
    const r = xumoRecord();
    r.videoUrl = "https://youtu.be/abc123";
    const pkg = buildPackage(r)!;
    const x = socialPack(r, pkg).find((p) => p.platform === "X")!;
    expect(x.text.length).toBeLessThanOrEqual(280);
  });
});

describe("full markdown export", () => {
  it("carries every major section", () => {
    const r = xumoRecord();
    const md = packageMarkdown(r, buildPackage(r)!);
    for (const heading of [
      "## Title options", "## Voiceover script", "## Shot list", "## YouTube description",
      "## Tags", "## Pinned comment", "## Thumbnail", "## Social versions", "## Article",
    ]) {
      expect(md).toContain(heading);
    }
  });
});

describe("record parsing", () => {
  it("garbage in → safe empty record out", () => {
    expect(parseRecord(null).steps).toEqual([]);
    expect(parseRecord("nope").proofConfirmed).toBe(false);
    expect(parseRecord({ steps: "not-an-array", proofConfirmed: "yes" }).steps).toEqual([]);
    expect(parseRecord({ proofConfirmed: "yes" }).proofConfirmed).toBe(false);
  });

  it("a saved record round-trips", () => {
    const r = xumoRecord();
    const parsed = parseRecord(JSON.parse(JSON.stringify(r)));
    expect(parsed).toEqual(r);
  });
});

describe("titles and tags helpers", () => {
  it("symptom chunk is trimmed into the title, lowercased", () => {
    const titles = buildTitles(xumoRecord());
    expect(titles[0]).toContain("flashes white");
  });

  it("tags include the device and fix phrases", () => {
    const tags = buildTags(xumoRecord());
    expect(tags).toContain("spectrum xumo stream box");
    expect(tags).toContain("how to fix spectrum xumo stream box");
  });
});
