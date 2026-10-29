// Reads a one-sentence product description — "a weekly chore board where
// parents assign chores, kids check them off, and everyone sees what is
// done" — into roles, actions and the thing being tracked. Shared by the
// Build and Idea engines so both talk about the visitor's actual product.

import { has, lowerFirst, plural, singular, stripEnd, upperFirst } from "./text";

export type ActionKind = "create" | "update" | "view" | "share" | "other";

export interface Story {
  /** Singular role ("parent"), or "everyone". */
  role: string;
  /** Verb phrase with pronouns resolved: "check chores off". */
  action: string;
  verb: string;
  kind: ActionKind;
  object: string;
}

export interface ProductRead {
  /** "weekly chore board" */
  product: string;
  /** Singular roles, in the order they appear. Never includes "everyone". */
  roles: string[];
  stories: Story[];
  /** The thing being tracked, singular: "chore". Empty when nothing was found. */
  entity: string;
  cadence: "daily" | "weekly" | "monthly" | "";
  /** More than one person acts on the same data. */
  shared: boolean;
  fields: { name: string; note: string }[];
}

const ROLE_WORDS = [
  "parents", "parent", "kids", "kid", "children", "child", "students", "student", "teachers", "teacher",
  "coaches", "coach", "players", "player", "users", "user", "customers", "customer", "members", "member",
  "families", "family", "friends", "friend", "volunteers", "volunteer", "admins", "admin", "staff",
  "employees", "employee", "managers", "manager", "visitors", "visitor", "owners", "owner", "buyers", "buyer",
  "sellers", "seller", "guests", "guest", "patients", "patient", "clients", "client", "neighbors", "neighbor",
  "readers", "reader", "fans", "fan", "teams", "team", "roommates", "roommate", "organizers", "organizer",
  "attendees", "attendee", "moms", "mom", "dads", "dad", "grandparents", "grandparent", "people", "everyone",
  "everybody", "anyone", "others", "i", "we", "you",
];
const EVERYONE = new Set(["everyone", "everybody", "anyone", "people", "we", "others"]);

const CREATE = /^(add|assign|create|post|write|log|record|upload|enter|schedule|book|list|submit|make|plan|set|save|suggest|request|propose)$/;
const UPDATE = /^(check|mark|complete|finish|tick|edit|update|rate|vote|approve|claim|pick|accept|move|cross|reorder|sign|rsvp|reply|answer|pay|confirm|cancel)$/;
const VIEW = /^(see|view|browse|track|find|search|read|watch|know|compare|follow|get|keep|look|review)$/;
const SHARE = /^(share|invite|send|message|notify|remind|comment)$/;

const STOP = new Set(["a", "an", "the", "their", "his", "her", "my", "our", "your", "its", "own", "new", "each", "every", "all", "any", "some", "what", "who", "which", "how", "is", "are", "was", "it", "them", "off", "up", "on", "in", "to", "for", "of", "with", "and", "or", "when", "that", "this", "these", "those", "done", "out", "back", "down", "over", "into", "from", "by", "at", "as", "s",
  // Quantities and time spans are never the thing being tracked: "post one recipe a week" is about recipes.
  "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "few", "couple", "many", "more", "most", "other", "others",
  "day", "days", "week", "weeks", "month", "months", "year", "years", "time", "times", "today", "tonight"]);

function verbBase(w: string): string {
  const v = w.toLowerCase();
  const irregular: Record<string, string> = { sees: "see", does: "do", goes: "go", has: "have" };
  if (irregular[v]) return irregular[v];
  if (/ies$/.test(v)) return v.replace(/ies$/, "y");
  if (/(ches|shes|xes)$/.test(v)) return v.replace(/es$/, "");
  if (/[^s]s$/.test(v)) return v.slice(0, -1);
  return v;
}

function kindOf(verb: string): ActionKind {
  if (CREATE.test(verb)) return "create";
  if (UPDATE.test(verb)) return "update";
  if (VIEW.test(verb)) return "view";
  if (SHARE.test(verb)) return "share";
  return "other";
}

function roleOf(word: string): string {
  const w = word.toLowerCase();
  if (EVERYONE.has(w)) return "everyone";
  if (w === "i" || w === "you") return "you";
  return singular(w);
}

