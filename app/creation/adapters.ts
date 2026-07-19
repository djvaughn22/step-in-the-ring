// Engine adapters — every active engine's own way of reading a creation,
// planning it, and writing its builder prompt.
//
// Shared primitives (section assembly, the doctrine block, fact/assumption
// framing) are reused; the CONTENT of each adapter is its own. An adapter
// that only changed headings while returning the same plan would be the
// exact disease this file exists to cure. A game spec talks about loops and
// win states; a design spec talks about dimensions and deliverables; a story
// spec never mentions a database.

import type { CreationView } from "./record";
import { doctrineLines, type BuilderDefaults } from "./builder-defaults";
import { CREATION_TYPE_LABEL, SOFTWARE_VERDICT_LABEL, type CreationType } from "./types";

export interface SpecSection {
  title: string;
  lines: string[];
}

export interface EngineAdapter {
  engineId: string;
  supports: CreationType[];
  /** The engine's own reading + plan. Materially engine-specific. */
  spec(v: CreationView): SpecSection[];
  /** A finished, copyable builder prompt for this engine's deliverable. */
  prompt(v: CreationView, d: BuilderDefaults): string;
}

/* ── Shared primitives ─────────────────────────────────────────────────── */

const lc = (s: string) => (s ? s.charAt(0).toLowerCase() + s.slice(1) : s);
const bullets = (items: string[]) => items.filter(Boolean).map((s) => `- ${s}`);

/** The sections every prompt opens and closes with, whatever the engine. */
function promptShell(v: CreationView, d: BuilderDefaults, core: SpecSection[]): string {
  const i = v.interpretation;
  const sections: SpecSection[] = [
    {
      title: "Scope and permissions",
      lines:
        d.workMode === "existing-repo" || i.destination
          ? [
              `This work belongs to an existing project${i.destination ? ` (${i.destination.value})` : ""}. Inspect before editing; preserve unrelated work; protect existing routes and integrations.`,
            ]
          : ["Start clean. Nothing exists yet — do not assume access to any codebase or prior files."],
    },
    {
      title: "Original intent — the creator's exact words",
      lines: [
        `“${v.record.originalIdea}”`,
        "Serve this intent. Do not replace it with a nearby idea you like better.",
      ],
    },
    {
      title: "What is being made",
      lines: [
        `${CREATION_TYPE_LABEL[v.creationType]} — ${v.typeReason}.`,
        v.primaryUser ? `For: ${v.primaryUser}.` : "",
        v.beneficiary ? `Serving: ${v.beneficiary}.` : "",
        v.problem ? `The real need: ${v.problem}.` : "",
        `Smallest successful outcome: ${lc(v.smallestOutcome)}`,
        `Version-one promise: ${v.versionOnePromise}`,
      ].filter(Boolean),
    },
    ...core,
    ...(v.safetyConstraints.length
      ? [{ title: "Safety constraints (non-negotiable)", lines: bullets(v.safetyConstraints) }]
      : []),
    ...(v.record.exclusions.length || i.exclusions.length
      ? [
          {
            title: "Explicitly out of scope — do not build",
            lines: [
              ...bullets([...v.record.exclusions, ...i.exclusions.map((c) => c.value)]),
              "If one of these looks necessary, stop and say why instead of building it.",
            ],
          },
        ]
      : []),
    {
      title: "Assumptions made — correct them if wrong",
      lines: v.assumptions.length ? bullets(v.assumptions) : ["None recorded — everything above was stated."],
    },
    { title: "Working method", lines: bullets(doctrineLines(d)) },
  ];
  return sections
    .filter((s) => s.lines.length)
    .map((s) => `## ${s.title}\n${s.lines.join("\n")}`)
    .join("\n\n");
}

/* ── App / Build Engine ───────────────────────────────────────────────────
   An implementation-ready software brief: flows, states, data, acceptance. */

