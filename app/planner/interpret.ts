// The interpretation engine.
//
// One job: turn what a person actually typed into what they actually meant.
// Everything is deterministic and local — no API, no model, no pretending a
// remote service is reading the input. It is a set of readable rules that we
// can test one fixture at a time, and extend later.

import {
  cleanText, dedupe, isMeaningful, listParts, resolveReference, sentenceCase,
  sentences, singular, stripFiller,
} from "./normalize";
import {
  buildTitle, findAssets, findConstraints, findDestination, findEnumerations,
  findGenre, findPermissions, findPreserve, findShape, findStatedAudience,
  findStatedExclusions, isJustAProduct, looksLikePeople, saysNothingElse,
  stripDestinationPhrases, stripPermissionPhrases, type AssetHit,
} from "./signals";
import {
  inferred, NO_PERMISSIONS, stated, type BuildType, type Claim,
  type Interpretation, type OpenQuestion, type Permissions, type Shape,
} from "./types";

export type PlannerInput = {
  /** The one open description. Always the source of truth. */
  description: string;
  /** Answers to follow-up questions, keyed by question key. */
  answers?: Record<string, string>;
};

const lower = (s: string) => (s ? s.charAt(0).toLowerCase() + s.slice(1) : s);

/* ── BUILD TYPE ────────────────────────────────────────────────────────── */

const FIX_WORDS =
  /\b(broken|broke|breaks|bug|buggy|doesn'?t work|does not work|not working|stopped working|fails|failing|error|crash|glitch|busted|won'?t (open|load|save|close)|fix)\b/i;
const IMPROVE_WORDS =
  /\b(improve|improvement|better|nicer|cleaner|upgrade|redo|revamp|polish|refresh|clean up|tidy|speed (it )?up|easier to use)\b/i;
const ADD_WORDS = /\b(add|adding|new (feature|page|mode|section|game|tab)|another|extend|plug in)\b/i;
const SELL_WORDS = /\b(sell|selling|sale|etsy|shop|store|buyer|customers? (would |will )?pay|price|monetize|make money|listing)\b/i;
const EXPLORE_WORDS =
  /\b(not sure|unsure|maybe|kind of|sort of|thinking about|toying with|rough idea|just an idea|somehow|or something|no idea|dunno)\b/i;

/**
 * `statedCount` counts only behaviours the person actually described. Pattern
 * behaviours we filled in ourselves must never make a vague idea look defined.
 */
function classifyBuildType(
  text: string,
  hasDestination: boolean,
  shape: Shape,
  statedCount: number,
): Claim<BuildType> {
  if (FIX_WORDS.test(text)) return stated("fix", "you described something that's broken");
  if (SELL_WORDS.test(text) || shape === "product") {
    return stated("sell", "you're describing something people would buy");
  }
  if (hasDestination && ADD_WORDS.test(text)) {
    return stated("add", "you named an existing product to add this to");
  }
  if (hasDestination && IMPROVE_WORDS.test(text)) {
    return stated("improve", "you want an existing product to work better");
  }
  if (hasDestination) return inferred("add", "you named an existing product, so this lands inside it");
  if (IMPROVE_WORDS.test(text)) return stated("improve", "you want something existing to work better");

  const wordCount = text.split(/\s+/).filter(Boolean).length;
  if (EXPLORE_WORDS.test(text) && statedCount === 0) {
    return stated("explore", "it's still an early thought");
  }
  if (shape === "unknown" && statedCount === 0 && wordCount < 10) {
    return inferred("explore", "there isn't enough here yet to call it a build");
  }
  return inferred("new", "nothing existing was mentioned, so this starts fresh");
}

/* ── VERSION ONE ───────────────────────────────────────────────────────── */

/** The count phrase people will recognise: "22 scenery pictures". */
function assetPhrase(a: AssetHit): string {
  if (!a.count || !a.noun) return a.text;
  const re = new RegExp(`\\b${a.count}\\s+[a-z\\- ]{0,24}?${a.noun}`, "i");
  const m = a.text.match(re);
  return (m ? m[0] : `${a.count} ${a.noun}`).trim();
}

