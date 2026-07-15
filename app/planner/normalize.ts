// Cleaning messy human input without changing what the person meant.
//
// Rules of the house: fix spelling and spacing, resolve back-references
// ("same", "what I said", "use that"), and refuse to pass empty, circular or
// meaningless text downstream. We never "improve" their intent — only the
// typing.

/** Typos common enough to fix on sight. Intent-preserving only. */
const SPELLING: [RegExp, string][] = [
  [/\bteh\b/gi, "the"],
  [/\bwaht\b/gi, "what"],
  [/\bdont\b/gi, "don't"],
  [/\bcant\b/gi, "can't"],
  [/\bwont\b/gi, "won't"],
  [/\bits a\b/gi, "it's a"],
  [/\brecieve\b/gi, "receive"],
  [/\bseperate\b/gi, "separate"],
  [/\bdefinately\b/gi, "definitely"],
  [/\bwebsight\b/gi, "website"],
  [/\bprolly\b/gi, "probably"],
  [/\bpuzzel\b/gi, "puzzle"],
  [/\bpicutres\b/gi, "pictures"],
  [/\bgunna\b/gi, "going to"],
  [/\bwanna\b/gi, "want to"],
  [/\bgonna\b/gi, "going to"],
  [/\bthier\b/gi, "their"],
  [/\balot\b/gi, "a lot"],
];

export function cleanText(input: string): string {
  let t = (input ?? "").replace(/\s+/g, " ").trim();
  if (!t) return "";
  for (const [re, to] of SPELLING) t = t.replace(re, to);
  // Space after sentence punctuation; collapse repeats.
  t = t.replace(/([.!?])([A-Za-z])/g, "$1 $2").replace(/\s+([.,!?;:])/g, "$1");
  // Capitalise the first letter, leave the rest of their voice alone.
  return t.charAt(0).toUpperCase() + t.slice(1);
}

/** Text that carries no information — never let it reach the plan. */
const MEANINGLESS = new Set([
  "", "n/a", "na", "none", "nothing", "idk", "i dont know", "i don't know",
  "dunno", "?", "??", "-", "--", ".", "no", "yes", "maybe", "stuff", "things",
  "whatever", "test", "asdf", "tbd", "same", "..",
]);

export function isMeaningful(text: string): boolean {
  const t = (text ?? "").trim().toLowerCase().replace(/[.!?]+$/, "");
  if (!t || MEANINGLESS.has(t)) return false;
  // A single character or a lone number tells us nothing.
  if (t.replace(/[^a-z0-9]/g, "").length < 2) return false;
  return true;
}

/** "Same as what I said" and friends — a pointer, not an answer. */
const BACKREF =
  /^(the )?(same|same thing|same as (above|before|that|what i said|the first one)|as (i )?said( (above|before))?|what i said|like i said|see above|use that|use what i said|that|ditto|refer to (that|above))\.?$/i;

const INLINE_BACKREF = /\b(same as (above|before|what i said)|what i said|like i said|use that)\b/i;

/**
 * Resolve a back-reference against what the person already told us.
 * `context` is ordered most-relevant-first (usually: the answer this field
 * refers to, then the original description).
 */
export function resolveReference(text: string, context: string[]): string {
  const t = (text ?? "").trim();
  if (!t) return "";
  const target = context.find((c) => c && c.trim() && isMeaningful(c));
  if (!target) return isMeaningful(t) ? t : "";
  if (BACKREF.test(t)) return target.trim();
  if (INLINE_BACKREF.test(t)) {
    // "Same as what I said, plus a dark mode" → keep the addition, resolve the pointer.
    const rest = t.replace(INLINE_BACKREF, "").replace(/^[\s,;.]*(and|plus|but|also)?[\s,;.]*/i, "").trim();
    return rest ? `${target.trim()} — ${rest}` : target.trim();
  }
  return t;
}

/** Split prose into sentences we can reason about one at a time. */
export function sentences(text: string): string[] {
  return (text ?? "")
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Split a list like "a, b, and c" / "a and b" into parts. */
export function listParts(text: string): string[] {
  return (text ?? "")
    .split(/,\s*(?:and\s+)?|\s+and\s+|\s*\/\s*|\n/i)
    .map((s) => s.trim().replace(/^(and|or)\s+/i, "").replace(/[.;]+$/, ""))
    .filter(Boolean);
}

const FILLER = /^(i want to|i want|i would like to|i'd like to|i need to|i need|i'm trying to|im trying to|i am trying to|can you|please|help me|make me|i was thinking|i have an idea for|my idea is|i think|basically|so|well|just|maybe|kinda|sort of|like)\s+/i;

/** Strip lead-in filler so the real subject is first. Applied repeatedly. */
export function stripFiller(text: string): string {
  let t = (text ?? "").trim();
  for (let i = 0; i < 6; i++) {
    const next = t.replace(FILLER, "").trim();
    if (next === t) break;
    t = next;
  }
  return t.replace(/^(build|make|create)\s+(me\s+)?/i, "");
}

const TITLE_STOP = new Set(["a", "an", "the", "of", "for", "and", "or", "to", "in", "on", "my", "with"]);

export function titleCase(text: string): string {
  return text
    .split(/\s+/)
    .filter(Boolean)
    .map((w, i) => {
      const lower = w.toLowerCase();
      if (i > 0 && TITLE_STOP.has(lower)) return lower;
      // Keep hyphenated words capitalised on both sides: dog-walking → Dog-Walking
      return lower
        .split("-")
        .map((p) => (p ? p.charAt(0).toUpperCase() + p.slice(1) : p))
        .join("-");
    })
    .join(" ");
}

/** Rough plural → singular, for building titles from nouns. */
export function singular(word: string): string {
  const w = word.toLowerCase();
  if (/(ss|us|is)$/.test(w)) return w;
  if (/ies$/.test(w)) return w.slice(0, -3) + "y";
  if (/(ches|shes|xes|zes|ses)$/.test(w)) return w.slice(0, -2);
  if (/s$/.test(w)) return w.slice(0, -1);
  return w;
}

/** Drop a duplicate paragraph that already appears elsewhere in the plan. */
export function dedupe(items: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of items) {
    const key = item.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

export function sentenceCase(text: string): string {
  const t = text.trim().replace(/[.]+$/, "");
  return t ? t.charAt(0).toUpperCase() + t.slice(1) : t;
}