function appCore(v: CreationView): SpecSection[] {
  const i = v.interpretation;
  const behaviours = i.versionOne.map((c) => c.value);
  return [
    {
      title: "Primary flow",
      lines: [
        "One route does the whole job of version one. Additional screens wait.",
        ...bullets(behaviours),
      ],
    },
    {
      title: "States that must exist",
      lines: bullets([
        "Empty state: the very first visit explains itself — no dead screen.",
        "Working state: the core action, obvious and reachable in one or two taps.",
        "Result state: the outcome is visible and unmistakable.",
        "Error state: anything that can fail says what happened in plain words.",
        "Loading is instant or visibly in progress — never a blank pause.",
      ]),
    },
    {
      title: "Data",
      lines: bullets([
        i.assets.length
          ? `Ships with real content the creator already has: ${i.assets.map((a) => a.value).join("; ")}.`
          : "Define the smallest data the flow needs; hard-code or bundle it — no database in version one.",
        "Anything worth keeping persists locally (versioned key, safe parse). No accounts.",
      ]),
    },
    {
      title: "Acceptance criteria",
      lines: bullets([
        ...behaviours.map((b) => `${b} — works on a narrow phone and a desktop.`),
        `The success test: ${lc(v.smallestOutcome)}`,
        "Keyboard-only completion of the core flow works, with visible focus.",
        "Nothing on the out-of-scope list exists.",
      ]),
    },
  ];
}

/* ── Game (specification through the Build path; the doku Game Engine
      publishes only from the owner's machine and keeps its own studio) ── */

function gameCore(v: CreationView): SpecSection[] {
  const f = v.record.facts;
  const i = v.interpretation;
  const stated = i.versionOne.filter((c) => c.confidence === "stated").map((c) => c.value);
  return [
    {
      title: "The game, precisely",
      lines: bullets([
        `Player: ${f.player || v.primaryUser || "whoever picks it up — assume no instructions get read"}.`,
        `Player goal: ${f.goal || i.desiredResult?.value || "state one goal the player can hold in their head from the first second"}.`,
        `Core action: the ONE input the player repeats${stated.length ? ` — from their words: ${stated.join("; ")}` : ""}.`,
        "Core loop: act → immediate feedback → new situation → act again. If this loop isn't fun bare, nothing added later fixes it.",
        f.theme ? `Theme: ${f.theme}.` : "Theme serves the loop, never replaces it.",
        "Rules: few enough to explain on the board itself — the board always tells the player what to do next.",
      ]),
    },
    {
      title: "Win, loss, and feedback",
      lines: bullets([
        "Win state: the game SAYS you won, clearly, and offers the next round.",
        "Loss/stuck state: the player always knows why, and retrying is one tap.",
        "Every action gets instant feedback — silence is a bug.",
        "A session fits the time the player actually has; one round is minutes, not hours.",
      ]),
    },
    {
      title: "Smallest playable proof",
      lines: bullets([
        "One level/round, fully playable start → win, before ANY menu, progression, or settings work.",
        "Play-test acceptance: someone who didn't build it finishes a round without being told how.",
        "Mobile-first: thumb targets, touch-action manipulation, nothing essential below the fold.",
        "Respect reduced motion; the game remains playable with animations minimised.",
      ]),
    },
    {
      title: "Do not add in version one",
      lines: bullets([
        "Accounts, currencies, stores, achievements, multiplayer, leaderboards, social systems.",
        "Menus beyond play/again. Progression only if a single round already proves fun.",
      ]),
    },
  ];
}

/* ── Design Shop ──────────────────────────────────────────────────────────
   The deliverable is a design package + listing draft — never a web app. */

