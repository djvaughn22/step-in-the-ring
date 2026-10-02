import { describe, expect, it } from "vitest";
import { statusLabel } from "./statusLabel";

describe("statusLabel", () => {
  it("turns every stored status into plain words, never a raw code or a price", () => {
    for (const s of ["free", "pending", "active", "tester", "owner", "past_due", "canceled_active", "expired", "revoked"]) {
      const label = statusLabel(s);
      expect(label).not.toContain("_");
      expect(label).not.toMatch(/\$|pay|paid|billing|subscri/i);
    }
    expect(statusLabel(null)).toBe("Not signed in");
    expect(statusLabel("something-new")).toBe("Signed in");
  });
});
