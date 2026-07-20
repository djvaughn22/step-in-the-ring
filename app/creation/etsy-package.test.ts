// The `ecp` decoder guards the door: a malformed or unsupported package must
// parse to null quietly, and a good one must arrive intact — the artwork
// address especially, because the artwork is the point.
import { describe, expect, it } from "vitest";
import { parseEtsyCreativePackage, readEtsyPackageFromSearch, safeFilename } from "./etsy-package";

const good = {
  version: 1,
  source: "idontcry-dream-shop",
  creationId: "dream-abc",
  createdAt: "2026-07-19T12:00:00.000Z",
  idea: {
    name: "Dog Dad Delivery Inspector",
    subject: "A proud dog inspecting a package at the front door",
    audience: "Dog lovers",
    designText: "Inspected. Approved. Licked.",
  },
  product: { type: "Sticker", digitalOrPhysical: "physical" },
  artwork: {
    primaryAssetUrl: "https://example.public.blob.vercel-storage.com/dream-shop/x.png",
    mimeType: "image/png",
    filename: "dog-dad-delivery-inspector.png",
    width: 1024,
    height: 1024,
  },
  approval: { approved: true, approvedAt: "2026-07-19T12:30:00.000Z" },
};

describe("parseEtsyCreativePackage", () => {
  it("accepts a complete v1 package intact", () => {
    const pkg = parseEtsyCreativePackage(good)!;
    expect(pkg.idea.name).toBe(good.idea.name);
    expect(pkg.artwork.primaryAssetUrl).toBe(good.artwork.primaryAssetUrl);
    expect(pkg.artwork.width).toBe(1024);
    expect(pkg.product.digitalOrPhysical).toBe("physical");
    expect(pkg.approval.approved).toBe(true);
  });

  it("rejects unsupported versions safely", () => {
    expect(parseEtsyCreativePackage({ ...good, version: 2 })).toBeNull();
    expect(parseEtsyCreativePackage({ ...good, version: "1" })).toBeNull();
  });

  it("rejects packages without approval, artwork, or idea", () => {
    expect(parseEtsyCreativePackage({ ...good, approval: { approved: false } })).toBeNull();
    expect(parseEtsyCreativePackage({ ...good, artwork: {} })).toBeNull();
    expect(parseEtsyCreativePackage({ ...good, idea: { name: "x" } })).toBeNull();
    expect(parseEtsyCreativePackage(null)).toBeNull();
    expect(parseEtsyCreativePackage("nope")).toBeNull();
  });

  it("rejects non-https artwork addresses and scheme tricks", () => {
    for (const bad of ["http://x.com/a.png", "javascript:alert(1)", "data:image/png;base64,AA", "blob:https://x/y"]) {
      expect(parseEtsyCreativePackage({ ...good, artwork: { ...good.artwork, primaryAssetUrl: bad } })).toBeNull();
    }
  });

  it("re-sanitizes hostile filenames instead of trusting the sender", () => {
    const pkg = parseEtsyCreativePackage({ ...good, artwork: { ...good.artwork, filename: "../../evil.sh" } })!;
    expect(pkg.artwork.filename).toBe("evil.png");
  });

  it("unknown digitalOrPhysical becomes undecided, not a crash", () => {
    const pkg = parseEtsyCreativePackage({ ...good, product: { type: "Sticker", digitalOrPhysical: "quantum" } })!;
    expect(pkg.product.digitalOrPhysical).toBe("undecided");
  });
});

describe("readEtsyPackageFromSearch", () => {
  it("round-trips through a query string", () => {
    const search = `?engine=design-shop&ecp=${encodeURIComponent(JSON.stringify(good))}`;
    const pkg = readEtsyPackageFromSearch(search)!;
    expect(pkg.creationId).toBe("dream-abc");
  });

  it("malformed or missing → null, quietly", () => {
    expect(readEtsyPackageFromSearch("?ecp=%7Bnot-json")).toBeNull();
    expect(readEtsyPackageFromSearch("?engine=design-shop")).toBeNull();
    expect(readEtsyPackageFromSearch(`?ecp=${"x".repeat(2000)}`)).toBeNull();
  });
});

describe("safeFilename", () => {
  it("normalizes to a safe ascii name with the right extension", () => {
    expect(safeFilename("My Design!.png", "png")).toBe("my-design.png");
    expect(safeFilename("💫", "jpg")).toBe("design.jpg");
    expect(safeFilename(undefined, "png")).toBe("design.png");
  });
});
