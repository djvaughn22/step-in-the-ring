// ONE-LINE EXPLAINER — pure logic, no network, no AI.
//
// Four short answers (what it is, who it's for, what it helps them do, and
// optionally the name) become the words people see first: a page title, a
// one-sentence description, and a message to send with the link. Every
// output is assembled from the person's own words — nothing is invented, and
// there are no hype words to fall back on.

export interface ExplainerInput {
  name: string;
  what: string;
  who: string;
  helps: string;
}

export const EMPTY_EXPLAINER: ExplainerInput = { name: "", what: "", who: "", helps: "" };

/** Where search results and link previews usually start cutting text off. */
export const TITLE_LIMIT = 60;
export const DESCRIPTION_LIMIT = 160;

const tidy = (s: string) => s.replace(/\s+/g, " ").trim().replace(/[.!]+$/, "");

/** Drop a leading article so "a sign-up page" reads right after "is". */
function bare(s: string): string {
  return tidy(s).replace(/^(a|an|the)\s+/i, "");
}

/** "a"/"an" for a phrase, by its first letter. Good enough for plain words. */
function article(s: string): string {
  return /^[aeiou]/i.test(s) ? "an" : "a";
}

/**
 * The verb phrase in third person, to follow "that" or "It":
 *   "swap plants" → "swaps plants", "to fix bikes" → "fixes bikes",
 *   "help kids read" / "helps kids read" → "helps kids read".
 */
function thirdPerson(verbPhrase: string): string {
  const v = tidy(verbPhrase).replace(/^to\s+/i, "");
  if (!v) return "";
  const help = v.match(/^helps?\s+(.*)$/i);
  if (help) return `helps ${help[1]}`;
  const [first, ...rest] = v.split(" ");
  const lower = first.toLowerCase();
  let verb = first;
  if (/(ss|sh|ch|x|z|o)$/.test(lower)) verb = `${first}es`;
  else if (/[^aeiou]y$/.test(lower)) verb = `${first.slice(0, -1)}ies`;
  else if (!/s$/.test(lower)) verb = `${first}s`;
  return [verb, ...rest].join(" ");
}

function capitalize(s: string): string {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}

export function isReady(i: ExplainerInput): boolean {
  return Boolean(tidy(i.what) && tidy(i.helps));
}

export interface Explainer {
  title: string;
  description: string;
  share: string;
}

export function explain(i: ExplainerInput): Explainer {
  const name = tidy(i.name);
  const what = bare(i.what);
  const who = tidy(i.who).replace(/^for\s+/i, "");
  const helps = tidy(i.helps).replace(/^to\s+/i, "");
  const forWho = who ? ` for ${who}` : "";

  const subject = name || capitalize(`${article(what)} ${what}`);
  const description = `${name ? `${name} is ${article(what)} ${what}` : subject}${forWho} that ${thirdPerson(helps)}.`;
  const title = name ? `${name}: ${capitalize(helps)}` : capitalize(`${what}${forWho}`);
  const share = `I made ${article(what)} ${what}${forWho}. It ${thirdPerson(helps)}. Would you try it and tell me what's confusing?`;

  return { title, description, share };
}

export interface LengthNote {
  field: "title" | "description";
  length: number;
  limit: number;
}

/** Plain length checks against the usual cut-off points. */
export function lengthNotes(e: Explainer): LengthNote[] {
  const notes: LengthNote[] = [];
  if (e.title.length > TITLE_LIMIT) notes.push({ field: "title", length: e.title.length, limit: TITLE_LIMIT });
  if (e.description.length > DESCRIPTION_LIMIT) {
    notes.push({ field: "description", length: e.description.length, limit: DESCRIPTION_LIMIT });
  }
  return notes;
}

export function explainerText(i: ExplainerInput): string {
  const e = explain(i);
  return [`Title: ${e.title}`, `Description: ${e.description}`, "", "Message to send with the link:", e.share].join("\n");
}

export function parseExplainerInput(raw: unknown): ExplainerInput | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const s = (v: unknown) => (typeof v === "string" ? v.slice(0, 160) : "");
  return { name: s(r.name), what: s(r.what), who: s(r.who), helps: s(r.helps) };
}