/** Things a product can actually do — the verbs worth building around. */
const ACTION_VERB =
  /\b(tap|taps|click|clicks|drag|drags|pick|picks|choose|chooses|select|selects|add|adds|remove|removes|delete|deletes|save|saves|show|shows|display|displays|reset|resets|sort|sorts|shuffle|shuffles|play|plays|type|types|enter|enters|search|searches|filter|filters|log|logs|track|tracks|mark|marks|share|shares|send|sends|print|prints|export|exports|download|downloads|swipe|swipes|scroll|scrolls|count|counts|calculate|calculates|split|splits|rearrange|rearranges|generate|generates|spin|spins|vote|votes|rank|ranks|score|scores|book|books|find|finds|open|opens|jump|jumps|win|wins|match|matches|solve|solves|flip|flips|draw|draws|roll|rolls|upload|uploads)\b/i;

const CLAUSE_SUBJECT =
  /^(?:and\s+|then\s+|so\s+)?(?:they|you|it|we|i|users?|people|players?|kids?|your\s+\w+|my\s+\w+|the\s+(?:user|kid|player|person)s?|each\s+\w+|every\s+\w+|anyone|someone)\s+(?:can|could|should|will|must|may)?\s*/i;

/**
 * Sentences that describe what's WRONG today, or what winning looks like, are
 * not things to build. "Right now, every game we play was made by someone
 * else" is a reason, not a feature.
 */