function designCore(v: CreationView): SpecSection[] {
  const f = v.record.facts;
  const a = v.record.answers;
  return [
    {
      title: "The product",
      lines: bullets([
        `Product type: ${a.productType || f.productType || "decide from the idea — smallest producible format first"}.`,
        `Buyer / recipient: ${a.customer || f.audience || v.primaryUser || "one specific buyer — decide before designing"}.`,
        `Occasion or use: ${a.occasion || "everyday use unless the idea says otherwise"}.`,
        `The value: ${v.problem ? lc(v.problem) : "why someone picks THIS up — name it in one sentence"}.`,
        (a.spark || f.spark) ? `The spark: ${a.spark || f.spark}.` : "",
      ].filter(Boolean)),
    },
    {
      title: "Design requirements",
      lines: bullets([
        "Visual direction: one clear direction (colours, type feel, mood) stated before any artwork.",
        "Required text: every word that appears on the product, finalised and proofread.",
        "Dimensions & format: exact pixel/print dimensions for the product type, print-ready (300 DPI, bleed if physical).",
        "Personalisation: state what is fixed and what (if anything) the buyer customises.",
        "IP check: no celebrity names, brand marks, or copyrighted characters — original phrases only.",
      ]),
    },
    {
      title: "Deliverables",
      lines: bullets([
        "The finished design file(s) at production dimensions.",
        "One realistic mockup image showing it in use.",
        "Listing metadata draft: title, description, tags — written for the buyer, not the algorithm.",
        `First test: ${v.software.nonSoftwareTest ?? "one finished listing in front of one real buyer"}.`,
      ]),
    },
  ];
}

/* ── Sell ── */
function sellCore(v: CreationView): SpecSection[] {
  const a = v.record.answers;
  return [
    {
      title: "The offer",
      lines: bullets([
        `What they get: ${a.product || v.versionOnePromise}`,
        `Who pays: ${a.customer || v.primaryUser || "one specific buyer with the problem — name them first"}.`,
        `The problem it solves for them: ${a.problem || v.problem || "state it in their words, not yours"}.`,
        "Format and delivery: exactly what arrives, how, and when.",
        "Price hypothesis: one number with one sentence of reasoning — to be tested, not defended.",
      ]),
    },
    {
      title: "First validation",
      lines: bullets([
        `The smallest test: ${v.software.nonSoftwareTest ?? "put the offer in front of one real buyer and ask for a real yes/no"}.`,
        "A real yes means money or a firm commitment — kind words don't count.",
        "Decide in advance what result kills the idea and what result doubles down.",
      ]),
    },
  ];
}

/* ── Launch ── */
function launchCore(v: CreationView): SpecSection[] {
  const a = v.record.answers;
  return [
    {
      title: "Readiness, honestly",
      lines: bullets([
        `What's launching: ${a.what || v.versionOnePromise}`,
        `First audience: ${a.audience || v.primaryUser || "the real people who see it first"}.`,
        a.worried ? `The stated weak spot — attack this first: ${a.worried}.` : "List the three most likely embarrassments and fix only those.",
        "Only launch-blocking fixes. Polish that doesn't stop a launch waits.",
      ]),
    },
    {
      title: "The launch itself",
      lines: bullets([
        "Production checks: the live URL loads, on a phone, logged out, from a clean browser.",
        `One measurable first result: ${a.measure || "pick one number and a date"}.`,
        "The message: one honest sentence about what it is and who it's for — no hype.",
        "A feedback path: one easy way for a real user to tell you what broke.",
      ]),
    },
  ];
}

/* ── Fix ── */
function fixCore(v: CreationView): SpecSection[] {
  const a = v.record.answers;
  const i = v.interpretation;
  return [
    {
      title: "Inspect before editing",
      lines: bullets([
        `The symptom: ${a.symptom || v.record.originalIdea}`,
        a.when ? `When it started / what changed: ${a.when}.` : "Find when it last worked — git history before guesswork.",
        "Reproduce it first. A fix for an unreproduced bug is a guess.",
        `Protected: ${a.protect || (i.preserve.length ? i.preserve.join("; ") : "everything that works today")}.`,
      ]),
    },
    {
      title: "The repair",
      lines: bullets([
        "Smallest safe correction — no refactors riding along.",
        `Fixed means: ${a.win || i.desiredResult?.value || "the exact broken journey works again, verified by doing it"}.`,
        "Add a regression check around the repaired path.",
      ]),
    },
  ];
}

