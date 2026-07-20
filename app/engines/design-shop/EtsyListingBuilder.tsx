"use client";

/**
 * Etsy Listing Builder — the second half of the Dream Shop → Etsy workflow.
 *
 * Arrives with an approved creative package (real artwork included by https
 * address) and walks four stages: Details → Listing → Approve → Ready.
 * Etsy opens only at the very end, in a new tab, with everything already
 * prepared, downloadable, and saved on this device.
 */

import { useEffect, useRef, useState } from "react";
import { parseEtsyCreativePackage, type EtsyCreativePackageV1 } from "../../creation/etsy-package";
import { buildZip, type ZipEntry } from "../../lib/zip";
import {
  buildListingJson, buildListingTxt, buildReadmeTxt, prefillListing, validateListing,
  ETSY_NEW_LISTING_URL, TAG_MAX_COUNT, TAG_MAX_LEN, TITLE_MAX,
  type EtsyListingState, type WhenMade, type WhoMade,
} from "./etsy-listing";
import type { CreationProject } from "../shared/creation-engine.types";
import { createProject, getProjectsByEngine, updateProject, uid } from "../shared/persistence";
import { track } from "../../lib/analytics";

type BuilderStage = "details" | "listing" | "approve" | "ready";

/** Chip-row picker — big thumb-friendly choices instead of a form field. */
function Chips<T extends string>({ value, options, onPick, name }: {
  value: T; options: [T, string][]; onPick: (v: T) => void; name: string;
}) {
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }} role="group" aria-label={name}>
      {options.map(([v, text]) => (
        <button key={v} aria-pressed={value === v} onClick={() => onPick(v)} className={value === v ? "btn btn-gold btn-small" : "btn btn-ghost btn-small"}>
          {text}
        </button>
      ))}
    </div>
  );
}

function CopyBtn({ text, name, onCopy }: { text: string; name: string; onCopy: (text: string, label: string) => void }) {
  return (
    <button onClick={() => onCopy(text, name)} className="btn btn-ghost btn-small">Copy {name.toLowerCase()}</button>
  );
}

interface EtsyBuildContent {
  pkg: EtsyCreativePackageV1;
  listing: EtsyListingState;
  stage: BuilderStage;
}

/** Read the builder content out of a saved project, re-validating the package. */
export function etsyContentOf(p: CreationProject): EtsyBuildContent | null {
  const raw = (p.buildContent as { etsy?: { pkg?: unknown; listing?: unknown; stage?: unknown } } | undefined)?.etsy;
  if (!raw) return null;
  const pkg = parseEtsyCreativePackage(raw.pkg);
  if (!pkg || !raw.listing || typeof raw.listing !== "object") return null;
  const stages: BuilderStage[] = ["details", "listing", "approve", "ready"];
  return {
    pkg,
    listing: raw.listing as EtsyListingState,
    stage: stages.includes(raw.stage as BuilderStage) ? (raw.stage as BuilderStage) : "details",
  };
}

export function findEtsyProject(creationId: string): CreationProject | null {
  return (
    getProjectsByEngine("design-shop").find(
      (p) => (p.buildContent as { etsy?: { pkg?: { creationId?: string } } } | undefined)?.etsy?.pkg?.creationId === creationId,
    ) ?? null
  );
}

async function fetchBytes(url: string): Promise<Uint8Array> {
  const res = await fetch(url);
  if (!res.ok) throw new Error("fetch failed");
  return new Uint8Array(await res.arrayBuffer());
}

/**
 * A listing-ready JPG of the same artwork: flattened onto white and saved
 * under Etsy's reliable-upload size. Genuinely useful — Etsy renders PNG
 * transparency as black and uploads over ~1MB can fail — and honestly
 * labeled: same design, different file, never a fake product mockup.
 */
