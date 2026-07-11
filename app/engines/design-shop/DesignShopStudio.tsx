"use client";

/**
 * Design Shop Engine Studio
 *
 * Workflow: Spark → Explore → Score → Create → Review → Export
 * Projects save to this device automatically at every step (shared persistence).
 */

import { useEffect, useState } from "react";
import {
  generateProductDirections,
  createDesignPackageTemplate,
  generateEtsyListingDraft,
  type DesignPackage,
} from "./design-shop.engine";
import type { CreationDirection, CreationProject, CreationStatus, FileExport } from "../shared/creation-engine.types";
import { CREATION_STATUS_LABELS } from "../shared/creation-engine.types";
import {
  createProject,
  deleteProject,
  getProject,
  getProjectsByEngine,
  uid,
  updateProject,
} from "../shared/persistence";

type Stage = "projects" | "spark" | "explore" | "score" | "create" | "review" | "export";

const ENGINE_ID = "design-shop";

interface ScoringState {
  fun: number;
  useful: number;
  giftable: number;
  originality: number;
  ease: number;
  digitalFirst: boolean;
  bundleable: boolean;
  physicalReuse: boolean;
  seasonality: number;
  ipRisk: number;
}

const DIMENSIONS = [
  { id: "fun", label: "Fun", scale: 5, weight: 1 },
  { id: "useful", label: "Usefulness", scale: 5, weight: 1 },
  { id: "giftable", label: "Giftability", scale: 5, weight: 1 },
  { id: "originality", label: "Originality", scale: 5, weight: 1 },
  { id: "ease", label: "Ease of Creation", scale: 5, weight: 0.5 },
  { id: "digitalFirst", label: "Digital-First Potential", scale: 1, weight: 1 },
  { id: "bundleable", label: "Bundle-able", scale: 1, weight: 1 },
  { id: "physicalReuse", label: "Physical Reuse", scale: 1, weight: 1 },
  { id: "seasonality", label: "Seasonality (5 = evergreen)", scale: 5, weight: 0.7 },
  { id: "ipRisk", label: "IP Risk (5 = high risk)", scale: 5, weight: 2 },
] as const;

// Map a saved project status back to the studio stage so work resumes where it left off.
function stageFromStatus(status: CreationStatus): Stage {
  switch (status) {
    case "spark": return "spark";
    case "exploring": return "explore";
    case "selected": return "score";
    case "creating": return "create";
    case "ready-for-review": return "review";
    case "approved":
    case "ready-to-export":
    case "ready-to-publish":
    case "published":
      return "export";
    default: return "spark";
  }
}

function downloadFile(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "design";
}

