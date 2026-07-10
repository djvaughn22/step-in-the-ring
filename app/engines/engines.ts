// StepInTheRing — engine registry + intake.
// Each engine asks a DIFFERENT set of situational questions and produces a
// materially different execution package. "Begin with the real situation,
// inspect what exists, don't assume, preserve working parts."

export type QuestionType = "text" | "textarea" | "choice";

export interface Question {
  key: string;
  label: string;
  help?: string;
  placeholder?: string;
  type: QuestionType;
  options?: string[];
  optional?: boolean;
}

export type BuildStage =
  | "Spark"
  | "Shaping"
  | "Planning"
  | "Building"
  | "Testing"
  | "Polishing"
  | "Launching"
  | "Growing"
  | "Repairing"
  | "Evolving";

export const STAGES: BuildStage[] = [
  "Spark", "Shaping", "Planning", "Building", "Testing",
  "Polishing", "Launching", "Growing", "Repairing", "Evolving",
];

export type Depth = "quick" | "full" | "deep";
export const DEPTH_LABELS: Record<Depth, string> = {
  quick: "Quick Start",
  full: "Full Build",
  deep: "Deep Build",
};

export type Destination = "claude-code" | "chatgpt" | "terminal" | "designer" | "developer" | "collaborator" | "self";
export const DESTINATION_LABELS: Record<Destination, string> = {
  "claude-code": "Claude Code",
  chatgpt: "ChatGPT",
  terminal: "Terminal",
  designer: "Designer",
  developer: "Developer",
  collaborator: "Contractor / collaborator",
  self: "Do it myself",
};

export interface Engine {
  id: string;
  name: string;
  emoji: string;
  tagline: string;
  blurb: string;
  technical: boolean; // default destination Claude Code, produces a repo prompt
  suggestedStage: BuildStage;
  intake: Question[];
  // Engine-specific output section titles (used by the generator + result page).
  specialties: string[];
}

// Shared situational questions reused across engines (DJ Way: real situation first).
const Q = {
  name: (): Question => ({ key: "name", label: "Project name", placeholder: "A working name is fine", type: "text" }),
  situation: (): Question => ({ key: "situation", label: "What's the real situation right now?", help: "Say it plainly — where things actually stand.", placeholder: "Where you are today.", type: "textarea" }),
  exists: (): Question => ({ key: "exists", label: "What already exists?", help: "Repo, site, doc, audience, nothing yet — be honest so we preserve what works.", placeholder: "e.g. a Next.js repo deployed on Vercel; or nothing yet.", type: "textarea" }),
  outcome: (): Question => ({ key: "outcome", label: "What outcome do you want from this cycle?", placeholder: "The result you want when this pass is done.", type: "textarea" }),
  who: (): Question => ({ key: "who", label: "Who is it for?", placeholder: "One specific person or group.", type: "text" }),
  constraint: (): Question => ({ key: "constraint", label: "Biggest constraint right now?", help: "Time, money, unknowns, skills, a deadline.", placeholder: "e.g. free tools only; ship this week.", type: "text" }),
  success: (): Question => ({ key: "success", label: "What would success look like?", placeholder: "How you'll know this cycle worked.", type: "textarea" }),
};

