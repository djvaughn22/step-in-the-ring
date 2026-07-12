/**
 * Creation Engine Registry
 *
 * Central registry for all creative engines. Defines what engines are available,
 * their capabilities, and how to integrate them into the StepInTheRing shell.
 *
 * To add a new engine:
 * 1. Define it here (metadata + schema).
 * 2. Create engine-specific files (intake, generator, specialties, adapter).
 * 3. Add routes and preview component.
 * 4. Register the engine in ENGINE_REGISTRY.
 */

import type { BuildStage, Depth, Destination, Engine, Question } from "../engines";
import type { ScoringDimension, CreationDirection } from "./creation-engine.types";

// ============================================================================
// ENGINE DESCRIPTOR
// ============================================================================

export interface CreationEngineDescriptor {
  // Identity
  id: string;
  name: string;
  emoji: string;
  tagline: string;
  description: string;
  category: "product" | "creative" | "music" | "visual" | "written" | "interactive" | "business";
  launched: boolean; // If false, engine is in development.

  // Workflow
  suggestedStage: BuildStage;
  supportedStages: BuildStage[];
  specializedStages?: string[]; // Engine-specific stages beyond shared stages.

  // Intake & Questions
  intake: Question[]; // Spark stage questions.
  intakeHelp?: string;

  // Exploration (Explore stage)
  generatesDirections: boolean;
  directionsCount: number; // How many alternatives to generate.
  directionsGenerator?: (answers: Record<string, string>) => Promise<CreationDirection[]>;

  // Scoring (Score stage)
  scoringDimensions: ScoringDimension[];
  allowCustomScoring?: boolean;

  // Output
  outputTypes: ("json" | "markdown" | "pdf" | "design" | "media" | "code" | "listing" | "other")[];
  realOutputDescription: string; // What the engine actually produces.

  // Specialization
  specialties: string[]; // Engine-specific output sections (passed to generator).
  previewComponent?: string; // Component name for rendering engine output.

  // External Services
  adapters: string[]; // Service adapters: "etsy", "pod", "github", etc.
  requiredAdapters?: string[]; // Adapters needed to publish.

  // Tech
  technical: boolean; // If true, defaults to Claude Code destination.
  requiresApproval: boolean; // If true, has approval gate before publish.

  // Access
  requiredAccess?: "public" | "waitlist" | "registered"; // Default: "public".
}

// ============================================================================
// ENGINE REGISTRY
// ============================================================================

