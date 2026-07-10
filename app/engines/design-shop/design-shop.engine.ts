/**
 * Design Shop Engine
 *
 * Transform product ideas into design packages, scored transparently,
 * ready for Etsy or standalone export.
 *
 * Real output: Product concepts, design packages, Etsy listings, social launch kits.
 */

import type { CreationDirection, ScoringDimension } from "../shared/creation-engine.types";

// ============================================================================
// PRODUCT SEED CONCEPTS
// ============================================================================

export const SEED_PRODUCTS = [
  {
    name: "Family Game Night Mega Pack",
    description: "Printable card deck + board game + team challenge",
    customer: "Families with kids 8+",
    productType: "Printable / Digital",
    why: "Parents love ready-made game night ideas; kids love the competition.",
    themes: ["Family", "Games", "Entertainment"],
  },
  {
    name: "Road Trip Rescue Game Pack",
    description: "Travel-size games, car bingo, conversation cards, activity sheets",
    customer: "Parents traveling with kids",
    productType: "Printable / Digital",
    why: "Long car rides need entertainment; this fills the gap with minimal pack weight.",
    themes: ["Family", "Travel", "Kids"],
  },
  {
    name: "Dad Joke Lunchbox Cards",
    description: "Set of jokes + witty comeback cards kids can share",
    customer: "Kids, teachers, parents",
    productType: "Card Deck",
    why: "Dad jokes are timeless; kids love having something funny to share.",
    themes: ["Funny", "Kids", "Gift"],
  },
  {
    name: "Kids vs Parents Challenge Cards",
    description: "Competitive game cards designed for mixed-age play",
    customer: "Families",
    productType: "Card Deck / Game",
    why: "Kids want to beat parents; this gives them a fair shot.",
    themes: ["Family", "Games", "Entertainment"],
  },
  {
    name: "30-Day Family Fitness Challenge",
    description: "Printable tracker + daily challenge cards with illustrations",
    customer: "Families trying to move more together",
    productType: "Printable / Digital",
    why: "Gamifying fitness keeps families motivated; makes movement fun.",
    themes: ["Fitness", "Family", "Health"],
  },
  {
    name: "Coach & Sports Parent Humor Mug Designs",
    description: "Funny mug designs for coaches and sports parents",
    customer: "Coaches, sports parents, gift buyers",
    productType: "Mug / Drinkware",
    why: "Coaches need coffee; funny merch is a gateway gift.",
    themes: ["Sports", "Funny", "Gift"],
  },
  {
    name: "Faith & Coffee Mug Designs",
    description: "Encouraging morning affirmations on mugs (funny + heartfelt)",
    customer: "People seeking daily encouragement, gift buyers",
    productType: "Mug / Drinkware",
    why: "Coffee mugs are daily use; pairing with encouragement creates habit connection.",
    themes: ["Faith", "Encouragement", "Gift"],
  },
  {
    name: "Funny Rest Day Fitness Designs",
    description: "Humorous t-shirt + sticker designs for people taking breaks",
    customer: "Fitness enthusiasts, gym-goers",
    productType: "T-Shirt / Sticker",
    why: "Fitness culture appreciates humor about recovery; self-deprecating edge.",
    themes: ["Fitness", "Funny", "Apparel"],
  },
  {
    name: "Dog Rescue Humor Stickers",
    description: "Cute + funny sticker sheets celebrating rescue dog chaos",
    customer: "Dog lovers, rescue advocates, gift buyers",
    productType: "Sticker Sheet",
    why: "Dog owners bond over shared 'why do we love them' humor.",
    themes: ["Dogs", "Funny", "Animals"],
  },
  {
    name: "Printable Scavenger Hunt Generator",
    description: "Customizable scavenger hunt templates (indoor, outdoor, holiday themes)",
    customer: "Parents, teachers, event planners",
    productType: "Printable / Digital",
    why: "Scavenger hunts keep kids engaged; customizable = reusable for years.",
    themes: ["Kids", "Games", "Education"],
  },
  {
    name: "Family Conversation Card Generator",
    description: "Question card sets for different scenarios (dinner, car, game nights)",
    customer: "Families wanting deeper connection",
    productType: "Card Deck",
    why: "Families often don't know how to start real conversations; cards break the ice.",
    themes: ["Family", "Relationships", "Games"],
  },
  {
    name: "Customizable Party Bingo Generator",
    description: "Bingo card templates for any party theme (baby shower, birthday, holiday)",
    customer: "Party planners, hosts",
    productType: "Printable / Digital",
    why: "Bingo keeps guests engaged; customizable means one tool for many events.",
    themes: ["Parties", "Games", "Entertainment"],
  },
  {
    name: "Printable Target & Accuracy Games",
    description: "DIY targets, scoring sheets, and challenge sets (bean bag toss, darts, cornhole guide)",
    customer: "Families, coaches, people playing in yards",
    productType: "Printable / Digital",
    why: "Backyard games need targets; printable = no special equipment.",
    themes: ["Games", "Sports", "Family"],
  },
  {
    name: "Indoor Rainy-Day Competition Pack",
    description: "Games, challenges, and scoresheets for when kids are stuck inside",
    customer: "Parents with energetic kids",
    productType: "Printable / Digital",
    why: "Rainy days drive parents crazy; this channels energy into fun.",
    themes: ["Kids", "Games", "Entertainment"],
  },
  {
    name: "Holiday Family Challenge Packs",
    description: "Seasonal game collections (Thanksgiving games, Christmas challenges, New Year goals)",
    customer: "Families gathering for holidays",
    productType: "Printable / Digital / Bundle",
    why: "Holidays are when families gather; adds structure and fun.",
    themes: ["Holidays", "Family", "Games"],
  },
  {
    name: "Encouragement & Prayer Card Sets",
    description: "Daily encouragement or prayer prompt cards (faith-forward but accessible)",
    customer: "People seeking daily reflection, gift buyers",
    productType: "Card Deck",
    why: "Daily practices need reminders; cards make them portable and giftable.",
    themes: ["Faith", "Encouragement", "Reflection"],
  },
  {
    name: "Teacher, Coach, & Parent Gift Designs",
    description: "Funny, heartfelt designs for people in teaching/coaching roles",
    customer: "Gift buyers, appreciation givers",
    productType: "T-Shirt / Mug / Tote",
    why: "Teachers/coaches need appreciation; this gives it a fun, giftable form.",
    themes: ["Gift", "Appreciation", "Education"],
  },
  {
    name: "Office Humor Stickers & Prints",
    description: "Workplace-friendly funny designs (meetings, coffee, deadlines)",
    customer: "Office workers, remote workers, gift buyers",
    productType: "Sticker / Wall Print",
    why: "Office humor is universal; stickers personalize boring desks.",
    themes: ["Funny", "Office", "Workplace"],
  },
  {
    name: "DIY Family Tournament Bracket Kit",
    description: "Printable tournament brackets, rules, and scoresheets for any competition",
    customer: "Families, game nights, office events",
    productType: "Printable / Digital",
    why: "Tournaments create drama and investment; brackets make it organized.",
    themes: ["Games", "Sports", "Family"],
  },
  {
    name: "Personalized Desk & Focus Cards",
    description: "Motivational cards to customize a workspace (funny focus, goal tracking, thought prompts)",
    customer: "Students, remote workers, anyone with a desk",
    productType: "Card / Printable",
    why: "Desks are stressful; personalized motivation + humor makes the space feel intentional.",
    themes: ["Productivity", "Motivation", "Workspace"],
  },
];