async function makeListingJpeg(url: string): Promise<Uint8Array | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const bitmap = await createImageBitmap(await res.blob());
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0);
    const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
    return blob ? new Uint8Array(await blob.arrayBuffer()) : null;
  } catch {
    return null;
  }
}

function saveBytes(bytes: Uint8Array, filename: string, mime: string) {
  const blob = new Blob([bytes as BlobPart], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function EtsyListingBuilder({
  pkg: incomingPkg, project: incomingProject, onBack,
}: {
  /** A fresh package from the URL handoff… */
  pkg?: EtsyCreativePackageV1;
  /** …or a saved project being reopened. One of the two must be present. */
  project?: CreationProject;
  onBack: () => void;
}) {
  const [project, setProject] = useState<CreationProject | null>(null);
  const [pkg, setPkg] = useState<EtsyCreativePackageV1 | null>(null);
  const [listing, setListing] = useState<EtsyListingState | null>(null);
  const [stage, setStage] = useState<BuilderStage>("details");
  const [flash, setFlash] = useState("");
  const [busy, setBusy] = useState("");
  const [openEtsyWarn, setOpenEtsyWarn] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [broken, setBroken] = useState(false);

  // Load or create the saved project exactly once (client-only storage).
  useEffect(() => {
    if (incomingProject) {
      const content = etsyContentOf(incomingProject);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- restoring persisted state after mount, same pattern as the studios
      if (!content) { setBroken(true); return; }
      setProject(incomingProject);
      setPkg(content.pkg);
      setListing(content.listing);
      setStage(content.stage);
      return;
    }
    if (incomingPkg) {
      const existing = findEtsyProject(incomingPkg.creationId);
      if (existing) {
        const content = etsyContentOf(existing);
        if (content) {
          setProject(existing);
          setPkg(content.pkg);
          setListing(content.listing);
          setStage(content.stage);
          return;
        }
      }
      const fresh = createProject("design-shop", incomingPkg.idea.name, {
        idea: incomingPkg.idea.subject,
        productType: incomingPkg.product.type,
        ...(incomingPkg.idea.audience ? { customer: incomingPkg.idea.audience } : {}),
      });
      const content: EtsyBuildContent = { pkg: incomingPkg, listing: prefillListing(incomingPkg), stage: "details" };
      fresh.status = "creating";
      fresh.buildContent = { etsy: content };
      updateProject(fresh);
      track("etsy_builder_start", {});
      setProject(fresh);
      setPkg(content.pkg);
      setListing(content.listing);
      setStage("details");
      return;
    }
    setBroken(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const say = (m: string) => {
    setFlash(m);
    setTimeout(() => setFlash(""), 2600);
  };

  // Ref mirror of the listing — two taps in the same tick (or a fast double
  // tap) must not build from a stale closure and drop the first change.
  const listingRef = useRef<EtsyListingState | null>(null);
  listingRef.current = listing ?? listingRef.current;

  const persist = (nextListing: EtsyListingState, nextStage: BuilderStage = stage) => {
    listingRef.current = nextListing;
    setListing(nextListing);
    setStage(nextStage);
    if (!project || !pkg) return;
    const next: CreationProject = {
      ...project,
      status: nextStage === "ready" ? "ready-to-publish" : nextStage === "approve" ? "ready-for-review" : "creating",
      buildContent: { ...(project.buildContent ?? {}), etsy: { pkg, listing: nextListing, stage: nextStage } },
    };
    updateProject(next);
    setProject(next);
  };

  const patch = (p: Partial<EtsyListingState>, nextStage?: BuilderStage) => {
    const base = listingRef.current;
    if (!base) return;
    persist({ ...base, ...p }, nextStage ?? stage);
  };

  const recordExport = (name: string) => {
    if (!project) return;
    const next: CreationProject = {
      ...project,
      exports: [...project.exports, { id: uid(), type: "zip" as const, name, url: name, generatedAt: new Date().toISOString(), exportedVia: "design-shop" }],
    };
    updateProject(next);
    setProject(next);
  };

  const copyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      say(`${label} copied.`);
    } catch {
      say("Couldn't reach your clipboard — select the text and copy it by hand.");
    }
  };

  const copyImage = async () => {
    if (!pkg || busy) return;
    setBusy("copyimg");
    try {
      if (typeof ClipboardItem === "undefined" || !navigator.clipboard?.write) throw new Error("unsupported");
      const res = await fetch(pkg.artwork.primaryAssetUrl!);
      if (!res.ok) throw new Error("fetch");
      const bitmap = await createImageBitmap(await res.blob());
      const canvas = document.createElement("canvas");
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      canvas.getContext("2d")!.drawImage(bitmap, 0, 0);
      const png: Blob = await new Promise((resolve, reject) =>
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("encode"))), "image/png"),
      );
      await navigator.clipboard.write([new ClipboardItem({ "image/png": png })]);
      say("Image copied.");
    } catch {
      say("Image copying is not supported in this browser. Download the image and upload it to Etsy.");
    } finally {
      setBusy("");
    }
  };

  const downloadPrimary = async () => {
    if (!pkg || busy) return;
    setBusy("primary");
    try {
      const bytes = await fetchBytes(pkg.artwork.primaryAssetUrl!);
      saveBytes(bytes, pkg.artwork.filename, pkg.artwork.mimeType);
      say("Image downloaded.");
    } catch {
      say("The download didn't start — check your connection and try again.");
    } finally {
      setBusy("");
    }
  };

  const downloadAllImages = async () => {
    if (!pkg || busy) return;
    setBusy("allimg");
    try {
      const bytes = await fetchBytes(pkg.artwork.primaryAssetUrl!);
      saveBytes(bytes, pkg.artwork.filename, pkg.artwork.mimeType);
      if (pkg.artwork.mimeType === "image/png") {
        const jpeg = await makeListingJpeg(pkg.artwork.primaryAssetUrl!);
        if (jpeg) saveBytes(jpeg, pkg.artwork.filename.replace(/\.png$/, "-listing.jpg"), "image/jpeg");
      }
      say("Images downloaded.");
    } catch {
      say("The download didn't start — check your connection and try again.");
    } finally {
      setBusy("");
    }
  };

  const downloadPack = async () => {
    if (!pkg || !listing || busy) return;
    setBusy("pack");
    try {
      const encoder = new TextEncoder();
      const entries: ZipEntry[] = [];
      const primary = await fetchBytes(pkg.artwork.primaryAssetUrl!);
      const ext = pkg.artwork.mimeType === "image/png" ? "png" : "jpg";
      entries.push({ name: `images/01-primary.${ext}`, data: primary });
      if (pkg.artwork.mimeType === "image/png") {
        const jpeg = await makeListingJpeg(pkg.artwork.primaryAssetUrl!);
        if (jpeg) entries.push({ name: "images/02-listing.jpg", data: jpeg });
      }
      entries.push({ name: "listing.txt", data: encoder.encode(buildListingTxt(listing, pkg)) });
      entries.push({ name: "listing.json", data: encoder.encode(buildListingJson(listing, pkg)) });
      entries.push({ name: "README.txt", data: encoder.encode(buildReadmeTxt()) });
      const zip = buildZip(entries);
      const base = pkg.artwork.filename.replace(/\.(png|jpg)$/, "");
      saveBytes(zip, `${base}-etsy-pack.zip`, "application/zip");
      patch({ packDownloadedAt: new Date().toISOString() });
      recordExport(`${base}-etsy-pack.zip`);
      track("etsy_pack_download", {});
      say("Etsy Pack downloaded.");
    } catch {
      say("The pack couldn't be built — check your connection and try again.");
    } finally {
      setBusy("");
    }
  };

  const openEtsy = () => {
    window.open(ETSY_NEW_LISTING_URL, "_blank", "noopener");
    track("etsy_open", {});
    say("Etsy opened in a new tab. Everything here stays saved.");
    setOpenEtsyWarn(false);
  };

  // ---- styles ----
  const card = { background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 16, padding: 18, marginBottom: 14 } as const;
  const input = {
    width: "100%", boxSizing: "border-box" as const, background: "var(--surface)",
    border: "1px solid var(--line2)", borderRadius: 10, color: "var(--text)",
    padding: "11px 12px", fontSize: 15, fontFamily: "inherit",
  };
  const label = { display: "block", fontSize: 13.5, fontWeight: 800, color: "var(--text)", marginBottom: 6 } as const;
  const kicker = { fontSize: 12, fontWeight: 900, color: "var(--gold)", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 8 };

  if (broken) {
    return (
      <main><div className="page">
        <div style={card}>
          <p style={{ fontSize: 15, fontWeight: 800, color: "var(--text)", margin: "0 0 8px" }}>This listing couldn&apos;t be opened.</p>
          <p style={{ fontSize: 13.5, color: "var(--muted)", margin: "0 0 14px", lineHeight: 1.6 }}>
            The saved package is missing or from a version this page doesn&apos;t read. Start again from your Dream Shop project — your design is still saved there.
          </p>
          <button onClick={onBack} className="btn btn-gold btn-small">← Design Shop</button>
        </div>
      </div></main>
    );
  }

  if (!pkg || !listing) return <div className="page"><div style={{ height: 200 }} /></div>;

  const { errors, warnings } = validateListing(listing);
  const stageTitle: Record<BuilderStage, string> = {
    details: "Product details",
    listing: "Review your listing",
    approve: "Approve the Etsy package",
    ready: "Ready for Etsy",
  };

  return (
    <main>
      <div className="page">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, gap: 8, flexWrap: "wrap" }}>
          <button onClick={onBack} className="btn btn-ghost btn-small">← Design Shop</button>
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" }}>
            Etsy listing • {stageTitle[stage]}
          </span>
        </div>
        <p role="status" aria-live="polite" style={{ color: "var(--gold)", fontWeight: 800, minHeight: 20, margin: "0 0 10px", fontSize: 13.5 }}>{flash}</p>
        <p style={{ fontSize: 12, color: "var(--muted)", margin: "0 0 12px" }}>Saved on this device • {pkg.idea.name}</p>

        {/* ---- DETAILS ---- */}
        {stage === "details" && (
          <>
            <div style={card}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={pkg.artwork.primaryAssetUrl} alt={`Approved design: ${pkg.idea.subject}`} style={{ width: "100%", maxWidth: 320, borderRadius: 12, border: "1px solid var(--line2)", display: "block", margin: "0 auto 10px" }} />
              <p style={{ fontSize: 12.5, color: "var(--muted)", textAlign: "center", margin: 0 }}>
                Your approved design arrived with the idea — nothing to retype.
              </p>
            </div>

            <div style={card}>
              <p style={kicker}>Only what Etsy actually asks</p>

              <div style={{ marginBottom: 16 }}>
                <span style={label}>Sold as</span>
                <Chips
                  name="Sold as"
                  value={listing.digitalOrPhysical}
                  options={[["digital", "Digital download"], ["physical", "Physical product"], ["undecided", "Not decided"]]}
                  onPick={(v) => patch({ digitalOrPhysical: v })}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <span style={label}>Who made it?</span>
                <Chips<WhoMade>
                  name="Who made it"
                  value={listing.whoMade}
                  options={[["I did", "I did"], ["A member of my shop", "A member of my shop"], ["Another company or person", "Another company or person"]]}
                  onPick={(v) => patch({ whoMade: v })}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <span style={label}>When was it made?</span>
                <Chips<WhenMade>
                  name="When was it made"
                  value={listing.whenMade}
                  options={[["Made to order", "Made to order"], ["2020s", "2020s"], ["Before 2020", "Before 2020"]]}
                  onPick={(v) => patch({ whenMade: v })}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <span style={label}>What is it?</span>
                <Chips
                  name="Finished product or supply"
                  value={listing.isSupply ? "supply" : "finished"}
                  options={[["finished", "A finished product"], ["supply", "A supply or tool"]]}
                  onPick={(v) => patch({ isSupply: v === "supply" })}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <span style={label}>Does a production partner help make it?</span>
                <Chips
                  name="Production partner"
                  value={listing.productionPartner ? "yes" : "no"}
                  options={[["no", "No"], ["yes", "Yes"]]}
                  onPick={(v) => patch({ productionPartner: v === "yes" })}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <span style={label}>Can buyers personalize it?</span>
                <Chips
                  name="Personalization"
                  value={listing.personalization ? "yes" : "no"}
                  options={[["no", "No"], ["yes", "Yes"]]}
                  onPick={(v) => patch({ personalization: v === "yes" })}
                />
                {listing.personalization && (
                  <div style={{ marginTop: 8 }}>
                    <label htmlFor="els-perso" style={label}>Instructions buyers will see</label>
                    <input id="els-perso" value={listing.personalizationNote} onChange={(e) => patch({ personalizationNote: e.target.value })} placeholder="e.g., Tell us the name to print" style={input} />
                  </div>
                )}
              </div>

              {listing.digitalOrPhysical === "physical" && (
                <>
                  <div style={{ marginBottom: 16 }}>
                    <label htmlFor="els-qty" style={label}>Quantity you can fulfil</label>
                    <input id="els-qty" inputMode="numeric" value={listing.quantity} onChange={(e) => patch({ quantity: e.target.value })} placeholder="e.g., 10" style={input} />
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <label htmlFor="els-materials" style={label}>Materials (only what you&apos;ll really use)</label>
                    <input id="els-materials" value={listing.materials} onChange={(e) => patch({ materials: e.target.value })} placeholder="e.g., vinyl, ceramic — leave empty if unsure" style={input} />
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <label htmlFor="els-dims" style={label}>Size or dimensions (optional)</label>
                    <input id="els-dims" value={listing.dimensionsNote} onChange={(e) => patch({ dimensionsNote: e.target.value })} placeholder={'e.g., 3" x 3" sticker'} style={input} />
                  </div>
                </>
              )}

              {listing.digitalOrPhysical === "digital" && (
                <div style={{ marginBottom: 16 }}>
                  <label htmlFor="els-file" style={label}>What the buyer downloads</label>
                  <input id="els-file" value={listing.digitalFileNote} onChange={(e) => patch({ digitalFileNote: e.target.value })} style={input} />
                </div>
              )}

              <button onClick={() => patch({}, "listing")} className="btn btn-gold" style={{ width: "100%", marginTop: 6 }}>
                Review your listing →
              </button>
            </div>
          </>
        )}

        {/* ---- LISTING (everything editable in place) ---- */}
        {stage === "listing" && (
          <>
            <button onClick={() => patch({}, "details")} className="btn btn-ghost btn-small" style={{ marginBottom: 12 }}>← Product details</button>

            <div style={card}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={pkg.artwork.primaryAssetUrl} alt={`Primary listing image: ${pkg.idea.subject}`} style={{ width: "100%", maxWidth: 420, borderRadius: 12, border: "1px solid var(--line2)", display: "block", margin: "0 auto 8px" }} />
              <p style={{ fontSize: 12.5, color: "var(--muted)", textAlign: "center", margin: 0 }}>
                Primary image — {pkg.artwork.width}×{pkg.artwork.height}px {pkg.artwork.mimeType === "image/png" ? "PNG (a flattened JPG for upload is included in the pack)" : "JPG"}
              </p>
            </div>

            <div style={card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <label htmlFor="els-title" style={{ ...label, marginBottom: 0 }}>Title <span style={{ color: "var(--muted)", fontWeight: 400 }}>({listing.title.length}/{TITLE_MAX})</span></label>
                <CopyBtn text={listing.title} name="Title" onCopy={copyText} />
              </div>
              <textarea id="els-title" value={listing.title} onChange={(e) => patch({ title: e.target.value.slice(0, TITLE_MAX + 20) })} style={{ ...input, minHeight: 54, resize: "vertical" }} />
            </div>

            <div style={card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <label htmlFor="els-desc" style={{ ...label, marginBottom: 0 }}>Description</label>
                <CopyBtn text={listing.description} name="Description" onCopy={copyText} />
              </div>
              <textarea id="els-desc" value={listing.description} onChange={(e) => patch({ description: e.target.value })} style={{ ...input, minHeight: 140, resize: "vertical" }} />
            </div>

            <div style={card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ ...label, marginBottom: 0 }}>Tags <span style={{ color: "var(--muted)", fontWeight: 400 }}>({listing.tags.length}/{TAG_MAX_COUNT})</span></span>
                <CopyBtn text={listing.tags.join(", ")} name="Tags" onCopy={copyText} />
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
                {listing.tags.map((tag, i) => (
                  <span key={`${tag}-${i}`} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "var(--surface)", border: "1px solid var(--line2)", borderRadius: 50, padding: "6px 6px 6px 12px", fontSize: 13, color: "var(--text)" }}>
                    {tag}
                    <button
                      aria-label={`Remove tag ${tag}`}
                      onClick={() => patch({ tags: listing.tags.filter((_, j) => j !== i) })}
                      style={{ background: "var(--line2)", color: "var(--text)", border: "none", borderRadius: "50%", width: 22, height: 22, cursor: "pointer", fontSize: 12, lineHeight: 1 }}
                    >×</button>
                  </span>
                ))}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  aria-label="New tag"
                  value={newTag}
                  maxLength={TAG_MAX_LEN}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newTag.trim() && listing.tags.length < TAG_MAX_COUNT) {
                      patch({ tags: [...listing.tags, newTag.trim().toLowerCase()] });
                      setNewTag("");
                    }
                  }}
                  placeholder={listing.tags.length >= TAG_MAX_COUNT ? "13 tags — Etsy's limit" : "Add a tag (max 20 characters)"}
                  disabled={listing.tags.length >= TAG_MAX_COUNT}
                  style={{ ...input, flex: 1 }}
                />
                <button
                  onClick={() => { if (newTag.trim() && listing.tags.length < TAG_MAX_COUNT) { patch({ tags: [...listing.tags, newTag.trim().toLowerCase()] }); setNewTag(""); } }}
                  disabled={!newTag.trim() || listing.tags.length >= TAG_MAX_COUNT}
                  className="btn btn-gold btn-small"
                >Add</button>
              </div>
            </div>

            <div style={card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <label htmlFor="els-cat" style={{ ...label, marginBottom: 0 }}>Suggested category</label>
                <CopyBtn text={listing.category} name="Category" onCopy={copyText} />
              </div>
              <input id="els-cat" value={listing.category} onChange={(e) => patch({ category: e.target.value })} style={input} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, margin: "14px 0 6px" }}>
                <label htmlFor="els-price" style={{ ...label, marginBottom: 0 }}>Suggested price (USD)</label>
                <CopyBtn text={listing.price} name="Price" onCopy={copyText} />
              </div>
              <input id="els-price" inputMode="decimal" value={listing.price} onChange={(e) => patch({ price: e.target.value })} style={{ ...input, maxWidth: 140 }} />
              <p style={{ fontSize: 12.5, color: "var(--muted)", margin: "8px 0 0" }}>
                A starting point from the product type — check what similar listings actually charge.
              </p>
            </div>

            {(errors.length > 0 || warnings.length > 0) && (
              <div style={{ ...card, borderColor: errors.length ? "var(--gold)" : "var(--line)" }}>
                <p style={kicker}>Still needed</p>
                {errors.map((e, i) => <p key={`e${i}`} style={{ fontSize: 13.5, color: "var(--text)", fontWeight: 700, margin: "0 0 6px" }}>• {e}</p>)}
                {warnings.map((w, i) => <p key={`w${i}`} style={{ fontSize: 13, color: "var(--muted)", margin: "0 0 6px" }}>• {w}</p>)}
              </div>
            )}

            <button onClick={() => patch({}, "approve")} className="btn btn-gold" style={{ width: "100%" }}>
              Review everything →
            </button>
          </>
        )}

        {/* ---- APPROVE ---- */}
        {stage === "approve" && (
          <>
            <button onClick={() => patch({}, "listing")} className="btn btn-ghost btn-small" style={{ marginBottom: 12 }}>← Edit listing</button>

            <div style={card}>
              <p style={kicker}>The whole package</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={pkg.artwork.primaryAssetUrl} alt={`Final artwork: ${pkg.idea.subject}`} style={{ width: "100%", maxWidth: 420, borderRadius: 12, border: "1px solid var(--line2)", display: "block", margin: "0 auto 10px" }} />
              <p style={{ fontSize: 12.5, color: "var(--muted)", textAlign: "center", margin: "0 0 14px" }}>
                {pkg.artwork.width}×{pkg.artwork.height}px {pkg.artwork.mimeType === "image/png" ? "PNG + flattened listing JPG" : "JPG"}
                {Math.min(pkg.artwork.width, pkg.artwork.height) < 2000 ? " — under Etsy's recommended 2000px; fine for stickers and small formats" : " — meets Etsy's recommended size"}
              </p>

              {([
                ["Title", listing.title],
                ["Price", `$${listing.price}`],
                ["Category", listing.category],
                ["Sold as", listing.digitalOrPhysical],
                ["Tags", listing.tags.join(", ")],
                ["Who made it", listing.whoMade || "—"],
                ["When", listing.whenMade || "—"],
                ["Production partner", listing.productionPartner ? "Yes — declare on Etsy" : "No"],
              ] as const).map(([k, v]) => (
                <div key={k} style={{ marginBottom: 10 }}>
                  <p style={{ fontSize: 12, fontWeight: 900, color: "var(--gold)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 2px" }}>{k}</p>
                  <p style={{ fontSize: 14, color: "var(--text)", margin: 0, overflowWrap: "anywhere" }}>{v}</p>
                </div>
              ))}
              <div style={{ marginBottom: 10 }}>
                <p style={{ fontSize: 12, fontWeight: 900, color: "var(--gold)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 2px" }}>Description</p>
                <pre style={{ whiteSpace: "pre-wrap", fontFamily: "inherit", fontSize: 13.5, color: "var(--muted)", lineHeight: 1.6, margin: 0 }}>{listing.description}</pre>
              </div>
            </div>

            {(errors.length > 0 || warnings.length > 0) && (
              <div style={{ ...card, borderColor: errors.length ? "var(--gold)" : "var(--line)" }}>
                <p style={kicker}>{errors.length ? "Fix before approving" : "Worth a look"}</p>
                {errors.map((e, i) => <p key={`e${i}`} style={{ fontSize: 13.5, color: "var(--text)", fontWeight: 700, margin: "0 0 6px" }}>• {e}</p>)}
                {warnings.map((w, i) => <p key={`w${i}`} style={{ fontSize: 13, color: "var(--muted)", margin: "0 0 6px" }}>• {w}</p>)}
              </div>
            )}

            <button
              onClick={() => { patch({ approvedAt: new Date().toISOString() }, "ready"); track("etsy_package_approved", {}); }}
              disabled={errors.length > 0}
              className="btn btn-gold"
              style={{ width: "100%", opacity: errors.length ? 0.5 : 1 }}
            >
              Approve Etsy package →
            </button>
            <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
              <button onClick={() => patch({}, "listing")} className="btn btn-ghost btn-small">Edit listing</button>
              <a href="https://idontcry.com/dream-shop" className="btn btn-ghost btn-small">Change artwork (back to Dream Shop)</a>
            </div>
          </>
        )}

        {/* ---- READY ---- */}
        {stage === "ready" && (
          <>
            <div style={card}>
              <p style={kicker}>✓ Etsy package approved</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={pkg.artwork.primaryAssetUrl} alt={`Approved artwork: ${pkg.idea.subject}`} style={{ width: "100%", maxWidth: 320, borderRadius: 12, border: "1px solid var(--line2)", display: "block", margin: "0 auto 12px" }} />
              <p style={{ fontSize: 13.5, color: "var(--muted)", lineHeight: 1.6, margin: "0 0 16px", textAlign: "center" }}>
                Download the pack, then open Etsy and paste as you go. This screen stays here — nothing disappears when Etsy opens.
              </p>

              <button onClick={downloadPack} disabled={!!busy} className="btn btn-gold" style={{ width: "100%", marginBottom: 10 }}>
                {busy === "pack" ? "Building the pack…" : "1. Download Etsy Pack (.zip)"}
              </button>
              <button onClick={() => copyText(buildListingTxt(listing, pkg), "Listing text")} className="btn btn-gold" style={{ width: "100%", marginBottom: 10 }}>
                2. Copy listing text
              </button>

              {openEtsyWarn && !listing.packDownloadedAt ? (
                <div style={{ background: "var(--surface)", border: "1px solid var(--gold)", borderRadius: 12, padding: 14, marginBottom: 10 }}>
                  <p style={{ fontSize: 13.5, color: "var(--text)", fontWeight: 700, margin: "0 0 10px" }}>
                    You haven&apos;t downloaded the Etsy Pack yet — Etsy will ask for the image file first.
                  </p>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button onClick={downloadPack} disabled={!!busy} className="btn btn-gold btn-small">Download the pack</button>
                    <button onClick={openEtsy} className="btn btn-ghost btn-small">Open Etsy anyway</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => (listing.packDownloadedAt ? openEtsy() : setOpenEtsyWarn(true))} className="btn btn-gold" style={{ width: "100%", marginBottom: 4 }}>
                  3. Open Etsy — New Listing ↗
                </button>
              )}
              <p style={{ fontSize: 12, color: "var(--muted)", textAlign: "center", margin: "6px 0 0" }}>
                Opens in a new tab. Nothing publishes automatically — you review everything on Etsy.
              </p>
            </div>

            <div style={card}>
              <p style={kicker}>Piece by piece</p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button onClick={downloadPrimary} disabled={!!busy} className="btn btn-ghost btn-small">{busy === "primary" ? "Downloading…" : "Download primary image"}</button>
                <button onClick={downloadAllImages} disabled={!!busy} className="btn btn-ghost btn-small">{busy === "allimg" ? "Downloading…" : "Download all images"}</button>
                <button onClick={copyImage} disabled={!!busy} className="btn btn-ghost btn-small">{busy === "copyimg" ? "Copying…" : "Copy image"}</button>
                <CopyBtn text={listing.title} name="Title" onCopy={copyText} />
                <CopyBtn text={listing.description} name="Description" onCopy={copyText} />
                <CopyBtn text={listing.tags.join(", ")} name="Tags" onCopy={copyText} />
                <CopyBtn text={listing.category} name="Category" onCopy={copyText} />
                <CopyBtn text={listing.price} name="Price" onCopy={copyText} />
              </div>
              <button onClick={() => { patch({ approvedAt: undefined }, "listing"); say("Back to editing — re-approve when you're done."); }} className="btn btn-ghost btn-small" style={{ marginTop: 12 }}>
                ← Return to edit
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