export const ENGINES: Engine[] = [
  {
    id: "idea",
    name: "Idea Engine",
    emoji: "💡",
    tagline: "Turn a rough idea into a testable concept.",
    blurb: "A spark you can't quite explain yet. We clarify it, find the strongest version, and decide the fastest real test.",
    technical: false,
    suggestedStage: "Spark",
    intake: [
      Q.name(),
      { key: "rough", label: "Say the idea however it comes out", help: "Messy is fine. We'll find the strong version.", placeholder: "The thing you keep thinking about.", type: "textarea" },
      Q.who(),
      { key: "why", label: "Why does it matter to them?", placeholder: "The real problem or moment it fits.", type: "textarea" },
      { key: "excites", label: "What part excites you most?", type: "text", optional: true },
      Q.constraint(),
    ],
    specialties: ["Clarified concept", "Strongest interpretation", "Simplest real test", "Reasons to pursue or pause", "Where this goes next (Build / Sell / Plan / iDontCry)"],
  },
  {
    id: "build",
    name: "Build Engine",
    emoji: "🛠️",
    tagline: "Turn a defined idea into a real first build.",
    blurb: "You know roughly what it is. We define the MVP, the architecture, and a detailed build prompt you can hand straight to Claude Code.",
    technical: true,
    suggestedStage: "Building",
    intake: [
      Q.name(),
      { key: "purpose", label: "In one sentence, what is it and what does it do?", placeholder: "User opens it, does X, gets Y.", type: "textarea" },
      Q.who(),
      Q.exists(),
      { key: "core", label: "The single most important thing it must do first", help: "The one core action. Everything else waits.", placeholder: "The one thing that would actually help someone.", type: "textarea" },
      { key: "stack", label: "Any stack or tools already in use?", type: "text", optional: true, placeholder: "e.g. Next.js + Tailwind on Vercel; or none yet." },
      Q.constraint(),
      Q.success(),
    ],
    specialties: ["Product definition", "Core user journey", "MVP scope", "Architecture & components", "Detailed Claude Code prompt", "Deployment path"],
  },
  {
    id: "sell",
    name: "Sell Engine",
    emoji: "💰",
    tagline: "Turn it into a real offer someone can buy.",
    blurb: "A product, service, or digital download. We define the customer, the offer, the price hypothesis, and the first real validation.",
    technical: false,
    suggestedStage: "Shaping",
    intake: [
      Q.name(),
      { key: "product", label: "What are you selling?", placeholder: "The thing they get.", type: "textarea" },
      { key: "customer", label: "Who exactly would pay for it?", placeholder: "The specific buyer with the problem.", type: "text" },
      { key: "problem", label: "What problem does it solve for them?", type: "textarea" },
      Q.exists(),
      { key: "channel", label: "Where would they find it?", type: "text", optional: true, placeholder: "e.g. a landing page, Etsy, Gumroad, in-person." },
      Q.constraint(),
    ],
    specialties: ["Customer & problem", "Offer & format", "Price hypothesis", "Sales-page requirements", "Delivery process", "First validation test"],
  },
  {
    id: "launch",
    name: "Launch Engine",
    emoji: "🚀",
    tagline: "Get a built thing ready for real people.",
    blurb: "It works — now it needs to face the public. We assess readiness, find blockers, and build a launch package with a first measurable result.",
    technical: true,
    suggestedStage: "Launching",
    intake: [
      Q.name(),
      { key: "what", label: "What are you launching?", placeholder: "The product/site/offer as it stands.", type: "textarea" },
      Q.exists(),
      { key: "audience", label: "Who's the first audience?", type: "text" },
      { key: "worried", label: "What are you most worried is not ready?", type: "textarea", optional: true },
      { key: "measure", label: "First result you want to measure", type: "text", placeholder: "e.g. 10 signups, 3 sales, 50 visits." },
    ],
    specialties: ["Readiness assessment", "Remaining blockers", "Production checks", "Launch message & channel", "Feedback loop", "First measurable result"],
  },
  {
    id: "fix",
    name: "Fix Engine",
    emoji: "🔧",
    tagline: "Repair something broken — safely.",
    blurb: "Something regressed, broke, or misleads. We inspect first, protect what works, and produce a careful repair prompt with regression checks.",
    technical: true,
    suggestedStage: "Repairing",
    intake: [
      Q.name(),
      { key: "symptom", label: "What's the symptom? What do you see?", placeholder: "Exactly what's wrong, and where.", type: "textarea" },
      { key: "journey", label: "Which user journey does it affect?", type: "text" },
      { key: "when", label: "When did it start / what changed recently?", type: "textarea", optional: true },
      Q.exists(),
      { key: "protect", label: "What must NOT change / must keep working?", help: "So we don't rebuild working parts.", placeholder: "The parts that are fine today.", type: "textarea" },
    ],
    specialties: ["Symptom & evidence", "Likely root cause", "Inspect-first plan", "Protected functionality", "Repair prompt", "Regression tests"],
  },
  {
    id: "grow",
    name: "Grow Engine",
    emoji: "📈",
    tagline: "Move one real number with the smallest test.",
    blurb: "It's live and working. We find the bottleneck, pick one growth hypothesis, and design the smallest experiment with a decision rule.",
    technical: false,
    suggestedStage: "Growing",
    intake: [
      Q.name(),
      { key: "evidence", label: "What's the current evidence? (numbers if any)", placeholder: "Traffic, signups, sales, feedback so far.", type: "textarea" },
      { key: "bottleneck", label: "Where do people drop off or stall?", type: "textarea" },
      { key: "guess", label: "Your best guess at what would move the needle", type: "text", optional: true },
      { key: "measure", label: "What number are you trying to move?", type: "text" },
      Q.constraint(),
    ],
    specialties: ["Current evidence", "The bottleneck", "Growth hypothesis", "Smallest experiment", "Measurement & decision rule", "Next experiment (only after evidence)"],
  },
  {
    id: "plan",
    name: "Plan Engine",
    emoji: "🗺️",
    tagline: "Organize a real-world (non-software) project.",
    blurb: "An event, campaign, build, or effort that isn't code. We turn it into phases, owners, milestones, and the next concrete action.",
    technical: false,
    suggestedStage: "Planning",
    intake: [
      Q.name(),
      { key: "outcome", label: "What's the outcome you're after?", type: "textarea" },
      { key: "situation", label: "Where does it stand today?", type: "textarea" },
      { key: "deadline", label: "Any deadline or key date?", type: "text", optional: true },
      { key: "people", label: "Who's involved / who owns what?", type: "textarea", optional: true },
      Q.constraint(),
    ],
    specialties: ["Outcome & current state", "Milestones", "Dependencies & owners", "Timeline", "Risks", "Immediate next action"],
  },
  {
    id: "etsy",
    name: "Etsy Engine",
    emoji: "🛍️",
    tagline: "Turn a product idea into a real Etsy listing and launch plan.",
    blurb: "A rough product concept. We vet it, package it for Etsy, and give you a complete execution pack: listing draft, social launch kit, and honest go/no-go recommendation.",
    technical: false,
    suggestedStage: "Shaping",
    intake: [
      Q.name(),
      { key: "idea", label: "Rough product idea", placeholder: "The thing you're thinking about selling.", type: "textarea" },
      { key: "brand", label: "Source brand", type: "choice", options: ["CrossHeartPray", "TheDJCares", "DontCloneMeTom", "iDontCry", "StepInTheRing", "Open Mirror", "Other"] },
      { key: "productType", label: "Product type", type: "choice", options: ["Printable / Digital", "Sticker / Decal", "T-shirt / Apparel", "Mug / Drinkware", "Hat / Accessory", "Card / Stationery", "Art Print", "Tote / Bag", "Undecided"] },
      { key: "buyer", label: "Intended buyer", placeholder: "Who would actually pay for this?", type: "text" },
      { key: "tone", label: "Tone", type: "choice", options: ["Funny", "Inspiring", "Thoughtful", "Playful", "Bold", "Gentle", "Mixed"] },
      { key: "format", label: "Format preference", type: "choice", options: ["Digital (no production)", "Print-on-Demand", "Handmade", "Undecided"] },
      { key: "concept", label: "Phrase or visual concept", placeholder: "One strong idea or phrase you're building around.", type: "text" },
      { key: "concern", label: "Major concern or risk", placeholder: "What worries you about this one?", type: "textarea", optional: true },
    ],
    specialties: ["Product decision & recommendation", "Etsy listing draft (title, description, tags, price hypothesis)", "Organic social launch pack (hooks, concepts, captions, hashtags)", "Open Mirror placement guidance", "Fulfillment & production notes", "Legal & trademark flags"],
  },
  {
    id: "design-shop",
    name: "Design Shop Engine",
    emoji: "🛒",
    tagline: "Product idea → design package → Etsy listing (with transparent scoring).",
    blurb: "Create original product concepts, explore 5 directions, score them transparently, design complete packages, and prepare Etsy listings. Real output: design packages, Etsy drafts, social launch kits, mockup specs.",
    technical: false,
    suggestedStage: "Spark",
    intake: [
      Q.name(),
      { key: "idea", label: "Rough product idea", placeholder: "The thing you're thinking about creating", type: "textarea" },
      { key: "theme", label: "Theme or inspiration (optional)", placeholder: "e.g., Faith, Family, Fitness, Dogs, Dads, Office Humor", type: "text", optional: true },
      { key: "customer", label: "Who would use / buy this?", placeholder: "The person with the problem or need", type: "text" },
      { key: "occasion", label: "Occasion or context (optional)", placeholder: "e.g., Gift, Holiday, Party, Game Night", type: "text", optional: true },
      { key: "productType", label: "Product type you're imagining", type: "choice", options: ["Printable / Digital", "Card Deck", "Game / Activity Pack", "Sticker Sheet", "T-Shirt / Apparel", "Mug / Drinkware", "Tote / Bag", "Wall Print / Art", "Journal / Planner", "Undecided / Mixed"] },
      { key: "spark", label: "The spark (joke, phrase, problem it solves)", placeholder: "One core idea or phrase driving this", type: "text" },
      { key: "constraint", label: "Biggest constraint right now?", placeholder: "Time, design skill, production cost, etc.", type: "text", optional: true },
    ],
    specialties: [
      "Product Spark & Clarification",
      "Possible Product Directions",
      "Scoring Dimensions & Matrix",
      "Recommended Direction",
      "Design Package Template",
      "Etsy Listing Draft",
      "Social Launch Kit",
      "Fulfillment Path",
      "IP & Legal Checklist",
    ],
  },
];

export const ENGINE_BY_ID = new Map(ENGINES.map((e) => [e.id, e]));
export function getEngine(id: string): Engine | undefined {
  return ENGINE_BY_ID.get(id);
}
