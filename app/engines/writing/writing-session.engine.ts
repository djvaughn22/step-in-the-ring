/**
 * Writing Session — the smallest public writing/story engine.
 *
 * "There's no Story Engine yet" was a dead end. This gives real, useful
 * writing material immediately from the idea itself, then helps shape it
 * one piece at a time. Deterministic templates — no model call, and nothing
 * here claims to be AI-generated. Character names are a Mad-Libs-style
 * placeholder, not an invented fact about the creator's idea; Change It /
 * the free-text rounds exist specifically so the creator corrects it.
 */

export type WritingType = "story" | "note" | "article" | "other";

export const WRITING_TYPE_LABELS: Record<WritingType, string> = {
  story: "Story",
  note: "Note / Message",
  article: "Article / Post",
  other: "Something else",
};

export function detectType(idea: string): WritingType {
  const g = idea.toLowerCase();
  if (/\bnote\b|\bmessage\b|\bletter\b|\bemail to\b|\btext to\b|\bcard for\b/.test(g)) return "note";
  if (/\barticle\b|\bblog\b|\bpost about\b|\bsocial post\b|\bnewsletter\b/.test(g)) return "article";
  if (/\bstory\b|\btale\b|\bbedtime\b|\bonce upon\b|\badventure of\b/.test(g)) return "story";
  return "other";
}

const ANIMAL_NAMES: Record<string, string[]> = {
  dog: ["Max", "Biscuit", "Duke"],
  cat: ["Whiskers", "Mochi", "Shadow"],
  robot: ["Bolt", "Circuit", "Pip"],
  dragon: ["Ember", "Sparkwing", "Cinder"],
  mouse: ["Pip", "Nibbles", "Whisper"],
  bear: ["Boots", "Honey", "Gruff"],
  rabbit: ["Clover", "Thumper", "Fern"],
  unicorn: ["Star", "Glimmer", "Dash"],
  alien: ["Zeb", "Nova", "Blip"],
  monster: ["Fuzz", "Grumble", "Sprout"],
  boy: ["Sam", "Theo", "Milo"],
  girl: ["Mia", "Nora", "Ivy"],
  kid: ["Sam", "Nora", "Milo"],
};

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

/** The part of the idea describing who/what it's about — "about a dog who
 *  thinks he's mayor" strips down to "a dog who thinks he's mayor". */
function extractSubject(idea: string): string {
  const m = idea.match(/\b(?:about|where|with)\s+(.+)/i);
  return (m ? m[1] : idea).replace(/[.?!]+\s*$/, "").trim();
}

interface Character {
  who: string; // "Max the dog" or "your main character"
  pronoun: string;
}

function extractCharacter(subject: string): Character {
  const animalMatch = subject.match(/\b(dog|cat|robot|dragon|mouse|bear|rabbit|unicorn|alien|monster|boy|girl|kid)\b/i);
  const animal = animalMatch ? animalMatch[1].toLowerCase() : null;
  const pronoun = /\bshe\b|\bher\b|\bgirl\b/i.test(subject) ? "she" : "he";
  if (!animal) return { who: "your main character", pronoun };
  const names = ANIMAL_NAMES[animal];
  const name = names[hash(subject) % names.length];
  return { who: `${name} the ${animal}`, pronoun };
}

/** The comedic "secretly believes they are X" setup — matches the required
 *  proof case exactly and a whole class of similar premises. */
function extractSecretRole(subject: string): string | null {
  const m = subject.match(/\bthinks?\s+(?:he'?s?|she'?s?|they'?re?|it'?s?)\s+(?:an?\s+|the\s+)?([a-z][a-z\s]{2,20})/i);
  return m ? m[1].trim().replace(/[.?!]+$/, "") : null;
}

export interface WritingSessionV1 {
  version: 1;
  id: string;
  idea: string;
  type: WritingType;
  showOpening: boolean;
  problem: string;
  ending: string;
  round: 0 | 1 | 2;
  finished: boolean;
  createdAt: string;
  updatedAt: string;
}

