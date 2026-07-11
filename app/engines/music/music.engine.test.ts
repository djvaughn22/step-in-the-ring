// Music Engine data integrity: official links only, verification dates present,
// paths reference real tools, every path ends in a real output.
import { describe, expect, it } from "vitest";
import { MUSIC_ENGINE } from "./music.engine";

const OFFICIAL_HOSTS = [
  "www.bandlab.com",
  "www.apple.com",
  "support.apple.com",
  "www.akaipro.com",
  "www.audacityteam.org",
];

describe("music engine resources", () => {
  it("uses only https official first-party hosts", () => {
    MUSIC_ENGINE.resources.forEach((r) => {
      const url = new URL(r.officialUrl);
      expect(url.protocol).toBe("https:");
      expect(OFFICIAL_HOSTS).toContain(url.host);
    });
  });

  it("every resource has a last-verified date and source", () => {
    MUSIC_ENGINE.resources.forEach((r) => {
      expect(r.lastVerifiedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(r.source.length).toBeGreaterThan(0);
      expect(r.platforms.length).toBeGreaterThan(0);
    });
  });

  it("never labels a trial or hardware bundle as plain free", () => {
    const mpcBeats = MUSIC_ENGINE.resources.find((r) => r.id === "mpc-beats")!;
    expect(mpcBeats.accountRequired).toBe(true);
    const mpk = MUSIC_ENGINE.resources.find((r) => r.id === "akai-mpk-mini-mk3")!;
    expect(mpk.cost).toBe("included-with-hardware");
  });
});

describe("music engine paths", () => {
  it("provides a no-hardware path and an MPK Mini path", () => {
    const ids = MUSIC_ENGINE.paths.map((p) => p.id);
    expect(ids).toContain("no-equipment");
    expect(ids).toContain("mpk-mini");
  });

  it("every path tool id resolves to a defined resource", () => {
    const resourceIds = new Set(MUSIC_ENGINE.resources.map((r) => r.id));
    MUSIC_ENGINE.paths.forEach((p) => {
      p.toolIds.forEach((id) => expect(resourceIds.has(id)).toBe(true));
    });
  });

  it("every path has setup, steps, and a concrete output", () => {
    MUSIC_ENGINE.paths.forEach((p) => {
      expect(p.setup.length).toBeGreaterThan(0);
      expect(p.steps.length).toBeGreaterThanOrEqual(5);
      expect(p.output).toMatch(/MP3|WAV/);
      expect(p.platforms.length).toBeGreaterThan(0);
    });
  });

  it("the no-equipment path requires no hardware", () => {
    const noEquip = MUSIC_ENGINE.paths.find((p) => p.id === "no-equipment")!;
    expect(noEquip.requiredHardware ?? []).toHaveLength(0);
  });
});