// ============================================================================
// DIRECTIONS GENERATOR
// ============================================================================

/**
 * Generate 5 distinct product directions from a spark idea.
 * Each direction interprets the spark differently.
 */
export async function generateProductDirections(
  idea: string,
  customer: string,
  productType: string,
  theme: string,
): Promise<CreationDirection[]> {
  // Deterministic seeding based on input.
  const seed = `${idea}|${customer}|${productType}`.length;

  const variations = [
    {
      label: "Core Concept",
      description: `The straightforward version: ${idea} as a ${productType.toLowerCase()} for ${customer}.`,
      reasoning: "Start simple. If people want it, this is the MVP.",
    },
    {
      label: "Humorous Take",
      description: `${idea}, but funny. Play the idea for laughs — self-deprecating or absurd angle.`,
      reasoning: "Humor sells and shares; if the core is funny, lean in.",
    },
    {
      label: "Educational Angle",
      description: `${idea}, but it teaches something useful (skills, facts, strategy). Make learning fun.`,
      reasoning: "Educational + fun bridges parental buy-in and kid engagement.",
    },
    {
      label: "Seasonal / Timeliness",
      description: `${idea}, but tied to a season, holiday, or moment (back-to-school, New Year, summer). Limited but timely.`,
      reasoning: "Seasonal products spike at the right time; plan now, launch then.",
    },
    {
      label: "Bundle / Collection",
      description: `Instead of one product, create a collection: ${idea} + complementary ideas in one package.`,
      reasoning: "Bundles increase average order value and create upsell momentum.",
    },
  ];

  return variations.map((v, idx) => ({
    id: `direction-${idx}`,
    label: v.label,
    description: v.description,
    reasoning: v.reasoning,
    createdAt: new Date().toISOString(),
  }));
}

