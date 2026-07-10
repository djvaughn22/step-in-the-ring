"use client";

/**
 * Design Shop Engine Studio
 *
 * Complete workflow: Spark → Explore → Score → Create → Review → Export
 */

import { useState, useEffect, useMemo } from "react";
import {
  generateProductDirections,
  createDesignPackageTemplate,
  generateEtsyListingDraft,
  SEED_PRODUCTS,
  type DesignPackage,
} from "./design-shop.engine";
import type { CreationDirection } from "../shared/creation-engine.types";

type Stage = "spark" | "explore" | "score" | "create" | "review" | "export";

interface ScoringState {
  directionId: string;
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
  { id: "seasonality", label: "Seasonality", scale: 5, weight: 0.7 },
  { id: "ipRisk", label: "IP Risk", scale: 5, weight: 2 },
];

export default function DesignShopStudio({
  onBack,
  card,
  Section,
}: {
  onBack: () => void;
  card: React.CSSProperties;
  Section: (p: { title: string; body: string }) => React.ReactElement;
}) {
  const [stage, setStage] = useState<Stage>("spark");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [directions, setDirections] = useState<CreationDirection[]>([]);
  const [selectedDirectionId, setSelectedDirectionId] = useState<string>("");
  const [scores, setScores] = useState<ScoringState | null>(null);
  const [design, setDesign] = useState<DesignPackage | null>(null);
  const [loading, setLoading] = useState(false);
  const [flash, setFlash] = useState("");

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

  // ---- SPARK STAGE ----
  const handleSparkSubmit = async () => {
    if (!answers.name || !answers.idea || !answers.customer || !answers.spark || !answers.productType) {
      say("Fill in required fields");
      return;
    }

    setLoading(true);
    try {
      const dirs = await generateProductDirections(
        answers.idea,
        answers.customer,
        answers.productType,
        answers.theme || "",
      );
      setDirections(dirs);
      setStage("explore");
    } catch (e) {
      say("Error generating directions");
    } finally {
      setLoading(false);
    }
  };

  // ---- EXPLORE STAGE ----
  const handleSelectDirection = (dirId: string) => {
    setSelectedDirectionId(dirId);
    setStage("score");
  };

  // ---- SCORE STAGE ----
  const selectedDir = directions.find((d) => d.id === selectedDirectionId);

  const handleScoreChange = (key: string, value: number | boolean) => {
    setScores((prev) => ({
      ...prev!,
      [key]: value,
    }));
  };

  const handleScoreSubmit = () => {
    if (!scores) return;
    setStage("create");
  };

  // ---- CREATE STAGE ----
  const handleCreateDesign = () => {
    if (!selectedDir) return;
    const pkg = createDesignPackageTemplate(selectedDir, answers);
    setDesign(pkg);
    setStage("review");
  };

  // ---- REVIEW STAGE ----
  const handleApproveDesign = () => {
    setStage("export");
  };

  // ---- EXPORT STAGE ----
  const handleExportJSON = () => {
    if (!design) return;
    const pkg = { design, scores, answers, direction: selectedDir };
    copy(JSON.stringify(pkg, null, 2), "Design package JSON");
  };

  const handleExportMarkdown = () => {
    if (!design) return;
    const md = `# ${design.title}

## Concept
${design.concept}

## Product Details
- **Customer:** ${design.customer}
- **Product Type:** ${design.productType}
- **Dimensions:** ${design.dimensions}
- **Print Specs:** ${design.printSpecs}

## Design Direction
\`\`\`
${design.originalCopy.join("\n")}
\`\`\`

## Files Needed
${design.files.map((f) => `- ${f}`).join("\n") || "- (to be created)"}

## Mockups Required
${design.mockupRequirements.map((m) => `- ${m}`).join("\n")}

## Accessibility
${design.accessibilityNotes}

## Bundle Suggestions
${design.bundleSuggestions.map((b) => `- ${b}`).join("\n") || "- (standalone product)"}
`;
    copy(md, "Design package markdown");
  };

  const handleExportEtsyDraft = () => {
    if (!design) return;
    const listing = generateEtsyListingDraft(design, answers);
    const draft = `
# Etsy Listing Draft: ${listing.title}

**Price:** $${listing.price}
**Category:** ${listing.category}
**Quantity:** ${listing.quantity}
**Processing Days:** ${listing.processingDays}

## Title (140 chars)
${listing.title}

## Description
${listing.description}

## Tags (13 max)
${listing.tags.join(", ")}

## Social Caption
${listing.socialCaption}

## Video Concept
${listing.videoOrReelConcept}

## IP Checklist
${listing.ipChecklist.map((item) => `${item}`).join("\n")}
`;
    copy(draft, "Etsy listing draft");
  };

  // ---- RENDERING ----
  const input = {
    width: "100%",
    boxSizing: "border-box" as const,
    background: "var(--surface)",
    border: "1px solid var(--line2)",
    borderRadius: 10,
    color: "var(--text)",
    padding: "11px 12px",
    fontSize: 15,
    fontFamily: "inherit",
  };

  const buttonRow = { display: "flex", gap: 8, flexWrap: "wrap" as const };

  return (
    <main>
      <div className="page">
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <button onClick={onBack} className="btn btn-ghost btn-small">
            ← Back to projects
          </button>
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" }}>
            Design Shop Engine • {stage.toUpperCase()}
          </span>
        </div>

        {flash && <p style={{ color: "var(--gold)", fontWeight: 800, marginBottom: 12 }}>{flash}</p>}

        {/* ---- SPARK STAGE ---- */}
        {stage === "spark" && (
          <div style={card}>
            <h2 style={{ fontSize: 18, fontWeight: 900, marginBottom: 16 }}>🌟 The Spark</h2>
            <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 16 }}>
              Answer these questions about your product idea. We'll generate 5 directions you can explore.
            </p>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 13.5, fontWeight: 800, marginBottom: 4 }}>
                Project Name *
              </label>
              <input
                value={answers.name || ""}
                onChange={(e) => setAnswers({ ...answers, name: e.target.value })}
                placeholder="A working name is fine"
                style={input}
              />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 13.5, fontWeight: 800, marginBottom: 4 }}>
                Rough Product Idea *
              </label>
              <textarea
                value={answers.idea || ""}
                onChange={(e) => setAnswers({ ...answers, idea: e.target.value })}
                placeholder="The thing you're thinking about creating"
                style={{ ...input, minHeight: 66, resize: "vertical" }}
              />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 13.5, fontWeight: 800, marginBottom: 4 }}>
                Theme or Inspiration (optional)
              </label>
              <input
                value={answers.theme || ""}
                onChange={(e) => setAnswers({ ...answers, theme: e.target.value })}
                placeholder="e.g., Faith, Family, Fitness, Dogs, Dads"
                style={input}
              />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 13.5, fontWeight: 800, marginBottom: 4 }}>
                Who Would Use / Buy This? *
              </label>
              <input
                value={answers.customer || ""}
                onChange={(e) => setAnswers({ ...answers, customer: e.target.value })}
                placeholder="The person with the problem or need"
                style={input}
              />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 13.5, fontWeight: 800, marginBottom: 4 }}>
                Occasion or Context (optional)
              </label>
              <input
                value={answers.occasion || ""}
                onChange={(e) => setAnswers({ ...answers, occasion: e.target.value })}
                placeholder="e.g., Gift, Holiday, Party, Game Night"
                style={input}
              />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 13.5, fontWeight: 800, marginBottom: 4 }}>
                Product Type *
              </label>
              <select
                value={answers.productType || ""}
                onChange={(e) => setAnswers({ ...answers, productType: e.target.value })}
                style={input}
              >
                <option value="">— Choose —</option>
                {[
                  "Printable / Digital",
                  "Card Deck",
                  "Game / Activity Pack",
                  "Sticker Sheet",
                  "T-Shirt / Apparel",
                  "Mug / Drinkware",
                  "Tote / Bag",
                  "Wall Print / Art",
                  "Journal / Planner",
                  "Undecided / Mixed",
                ].map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 13.5, fontWeight: 800, marginBottom: 4 }}>
                The Spark (joke, phrase, problem it solves) *
              </label>
              <input
                value={answers.spark || ""}
                onChange={(e) => setAnswers({ ...answers, spark: e.target.value })}
                placeholder="One core idea or phrase driving this"
                style={input}
              />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 13.5, fontWeight: 800, marginBottom: 4 }}>
                Biggest Constraint (optional)
              </label>
              <input
                value={answers.constraint || ""}
                onChange={(e) => setAnswers({ ...answers, constraint: e.target.value })}
                placeholder="Time, design skill, production cost, etc."
                style={input}
              />
            </div>

            <button
              onClick={handleSparkSubmit}
              disabled={loading}
              style={{ width: "100%", marginTop: 16 }}
              className="btn btn-gold"
            >
              {loading ? "Generating directions..." : "Generate 5 Directions →"}
            </button>
          </div>
        )}

        {/* ---- EXPLORE STAGE ---- */}
        {stage === "explore" && (
          <div>
            <button onClick={() => setStage("spark")} className="btn btn-ghost btn-small" style={{ marginBottom: 12 }}>
              ← Back to spark
            </button>
            <div style={card}>
              <h2 style={{ fontSize: 18, fontWeight: 900, marginBottom: 16 }}>🧭 Explore 5 Directions</h2>
              <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 20 }}>
                Here are 5 distinct interpretations of "{answers.idea}". Pick the one that resonates most. You'll score
                it in the next step.
              </p>

              {directions.map((dir) => (
                <div
                  key={dir.id}
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--line2)",
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 12,
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget;
                    el.style.borderColor = "var(--gold)";
                    el.style.background = "var(--panel)";
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget;
                    el.style.borderColor = "var(--line2)";
                    el.style.background = "var(--surface)";
                  }}
                >
                  <p style={{ fontSize: 14, fontWeight: 900, color: "var(--text)", margin: "0 0 6px" }}>
                    {dir.label}
                  </p>
                  <p style={{ fontSize: 13, color: "var(--muted)", margin: "0 0 8px" }}>{dir.description}</p>
                  {dir.reasoning && (
                    <p style={{ fontSize: 12, color: "var(--muted)", fontStyle: "italic", margin: "0 0 12px" }}>
                      Why: {dir.reasoning}
                    </p>
                  )}
                  <button
                    onClick={() => handleSelectDirection(dir.id)}
                    style={{
                      background: "var(--gold)",
                      color: "#000",
                      border: "none",
                      borderRadius: 50,
                      padding: "8px 16px",
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Score This →
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ---- SCORE STAGE ---- */}
        {stage === "score" && selectedDir && (
          <div>
            <button
              onClick={() => {
                setStage("explore");
                setSelectedDirectionId("");
              }}
              className="btn btn-ghost btn-small"
              style={{ marginBottom: 12 }}
            >
              ← Back to directions
            </button>
            <div style={card}>
              <h2 style={{ fontSize: 18, fontWeight: 900, marginBottom: 8 }}>📊 Score This Direction</h2>
              <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 16 }}>
                {selectedDir.label} — Rate on 10 transparent dimensions.
              </p>

              {DIMENSIONS.map((dim) => (
                <div key={dim.id} style={{ marginBottom: 14 }}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 4 }}>
                    {dim.label}
                    {dim.weight !== 1 && (
                      <span style={{ fontSize: 11, color: "var(--muted)", marginLeft: 8 }}>
                        (weight: {dim.weight}x)
                      </span>
                    )}
                  </label>
                  {dim.scale === 5 ? (
                    <div style={{ display: "flex", gap: 6 }}>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          onClick={() => handleScoreChange(dim.id, n)}
                          style={{
                            background: scores?.[dim.id as keyof ScoringState] === n ? "var(--gold)" : "var(--surface)",
                            color: scores?.[dim.id as keyof ScoringState] === n ? "#000" : "var(--text)",
                            border: `1px solid ${scores?.[dim.id as keyof ScoringState] === n ? "var(--gold)" : "var(--line2)"}`,
                            borderRadius: 6,
                            padding: "8px 12px",
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div style={{ display: "flex", gap: 6 }}>
                      {[true, false].map((v) => (
                        <button
                          key={String(v)}
                          onClick={() => handleScoreChange(dim.id, v)}
                          style={{
                            background: scores?.[dim.id as keyof ScoringState] === v ? "var(--gold)" : "var(--surface)",
                            color: scores?.[dim.id as keyof ScoringState] === v ? "#000" : "var(--text)",
                            border: `1px solid ${scores?.[dim.id as keyof ScoringState] === v ? "var(--gold)" : "var(--line2)"}`,
                            borderRadius: 6,
                            padding: "8px 12px",
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          {v ? "Yes" : "No"}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              <button
                onClick={handleScoreSubmit}
                style={{ width: "100%", marginTop: 16 }}
                className="btn btn-gold"
              >
                Proceed to Design →
              </button>
            </div>
          </div>
        )}

        {/* ---- CREATE STAGE ---- */}
        {stage === "create" && selectedDir && (
          <div>
            <button
              onClick={() => setStage("score")}
              className="btn btn-ghost btn-small"
              style={{ marginBottom: 12 }}
            >
              ← Back to scoring
            </button>
            <div style={card}>
              <h2 style={{ fontSize: 18, fontWeight: 900, marginBottom: 16 }}>✏️ Create Design Package</h2>
              <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 16 }}>
                We'll generate a complete design package template based on "{selectedDir.label}". Review and customize
                as needed.
              </p>

              <button
                onClick={handleCreateDesign}
                disabled={loading}
                style={{ width: "100%", marginTop: 16 }}
                className="btn btn-gold"
              >
                {loading ? "Generating..." : "Generate Design Package →"}
              </button>
            </div>
          </div>
        )}

        {/* ---- REVIEW STAGE ---- */}
        {stage === "review" && design && (
          <div>
            <button
              onClick={() => setStage("create")}
              className="btn btn-ghost btn-small"
              style={{ marginBottom: 12 }}
            >
              ← Back to design
            </button>
            <div style={card}>
              <h2 style={{ fontSize: 18, fontWeight: 900, marginBottom: 16 }}>👀 Review Package</h2>

              <Section title="Title" body={design.title} />
              <Section title="Concept" body={design.concept} />
              <Section title="Customer" body={design.customer} />
              <Section title="Product Type" body={design.productType} />
              <Section title="Dimensions" body={design.dimensions} />
              <Section title="Print Specs" body={design.printSpecs} />
              {design.materials && <Section title="Materials" body={design.materials} />}
              <Section title="Accessibility" body={design.accessibilityNotes} />

              <div style={{ marginTop: 16 }}>
                <button onClick={handleApproveDesign} className="btn btn-gold" style={{ width: "100%" }}>
                  Approve & Export →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ---- EXPORT STAGE ---- */}
        {stage === "export" && design && (
          <div>
            <button
              onClick={() => setStage("review")}
              className="btn btn-ghost btn-small"
              style={{ marginBottom: 12 }}
            >
              ← Back to review
            </button>
            <div style={card}>
              <h2 style={{ fontSize: 18, fontWeight: 900, marginBottom: 16 }}>📦 Export & Publish</h2>
              <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 20 }}>
                Download your design package in multiple formats. Ready for production or Etsy listing.
              </p>

              <div style={buttonRow}>
                <button onClick={handleExportJSON} className="btn btn-ghost btn-small">
                  Copy JSON Package
                </button>
                <button onClick={handleExportMarkdown} className="btn btn-ghost btn-small">
                  Copy Markdown Draft
                </button>
                <button onClick={handleExportEtsyDraft} className="btn btn-ghost btn-small">
                  Copy Etsy Listing Draft
                </button>
              </div>

              <div style={{ marginTop: 20, padding: 12, background: "var(--surface)", borderRadius: 10 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: "var(--gold)", margin: "0 0 8px" }}>
                  Next Steps
                </p>
                <ul style={{ fontSize: 13, color: "var(--muted)", margin: 0, paddingLeft: 20 }}>
                  <li>Review the copied package in your editor</li>
                  <li>Add mockup images and design files</li>
                  <li>Verify IP compliance (no copyrighted content)</li>
                  <li>Adjust title, description, and pricing</li>
                  <li>Create Etsy listing or export for production</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