export default function DesignShopStudio({
  onBack,
  card,
  Section,
  initialAnswers,
}: {
  onBack: () => void;
  card: React.CSSProperties;
  Section: (p: { title: string; body: string }) => React.ReactElement;
  // Prefill from another engine's handoff (e.g., Idea Engine decision).
  initialAnswers?: Record<string, string>;
}) {
  const [ready, setReady] = useState(false);
  const [saved, setSaved] = useState<CreationProject[]>([]);
  const [project, setProject] = useState<CreationProject | null>(null);
  const [stage, setStage] = useState<Stage>("spark");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [directions, setDirections] = useState<CreationDirection[]>([]);
  const [selectedDirectionId, setSelectedDirectionId] = useState<string>("");
  const [scores, setScores] = useState<ScoringState | null>(null);
  const [design, setDesign] = useState<DesignPackage | null>(null);
  const [loading, setLoading] = useState(false);
  const [flash, setFlash] = useState("");

  useEffect(() => {
    const existing = getProjectsByEngine(ENGINE_ID);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSaved(existing);
    if (initialAnswers && Object.keys(initialAnswers).length > 0) {
      // Arriving from another engine's handoff — start a new spark, prefilled.
      setAnswers(initialAnswers);
      setStage("spark");
    } else if (existing.length > 0) {
      setStage("projects");
    }
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const say = (m: string) => {
    setFlash(m);
    setTimeout(() => setFlash(""), 2000);
  };

  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      say(`${label} copied`);
    } catch {
      say("Copy failed");
    }
  };

  // Persist the current project with a status + content patch.
  const save = (patch: Partial<CreationProject>) => {
    if (!project) return;
    const next = { ...project, ...patch };
    updateProject(next);
    setProject(next);
    setSaved(getProjectsByEngine(ENGINE_ID));
  };

  const refreshList = () => setSaved(getProjectsByEngine(ENGINE_ID));

  // ---- PROJECTS LIST ----
  const openProject = (p: CreationProject) => {
    setProject(p);
    setAnswers(p.answers);
    setDirections(p.directions ?? []);
    setSelectedDirectionId(p.selectedDirectionId ?? "");
    const bc = p.buildContent as { design?: DesignPackage; scores?: ScoringState } | undefined;
    setDesign(bc?.design ?? null);
    setScores(bc?.scores ?? null);
    setStage(stageFromStatus(p.status));
  };

  const startNew = () => {
    setProject(null);
    setAnswers({});
    setDirections([]);
    setSelectedDirectionId("");
    setScores(null);
    setDesign(null);
    setStage("spark");
  };

  // ---- SPARK ----
  const handleSparkSubmit = async () => {
    if (!answers.name || !answers.idea || !answers.customer || !answers.spark || !answers.productType) {
      say("Fill in required fields");
      return;
    }
    setLoading(true);
    try {
      const dirs = await generateProductDirections(
        answers.idea, answers.customer, answers.productType, answers.theme || "",
      );
      setDirections(dirs);
      // Create or update the saved project.
      let p = project;
      if (!p) {
        p = createProject(ENGINE_ID, answers.name, answers);
        setProject(p);
      }
      const next: CreationProject = { ...p, name: answers.name, answers, directions: dirs, status: "exploring" };
      updateProject(next);
      setProject(next);
      refreshList();
      setStage("explore");
    } catch {
      say("Error generating directions");
    } finally {
      setLoading(false);
    }
  };

  // ---- EXPLORE ----
  const handleSelectDirection = (dirId: string) => {
    setSelectedDirectionId(dirId);
    save({ selectedDirectionId: dirId, status: "selected" });
    setStage("score");
  };

  const selectedDir = directions.find((d) => d.id === selectedDirectionId);

  // ---- SCORE ----
  const handleScoreChange = (key: string, value: number | boolean) => {
    setScores((prev) => ({ ...(prev ?? ({} as ScoringState)), [key]: value }));
  };

  const handleScoreSubmit = () => {
    save({ status: "creating", buildContent: { ...(project?.buildContent ?? {}), scores } });
    setStage("create");
  };

  // ---- CREATE ----
  const handleCreateDesign = () => {
    if (!selectedDir) return;
    const pkg = createDesignPackageTemplate(selectedDir, answers);
    setDesign(pkg);
    save({ status: "ready-for-review", buildContent: { ...(project?.buildContent ?? {}), scores, design: pkg } });
    setStage("review");
  };

  // ---- REVIEW ----
  const handleApproveDesign = () => {
    save({ status: "approved", reviewedAt: new Date().toISOString() });
    setStage("export");
  };

  // ---- EXPORT ----
  const recordExport = (type: FileExport["type"], name: string) => {
    if (!project) return;
    // Read the latest saved state — back-to-back exports would otherwise
    // overwrite each other through a stale closure.
    const latest = getProject(project.id) ?? project;
    const entry: FileExport = {
      id: uid(), type, name, url: name,
      generatedAt: new Date().toISOString(),
      exportedVia: ENGINE_ID,
    };
    const next: CreationProject = { ...latest, exports: [...latest.exports, entry], status: "ready-to-publish" };
    updateProject(next);
    setProject(next);
    refreshList();
  };

  const exportJSON = () => {
    if (!design) return;
    const pkg = { design, scores, answers, direction: selectedDir };
    const name = `${slugify(design.title)}.json`;
    downloadFile(JSON.stringify(pkg, null, 2), name, "application/json");
    recordExport("json", name);
    say("JSON downloaded");
  };

  const buildMarkdown = () => {
    if (!design) return "";
    return `# ${design.title}

## Concept
${design.concept}

## Product Details
- **Customer:** ${design.customer}
- **Product Type:** ${design.productType}
- **Dimensions:** ${design.dimensions}
- **Print Specs:** ${design.printSpecs}

## Original Copy
${design.originalCopy.map((c) => `- ${c}`).join("\n") || "- (add phrases)"}

## Files Needed
${design.files.map((f) => `- ${f}`).join("\n") || "- (to be created)"}

## Mockups Required
${design.mockupRequirements.map((m) => `- ${m}`).join("\n")}

## Accessibility
${design.accessibilityNotes}
`;
  };

  const exportMarkdown = () => {
    if (!design) return;
    const name = `${slugify(design.title)}.md`;
    downloadFile(buildMarkdown(), name, "text/markdown");
    recordExport("markdown", name);
    say("Markdown downloaded");
  };

  const buildEtsyDraft = () => {
    if (!design) return "";
    const listing = generateEtsyListingDraft(design, answers);
    return `# Etsy Listing Draft: ${listing.title}

Draft only — verify keywords and pricing with current Etsy research before publishing.

**Price draft:** $${listing.price}
**Category suggestion:** ${listing.category}
**Quantity:** ${listing.quantity}
**Processing days:** ${listing.processingDays}

## Title (140 chars max)
${listing.title}

## Description
${listing.description}

## Tag ideas (13 max — draft, not verified search terms)
${listing.tags.join(", ")}

## Social caption
${listing.socialCaption}

## Video concept
${listing.videoOrReelConcept}

## IP checklist
${listing.ipChecklist.join("\n")}
`;
  };

  const exportEtsyDraft = () => {
    if (!design) return;
    const name = `${slugify(design.title)}-etsy-draft.md`;
    downloadFile(buildEtsyDraft(), name, "text/markdown");
    recordExport("markdown", name);
    say("Etsy draft downloaded");
  };

  // ---- STYLES ----
  const input = {
    width: "100%", boxSizing: "border-box" as const,
    background: "var(--surface)", border: "1px solid var(--line2)",
    borderRadius: 10, color: "var(--text)", padding: "11px 12px",
    fontSize: 15, fontFamily: "inherit",
  };
  const buttonRow = { display: "flex", gap: 8, flexWrap: "wrap" as const };

  if (!ready) return <div className="page"><div style={{ height: 200 }} /></div>;

  return (
    <main>
      <div className="page">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <button onClick={onBack} className="btn btn-ghost btn-small">← Engine Room</button>
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" }}>
            Design Shop {stage !== "projects" ? `• ${stage}` : ""}
          </span>
        </div>

        {flash && <p style={{ color: "var(--gold)", fontWeight: 800, marginBottom: 12 }}>{flash}</p>}
        {project && stage !== "projects" && (
          <p style={{ fontSize: 12, color: "var(--muted)", margin: "0 0 12px" }}>
            Saved on this device • {CREATION_STATUS_LABELS[project.status]}
          </p>
        )}

        {/* ---- PROJECTS LIST ---- */}
        {stage === "projects" && (
          <div style={card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h2 style={{ fontSize: 18, fontWeight: 900, margin: 0 }}>Your design projects</h2>
              <button onClick={startNew} className="btn btn-gold btn-small">+ New design</button>
            </div>
            {saved.length === 0 && <p style={{ fontSize: 14, color: "var(--muted)" }}>No saved designs yet.</p>}
            {saved.map((p) => (
              <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, padding: "10px 0", borderBottom: "1px solid var(--line2)" }}>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 800, color: "var(--text)", margin: 0 }}>{p.name}</p>
                  <p style={{ fontSize: 12, color: "var(--muted)", margin: "2px 0 0" }}>
                    {CREATION_STATUS_LABELS[p.status]} · {p.exports.length} export{p.exports.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  <button onClick={() => openProject(p)} className="btn btn-gold btn-small">Open</button>
                  <button
                    onClick={() => { if (confirm(`Delete "${p.name}"?`)) { deleteProject(p.id); refreshList(); } }}
                    className="btn btn-ghost btn-small"
                  >Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ---- SPARK ---- */}
        {stage === "spark" && (
          <div style={card}>
            {saved.length > 0 && (
              <button onClick={() => setStage("projects")} className="btn btn-ghost btn-small" style={{ marginBottom: 12 }}>← Saved designs</button>
            )}
            <h2 style={{ fontSize: 18, fontWeight: 900, marginBottom: 16 }}>1. The Spark</h2>
            <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 16 }}>
              Answer these questions about your product idea. You&apos;ll get 5 directions to explore. Progress saves on this device.
            </p>

            {([
              ["name", "Project Name *", "A working name is fine", "text"],
              ["idea", "Rough Product Idea *", "The thing you're thinking about creating", "textarea"],
              ["theme", "Theme or Inspiration (optional)", "e.g., Faith, Family, Fitness, Dogs, Dads", "text"],
              ["customer", "Who Would Use / Buy This? *", "The person with the problem or need", "text"],
              ["occasion", "Occasion or Context (optional)", "e.g., Gift, Holiday, Party, Game Night", "text"],
            ] as const).map(([key, label, placeholder, kind]) => (
              <div key={key} style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 13.5, fontWeight: 800, marginBottom: 4 }}>{label}</label>
                {kind === "textarea" ? (
                  <textarea value={answers[key] || ""} onChange={(e) => setAnswers({ ...answers, [key]: e.target.value })} placeholder={placeholder} style={{ ...input, minHeight: 66, resize: "vertical" }} />
                ) : (
                  <input value={answers[key] || ""} onChange={(e) => setAnswers({ ...answers, [key]: e.target.value })} placeholder={placeholder} style={input} />
                )}
              </div>
            ))}

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 13.5, fontWeight: 800, marginBottom: 4 }}>Product Type *</label>
              <select value={answers.productType || ""} onChange={(e) => setAnswers({ ...answers, productType: e.target.value })} style={input}>
                <option value="">— Choose —</option>
                {["Printable / Digital", "Card Deck", "Game / Activity Pack", "Sticker Sheet", "T-Shirt / Apparel", "Mug / Drinkware", "Tote / Bag", "Wall Print / Art", "Journal / Planner", "Undecided / Mixed"].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 13.5, fontWeight: 800, marginBottom: 4 }}>The Spark (joke, phrase, problem it solves) *</label>
              <input value={answers.spark || ""} onChange={(e) => setAnswers({ ...answers, spark: e.target.value })} placeholder="One core idea or phrase driving this" style={input} />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 13.5, fontWeight: 800, marginBottom: 4 }}>Biggest Constraint (optional)</label>
              <input value={answers.constraint || ""} onChange={(e) => setAnswers({ ...answers, constraint: e.target.value })} placeholder="Time, design skill, production cost, etc." style={input} />
            </div>

            <button onClick={handleSparkSubmit} disabled={loading} style={{ width: "100%", marginTop: 16 }} className="btn btn-gold">
              {loading ? "Generating directions..." : "Generate 5 Directions →"}
            </button>
          </div>
        )}

        {/* ---- EXPLORE ---- */}
        {stage === "explore" && (
          <div>
            <button onClick={() => setStage("spark")} className="btn btn-ghost btn-small" style={{ marginBottom: 12 }}>← Back to spark</button>
            <div style={card}>
              <h2 style={{ fontSize: 18, fontWeight: 900, marginBottom: 16 }}>2. Explore 5 Directions</h2>
              <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 20 }}>
                Five distinct interpretations of &ldquo;{answers.idea}&rdquo;. Pick the one that fits best. You&apos;ll score it next.
              </p>

              {directions.map((dir) => (
                <div key={dir.id} style={{ background: "var(--surface)", border: "1px solid var(--line2)", borderRadius: 12, padding: 16, marginBottom: 12 }}>
                  <p style={{ fontSize: 14, fontWeight: 900, color: "var(--text)", margin: "0 0 6px" }}>{dir.label}</p>
                  <p style={{ fontSize: 13, color: "var(--muted)", margin: "0 0 8px" }}>{dir.description}</p>
                  {dir.reasoning && (
                    <p style={{ fontSize: 12, color: "var(--muted)", fontStyle: "italic", margin: "0 0 12px" }}>Why: {dir.reasoning}</p>
                  )}
                  <button onClick={() => handleSelectDirection(dir.id)} className="btn btn-gold btn-small">Score This →</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ---- SCORE ---- */}
        {stage === "score" && selectedDir && (
          <div>
            <button onClick={() => setStage("explore")} className="btn btn-ghost btn-small" style={{ marginBottom: 12 }}>← Back to directions</button>
            <div style={card}>
              <h2 style={{ fontSize: 18, fontWeight: 900, marginBottom: 8 }}>3. Score This Direction</h2>
              <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 16 }}>
                {selectedDir.label} — rate on 10 transparent dimensions. Scores help you decide; they do not predict sales.
              </p>

              {DIMENSIONS.map((dim) => (
                <div key={dim.id} style={{ marginBottom: 14 }}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 4 }}>
                    {dim.label}
                    {dim.weight !== 1 && <span style={{ fontSize: 11, color: "var(--muted)", marginLeft: 8 }}>(weight: {dim.weight}x)</span>}
                  </label>
                  <div style={{ display: "flex", gap: 6 }}>
                    {dim.scale === 5
                      ? [1, 2, 3, 4, 5].map((n) => (
                          <button key={n} onClick={() => handleScoreChange(dim.id, n)}
                            style={{
                              background: scores?.[dim.id as keyof ScoringState] === n ? "var(--gold)" : "var(--surface)",
                              color: scores?.[dim.id as keyof ScoringState] === n ? "#000" : "var(--text)",
                              border: `1px solid ${scores?.[dim.id as keyof ScoringState] === n ? "var(--gold)" : "var(--line2)"}`,
                              borderRadius: 6, padding: "8px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer",
                            }}>{n}</button>
                        ))
                      : [true, false].map((v) => (
                          <button key={String(v)} onClick={() => handleScoreChange(dim.id, v)}
                            style={{
                              background: scores?.[dim.id as keyof ScoringState] === v ? "var(--gold)" : "var(--surface)",
                              color: scores?.[dim.id as keyof ScoringState] === v ? "#000" : "var(--text)",
                              border: `1px solid ${scores?.[dim.id as keyof ScoringState] === v ? "var(--gold)" : "var(--line2)"}`,
                              borderRadius: 6, padding: "8px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer",
                            }}>{v ? "Yes" : "No"}</button>
                        ))}
                  </div>
                </div>
              ))}

              <button onClick={handleScoreSubmit} style={{ width: "100%", marginTop: 16 }} className="btn btn-gold">
                Proceed to Design →
              </button>
            </div>
          </div>
        )}

        {/* ---- CREATE ---- */}
        {stage === "create" && selectedDir && (
          <div>
            <button onClick={() => setStage("score")} className="btn btn-ghost btn-small" style={{ marginBottom: 12 }}>← Back to scoring</button>
            <div style={card}>
              <h2 style={{ fontSize: 18, fontWeight: 900, marginBottom: 16 }}>4. Create Design Package</h2>
              <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 16 }}>
                Generates a complete design package for &ldquo;{selectedDir.label}&rdquo; — title, dimensions, print specs, mockup list, accessibility notes.
              </p>
              <button onClick={handleCreateDesign} style={{ width: "100%", marginTop: 8 }} className="btn btn-gold">
                Generate Design Package →
              </button>
            </div>
          </div>
        )}

        {/* ---- REVIEW ---- */}
        {stage === "review" && design && (
          <div>
            <button onClick={() => setStage("create")} className="btn btn-ghost btn-small" style={{ marginBottom: 12 }}>← Back</button>
            <div style={card}>
              <h2 style={{ fontSize: 18, fontWeight: 900, marginBottom: 16 }}>5. Review Package</h2>
              <Section title="Title" body={design.title} />
              <Section title="Concept" body={design.concept} />
              <Section title="Customer" body={design.customer} />
              <Section title="Product Type" body={design.productType} />
              <Section title="Dimensions" body={design.dimensions} />
              <Section title="Print Specs" body={design.printSpecs} />
              {design.materials && <Section title="Materials" body={design.materials} />}
              <Section title="Accessibility" body={design.accessibilityNotes} />
              <button onClick={handleApproveDesign} className="btn btn-gold" style={{ width: "100%", marginTop: 16 }}>
                Approve & Export →
              </button>
            </div>
          </div>
        )}

        {/* ---- EXPORT ---- */}
        {stage === "export" && design && (
          <div>
            <button onClick={() => setStage("review")} className="btn btn-ghost btn-small" style={{ marginBottom: 12 }}>← Back to review</button>
            <div style={card}>
              <h2 style={{ fontSize: 18, fontWeight: 900, marginBottom: 16 }}>6. Export</h2>
              <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 20 }}>
                Download the package as real files, or copy to clipboard. Etsy publishing from here is not connected yet — create the listing on Etsy using the draft.
              </p>

              <div style={{ ...buttonRow, marginBottom: 10 }}>
                <button onClick={exportJSON} className="btn btn-gold btn-small">Download JSON</button>
                <button onClick={exportMarkdown} className="btn btn-gold btn-small">Download Markdown</button>
                <button onClick={exportEtsyDraft} className="btn btn-gold btn-small">Download Etsy Draft</button>
              </div>
              <div style={buttonRow}>
                <button onClick={() => copy(buildMarkdown(), "Markdown")} className="btn btn-ghost btn-small">Copy Markdown</button>
                <button onClick={() => copy(buildEtsyDraft(), "Etsy draft")} className="btn btn-ghost btn-small">Copy Etsy Draft</button>
                <a href="https://www.etsy.com/your/shops/me/dashboard" target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-small">Open Etsy Shop Manager</a>
              </div>

              {project && project.exports.length > 0 && (
                <div style={{ marginTop: 16, padding: 12, background: "var(--surface)", borderRadius: 10 }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: "var(--gold)", margin: "0 0 8px" }}>Exports recorded</p>
                  {project.exports.map((ex) => (
                    <p key={ex.id} style={{ fontSize: 12.5, color: "var(--muted)", margin: "0 0 4px" }}>
                      {ex.name} — {new Date(ex.generatedAt).toLocaleString()}
                    </p>
                  ))}
                </div>
              )}

              <div style={{ marginTop: 16, padding: 12, background: "var(--surface)", borderRadius: 10 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: "var(--gold)", margin: "0 0 8px" }}>Next steps</p>
                <ul style={{ fontSize: 13, color: "var(--muted)", margin: 0, paddingLeft: 20 }}>
                  <li>Create the design file in your design tool (Canva, etc.)</li>
                  <li>Make the mockups on the list</li>
                  <li>Run the IP checklist in the Etsy draft</li>
                  <li>Create the listing on Etsy, then keep the listing URL with this project</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