/** Split "X where A, B, and C" into product "X" and clauses [A, B, C]. */
function splitSentence(text: string): { product: string; clauses: string[] } {
  const t = stripEnd(text.replace(/\s+/g, " "));
  const m = t.match(/^(.*?)\s+(?:where|that lets|that let|which lets|so that|so|that helps|to help|in which|for (?:\w+ )?to|that)\s+(.*)$/i);
  const productRaw = m ? m[1] : t;
  const rest = m ? m[2] : "";
  const forSplit = productRaw.match(/^(.*?)\s+for\s+(?:my|our|the|their)?\s*(\w+)\s*$/i);
  const product = (forSplit ? forSplit[1] : productRaw)
    .replace(/^(i want to (?:make|build|create)|build me|make me|i'm making|i am making|we want|an? app (?:for|called)?|it'?s|it is)\s+/i, "")
    .replace(/^(a|an|the|my|our)\s+/i, "")
    .trim();
  const clauses = rest
    .split(/\s*[,;]\s*(?:and\s+|then\s+)?|\s+and\s+(?=(?:\w+\s+){0,1}\w+s?\b)|\s+then\s+/i)
    .map((s) => s.trim())
    .filter((s) => s.split(" ").length >= 2);
  const audience = forSplit && ROLE_WORDS.includes(forSplit[2].toLowerCase()) ? forSplit[2] : "";
  return { product, clauses: clauses.length || !audience ? clauses : [`${audience} use it`] };
}