// ============================================================================
// DESIGN PACKAGE TEMPLATE
// ============================================================================

export interface DesignPackage {
  title: string;
  concept: string;
  customer: string;
  productType: string;
  theme?: string;
  productFormat: string;
  files: string[]; // e.g., ["design-front.pdf", "design-back.pdf", "print-specs.txt"]
  dimensions: string; // e.g., "8.5\" x 11\""
  printSpecs: string; // e.g., "300 DPI, CMYK, bleed 0.25\""
  colors: string[];
  fonts: string[];
  materials?: string; // For physical products
  bundleSuggestions: string[]; // Other products this could pair with
  accessibilityNotes: string;
  mockupRequirements: string[];
  originalCopy: string[]; // Phrases, taglines, jokes
  productionNotes: string;
}

export function createDesignPackageTemplate(
  direction: CreationDirection,
  answers: Record<string, string>,
): DesignPackage {
  const productType = answers.productType || "Printable";

  return {
    title: `${answers.name || "Untitled"} — ${direction.label}`,
    concept: direction.description,
    customer: answers.customer || "Gift buyer",
    productType,
    theme: answers.theme,
    productFormat: productType.toLowerCase(),
    files: [],
    dimensions: guessProductDimensions(productType),
    printSpecs: guessProductSpecs(productType),
    colors: [],
    fonts: [],
    materials: guessProductMaterials(productType),
    bundleSuggestions: [],
    accessibilityNotes: "Use readable fonts; high contrast for printables; clear instructions.",
    mockupRequirements: ["Front mockup on product", "Lifestyle image (in use)", "Flat lay / detail shot"],
    originalCopy: answers.spark ? [answers.spark] : [],
    productionNotes: "",
  };
}

function guessProductDimensions(productType: string): string {
  const map: Record<string, string> = {
    printable: '8.5" x 11" (or 11" x 17" for poster)',
    card: '3.5" x 5" (standard postcard) or 2.5" x 3.5" (business card)',
    sticker: "3\" x 3\" (typical sheet or individual)",
    "t-shirt": "Front placement: 10\" x 10\" to 12\" x 16\"",
    mug: "Wrap: 7.5\" x 3.75\" height",
    tote: "Front print area: 11\" x 14\"",
    "wall print": '8" x 10" or 11" x 14" (standard frames)',
  };

  for (const [key, value] of Object.entries(map)) {
    if (productType.toLowerCase().includes(key)) return value;
  }
  return "Custom (define based on product)";
}

function guessProductSpecs(productType: string): string {
  const map: Record<string, string> = {
    printable: "300 DPI, CMYK color, PDF or high-res PNG, bleed 0.25 inches",
    card: "300 DPI, CMYK, PDF or print-ready format, bleed included",
    sticker: "300 DPI, RGB or CMYK, PNG with transparency (stickers), or PDF",
    "t-shirt": "300 DPI, RGB, PNG or PDF, direct-to-garment or DTG-ready format",
    mug: "300 DPI, RGB, PNG with transparent background or template file",
  };

  for (const [key, value] of Object.entries(map)) {
    if (productType.toLowerCase().includes(key)) return value;
  }
  return "300 DPI, CMYK or RGB, PDF or print-ready image format";
}

function guessProductMaterials(productType: string): string {
  const map: Record<string, string> = {
    sticker: "Vinyl stickers, indoor/outdoor safe, waterproof",
    "t-shirt": "100% cotton or cotton blend, pre-shrunk, sizes XS-XXL",
    mug: "Ceramic or enamel, dishwasher safe, microwave safe",
    tote: "Canvas or cotton, reinforced handles, natural or dyed",
  };

  for (const [key, value] of Object.entries(map)) {
    if (productType.toLowerCase().includes(key)) return value;
  }
  return "Material specs TBD based on production vendor";
}

