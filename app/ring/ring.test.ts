// Creative Ring: the original Heisman mechanics, a ring as data, and privacy
// that holds: no network calls, recording off until switched on, nothing posted.
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { HEISMAN } from "./engine/heisman";
import { triesKey } from "./engine/core";
import { RINGS, ringById } from "./rings";

const src = (rel: string) => readFileSync(path.join(__dirname, rel), "utf8");

describe("Creative Ring", () => {
  it("starts with the Heisman, using the original challenge data", () => {
    expect(RINGS[0].challenge).toBe(HEISMAN);
    expect(ringById("heisman")?.title).toBe("The Heisman");
    expect(HEISMAN.slip.button).toBe("Touched down");
    expect(HEISMAN.holdChoices).toEqual([10, 20, 30]);
  });

  it("keeps its tries apart from iDontCry's", () => {
    expect(triesKey("heisman")).toBe("sitr-ring-heisman-v1");
  });

  it("never talks to a server, and records only when switched on", () => {
    const page = src("RingChallenge.tsx");
    expect(page).not.toMatch(/fetch\(\s*["'`]\/|XMLHttpRequest|sendBeacon|track\(/);
    expect(page).toMatch(/const \[record, setRecord\] = useState\(false\)/);
    expect(page).toContain("Nothing is uploaded.");
    expect(page).toContain("nothing is posted for you");
  });

  it("shares a picture with no name and no photo", () => {
    const page = src("RingChallenge.tsx");
    expect(page).toContain("with no name and no photo");
    expect(page).not.toMatch(/drawImage\(/);
  });

  it("says what isn't built: other rings are ideas only", () => {
    expect(src("page.tsx")).toContain("Ideas only, nothing built yet");
  });
});
