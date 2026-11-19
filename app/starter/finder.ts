// The example finder: "What kind of work do you do?" → the closest examples.
//
// Plain scoring over each example's name, keywords and one-line blurb. It runs
// in the visitor's browser only. What they type is never stored, sent,
// counted or put in a URL.

export interface Findable {
  slug: string;
  name: string;
  group: string;
  blurb: string;
  keywords: string[];
}

/** Lower case, no accents, no punctuation, single spaces. */
export function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

// Words that say nothing about the kind of work.
const STOP = new Set([
  "a", "an", "and", "the", "or", "for", "of", "to", "in", "on", "at", "with", "by", "from",
  "i", "im", "we", "my", "our", "me", "us", "do", "run", "own", "have", "make", "need", "want", "am", "is", "are",
  "business", "businesses", "company", "website", "websites", "site", "page", "web", "online", "small", "local", "new",
]);

/** A rough stem, enough for "cakes" → "cake", "cleaning" → "clean", "bakeries" → "bakery". */
export function stem(t: string): string {
  if (t.length > 4 && t.endsWith("ies")) return `${t.slice(0, -3)}y`;
  if (t.length > 5 && t.endsWith("ing")) return t.slice(0, -3);
  if (t.length > 4 && /(?:ches|shes|xes|sses)$/.test(t)) return t.slice(0, -2);
  if (t.length > 3 && t.endsWith("s") && !t.endsWith("ss")) return t.slice(0, -1);
  return t;
}

function tokens(s: string): string[] {
  return normalize(s)
    .split(" ")
    .filter((t) => t.length >= 2 && !STOP.has(t));
}

/** How well one example fits what the visitor typed. 0 means not at all. */
export function scoreExample(e: Findable, query: string): number {
  const q = tokens(query).join(" ");
  if (!q) return 0;
  const name = normalize(e.name);
  const keys = e.keywords.map(normalize);
  let score = 0;

  // The whole phrase first: "dog walking", "wedding dj", "piano lessons".
  if (name === q) score += 100;
  else if (q.length >= 3 && (name.includes(q) || (name.length >= 4 && q.includes(name)))) score += 40;
  let phrase = 0;
  for (const k of keys) {
    if (k === q) phrase = Math.max(phrase, 60);
    else if (q.length >= 3 && k.includes(q)) phrase = Math.max(phrase, 35);
    else if (k.length >= 4 && ` ${q} `.includes(` ${k} `)) phrase = Math.max(phrase, 30);
  }
  score += phrase;

  // Then each word on its own.
  const keyWords = keys.flatMap((k) => k.split(" "));
  const nameWords = name.split(" ");
  const blurb = normalize(e.blurb);
  for (const raw of q.split(" ")) {
    const t = stem(raw);
    if (t.length < 2) continue;
    let best = 0;
    for (const w of keyWords) {
      const sw = stem(w);
      if (sw === t) best = Math.max(best, 10);
      else if (t.length >= 3 && sw.startsWith(t)) best = Math.max(best, 8);
      else if (t.length >= 4 && sw.includes(t)) best = Math.max(best, 5);
    }
    for (const w of nameWords) {
      const sw = stem(w);
      if (sw === t) best = Math.max(best, 8);
      else if (t.length >= 3 && sw.startsWith(t)) best = Math.max(best, 6);
    }
    if (!best && t.length >= 4 && blurb.includes(t)) best = 2;
    score += best;
  }
  return score;
}

/**
 * The examples to show: those in the chosen group (or all), and when there's a
 * query, only the ones that match it, best first. Ties keep the page order.
 */
export function findExamples<T extends Findable>(list: T[], query: string, group = ""): T[] {
  const inGroup = group ? list.filter((e) => e.group === group) : list;
  if (!tokens(query).length) return inGroup;
  return inGroup
    .map((e, i) => ({ e, i, s: scoreExample(e, query) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s || a.i - b.i)
    .map((x) => x.e);
}
