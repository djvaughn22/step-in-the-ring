// Signal extraction — pulling meaning out of a sentence a person actually typed.
//
// Every function here is pure and reads only the text. They answer narrow
// questions ("is there an existing product named here?", "did they grant
// permission to push?") so interpret.ts can make one decision at a time.

import { listParts, singular, stripFiller, titleCase } from "./normalize";
import type { Permissions, Shape } from "./types";

/* ── EXISTING PRODUCTS ─────────────────────────────────────────────────── */

/** Products we can name properly when someone mentions them. */
const KNOWN_PRODUCTS: Record<string, string> = {
  opendoku: "OpenDoku",
  snowdoku: "SnowDoku",
  slopedoku: "SlopeDoku",
  surfdoku: "SurfDoku",
  minedoku: "MineDoku",
  crossheartpray: "CrossHeartPray",
  idontcry: "iDontCry",
  thedjcares: "TheDJCares",
  stepinthering: "StepInTheRing",
  openmirror: "Open Mirror",
  openmirrorllc: "Open Mirror",
  watchednotwatched: "WatchedNotWatched",
  whatamiai: "WhatAmIAI",
  pleasebeready: "PleaseBeReady",
  dontclonemetom: "DontCloneMeTom",
  etsy: "Etsy",
};

const DOMAIN = /\b([a-z0-9][a-z0-9-]*)\.(com|net|org|io|app|dev|co|xyz|gg|shop|site)\b/i;

export function properName(rawName: string): string {
  const key = rawName.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (KNOWN_PRODUCTS[key]) return KNOWN_PRODUCTS[key];
  return titleCase(rawName.replace(/[-_]/g, " "));
}

export type DestinationHit = { name: string; stated: boolean };

/**
 * An existing product/site/repo this work belongs to.
 * A domain is a PRODUCT, never an audience — that mix-up is the single most
 * common way a plan goes wrong.
 */
export function findDestination(text: string): DestinationHit | null {
  const t = text ?? "";

  // "add it to X", "put it on X", "for my X site", "in the X app"
  const phrase =
    /\b(?:add(?:ed)?\s+(?:it|this|that)?\s*(?:to|onto|into)|put\s+(?:it|this)?\s*(?:on|in|into)|goes?\s+(?:on|in|into)|belongs?\s+(?:on|in)|part of|inside)\s+(?:my\s+|the\s+|our\s+)?([A-Za-z0-9][A-Za-z0-9 .\-]{1,40}?)(?=[.,;!?]|\s+(?:and|so|then|with|for|but)\b|$)/i;

  const m = t.match(phrase);
  if (m) {
    let name = m[1].trim().replace(/\s+(site|website|app|page|repo|product)$/i, "");
    const dm = name.match(DOMAIN);
    if (dm) name = dm[1];
    if (name && !/^(it|this|that|there|here)$/i.test(name)) {
      return { name: properName(name), stated: true };
    }
  }

  // A bare domain anywhere: opendoku.com
  const d = t.match(DOMAIN);
  if (d) return { name: properName(d[1]), stated: true };

  // A known product mentioned by name
  for (const [key, name] of Object.entries(KNOWN_PRODUCTS)) {
    if (key === "etsy") continue; // Etsy is a channel, handled by the sell path
    const re = new RegExp(`\\b${key}\\b`, "i");
    if (re.test(t.replace(/[^A-Za-z0-9\s]/g, ""))) return { name, stated: true };
  }
  return null;
}

/** True when the whole answer is really just a product/domain name. */
export function isJustAProduct(text: string): boolean {
  const t = (text ?? "").trim();
  if (!t) return false;
  if (DOMAIN.test(t) && t.split(/\s+/).length <= 3) return true;
  const key = t.toLowerCase().replace(/[^a-z0-9]/g, "");
  return !!KNOWN_PRODUCTS[key];
}

/* ── BUILDER PERMISSIONS ───────────────────────────────────────────────── */

const BUILD_NOW =
  /\b(build|make|do|create|write) (it|this|that|them)? ?now\b|\bjust (build|make|do) it\b|\bgo ahead and (build|make)\b|\bstart building\b|\bbuild it\b|\bbuild this\b|\bget (it )?(built|done)\b/i;
const COMMIT = /\bcommit\b|\bcommitted\b/i;
const PUSH = /\bpush\b|\bpushed\b/i;
const DEPLOY = /\bdeploy\b|\bship it( live)?\b|\bmake it live\b|\bgo live\b|\bpublish it\b/i;