const NEED_SENTENCE =
  /^(right now|today|currently|the problem is|nobody|no one|there'?s no|because|every \w+ we)\b/i;
const RESULT_SENTENCE = /^(it works when|success is|the win is|i'?ll know it works|the goal is)\b/i;

/** Behaviours the person spelled out themselves. */
function statedBehaviours(text: string): string[] {
  const out: string[] = [];
  for (const s of sentences(text)) {
    if (NEED_SENTENCE.test(s.trim()) || RESULT_SENTENCE.test(s.trim())) continue;
    const m = s.match(
      /\b(?:it|they|you|users?|people|players?|the app|the site|the game)\s+(?:should|can|could|will|must|needs? to)\s+([^.!?]{3,90})/i,
    );
    if (m) out.push(sentenceCase(m[1].trim()));
    const m2 = s.match(/\b(?:lets?|allows?|helps?)\s+(?:you|them|people|users?)\s+(?:to\s+)?([^.!?]{3,90})/i);
    if (m2) out.push(sentenceCase(m2[1].trim()));

    // Plain description of what happens: "they tap a chore to mark it done",
    // "the chart resets every Sunday night".
    for (const clause of s.split(/,\s*(?:and\s+|then\s+)?|\s+and then\s+|\s+and\s+/i)) {
      const c = clause.trim().replace(/[.!?]+$/, "");
      if (c.length < 6 || c.length > 90) continue;
      if (!ACTION_VERB.test(c)) continue;
      const stripped = c.replace(CLAUSE_SUBJECT, "").trim();
      if (stripped.length < 4) continue;
      // "I want to solve…" is intent, not a behaviour — desire verbs never
      // become features, even when an action verb follows them.
      if (/^(want|wants|wanting|need|needs|hope|hoping|try|trying|would like|wish)\b/i.test(stripped)) continue;
      out.push(sentenceCase(stripped));
    }
  }
  return out;
}

/**
 * The core mechanic, phrased properly but drawn from the person's OWN words.
 * "rearranged into puzzle pieces" is something they said — it belongs in the
 * plan as theirs, not as our guess.
 */
function mechanicBehaviour(shape: Shape, subject: string, text: string): string | null {
  const thing = subject || "picture";
  // Only clear jigsaw language earns the jigsaw mechanic. A bare "slide" or
  // "pieces" is not enough — "pancakes slide off the plate" is a physics
  // game, and inventing a rearrange mechanic for it puts words in the
  // creator's mouth.
  if (shape === "game" && /\b(rearrang\w*|shuffl\w*|jigsaw|puzzle pieces?|scrambl\w*|slid\w* (puzzle|tiles?))\b/i.test(text)) {
    return `Rearrange the shuffled pieces back into the original ${thing}`;
  }
  return null;
}

/** Shape patterns: what "done" means for this kind of thing, first time out. */
function patternBehaviours(shape: Shape, subject: string): string[] {
  const thing = subject || "item";
  switch (shape) {
    case "game":
      return ["Know the moment it's solved — the game says so, clearly", `Play again, or pick a different ${thing}`];
    case "site":
      return [
        "One page that says what this is, who it's for, and how to get in touch",
        "Reads and taps cleanly on a phone",
      ];
    case "product":
      return [
        "One finished file a buyer can download and actually use",
        "Exports print-ready at a standard size",
      ];
    case "list":
      return [`Add a ${thing} to the list`, "See the whole list at a glance", "Remove or change an entry"];
    case "tool":
      return ["Do the one useful thing and show the result", "Works on a phone without instructions"];
    case "content":
      return ["One finished piece, start to end", "Export it in a format you can share"];
    default:
      return [];
  }
}

/**
 * When someone answers "what should it do the first time someone uses it?",
 * the whole answer is version one. It doesn't have to be a grammatical clause
 * — "one player, falling tacos, a score counter" is a perfectly good answer,
 * and demanding a verb throws most of it away.
 */
function behavioursFromAnswer(answer: string): string[] {
  const out: string[] = [];
  for (const s of sentences(answer)) {
    /* "A square that moves left and right" is ONE feature. Splitting every
       "and" turns it into "a square that moves left" + "right", so a fragment
       too short to stand alone gets folded back where it came from. */
    const parts: string[] = [];
    for (const part of listParts(s)) {
      const p = part.trim();
      if (!p) continue;
      if (parts.length && p.length < 8) parts[parts.length - 1] += ` and ${p}`;
      else parts.push(p);
    }
    for (const part of parts) {
      const cleaned = sentenceCase(part.replace(CLAUSE_SUBJECT, "").trim());
      if (cleaned.length >= 3 && isMeaningful(cleaned)) out.push(cleaned);
    }
  }
  return out;
}

/** Drop "a score" when "a score counter" is already on the list. */
function dropContained(items: Claim<string>[]): Claim<string>[] {
  return items.filter((a, i) =>
    !items.some((b, j) => {
      if (i === j) return false;
      const x = a.value.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();
      const y = b.value.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();
      return y.length > x.length && (y.startsWith(x + " ") || y.endsWith(" " + x));
    }),
  );
}

function deriveVersionOne(
  productText: string,
  behaviourText: string,
  shape: Shape,
  genre: string,
  assets: AssetHit[],
  versionOneAnswer?: string,
): Claim<string>[] {
  const out: Claim<string>[] = [];
  const counted = assets.find((a) => a.count);
  const subject = counted?.noun ? singular(counted.noun) : "";

  if (versionOneAnswer) {
    for (const b of behavioursFromAnswer(versionOneAnswer)) {
      out.push(stated(b, "you said this is what version one does"));
    }
  }

  if (counted) {
    out.push(stated(`Choose one of the ${assetPhrase(counted)}`, "you said what it starts with"));
  }
  for (const e of findEnumerations(productText)) {
    const last = e.parts[e.parts.length - 1];
    const rest = e.parts.slice(0, -1).join(", ");
    out.push(stated(`Choose a ${e.noun}: ${rest} or ${last}`, "you listed the options"));
  }
  for (const b of statedBehaviours(behaviourText)) out.push(stated(b, "you said it should do this"));

  const mechanic = mechanicBehaviour(shape, subject, productText);
  if (mechanic) out.push(stated(mechanic, "it's the thing you described"));

  for (const p of patternBehaviours(shape, subject)) {
    out.push(inferred(p, `every ${genre || shape} needs this to feel finished`));
  }

  const seen = new Set<string>();
  const unique = out.filter((c) => {
    const key = c.value.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return dropContained(unique).slice(0, 7);
}

/* ── EXCLUSIONS ────────────────────────────────────────────────────────── */

const DEFAULT_EXCLUSIONS: Record<Shape, [string, RegExp][]> = {
  game: [
    ["Accounts or logins", /\b(account|login|sign ?up|sign ?in)/i],
    ["Multiplayer", /\bmultiplayer|versus|online play\b/i],
    ["Leaderboards", /\bleaderboard|high scores? table|rankings\b/i],
    ["A backend or database", /\b(backend|server|database|api)\b/i],
  ],
  site: [
    ["Accounts or logins", /\b(account|login|sign ?up)/i],
    ["A blog or CMS", /\b(blog|cms|content management)\b/i],
    ["Online payments", /\b(payment|checkout|stripe|cart)\b/i],
  ],
  product: [
    ["Your own storefront", /\b(storefront|own (shop|store)|website to sell)\b/i],
    ["Inventory or shipping automation", /\b(inventory|shipping|fulfil?lment)\b/i],
  ],
  list: [
    ["Accounts or logins", /\b(account|login|sign ?up)/i],
    ["Sharing between people", /\b(share|sharing|collaborat)/i],
    ["A backend or database", /\b(backend|server|database)\b/i],
  ],
  tool: [
    ["Accounts or logins", /\b(account|login|sign ?up)/i],
    ["A backend or database", /\b(backend|server|database)\b/i],
    ["Payments", /\b(payment|checkout|stripe)\b/i],
  ],
  content: [["A storefront", /\b(store|shop|sell)\b/i]],
  unknown: [],
};

/**
 * A thing we agreed not to build must not also appear as a feature. When the
 * person asked for both, the exclusion wins and we say so out loud rather than
 * quietly dropping half of what they asked for.
 */
const EXCLUSION_MATCH: [RegExp, RegExp][] = [
  [/upload/i, /\bupload/i],
  [/account|login/i, /\b(accounts?|log ?in|logs? in|sign ?up|sign ?in)\b/i],
  [/multiplayer/i, /\b(multiplayer|versus|against (a )?friend)\b/i],
  [/leaderboard/i, /\bleaderboards?\b/i],
  [/backend|database/i, /\b(backend|database|server|sync\w*)\b/i],
  [/payment/i, /\b(payment|checkout|pay)\b/i],
];

function splitByExclusions(
  behaviours: Claim<string>[],
  exclusions: Claim<string>[],
): { kept: Claim<string>[]; dropped: { behaviour: string; exclusion: string }[] } {
  const kept: Claim<string>[] = [];
  const dropped: { behaviour: string; exclusion: string }[] = [];
  for (const b of behaviours) {
    const hit = exclusions.find((x) => {
      const pair = EXCLUSION_MATCH.find(([onExclusion]) => onExclusion.test(x.value));
      return pair ? pair[1].test(b.value) : false;
    });
    if (hit) dropped.push({ behaviour: b.value, exclusion: hit.value });
    else kept.push(b);
  }
  return { kept, dropped };
}

/* ── AUDIENCE ──────────────────────────────────────────────────────────── */

function deriveAudience(
  productText: string,
  shape: Shape,
  genre: string,
  destination: string | null,
  answer: string | undefined,
): Claim<string> | null {
  // An explicit answer wins — unless they typed a product name in the box.
  if (answer && isMeaningful(answer)) {
    if (isJustAProduct(answer)) {
      // "opendoku.com" is a place, not a person. Fall through to inference.
    } else if (looksLikePeople(answer) || answer.split(/\s+/).length > 2) {
      return stated(sentenceCase(answer), "you told us who it's for");
    }
  }
  const said = findStatedAudience(productText);
  if (said) return stated(sentenceCase(said), "you said who it's for");

  const visitors = destination ? `existing ${destination} visitors` : "";
  if (shape === "game") {
    const base = `Casual ${genre ? genre + " " : ""}players`;
    return inferred(visitors ? `${base} and ${visitors}` : base, "it's a game, so the audience is whoever plays it");
  }
  if (shape === "site" && /\b(business|shop|service|company|clients?)\b/i.test(productText)) {
    return inferred("The customers this business wants to reach", "a business site is aimed at its customers");
  }
  if (visitors) return inferred(sentenceCase(visitors), `it lands on ${destination}, so its people see it first`);
  if (shape === "list" || shape === "tool") {
    return inferred("You first — anyone you share it with later", "a personal tool starts with one user: you");
  }
  return null;
}

/* ── THE ENGINE ────────────────────────────────────────────────────────── */

export function interpret(input: PlannerInput): Interpretation {
  const rawAnswers = input.answers ?? {};
  const rawDescription = cleanText(input.description ?? "");

  // Back-references resolve against the description they point at, BEFORE any
  // other rule reads them. "same" must never reach the plan as an answer.
  const answers: Record<string, string> = {};
  for (const [k, v] of Object.entries(rawAnswers)) {
    const resolved = resolveReference(cleanText(v), [rawDescription]);
    if (isMeaningful(resolved)) answers[k] = resolved;
  }

  // Terminate each part before joining. Without this, "I want to build an app"
  // + "You type in a chore" becomes one run-on sentence and every clause rule
  // downstream reads it as a single garbled behaviour.
  const fullText = [rawDescription, ...Object.values(answers)]
    .filter((s) => s.trim())
    .map((s) => (/[.!?]$/.test(s.trim()) ? s.trim() : `${s.trim()}.`))
    .join(" ")
    .trim();

  // Builder instructions are permissions — never product description.
  const permissions = findPermissions(fullText);
  const productText = stripPermissionPhrases(fullText);

  const destinationHit = findDestination(productText);
  const destination = destinationHit?.name ?? null;

  // "Add it to OpenDoku" says where it goes. It is not a thing the product does.
  const behaviourText = stripDestinationPhrases(productText);

  const shape = findShape(productText);
  const genre = findGenre(productText);
  const assets = findAssets(productText);

  const versionOne = deriveVersionOne(productText, behaviourText, shape, genre, assets, answers.versionOne);
  const statedCount = versionOne.filter((c) => c.confidence === "stated").length;
  const buildType = classifyBuildType(productText, !!destination, shape, statedCount);

  const title = buildTitle(productText, buildType.value === "add" ? destination : null);
  const audience = deriveAudience(productText, shape, genre, destination, answers.audience);

  const assumptions: string[] = [];
  const exclusions: Claim<string>[] = [];
  /** Exclusions we've already written a full explanation for. */
  const explained = new Set<string>();

  for (const e of dedupe(findStatedExclusions(productText))) {
    exclusions.push(stated(sentenceCase(e), "you said to leave it out"));
  }

  /* Contradiction: "people upload pictures" vs "start with 22 pictures I have".
     One is a whole storage-and-moderation product; the other is a folder of
     approved files. For version one the approved files win — and we say so. */
  const uploadTalk = /\b(upload|uploads|uploading|user[- ]submitted|their own (pictures?|images?|photos?))\b/i.test(
    productText,
  );
  const curated = assets.find((a) => a.count && /(picture|image|photo|file)/.test(a.noun));
  if (uploadTalk && curated) {
    exclusions.push(
      inferred("Public uploads from visitors", "version one ships the pictures you already have"),
    );
    explained.add("Public uploads from visitors");
    assumptions.push(
      `You said "upload pictures" and also "start with ${assetPhrase(curated)}". Version one uses the ${curated.count} you already have — letting the public upload their own means storage, moderation and abuse handling, and that's a separate build.`,
    );
  } else if (uploadTalk) {
    exclusions.push(inferred("Public uploads from visitors", "uploads need storage and moderation — a later build"));
  }

  const mentioned = (re: RegExp) => re.test(productText);
  for (const [label, re] of DEFAULT_EXCLUSIONS[shape]) {
    if (mentioned(re)) continue; // they raised it themselves — don't decide for them
    if (exclusions.some((x) => x.value.toLowerCase() === label.toLowerCase())) continue;
    exclusions.push(inferred(label, "keeps version one small enough to finish"));
  }

  if (saysNothingElse(productText)) {
    assumptions.push("You said nothing else — so the scope above is the whole job, on purpose.");
  }

  // Resolve "no accounts" + "users log in" style contradictions in the open.
  const { kept: keptVersionOne, dropped } = splitByExclusions(versionOne, exclusions);
  for (const d of dropped) {
    // Don't say the same thing twice — the upload call above already explained itself.
    if (explained.has(d.exclusion)) continue;
    assumptions.push(
      `You asked for "${lower(d.behaviour)}" but also said no ${lower(d.exclusion)}. Version one follows the limit you set and leaves it out — say the word if you'd rather have it.`,
    );
  }

  /* Permission on an existing product carries to landing the work there.
     Standalone ideas have no repo to commit to, so we grant nothing extra. */
  let finalPermissions: Permissions = { ...permissions };
  if (permissions.build && destination && (buildType.value === "add" || buildType.value === "improve" || buildType.value === "fix")) {
    if (!permissions.commit || !permissions.push) {
      finalPermissions = { ...finalPermissions, commit: true, push: true, deploy: true };
      assumptions.push(
        `"Build it now" on ${destination} means the work has to land there — so the builder commits and pushes, which deploys ${destination}.`,
      );
    } else {
      finalPermissions.deploy = true;
    }
  }
  if (!permissions.build && !permissions.commit && !permissions.push) {
    finalPermissions = { ...NO_PERMISSIONS };
  }

  const preserve = dedupe(findPreserve(productText)).map(sentenceCase);
  if (destination && (buildType.value === "add" || buildType.value === "improve" || buildType.value === "fix") && !preserve.length) {
    preserve.push(`Everything ${destination} already does — this is an addition, not a rewrite`);
  }

  const constraints = dedupe(findConstraints(productText)).map(sentenceCase);

  const need = deriveNeed(productText, shape, buildType.value);
  const desiredResult = deriveResult(productText, shape, genre, assets, destination);

  const openQuestions = deriveQuestions({
    shape, versionOne: keptVersionOne, audience, buildType: buildType.value, answers, productText,
  });

  const summary = buildSummary({
    title, shape, genre, destination, buildType: buildType.value, versionOne: keptVersionOne, productText,
  });

  return {
    raw: input.description ?? "",
    buildType,
    title: stated(title, "shortened from your description"),
    summary,
    shape,
    destination: destinationHit ? stated(destination as string, "you named it") : null,
    audience,
    need,
    desiredResult,
    versionOne: keptVersionOne,
    assets: assets.map((a) => stated(sentenceCase(a.text), "you already have this")),
    constraints,
    preserve,
    exclusions: exclusions.slice(0, 6),
    permissions: finalPermissions,
    completionAction: deriveCompletionAction(buildType.value, destination, finalPermissions, shape),
    assumptions: dedupe([
      ...assumptions,
      ...(buildType.confidence !== "stated" ? [`Read as "${BUILD_TYPE_TEXT[buildType.value]}" — ${buildType.source}.`] : []),
      ...(audience && audience.confidence !== "stated" ? [`Audience read as ${lower(audience.value)} — ${audience.source}.`] : []),
    ]),
    openQuestions,
  };
}

const BUILD_TYPE_TEXT: Record<BuildType, string> = {
  new: "start something new",
  add: "add to an existing product",
  improve: "improve an existing product",
  fix: "fix a problem",
  sell: "package something to sell",
  explore: "explore an early idea",
};

/* ── SUPPORTING DERIVATIONS ────────────────────────────────────────────── */

function deriveNeed(text: string, shape: Shape, buildType: BuildType): Claim<string> | null {
  for (const s of sentences(text)) {
    const m = s.match(/\b(?:because|since|the problem is|right now|today|currently|nobody|no one|there'?s no|hard to|can'?t)\b([^.!?]{4,110})/i);
    if (m) return stated(sentenceCase(m[0].trim()), "you said what's wrong today");
  }
  // Only worth guessing for something that doesn't exist yet. Telling someone
  // adding to a live product that "there's nothing to play yet" is nonsense.
  if (buildType !== "new") return null;
  if (shape === "game") return inferred("There's nothing here to play yet", "a new game exists to be played");
  if (shape === "site") return inferred("There's no page to send people to yet", "that's what a site is for");
  return null;
}

function deriveResult(
  text: string,
  shape: Shape,
  genre: string,
  assets: AssetHit[],
  destination: string | null,
): Claim<string> | null {
  const works = text.match(/\bit works when\s+([^.!?]{6,120})/i);
  if (works) return stated(sentenceCase(works[1].trim()), "you said what better looks like");

  const m = text.match(/\b(?:so (?:that )?|then )([a-z][^.!?]{6,110})/i);
  if (m && !/\b(commit|push|deploy|build it now)\b/i.test(m[1])) {
    return stated(sentenceCase(m[1].trim()), "you said what better looks like");
  }
  if (shape === "game") {
    const where = destination ? ` on ${destination}` : "";
    return inferred(
      `Someone opens it${where}, finishes one ${genre || "round"}, and starts another without being asked`,
      "that's what a finished game looks like the first time it works",
    );
  }
  if (shape === "site") {
    return inferred("A real visitor lands on it and knows what to do next", "that's the first win for any site");
  }
  return null;
}

function deriveCompletionAction(
  buildType: BuildType,
  destination: string | null,
  permissions: Permissions,
  shape: Shape,
): string {
  if (destination && permissions.push) {
    return `Inspect the ${destination} repository, build the feature there, test it, then commit and push.`;
  }
  if (destination) {
    return `Inspect the ${destination} repository first, then build the feature there and show it working before anything is pushed.`;
  }
  if (permissions.build) return "Build version one, run it, and show it working.";
  if (buildType === "explore") return "Take the plan to the Idea Engine and pick one version to try.";
  if (shape === "product") return "Make one finished file and put it in front of one real buyer.";
  return "Copy the builder prompt into the tool you trust and build version one.";
}

const SHAPE_NOUN: Record<Shape, string> = {
  game: "game",
  site: "site",
  tool: "tool",
  list: "list",
  product: "product",
  content: "piece",
  unknown: "idea",
};

function buildSummary(a: {
  title: string;
  shape: Shape;
  genre: string;
  destination: string | null;
  buildType: BuildType;
  versionOne: Claim<string>[];
  productText: string;
}): string {
  const kind = a.genre ? `${a.genre} ${SHAPE_NOUN[a.shape]}` : SHAPE_NOUN[a.shape];
  const where =
    a.destination && a.buildType === "add"
      ? ` for ${a.destination}`
      : a.destination
        ? ` on ${a.destination}`
        : "";
  // "What I understood" must be what THEY said. Our pattern guesses are
  // labelled on the plan itself; parroting them back as understanding would
  // put words in their mouth.
  //
  // "Choose a difficulty: easy, medium or hard" also reads badly mid-sentence —
  // the summary wants the headline, the plan carries the detail.
  const doing = a.versionOne
    .filter((c) => c.confidence === "stated")
    .slice(0, 3)
    .map((c) => lower(c.value.split(/[:—]/)[0].trim()))
    .join(", ");
  const article = /^[aeiou]/i.test(kind) ? "An" : "A";
  if (!doing) {
    const first = sentences(stripFiller(a.productText))[0] ?? "";
    return first ? sentenceCase(first) : `${article} ${kind}${where}.`;
  }
  const verb = a.buildType === "add" ? "A new" : a.buildType === "fix" ? "A fix for the" : article;
  return `${verb} ${kind}${where}: ${doing}.`;
}

function deriveQuestions(a: {
  shape: Shape;
  versionOne: Claim<string>[];
  audience: Claim<string> | null;
  buildType: BuildType;
  answers: Record<string, string>;
  productText: string;
}): OpenQuestion[] {
  const answered = (k: string) => isMeaningful(a.answers[k] ?? "");
  const realBehaviours = a.versionOne.filter((c) => c.confidence === "stated").length;

  // Nothing concrete to build yet — this is the only thing worth asking.
  if (!answered("versionOne") && realBehaviours === 0) {
    return [
      {
        key: "versionOne",
        question: "What should it do the very first time someone uses it?",
        help: "One or two things is plenty. That's version one — the rest can wait.",
        placeholder: 'e.g. "They pick a photo, it breaks into pieces, they drag them back together"',
      },
    ];
  }
  // A buyer changes what you make. Worth one question.
  if (a.buildType === "sell" && !a.audience && !answered("audience")) {
    return [
      {
        key: "audience",
        question: "Who would actually pay for this?",
        help: "One specific kind of buyer. It changes what you make and how you price it.",
        placeholder: 'e.g. "Homeschool moms who plan their week on paper"',
      },
    ];
  }
  if (!a.audience && !answered("audience")) {
    return [
      {
        key: "audience",
        question: "Who is it for?",
        help: "One real person or group. It decides what version one has to get right.",
        placeholder: 'e.g. "My family" or "People who just moved to town"',
      },
    ];
  }
  return [];
}

export { BUILD_TYPE_TEXT };