export const ENGINE_REGISTRY: CreationEngineDescriptor[] = [
  // Design Shop Engine (Etsy-ready product creation)
  {
    id: "design-shop",
    name: "Design Shop Engine",
    emoji: "🛍️",
    tagline: "Product idea → design package → Etsy listing",
    description: "Create original product concepts, design them, score them transparently, and package them for Etsy or standalone export.",
    category: "product",
    launched: false, // In development this session.

    suggestedStage: "Spark",
    supportedStages: ["Spark", "Shaping", "Building", "Polishing", "Launching"],

    intake: [
      {
        key: "name",
        label: "Project name",
        placeholder: "A working name is fine",
        type: "text",
      },
      {
        key: "idea",
        label: "Rough product idea",
        placeholder: "The thing you're thinking about creating",
        type: "textarea",
      },
      {
        key: "theme",
        label: "Theme or inspiration (optional)",
        placeholder: "e.g., Faith, Family, Fitness, Dogs, Dads, Office Humor",
        type: "text",
        optional: true,
      },
      {
        key: "customer",
        label: "Who would use / buy this?",
        placeholder: "The person with the problem or need",
        type: "text",
      },
      {
        key: "occasion",
        label: "Occasion or context (optional)",
        placeholder: "e.g., Gift, Holiday, Party, Game Night",
        type: "text",
        optional: true,
      },
      {
        key: "productType",
        label: "Product type you're imagining",
        type: "choice",
        options: [
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
        ],
      },
      {
        key: "spark",
        label: "The spark (joke, phrase, problem it solves)",
        placeholder: "One core idea or phrase driving this",
        type: "text",
      },
      {
        key: "constraint",
        label: "Biggest constraint right now?",
        placeholder: "Time, design skill, production cost, etc.",
        type: "text",
        optional: true,
      },
    ],

    generatesDirections: true,
    directionsCount: 5,

    scoringDimensions: [
      { id: "fun", name: "Fun", description: "Is it genuinely enjoyable or delightful?", scale: "1-5" },
      { id: "useful", name: "Usefulness", description: "Does it solve a real problem or fill a need?", scale: "1-5" },
      { id: "giftable", name: "Giftability", description: "Would someone buy this as a gift?", scale: "1-5" },
      { id: "originality", name: "Originality", description: "Is it genuinely new? Low = niche. High = mainstream potential.", scale: "1-5" },
      { id: "ease", name: "Creation Ease", description: "How hard is this to design and produce?", scale: "1-5", weight: 0.5 },
      { id: "digital-first", name: "Digital-First Potential", description: "Can this launch as downloadable first?", scale: "boolean" },
      { id: "bundleable", name: "Bundle-able", description: "Could this be part of a larger product suite?", scale: "boolean" },
      { id: "physical-reuse", name: "Physical Reuse", description: "Can the design appear on multiple product types?", scale: "boolean" },
      { id: "seasonality", name: "Seasonality", description: "Evergreen (1) or seasonal (5)?", scale: "1-5", weight: 0.7 },
      { id: "ip-risk", name: "IP Risk", description: "Low risk (1) or high risk (5) of trademark/copyright issues?", scale: "1-5", weight: 2 },
    ],

    outputTypes: ["json", "markdown", "design", "listing"],
    realOutputDescription: "Product concepts, design packages (title, copy, dimensions, print specs), Etsy-ready listing drafts, social launch kits.",

    specialties: [
      "Product Spark & Clarification",
      "Possible Product Directions",
      "Scoring Matrix",
      "Recommended Direction",
      "Design Package Template",
      "Etsy Listing Draft",
      "Social Launch Kit",
      "Fulfillment Path",
      "IP & Legal Checklist",
    ],

    adapters: ["export", "etsy"],
    requiredAdapters: [],

    technical: false,
    requiresApproval: true,
    requiredAccess: "public",
  },

  // Future engines (placeholders for architecture validation)
  {
    id: "music",
    name: "Music Engine",
    emoji: "🎵",
    tagline: "Song concept → lyrics → structure → notation data",
    description: "Compose songs: structure, lyrics, chords, melody, arrangement notes, audio generation readiness.",
    category: "music",
    launched: false,

    suggestedStage: "Spark",
    supportedStages: ["Spark", "Building", "Polishing"],

    intake: [],
    generatesDirections: true,
    directionsCount: 3,
    scoringDimensions: [],
    outputTypes: ["json", "markdown", "media"],
    realOutputDescription: "Song structure, lyrics, chord progression, melody/notation, arrangement plan, demo data.",
    specialties: [],
    adapters: [],
    technical: false,
    requiresApproval: true,
  },

  {
    id: "fashion",
    name: "Fashion Engine",
    emoji: "👗",
    tagline: "Design idea → patterns → tech-pack → production notes",
    description: "Create garments: style direction, colorways, tech-pack fields, mockups, production specifications.",
    category: "visual",
    launched: false,

    suggestedStage: "Spark",
    supportedStages: ["Spark", "Building", "Polishing"],

    intake: [],
    generatesDirections: true,
    directionsCount: 4,
    scoringDimensions: [],
    outputTypes: ["json", "design", "pdf"],
    realOutputDescription: "Design concepts, colorways, tech-pack, fabric/size specs, mockups.",
    specialties: [],
    adapters: [],
    technical: false,
    requiresApproval: true,
  },

  {
    id: "story",
    name: "Story Engine",
    emoji: "📖",
    tagline: "Plot idea → characters → full draft → revision plan",
    description: "Write stories: premise, characters, plot structure, full draft, revision passes, formatting.",
    category: "written",
    launched: false,

    suggestedStage: "Spark",
    supportedStages: ["Spark", "Building", "Polishing"],

    intake: [],
    generatesDirections: true,
    directionsCount: 3,
    scoringDimensions: [],
    outputTypes: ["markdown", "pdf"],
    realOutputDescription: "Story outline, character descriptions, full written draft, revision notes, manuscript export.",
    specialties: [],
    adapters: [],
    technical: false,
    requiresApproval: true,
  },

  {
    id: "game",
    name: "Game Engine",
    emoji: "🎮",
    tagline: "Doku world → live preview → real deploy to OpenDoku.com",
    description: "Re-theme a proven game template into a new world, play it in the studio, and publish it as a live production app. OpenDoku is the first platform mode; more platforms plug in via the same mode registry.",
    category: "interactive",
    launched: true, // Activated with the OpenDoku mode + Sum-Mine template (MineDoku).

    suggestedStage: "Building",
    supportedStages: ["Building", "Testing", "Launching"],

    intake: [],
    generatesDirections: false,
    directionsCount: 0,
    scoringDimensions: [],
    outputTypes: ["code", "json"],
    realOutputDescription: "A complete playable game (single-file HTML + PWA manifest) committed and pushed to the opendoku repo — live at opendoku.com/<slug>/ after Vercel deploys.",
    specialties: [],
    previewComponent: "GameStudio",
    adapters: ["opendoku"],
    requiredAdapters: ["opendoku"],
    technical: true,
    requiresApproval: true,
  },
];

// ============================================================================
// REGISTRY QUERIES
// ============================================================================

export function getEngineDescriptor(engineId: string): CreationEngineDescriptor | undefined {
  return ENGINE_REGISTRY.find((e) => e.id === engineId);
}

export function getLaunchedEngines(): CreationEngineDescriptor[] {
  return ENGINE_REGISTRY.filter((e) => e.launched);
}

export function getEnginesByCategory(category: string): CreationEngineDescriptor[] {
  return ENGINE_REGISTRY.filter((e) => e.category === category);
}

export function canPublishTo(engineId: string, serviceId: string): boolean {
  const engine = getEngineDescriptor(engineId);
  return engine?.adapters.includes(serviceId) ?? false;
}
