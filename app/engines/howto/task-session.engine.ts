/**
 * Task Session — How to Anything's default "help me do it" mode.
 *
 * The engine's original evidence-capture workflow (documenting a fix
 * already proven, for a YouTube package) is real and stays — but it is not
 * what a normal visitor means by "How to Anything." This is: say what
 * you're trying to do, get one concrete next step, say what happened, keep
 * going. Deterministic — no model call, nothing here claims to be AI.
 */

export type TaskDomain = "music" | "website" | "game" | "design" | "physical" | "generic";

function detectTool(goal: string): string | null {
  const g = goal.toLowerCase();
  if (g.includes("bandlab")) return "BandLab";
  if (g.includes("garageband")) return "GarageBand";
  if (g.includes("ableton")) return "Ableton";
  if (g.includes("fl studio")) return "FL Studio";
  if (g.includes("logic")) return "Logic";
  return null;
}

export function detectDomain(goal: string): TaskDomain {
  const g = goal.toLowerCase();
  if (/\bbeat\b|\bsong\b|\bmusic\b|\bmelody\b|bandlab|garageband|ableton|\btune\b/.test(g)) return "music";
  if (/\bwebsite\b|\bweb\s?page\b|\bapp\b\s|\bsite\b/.test(g)) return "website";
  if (/\bgame\b/.test(g)) return "game";
  if (/\blogo\b|\bdesign\b|\bposter\b|\bgraphic\b/.test(g)) return "design";
  if (/\breplace\b|\brepair\b|\bfix\b|\binstall\b|\bassemble\b|\bbuild a\b|\bwire\b|\bplumb\b|\bfaucet\b|\bfaucet\b|\bleak\b/.test(g)) return "physical";
  return "generic";
}

interface StepContent { title: string; detail: string; }

/** The concrete opener — real, tool-aware where a tool is named or a domain
 *  is recognized; an honest, still-useful meta step everywhere else. */
function openingStep(goal: string, domain: TaskDomain): StepContent {
  const tool = detectTool(goal);
  switch (domain) {
    case "music":
      return tool
        ? { title: `Open ${tool} and start a new project`, detail: `In ${tool}, create a new project and set the tempo to something comfortable like 90 BPM. That's the standard beginner starting point.` }
        : { title: "Open your music app and start a new project", detail: "Create a new project and set the tempo to something comfortable like 90 BPM. The Music Engine has a fuller guided flow if you want it." };
    case "website":
      return { title: "Decide the ONE thing the site needs to do first", detail: "Before picking a tool, name the single action a visitor takes. One page that does that one thing beats a half-built site with five pages." };
    case "game":
      return { title: "Decide what the player actually does", detail: "One repeated action, stated in one sentence. Everything else about the game builds on that single answer." };
    case "design":
      return { title: "Find one example you like the feel of", detail: "Before opening any tool, find one existing design (logo, poster, whatever) whose FEEL you want — simple, bold, playful. That becomes your reference point." };
    case "physical":
      return { title: "Find the exact model or part first", detail: "Search your exact model or part name plus \"how to\" or \"installation guide\" — brand-specific instructions beat generic ones for hardware. If water, gas, or power is involved, find and shut off the supply before touching anything." };
    default:
      return { title: "Find the exact source for your exact situation", detail: "Search for your specific version, model, or situation rather than the general topic — generic advice misses the one detail that matters for you." };
  }
}

/** The generic act-and-check loop every domain eventually falls into. */
function loopStep(round: number, domain: TaskDomain): StepContent {
  if (round % 2 === 1) {
    return { title: "Do the smallest reversible action, then stop", detail: "Don't do the whole thing at once. Do one small piece you could undo, then check what actually happened before continuing." };
  }
  return {
    title: "Check the result, then narrow down from there",
    detail: domain === "physical"
      ? "If it worked, move to the next small piece the same way. If not, that's useful information — it tells you exactly where to look next, not that the whole plan failed."
      : "If it worked, keep going the same way, one small piece at a time. If not, that narrows down exactly where to focus next.",
  };
}

export interface TaskSessionV1 {
  version: 1;
  id: string;
  goal: string;
  domain: TaskDomain;
  stepIndex: number;
  log: { stepIndex: number; note: string; at: string }[];
  createdAt: string;
  updatedAt: string;
  finishedAt: string | null;
}

let counter = 0;
export function taskUid(): string {
  counter += 1;
  return `${Date.now().toString(36)}-${counter.toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function startTask(goal: string, now?: string): TaskSessionV1 {
  const at = now ?? new Date().toISOString();
  return { version: 1, id: taskUid(), goal: goal.trim(), domain: detectDomain(goal), stepIndex: 0, log: [], createdAt: at, updatedAt: at, finishedAt: null };
}

export function currentStep(s: TaskSessionV1): StepContent & { copyText: string } {
  const content = s.stepIndex === 0 ? openingStep(s.goal, s.domain) : loopStep(s.stepIndex, s.domain);
  const lastNote = s.log[s.log.length - 1]?.note?.trim();
  const notePart = lastNote ? ` Last update: ${lastNote}${/[.!?]$/.test(lastNote) ? "" : "."}` : "";
  const copyText = `Help me with this: ${s.goal}. ${content.detail}${notePart} Give me only the next small step, and keep it beginner-friendly.`;
  return { ...content, copyText };
}

export function advance(s: TaskSessionV1, note: string, now?: string): TaskSessionV1 {
  const at = now ?? new Date().toISOString();
  return { ...s, stepIndex: s.stepIndex + 1, log: [...s.log, { stepIndex: s.stepIndex, note: note.trim(), at }], updatedAt: at };
}

export function finish(s: TaskSessionV1, now?: string): TaskSessionV1 {
  const at = now ?? new Date().toISOString();
  return { ...s, finishedAt: at, updatedAt: at };
}

const STUCK_TIPS: Record<TaskDomain, string> = {
  music: "The Music Engine has tool-specific recovery tips if you're stuck inside a music app.",
  website: "Try the Build Engine for a fuller guided path if this grows past one page.",
  game: "Try the Game Engine for help shaping the whole game, not just this step.",
  design: "Try the Design Shop for a fuller design path with real directions to choose from.",
  physical: "Search the exact error message, part number, or model — not the general task — and check the manufacturer's own site or manual first.",
  generic: "Break the step down further: what's the smallest piece of it you could try right now?",
};

export function stuckHelp(s: TaskSessionV1): string {
  return STUCK_TIPS[s.domain];
}

function str(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}
function num(v: unknown, fallback = 0): number {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

export function parseTaskSession(v: unknown): TaskSessionV1 | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  if (typeof o.id !== "string" || !o.id) return null;
  const goal = str(o.goal);
  const domains: TaskDomain[] = ["music", "website", "game", "design", "physical", "generic"];
  return {
    version: 1,
    id: o.id,
    goal,
    domain: domains.includes(o.domain as TaskDomain) ? (o.domain as TaskDomain) : detectDomain(goal),
    stepIndex: Math.max(0, num(o.stepIndex)),
    log: Array.isArray(o.log)
      ? o.log.flatMap((e): TaskSessionV1["log"] => {
          if (!e || typeof e !== "object") return [];
          const x = e as Record<string, unknown>;
          return [{ stepIndex: num(x.stepIndex), note: str(x.note), at: str(x.at, new Date().toISOString()) }];
        })
      : [],
    createdAt: str(o.createdAt, new Date().toISOString()),
    updatedAt: str(o.updatedAt, new Date().toISOString()),
    finishedAt: typeof o.finishedAt === "string" ? o.finishedAt : null,
  };
}