/**
 * Permission words are instructions to the BUILDER. They must never end up in
 * the product description ("build it now" is not a feature).
 */
export function findPermissions(text: string): Permissions {
  const t = text ?? "";
  return {
    build: BUILD_NOW.test(t),
    commit: COMMIT.test(t),
    push: PUSH.test(t),
    deploy: DEPLOY.test(t),
  };
}

/**
 * "Add it to OpenDoku" tells us WHERE the work lands. It is not something the
 * product does, so it must not survive into version one as a feature.
 */
export function stripDestinationPhrases(text: string): string {
  return (text ?? "")
    .replace(
      /\b(?:and\s+)?(?:add(?:ed)?\s+(?:it|this|that)?\s*(?:to|onto|into)|put\s+(?:it|this)?\s*(?:on|in|into))\s+(?:my\s+|the\s+|our\s+)?[A-Za-z0-9][A-Za-z0-9 .\-]{1,40}?(?=[.,;!?]|\s+(?:and|so|then)\b|$)/gi,
      "",
    )
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([.,;!?])/g, "$1")
    .replace(/^[\s,;.]+/, "")
    .trim();
}

/** Strip builder instructions out of prose meant to describe the product. */
export function stripPermissionPhrases(text: string): string {
  return (text ?? "")
    .replace(
      /\b(and\s+)?(please\s+)?(go ahead and\s+)?(just\s+)?(build|make|do|create) (it|this|that)?\s*now\b/gi,
      "",
    )
    .replace(/\b(and\s+)?(then\s+)?(commit|push|deploy)( it| them| the code| to (main|prod|production))?\b/gi, "")
    .replace(/\b(and\s+)?(ship it live|make it live|go live|publish it)\b/gi, "")
    .replace(/\byou have (my )?permission( to.*)?/gi, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([.,;!?])/g, "$1")
    .replace(/[\s,;]+$/, "")
    .trim();
}

/* ── SHAPE ─────────────────────────────────────────────────────────────── */

const SHAPE_WORDS: [Shape, RegExp, number][] = [
  ["game", /\b(game|puzzle|play|player|arcade|score|level|quiz|trivia|maze|bingo|jigsaw|match)\b/i, 3],
  ["product", /\b(printable|workbook|planner|journal|sticker|shirt|mug|tote|poster|print|deck|etsy|download|template|sell|selling|buyer|store|merch)\b/i, 3],
  ["list", /\b(list|watch-?list|tracker|track|log|leaderboard|collection|library|catalog|inventory|scores?)\b/i, 2],
  // "book" only counts as a THING, never the verb — "book a walk" and "book an
  // appointment" are actions on a booking site, not a novel.
  [
    "content",
    /\b(story|stories|book(?!\s+(?:a|an|the|my|your|our|his|her|their|it|one|us)\b)|books|song|beat|music|album|video|podcast|newsletter|poem|lyrics|manuscript)\b/i,
    3,
  ],
  ["site", /\b(website|web site|site|landing page|homepage|portfolio|blog|business page)\b/i, 2],
  ["tool", /\b(app|tool|calculator|dashboard|generator|form|planner app|web app|utility)\b/i, 1],
];

export function findShape(text: string): Shape {
  const scores = new Map<Shape, number>();
  for (const [shape, re, weight] of SHAPE_WORDS) {
    const hits = (text.match(new RegExp(re.source, "gi")) || []).length;
    if (hits) scores.set(shape, (scores.get(shape) ?? 0) + hits * weight);
  }
  if (!scores.size) return "unknown";
  return [...scores.entries()].sort((a, b) => b[1] - a[1])[0][0];
}

/** A narrower read inside a shape, e.g. a puzzle game vs a trivia game. */
export function findGenre(text: string): string {
  const genres = ["puzzle", "jigsaw", "trivia", "quiz", "word", "card", "maze", "arcade", "bingo", "memory"];
  const t = text.toLowerCase();
  return genres.find((g) => new RegExp(`\\b${g}\\b`).test(t)) ?? "";
}

/* ── AUDIENCE ──────────────────────────────────────────────────────────── */

/** Words that mean "a human being". Anything else after "for" is a subject. */
const PEOPLE =
  /\b(people|person|player|players|user|users|visitor|visitors|customer|customers|buyer|buyers|reader|readers|kid|kids|child|children|parent|parents|mom|moms|dad|dads|family|families|friend|friends|team|teams|student|students|teacher|teachers|owner|owners|walker|walkers|fan|fans|beginner|beginners|senior|seniors|neighbour|neighbor|neighbors|client|clients|shopper|shoppers|member|members|anyone|everyone|myself|me|us|couples?|men|women|guys|folks|audience|subscribers?|gamers?|adults?|homeowners?|groups?|clubs?|classes|congregation|church|crew|staff|coworkers?|colleagues?|guests?|attendees?|followers?)\b/i;