// ============================================================================
// ETSY LISTING GENERATOR
// ============================================================================

export interface EtsyListingDraft {
  title: string; // Max 140 chars
  description: string;
  tags: string[]; // Max 13
  category: string;
  price: number;
  quantity: number;
  processingDays: number;
  shippingProfile?: string;
  materials: string[];
  files: string[];
  thumbnail: string;
  socialCaption: string;
  videoOrReelConcept: string;
  ipChecklist: string[];
}

export function generateEtsyListingDraft(
  design: DesignPackage,
  answers: Record<string, string>,
): EtsyListingDraft {
  const productType = answers.productType || "Printable";
  const isDigital = productType.includes("Digital") || productType.includes("Printable");

  return {
    title: `${design.title.slice(0, 120)}`,
    description: `${design.concept}\n\nWhat you get:\n- ${design.files.join("\n- ")}\n\nPerfect for: ${design.customer}`,
    tags: generateEtsyTags(design, answers),
    category: guessEtsyCategory(productType),
    price: estimatePrice(productType),
    quantity: isDigital ? 1 : 10,
    processingDays: isDigital ? 0 : 3,
    materials: design.materials ? design.materials.split(", ") : [],
    files: design.files,
    thumbnail: "Create mockup showing product in use",
    socialCaption: `New: ${design.title}. Perfect for ${design.customer}. Link in bio.`,
    videoOrReelConcept: `Quick unboxing / walkthrough of ${design.title}`,
    ipChecklist: [
      "✓ No celebrity references",
      "✓ No copyrighted characters",
      "✓ No brand logos (unless authorized)",
      "✓ Original design / unique concept",
      "✓ No song lyrics (unless licensed)",
    ],
  };
}

function generateEtsyTags(design: DesignPackage, answers: Record<string, string>): string[] {
  const tags: string[] = [];

  // Core product type
  const productType = (answers.productType || "").toLowerCase();
  if (productType.includes("printable")) tags.push("printable", "digital download");
  if (productType.includes("card")) tags.push("cards", "greeting card");
  if (productType.includes("sticker")) tags.push("stickers", "vinyl stickers");
  if (productType.includes("shirt")) tags.push("t shirt", "apparel", "tee");
  if (productType.includes("mug")) tags.push("mug", "coffee mug", "gift");
  if (productType.includes("tote")) tags.push("tote bag", "canvas bag");

  // Theme
  if (answers.theme) {
    const theme = answers.theme.toLowerCase();
    if (theme.includes("funny")) tags.push("funny");
    if (theme.includes("gift")) tags.push("gift");
    if (theme.includes("family")) tags.push("family");
    if (theme.includes("faith")) tags.push("faith inspired");
  }

  // Customer audience
  if (design.customer.toLowerCase().includes("kids")) tags.push("kids", "children");
  if (design.customer.toLowerCase().includes("parent")) tags.push("parents");
  if (design.customer.toLowerCase().includes("teacher")) tags.push("teacher");
  if (design.customer.toLowerCase().includes("coach")) tags.push("sports");

  // Use case
  tags.push("unique gift");
  tags.push("party");

  return tags.slice(0, 13);
}

function guessEtsyCategory(productType: string): string {
  const map: Record<string, string> = {
    printable: "Digital Downloads",
    card: "Greeting Cards & Stationery",
    sticker: "Stickers",
    "t-shirt": "Apparel",
    shirt: "Apparel",
    mug: "Home & Living",
    drinkware: "Home & Living",
    tote: "Bags & Purses",
    "wall print": "Prints",
  };

  for (const [key, value] of Object.entries(map)) {
    if (productType.toLowerCase().includes(key)) return value;
  }
  return "Art & Collectibles";
}

function estimatePrice(productType: string): number {
  // Rough estimates; adjust based on production cost.
  const map: Record<string, number> = {
    printable: 5.99,
    card: 4.99,
    sticker: 3.99,
    "t-shirt": 18.99,
    mug: 12.99,
    tote: 16.99,
    "wall print": 14.99,
  };

  for (const [key, value] of Object.entries(map)) {
    if (productType.toLowerCase().includes(key)) return value;
  }
  return 9.99;
}