function readClause(clause: string, prevRole: string, prevObject: string): Story | null {
  const words = clause.replace(/[^\w\s'’-]/g, " ").split(/\s+/).filter(Boolean);
  if (words.length === 0) return null;
  let role = prevRole;
  let i = 0;
  const w0 = words[0].toLowerCase();
  if (ROLE_WORDS.includes(w0)) { role = roleOf(w0); i = 1; }
  else if (/^(the|their|all|both)$/.test(w0) && words[1] && ROLE_WORDS.includes(words[1].toLowerCase())) { role = roleOf(words[1]); i = 2; }
  // Auxiliaries: "can", "will", "get to".
  while (words[i] && /^(can|could|will|would|should|must|get|gets|then|also|just)$/i.test(words[i]) && words[i + 1]) i++;
  if (words[i]?.toLowerCase() === "to") i++;
  const rawVerb = words[i];
  if (!rawVerb) return null;
  const verb = verbBase(rawVerb);
  const restWords = words.slice(i + 1).map((w) => (/^(them|it)$/i.test(w) && prevObject ? plural(prevObject) : w));
  // The head of the first noun phrase: skip leading filler, then take the last
  // word of the run ("one dinner recipe a week" → "recipe").
  const isNoun = (w: string) => !/ed$/i.test(w) && !STOP.has(w.toLowerCase()) && !ROLE_WORDS.includes(w.toLowerCase()) && w.length > 2;
  const start = restWords.findIndex(isNoun);
  let end = start;
  while (start >= 0 && restWords[end + 1] && isNoun(restWords[end + 1])) end++;
  const object = start >= 0 ? restWords[end] : "";
  return { role, action: [verb, ...restWords].join(" "), verb, kind: kindOf(verb), object: object ? singular(object) : "" };
}

function fieldsFor(stories: Story[], cadence: ProductRead["cadence"], text: string): ProductRead["fields"] {
  const f: ProductRead["fields"] = [{ name: "id", note: "generated" }, { name: "title", note: "what it is, in a few words" }];
  const verbs = new Set(stories.map((s) => s.verb));
  const add = (name: string, note: string) => { if (!f.some((x) => x.name === name)) f.push({ name, note }); };
  if (verbs.has("assign")) add("assignedTo", "which person it belongs to");
  if (["check", "mark", "complete", "finish", "tick", "cross"].some((v) => verbs.has(v)) || has(text, /\bdone\b|\bcomplete/)) {
    add("done", "yes / no");
    add("doneAt", "when it was marked done");
  }
  if (cadence === "weekly") add("week", "the Monday the week starts on");
  if (cadence === "daily") add("date", "the day it's for");
  if (cadence === "monthly") add("month", "the month it's for");
  if (verbs.has("schedule") || verbs.has("book")) add("when", "date and time");
  if (verbs.has("rate") || verbs.has("review")) add("rating", "1–5");
  if (verbs.has("vote")) add("votes", "count");
  if (verbs.has("upload") || has(text, /\bphoto|picture|image/)) add("photo", "an image");
  if (verbs.has("comment")) add("comments", "list of short notes");
  if (verbs.has("log") || verbs.has("track") || verbs.has("record")) add("amount", "the number being tracked");
  if (has(text, /\bprice|cost|\$|pay|budget|expense/)) add("amount", "money, in dollars");
  if (verbs.has("claim") || verbs.has("pick")) add("claimedBy", "who took it");
  add("createdAt", "when it was added");
  return f;
}

export function readProduct(purpose: string, core = ""): ProductRead {
  const { product, clauses: purposeClauses } = splitSentence(purpose);
  const clauses = purposeClauses.length ? purposeClauses : splitSentence(`it where ${core}`).clauses;
  const stories: Story[] = [];
  let prevRole = "user";
  let prevObject = "";
  for (const c of clauses) {
    const s = readClause(c, prevRole, prevObject);
    if (!s) continue;
    stories.push(s);
    prevRole = s.role;
    if (s.object) prevObject = s.object;
  }
  const roles = [...new Set(stories.map((s) => s.role).filter((r) => r !== "everyone"))];
  const firstObject = stories.find((s) => s.object && s.kind !== "view")?.object ?? stories.find((s) => s.object)?.object ?? "";
  // Fall back to the last noun of the product name ("chore board" → "chore").
  const productNoun = product.split(" ").filter((w) => !/^(weekly|daily|monthly|simple|little|small|shared|family|online|digital|app|board|site|website|tracker|list|chart|tool|page|dashboard|planner|calendar|log|sheet|journal|hub|portal|system)$/i.test(w)).pop() ?? "";
  const entity = firstObject || singular(productNoun || "item");
  const text = `${purpose} ${core}`;
  const cadence: ProductRead["cadence"] = has(text, /\bweekly|each week|every week|this week|per week/) ? "weekly"
    : has(text, /\bdaily|each day|every day|today/) ? "daily" : has(text, /\bmonthly|each month|every month/) ? "monthly" : "";
  const shared = roles.length > 1 || stories.some((s) => s.role === "everyone" || s.kind === "share") || has(text, /\bshare|together|family|team|everyone|class\b/);
  return { product: product || "the app", roles, stories, entity, cadence, shared, fields: fieldsFor(stories, cadence, text) };
}

const SAMPLES: Record<string, string[]> = {
  chore: ["Empty the dishwasher", "Feed the dog", "Take out the trash"],
  task: ["Call the plumber", "Pick up groceries", "Pay the water bill"],
  recipe: ["Sheet-pan chicken", "Weeknight chili", "Banana bread"],
  book: ["The Hobbit", "Charlotte's Web", "Wonder"],
  workout: ["20-minute run", "Push-up ladder", "Stretch routine"],
  expense: ["Groceries", "Gas", "Field trip"],
  game: ["Saturday soccer", "Tuesday practice", "Away game"],
  event: ["Bake sale", "Movie night", "Car wash"],
  habit: ["Drink water", "Read 20 minutes", "Walk the dog"],
  meal: ["Tacos", "Pasta night", "Leftovers"],
  item: ["Item one", "Item two", "Item three"],
};

export function samplesFor(entity: string): string[] {
  return SAMPLES[entity] ?? [`${upperFirst(entity)} one`, `${upperFirst(entity)} two`, `${upperFirst(entity)} three`];
}

export function samplePerson(role: string, i = 0): string {
  const names: Record<string, string[]> = {
    kid: ["Sam", "Maya"], child: ["Sam", "Maya"], student: ["Jordan", "Priya"], parent: ["Alex"], teacher: ["Ms. Rivera"],
    player: ["Jordan", "Priya"], coach: ["Coach Lee"], member: ["Jordan", "Priya"], volunteer: ["Pat", "Robin"],
  };
  return (names[role] ?? ["Jordan", "Priya"])[i] ?? `${upperFirst(role)} ${i + 1}`;
}

export function roleLabel(role: string): string {
  return role === "everyone" ? "Everyone" : role === "you" ? "You" : upperFirst(role);
}

/** "parents assign chores" style story line. */
export function storyLine(s: Story): string {
  const who = s.role === "everyone" ? "Everyone can" : s.role === "you" ? "You can" : `A ${s.role} can`;
  return `${who} ${lowerFirst(s.action)}.`;
}