export function looksLikePeople(text: string): boolean {
  const t = (text ?? "").trim();
  if (!t) return false;
  if (isJustAProduct(t)) return false;
  return PEOPLE.test(t);
}

/**
 * Cut a captured phrase at the point it stops naming people and starts saying
 * something else. Without this, "for my dog-walking business so people in my
 * neighborhood can find me" comes back whole — it contains "people", so it
 * passes the people test, and a BUSINESS gets printed as the audience.
 */
function audienceHead(phrase: string): string {
  return phrase
    .split(/\s+(?:so|that|who|which|where|because|but|then|when)\b/i)[0]
    .replace(/[.,;:!?]+$/, "")
    .trim();
}

/** An audience stated outright: "for busy parents", "aimed at dog owners". */
export function findStatedAudience(text: string): string | null {
  const patterns = [
    /\b(?:it'?s |is |built |made |designed )?(?:for|aimed at|targeted at|meant for)\s+([^.,;!?]{2,60})/gi,
    /\bso (?:that )?([a-z][^.,;!?]{2,60}?)\s+can\b/gi,
  ];
  for (const re of patterns) {
    for (const m of text.matchAll(re)) {
      // Test the head phrase only — a people-word further downstream is not
      // evidence that THIS phrase names the audience.
      const candidate = audienceHead(m[1]);
      if (candidate && looksLikePeople(candidate)) return candidate;
    }
  }
  return null;
}

/* ── ASSETS ────────────────────────────────────────────────────────────── */

const ASSET_NOUNS =
  /(pictures?|images?|photos?|songs?|tracks?|beats?|files?|recipes?|videos?|clips?|articles?|posts?|designs?|logos?|drawings?|scans?|cards?|questions?|words?|items?|products?|entries?)/i;

export type AssetHit = { text: string; count: number | null; noun: string };

/**
 * Things that already exist and version one should use.
 * Kept strictly apart from features the person WANTS built.
 */
export function findAssets(text: string): AssetHit[] {
  const hits: AssetHit[] = [];
  const push = (raw: string) => {
    const cleaned = raw.trim().replace(/^(of|with)\s+/i, "").replace(/[.,;]+$/, "");
    if (!cleaned || cleaned.length < 3) return;
    const countM = cleaned.match(/\b(\d+)\b/);
    const nounM = cleaned.match(ASSET_NOUNS);
    if (hits.some((h) => h.text.toLowerCase() === cleaned.toLowerCase())) return;
    hits.push({
      text: cleaned,
      count: countM ? Number(countM[1]) : null,
      noun: nounM ? nounM[1].toLowerCase() : "",
    });
  };

  const patterns = [
    /\bstart(?:ing)? (?:it )?(?:off )?with\s+([^.!?]{3,120})/gi,
    /\bi (?:already )?have\s+([^.!?]{3,120})/gi,
    /\bi'?ve (?:already )?(?:got|made|written|shot|taken)\s+([^.!?]{3,120})/gi,
    /\buse (?:my|the|our|these|those)\s+([^.!?]{3,120})/gi,
    /\bwe have\s+([^.!?]{3,120})/gi,
    /\b(?:there (?:are|is)|it has)\s+(\d+\s+[^.!?]{3,120})/gi,
  ];
  for (const re of patterns) for (const m of text.matchAll(re)) push(m[1]);

  // A bare count of a real noun: "22 scenery pictures from Colorado"
  if (!hits.length) {
    const bare = text.match(new RegExp(`\\b(\\d{1,4}\\s+[a-z\\- ]{0,30}?${ASSET_NOUNS.source}[^.!?]{0,60})`, "i"));
    if (bare) push(bare[1]);
  }
  return hits;
}

/* ── EXCLUSIONS AND SCOPE ──────────────────────────────────────────────── */

/** "Nothing else" = deliberate narrowness, not an empty answer. */
export function saysNothingElse(text: string): boolean {
  return /\bnothing else\b|\bthat'?s (it|all)\b|\bnothing more\b|\bjust that\b|\bonly that\b|\bkeep it to that\b/i.test(
    text ?? "",
  );
}