/* ── Grow ── */
function growCore(v: CreationView): SpecSection[] {
  const a = v.record.answers;
  return [
    {
      title: "One experiment",
      lines: bullets([
        `The number to move: ${a.measure || "pick ONE number that matters this cycle"}.`,
        `Where people stall: ${a.bottleneck || v.problem || "find the drop-off before hypothesising"}.`,
        `Evidence so far: ${a.evidence || "honest guesses count, but label them as guesses"}.`,
        `Hypothesis: ${a.guess || "one sentence — 'if we change X, the number moves because Y'"}.`,
        "The smallest experiment that can prove it, a measurement, and a decision rule with a date.",
        "No second experiment until the first returns evidence.",
      ]),
    },
  ];
}

/* ── Plan ── */
function planCore(v: CreationView): SpecSection[] {
  const a = v.record.answers;
  return [
    {
      title: "The real-world plan",
      lines: bullets([
        `Outcome: ${a.outcome || v.versionOnePromise}`,
        `Who it serves and who's involved: ${a.people || v.primaryUser || "name the people, even if it's just you"}.`,
        `In the way right now: ${a.problem || v.problem || "the honest blocker this plan has to beat"}.`,
        a.deadline ? `Deadline: ${a.deadline}.` : "Set one date, even a soft one.",
        "2–4 phases, each with an owner and a checkpoint that ends it.",
        "The immediate next action — small enough to do today.",
      ]),
    },
    {
      title: "Not software",
      lines: [
        "This plan needs no app, no database, and no accounts. If tooling tempts you, a shared checklist is the ceiling for version one.",
      ],
    },
  ];
}

/* ── Music ── */
function musicCore(v: CreationView): SpecSection[] {
  const f = v.record.facts;
  return [
    {
      title: "The piece",
      lines: bullets([
        `Purpose / listener: ${v.primaryUser || "who it's for, or what moment it soundtracks"}.`,
        f.mode === "music" && f.brief ? `From their brief: ${f.brief}.` : `From their words: ${v.record.originalIdea.slice(0, 160)}.`,
        "Genre, mood, and a tempo range — pick before touching an instrument.",
        "Structure: the simplest complete form (e.g. intro–verse–chorus–verse–chorus–out).",
        "The hook: one repeatable musical or lyrical idea the piece is built around.",
      ]),
    },
    {
      title: "Deliverable",
      lines: bullets([
        "One exported audio file, start to end — rough is fine, finished is the point.",
        "Free tools only; the demo proves the song, not the production.",
        "Original work only — no borrowed melodies or lyrics.",
      ]),
    },
  ];
}

/* ── Story (no engine yet — the prompt path serves it honestly) ── */
function storyCore(v: CreationView): SpecSection[] {
  return [
    {
      title: "The story",
      lines: bullets([
        `Audience and format: ${v.primaryUser || "who reads it"} — decide length and form (short story, picture book, chapter one) first.`,
        "Premise in one sentence: a character with a want runs into what's in the way.",
        "Central character: what they want, what it costs, what flaw trips them.",
        "Structure: setup → turn → ending. Three beats before any prose.",
        "Emotional promise: name the feeling the reader should close it with.",
      ]),
    },
    {
      title: "Deliverable",
      lines: bullets([
        "One finished draft at the chosen length — finished beats good in draft one.",
        "One revision pass with fresh eyes before anyone else reads it.",
        "No routes, dashboards, databases, or accounts — this is a manuscript, not an app.",
      ]),
    },
  ];
}

/* ── Service ── */
function serviceCore(v: CreationView): SpecSection[] {
  return [
    {
      title: "The service",
      lines: bullets([
        `Customer: ${v.primaryUser || "one specific person who'd pay"}.`,
        `The promise: ${v.versionOnePromise}`,
        "Trigger → delivery steps → done: write the exact sequence of one delivery.",
        "Boundaries: what's included, what isn't, and what you'll refuse.",
        "Proof: what the customer holds at the end that shows it worked.",
      ]),
    },
    {
      title: "First delivery",
      lines: bullets([
        `${v.software.nonSoftwareTest ?? "Deliver it manually to one real customer before building anything."}`,
        "Repeatability check: could you do it again tomorrow without heroics?",
      ]),
    },
  ];
}

