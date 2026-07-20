// The `ecp` query parameter — iDontCry Dream Shop's approved creative
// package, artwork included (by https address, never by payload).
//
// Mirrored by iDontCry's src/lib/etsyCreativePackage.ts (the encoder). The
// two files share the shape by contract, not by import — separate repos.
// If the shape changes, bump `version` and keep this decoder able to read
// every version ever emitted. An unsupported version parses to null and the
// visitor lands on the normal Design Shop, never on a crash.

export const ETSY_PACKAGE_PARAM = "ecp";
export const ETSY_PACKAGE_MAX_ENCODED = 1800;

export type DigitalOrPhysical = "digital" | "physical" | "undecided";

export interface EtsyCreativePackageV1 {
  version: 1;
  source: "idontcry-dream-shop";
  creationId: string;
  createdAt: string;
  idea: {
    name: string;
    subject: string;
    audience?: string;
    occasion?: string;
    visualDirection?: string;
    designText?: string;
  };
  product: {
    type: string;
    digitalOrPhysical: DigitalOrPhysical;
  };
  artwork: {
    primaryAssetUrl?: string;
    localAssetKey?: string;
    mimeType: "image/png" | "image/jpeg";
    filename: string;
    width: number;
    height: number;
    hasTransparency?: boolean;
  };
  approval: {
    approved: true;
    approvedAt: string;
  };
}

const isStr = (v: unknown): v is string => typeof v === "string";

function text(v: unknown, max: number): string | undefined {
  if (!isStr(v)) return undefined;
  const t = v.replace(/\s+/g, " ").trim();
  return t ? t.slice(0, max) : undefined;
}

/** Only https addresses are trusted to load — never data:, blob:, or scripts. */
function httpsUrl(v: unknown): string | undefined {
  if (!isStr(v) || v.length > 500) return undefined;
  try {
    return new URL(v).protocol === "https:" ? v : undefined;
  } catch {
    return undefined;
  }
}

/** A filename safe for downloads and ZIP entries. */
export function safeFilename(name: unknown, ext: "png" | "jpg", fallback = "design"): string {
  const base = (isStr(name) ? name : "")
    .replace(/\.[a-z0-9]+$/i, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return `${base || fallback}.${ext}`;
}

/** Strict parse. Malformed or unsupported version → null, never a crash. */
export function parseEtsyCreativePackage(v: unknown): EtsyCreativePackageV1 | null {
  if (!v || typeof v !== "object") return null;
  const p = v as Record<string, unknown>;
  if (p.version !== 1) return null; // Unsupported versions are rejected safely.
  if (p.source !== "idontcry-dream-shop") return null;
  if (!isStr(p.creationId) || !p.creationId.trim()) return null;

  const idea = (p.idea ?? {}) as Record<string, unknown>;
  const product = (p.product ?? {}) as Record<string, unknown>;
  const artwork = (p.artwork ?? {}) as Record<string, unknown>;
  const approval = (p.approval ?? {}) as Record<string, unknown>;

  const name = text(idea.name, 80);
  const subject = text(idea.subject, 300);
  if (!name || !subject) return null;

  const mime = artwork.mimeType === "image/jpeg" ? "image/jpeg" : artwork.mimeType === "image/png" ? "image/png" : null;
  const url = httpsUrl(artwork.primaryAssetUrl);
  const width = Math.round(Number(artwork.width));
  const height = Math.round(Number(artwork.height));
  // The artwork is the point of this package — without a real reachable
  // asset the handoff is invalid and the sender's copy path is the fallback.
  if (!mime || !url) return null;
  if (!Number.isFinite(width) || !Number.isFinite(height) || width < 1 || height < 1) return null;
  if (approval.approved !== true) return null;

  const dop = product.digitalOrPhysical === "digital" || product.digitalOrPhysical === "physical"
    ? product.digitalOrPhysical
    : "undecided";

  return {
    version: 1,
    source: "idontcry-dream-shop",
    creationId: p.creationId.trim().slice(0, 40),
    createdAt: isStr(p.createdAt) ? p.createdAt : new Date().toISOString(),
    idea: {
      name,
      subject,
      audience: text(idea.audience, 120),
      occasion: text(idea.occasion, 120),
      visualDirection: text(idea.visualDirection, 300),
      designText: text(idea.designText, 200),
    },
    product: {
      type: text(product.type, 60) ?? "Undecided",
      digitalOrPhysical: dop,
    },
    artwork: {
      primaryAssetUrl: url,
      mimeType: mime,
      filename: safeFilename(artwork.filename, mime === "image/png" ? "png" : "jpg"),
      width,
      height,
      hasTransparency: artwork.hasTransparency === true ? true : undefined,
    },
    approval: {
      approved: true,
      approvedAt: isStr(approval.approvedAt) ? approval.approvedAt : new Date().toISOString(),
    },
  };
}

/** Read and validate a package from a query string. Malformed → null, quietly. */
export function readEtsyPackageFromSearch(search: string): EtsyCreativePackageV1 | null {
  try {
    const raw = new URLSearchParams(search).get(ETSY_PACKAGE_PARAM);
    if (!raw || raw.length > ETSY_PACKAGE_MAX_ENCODED) return null;
    return parseEtsyCreativePackage(JSON.parse(raw));
  } catch {
    return null;
  }
}