export function findStatedExclusions(text: string): string[] {
  const out: string[] = [];
  const keyword = /\b(?:no|without|not?)\s+(accounts?|logins?|sign-?ups?|multiplayer|leaderboards?|backend|server|database|payments?|ads?|subscriptions?|analytics)\b/gi;
  for (const m of text.matchAll(keyword)) out.push(m[1].trim());

  /* "Don't build levels, power-ups, online multiplayer" is THREE exclusions.
     Capture past the commas, then split — stopping at the first comma silently
     kept two of them in scope. */
  const listed = [
    /\bdon'?t (?:build|add|include|worry about)\s+([^.;!?]{2,120})/gi,
    /\b(?:skip|avoid|leave out|forget|hold off on)\s+([^.;!?]{2,120})/gi,
    /\b(?:no need for|not doing|not building)\s+([^.;!?]{2,120})/gi,
    /\b(?:later|not yet|version two|v2):?\s+([^.;!?]{2,120})/gi,
  ];
  for (const re of listed) {
    for (const m of text.matchAll(re)) {
      for (const part of listParts(m[1] ?? "")) {
        const v = part.trim().replace(/^(the|a|an)\s+/i, "");
        if (v && v.length > 1) out.push(v);
      }
    }
  }
  return out;
}

/** Things that already work and must survive the change. */
export function findPreserve(text: string): string[] {
  const out: string[] = [];
  const patterns = [
    /\b(?:don'?t|do not) (?:break|change|touch|mess with|remove)\s+([^.,;!?]{2,70})/gi,
    /\b(?:keep|preserve|leave)\s+([^.,;!?]{2,70}?)\s+(?:working|as is|alone|the same|intact)/gi,
    /\b(?:everything else|the rest)\s+(?:should |must )?(?:stay|stays|remain|remains)\s+([^.,;!?]{2,60})/gi,
    /\bmust not change\b:?\s*([^.,;!?]{2,60})/gi,
  ];
  for (const re of patterns) {
    for (const m of text.matchAll(re)) {
      const v = (m[1] ?? "").trim();
      if (v && v.length > 1) out.push(v);
    }
  }
  return out;
}

export function findConstraints(text: string): string[] {
  const out: string[] = [];
  const patterns = [
    /\b(free tools only|no budget|free only|on a budget|no money)\b/gi,
    /\b(by|before|this)\s+(today|tonight|tomorrow|this week|next week|friday|monday|the weekend|christmas)\b/gi,
    /\b(i'?m a beginner|i can'?t code|i don'?t know how to code|new to this|never built anything)\b/gi,
    /\b(?:it )?(?:has to|must|needs? to) work on (?:a )?(phones?|mobile|tablets?)\b/gi,
  ];
  for (const re of patterns) for (const m of text.matchAll(re)) out.push(m[0].trim());
  return out;
}

/* ── ENUMERATIONS ──────────────────────────────────────────────────────── */

export type Enumeration = { noun: string; parts: string[] };

/** "easy, medium, and hard difficulty" → { noun: "difficulty", parts: [...] } */
export function findEnumerations(text: string): Enumeration[] {
  const out: Enumeration[] = [];
  const re =
    /\b((?:[a-z]+(?:,\s*(?:and\s+|or\s+)?|\s+and\s+|\s+or\s+|\s*\/\s*)){1,5}[a-z]+)\s+(difficulty|difficulties|levels?|modes?|sizes?|options?|categories|tiers?|speeds?)\b/gi;
  for (const m of text.matchAll(re)) {
    const parts = listParts(m[1]).filter((p) => p.length > 1);
    if (parts.length >= 2) out.push({ noun: singular(m[2].toLowerCase()), parts });
  }
  return out;
}

/* ── TITLE ─────────────────────────────────────────────────────────────── */

/** Words too generic to carry a title on their own. */
const GENERIC_HEADS = new Set([
  "game", "app", "application", "website", "site", "page", "tool", "thing",
  "product", "platform", "system", "software", "program", "project", "idea",
]);

const TITLE_NOISE = new Set([
  "a", "an", "the", "my", "our", "some", "new", "little", "simple", "small",
  "cool", "fun", "nice", "basic", "quick", "own", "kind", "sort", "type",
  "where", "that", "which", "who", "with", "for", "of", "and", "or", "to",
  "i", "you", "it", "they", "them", "we", "is", "are", "be", "can", "will",
  "want", "would", "like", "make", "makes", "made", "build", "get", "gets",
  "have", "has", "let", "lets", "then", "so", "but", "into", "from", "on",
  "in", "at", "by", "up", "out", "all", "any", "one", "first", "just",
  "really", "very", "people", "person", "user", "users", "someone", "them",
  "start", "starting", "add", "added", "adding", "put", "now", "commit",
  "push", "deploy", "please", "help", "me", "this", "these", "those",
]);

/** The noun phrase the sentence is about: "a puzzle game where…" → "puzzle game" */
function leadingNounPhrase(text: string): string[] {
  const t = stripFiller(text);
  const first = t.split(/(?<=[.!?])\s+/)[0] ?? t;
  // Cut at the first subordinator/verb boundary — that's where the NP ends.
  const np = first
    .replace(/^(a|an|the|my|our|some)\s+/i, "")
    .split(/\s+(?:where|that|which|who|so|with|to|for|and|when|then|it|they|you|i)\b/i)[0]
    .trim();
  return np
    .split(/\s+/)
    .map((w) => w.replace(/[^A-Za-z0-9-]/g, ""))
    .filter((w) => w && !TITLE_NOISE.has(w.toLowerCase()));
}

/**
 * "a website for my new dog-walking business" — when the noun phrase is only a
 * generic word, whatever follows "for"/"about" is what it's really about.
 */
function subjectAfterGeneric(text: string): string[] {
  const t = stripFiller(text).replace(/^(a|an|the|my|our)\s+/i, "");
  const m = t.match(
    /^(?:website|web site|site|page|app|application|tool|game|thing|product|platform)\s+(?:for|about|that shows)\s+(?:my|our|the|a|an)?\s*([^.,;!?]{2,50})/i,
  );
  if (!m) return [];
  return m[1]
    .split(/\s+(?:so|that|which|where|who|and|to)\b/i)[0]
    .trim()
    .split(/\s+/)
    .map((w) => w.replace(/[^A-Za-z0-9-]/g, ""))
    .filter((w) => w && !TITLE_NOISE.has(w.toLowerCase()))
    .slice(0, 3);
}

/** The most telling other noun in the text, used as a title modifier. */
function salientModifier(text: string, exclude: Set<string>): string {
  const counts = new Map<string, number>();
  for (const raw of text.toLowerCase().split(/[^a-z0-9-]+/)) {
    const w = raw.trim();
    if (!w || w.length < 3) continue;
    if (TITLE_NOISE.has(w) || GENERIC_HEADS.has(w)) continue;
    const s = singular(w);
    if (exclude.has(s)) continue;
    counts.set(s, (counts.get(s) ?? 0) + 1);
  }
  if (!counts.size) return "";
  // Earliest of the most frequent — first mention usually names the subject.
  const max = Math.max(...counts.values());
  const best = [...counts.entries()].filter(([, n]) => n === max).map(([w]) => w);
  const order = (w: string) => text.toLowerCase().indexOf(w.slice(0, 4));
  return best.sort((a, b) => order(a) - order(b))[0] ?? "";
}

/**
 * A short working title. Never the person's whole first sentence.
 * Rule: keep the specific part of the leading noun phrase; if that phrase is
 * only a generic word ("game", "website"), pull in the concrete noun the
 * sentence is really about.
 */
export function buildTitle(text: string, destination: string | null): string {
  const np = leadingNounPhrase(text);
  const specific = np.filter((w) => !GENERIC_HEADS.has(w.toLowerCase()));
  const generic = np.filter((w) => GENERIC_HEADS.has(w.toLowerCase()));

  let head = specific.slice(-2).join(" ");
  if (!head) head = generic.slice(-1).join(" ");

  const used = new Set(np.map((w) => singular(w.toLowerCase())));
  let words = head ? head.split(/\s+/) : [];

  // "A website for my dog-walking business" → the business is the subject.
  if (!specific.length) {
    const subject = subjectAfterGeneric(text);
    if (subject.length) words = [...subject, ...generic.slice(-1)];
  }

  // One specific word is thin ("Puzzle") — name what it acts on ("Picture Puzzle").
  if (words.length === 1 || !words.length) {
    const mod = salientModifier(text, used);
    if (mod) words = [singular(mod), ...words];
  }

  let title = titleCase(words.filter(Boolean).join(" ").trim());
  if (!title) title = destination ? `${destination} Addition` : "Untitled Idea";
  if (destination && !new RegExp(destination.replace(/[^a-z0-9]/gi, ""), "i").test(title.replace(/[^a-z0-9]/gi, ""))) {
    title = `${title} for ${destination}`;
  }
  return title.length > 60 ? title.slice(0, 57).trim() + "…" : title;
}