/* ── Idea Engine (interpretation + decision, not a build) ── */
function ideaCore(v: CreationView): SpecSection[] {
  const i = v.interpretation;
  return [
    {
      title: "Interpretation to challenge",
      lines: bullets([
        `Strongest current reading: ${i.summary}`,
        `The real problem or desire: ${v.problem ?? "not yet named — naming it is the work"}.`,
        `Meaningful gap: what do people do today instead, and why isn't that enough?`,
        `Distinctive angle: what makes this one worth existing?`,
        `Software necessity: ${SOFTWARE_VERDICT_LABEL[v.software.verdict]} — ${lc(v.software.reason)}`,
      ]),
    },
    {
      title: "The decision to produce",
      lines: bullets([
        "One chosen version of the idea, in one sentence.",
        `The simplest real test: ${v.software.nonSoftwareTest ?? "the smallest version a real person can react to this week"}.`,
        "Honest reasons to pursue or pause — both lists, written down.",
        "The next engine (or the builder prompt) it hands into.",
      ]),
    },
  ];
}

/* ── The registry ──────────────────────────────────────────────────────── */

function makeAdapter(
  engineId: string,
  supports: CreationType[],
  core: (v: CreationView) => SpecSection[],
): EngineAdapter {
  return {
    engineId,
    supports,
    spec: core,
    prompt: (v, d) => promptShell(v, d, core(v)),
  };
}

const ADAPTERS: EngineAdapter[] = [
  makeAdapter("idea", ["unknown", "app", "site", "tool", "list", "game", "content", "story"], ideaCore),
  makeAdapter("build", ["app", "site", "tool", "list"], appCore),
  makeAdapter("sell", ["physical-product", "digital-product", "design", "printable", "service"], sellCore),
  makeAdapter("launch", ["app", "site", "tool", "game"], launchCore),
  makeAdapter("fix", ["app", "site", "tool", "list", "game"], fixCore),
  makeAdapter("grow", ["app", "site", "content"], growCore),
  makeAdapter("plan", ["event-plan", "service"], planCore),
  makeAdapter("design-shop", ["design", "printable", "digital-product", "physical-product"], designCore),
  makeAdapter("music", ["music"], musicCore),
  // The doku Game Engine keeps its own studio; this adapter is how a game
  // CREATION gets specified and prompted (via the Build path or a handoff).
  makeAdapter("game", ["game"], gameCore),
];

const BY_ID = new Map(ADAPTERS.map((a) => [a.engineId, a]));

export function adapterFor(engineId: string): EngineAdapter | undefined {
  return BY_ID.get(engineId);
}

/** The adapter whose lane best fits the creation itself. */
export function adapterForType(type: CreationType): EngineAdapter {
  switch (type) {
    case "game": return BY_ID.get("game")!;
    case "design":
    case "printable":
    case "digital-product":
    case "physical-product": return BY_ID.get("design-shop")!;
    case "music": return BY_ID.get("music")!;
    case "story":
    case "content": return makeAdapter("story-prompt", ["story", "content"], storyCore);
    case "service": return makeAdapter("service-prompt", ["service"], serviceCore);
    case "event-plan": return BY_ID.get("plan")!;
    case "unknown": return BY_ID.get("idea")!;
    default: return BY_ID.get("build")!;
  }
}

/** Engine-fit check: can this engine serve this creation, and if not, which fits? */
export function engineFit(engineId: string, v: CreationView): { fits: boolean; better?: string; note?: string } {
  const a = BY_ID.get(engineId);
  if (!a) return { fits: true };
  // The Build Engine IS the visitor path for games (the doku Game Engine is
  // owner-only) — a game here is in the right place and gets the game spec.
  if (engineId === "build" && v.creationType === "game") return { fits: true };
  if (a.supports.includes(v.creationType) || v.creationType === "unknown") return { fits: true };
  const better = adapterForType(v.creationType);
  return {
    fits: false,
    better: better.engineId,
    note: `This can still be built here, but it reads as ${lc(CREATION_TYPE_LABEL[v.creationType])} — the ${better.engineId === "story-prompt" || better.engineId === "service-prompt" ? "builder prompt path" : `${better.engineId} lane`} fits its real shape better.`,
  };
}