let counter = 0;
export function writingUid(): string {
  counter += 1;
  return `${Date.now().toString(36)}-${counter.toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function startWriting(idea: string, now?: string): WritingSessionV1 {
  const at = now ?? new Date().toISOString();
  return {
    version: 1, id: writingUid(), idea: idea.trim(), type: detectType(idea),
    showOpening: false, problem: "", ending: "", round: 0, finished: false,
    createdAt: at, updatedAt: at,
  };
}

export function setType(s: WritingSessionV1, type: WritingType, now?: string): WritingSessionV1 {
  return { ...s, type, updatedAt: now ?? new Date().toISOString() };
}

export function writeOpening(s: WritingSessionV1, now?: string): WritingSessionV1 {
  return { ...s, showOpening: true, updatedAt: now ?? new Date().toISOString() };
}

export function addProblem(s: WritingSessionV1, problem: string, now?: string): WritingSessionV1 {
  return { ...s, problem: problem.trim(), round: 1, updatedAt: now ?? new Date().toISOString() };
}

export function addEnding(s: WritingSessionV1, ending: string, now?: string): WritingSessionV1 {
  return { ...s, ending: ending.trim(), round: 2, updatedAt: now ?? new Date().toISOString() };
}

export function keepShape(s: WritingSessionV1, now?: string): WritingSessionV1 {
  return { ...s, finished: true, updatedAt: now ?? new Date().toISOString() };
}

export function changeIdea(s: WritingSessionV1, now?: string): WritingSessionV1 {
  return {
    ...s, showOpening: false, problem: "", ending: "", round: 0, finished: false,
    updatedAt: now ?? new Date().toISOString(),
  };
}

/** The next question worth asking, or null once kept or asked everything. */
export function nextPrompt(s: WritingSessionV1): { title: string; placeholder: string } | null {
  if (s.finished) return null;
  if (s.round === 0) return { title: "What's the problem or challenge in the story?", placeholder: "What goes wrong, or what does the character need to figure out?" };
  if (s.round === 1) return { title: "How does it end?", placeholder: "How the problem gets solved, or how the story wraps up." };
  return null;
}

/** The real, deterministic shape — never claims to be a finished piece. */
export function buildShape(s: WritingSessionV1): string {
  if (s.type !== "story") return buildGenericShape(s);
  const subject = extractSubject(s.idea);
  const { who, pronoun } = extractCharacter(subject);
  const role = extractSecretRole(subject);
  const lines = [
    "STORY SHAPE",
    role
      ? `${who} takes the "job" very seriously.`
      : `${who} is at the center of this one.`,
    role
      ? `Nobody else knows ${pronoun === "she" ? "she's" : "he's"} ${/^[aeiou]/i.test(role) ? "an" : "a"} ${role}.`
      : `Premise, in your words: ${s.idea}.`,
    role ? `Tonight, ${pronoun} decides something needs fixing — and it's ${pronoun === "she" ? "her" : "his"} job to fix it.` : `Tonight, something happens that changes things.`,
  ];
  if (s.problem) lines.push("", `The problem: ${s.problem}`);
  if (s.ending) lines.push(`How it ends: ${s.ending}`);
  if (s.showOpening) lines.push("", buildOpening(s));
  return lines.join("\n");
}

function buildGenericShape(s: WritingSessionV1): string {
  const label = s.type === "note" ? "NOTE SHAPE" : s.type === "article" ? "ARTICLE SHAPE" : "WRITING SHAPE";
  const lines = [
    label,
    `What you're writing: ${s.idea}`,
    s.type === "note"
      ? "Opening: say the real reason you're writing, in one plain sentence."
      : "Opening: the one sentence that tells the reader why this is worth their time.",
    s.type === "note"
      ? "Middle: the one thing you actually need to say — cut anything that isn't that."
      : "Middle: the 2-3 points that actually support the opening — no filler between them.",
    s.type === "note"
      ? "Close: what you want them to do or feel next."
      : "Close: the one takeaway you want a reader to leave with.",
  ];
  if (s.problem) lines.push("", `The problem or point: ${s.problem}`);
  if (s.ending) lines.push(`How it closes: ${s.ending}`);
  if (s.showOpening) lines.push("", buildOpening(s));
  return lines.join("\n");
}

/** A deterministic opening line built straight from the shape — no new
 *  input needed, which is why it's free to reveal. */
function buildOpening(s: WritingSessionV1): string {
  if (s.type !== "story") {
    return `OPENING LINE\n${s.idea.charAt(0).toUpperCase()}${s.idea.slice(1).replace(/[.?!]+$/, "")} — here's why that matters right now.`;
  }
  const subject = extractSubject(s.idea);
  const { who, pronoun } = extractCharacter(subject);
  const role = extractSecretRole(subject);
  const possessive = pronoun === "she" ? "she'd" : "he'd";
  return role
    ? `OPENING LINE\nEveryone on the street knew ${who} — they just had no idea ${possessive} been ${role} all along.`
    : `OPENING LINE\nThis is the story of ${who}, and the night everything changed: ${s.idea}.`;
}

/** A copy-ready writing brief — the same shape, framed for taking it further. */
export function buildBrief(s: WritingSessionV1): string {
  return `Help me keep writing this:\n\n${buildShape(s)}\n\nGive me the next paragraph or scene, in the same voice, one piece at a time.`;
}

function str(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

export function parseWritingSession(v: unknown): WritingSessionV1 | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  if (typeof o.id !== "string" || !o.id) return null;
  const idea = str(o.idea);
  const type: WritingType = ["story", "note", "article", "other"].includes(o.type as string) ? (o.type as WritingType) : detectType(idea);
  const round = ([0, 1, 2] as const).includes(o.round as never) ? (o.round as 0 | 1 | 2) : 0;
  return {
    version: 1,
    id: o.id,
    idea,
    type,
    showOpening: o.showOpening === true,
    problem: str(o.problem),
    ending: str(o.ending),
    round,
    finished: o.finished === true,
    createdAt: str(o.createdAt, new Date().toISOString()),
    updatedAt: str(o.updatedAt, new Date().toISOString()),
  };
}
